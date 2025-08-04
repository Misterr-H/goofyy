import got from 'got';
import { spawn } from 'child_process';
import { SongInfo } from '../types.js';
import { baseUrl } from '../baseUrl.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

export class MusicPlayerService {
    private currentProcess: any = null;
    private onProgressUpdate: ((elapsed: number) => void) | null = null;
    private progressInterval: any = null;
    private startTime: number = 0;
    private duration: number = 0;
    private paused: boolean = false;
    private pausedElapsed: number = 0;

    async checkDependencies(): Promise<string[]> {
        // For Windows, we'll use built-in PowerShell
        // For macOS, we'll use built-in afplay
        // For Linux, we'll try common audio players
        return [];
    }

    getInstallInstructions(missing: string[]): string {
        if (process.platform === 'linux') {
            return `Install audio player: sudo apt install mpg123 (or mplayer/vlc/ffmpeg)`;
        }
        return 'Audio support is built-in for your system.';
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
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    // Play stream directly using system audio players
    async playStream(songInfo: SongInfo, stream: any): Promise<void> {
        return new Promise((resolve, reject) => {
            this.startTime = Date.now();
            this.duration = this.parseDuration(songInfo.duration);
            this.paused = false;
            this.pausedElapsed = 0;

            try {
                if (process.platform === 'win32') {
                    // For Windows, download and play using built-in methods
                    this.playOnWindows(songInfo.url).then(resolve).catch(reject);
                } else if (process.platform === 'darwin') {
                    // Use afplay with the WAV stream on macOS
                    this.currentProcess = spawn('afplay', [songInfo.url]);
                    this.setupProcessHandlers(resolve, reject);
                } else {
                    // Linux - try available players
                    this.tryLinuxFallback(songInfo.url).then(resolve).catch(reject);
                }

                // Start progress tracking
                if (this.onProgressUpdate) {
                    this.progressInterval = setInterval(() => {
                        if (!this.paused) {
                            const elapsed = (Date.now() - this.startTime) / 1000;
                            if (this.onProgressUpdate) {
                                this.onProgressUpdate(elapsed);
                            }
                        }
                    }, 1000);
                }

            } catch (err) {
                reject(err);
            }
        });
    }

    private setupProcessHandlers(resolve: () => void, reject: (err: Error) => void) {
        if (this.currentProcess) {
            this.currentProcess.on('close', () => {
                if (this.progressInterval) {
                    clearInterval(this.progressInterval);
                    this.progressInterval = null;
                }
                resolve();
            });

            this.currentProcess.on('error', (err: Error) => {
                if (this.progressInterval) {
                    clearInterval(this.progressInterval);
                    this.progressInterval = null;
                }
                reject(err);
            });
        }
    }

    private async playOnWindows(url: string): Promise<void> {
        // Use a truly silent background approach for terminal-based playback
        return await this.playWithSilentBackgroundPlayer(url);
    }

    private async playWithSilentBackgroundPlayer(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // Download first, then play silently in background
            const tempFile = path.join(os.tmpdir(), `goofyy_${Date.now()}.wav`);
            const writeStream = fs.createWriteStream(tempFile);
            const audioStream = got.stream(url);

            console.log('Downloading audio for background playback...');
            audioStream.pipe(writeStream);

            writeStream.on('finish', () => {
                console.log('Playing audio silently in background...');
                
                // Use PowerShell with WindowStyle Hidden and no GUI - completely silent
                const psScript = `
                    Add-Type -AssemblyName presentationCore
                    $mediaPlayer = New-Object System.Windows.Media.MediaPlayer
                    try {
                        $mediaPlayer.Open([uri]'file:///${tempFile.replace(/\\/g, '/')}')
                        $mediaPlayer.Play()
                        
                        # Wait for media to load
                        $timeout = 0
                        while (-not $mediaPlayer.NaturalDuration.HasTimeSpan -and $timeout -lt 50) {
                            Start-Sleep -Milliseconds 100
                            $timeout++
                        }
                        
                        if ($mediaPlayer.NaturalDuration.HasTimeSpan) {
                            $duration = $mediaPlayer.NaturalDuration.TimeSpan.TotalSeconds
                            # Play for the full duration
                            Start-Sleep -Seconds $duration
                        } else {
                            # Fallback: play for estimated duration
                            Start-Sleep -Seconds 180
                        }
                    } catch {
                        # Silent error handling - don't show errors to user
                    } finally {
                        try {
                            $mediaPlayer.Close()
                            $mediaPlayer = $null
                            Remove-Item '${tempFile.replace(/\\/g, '\\\\')}' -Force -ErrorAction SilentlyContinue
                        } catch {}
                    }
                `;

                this.currentProcess = spawn('powershell', [
                    '-ExecutionPolicy', 'Bypass',
                    '-WindowStyle', 'Hidden',
                    '-NoProfile',
                    '-NonInteractive',
                    '-Command', psScript
                ], {
                    stdio: ['ignore', 'ignore', 'ignore'], // Completely silent
                    windowsHide: true,
                    detached: false
                });

                // No output logging - keep it completely silent for terminal use
                this.currentProcess.on('close', () => {
                    console.log('Background audio playback completed');
                    resolve();
                });

                this.currentProcess.on('error', (err: Error) => {
                    console.log('Audio playback failed, trying fallback...');
                    // Try fallback method
                    this.playWithSimpleBackgroundMethod(tempFile).then(resolve).catch(reject);
                });
            });

            writeStream.on('error', (err) => {
                try { fs.unlinkSync(tempFile); } catch {}
                reject(err);
            });

            audioStream.on('error', (err) => {
                try { fs.unlinkSync(tempFile); } catch {}
                reject(err);
            });
        });
    }

    private async playWithSimpleBackgroundMethod(tempFile: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // Simple fallback: use wmplayer in minimized mode
            this.currentProcess = spawn('cmd', ['/c', 'start', '/min', 'wmplayer', '/task', tempFile], {
                stdio: ['ignore', 'ignore', 'ignore'],
                windowsHide: true,
                detached: true
            });

            // Estimate duration and clean up
            setTimeout(() => {
                try { fs.unlinkSync(tempFile); } catch {}
                resolve();
            }, 180000); // 3 minutes max

            this.currentProcess.on('error', () => {
                try { fs.unlinkSync(tempFile); } catch {}
                reject(new Error('All audio playback methods failed'));
            });
        });
    }

    private async downloadAndPlay(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const tempFile = path.join(os.tmpdir(), `goofyy_${Date.now()}.wav`);
            const writeStream = fs.createWriteStream(tempFile);
            const audioStream = got.stream(url);

            console.log('Downloading audio to:', tempFile);
            audioStream.pipe(writeStream);

            writeStream.on('finish', () => {
                console.log('Download complete, attempting to play...');
                
                // Use the simplest Windows approach - just open the file with default association
                this.currentProcess = spawn('cmd', ['/c', 'start', '""', tempFile], {
                    stdio: ['pipe', 'pipe', 'pipe']
                });

                this.currentProcess.stdout?.on('data', (data: Buffer) => {
                    console.log('CMD Output:', data.toString().trim());
                });

                this.currentProcess.stderr?.on('data', (data: Buffer) => {
                    console.log('CMD Error:', data.toString().trim());
                });

                this.currentProcess.on('close', (code: number) => {
                    console.log('Player closed with code:', code);
                    // Clean up temp file after a delay to allow playback
                    setTimeout(() => {
                        try { 
                            fs.unlinkSync(tempFile);
                            console.log('Temp file cleaned up');
                        } catch (err) {
                            console.log('Failed to clean temp file:', err);
                        }
                    }, 5000);
                    resolve();
                });

                this.currentProcess.on('error', (err: Error) => {
                    console.error('Player error:', err);
                    try { fs.unlinkSync(tempFile); } catch {}
                    reject(err);
                });
            });

            writeStream.on('error', (err) => {
                console.error('Write stream error:', err);
                try { fs.unlinkSync(tempFile); } catch {}
                reject(err);
            });
            
            audioStream.on('error', (err) => {
                console.error('Audio stream error:', err);
                try { fs.unlinkSync(tempFile); } catch {}
                reject(err);
            });
        });
    }

    private async tryLinuxFallback(url: string): Promise<void> {
        const players = [
            // Try ffplay first (best for HTTP WAV streams)
            ['ffplay', ['-nodisp', '-autoexit', '-loglevel', 'quiet', url]],
            // mpv (excellent for WAV)
            ['mpv', ['--no-video', '--really-quiet', url]],
            // VLC command line
            ['vlc', ['--intf', 'dummy', '--play-and-exit', url]],
            ['cvlc', ['--play-and-exit', url]],
            // mplayer
            ['mplayer', ['-really-quiet', url]],
            // paplay (PulseAudio) with curl
            ['bash', ['-c', `curl -s "${url}" | paplay --format=s16le --rate=44100 --channels=2`]],
            // aplay (ALSA) with curl
            ['bash', ['-c', `curl -s "${url}" | aplay -f S16_LE -r 44100 -c 2`]]
        ];
        
        for (const [player, args] of players) {
            try {
                return await new Promise((resolve, reject) => {
                    const process = spawn(player as string, args as string[]);
                    process.on('close', () => resolve());
                    process.on('error', reject);
                });
            } catch {
                continue;
            }
        }
        
        throw new Error('No audio player found. Please install ffmpeg, mpv, vlc, or mplayer.');
    }

    pause() {
        this.paused = true;
        this.pausedElapsed = (Date.now() - this.startTime) / 1000;
        
        if (this.currentProcess && !this.currentProcess.killed) {
            try {
                if (process.platform !== 'win32') {
                    this.currentProcess.kill('SIGSTOP'); // Pause on Unix
                }
            } catch {
                // If pause doesn't work, we'll just track the pause state
            }
        }
        
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    resume() {
        if (this.paused) {
            this.paused = false;
            this.startTime = Date.now() - this.pausedElapsed * 1000;
            
            if (this.currentProcess && !this.currentProcess.killed) {
                try {
                    if (process.platform !== 'win32') {
                        this.currentProcess.kill('SIGCONT'); // Resume on Unix
                    }
                } catch {
                    // If resume doesn't work, just continue tracking
                }
            }
            
            if (this.onProgressUpdate) {
                this.progressInterval = setInterval(() => {
                    if (!this.paused) {
                        const elapsed = (Date.now() - this.startTime) / 1000;
                        if (this.onProgressUpdate) {
                            this.onProgressUpdate(elapsed);
                        }
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
        // Since you're streaming from server, we don't need the got.stream()
        // Just pass the URL directly to the audio player
        return this.playStream(songInfo, null);
    }

    cleanup() {
        if (this.currentProcess && !this.currentProcess.killed) {
            this.currentProcess.kill();
        }
        
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }
} 