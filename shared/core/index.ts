/**
 * Shared Core Index - Main entry point for the refactored handler system
 * 
 * This file provides the complete foundational architecture for decomposing
 * the monolithic handleToolsCall method into a modular, maintainable system.
 * 
 * Key Components:
 * - BaseToolHandler: Abstract base class for all tool handlers
 * - ToolRegistry: Central registry for managing and executing handlers
 * - Handler Categories: Organized handlers for each tool type
 * - Factory Functions: Easy setup and configuration
 * 
 * Usage Example:
 * ```typescript
 * import { ToolRegistry, createFlatHandlerMap } from './shared/core/index.js';
 * 
 * const context = { openaiService, toolName: '', requestId: 1 };
 * const registry = new ToolRegistry(context);
 * const handlers = createFlatHandlerMap(context);
 * registry.registerBatch(handlers);
 * 
 * // Execute a tool
 * const result = await registry.execute('assistant-create', args);
 * ```
 */

// Core infrastructure exports
export { BaseToolHandler } from './handlers/base-tool-handler.js';
export type { ToolHandlerContext } from './handlers/base-tool-handler.js';
export { ToolRegistry } from './tool-registry.js';
export type { ToolRegistryStats } from './tool-registry.js';
export { BaseMCPHandler } from './base-mcp-handler.js';
export type { BaseMCPHandlerConfig } from './base-mcp-handler.js';
export type { TransportAdapter } from './transport-adapters.js';
export {
  HTTPTransportAdapter,
  StdioTransportAdapter,
  CloudflareWorkerTransportAdapter,
  RequestRouter,
  ProxyTransportAdapter,
  LocalDevTransportAdapter
} from './transport-adapters.js';

// Handler exports
export {
  createAllHandlers,
  createFlatHandlerMap,
  createAssistantHandlers,
  createThreadHandlers,
  createMessageHandlers,
  createRunHandlers,
  createRunStepHandlers,
  HANDLER_CATEGORIES,
  TOTAL_TOOL_COUNT,
  validateHandlerCompleteness
} from './handlers/index.js';

// Tool definitions exports
export {
  generateToolDefinitions,
  validateToolDefinitions
} from './tool-definitions.js';

// Pagination utilities exports
export * from './pagination-utils.js';

// Import types for internal use
import { ToolHandlerContext } from './handlers/base-tool-handler.js';
import { ToolRegistry } from './tool-registry.js';
import {
  createFlatHandlerMap,
  validateHandlerCompleteness,
  TOTAL_TOOL_COUNT,
  HANDLER_CATEGORIES
} from './handlers/index.js';

// Individual handler class exports (for advanced usage)
export {
  AssistantCreateHandler,
  AssistantListHandler,
  AssistantGetHandler,
  AssistantUpdateHandler,
  AssistantDeleteHandler
} from './handlers/assistant-handlers.js';

export {
  ThreadCreateHandler,
  ThreadGetHandler,
  ThreadUpdateHandler,
  ThreadDeleteHandler
} from './handlers/thread-handlers.js';

export {
  MessageCreateHandler,
  MessageListHandler,
  MessageGetHandler,
  MessageUpdateHandler,
  MessageDeleteHandler
} from './handlers/message-handlers.js';

export {
  RunCreateHandler,
  RunListHandler,
  RunGetHandler,
  RunUpdateHandler,
  RunCancelHandler,
  RunSubmitToolOutputsHandler
} from './handlers/run-handlers.js';

export {
  RunStepListHandler,
  RunStepGetHandler
} from './handlers/run-step-handlers.js';

/**
 * Complete setup function for the handler system
 * 
 * This is the main entry point for setting up the entire handler architecture.
 * It creates the registry, instantiates all handlers, and registers them.
 * 
 * @param context - The handler context containing OpenAI service and request info
 * @returns Configured ToolRegistry ready for use
 */
export function setupHandlerSystem(context: ToolHandlerContext): ToolRegistry {
  const registry = new ToolRegistry(context);
  const handlers = createFlatHandlerMap(context);
  
  // Validate that we have all expected handlers
  const validation = validateHandlerCompleteness(handlers);
  if (!validation.isComplete) {
    console.warn('[HandlerSystem] Missing handlers:', validation.missingTools);
    if (validation.extraTools.length > 0) {
      console.warn('[HandlerSystem] Extra handlers:', validation.extraTools);
    }
  }
  
  // Register all handlers
  registry.registerBatch(handlers);
  
  console.log(`[HandlerSystem] Initialized with ${Object.keys(handlers).length} handlers`);
  console.log('[HandlerSystem] Registry stats:', registry.getStats());
  
  return registry;
}

/**
 * Version information for the handler system
 */
export const HANDLER_SYSTEM_VERSION = '1.0.0-phase1';

/**
 * System metadata
 */
export const SYSTEM_INFO = {
  version: HANDLER_SYSTEM_VERSION,
  totalHandlers: TOTAL_TOOL_COUNT,
  categories: Object.keys(HANDLER_CATEGORIES),
  description: 'Modular tool handler system using Strategy pattern',
  phase: 'Phase 1 - Foundational Architecture'
} as const;