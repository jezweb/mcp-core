/**
 * Thread Tool Handlers - Handlers for all thread-related operations
 * 
 * This file contains handlers for:
 * - thread-create: Create a new conversation thread
 * - thread-get: Get details of a specific thread
 * - thread-update: Update thread metadata
 * - thread-delete: Delete a thread
 * 
 * Each handler implements the BaseToolHandler interface and provides
 * specific validation and execution logic for thread operations.
 */

import { BaseToolHandler, ToolHandlerContext } from './base-tool-handler.js';
import {
  ValidationResult,
  validateOpenAIId,
  validateMetadata
} from '../../validation/index.js';
import {
  GenericCreateThreadRequest,
  GenericUpdateThreadRequest
} from '../../services/llm-service.js';

/**
 * Handler for creating new threads
 */
export class ThreadCreateHandler extends BaseToolHandler {
  getToolName(): string {
    return 'thread-create';
  }

  getCategory(): string {
    return 'thread';
  }

  validate(args: any): ValidationResult {
    // Validate metadata if provided
    if (args?.metadata !== undefined) {
      const metadataValidation = validateMetadata(args.metadata);
      if (!metadataValidation.isValid) {
        return metadataValidation;
      }
    }

    return { isValid: true };
  }

  async execute(args: any): Promise<any> {
    try {
      // Use generic request type
      const genericRequest: GenericCreateThreadRequest = {
        messages: args?.messages,
        metadata: args?.metadata,
        providerOptions: args?.providerOptions
      };
      return await this.context.provider.createThread(genericRequest);
    } catch (error) {
      throw this.createExecutionError(
        `Failed to create thread: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }
}

/**
 * Handler for getting thread details
 */
export class ThreadGetHandler extends BaseToolHandler {
  getToolName(): string {
    return 'thread-get';
  }

  getCategory(): string {
    return 'thread';
  }

  validate(args: any): ValidationResult {
    return validateOpenAIId(args?.thread_id, 'thread', 'thread_id');
  }

  async execute(args: any): Promise<any> {
    try {
      return await this.context.provider.getThread(args.thread_id);
    } catch (error) {
      throw this.createExecutionError(
        `Failed to get thread: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }
}

/**
 * Handler for updating threads
 */
export class ThreadUpdateHandler extends BaseToolHandler {
  getToolName(): string {
    return 'thread-update';
  }

  getCategory(): string {
    return 'thread';
  }

  validate(args: any): ValidationResult {
    // Validate thread ID
    const idValidation = validateOpenAIId(args?.thread_id, 'thread', 'thread_id');
    if (!idValidation.isValid) {
      return idValidation;
    }

    const { thread_id, ...updateData } = args;

    // Validate metadata if provided
    if (updateData.metadata !== undefined) {
      const metadataValidation = validateMetadata(updateData.metadata);
      if (!metadataValidation.isValid) {
        return metadataValidation;
      }
    }

    return { isValid: true };
  }

  async execute(args: any): Promise<any> {
    try {
      const { thread_id, ...updateData } = args;
      // Use generic request type
      const genericRequest: GenericUpdateThreadRequest = {
        metadata: updateData.metadata,
        providerOptions: updateData.providerOptions
      };
      return await this.context.provider.updateThread(thread_id, genericRequest);
    } catch (error) {
      throw this.createExecutionError(
        `Failed to update thread: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }
}

/**
 * Handler for deleting threads
 */
export class ThreadDeleteHandler extends BaseToolHandler {
  getToolName(): string {
    return 'thread-delete';
  }

  getCategory(): string {
    return 'thread';
  }

  validate(args: any): ValidationResult {
    return validateOpenAIId(args?.thread_id, 'thread', 'thread_id');
  }

  async execute(args: any): Promise<any> {
    try {
      return await this.context.provider.deleteThread(args.thread_id);
    } catch (error) {
      throw this.createExecutionError(
        `Failed to delete thread: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }
}

/**
 * Factory function to create all thread handlers
 */
export function createThreadHandlers(context: ToolHandlerContext): Record<string, BaseToolHandler> {
  return {
    'thread-create': new ThreadCreateHandler(context),
    'thread-get': new ThreadGetHandler(context),
    'thread-update': new ThreadUpdateHandler(context),
    'thread-delete': new ThreadDeleteHandler(context)
  };
}