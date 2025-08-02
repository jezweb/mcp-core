/**
 * Resources Index - Centralized exports for all shared MCP resources
 * 
 * This module provides clean, tree-shakable exports for all MCP resources
 * including templates, examples, and documentation. Enables both deployments
 * to import resources using @shared/resources.
 */

// Import from TypeScript module (basic resources)
import {
  getResources as getResourcesBasic,
  getResource as getResourceBasic,
  getResourceContent as getResourceContentBasic,
  getResourcesByCategory as getResourcesByCategoryBasic,
  RESOURCE_URIS
} from './resources.js';

// Import from CommonJS module (enhanced resources with more functionality)
import {
  getAllResources as getAllResourcesEnhanced,
  getResource as getResourceEnhanced,
  getResourceContent as getResourceContentEnhanced,
  getResourcesByCategory as getResourcesByCategoryEnhanced,
  searchResources,
  getResourceStats
} from './resources.cjs';

// Export enhanced versions as primary exports
export const getAllResources = getAllResourcesEnhanced;
export const getResource = getResourceEnhanced;
export const getResourceContent = getResourceContentEnhanced;
export const getResourcesByCategory = getResourcesByCategoryEnhanced;

// Export additional enhanced functionality
export {
  searchResources,
  getResourceStats,
  RESOURCE_URIS
};

// Legacy exports for backward compatibility
export const getResources = getAllResourcesEnhanced;