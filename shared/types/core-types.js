/**
 * Core Types - Shared type definitions for OpenAI Assistants MCP Server
 *
 * This module consolidates all common type definitions used across both
 * Cloudflare Workers and NPM package deployments.
 *
 * Consolidates 620 lines of duplicate type definitions.
 */
// Error types
export class MCPError extends Error {
    constructor(code, message, data) {
        super(message);
        this.code = code;
        this.data = data;
        this.name = 'MCPError';
    }
}
// Enhanced error creation helpers for JSON-RPC 2.0 compliance
export function createEnhancedError(legacyCode, message, additionalData) {
    const mapping = ErrorCodeMapping[legacyCode];
    if (mapping) {
        // Use standard JSON-RPC code with enhanced data
        const enhancedData = {
            originalCode: legacyCode,
            category: mapping.category,
            documentation: mapping.documentation,
            ...additionalData
        };
        return new MCPError(mapping.standardCode, message, enhancedData);
    }
    // Fallback for unmapped codes
    return new MCPError(legacyCode, message, additionalData);
}
// Helper to create standard JSON-RPC error responses
export function createStandardErrorResponse(id, code, message, data) {
    return {
        jsonrpc: '2.0',
        id,
        error: {
            code,
            message,
            data
        }
    };
}
// Helper to format OpenAI API errors with enhanced data
export function formatOpenAIError(httpStatus, openaiError, context) {
    let legacyCode;
    let message;
    switch (httpStatus) {
        case 401:
            legacyCode = LegacyErrorCodes.UNAUTHORIZED;
            message = 'Authentication failed. Please check your API key.';
            break;
        case 403:
            legacyCode = LegacyErrorCodes.FORBIDDEN;
            message = 'Access forbidden. Please check your permissions.';
            break;
        case 404:
            legacyCode = LegacyErrorCodes.NOT_FOUND;
            message = 'Resource not found. Please check the ID and try again.';
            break;
        case 429:
            legacyCode = LegacyErrorCodes.RATE_LIMITED;
            message = 'Rate limit exceeded. Please wait and try again.';
            break;
        default:
            return new MCPError(ErrorCodes.INTERNAL_ERROR, openaiError?.error?.message || `HTTP ${httpStatus}: Request failed`, {
                httpStatus,
                openaiError,
                context
            });
    }
    return createEnhancedError(legacyCode, message, {
        httpStatus,
        openaiError,
        context,
        retryAfter: httpStatus === 429 ? '60s' : undefined
    });
}
// JSON-RPC 2.0 Standard Error Codes
export const ErrorCodes = {
    // Standard JSON-RPC 2.0 error codes
    PARSE_ERROR: -32700,
    INVALID_REQUEST: -32600,
    METHOD_NOT_FOUND: -32601,
    INVALID_PARAMS: -32602,
    INTERNAL_ERROR: -32603,
    // Legacy custom codes mapped to standard codes for backward compatibility
    // These now map to standard JSON-RPC codes with enhanced info in error.data
    UNAUTHORIZED: -32603, // Maps to Internal Error (was -32001)
    FORBIDDEN: -32603, // Maps to Internal Error (was -32002)
    NOT_FOUND: -32602, // Maps to Invalid Params (was -32003)
    RATE_LIMITED: -32602, // Maps to Invalid Params (was -32004)
};
// Legacy error codes for backward compatibility and enhanced error data
export const LegacyErrorCodes = {
    UNAUTHORIZED: -32001,
    FORBIDDEN: -32002,
    NOT_FOUND: -32003,
    RATE_LIMITED: -32004,
};
// Error code mapping for enhanced error data
export const ErrorCodeMapping = {
    [LegacyErrorCodes.UNAUTHORIZED]: {
        standardCode: ErrorCodes.UNAUTHORIZED,
        category: 'authentication',
        documentation: 'https://docs.openai.com/api-reference/authentication'
    },
    [LegacyErrorCodes.FORBIDDEN]: {
        standardCode: ErrorCodes.FORBIDDEN,
        category: 'authorization',
        documentation: 'https://docs.openai.com/api-reference/errors'
    },
    [LegacyErrorCodes.NOT_FOUND]: {
        standardCode: ErrorCodes.NOT_FOUND,
        category: 'resource',
        documentation: 'https://docs.openai.com/api-reference/assistants'
    },
    [LegacyErrorCodes.RATE_LIMITED]: {
        standardCode: ErrorCodes.RATE_LIMITED,
        category: 'rate_limiting',
        documentation: 'https://docs.openai.com/api-reference/rate-limits'
    },
};
