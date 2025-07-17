import React from 'react';
import { Box, Text } from 'ink';
import os from 'os';

interface InstallInstructionsProps {
    missing: string[];
    query?: string;
}

export const InstallInstructions: React.FC<InstallInstructionsProps> = ({ missing, query }) => {
    const platform = os.platform();
    const command = query ? `goofyy "${query}"` : 'goofyy';

    return (
        <Box flexDirection="column">
            <Text color="red">❌ Missing dependencies detected!</Text>
            <Text> </Text>

            {platform === 'darwin' && (
                <>
                    <Text>🍺 Please install the missing dependencies using Homebrew:</Text>
                    <Text> </Text>
                    <Text>   brew install {missing.join(' ')}</Text>
                    <Text> </Text>
                </>
            )}

            {platform === 'linux' && (
                <>
                    <Text>🐧 Please install the missing dependencies:</Text>
                    <Text> </Text>
                    <Text>   # Ubuntu/Debian:</Text>
                    <Text>   sudo apt update</Text>
                    {missing.includes('yt-dlp') && (
                        <Text>   sudo apt install python3-pip && pip3 install yt-dlp</Text>
                    )}
                    {missing.includes('ffmpeg') && (
                        <Text>   sudo apt install ffmpeg</Text>
                    )}
                    <Text> </Text>
                    <Text>   # Or using Homebrew on Linux:</Text>
                    <Text>   brew install {missing.join(' ')}</Text>
                    <Text> </Text>
                </>
            )}

            {platform !== 'darwin' && platform !== 'linux' && (
                <>
                    <Text>💻 Please install the missing dependencies:</Text>
                    <Text> </Text>
                    <Text>   yt-dlp: https://github.com/yt-dlp/yt-dlp#installation</Text>
                    <Text>   ffmpeg: https://ffmpeg.org/download.html</Text>
                    <Text> </Text>
                </>
            )}

            <Text>Then run the command again:</Text>
            <Text>   {command}</Text>
            <Text> </Text>
        </Box>
    );
}; 