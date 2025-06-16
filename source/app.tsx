import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { MusicPlayerService } from './services/musicPlayer.js';
import { MusicPlayerState } from './types.js';
import { ProgressBar } from './components/ProgressBar.js';
import { InstallInstructions } from './components/InstallInstructions.js';

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
	const [missingDeps, setMissingDeps] = useState<string[]>([]);
	const { exit } = useApp();
	const musicPlayer = new MusicPlayerService();

	useEffect(() => {
		const checkDeps = async () => {
			const missing = await musicPlayer.checkDependencies();
			if (missing.length > 0) {
				setMissingDeps(missing);
			} else if (initialQuery) {
				handleSearch(initialQuery);
			}
		};
		checkDeps();
	}, []);

	const handleSearch = async (query: string) => {
		if (!query.trim()) return;

		setState((prev: MusicPlayerState) => ({ ...prev, isSearching: true, error: null }));
		try {
			const songInfo = await musicPlayer.searchSong(query);
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

			await musicPlayer.playSong(songInfo);
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
		if (key.escape) {
			musicPlayer.cleanup();
			exit();
		}

		if (key.return && !state.isSearching && !state.isPlaying) {
			handleSearch(input);
		} else if (input2.length > 0) {
			setInput(r => r + input2);
		} else if(key.backspace || key.delete) {
			setInput(r => r.slice(0, -1));
		}
	});

	if (missingDeps.length > 0) {
		return <InstallInstructions missing={missingDeps} query={initialQuery} />;
	}

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
							<Text>Press ESC to exit</Text>
						</Box>
					)}
				</>
			)}
		</Box>
	);
}
