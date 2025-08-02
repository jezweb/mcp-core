/**
 * Resources Index - Centralized exports for all shared MCP resources
 * 
 * This module provides clean, tree-shakable exports for all MCP resources
 * including templates, examples, and documentation. Enables both deployments
 * to import resources using @shared/resources.
 */

// Import from TypeScript module
import {
  getResources,
  getResource,
  getResourceContent,
  getResourcesByCategory,
  RESOURCE_URIS
} from './resources.js';

// Export all functions
export const getAllResources = getResources;
export {
  getResource,
  getResourceContent,
  getResourcesByCategory,
  RESOURCE_URIS
};

// Add placeholder functions for enhanced functionality that was in .cjs
export function searchResources(query: string) {
  const allResources = getResources();
  return allResources.filter((resource: any) =>
    resource.name?.toLowerCase().includes(query.toLowerCase()) ||
    resource.description?.toLowerCase().includes(query.toLowerCase())
  );
}

export function getResourceStats() {
  const allResources = getResources();
  return {
    total: allResources.length,
    categories: [...new Set(allResources.map((r: any) => r.category))].length
  };
}

// Legacy exports for backward compatibility
export { getResources };