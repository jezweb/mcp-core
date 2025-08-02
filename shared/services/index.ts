/**
 * Services Index - Centralized exports for all shared services
 *
 * This module provides clean, tree-shakable exports for all shared services.
 * Enables both deployments to import services using @shared/services.
 *
 * Note: OpenAIService is intentionally not exported here to maintain proper
 * encapsulation. It should only be used internally by the OpenAIProvider.
 */

// Export provider registry and LLM service
export * from './llm-service.js';
export * from './provider-registry.js';