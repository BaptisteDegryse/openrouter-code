import {CommandDefinition, CommandContext} from '../base.js';
import {clearModelCache} from '../../utils/openrouter-models.js';

export const modelCommand: CommandDefinition = {
	command: 'model',
	description: 'Select your OpenRouter model',
	handler: ({setShowModelSelector}: CommandContext) => {
		// Clear the models cache to ensure fresh models are fetched
		clearModelCache();

		if (setShowModelSelector) {
			setShowModelSelector(true);
		}
	},
};
