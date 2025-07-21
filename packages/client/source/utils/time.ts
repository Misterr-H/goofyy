export const parseDuration = (duration: string): number => {
	const parts = duration.split(':');
	if (parts.length === 2) {
		return (
			Number.parseInt(parts[0] || '0') * 60 + Number.parseInt(parts[1] || '0')
		);
	}

	if (parts.length === 3) {
		return (
			Number.parseInt(parts[0] || '0') * 3600 +
			Number.parseInt(parts[1] || '0') * 60 +
			Number.parseInt(parts[2] || '0')
		);
	}

	return 0;
};

export const formatDuration = (seconds: number): string => {
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${s.toString().padStart(2, '0')}`;
};
