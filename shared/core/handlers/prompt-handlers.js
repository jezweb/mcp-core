/**
 * Prompt Handlers - MCP prompts protocol implementation
 *
 * This module implements handlers for the MCP prompts protocol:
 * - prompts/list: List available prompts
 * - prompts/get: Get a specific prompt with generated messages
 */
import { BasePromptHandler } from './base-prompt-handler.js';
import { getAvailablePrompts, generatePromptMessages, hasPrompt } from '../../prompts/index.js';
import { paginateArray, createPaginationMetadata, PAGINATION_DEFAULTS } from '../pagination-utils.js';
/**
 * Handler for prompts/list requests
 */
export class PromptsListHandler extends BasePromptHandler {
    getMethodName() {
        return 'prompts/list';
    }
    validate(params) {
        // prompts/list has optional cursor parameter
        if (params && typeof params !== 'object') {
            return {
                isValid: false,
                error: this.createValidationError('Parameters must be an object')
            };
        }
        if (params?.cursor && typeof params.cursor !== 'string') {
            return {
                isValid: false,
                error: this.createValidationError('Cursor must be a string', 'cursor')
            };
        }
        return { isValid: true };
    }
    async execute(params) {
        try {
            // Get all available prompts
            const allPrompts = getAvailablePrompts();
            // Apply pagination
            const paginationParams = {
                cursor: params?.cursor,
                limit: PAGINATION_DEFAULTS.DEFAULT_LIMIT // Use default limit for prompts
            };
            const paginationResult = paginateArray(allPrompts, paginationParams);
            // Log pagination metadata for debugging
            const metadata = createPaginationMetadata(paginationParams, paginationResult);
            console.log('[PromptsListHandler] Pagination:', metadata);
            return {
                prompts: paginationResult.items,
                nextCursor: paginationResult.nextCursor
            };
        }
        catch (error) {
            throw this.createExecutionError(`Failed to list prompts: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
        }
    }
}
/**
 * Handler for prompts/get requests
 */
export class PromptsGetHandler extends BasePromptHandler {
    getMethodName() {
        return 'prompts/get';
    }
    validate(params) {
        if (!params || typeof params !== 'object') {
            return {
                isValid: false,
                error: this.createValidationError('Parameters object is required')
            };
        }
        if (!params.name || typeof params.name !== 'string') {
            return {
                isValid: false,
                error: this.createValidationError('Name is required and must be a string', 'name')
            };
        }
        if (params.arguments && typeof params.arguments !== 'object') {
            return {
                isValid: false,
                error: this.createValidationError('Arguments must be an object', 'arguments')
            };
        }
        // Validate that all argument values are strings (per MCP spec)
        if (params.arguments) {
            for (const [key, value] of Object.entries(params.arguments)) {
                if (typeof value !== 'string') {
                    return {
                        isValid: false,
                        error: this.createValidationError(`Argument '${key}' must be a string, got ${typeof value}`, 'arguments')
                    };
                }
            }
        }
        return { isValid: true };
    }
    async execute(params) {
        const { name, arguments: args = {} } = params;
        try {
            // Check if prompt exists
            if (!hasPrompt(name)) {
                throw this.createValidationError(`Prompt not found: ${name}`, 'name');
            }
            // Generate messages for the prompt
            const messages = generatePromptMessages(name, args);
            // Get prompt description (optional)
            const prompts = getAvailablePrompts();
            const prompt = prompts.find(p => p.name === name);
            const description = prompt?.description;
            return {
                description,
                messages
            };
        }
        catch (error) {
            // If it's already an MCPError, re-throw it
            if (error instanceof Error && error.name === 'MCPError') {
                throw error;
            }
            throw this.createExecutionError(`Failed to get prompt '${name}': ${error instanceof Error ? error.message : 'Unknown error'}`, error);
        }
    }
}
/**
 * Factory function to create prompt handlers
 */
export function createPromptHandlers(context) {
    return {
        'prompts/list': new PromptsListHandler(context),
        'prompts/get': new PromptsGetHandler(context)
    };
}
/**
 * Get all prompt handler method names
 */
export function getPromptHandlerMethods() {
    return ['prompts/list', 'prompts/get'];
}
/**
 * Check if a method is a prompt handler method
 */
export function isPromptHandlerMethod(method) {
    return getPromptHandlerMethods().includes(method);
}
