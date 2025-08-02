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

import { MCPError, ErrorCodes, LLMProvider } from '../../types/index.js';
import { ValidationResult } from '../../validation/index.js';

/**
 * Interface for tool handler execution context
 */
export interface ToolHandlerContext {
  provider: LLMProvider;
  toolName: string;
  requestId: string | number | null;
}

/**
 * Interface for tool execution result
 */
export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Abstract base class for all tool handlers
 * 
 * Implements the Template Method pattern:
 * 1. handle() orchestrates the validation + execution flow
 * 2. Concrete handlers implement validate() and execute()
 * 3. Error handling and logging are centralized
 */
export abstract class BaseToolHandler {
  protected context: ToolHandlerContext;

  constructor(context: ToolHandlerContext) {
    this.context = context;
  }

  /**
   * Template method that orchestrates validation and execution
   * This is the main entry point for tool handling
   */
  async handle(args: any): Promise<any> {
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
    } catch (error) {
      // Centralized error handling
      this.logError(error, args);
      throw error;
    }
  }

  /**
   * Abstract method: Validate input arguments
   * Each handler must implement its specific validation logic
   */
  abstract validate(args: any): ValidationResult;

  /**
   * Abstract method: Execute the tool operation
   * Each handler must implement its specific execution logic
   */
  abstract execute(args: any): Promise<any>;

  /**
   * Get the tool name this handler is responsible for
   */
  abstract getToolName(): string;

  /**
   * Get the tool category (e.g., 'assistant', 'thread', 'message', 'run', 'run-step')
   */
  abstract getCategory(): string;

  /**
   * Centralized error logging
   * Can be extended for more sophisticated logging in the future
   */
  protected logError(error: any, args: any): void {
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
  protected sanitizeArgsForLogging(args: any): any {
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
  protected createValidationError(message: string, paramName?: string): MCPError {
    const fullMessage = paramName 
      ? `[${this.getToolName()}] Parameter '${paramName}': ${message}`
      : `[${this.getToolName()}] ${message}`;
    
    return new MCPError(ErrorCodes.INVALID_PARAMS, fullMessage);
  }

  /**
   * Helper method to create execution errors with consistent formatting
   */
  protected createExecutionError(message: string, originalError?: any): MCPError {
    const fullMessage = `[${this.getToolName()}] Execution failed: ${message}`;
    
    return new MCPError(
      ErrorCodes.INTERNAL_ERROR, 
      fullMessage,
      originalError ? { originalError } : undefined
    );
  }
}