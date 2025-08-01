/**
 * Base Prompt Handler - Abstract class for MCP prompt handlers
 *
 * This class provides the foundation for handling MCP prompts protocol requests.
 * Unlike tool handlers, prompt handlers deal with prompts/list and prompts/get methods.
 */
import { MCPError, ErrorCodes } from '../../types/index.js';
/**
 * Abstract base class for prompt handlers
 */
export class BasePromptHandler {
    constructor(context) {
        this.context = context;
    }
    /**
     * Template method that orchestrates validation and execution
     */
    async handle(params) {
        try {
            // Step 1: Validate input parameters
            const validationResult = this.validate(params);
            if (!validationResult.isValid) {
                throw validationResult.error;
            }
            // Step 2: Execute the prompt operation
            const result = await this.execute(params);
            // Step 3: Return successful result
            return result;
        }
        catch (error) {
            // Centralized error handling
            this.logError(error, params);
            throw error;
        }
    }
    /**
     * Centralized error logging
     */
    logError(error, params) {
        const errorInfo = {
            method: this.getMethodName(),
            requestId: this.context.requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
            params: this.sanitizeParamsForLogging(params),
            timestamp: new Date().toISOString()
        };
        console.error('[PromptHandler Error]', errorInfo);
    }
    /**
     * Sanitize parameters for logging (remove sensitive data)
     */
    sanitizeParamsForLogging(params) {
        if (!params || typeof params !== 'object') {
            return params;
        }
        const sanitized = { ...params };
        // Remove or mask sensitive fields
        const sensitiveFields = ['api_key', 'token', 'password', 'secret'];
        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        }
        return sanitized;
    }
    /**
     * Helper method to create validation errors
     */
    createValidationError(message, paramName) {
        const fullMessage = paramName
            ? `[${this.getMethodName()}] Parameter '${paramName}': ${message}`
            : `[${this.getMethodName()}] ${message}`;
        return new MCPError(ErrorCodes.INVALID_PARAMS, fullMessage);
    }
    /**
     * Helper method to create execution errors
     */
    createExecutionError(message, originalError) {
        const fullMessage = `[${this.getMethodName()}] Execution failed: ${message}`;
        return new MCPError(ErrorCodes.INTERNAL_ERROR, fullMessage, originalError ? { originalError } : undefined);
    }
}
