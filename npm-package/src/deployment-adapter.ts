/**
 * Deployment Adapter for NPM Package
 * Provides compatibility layer between unified shared/core and NPM package deployment
 */

// Re-export simplified interfaces for NPM package compatibility
export interface TransportAdapter {
  /** Handle transport-specific request preprocessing */
  preprocessRequest?(request: any): Promise<any>;
  /** Handle transport-specific response postprocessing */
  postprocessResponse?(response: any): Promise<any>;
  /** Handle transport-specific error handling */
  handleError?(error: Error): Promise<any>;
}

// Simplified setup function that matches NPM package expectations
export function setupHandlerSystem() {
  // Import the full system from shared/core but expose simplified interface
  const { ToolRegistry, generateToolDefinitions, createFlatHandlerMap, validateHandlerCompleteness, TOTAL_TOOL_COUNT, HANDLER_CATEGORIES } = require('@shared/core/index.js');
  
  return {
    ToolRegistry,
    generateToolDefinitions,
    createFlatHandlerMap,
    validateHandlerCompleteness,
    TOTAL_TOOL_COUNT,
    HANDLER_CATEGORIES
  };
}

// Export compatibility functions
export { ToolRegistry, generateToolDefinitions } from '@shared/core/index.js';
