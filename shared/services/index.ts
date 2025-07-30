/**
 * Services Index - Centralized exports for all shared services
 * 
 * This module provides clean, tree-shakable exports for all shared services.
 * Enables both deployments to import services using @shared/services.
 */

// Export all services
export * from './openai-service.js';

// Re-export commonly used services for convenience
export { OpenAIService } from './openai-service.js';