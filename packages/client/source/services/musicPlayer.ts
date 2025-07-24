import got from 'got';
import Speaker from 'speaker';
import { SongInfo } from '../types.js';
import { baseUrl } from '../baseUrl.js';

export class MusicPlayerService {
    private speaker: any;
    private onProgressUpdate: ((elapsed: number) => void) | null = null;
    private progressInterval: NodeJS.Timeout | null = null;
    private startTime: number = 0;
    // @ts-ignore
    private duration: number = 0;
    private paused: boolean = false;
    private currentStream: NodeJS.ReadableStream | null = null;
    private pausedElapsed: number = 0;

    async checkDependencies(): Promise<string[]> {
        return [];
    }

    // @ts-ignore
    getInstallInstructions(missing: string[]): string {
        return '';
    }

    // Fetch metadata only
    async fetchMetadata(query: string): Promise<SongInfo> {
        const metadataUrl = `${baseUrl}/metadata?q=${encodeURIComponent(query)}`;
        const streamUrl = `${baseUrl}/stream?q=${encodeURIComponent(query)}`;
        const response = await got(metadataUrl, { responseType: 'json' });
        const data = response.body as any;
        return {
            title: data.title || query,
            duration: typeof data.duration === 'number' ? this.formatDuration(data.duration) : (data.duration || '0:00'),
            url: streamUrl
        };
    }

    // Get stream only
    getStream(query: string) {
        const streamUrl = `${baseUrl}/stream?q=${encodeURIComponent(query)}`;
        return got.stream(streamUrl);
    }

    setProgressCallback(callback: (elapsed: number) => void) {
        this.onProgressUpdate = callback;
    }

    private parseDuration(duration: string): number {
        if (typeof duration === 'number') return duration;
        const parts = duration.split(':');
        if (parts.length === 2) {
            return parseInt(parts[0] || '0') * 60 + parseInt(parts[1] || '0');
        } else if (parts.length === 3) {
            return parseInt(parts[0] || '0') * 3600 + parseInt(parts[1] || '0') * 60 + parseInt(parts[2] || '0');
        }
        return 0;
    }

    private formatDuration(seconds: number): string {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    // Play using a provided stream and songInfo
    async playStream(songInfo: SongInfo, stream: NodeJS.ReadableStream): Promise<void> {
        return new Promise((resolve, reject) => {
            this.startTime = Date.now();
            this.duration = this.parseDuration(songInfo.duration);
            this.paused = false;
            this.currentStream = stream;
            this.pausedElapsed = 0;

            this.speaker = new Speaker({
                channels: 2,
                bitDepth: 16,
                sampleRate: 44100
            });

            stream.on('error', (err: Error) => {
                if (this.progressInterval) clearInterval(this.progressInterval);
                reject(err);
            });

            this.speaker.on('close', () => {
                if (this.progressInterval) clearInterval(this.progressInterval);
                resolve();
            });

            stream.pipe(this.speaker);

            if (this.onProgressUpdate) {
                this.progressInterval = setInterval(() => {
                    const elapsed = (Date.now() - this.startTime) / 1000;
                    if (this.onProgressUpdate) {
                        this.onProgressUpdate(elapsed);
                    }
                }, 1000);
            }
        });
    }

    pause() {
        if (this.currentStream && !this.paused) {
            this.currentStream.unpipe();
            this.paused = true;
            // Store elapsed time at pause
            this.pausedElapsed = (Date.now() - this.startTime) / 1000;
            if (this.progressInterval) {
                clearInterval(this.progressInterval);
                this.progressInterval = null;
            }
        }
    }

    resume() {
        if (this.currentStream && this.paused && this.speaker) {
            this.currentStream.pipe(this.speaker);
            this.paused = false;
            // Adjust startTime so elapsed calculation resumes correctly
            this.startTime = Date.now() - this.pausedElapsed * 1000;
            if (this.onProgressUpdate) {
                this.progressInterval = setInterval(() => {
                    const elapsed = (Date.now() - this.startTime) / 1000;
                    if (this.onProgressUpdate) {
                        this.onProgressUpdate(elapsed);
                    }
                }, 1000);
            }
        }
    }

    isPaused() {
        return this.paused;
    }

    // Keep for backward compatibility
    async playSong(songInfo: SongInfo): Promise<void> {
        return new Promise((resolve, reject) => {
            this.startTime = Date.now();
            this.duration = this.parseDuration(songInfo.duration);

            this.speaker = new Speaker({
                channels: 2,
                bitDepth: 16,
                sampleRate: 44100
            });

            const stream = got.stream(songInfo.url);

            stream.on('error', (err: Error) => {
                if (this.progressInterval) clearInterval(this.progressInterval);
                reject(err);
            });

            this.speaker.on('close', () => {
                if (this.progressInterval) clearInterval(this.progressInterval);
                resolve();
            });

            stream.pipe(this.speaker);

            if (this.onProgressUpdate) {
                this.progressInterval = setInterval(() => {
                    const elapsed = (Date.now() - this.startTime) / 1000;
                    if (this.onProgressUpdate) {
                        this.onProgressUpdate(elapsed);
                    }
                }, 1000);
            }
        });
    }

    cleanup() {
        if (this.speaker) {
            this.speaker.destroy();
        }
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
    }
} 