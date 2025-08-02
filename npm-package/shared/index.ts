/**
 * Shared Library Index - Main entry point for all shared modules
 * 
 * This module provides centralized access to all shared libraries including
 * types, validation, resources, and services. Enables clean imports across
 * both Cloudflare Workers and NPM package deployments.
 * 
 * Phase 2A Foundation: Consolidates 2,185 lines of duplicate code
 * - Types: 625 lines (620 core + 5 Cloudflare-specific)
 * - Validation: 562 lines
 * - Resources: 609 lines  
 * - Services: 249 lines
 * - Infrastructure: 140+ lines of export/index files
 */

// Export all shared modules
export * from './types/index.js';
export * from './validation/index.js';
export * from './resources/index.js';
export * from './services/index.js';

// Re-export commonly used items for convenience
export type {
  // Core types
  JsonRpcRequest,
  JsonRpcResponse,
  MCPRequest,
  MCPResponse,
  MCPTool,
  MCPResource,
  
  // OpenAI types
  Assistant,
  Thread,
  Message,
  Run,
  RunStep,
  
  // Request types
  CreateAssistantRequest,
  CreateThreadRequest,
  CreateMessageRequest,
  CreateRunRequest,
  
  // Response types
  ListAssistantsResponse,
  ListMessagesResponse,
  ListRunsResponse,
  ListRunStepsResponse,
  
  // Cloudflare types
  Env
} from './types/index.js';

export {
  // Error handling
  MCPError,
  ErrorCodes
} from './types/index.js';

// Export validation types and functions
export type { ValidationResult } from './validation/index.js';

export {
  validateOpenAIId,
  validateModel,
  validateCreateAssistantParams,
  validateNumericRange,
  validateRequiredString,
  validateEnum,
  validateArray,
  validateMetadata,
  validateTools,
  validateToolResources,
  validateMessageRole,
  validatePaginationParams,
  SUPPORTED_MODELS,
  ID_PATTERNS
} from './validation/index.js';

// Export resources
export {
  getAllResources,
  getResource,
  getResourceContent,
  getResourcesByCategory,
  searchResources,
  getResourceStats
} from './resources/index.js';

// Export services
// Note: OpenAIService is intentionally not exported to maintain proper encapsulation.
// It should only be used internally by the OpenAIProvider.
export * from './services/index.js';