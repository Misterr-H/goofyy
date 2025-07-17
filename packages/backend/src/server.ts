import express from 'express';
import { spawn } from 'child_process';
import { once } from 'events';

const app = express();

// Helper to get song info using yt-dlp
async function getSongInfo(query: string) {
    return new Promise((resolve, reject) => {
        const ytdlp = spawn('yt-dlp', [
            '-j', '--no-playlist', '--skip-download', `ytsearch1:${query}`
        ]);
        let json = '';
        ytdlp.stdout.on('data', (data) => {
            json += data.toString();
        });
        ytdlp.on('close', () => {
            try {
                const info = JSON.parse(json);
                resolve({
                    title: info.title,
                    duration: info.duration,
                    artist: info.artist || info.uploader || '',
                });
            } catch (e) {
                reject(e);
            }
        });
        ytdlp.on('error', reject);
    });
}

app.get('/metadata', async (req, res) => {
    const query = req.query.q as string;
    if (!query) return res.status(400).json({ error: 'Missing query' });
    try {
        const info = await getSongInfo(query);
        res.json(info);
    } catch (e) {
        console.error('Error fetching metadata:', e);
        res.status(500).json({ error: 'Failed to fetch metadata' });
    }
});

app.get('/stream', async (req, res) => {
    const query = req.query.q as string;
    let info: any = {};
    try {
        info = await getSongInfo(query);
        if (info.title) res.set('X-Song-Title', info.title);
        if (info.duration) res.set('X-Song-Duration', info.duration.toString());
        if (info.artist) res.set('X-Song-Artist', info.artist);
    } catch (e) {
        console.error('Error fetching song info for stream:', e);
    }

    const ytdlp = spawn('yt-dlp', [
        '--get-url',
        '--format', 'bestaudio[ext=m4a]/bestaudio',
        `ytsearch1:${query}`
    ]);

    let videoUrl = '';

    ytdlp.stdout.on('data', (data) => {
        videoUrl += data.toString();
    });

    ytdlp.on('close', () => {
        const ffmpeg = spawn('ffmpeg', [
            '-i', videoUrl.trim(),
            '-f', 'wav',
            '-acodec', 'pcm_s16le',
            '-ar', '44100',
            '-ac', '2',
            '-'
        ]);

        res.set({
            'Content-Type': 'audio/wav',
            'Transfer-Encoding': 'chunked'
        });

        ffmpeg.stdout.pipe(res);

        ffmpeg.on('error', (err) => {
            console.error('ffmpeg error:', err);
            res.end();
        });
        res.on('close', () => ffmpeg.kill('SIGINT'));
    });

    ytdlp.on('error', (err) => {
        console.error('yt-dlp error:', err);
        res.end();
    });
});

app.listen(3000, () => {
    console.log('Music server ready on http://localhost:3000');
}); 