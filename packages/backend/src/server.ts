import express from 'express';
import { spawn } from 'child_process';
import { once } from 'events';
import { PostHog } from 'posthog-node'
import dotenv from 'dotenv';
import { createClient } from 'redis';

dotenv.config();

const client = new PostHog(
    process.env.POSTHOG_API_KEY!,
    {
        host: 'https://us.i.posthog.com'
    }
)

const app = express();

// Middleware
app.use(express.json());

// Redis client setup
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

// Connect to Redis
(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
    }
})();

const CACHE_TTL = 5 * 60; // 5 minutes in seconds
const MAX_CACHE_ENTRIES = 1000; // Maximum number of cached songs

// Helper to get song info using yt-dlp
async function getSongInfo(query: string) {
    // Check Redis cache first
    const cacheKey = `song:${query.toLowerCase().trim()}`;
    
    try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            console.log('Redis cache hit for:', query);
            return JSON.parse(cached);
        }
    } catch (err) {
        console.error('Redis cache error:', err);
    }

    // Monitor cache size and clean if needed
    try {
        const cacheSize = await redisClient.dbSize();
        if (cacheSize > MAX_CACHE_ENTRIES) {
            console.log(`Cache size (${cacheSize}) exceeds limit (${MAX_CACHE_ENTRIES}), Redis will auto-evict`);
        }
    } catch (err) {
        console.error('Failed to check cache size:', err);
    }

    return new Promise((resolve, reject) => {
        const ytdlp = spawn('yt-dlp', [
            '-j', '--no-playlist', '--skip-download', '--no-warnings', '--no-check-certificates', '--max-downloads', '1', '--playlist-items', '1', '--extractor-args', 'youtube:player_client=android', `ytsearch1:${query}`
        ]);
        let json = '';
        // console.time('getSongInfo'); // Removed to avoid duplicate label warning
        ytdlp.stdout.on('data', (data) => {
            json += data.toString();
        });
        ytdlp.on('close', async () => {
            // console.timeEnd('getSongInfo'); // Removed to avoid no such label warning
            try {
                const info = JSON.parse(json);
                const result = {
                    title: info.title,
                    duration: info.duration,
                    artist: info.artist || info.uploader || '',
                };
                
                // Cache the result in Redis
                try {
                    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));
                    console.log('Cached in Redis:', query);
                } catch (err) {
                    console.error('Failed to cache in Redis:', err);
                }
                
                resolve(result);
            } catch (e) {
                console.error('Error parsing yt-dlp JSON for getSongInfo:', json, e);
                reject(e);
            }
        });
        ytdlp.on('error', reject);
    });
}

// Add URL caching for video streams
const STREAM_CACHE_TTL = 10 * 60; // 10 minutes for stream URLs

// Helper to get video URL using yt-dlp
async function getVideoUrl(query: string) {
    const cacheKey = `stream:${query.toLowerCase().trim()}`;
    
    try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            console.log('Stream cache hit for:', query);
            return cached;
        }
    } catch (err) {
        console.error('Stream cache error:', err);
    }

    return new Promise((resolve, reject) => {
        const ytdlp = spawn('yt-dlp', [
            '--get-url',
            '--format', 'bestaudio[ext=m4a]/bestaudio/best[height<=720]',
            '--no-playlist',
            '--no-warnings',
            '--no-check-certificates',
            '--max-downloads', '1',
            '--playlist-items', '1',
            '--extractor-args', 'youtube:player_client=android',
            `ytsearch1:${query}`
        ]);
        
        let videoUrl = '';
        // console.time('getVideoUrl'); // Removed to avoid duplicate label warning
        
        ytdlp.stdout.on('data', (data) => {
            videoUrl += data.toString();
        });
        
        ytdlp.on('close', async () => {
            // console.timeEnd('getVideoUrl'); // Removed to avoid no such label warning
            const url = videoUrl.trim();
            
            // Cache the URL
            try {
                await redisClient.setEx(cacheKey, STREAM_CACHE_TTL, url);
                console.log('Cached stream URL for:', query);
            } catch (err) {
                console.error('Failed to cache stream URL:', err);
            }
            
            resolve(url);
        });
        
        ytdlp.on('error', (err) => {
            console.error('Error fetching video URL:', videoUrl, err);
            reject(err);
        });
    });
}

app.get('/metadata', async (req, res) => {
    const query = req.query.q as string;
    client.capture({
        distinctId: '123',
        event: 'metadata_requested',
        properties: {
            query: query
        }
    });
    if (!query) return res.status(400).json({ error: 'Missing query' });
    try {
        const info = await getSongInfo(query);
        res.json(info);
    } catch (e) {
        console.error('Error fetching metadata:', e);
        res.status(500).json({ error: 'Failed to fetch metadata' });
    }
});

// Cache monitoring endpoint
app.get('/cache/status', async (req, res) => {
    try {
        const dbSize = await redisClient.dbSize();
        const memoryUsage = await redisClient.memoryUsage('total');
        
        // Get cache statistics
        const songCacheKeys = await redisClient.keys('song:*');
        const streamCacheKeys = await redisClient.keys('stream:*');
        
        res.json({
            status: 'connected',
            dbSize,
            memoryUsage: {
                used: memoryUsage ? `${Math.round(memoryUsage / 1024 / 1024 * 100) / 100} MB` : 'Unknown',
                bytes: memoryUsage || 0
            },
            cacheStats: {
                songCache: songCacheKeys.length,
                streamCache: streamCacheKeys.length,
                totalCached: songCacheKeys.length + streamCacheKeys.length
            },
            maxEntries: MAX_CACHE_ENTRIES,
            cacheTTL: `${CACHE_TTL} seconds`,
            streamCacheTTL: `${STREAM_CACHE_TTL} seconds`
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to get cache status',
            error: err instanceof Error ? err.message : 'Unknown error'
        });
    }
});

// Pre-warm cache endpoint for popular songs
app.post('/cache/prewarm', async (req, res) => {
    const { queries } = req.body;
    
    if (!Array.isArray(queries)) {
        return res.status(400).json({ error: 'queries must be an array' });
    }
    
    try {
        const results = await Promise.allSettled(
            queries.map(async (query: string) => {
                const [metadata, streamUrl] = await Promise.all([
                    getSongInfo(query),
                    getVideoUrl(query)
                ]);
                return { query, success: true, metadata, hasStreamUrl: !!streamUrl };
            })
        );
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        res.json({
            message: `Pre-warmed ${successful} queries, ${failed} failed`,
            results: results.map((r, i) => ({
                query: queries[i],
                success: r.status === 'fulfilled',
                error: r.status === 'rejected' ? (r as PromiseRejectedResult).reason?.message : undefined
            }))
        });
    } catch (err) {
        res.status(500).json({
            message: 'Failed to pre-warm cache',
            error: err instanceof Error ? err.message : 'Unknown error'
        });
    }
});

// Clear cache endpoint (for maintenance)
app.delete('/cache/clear', async (req, res) => {
    try {
        await redisClient.flushDb();
        res.json({ message: 'Cache cleared successfully' });
    } catch (err) {
        res.status(500).json({
            message: 'Failed to clear cache',
            error: err instanceof Error ? err.message : 'Unknown error'
        });
    }
});

app.get('/stream', async (req, res) => {
    const query = req.query.q as string;
    client.capture({
        distinctId: '123',
        event: 'stream_requested',
        properties: {
            query: query
        }
    });

    // Start both metadata and URL fetching in parallel
    const [info, videoUrl] = await Promise.all([
        getSongInfo(query).catch(e => {
            console.error('Error fetching song info for stream:', e);
            return {};
        }),
        getVideoUrl(query).catch(e => {
            console.error('Error fetching video URL:', e);
            throw e;
        })
    ]);

    // Set headers immediately
    if (info.title) res.set('X-Song-Title', info.title);
    if (info.duration) res.set('X-Song-Duration', info.duration.toString());
    if (info.artist) res.set('X-Song-Artist', info.artist);

    // Use WAV format for reliable streaming
    const ffmpeg = spawn('ffmpeg', [
        '-i', videoUrl as string,
        '-f', 'wav',
        '-acodec', 'pcm_s16le',
        '-ar', '44100',
        '-ac', '2',
        '-probesize', '10M',
        '-analyzeduration', '10M',
        '-max_muxing_queue_size', '1024',
        '-'
    ]);

    res.set({
        'Content-Type': 'audio/wav',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    ffmpeg.stdout.pipe(res);

    ffmpeg.on('error', (err: Error) => {
        console.error('ffmpeg error:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Streaming failed' });
        } else {
            res.end();
        }
    });

    res.on('close', () => {
        ffmpeg.kill('SIGINT');
    });
});

const server = app.listen(3000, () => {
    console.log('Music server ready on http://localhost:3000');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await redisClient.quit();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await redisClient.quit();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
}); 