export type SongInfo = {
	title: string;
	duration: string;
	url: string;
};

export type MusicPlayerState = {
	isPlaying: boolean;
	currentSong: SongInfo | undefined;
	error: string | undefined;
	isSearching: boolean;
	progress: {
		elapsed: number; // In seconds
		total: number; // In seconds
	};
	volume: number;
};

export type ProgressBarProps = {
	elapsed: number;
	total: number;
	width: number;
};
