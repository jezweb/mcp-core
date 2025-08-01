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
import { BaseToolHandler } from './base-tool-handler.js';
import { validateOpenAIId, validateMessageRole, validateRequiredString, validateMetadata, validatePaginationParams } from '../../validation/index.js';
/**
 * Handler for creating new messages
 */
export class MessageCreateHandler extends BaseToolHandler {
    getToolName() {
        return 'message-create';
    }
    getCategory() {
        return 'message';
    }
    validate(args) {
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
        const contentValidation = validateRequiredString(args?.content, 'content', ['"Hello, how can I help you?"', '"Please analyze this data."']);
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
    async execute(args) {
        try {
            const { thread_id, ...messageData } = args;
            return await this.context.openaiService.createMessage(thread_id, messageData);
        }
        catch (error) {
            throw this.createExecutionError(`Failed to create message: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
        }
    }
}
/**
 * Handler for listing messages
 */
export class MessageListHandler extends BaseToolHandler {
    getToolName() {
        return 'message-list';
    }
    getCategory() {
        return 'message';
    }
    validate(args) {
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
    async execute(args) {
        try {
            const { thread_id, ...listData } = args;
            return await this.context.openaiService.listMessages(thread_id, listData);
        }
        catch (error) {
            throw this.createExecutionError(`Failed to list messages: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
        }
    }
}
/**
 * Handler for getting message details
 */
export class MessageGetHandler extends BaseToolHandler {
    getToolName() {
        return 'message-get';
    }
    getCategory() {
        return 'message';
    }
    validate(args) {
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
    async execute(args) {
        try {
            return await this.context.openaiService.getMessage(args.thread_id, args.message_id);
        }
        catch (error) {
            throw this.createExecutionError(`Failed to get message: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
        }
    }
}
/**
 * Handler for updating messages
 */
export class MessageUpdateHandler extends BaseToolHandler {
    getToolName() {
        return 'message-update';
    }
    getCategory() {
        return 'message';
    }
    validate(args) {
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
    async execute(args) {
        try {
            const { thread_id, message_id, ...updateData } = args;
            return await this.context.openaiService.updateMessage(thread_id, message_id, updateData);
        }
        catch (error) {
            throw this.createExecutionError(`Failed to update message: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
        }
    }
}
/**
 * Handler for deleting messages
 */
export class MessageDeleteHandler extends BaseToolHandler {
    getToolName() {
        return 'message-delete';
    }
    getCategory() {
        return 'message';
    }
    validate(args) {
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
    async execute(args) {
        try {
            return await this.context.openaiService.deleteMessage(args.thread_id, args.message_id);
        }
        catch (error) {
            throw this.createExecutionError(`Failed to delete message: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
        }
    }
}
/**
 * Factory function to create all message handlers
 */
export function createMessageHandlers(context) {
    return {
        'message-create': new MessageCreateHandler(context),
        'message-list': new MessageListHandler(context),
        'message-get': new MessageGetHandler(context),
        'message-update': new MessageUpdateHandler(context),
        'message-delete': new MessageDeleteHandler(context)
    };
}
