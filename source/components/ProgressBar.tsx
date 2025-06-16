import React from 'react';
import { Box, Text } from 'ink';
import { ProgressBarProps } from '../types.js';

const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const ProgressBar: React.FC<ProgressBarProps> = ({ elapsed, total, width }) => {
    const progress = Math.min((elapsed / total) * width, width);
    const progressBar = '█'.repeat(progress) + '░'.repeat(width - progress);

    return (
        <Box>
            <Text>{formatTime(elapsed)}</Text>
            <Text> {progressBar} </Text>
            <Text>{formatTime(total)}</Text>
        </Box>
    );
}; 