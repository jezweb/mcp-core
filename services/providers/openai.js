/**
 * OpenAI Provider Plugin - OpenAI-specific implementation of the LLM Provider interface
 *
 * This module refactors the existing OpenAI service to implement the generic LLM provider
 * interface, enabling it to work within the provider registry system while maintaining
 * full backward compatibility with existing OpenAI functionality.
 *
 * Key Features:
 * - Full OpenAI Assistants API implementation
 * - Generic LLM provider interface compliance
 * - Backward compatibility with existing OpenAI service
 * - Type mapping between OpenAI and generic types
 * - Enhanced error handling and validation
 */
import { createProviderError, } from '../llm-service.js';
import { mapOpenAIToGenericAssistant, mapOpenAIToGenericThread, mapOpenAIToGenericMessage, mapOpenAIToGenericRun, mapOpenAIToGenericRunStep, mapGenericToOpenAICreateAssistantRequest, mapOpenAIToGenericListResponse, } from '../../types/generic-types.js';
// Import the existing OpenAI service for delegation
import { OpenAIService } from '../openai-service.js';
import { MCPError, ErrorCodes, } from '../../types/index.js';
/**
 * OpenAI Provider Implementation
 * Implements the generic LLM provider interface for OpenAI
 */
export class OpenAIProvider {
    openaiService;
    config;
    metadata = {
        name: 'openai',
        displayName: 'OpenAI',
        version: '1.0.0',
        description: 'OpenAI Assistants API provider with full feature support',
        capabilities: {
            assistants: true,
            threads: true,
            messages: true,
            runs: true,
            runSteps: true,
            fileAttachments: true,
            functionCalling: true,
            codeInterpreter: true,
            fileSearch: true,
            streaming: false, // Not implemented in current service
            customModels: false,
            maxContextLength: 128000, // GPT-4 context length
            supportedModels: [
                'gpt-4',
                'gpt-4o',
                'gpt-4-turbo',
                'gpt-4-turbo-preview',
                'gpt-3.5-turbo',
                'gpt-3.5-turbo-16k',
            ],
        },
        configSchema: {
            type: 'object',
            properties: {
                apiKey: { type: 'string', description: 'OpenAI API key' },
                baseUrl: { type: 'string', description: 'Custom base URL' },
                organization: { type: 'string', description: 'Organization ID' },
                project: { type: 'string', description: 'Project ID' },
                timeout: { type: 'number', description: 'Request timeout in milliseconds' },
                maxRetries: { type: 'number', description: 'Maximum retry attempts' },
                headers: { type: 'object', description: 'Custom headers' },
            },
            required: ['apiKey'],
        },
        documentationUrl: 'https://platform.openai.com/docs/assistants',
    };
    constructor(config) {
        this.config = config;
        this.openaiService = new OpenAIService(config.apiKey);
    }
    /**
     * Initialize the provider with configuration
     */
    async initialize(config) {
        try {
            // Validate configuration
            if (!config.apiKey) {
                throw createProviderError('openai', 'API key is required', undefined, ErrorCodes.INVALID_PARAMS);
            }
            // Update configuration
            this.config = { ...this.config, ...config };
            // Reinitialize OpenAI service with new config
            this.openaiService = new OpenAIService(this.config.apiKey);
            // Validate connection
            const isValid = await this.validateConnection();
            if (!isValid) {
                throw createProviderError('openai', 'Failed to validate OpenAI API connection');
            }
        }
        catch (error) {
            throw createProviderError('openai', `Failed to initialize OpenAI provider: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
        }
    }
    /**
     * Validate provider configuration and connectivity
     */
    async validateConnection() {
        try {
            return await this.openaiService.validateApiKey();
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Assistant Management Methods
     */
    async createAssistant(request) {
        try {
            const openaiRequest = mapGenericToOpenAICreateAssistantRequest(request);
            // Ensure tool_resources is passed through
            if (request.tool_resources) {
                openaiRequest.tool_resources = request.tool_resources;
            }
            const openaiAssistant = await this.openaiService.createAssistant(openaiRequest);
            return mapOpenAIToGenericAssistant(openaiAssistant);
        }
        catch (error) {
            throw this.handleError('createAssistant', error);
        }
    }
    async listAssistants(request = {}) {
        try {
            const openaiRequest = {
                limit: request.limit,
                order: request.order,
                after: request.after,
                before: request.before,
            };
            const openaiResponse = await this.openaiService.listAssistants(openaiRequest);
            return mapOpenAIToGenericListResponse(openaiResponse, mapOpenAIToGenericAssistant);
        }
        catch (error) {
            throw this.handleError('listAssistants', error);
        }
    }
    async getAssistant(assistantId) {
        try {
            const openaiAssistant = await this.openaiService.getAssistant(assistantId);
            return mapOpenAIToGenericAssistant(openaiAssistant);
        }
        catch (error) {
            throw this.handleError('getAssistant', error);
        }
    }
    async updateAssistant(assistantId, request) {
        try {
            const openaiRequest = {
                model: request.model,
                name: request.name,
                description: request.description,
                instructions: request.instructions,
                tools: request.tools?.map(tool => ({
                    type: tool.type,
                    function: tool.function,
                })),
                tool_resources: request.tool_resources,
                metadata: request.metadata,
            };
            const openaiAssistant = await this.openaiService.updateAssistant(assistantId, openaiRequest);
            return mapOpenAIToGenericAssistant(openaiAssistant);
        }
        catch (error) {
            throw this.handleError('updateAssistant', error);
        }
    }
    async deleteAssistant(assistantId) {
        try {
            const result = await this.openaiService.deleteAssistant(assistantId);
            return { id: result.id, deleted: result.deleted };
        }
        catch (error) {
            throw this.handleError('deleteAssistant', error);
        }
    }
    /**
     * Thread Management Methods
     */
    async createThread(request = {}) {
        try {
            const openaiRequest = {
                messages: request.messages?.map(msg => ({
                    role: msg.role,
                    content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
                    metadata: msg.metadata,
                })),
                metadata: request.metadata,
            };
            const openaiThread = await this.openaiService.createThread(openaiRequest);
            return mapOpenAIToGenericThread(openaiThread);
        }
        catch (error) {
            throw this.handleError('createThread', error);
        }
    }
    async getThread(threadId) {
        try {
            const openaiThread = await this.openaiService.getThread(threadId);
            return mapOpenAIToGenericThread(openaiThread);
        }
        catch (error) {
            throw this.handleError('getThread', error);
        }
    }
    async updateThread(threadId, request) {
        try {
            const openaiRequest = {
                metadata: request.metadata,
            };
            const openaiThread = await this.openaiService.updateThread(threadId, openaiRequest);
            return mapOpenAIToGenericThread(openaiThread);
        }
        catch (error) {
            throw this.handleError('updateThread', error);
        }
    }
    async deleteThread(threadId) {
        try {
            const result = await this.openaiService.deleteThread(threadId);
            return { id: result.id, deleted: result.deleted };
        }
        catch (error) {
            throw this.handleError('deleteThread', error);
        }
    }
    /**
     * Message Management Methods
     */
    async createMessage(threadId, request) {
        try {
            const openaiRequest = {
                role: request.role,
                content: typeof request.content === 'string' ? request.content : JSON.stringify(request.content),
                metadata: request.metadata,
            };
            const openaiMessage = await this.openaiService.createMessage(threadId, openaiRequest);
            return mapOpenAIToGenericMessage(openaiMessage);
        }
        catch (error) {
            throw this.handleError('createMessage', error);
        }
    }
    async listMessages(threadId, request = {}) {
        try {
            const openaiRequest = {
                limit: request.limit,
                order: request.order,
                after: request.after,
                before: request.before,
            };
            const openaiResponse = await this.openaiService.listMessages(threadId, openaiRequest);
            return mapOpenAIToGenericListResponse(openaiResponse, mapOpenAIToGenericMessage);
        }
        catch (error) {
            throw this.handleError('listMessages', error);
        }
    }
    async getMessage(threadId, messageId) {
        try {
            const openaiMessage = await this.openaiService.getMessage(threadId, messageId);
            return mapOpenAIToGenericMessage(openaiMessage);
        }
        catch (error) {
            throw this.handleError('getMessage', error);
        }
    }
    async updateMessage(threadId, messageId, request) {
        try {
            const openaiRequest = {
                metadata: request.metadata,
            };
            const openaiMessage = await this.openaiService.updateMessage(threadId, messageId, openaiRequest);
            return mapOpenAIToGenericMessage(openaiMessage);
        }
        catch (error) {
            throw this.handleError('updateMessage', error);
        }
    }
    async deleteMessage(threadId, messageId) {
        try {
            const result = await this.openaiService.deleteMessage(threadId, messageId);
            return { id: result.id, deleted: result.deleted };
        }
        catch (error) {
            throw this.handleError('deleteMessage', error);
        }
    }
    /**
     * Run Management Methods
     */
    async createRun(threadId, request) {
        try {
            const openaiRequest = {
                assistant_id: request.assistantId,
                model: request.model,
                instructions: request.instructions,
                additional_instructions: request.additionalInstructions,
                tools: request.tools?.map(tool => ({
                    type: tool.type,
                    function: tool.function,
                })),
                metadata: request.metadata,
            };
            const openaiRun = await this.openaiService.createRun(threadId, openaiRequest);
            return mapOpenAIToGenericRun(openaiRun);
        }
        catch (error) {
            throw this.handleError('createRun', error);
        }
    }
    async listRuns(threadId, request = {}) {
        try {
            const openaiRequest = {
                limit: request.limit,
                order: request.order,
                after: request.after,
                before: request.before,
            };
            const openaiResponse = await this.openaiService.listRuns(threadId, openaiRequest);
            return mapOpenAIToGenericListResponse(openaiResponse, mapOpenAIToGenericRun);
        }
        catch (error) {
            throw this.handleError('listRuns', error);
        }
    }
    async getRun(threadId, runId) {
        try {
            const openaiRun = await this.openaiService.getRun(threadId, runId);
            return mapOpenAIToGenericRun(openaiRun);
        }
        catch (error) {
            throw this.handleError('getRun', error);
        }
    }
    async updateRun(threadId, runId, request) {
        try {
            const openaiRequest = {
                metadata: request.metadata,
            };
            const openaiRun = await this.openaiService.updateRun(threadId, runId, openaiRequest);
            return mapOpenAIToGenericRun(openaiRun);
        }
        catch (error) {
            throw this.handleError('updateRun', error);
        }
    }
    async cancelRun(threadId, runId) {
        try {
            const openaiRun = await this.openaiService.cancelRun(threadId, runId);
            return mapOpenAIToGenericRun(openaiRun);
        }
        catch (error) {
            throw this.handleError('cancelRun', error);
        }
    }
    async submitToolOutputs(threadId, runId, request) {
        try {
            const openaiRequest = {
                tool_outputs: request.toolOutputs.map(output => ({
                    tool_call_id: output.toolCallId,
                    output: output.output,
                })),
            };
            const openaiRun = await this.openaiService.submitToolOutputs(threadId, runId, openaiRequest);
            return mapOpenAIToGenericRun(openaiRun);
        }
        catch (error) {
            throw this.handleError('submitToolOutputs', error);
        }
    }
    /**
     * Run Step Management Methods
     */
    async listRunSteps(threadId, runId, request = {}) {
        try {
            const openaiRequest = {
                limit: request.limit,
                order: request.order,
                after: request.after,
                before: request.before,
            };
            const openaiResponse = await this.openaiService.listRunSteps(threadId, runId, openaiRequest);
            return mapOpenAIToGenericListResponse(openaiResponse, mapOpenAIToGenericRunStep);
        }
        catch (error) {
            throw this.handleError('listRunSteps', error);
        }
    }
    async getRunStep(threadId, runId, stepId) {
        try {
            const openaiRunStep = await this.openaiService.getRunStep(threadId, runId, stepId);
            return mapOpenAIToGenericRunStep(openaiRunStep);
        }
        catch (error) {
            throw this.handleError('getRunStep', error);
        }
    }
    /**
     * Handle unsupported operations
     */
    async handleUnsupportedOperation(operation, ...args) {
        throw createProviderError('openai', `Operation not supported: ${operation}`, { operation, args }, ErrorCodes.METHOD_NOT_FOUND);
    }
    /**
     * Private helper methods
     */
    handleError(operation, error) {
        if (error instanceof MCPError) {
            return createProviderError('openai', `${operation} failed: ${error.message}`, error, error.code);
        }
        return createProviderError('openai', `${operation} failed: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
    }
}
/**
 * OpenAI Provider Factory
 * Creates OpenAI provider instances
 */
export class OpenAIProviderFactory {
    /**
     * Create a new OpenAI provider instance
     */
    async create(config) {
        if (!this.validateConfig(config)) {
            throw new MCPError(ErrorCodes.INVALID_PARAMS, 'Invalid OpenAI provider configuration');
        }
        const provider = new OpenAIProvider(config);
        await provider.initialize(config);
        return provider;
    }
    /**
     * Get provider metadata without creating an instance
     */
    getMetadata() {
        return new OpenAIProvider({ apiKey: '' }).metadata;
    }
    /**
     * Validate provider configuration
     */
    validateConfig(config) {
        return typeof config === 'object' &&
            config !== null &&
            typeof config.apiKey === 'string' &&
            config.apiKey.length > 0;
    }
}
/**
 * Default OpenAI provider factory instance
 */
export const openaiProviderFactory = new OpenAIProviderFactory();
