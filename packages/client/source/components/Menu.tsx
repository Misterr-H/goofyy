import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface MenuItem {
    label: string;
    value: string;
}

interface MenuProps {
    items: MenuItem[];
    onSelect: (item: MenuItem) => void;
}

export const Menu: React.FC<MenuProps> = ({ items, onSelect }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useInput((_, key) => {
        if (key.upArrow) {
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
        }
        if (key.downArrow) {
            setSelectedIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
        }
        if (key.return) {
            onSelect(items[selectedIndex]);
        }
    });

    return (
        <Box flexDirection="column">
            <Text>Select an option:</Text>
            {items.map((item, index) => (
                <Text key={item.value} color={selectedIndex === index ? 'green' : undefined}>
                    {selectedIndex === index ? '> ' : '  '}
                    {item.label}
                </Text>
            ))}
        </Box>
    );
};