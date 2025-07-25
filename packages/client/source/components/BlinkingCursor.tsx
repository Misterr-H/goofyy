import React, { useEffect, useState } from 'react';
import { Text } from 'ink';

export const BlinkingCursor: React.FC = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setVisible(v => !v), 500);
    return () => clearInterval(timer);
  }, []);

  return <Text color="green">{visible ? '█' : ' '}</Text>;
}; 