/**
 * Base Prompt Handler - Abstract class for MCP prompt handlers
 * 
 * This class provides the foundation for handling MCP prompts protocol requests.
 * Unlike tool handlers, prompt handlers deal with prompts/list and prompts/get methods.
 */

import { MCPError, ErrorCodes } from '../../types/index.js';
import { ValidationResult } from '../../validation/index.js';

/**
 * Interface for prompt handler execution context
 */
export interface PromptHandlerContext {
  requestId: string | number | null;
}

/**
 * Abstract base class for prompt handlers
 */
export abstract class BasePromptHandler {
  protected context: PromptHandlerContext;

  constructor(context: PromptHandlerContext) {
    this.context = context;
  }

  /**
   * Template method that orchestrates validation and execution
   */
  async handle(params: any): Promise<any> {
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
    } catch (error) {
      // Centralized error handling
      this.logError(error, params);
      throw error;
    }
  }

  /**
   * Abstract method: Validate input parameters
   */
  abstract validate(params: any): ValidationResult;

  /**
   * Abstract method: Execute the prompt operation
   */
  abstract execute(params: any): Promise<any>;

  /**
   * Get the method name this handler is responsible for
   */
  abstract getMethodName(): string;

  /**
   * Centralized error logging
   */
  protected logError(error: any, params: any): void {
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
  protected sanitizeParamsForLogging(params: any): any {
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
  protected createValidationError(message: string, paramName?: string): MCPError {
    const fullMessage = paramName 
      ? `[${this.getMethodName()}] Parameter '${paramName}': ${message}`
      : `[${this.getMethodName()}] ${message}`;
    
    return new MCPError(ErrorCodes.INVALID_PARAMS, fullMessage);
  }

  /**
   * Helper method to create execution errors
   */
  protected createExecutionError(message: string, originalError?: any): MCPError {
    const fullMessage = `[${this.getMethodName()}] Execution failed: ${message}`;
    
    return new MCPError(
      ErrorCodes.INTERNAL_ERROR, 
      fullMessage,
      originalError ? { originalError } : undefined
    );
  }
}