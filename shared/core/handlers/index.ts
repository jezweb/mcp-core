/**
 * Handler Index - Central export point for all tool handlers
 * 
 * This file provides:
 * - Convenient imports for all handler categories
 * - Factory function to create all handlers at once
 * - Type-safe handler registration
 * - Easy integration with the ToolRegistry
 */

import { BaseToolHandler, ToolHandlerContext } from './base-tool-handler.js';
import { createAssistantHandlers } from './assistant-handlers.js';
import { createThreadHandlers } from './thread-handlers.js';
import { createMessageHandlers } from './message-handlers.js';
import { createRunHandlers } from './run-handlers.js';
import { createRunStepHandlers } from './run-step-handlers.js';

// Re-export base classes and interfaces
export { BaseToolHandler } from './base-tool-handler.js';
export type { ToolHandlerContext } from './base-tool-handler.js';

// Re-export individual handler creators
export { createAssistantHandlers } from './assistant-handlers.js';
export { createThreadHandlers } from './thread-handlers.js';
export { createMessageHandlers } from './message-handlers.js';
export { createRunHandlers } from './run-handlers.js';
export { createRunStepHandlers } from './run-step-handlers.js';

/**
 * Create all tool handlers for the MCP server
 * 
 * This factory function creates and returns all handlers organized by category.
 * It provides a single point to instantiate the complete handler system.
 * 
 * @param context - The handler context containing OpenAI service and request info
 * @returns Object containing all handlers organized by category
 */
export function createAllHandlers(context: ToolHandlerContext): {
  assistant: Record<string, BaseToolHandler>;
  thread: Record<string, BaseToolHandler>;
  message: Record<string, BaseToolHandler>;
  run: Record<string, BaseToolHandler>;
  runStep: Record<string, BaseToolHandler>;
  all: Record<string, BaseToolHandler>;
} {
  const assistantHandlers = createAssistantHandlers(context);
  const threadHandlers = createThreadHandlers(context);
  const messageHandlers = createMessageHandlers(context);
  const runHandlers = createRunHandlers(context);
  const runStepHandlers = createRunStepHandlers(context);

  // Combine all handlers into a single flat object
  const allHandlers = {
    ...assistantHandlers,
    ...threadHandlers,
    ...messageHandlers,
    ...runHandlers,
    ...runStepHandlers
  };

  return {
    assistant: assistantHandlers,
    thread: threadHandlers,
    message: messageHandlers,
    run: runHandlers,
    runStep: runStepHandlers,
    all: allHandlers
  };
}

/**
 * Get a flat map of all tool handlers
 * 
 * Convenience function that returns just the flat map of all handlers,
 * which is what the ToolRegistry expects for batch registration.
 * 
 * @param context - The handler context
 * @returns Flat map of tool name to handler instance
 */
export function createFlatHandlerMap(context: ToolHandlerContext): Record<string, BaseToolHandler> {
  return createAllHandlers(context).all;
}

/**
 * Handler categories and their tool counts
 * Useful for validation and introspection
 */
export const HANDLER_CATEGORIES = {
  assistant: ['assistant-create', 'assistant-list', 'assistant-get', 'assistant-update', 'assistant-delete'],
  thread: ['thread-create', 'thread-get', 'thread-update', 'thread-delete'],
  message: ['message-create', 'message-list', 'message-get', 'message-update', 'message-delete'],
  run: ['run-create', 'run-list', 'run-get', 'run-update', 'run-cancel', 'run-submit-tool-outputs'],
  runStep: ['run-step-list', 'run-step-get']
} as const;

/**
 * Total number of tools handled by the system
 */
export const TOTAL_TOOL_COUNT = Object.values(HANDLER_CATEGORIES).reduce(
  (total, tools) => total + tools.length, 
  0
);

/**
 * Validate that all expected tools have handlers
 * 
 * @param handlers - The handler map to validate
 * @returns Validation result with missing tools if any
 */
export function validateHandlerCompleteness(handlers: Record<string, BaseToolHandler>): {
  isComplete: boolean;
  missingTools: string[];
  extraTools: string[];
} {
  const expectedTools = Object.values(HANDLER_CATEGORIES).flat();
  const actualTools = Object.keys(handlers);
  
  const missingTools = expectedTools.filter(tool => !actualTools.includes(tool));
  const extraTools = actualTools.filter(tool => !(expectedTools as string[]).includes(tool));
  
  return {
    isComplete: missingTools.length === 0,
    missingTools,
    extraTools
  };
}