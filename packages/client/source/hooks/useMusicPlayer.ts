import React, { useState, useEffect } from 'react';
import { MusicPlayerService } from '../services/musicPlayer.js';
import { SongInfo, MusicPlayerState } from '../types.js';

export function useMusicPlayer(initialQuery?: string) {
    const [state, setState] = useState<MusicPlayerState>({
        isPlaying: false,
        currentSong: null,
        error: null,
        isSearching: false,
        progress: {
            elapsed: 0,
            total: 0
        }
    });
    const [input, setInput] = useState(initialQuery || '');
    const [songQueue, setSongQueue] = useState<SongInfo[]>([]);
    const [message, setMessage] = useState<string | null>(null);

    const musicPlayer = React.useRef(new MusicPlayerService()).current;

    useEffect(() => {
        if (initialQuery) {
            handleSearch(initialQuery);
        }
    }, []);

    const parseDuration = (duration: string): number => {
        const parts = duration.split(':');
        if (parts.length === 2) {
            return parseInt(parts[0] || '0') * 60 + parseInt(parts[1] || '0');
        } else if (parts.length === 3) {
            return parseInt(parts[0] || '0') * 3600 + parseInt(parts[1] || '0') * 60 + parseInt(parts[2] || '0');
        }
        return 0;
    };

    const handleSearch = async (query: string) => {
        if (!query.trim()) return;

        musicPlayer.cleanup(); // Ensure any previous playback is stopped

        setState((prev: MusicPlayerState) => ({ ...prev, isSearching: true, error: null }));
        try {
            // Start both requests in parallel
            const metadataPromise = musicPlayer.fetchMetadata(query);
            const streamPromise = Promise.resolve(musicPlayer.getStream(query));

            // Wait for metadata first to update UI
            const songInfo = await metadataPromise;
            const totalDuration = parseDuration(songInfo.duration);

            setState((prev: MusicPlayerState) => ({
                ...prev,
                currentSong: songInfo,
                isSearching: false,
                progress: {
                    elapsed: 0,
                    total: totalDuration
                }
            }));

            musicPlayer.setProgressCallback((elapsed: number) => {
                setState((prev: MusicPlayerState) => ({
                    ...prev,
                    progress: {
                        ...prev.progress,
                        elapsed
                    }
                }));
            });

            // Wait for stream to be ready, then play
            const stream = await streamPromise;
            await musicPlayer.playStream(songInfo, stream);
            setState((prev: MusicPlayerState) => ({ ...prev, isPlaying: musicPlayer.getIsPlaying() }));
            setInput(''); // Clear input after successful search
        } catch (error) {
            setState((prev: MusicPlayerState) => ({
                ...prev,
                error: error instanceof Error ? error.message : 'An error occurred',
                isSearching: false
            }));
        }
    };

    const togglePlayback = () => {
        if (state.currentSong) {
            musicPlayer.togglePlayback();
            setState(prev => ({ ...prev, isPlaying: musicPlayer.getIsPlaying() }));
            setMessage(musicPlayer.getIsPlaying() ? 'Resumed playback.' : 'Playback paused.');
        }
    };

    const addSongToQueue = () => {
        if (state.currentSong && !state.isSearching) {
            setSongQueue(prev => [...prev, state.currentSong!]);
            setMessage(`Added "${state.currentSong.title}" to queue.`);
        }
    };

    const clearCurrentSong = () => {
        musicPlayer.cleanup();
        setState(prev => ({ ...prev, currentSong: null, isPlaying: false, error: null }));
        setInput('');
        setMessage('Cleared current song.');
    };

    return {
        state,
        input,
        setInput,
        songQueue,
        setSongQueue,
        message,
        setMessage,
        handleSearch,
        togglePlayback,
        addSongToQueue,
        clearCurrentSong
    };
}
