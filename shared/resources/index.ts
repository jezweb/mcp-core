/**
 * Resources Index - Centralized exports for all shared MCP resources
 * 
 * This module provides clean, tree-shakable exports for all MCP resources
 * including templates, examples, and documentation. Enables both deployments
 * to import resources using @shared/resources.
 */

// Export all resource functions and data
export * from './resources.js';

// Re-export commonly used resources for convenience
export {
  mcpResources,
  resourceContent,
  getResourceContent
} from './resources.js';