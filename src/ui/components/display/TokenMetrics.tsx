import React, {useState, useEffect} from 'react';
import {Box, Text} from 'ink';

interface TokenMetricsProps {
	isActive: boolean;
	isPaused: boolean;
	startTime: Date | null;
	endTime: Date | null;
	pausedTime: number;
	completionTokens: number;
}

export default function TokenMetrics({
	isActive,
	isPaused,
	startTime,
	endTime,
	pausedTime,
	completionTokens,
}: TokenMetricsProps) {
	const [displayTime, setDisplayTime] = useState('0.0s');

	const loadingMessage = 'OpenRouterThinking';

	// Update display time only when state changes, not continuously
	useEffect(() => {
		if (!startTime) {
			setDisplayTime('0.0s');
			return;
		}

		if (!isActive && endTime) {
			// Show final elapsed time when completed
			const finalElapsed = endTime.getTime() - startTime.getTime() - pausedTime;
			setDisplayTime(`${(finalElapsed / 1000).toFixed(1)}s`);
		} else if (isActive && !isPaused) {
			// Show current elapsed time when active (but don't continuously update)
			const currentElapsed = Date.now() - startTime.getTime() - pausedTime;
			setDisplayTime(`${(currentElapsed / 1000).toFixed(1)}s`);
		}
	}, [isActive, isPaused, startTime, endTime, pausedTime]);

	const getElapsedTime = (): string => {
		return displayTime;
	};

	const getStatusText = (): string => {
		if (isPaused) return '⏸ Waiting for approval...';
		if (isActive) return `⚡ ${loadingMessage}...`;
		return '';
	};

	// Don't show component if inactive and no tokens counted
	if (!isActive && completionTokens === 0) {
		return null;
	}

	return (
		<Box paddingX={1}>
			<Box gap={2}>
				<Text color="cyan">{getElapsedTime()}</Text>
				<Text color="green">{completionTokens} tokens</Text>
				{(isActive || isPaused) && (
					<Text color={isPaused ? 'yellow' : 'blue'}>{getStatusText()}</Text>
				)}
			</Box>
		</Box>
	);
}
