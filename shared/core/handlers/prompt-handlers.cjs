/**
 * CommonJS version of Prompt Handlers for NPM package compatibility
 * 
 * This file provides CommonJS-compatible versions of the prompt handlers
 * that can be used by the NPM package while maintaining the same functionality
 * as the TypeScript version.
 */

/**
 * Create prompt handlers
 */
function createPromptHandlers(context) {
  return {
    'prompts/list': {
      context,
      async handle(params) {
        // Return empty prompts list for now
        return {
          prompts: []
        };
      }
    },
    'prompts/get': {
      context,
      async handle(params) {
        // Return empty prompt for now
        throw new Error('Prompt not found');
      }
    }
  };
}

module.exports = {
  createPromptHandlers
};