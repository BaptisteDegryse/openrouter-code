import React, {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import {
	fetchOpenRouterModels,
	getDefaultModels,
	OpenRouterModel,
	formatModelForDisplay,
	formatModelCostInfo,
	filterModelsWithTools,
	filterModelsWithoutTools,
	supportsTools,
} from '../../../utils/openrouter-models.js';

interface ModelSelectorProps {
	onSubmit: (model: string) => void;
	onCancel: () => void;
	currentModel?: string;
	filter?: 'all' | 'tools' | 'without-tools';
}

export default function ModelSelector({
	onSubmit,
	onCancel,
	currentModel,
	filter = 'all',
}: ModelSelectorProps) {
	const [models, setModels] = useState<OpenRouterModel[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [searchQuery, setSearchQuery] = useState('');
	const [scrollOffset, setScrollOffset] = useState(0);

	const MAX_VISIBLE_ITEMS = 10;

	useEffect(() => {
		const loadModels = async () => {
			try {
				setLoading(true);
				let fetchedModels = await fetchOpenRouterModels();

				// Apply filter
				if (filter === 'tools') {
					fetchedModels = filterModelsWithTools(fetchedModels);
				} else if (filter === 'without-tools') {
					fetchedModels = filterModelsWithoutTools(fetchedModels);
				}

				setModels(fetchedModels);

				// Find current model index after models are loaded
				if (currentModel) {
					const currentIndex = fetchedModels.findIndex(
						model => model.id === currentModel,
					);
					if (currentIndex >= 0) {
						setSelectedIndex(currentIndex);
					}
				}
			} catch (error) {
				console.warn('Failed to load models, using defaults:', error);
				let defaultModels = getDefaultModels();

				// Apply filter to defaults as well
				if (filter === 'tools') {
					defaultModels = filterModelsWithTools(defaultModels);
				} else if (filter === 'without-tools') {
					defaultModels = filterModelsWithoutTools(defaultModels);
				}

				setModels(defaultModels);

				if (currentModel) {
					const currentIndex = defaultModels.findIndex(
						model => model.id === currentModel,
					);
					if (currentIndex >= 0) {
						setSelectedIndex(currentIndex);
					}
				}
			} finally {
				setLoading(false);
			}
		};

		loadModels();
	}, [currentModel, filter]);

	// Filter models based on search query
	const filteredModels = models.filter(
		model =>
			model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(model.description &&
				model.description.toLowerCase().includes(searchQuery.toLowerCase())),
	);

	// Calculate visible models based on scroll offset
	const visibleModels = filteredModels.slice(
		scrollOffset,
		scrollOffset + MAX_VISIBLE_ITEMS,
	);

	// Reset selected index when search changes
	React.useEffect(() => {
		setSelectedIndex(0);
		setScrollOffset(0);
	}, [searchQuery]);

	// Adjust scroll when navigating beyond visible items
	React.useEffect(() => {
		if (selectedIndex < scrollOffset) {
			setScrollOffset(selectedIndex);
		} else if (selectedIndex >= scrollOffset + MAX_VISIBLE_ITEMS) {
			setScrollOffset(selectedIndex - MAX_VISIBLE_ITEMS + 1);
		}
	}, [selectedIndex, scrollOffset]);

	useInput((input, key) => {
		if (loading || models.length === 0) return;

		if (key.return) {
			if (filteredModels.length > 0) {
				onSubmit(filteredModels[selectedIndex].id);
			}
			return;
		}

		if (key.escape) {
			if (searchQuery) {
				setSearchQuery('');
			} else {
				onCancel();
			}
			return;
		}

		if (key.upArrow) {
			setSelectedIndex(prev => Math.max(0, prev - 1));
			return;
		}

		if (key.downArrow) {
			setSelectedIndex(prev => Math.min(filteredModels.length - 1, prev + 1));
			return;
		}

		if (key.ctrl && input === 'c') {
			onCancel();
			return;
		}

		if (key.backspace || key.delete) {
			setSearchQuery(prev => prev.slice(0, -1));
			return;
		}

		// Handle regular character input for search
		if (
			input &&
			!key.ctrl &&
			!key.meta &&
			input.length === 1 &&
			input.match(/[\w\s-./]/)
		) {
			setSearchQuery(prev => prev + input);
			return;
		}
	});

	if (loading) {
		return (
			<Box flexDirection="column">
				<Box marginBottom={1}>
					<Text color="cyan" bold>
						Select Model
					</Text>
				</Box>
				<Box marginBottom={1}>
					<Text color="yellow">Loading OpenRouter models...</Text>
				</Box>
			</Box>
		);
	}

	const getTitle = () => {
		if (filter === 'tools') return 'Select Model (Tools Supported)';
		if (filter === 'without-tools') return 'Select Model (No Tools)';
		return 'Select Model';
	};

	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text color="cyan" bold>
					{getTitle()}
				</Text>
			</Box>

			<Box marginBottom={1}>
				<Text color="gray" dimColor>
					Choose a model for your conversation. The chat will be cleared when
					you switch models.
				</Text>
			</Box>

			<Box marginBottom={1}>
				<Text color="yellow">Search: </Text>
				<Text color="white" backgroundColor="gray">
					{searchQuery || ' '}
				</Text>
				<Text color="gray"> ({filteredModels.length} matches)</Text>
			</Box>

			<Box marginBottom={1}>
				<Text color="gray" dimColor>
					Visit <Text underline>https://openrouter.ai/models</Text> for more
					information.
				</Text>
			</Box>

			{filteredModels.length === 0 ? (
				<Box marginBottom={1}>
					<Text color="red">No models found matching "{searchQuery}"</Text>
				</Box>
			) : (
				<Box flexDirection="column" marginBottom={1}>
					{scrollOffset > 0 && (
						<Box marginBottom={1}>
							<Text color="gray" dimColor>
								↑ {scrollOffset} more above...
							</Text>
						</Box>
					)}

					{visibleModels.map((model, visibleIndex) => {
						const actualIndex = scrollOffset + visibleIndex;
						const isSelected = actualIndex === selectedIndex;
						const costInfo = formatModelCostInfo(model);
						const contextInfo = model.context_length
							? `${(model.context_length / 1000).toFixed(0)}k ctx`
							: '';
						const toolInfo = supportsTools(model) ? '[Tools]' : '';

						return (
							<Box
								key={model.id}
								flexDirection="column"
								marginBottom={visibleIndex === visibleModels.length - 1 ? 0 : 1}
							>
								{/* Main model name row */}
								<Box>
									<Text
										color={isSelected ? 'white' : 'white'}
										backgroundColor={isSelected ? 'blue' : undefined}
										bold={isSelected}
									>
										{isSelected ? '> ' : '  '}
										{model.name}
										{model.id === currentModel ? ' (current)' : ''}
									</Text>
								</Box>

								{/* Cost and details row */}
								<Box marginLeft={2}>
									<Text
										color={isSelected ? 'cyan' : 'gray'}
										dimColor={!isSelected}
									>
										{costInfo}
										{contextInfo && ` • ${contextInfo}`}
										{toolInfo && ` • ${toolInfo}`}
									</Text>
								</Box>

								{/* Description when selected */}
								{isSelected && model.description && (
									<Box marginLeft={2} marginTop={0}>
										<Text color="yellow" dimColor>
											{model.description}
										</Text>
									</Box>
								)}
							</Box>
						);
					})}

					{scrollOffset + MAX_VISIBLE_ITEMS < filteredModels.length && (
						<Box marginTop={1}>
							<Text color="gray" dimColor>
								↓ {filteredModels.length - scrollOffset - MAX_VISIBLE_ITEMS}{' '}
								more below...
							</Text>
						</Box>
					)}
				</Box>
			)}

			<Box marginBottom={1}>
				<Text color="gray" dimColor>
					Type to search • ↑/↓ navigate • Enter select • Escape{' '}
					{searchQuery ? 'clear' : 'cancel'}
				</Text>
			</Box>
		</Box>
	);
}
