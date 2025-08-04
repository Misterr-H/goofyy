import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { MusicPlayerService } from './services/musicPlayer.js';
import { MusicPlayerState } from './types.js';
import { Menu } from './components/Menu.js';
import { MusicPlayer } from './screens/MusicPlayer.js';
import Playlists from './screens/Playlists.js';
import TrendingSongs from './screens/TrendingSongs.js';
import About from './screens/About.js';
import Discord from './screens/Discord.js';
import StarGithub from './screens/StarGithub.js';
// import { InstallInstructions } from './components/InstallInstructions.js';

type Props = {
	initialQuery?: string;
};

export default function App({ initialQuery }: Props) {
	const [state, setState] = useState<MusicPlayerState>({
		isPlaying: false,
		isPaused: false,
		currentSong: null,
		error: null,
		isSearching: false,
		progress: {
			elapsed: 0,
			total: 0
		}
	});
	const [input, setInput] = useState(initialQuery || '');
	const { exit } = useApp();
	const musicPlayerRef = useRef<MusicPlayerService>(new MusicPlayerService());
	const musicPlayer = musicPlayerRef.current;
	const items = [
		{ label: 'Music Player', screen: 'music-player' },
		{ label: 'Playlists', screen: 'playlists' },
		{ label: 'Trending Songs', screen: 'trending-songs' },
		{ label: 'About Goofyy', screen: 'about-goofyy' },
		{ label: 'Discord', screen: 'discord' },
		{ label: 'Star on Github', screen: 'github' },
	];
	
	const [selectedIndex, setSelectedIndex] = useState(0);
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
			setState((prev: MusicPlayerState) => ({ ...prev, isPlaying: true }));
			await musicPlayer.playStream(songInfo, stream);
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
			musicPlayer.cleanup();
			exit();
			return;
		}

		// Handle other keys only if not searching
		if (state.isSearching) {
			return;
		}

		// Spacebar toggles pause/play
		if (input2 === ' ' && state.isPlaying) {
			if (!state.isPaused) {
				musicPlayer.pause();
				setState(prev => ({ ...prev, isPaused: true }));
			} else {
				musicPlayer.resume();
				setState(prev => ({ ...prev, isPaused: false }));
			}
			return;
		}

		if (key.return && !state.isPlaying) {
			handleSearch(input);
		} else if (input2.length > 0) {
			setInput(r => r + input2);
		} else if(key.backspace || key.delete) {
			setInput(r => r.slice(0, -1));
		}

		if (key.leftArrow && selectedIndex > 0) {
			setSelectedIndex(r => r - 1);
		} else if (key.rightArrow && selectedIndex < items.length - 1) {
			setSelectedIndex(r => r + 1);
		}
	});

	return (
		<Box flexDirection="column">
			<Box marginBottom={1} flexDirection="column">
				<Text>🎵 Goofyy Music Player</Text>
				<Text color="gray">Navigate the menu using the left (←) and right (→) arrow keys</Text>
			</Box>
			<Menu items={items} selectedIndex={selectedIndex} />

			{selectedIndex >= 0 && selectedIndex < items.length && items[selectedIndex]?.screen === 'music-player' && (
				<MusicPlayer state={state} input={input} />
			)}
			{state.isPlaying && (
				<Text color={state.isPaused ? 'yellow' : 'green'}>
					{state.isPaused ? 'Paused (press space to resume)' : 'Playing (press space to pause)'}
				</Text>
			)}
			{selectedIndex >= 0 && selectedIndex < items.length && items[selectedIndex]?.screen === 'playlists' && (
				<Playlists />
			)}
			{selectedIndex >= 0 && selectedIndex < items.length && items[selectedIndex]?.screen === 'trending-songs' && (
				<TrendingSongs />
			)}
			{selectedIndex >= 0 && selectedIndex < items.length && items[selectedIndex]?.screen === 'about-goofyy' && (
				<About />
			)}
			{selectedIndex >= 0 && selectedIndex < items.length && items[selectedIndex]?.screen === 'discord' && (
				<Discord />
			)}
			{selectedIndex >= 0 && selectedIndex < items.length && items[selectedIndex]?.screen === 'github' && (
				<StarGithub />
			)}
			{/* Other screens can be rendered here based on selectedIndex */}
		</Box>
	);
}
