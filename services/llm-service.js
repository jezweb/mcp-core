/**
 * Generic LLM Service Interface - Provider-agnostic abstraction layer
 *
 * This module defines the core interfaces and types for the generic LLM provider system.
 * It abstracts away provider-specific details (OpenAI, Anthropic, etc.) to enable
 * a unified, extensible architecture for multiple LLM providers.
 *
 * Key Features:
 * - Provider-agnostic interface design
 * - Extensible capability system
 * - Generic request/response types
 * - Type-safe provider implementations
 * - Future-ready for multiple LLM providers
 */
import { MCPError, ErrorCodes, } from '../types/index.js';
/**
 * Provider Error Class
 * Standardized error handling for providers
 */
export class LLMProviderError extends MCPError {
    providerName;
    originalError;
    constructor(providerName, code, message, originalError, data) {
        super(code, `[${providerName}] ${message}`, {
            provider: providerName,
            originalError,
            ...data
        });
        this.providerName = providerName;
        this.originalError = originalError;
        this.name = 'LLMProviderError';
    }
}
/**
 * Helper function to create provider errors
 */
export function createProviderError(providerName, message, originalError, code = ErrorCodes.INTERNAL_ERROR) {
    return new LLMProviderError(providerName, code, message, originalError);
}
