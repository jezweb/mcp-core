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
import { BaseToolHandler } from './base-tool-handler.js';
import { validateOpenAIId, validateMetadata } from '../../validation/index.js';
/**
 * Handler for creating new threads
 */
export class ThreadCreateHandler extends BaseToolHandler {
    getToolName() {
        return 'thread-create';
    }
    getCategory() {
        return 'thread';
    }
    validate(args) {
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
            return await this.context.openaiService.createThread(args || {});
        }
        catch (error) {
            throw this.createExecutionError(`Failed to create thread: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
        }
    }
}
/**
 * Handler for getting thread details
 */
export class ThreadGetHandler extends BaseToolHandler {
    getToolName() {
        return 'thread-get';
    }
    getCategory() {
        return 'thread';
    }
    validate(args) {
        return validateOpenAIId(args?.thread_id, 'thread', 'thread_id');
    }
    async execute(args) {
        try {
            return await this.context.openaiService.getThread(args.thread_id);
        }
        catch (error) {
            throw this.createExecutionError(`Failed to get thread: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
        }
    }
}
/**
 * Handler for updating threads
 */
export class ThreadUpdateHandler extends BaseToolHandler {
    getToolName() {
        return 'thread-update';
    }
    getCategory() {
        return 'thread';
    }
    validate(args) {
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
    async execute(args) {
        try {
            const { thread_id, ...updateData } = args;
            return await this.context.openaiService.updateThread(thread_id, updateData);
        }
        catch (error) {
            throw this.createExecutionError(`Failed to update thread: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
        }
    }
}
/**
 * Handler for deleting threads
 */
export class ThreadDeleteHandler extends BaseToolHandler {
    getToolName() {
        return 'thread-delete';
    }
    getCategory() {
        return 'thread';
    }
    validate(args) {
        return validateOpenAIId(args?.thread_id, 'thread', 'thread_id');
    }
    async execute(args) {
        try {
            return await this.context.openaiService.deleteThread(args.thread_id);
        }
        catch (error) {
            throw this.createExecutionError(`Failed to delete thread: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
        }
    }
}
/**
 * Factory function to create all thread handlers
 */
export function createThreadHandlers(context) {
    return {
        'thread-create': new ThreadCreateHandler(context),
        'thread-get': new ThreadGetHandler(context),
        'thread-update': new ThreadUpdateHandler(context),
        'thread-delete': new ThreadDeleteHandler(context)
    };
}
