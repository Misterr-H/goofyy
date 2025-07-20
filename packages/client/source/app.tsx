import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { MusicPlayerService } from './services/musicPlayer.js';
import { MusicPlayerState, SongInfo } from './types.js';
import { ProgressBar } from './components/ProgressBar.js';
import { Menu } from './components/Menu.js';

type Props = {
	initialQuery?: string;
};

export default function App({ initialQuery }: Props) {
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
	const [view, setView] = useState(initialQuery ? 'player' : 'menu');
	const [history, setHistory] = useState<SongInfo[]>([]);
	const [charts, setCharts] = useState<SongInfo[]>([]);
	const { exit } = useApp();
	const musicPlayer = new MusicPlayerService();

	useEffect(() => {
		if (initialQuery) {
			handleSearch(initialQuery);
		} else {
			loadHistory();
			loadCharts();
		}
	}, []);

	const loadHistory = async () => {
		try {
			const historyItems = await musicPlayer.getHistory();
			setHistory(historyItems);
		} catch (error) {
			setState(prev => ({ ...prev, error: 'Failed to load history' }));
		}
	};

	const loadCharts = async () => {
		try {
			const chartItems = await musicPlayer.getCharts();
			setCharts(chartItems);
		} catch (error) {
			setState(prev => ({ ...prev, error: 'Failed to load charts' }));
		}
	};

	const handleSearch = async (query: string) => {
		if (!query.trim()) return;

		setView('player');
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
			setState((prev: MusicPlayerState) => ({ ...prev, isPlaying: false }));
		} catch (error) {
			setState((prev: MusicPlayerState) => ({
				...prev,
				error: error instanceof Error ? error.message : 'An error occurred',
				isSearching: false
			}));
		}
	};

	const parseDuration = (duration: string): number => {
		const parts = duration.split(':');
		if (parts.length === 2) {
			return parseInt(parts[0] || '0') * 60 + parseInt(parts[1] || '0');
		} else if (parts.length === 3) {
			return parseInt(parts[0] || '0') * 3600 + parseInt(parts[1] || '0') * 60 + parseInt(parts[2] || '0');
		}
		return 0;
	};

	useInput((input2, key) => {
		// Handle ESC key first - should always work
		if (key.escape) {
			if (view === 'player' || view === 'search' || view === 'history' || view === 'charts') {
				setView('menu');
				setInput('');
				setState(prev => ({ ...prev, currentSong: null, isPlaying: false, isSearching: false }));
				musicPlayer.cleanup();
			} else {
				exit();
			}
			return;
		}

		if (view === 'player' && key.space) {
			if (state.isPlaying) {
				musicPlayer.pause();
				setState(prev => ({ ...prev, isPlaying: false }));
			} else {
				musicPlayer.resume();
				setState(prev => ({ ...prev, isPlaying: true }));
			}
		}

		// Handle other keys only if not searching
		if (state.isSearching) {
			return;
		}

		if (view === 'search') {
			if (key.return && !state.isPlaying) {
				handleSearch(input);
			} else if (input2.length > 0) {
				setInput(r => r + input2);
			} else if(key.backspace || key.delete) {
				setInput(r => r.slice(0, -1));
			}
		}
	});

	const menuItems = [
		{ label: 'Search for a Song', value: 'search' },
		{ label: 'Playback History', value: 'history' },
		{ label: 'Top Charts', value: 'charts' },
		{ label: 'Exit', value: 'exit' },
	];

	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text>🎵 Goofyy Music Player</Text>
			</Box>

			{state.error ? (
				<Box>
					<Text color="red">{state.error}</Text>
				</Box>
			) : (
				<>
					{view === 'menu' && (
						<Menu
							items={menuItems}
							onSelect={item => {
								if (item.value === 'exit') {
									exit();
								} else {
									setView(item.value);
								}
							}}
						/>
					)}

					{view === 'history' && (
						<Menu
							items={history.map(h => ({ label: h.title, value: h.query || h.title }))}
							onSelect={item => handleSearch(item.value)}
						/>
					)}

					{view === 'charts' && (
						<Menu
							items={charts.map(c => ({ label: c.title, value: c.query || c.title }))}
							onSelect={item => handleSearch(item.value)}
						/>
					)}

					{view === 'search' && !state.currentSong && !state.isSearching && (
						<Box marginBottom={1}>
							<Text>Enter song name to search: </Text>
							<Text color="green">{input}</Text>
						</Box>
					)}

					{state.isSearching && (
						<Box>
							<Text>🔍 Searching for: {input}</Text>
						</Box>
					)}

					{view === 'player' && state.currentSong && (
						<Box flexDirection="column">
							<Box marginBottom={1}>
								<Text>🎵 Now playing: {state.currentSong.title} ({state.isPlaying ? 'Playing' : 'Paused'})</Text>
							</Box>
							<Box marginBottom={1}>
								<ProgressBar
									elapsed={state.progress.elapsed}
									total={state.progress.total}
									width={40}
								/>
							</Box>
							<Text>Join us on discord: https://discord.gg/HNJgYuSUQ3</Text>
							<Text>Press [Space] to pause/resume, [ESC] to go back</Text>
						</Box>
					)}
				</>
			)}
		</Box>
	);
}
