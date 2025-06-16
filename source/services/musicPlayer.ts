import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import Speaker from 'speaker';
import os from 'os';
import { SongInfo } from '../types.js';

const execAsync = promisify(exec);

export class MusicPlayerService {
    private currentProcess: any;
    private speaker: any;
    private startTime: number = 0;
    private duration: number = 0;
    private onProgressUpdate: ((elapsed: number) => void) | null = null;

    async checkDependencies(): Promise<string[]> {
        const missing = [];
        
        try {
            await execAsync('which yt-dlp');
        } catch (error) {
            missing.push('yt-dlp');
        }
        
        try {
            await execAsync('which ffmpeg');
        } catch (error) {
            missing.push('ffmpeg');
        }
        
        return missing;
    }

    getInstallInstructions(missing: string[]): string {
        const platform = os.platform();
        let instructions = '❌ Missing dependencies detected!\n\n';
        
        if (platform === 'darwin') {
            instructions += '🍺 Please install the missing dependencies using Homebrew:\n\n';
            instructions += `   brew install ${missing.join(' ')}\n\n`;
        } else if (platform === 'linux') {
            instructions += '🐧 Please install the missing dependencies:\n\n';
            instructions += '   # Ubuntu/Debian:\n';
            instructions += '   sudo apt update\n';
            if (missing.includes('yt-dlp')) {
                instructions += '   sudo apt install python3-pip && pip3 install yt-dlp\n';
            }
            if (missing.includes('ffmpeg')) {
                instructions += '   sudo apt install ffmpeg\n';
            }
            instructions += '\n   # Or using Homebrew on Linux:\n';
            instructions += `   brew install ${missing.join(' ')}\n\n`;
        } else {
            instructions += '💻 Please install the missing dependencies:\n\n';
            instructions += '   yt-dlp: https://github.com/yt-dlp/yt-dlp#installation\n';
            instructions += '   ffmpeg: https://ffmpeg.org/download.html\n\n';
        }
        
        return instructions;
    }

    async searchSong(query: string): Promise<SongInfo> {
        return new Promise((resolve, reject) => {
            const ytdlp = spawn('yt-dlp', [
                '--get-title',
                '--get-duration',
                '--get-url',
                '--format', 'bestaudio[ext=m4a]/bestaudio/best',
                '--no-warnings',
                `ytsearch1:${query}`
            ]);
            
            let output = '';
            let errorOutput = '';
            
            ytdlp.stdout.on('data', (data: Buffer) => {
                output += data.toString();
            });
            
            ytdlp.stderr.on('data', (data: Buffer) => {
                errorOutput += data.toString();
            });
            
            ytdlp.on('close', (code: number) => {
                if (code !== 0) {
                    reject(new Error(`Song not found: ${errorOutput}`));
                    return;
                }
                
                const lines = output.trim().split('\n');
                if (lines.length < 3) {
                    reject(new Error('Failed to extract song information'));
                    return;
                }

                resolve({
                    title: lines[0]!,
                    duration: lines[2]!,
                    url: lines[1]!
                });
            });
            
            ytdlp.on('error', (error: Error) => {
                reject(error);
            });
        });
    }

    setProgressCallback(callback: (elapsed: number) => void) {
        this.onProgressUpdate = callback;
    }

    private parseDuration(duration: string): number {
        const parts = duration.split(':');
        if (parts.length === 2) {
            return parseInt(parts[0] || '0') * 60 + parseInt(parts[1] || '0');
        } else if (parts.length === 3) {
            return parseInt(parts[0] || '0') * 3600 + parseInt(parts[1] || '0') * 60 + parseInt(parts[2] || '0');
        }
        return 0;
    }

    async playSong(songInfo: SongInfo): Promise<void> {
        return new Promise((resolve, reject) => {
            this.startTime = Date.now();
            this.duration = this.parseDuration(songInfo.duration);

            const ffmpeg = spawn('ffmpeg', [
                '-i', songInfo.url,
                '-f', 's16le',
                '-acodec', 'pcm_s16le',
                '-ac', '2',
                '-ar', '44100',
                '-'
            ], {
                stdio: ['ignore', 'pipe', 'ignore']
            });
            
            this.speaker = new Speaker({
                channels: 2,
                bitDepth: 16,
                sampleRate: 44100
            });
            
            this.currentProcess = ffmpeg;

            // Start progress tracking
            const progressInterval = setInterval(() => {
                const elapsed = (Date.now() - this.startTime) / 1000;
                if (this.onProgressUpdate) {
                    this.onProgressUpdate(Math.min(elapsed, this.duration));
                }
            }, 1000);
            
            ffmpeg.stdout.pipe(this.speaker);
            
            ffmpeg.on('error', (error: Error) => {
                clearInterval(progressInterval);
                reject(error);
            });
            
            this.speaker.on('close', () => {
                clearInterval(progressInterval);
                resolve();
            });
            
            ffmpeg.on('close', (code: number) => {
                clearInterval(progressInterval);
                if (code !== 0 && code !== null) {
                    reject(new Error(`Audio processing failed with code ${code}`));
                }
            });
        });
    }

    cleanup() {
        if (this.currentProcess) {
            this.currentProcess.kill('SIGTERM');
        }
        if (this.speaker) {
            this.speaker.destroy();
        }
    }
} 