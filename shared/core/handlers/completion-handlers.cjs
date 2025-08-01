/**
 * CommonJS version of Completion Handlers for NPM package compatibility
 * 
 * This file provides CommonJS-compatible versions of the completion handlers
 * that can be used by the NPM package while maintaining the same functionality
 * as the TypeScript version.
 */

/**
 * Create completion handlers
 */
function createCompletionHandlers(context) {
  return {
    'completion/complete': {
      context,
      async handle(params) {
        // Return empty completion for now
        return {
          completion: {
            values: [],
            total: 0,
            hasMore: false
          }
        };
      }
    }
  };
}

module.exports = {
  createCompletionHandlers
};