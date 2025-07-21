import got from 'got';
import Speaker from 'speaker';
import { SongInfo } from '../types.js';
import { baseUrl } from '../baseUrl.js';

export class MusicPlayerService {
    private speaker: any;
    private onProgressUpdate: ((elapsed: number) => void) | null = null;
    private progressInterval: NodeJS.Timeout | null = null;
    private startTime: number = 0;
    private duration: number = 0;
    private currentSongInfo: SongInfo | null = null;
    private currentStream: NodeJS.ReadableStream | null = null;
    private _isPlaying: boolean = false;

    async checkDependencies(): Promise<string[]> {
        return [];
    }

    getInstallInstructions(missing: string[]): string {
        return '';
    }

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

    getStream(query: string): NodeJS.ReadableStream {
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

    async playStream(songInfo: SongInfo, stream: NodeJS.ReadableStream): Promise<void> {
        return new Promise((resolve, reject) => {
            this.cleanup(); // Ensure any previous playback is stopped
            this.currentSongInfo = songInfo;
            this.currentStream = stream;
            this.startTime = Date.now();
            this.duration = this.parseDuration(songInfo.duration);

            this.speaker = new Speaker({
                channels: 2,
                bitDepth: 16,
                sampleRate: 44100,
                bufferSize: 8192 // Increased buffer size to mitigate underflows
            } as any);

            stream.on('error', (err: Error) => {
                this.cleanup();
                reject(err);
            });

            this.speaker.on('close', () => {
                this.cleanup();
                resolve();
            });

            stream.pipe(this.speaker);
            this._isPlaying = true;

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

    // Keep for backward compatibility
    async playSong(songInfo: SongInfo): Promise<void> {
        const stream = this.getStream(songInfo.title); // Re-fetch stream for playSong
        return this.playStream(songInfo, stream);
    }

    cleanup() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
        if (this.speaker) {
            this.speaker.destroy();
            this.speaker = null;
        }
        if (this.currentStream) {
            (this.currentStream as any).destroy();
            this.currentStream = null;
        }
        this._isPlaying = false;
    }

    togglePlayback(): void {
        if (this._isPlaying) {
            this.cleanup();
        } else if (this.currentSongInfo) {
            // To resume, we need to re-fetch the stream and play from beginning
            // True pause/resume is complex with current speaker library
            const stream = this.getStream(this.currentSongInfo.title);
            this.playStream(this.currentSongInfo, stream);
        }
    }

    getIsPlaying(): boolean {
        return this._isPlaying;
    }
}