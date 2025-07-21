import React, {useState, useEffect} from 'react';
import {Box, Text, useInput, useApp} from 'ink';
import {MusicPlayerService} from './services/musicPlayer.js';
import {type MusicPlayerState} from './types.js';
import {ProgressBar} from './components/ProgressBar.js';
import {parseDuration} from './utils/time.js';

type Props = {
	readonly initialQuery?: string;
};

export default function App({initialQuery}: Props) {
	const [state, setState] = useState<MusicPlayerState>({
		isPlaying: false,
		currentSong: null,
		error: null,
		isSearching: false,
		progress: {
			elapsed: 0,
			total: 0,
		},
		volume: 1,
	});
	const [input, setInput] = useState(initialQuery || '');
	const {exit} = useApp();
	const musicPlayer = new MusicPlayerService();

	useEffect(() => {
		if (initialQuery) {
			handleSearch(initialQuery);
		}
	}, []);

	const handleSearch = async (query: string) => {
		if (!query.trim()) return;

		setState((previous: MusicPlayerState) => ({
			...previous,
			isSearching: true,
			error: null,
		}));
		try {
			const metadataPromise = musicPlayer.fetchMetadata(query);
			const streamPromise = Promise.resolve(musicPlayer.getStream(query));

			const songInfo = await metadataPromise;
			const totalDuration = parseDuration(songInfo.duration);

			setState((previous: MusicPlayerState) => ({
				...previous,
				currentSong: songInfo,
				isSearching: false,
				progress: {
					elapsed: 0,
					total: totalDuration,
				},
			}));

			musicPlayer.setProgressCallback((elapsed: number) => {
				setState((previous: MusicPlayerState) => ({
					...previous,
					progress: {
						...previous.progress,
						elapsed,
					},
				}));
			});

			const stream = await streamPromise;
			await musicPlayer.playStream(songInfo, stream);
			setState((previous: MusicPlayerState) => ({
				...previous,
				isPlaying: false,
			}));
		} catch (error) {
			setState((previous: MusicPlayerState) => ({
				...previous,
				error: error instanceof Error ? error.message : 'An error occurred',
				isSearching: false,
			}));
		}
	};

	useInput((input2, key) => {
		if (key.escape) {
			musicPlayer.cleanup();
			exit();
			return;
		}

		switch (input2) {
			case '+': {
				musicPlayer.increaseVolume();
				setState(previous => ({...previous, volume: musicPlayer.getVolume()}));

				break;
			}

			case '-': {
				musicPlayer.decreaseVolume();
				setState(previous => ({...previous, volume: musicPlayer.getVolume()}));

				break;
			}

			case ' ': {
				musicPlayer.togglePlayback();
				setState(previous => ({
					...previous,
					isPlaying: musicPlayer.getIsPlaying(),
				}));

				break;
			}
			// No default
		}

		if (state.isSearching) {
			return;
		}

		if (key.return && !state.isPlaying) {
			handleSearch(input);
		} else if (input2.length > 0) {
			setInput(r => r + input2);
		} else if (key.backspace || key.delete) {
			setInput(r => r.slice(0, -1));
		}
	});

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

							<Box marginBottom={1}>
								<Text>
									Volume: {'█'.repeat(state.volume * 10).padEnd(10, '░')}
								</Text>
							</Box>
							<Text>Join us on discord: https://discord.gg/HNJgYuSUQ3</Text>
							<Text>Press Ctrl+C to exit</Text>
						</Box>
					)}
				</>
			)}
		</Box>
	);
}
