import got from 'got';
import * as portAudio from 'naudiodon2';
import { SongInfo } from '../types.js';
import { baseUrl } from '../baseUrl.js';

// Minimal type declaration for naudiodon AudioIO
// Remove or move to a .d.ts file if you add full types later
interface AudioIO extends NodeJS.WritableStream {
    start(): void;
    quit(): void;
    on(event: 'close', listener: () => void): this;
}

export class MusicPlayerService {
    private speaker: AudioIO | null = null;
    private onProgressUpdate: ((elapsed: number) => void) | null = null;
    private progressInterval: NodeJS.Timeout | null = null;
    private startTime: number = 0;
    // @ts-ignore
    private duration: number = 0;

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

            // @ts-ignore
            this.speaker = new portAudio.AudioIO({
                outOptions: {
                    channelCount: 2,
                    sampleFormat: portAudio.SampleFormat16Bit,
                    sampleRate: 44100,
                    deviceId: -1, // default output device
                    closeOnError: true
                }
            }) as unknown as AudioIO;

            stream.on('error', (err: Error) => {
                if (this.progressInterval) clearInterval(this.progressInterval);
                reject(err);
            });

            this.speaker.on('close', () => {
                if (this.progressInterval) clearInterval(this.progressInterval);
                resolve();
            });

            stream.pipe(this.speaker);
            this.speaker.start();

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
        return new Promise((resolve, reject) => {
            this.startTime = Date.now();
            this.duration = this.parseDuration(songInfo.duration);

            // @ts-ignore
            this.speaker = new portAudio.AudioIO({
                outOptions: {
                    channelCount: 2,
                    sampleFormat: portAudio.SampleFormat16Bit,
                    sampleRate: 44100,
                    deviceId: -1, // default output device
                    closeOnError: true
                }
            }) as unknown as AudioIO;

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
            this.speaker.start();

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
            this.speaker.quit();
        }
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
    }
} 