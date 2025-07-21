import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { MusicPlayerService } from './services/musicPlayer.js';
import { MusicPlayerState, SongInfo } from './types.js';
import { ProgressBar } from './components/ProgressBar.js';
import { Menu } from './components/Menu.js';

type Props = {
	initialQuery?: string;
};

type Screen = 'home' | 'music' | 'playlists' | 'trending' | 'settings' | 'about';

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
	const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);
	const [currentScreen, setCurrentScreen] = useState<Screen>('music'); // Default to music player
	const [songQueue, setSongQueue] = useState<SongInfo[]>([]);
	const [message, setMessage] = useState<string | null>(null);
	const { exit } = useApp();
	const musicPlayer = new MusicPlayerService();

	const menuItems = [
		{ label: 'Home', screen: 'home' },
		{ label: 'Music Player', screen: 'music' },
		{ label: 'Playlists', screen: 'playlists' },
		{ label: 'Trending song', screen: 'trending' },
		{ label: 'Settings', screen: 'settings' },
		{ label: 'About', screen: 'about' }
	];

	useEffect(() => {
		if (initialQuery) {
			handleSearch(initialQuery);
		}
	}, []);

	const handleSearch = async (query: string) => {
		if (!query.trim()) return;

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
			if (currentScreen !== 'music') {
				setCurrentScreen('music');
				setSelectedMenuIndex(menuItems.findIndex(item => item.screen === 'music'));
			} else if (state.currentSong) {
				musicPlayer.cleanup();
				setState(prev => ({ ...prev, currentSong: null, isPlaying: false, error: null }));
				setInput('');
				setMessage('Cleared current song.');
			} else {
				exit();
			}
			return;
		}

		// Handle Spacebar for pause/resume
		if (key.space) {
			if (currentScreen === 'music' && state.currentSong) {
				musicPlayer.togglePlayback();
				setState(prev => ({ ...prev, isPlaying: musicPlayer.getIsPlaying() }));
				setMessage(musicPlayer.getIsPlaying() ? 'Resumed playback.' : 'Playback paused.');
			}
			return;
		}

		// Handle 'a' for adding to queue
		if (input2 === 'a' && currentScreen === 'music' && state.currentSong && !state.isSearching) {
			setSongQueue(prev => [...prev, state.currentSong!]);
			setMessage(`Added "${state.currentSong.title}" to queue.`);
			return;
		}

		// Handle menu navigation if currentScreen is not music player or if search is not active
		if (currentScreen !== 'music' || !state.isSearching) {
			if (key.leftArrow) {
				setSelectedMenuIndex(prev => (prev === 0 ? menuItems.length - 1 : prev - 1));
				return;
			}

			if (key.rightArrow) {
				setSelectedMenuIndex(prev => (prev === menuItems.length - 1 ? 0 : prev + 1));
				return;
			}

			if (key.return) {
				setCurrentScreen(menuItems[selectedMenuIndex].screen as Screen);
				return;
			}
		}

		// Handle search input only if currentScreen is music player and not searching
		if (currentScreen === 'music' && !state.isSearching) {
			if (key.return && !state.isPlaying) {
				handleSearch(input);
			} else if (input2.length > 0) {
				setInput(r => r + input2);
			} else if(key.backspace || key.delete) {
				setInput(r => r.slice(0, -1));
			}
		}
	});

	return (
		<Box flexDirection="column">
			<Menu items={menuItems} selectedIndex={selectedMenuIndex} />
			<Box marginBottom={1}>
				<Text>🎵 Goofyy Music Player</Text>
			</Box>

			{message && (
				<Box marginBottom={1}>
					<Text color="yellow">{message}</Text>
				</Box>
			)}

			{currentScreen === 'home' && (
				<Box>
					<Text>Welcome to the Home screen!</Text>
				</Box>
			)}

			{currentScreen === 'music' && (
				state.error ? (
					<Box>
						<Text color="red">{state.error}</Text>
					</Box>
				) : (
					<>
						{!state.currentSong && !state.isSearching && (
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

						{state.currentSong && (
							<Box flexDirection="column">
								<Box marginBottom={1}>
									<Text>🎵 Now playing: {state.currentSong.title}</Text>
								</Box>
								<Box marginBottom={1}>
									<ProgressBar
										elapsed={state.progress.elapsed}
										total={state.progress.total}
										width={40}
									/>
								</Box>
								<Text>Join us on discord: https://discord.gg/HNJgYuSUQ3</Text>
								<Text>Press Ctrl+C to exit</Text>
							</Box>
						)}
					</>
				)
			)}

			{currentScreen === 'settings' && (
				<Box>
					<Text>Settings will go here.</Text>
				</Box>
			)}

			{currentScreen === 'about' && (
				<Box>
					<Text>About Goofyy Music Player.</Text>
				</Box>
			)}

			{currentScreen === 'playlists' && (
				<Box>
					<Text>Playlists are currently under development.</Text>
				</Box>
			)}

			{currentScreen === 'trending' && (
				<Box>
					<Text>Trending songs are currently under development.</Text>
				</Box>
			)}

			{currentScreen === 'music' && songQueue.length > 0 && (
				<Box flexDirection="column" marginTop={1}>
					<Text bold>Song Queue:</Text>
					{songQueue.map((song, index) => (
						<Text key={index}>- {song.title}</Text>
					))}
				</Box>
			)}
		</Box>
	);
}
