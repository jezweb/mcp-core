/**
 * Validation Index - Centralized exports for all shared validation utilities
 * 
 * This module provides clean, tree-shakable exports for all validation functions
 * and constants. Enables both deployments to import validation using @shared/validation.
 */

// Export all validation functions and constants
export * from './validation.js';

// Re-export commonly used validation functions for convenience
export {
  validateOpenAIId,
  validateModel,
  validateNumericRange,
  validateRequiredString,
  validateEnum,
  validateArray,
  validateMetadata,
  validateTools,
  validateToolResources,
  validateMessageRole,
  validatePaginationParams,
  validateCreateAssistantParams,
  SUPPORTED_MODELS,
  ID_PATTERNS
} from './validation.js';

// Export validation result interface
export type { ValidationResult } from './validation.js';