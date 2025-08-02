/**
 * Message Tool Handlers - Handlers for all message-related operations
 * 
 * This file contains handlers for:
 * - message-create: Add a message to a thread
 * - message-list: List messages in a thread with pagination
 * - message-get: Get details of a specific message
 * - message-update: Update message metadata
 * - message-delete: Delete a message
 * 
 * Each handler implements the BaseToolHandler interface and provides
 * specific validation and execution logic for message operations.
 */

import { BaseToolHandler, ToolHandlerContext } from './base-tool-handler.js';
import {
  ValidationResult,
  validateOpenAIId,
  validateMessageRole,
  validateRequiredString,
  validateMetadata,
  validatePaginationParams
} from '../../validation/index.js';
import {
  GenericCreateMessageRequest,
  GenericUpdateMessageRequest,
  GenericListRequest
} from '../../services/llm-service.js';

/**
 * Handler for creating new messages
 */
export class MessageCreateHandler extends BaseToolHandler {
  getToolName(): string {
    return 'message-create';
  }

  getCategory(): string {
    return 'message';
  }

  validate(args: any): ValidationResult {
    // Validate required thread ID
    const threadIdValidation = validateOpenAIId(args?.thread_id, 'thread', 'thread_id');
    if (!threadIdValidation.isValid) {
      return threadIdValidation;
    }

    // Validate required role
    const roleValidation = validateMessageRole(args?.role);
    if (!roleValidation.isValid) {
      return roleValidation;
    }

    // Validate required content
    const contentValidation = validateRequiredString(
      args?.content, 
      'content', 
      ['"Hello, how can I help you?"', '"Please analyze this data."']
    );
    if (!contentValidation.isValid) {
      return contentValidation;
    }

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
      const { thread_id, ...messageData } = args;
      // Use generic request type
      const genericRequest: GenericCreateMessageRequest = {
        role: messageData.role,
        content: messageData.content,
        metadata: messageData.metadata,
        providerOptions: messageData.providerOptions
      };
      return await this.context.provider.createMessage(thread_id, genericRequest);
    } catch (error) {
      throw this.createExecutionError(
        `Failed to create message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }
}

/**
 * Handler for listing messages
 */
export class MessageListHandler extends BaseToolHandler {
  getToolName(): string {
    return 'message-list';
  }

  getCategory(): string {
    return 'message';
  }

  validate(args: any): ValidationResult {
    // Validate thread ID
    const threadIdValidation = validateOpenAIId(args?.thread_id, 'thread', 'thread_id');
    if (!threadIdValidation.isValid) {
      return threadIdValidation;
    }

    const { thread_id, ...listData } = args;

    // Validate pagination parameters
    const paginationValidation = validatePaginationParams(listData);
    if (!paginationValidation.isValid) {
      return paginationValidation;
    }

    // Validate run_id if provided
    if (listData.run_id) {
      const runIdValidation = validateOpenAIId(listData.run_id, 'run', 'run_id');
      if (!runIdValidation.isValid) {
        return runIdValidation;
      }
    }

    return { isValid: true };
  }

  async execute(args: any): Promise<any> {
    try {
      const { thread_id, ...listData } = args;
      // Use generic request type
      const genericRequest: GenericListRequest = {
        limit: listData.limit,
        order: listData.order,
        after: listData.after,
        before: listData.before
      };
      return await this.context.provider.listMessages(thread_id, genericRequest);
    } catch (error) {
      throw this.createExecutionError(
        `Failed to list messages: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }
}

/**
 * Handler for getting message details
 */
export class MessageGetHandler extends BaseToolHandler {
  getToolName(): string {
    return 'message-get';
  }

  getCategory(): string {
    return 'message';
  }

  validate(args: any): ValidationResult {
    // Validate thread ID
    const threadIdValidation = validateOpenAIId(args?.thread_id, 'thread', 'thread_id');
    if (!threadIdValidation.isValid) {
      return threadIdValidation;
    }

    // Validate message ID
    const messageIdValidation = validateOpenAIId(args?.message_id, 'message', 'message_id');
    if (!messageIdValidation.isValid) {
      return messageIdValidation;
    }

    return { isValid: true };
  }

  async execute(args: any): Promise<any> {
    try {
      return await this.context.provider.getMessage(args.thread_id, args.message_id);
    } catch (error) {
      throw this.createExecutionError(
        `Failed to get message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }
}

/**
 * Handler for updating messages
 */
export class MessageUpdateHandler extends BaseToolHandler {
  getToolName(): string {
    return 'message-update';
  }

  getCategory(): string {
    return 'message';
  }

  validate(args: any): ValidationResult {
    // Validate thread ID
    const threadIdValidation = validateOpenAIId(args?.thread_id, 'thread', 'thread_id');
    if (!threadIdValidation.isValid) {
      return threadIdValidation;
    }

    // Validate message ID
    const messageIdValidation = validateOpenAIId(args?.message_id, 'message', 'message_id');
    if (!messageIdValidation.isValid) {
      return messageIdValidation;
    }

    const { thread_id, message_id, ...updateData } = args;

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
      const { thread_id, message_id, ...updateData } = args;
      // Use generic request type
      const genericRequest: GenericUpdateMessageRequest = {
        metadata: updateData.metadata,
        providerOptions: updateData.providerOptions
      };
      return await this.context.provider.updateMessage(thread_id, message_id, genericRequest);
    } catch (error) {
      throw this.createExecutionError(
        `Failed to update message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }
}

/**
 * Handler for deleting messages
 */
export class MessageDeleteHandler extends BaseToolHandler {
  getToolName(): string {
    return 'message-delete';
  }

  getCategory(): string {
    return 'message';
  }

  validate(args: any): ValidationResult {
    // Validate thread ID
    const threadIdValidation = validateOpenAIId(args?.thread_id, 'thread', 'thread_id');
    if (!threadIdValidation.isValid) {
      return threadIdValidation;
    }

    // Validate message ID
    const messageIdValidation = validateOpenAIId(args?.message_id, 'message', 'message_id');
    if (!messageIdValidation.isValid) {
      return messageIdValidation;
    }

    return { isValid: true };
  }

  async execute(args: any): Promise<any> {
    try {
      return await this.context.provider.deleteMessage(args.thread_id, args.message_id);
    } catch (error) {
      throw this.createExecutionError(
        `Failed to delete message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }
}

/**
 * Factory function to create all message handlers
 */
export function createMessageHandlers(context: ToolHandlerContext): Record<string, BaseToolHandler> {
  return {
    'message-create': new MessageCreateHandler(context),
    'message-list': new MessageListHandler(context),
    'message-get': new MessageGetHandler(context),
    'message-update': new MessageUpdateHandler(context),
    'message-delete': new MessageDeleteHandler(context)
  };
}