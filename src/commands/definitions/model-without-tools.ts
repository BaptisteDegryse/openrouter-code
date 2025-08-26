import {CommandDefinition, CommandContext} from '../base.js';
import {clearModelCache} from '../../utils/openrouter-models.js';

export const modelWithoutToolsCommand: CommandDefinition = {
	command: 'model-without-tools',
	description: 'Select OpenRouter models that do not support tools',
	handler: ({setShowModelSelector, setModelFilter}: CommandContext) => {
		// Clear the models cache to ensure fresh models are fetched
		clearModelCache();

		if (setShowModelSelector && setModelFilter) {
			setModelFilter('without-tools');
			setShowModelSelector(true);
		}
	},
};
