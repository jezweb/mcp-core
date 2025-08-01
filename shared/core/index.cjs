/**
 * CommonJS version of Shared Core Index for NPM package compatibility
 * 
 * This file provides CommonJS-compatible versions of the shared core components
 * that can be used by the NPM package while maintaining the same functionality
 * as the TypeScript version.
 */

// Import all the CommonJS versions of the components
const { BaseMCPHandler } = require('./base-mcp-handler.cjs');
const { 
  TransportAdapter,
  HTTPTransportAdapter,
  StdioTransportAdapter,
  CloudflareWorkerTransportAdapter,
  RequestRouter,
  ProxyTransportAdapter,
  LocalDevTransportAdapter
} = require('./transport-adapters.cjs');

// Import handler system components
const { setupHandlerSystem, generateToolDefinitions } = require('./handlers/index.cjs');
const { 
  paginateArray,
  validatePaginationParams,
  createPaginationMetadata,
  PAGINATION_DEFAULTS
} = require('./pagination-utils.cjs');

// Export all components
module.exports = {
  // Core infrastructure
  BaseMCPHandler,
  
  // Transport adapters
  TransportAdapter,
  HTTPTransportAdapter,
  StdioTransportAdapter,
  CloudflareWorkerTransportAdapter,
  RequestRouter,
  ProxyTransportAdapter,
  LocalDevTransportAdapter,
  
  // Handler system
  setupHandlerSystem,
  generateToolDefinitions,
  
  // Pagination utilities
  paginateArray,
  validatePaginationParams,
  createPaginationMetadata,
  PAGINATION_DEFAULTS,
  
  // System info
  HANDLER_SYSTEM_VERSION: '1.0.0-phase1',
  SYSTEM_INFO: {
    version: '1.0.0-phase1',
    totalHandlers: 22,
    categories: ['assistant', 'thread', 'message', 'run', 'run-step'],
    description: 'Modular tool handler system using Strategy pattern',
    phase: 'Phase 1 - Foundational Architecture'
  }
};