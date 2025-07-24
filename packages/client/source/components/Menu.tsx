import { Box, Text } from 'ink';
import React from 'react';

interface MenuItem {
  label: string;
  screen: string;
}

interface MenuProps {
  items: MenuItem[];
  selectedIndex: number;
}

export function Menu({ items, selectedIndex }: MenuProps) {
  return (
    <Box flexDirection="row" marginBottom={1}>
      {/* <Text bold>Goofyy Menu: </Text> */}
      <Box>
        {items.map((item, index) => (
          <Text key={item.label} color={index === selectedIndex ? "blue" : "white"}>
            {index === selectedIndex ? ' > ' : '  '}{item.label}
          </Text>
        ))}
      </Box>
    </Box>
  );
}
