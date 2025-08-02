/**
 * Base Tool Handler - Abstract class defining the interface for all tool handlers
 *
 * This class implements the Strategy pattern for tool handling, providing:
 * - Consistent validation and execution interface
 * - Error handling and logging capabilities
 * - Template method pattern for handle() operation
 *
 * Each concrete handler must implement:
 * - validate(): Validates input arguments
 * - execute(): Performs the actual tool operation
 */
import { MCPError, ErrorCodes } from '../../types/index.js';
/**
 * Abstract base class for all tool handlers
 *
 * Implements the Template Method pattern:
 * 1. handle() orchestrates the validation + execution flow
 * 2. Concrete handlers implement validate() and execute()
 * 3. Error handling and logging are centralized
 */
export class BaseToolHandler {
    context;
    constructor(context) {
        this.context = context;
    }
    /**
     * Template method that orchestrates validation and execution
     * This is the main entry point for tool handling
     */
    async handle(args) {
        try {
            // Step 1: Validate input arguments
            const validationResult = this.validate(args);
            if (!validationResult.isValid) {
                throw validationResult.error;
            }
            // Step 2: Execute the tool operation
            const result = await this.execute(args);
            // Step 3: Return successful result
            return result;
        }
        catch (error) {
            // Centralized error handling
            this.logError(error, args);
            throw error;
        }
    }
    /**
     * Centralized error logging
     * Can be extended for more sophisticated logging in the future
     */
    logError(error, args) {
        const errorInfo = {
            tool: this.getToolName(),
            category: this.getCategory(),
            requestId: this.context.requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
            args: this.sanitizeArgsForLogging(args),
            timestamp: new Date().toISOString()
        };
        // For now, just log to console
        // In the future, this could be extended to use structured logging
        console.error('[ToolHandler Error]', errorInfo);
    }
    /**
     * Sanitize arguments for logging (remove sensitive data)
     */
    sanitizeArgsForLogging(args) {
        if (!args || typeof args !== 'object') {
            return args;
        }
        const sanitized = { ...args };
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
     * Helper method to create validation errors with consistent formatting
     */
    createValidationError(message, paramName) {
        const fullMessage = paramName
            ? `[${this.getToolName()}] Parameter '${paramName}': ${message}`
            : `[${this.getToolName()}] ${message}`;
        return new MCPError(ErrorCodes.INVALID_PARAMS, fullMessage);
    }
    /**
     * Helper method to create execution errors with consistent formatting
     */
    createExecutionError(message, originalError) {
        const fullMessage = `[${this.getToolName()}] Execution failed: ${message}`;
        return new MCPError(ErrorCodes.INTERNAL_ERROR, fullMessage, originalError ? { originalError } : undefined);
    }
}
