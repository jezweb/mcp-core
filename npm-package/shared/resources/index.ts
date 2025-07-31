/**
 * Resources Index - Centralized exports for all shared MCP resources
 * 
 * This module provides clean, tree-shakable exports for all MCP resources
 * including templates, examples, and documentation. Enables both deployments
 * to import resources using @shared/resources.
 */

// Import from CommonJS module and re-export as ES modules
import {
  getAllResources,
  getResource,
  getResourceContent,
  getResourcesByCategory,
  searchResources,
  getResourceStats
} from './resources.cjs';

// Export all resource functions and data
export {
  getAllResources,
  getResource,
  getResourceContent,
  getResourcesByCategory,
  searchResources,
  getResourceStats
};

// Legacy exports for backward compatibility
export const getResources = getAllResources;