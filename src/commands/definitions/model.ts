import { CommandDefinition, CommandContext } from '../base.js';

export const modelCommand: CommandDefinition = {
  command: 'model',
  description: 'Select your OpenRouter model',
  handler: ({ setShowModelSelector }: CommandContext) => {
    if (setShowModelSelector) {
      setShowModelSelector(true);
    }
  }
};