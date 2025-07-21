import got from 'got';
import Speaker from 'speaker';
import { SongInfo } from '../types.js';
import { baseUrl } from '../baseUrl.js';
import Volume from 'pcm-volume';

export class MusicPlayerService {
    private speaker: any;
    private onProgressUpdate: ((elapsed: number) => void) | null = null;
    private progressInterval: NodeJS.Timeout | null = null;
    private startTime: number = 0;
    private duration: number = 0;
    private currentStream: NodeJS.ReadableStream | null = null;
    private _isPlaying: boolean = false;
    private progress: { elapsed: number; total: number } = { elapsed: 0, total: 0 };
    private volume: any;

    constructor() {
        this.volume = new Volume();
    }

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
            this.progress = { elapsed: 0, total: this.duration };

            this.speaker = new Speaker({
                channels: 2,
                bitDepth: 16,
                sampleRate: 44100
            });

            stream.on('error', (err: Error) => {
                this.cleanup();
                reject(err);
            });

            this.speaker.on('close', () => {
                this.cleanup();
                resolve();
            });

            stream.pipe(this.volume).pipe(this.speaker);
            this._isPlaying = true;

            if (this.onProgressUpdate) {
                this.progressInterval = setInterval(() => {
                    const elapsed = (Date.now() - this.startTime) / 1000;
                    this.progress.elapsed = elapsed;
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
            this.currentStream = null;
        }
        this._isPlaying = false;
        this.progress = { elapsed: 0, total: 0 };
    }

    private _isPaused: boolean = false;

    togglePlayback(): void {
        if (!this.currentStream) return;

        if (this._isPlaying && !this._isPaused) {
            this.currentStream.unpipe(this.volume);
            if (this.progressInterval) {
                clearInterval(this.progressInterval);
                this.progressInterval = null;
            }
            this._isPaused = true;
        } else if (this._isPlaying && this._isPaused) {
            this.currentStream.pipe(this.volume);
            this.startTime = Date.now() - (this.progress.elapsed * 1000);
            if (this.onProgressUpdate) {
                this.progressInterval = setInterval(() => {
                    const elapsed = (Date.now() - this.startTime) / 1000;
                    if (this.onProgressUpdate) {
                        this.onProgressUpdate(elapsed);
                    }
                }, 1000);
            }
            this._isPaused = false;
        }
    }

    getIsPlaying(): boolean {
        return this._isPlaying;
    }

    setVolume(volume: number) {
        this.volume.setVolume(volume);
    }

    increaseVolume(amount = 0.1) {
        const currentVolume = this.volume.volume;
        this.volume.setVolume(Math.min(currentVolume + amount, 1));
    }

    decreaseVolume(amount = 0.1) {
        const currentVolume = this.volume.volume;
        this.volume.setVolume(Math.max(currentVolume - amount, 0));
    }

    getVolume(): number {
        return this.volume.volume;
    }
}

export const musicPlayerService = new MusicPlayerService(); 