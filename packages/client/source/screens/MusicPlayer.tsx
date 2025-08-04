import React from 'react';
import { Box, Text } from 'ink';
import { ProgressBar } from '../components/ProgressBar.js';
import { MusicPlayerState } from '../types.js';
import { BlinkingCursor } from '../components/BlinkingCursor.js';

interface MusicPlayerScreenProps {
  state: MusicPlayerState;
  input: string;
}

export const MusicPlayer: React.FC<MusicPlayerScreenProps> = ({ state, input }) => {
  if (state.error) {
    return (
      <Box>
        <Text color="red">{state.error}</Text>
      </Box>
    );
  }

  return (
    <>
      {!state.currentSong && !state.isSearching && (
        <Box marginBottom={1}>
          <Text>Enter song name to search: </Text>
          <Text color="green">{input}</Text>
          <BlinkingCursor />
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
  );
};
