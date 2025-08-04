export interface SongInfo {
    title: string;
    duration: string;
    url: string;
}

export interface MusicPlayerState {
    isPlaying: boolean;
    isPaused: boolean;
    currentSong: SongInfo | null;
    error: string | null;
    isSearching: boolean;
    progress: {
        elapsed: number;  // in seconds
        total: number;    // in seconds
    };
}

export interface ProgressBarProps {
    elapsed: number;
    total: number;
    width: number;
} 