import React from 'react';
import { Box, Text } from 'ink';

function About() {
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>About Goofyy</Text>
      <Text>
        Goofyy is a sleek command-line music player that streams your favorite songs directly in the terminal. With a clean UI, instant search, and fast streaming powered by yt-dlp and ffmpeg, Goofyy makes listening to music simple and fun—right from your terminal. Enjoy real-time progress, easy keyboard controls, and a minimal, distraction-free experience.
      </Text>
    </Box>
  );
}

export default About;