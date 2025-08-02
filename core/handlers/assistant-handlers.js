/**
 * Assistant Tool Handlers - Handlers for all assistant-related operations
 *
 * This file contains handlers for:
 * - assistant-create: Create a new AI assistant
 * - assistant-list: List all assistants with pagination
 * - assistant-get: Get details of a specific assistant
 * - assistant-update: Update an existing assistant
 * - assistant-delete: Delete an assistant
 *
 * Each handler implements the BaseToolHandler interface and provides
 * specific validation and execution logic for assistant operations.
 */
import { BaseToolHandler } from './base-tool-handler.js';
import { validateCreateAssistantParams, validatePaginationParams, validateOpenAIId, validateModel, validateMetadata } from '../../validation/index.js';
/**
 * Handler for creating new assistants
 */
export class AssistantCreateHandler extends BaseToolHandler {
    getToolName() {
        return 'assistant-create';
    }
    getCategory() {
        return 'assistant';
    }
    validate(args) {
        return validateCreateAssistantParams(args);
    }
    async execute(args) {
        try {
            // Use generic request type
            const genericRequest = {
                model: args.model,
                name: args.name,
                description: args.description,
                instructions: args.instructions,
                tools: args.tools,
                metadata: args.metadata,
                providerOptions: args.providerOptions
            };
            return await this.context.provider.createAssistant(genericRequest);
        }
        catch (error) {
            throw this.createExecutionError(`Failed to create assistant: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
        }
    }
}
/**
 * Handler for listing assistants
 */
export class AssistantListHandler extends BaseToolHandler {
    getToolName() {
        return 'assistant-list';
    }
    getCategory() {
        return 'assistant';
    }
    validate(args) {
        return validatePaginationParams(args || {});
    }
    async execute(args) {
        try {
            // Use generic request type
            const genericRequest = {
                limit: args?.limit,
                order: args?.order,
                after: args?.after,
                before: args?.before
            };
            return await this.context.provider.listAssistants(genericRequest);
        }
        catch (error) {
            throw this.createExecutionError(`Failed to list assistants: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
        }
    }
}
/**
 * Handler for getting assistant details
 */
export class AssistantGetHandler extends BaseToolHandler {
    getToolName() {
        return 'assistant-get';
    }
    getCategory() {
        return 'assistant';
    }
    validate(args) {
        return validateOpenAIId(args?.assistant_id, 'assistant', 'assistant_id');
    }
    async execute(args) {
        try {
            return await this.context.provider.getAssistant(args.assistant_id);
        }
        catch (error) {
            throw this.createExecutionError(`Failed to get assistant: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
        }
    }
}
/**
 * Handler for updating assistants
 */
export class AssistantUpdateHandler extends BaseToolHandler {
    getToolName() {
        return 'assistant-update';
    }
    getCategory() {
        return 'assistant';
    }
    validate(args) {
        // Validate assistant ID
        const idValidation = validateOpenAIId(args?.assistant_id, 'assistant', 'assistant_id');
        if (!idValidation.isValid) {
            return idValidation;
        }
        const { assistant_id, ...updateData } = args;
        // Validate model if provided
        if (updateData.model) {
            const modelValidation = validateModel(updateData.model);
            if (!modelValidation.isValid) {
                return modelValidation;
            }
        }
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
            const { assistant_id, ...updateData } = args;
            // Use generic request type
            const genericRequest = {
                model: updateData.model,
                name: updateData.name,
                description: updateData.description,
                instructions: updateData.instructions,
                tools: updateData.tools,
                metadata: updateData.metadata,
                providerOptions: updateData.providerOptions
            };
            return await this.context.provider.updateAssistant(assistant_id, genericRequest);
        }
        catch (error) {
            throw this.createExecutionError(`Failed to update assistant: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
        }
    }
}
/**
 * Handler for deleting assistants
 */
export class AssistantDeleteHandler extends BaseToolHandler {
    getToolName() {
        return 'assistant-delete';
    }
    getCategory() {
        return 'assistant';
    }
    validate(args) {
        return validateOpenAIId(args?.assistant_id, 'assistant', 'assistant_id');
    }
    async execute(args) {
        try {
            return await this.context.provider.deleteAssistant(args.assistant_id);
        }
        catch (error) {
            throw this.createExecutionError(`Failed to delete assistant: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
        }
    }
}
/**
 * Factory function to create all assistant handlers
 */
export function createAssistantHandlers(context) {
    return {
        'assistant-create': new AssistantCreateHandler(context),
        'assistant-list': new AssistantListHandler(context),
        'assistant-get': new AssistantGetHandler(context),
        'assistant-update': new AssistantUpdateHandler(context),
        'assistant-delete': new AssistantDeleteHandler(context)
    };
}
