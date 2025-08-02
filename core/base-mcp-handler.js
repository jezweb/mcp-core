/**
 * Base MCP Handler - Consolidated handler for all deployment targets
 *
 * This class provides a unified MCP protocol implementation that can be used
 * across different deployment targets (Cloudflare Workers, NPM package, local dev).
 * It eliminates code duplication while preserving deployment-specific optimizations.
 *
 * Key Features:
 * - Single source of truth for MCP protocol handling
 * - Transport-agnostic design (HTTP, Stdio, etc.)
 * - Shared tool registry with performance optimizations
 * - Consistent error handling across deployments
 * - Resource management support
 * - Deployment-specific adapter pattern
 */
import { MCPError, ErrorCodes, LegacyErrorCodes, createEnhancedError, createStandardErrorResponse, } from '../types/index.js';
import { OpenAIService } from '../services/index.js';
import { ProviderRegistry, } from '../types/generic-types.js';
import { openaiProviderFactory } from '../services/providers/openai.js';
import { getAllResources, getResource, getResourceContent } from '../resources/index.js';
import { ToolRegistry } from './tool-registry.js';
import { createFlatHandlerMap, validateHandlerCompleteness } from './handlers/index.js';
import { generateToolDefinitions } from './tool-definitions.js';
import { createPromptHandlers } from './handlers/prompt-handlers.js';
import { createCompletionHandlers } from './handlers/completion-handlers.js';
import { paginateArray, createPaginationMetadata, PAGINATION_DEFAULTS } from './pagination-utils.js';
/**
 * Base MCP Handler class that consolidates all deployment targets
 *
 * This class implements the core MCP protocol logic and can be extended
 * or adapted for different deployment environments through the adapter pattern.
 */
export class BaseMCPHandler {
    providerRegistry;
    toolRegistry; // Definite assignment assertion - initialized in initializeHandlerSystem
    promptHandlers = {};
    completionHandlers = {};
    config;
    transportAdapter;
    isInitialized = false;
    constructor(config, providerRegistryOrTransportAdapter, transportAdapter) {
        // Set default configuration
        this.config = {
            ...config,
            serverName: config.serverName || 'openai-assistants-mcp',
            serverVersion: config.serverVersion || '3.0.0',
            debug: config.debug || false,
            capabilities: {
                tools: { listChanged: false },
                resources: { subscribe: false, listChanged: false },
                prompts: { listChanged: false },
                completions: {},
                ...config.capabilities,
            },
        };
        // Handle backward compatibility for constructor overloads
        if (providerRegistryOrTransportAdapter) {
            // Check if the second parameter is a ProviderRegistry or TransportAdapter
            if ('getDefaultProvider' in providerRegistryOrTransportAdapter) {
                // It's a ProviderRegistry
                this.providerRegistry = providerRegistryOrTransportAdapter;
                this.transportAdapter = transportAdapter;
            }
            else {
                // It's a TransportAdapter (backward compatibility mode)
                this.transportAdapter = providerRegistryOrTransportAdapter;
                // Create a default provider registry for backward compatibility
                this.providerRegistry = this.createBackwardCompatibilityRegistry(config);
            }
        }
        else {
            // No second parameter provided (backward compatibility mode)
            this.providerRegistry = this.createBackwardCompatibilityRegistry(config);
        }
        // Initialize the handler system once (performance optimization)
        this.initializeHandlerSystem();
        this.initializePromptHandlers();
        this.initializeCompletionHandlers();
    }
    /**
     * Create a backward compatibility provider registry
     * This is used when the old constructor signature is used
     */
    createBackwardCompatibilityRegistry(config) {
        if (!config.apiKey) {
            throw new MCPError(ErrorCodes.INVALID_PARAMS, 'API key is required for backward compatibility mode');
        }
        // Create a simple registry with just the OpenAI provider
        const registryConfig = {
            defaultProvider: 'openai',
            providers: [
                {
                    provider: 'openai',
                    enabled: true,
                    config: { apiKey: config.apiKey },
                },
            ],
        };
        const registry = new ProviderRegistry(registryConfig);
        registry.registerFactory(openaiProviderFactory);
        // Initialize the registry synchronously for backward compatibility
        // Note: This is not ideal but necessary for backward compatibility
        registry.initialize().catch(error => {
            console.error('[BaseMCPHandler] Failed to initialize backward compatibility registry:', error);
        });
        return registry;
    }
    /**
     * Initialize the handler system with performance optimizations
     */
    initializeHandlerSystem() {
        // Get the default provider from the registry
        let provider = this.providerRegistry.getDefaultProvider();
        let openaiService;
        if (!provider) {
            // If no provider is available yet (registry not initialized), use fallback
            console.warn('[BaseMCPHandler] No default provider available yet, using fallback OpenAI service');
            if (this.config.apiKey) {
                openaiService = new OpenAIService(this.config.apiKey);
            }
            else {
                throw new MCPError(ErrorCodes.INTERNAL_ERROR, 'No provider available and no API key for fallback');
            }
        }
        else {
            // For backward compatibility, we need to extract the OpenAIService from the provider
            // This assumes the provider is an OpenAI provider with access to the underlying service
            openaiService = this.getOpenAIServiceFromProvider(provider);
        }
        const context = {
            provider: provider || this.createFallbackProvider(openaiService),
            toolName: '',
            requestId: null
        };
        console.log('[BaseMCPHandler] DEBUG: Starting handler system initialization...');
        this.log('Initializing handler system...');
        try {
            this.toolRegistry = new ToolRegistry(context);
            const handlers = createFlatHandlerMap(context);
            // Validate that we have all expected handlers
            const validation = validateHandlerCompleteness(handlers);
            if (!validation.isComplete) {
                console.warn('[BaseMCPHandler] Missing handlers:', validation.missingTools);
                if (validation.extraTools.length > 0) {
                    console.warn('[BaseMCPHandler] Extra handlers:', validation.extraTools);
                }
            }
            // Register all handlers
            this.toolRegistry.registerBatch(handlers);
            console.log('[BaseMCPHandler] DEBUG: Handler system setup completed');
            // Validate tool count
            const registeredTools = this.toolRegistry.getRegisteredTools();
            console.log(`[BaseMCPHandler] DEBUG: Registry returned ${registeredTools.length} tools`);
            this.log(`Registered ${registeredTools.length} tools:`, registeredTools);
            if (registeredTools.length !== 22) {
                console.error(`[BaseMCPHandler] ERROR: Expected 22 tools, got ${registeredTools.length}`);
                console.error('[BaseMCPHandler] Registry stats:', this.toolRegistry.getStats());
                console.error('[BaseMCPHandler] Missing tools analysis:');
                const expectedTools = [
                    'assistant-create', 'assistant-list', 'assistant-get', 'assistant-update', 'assistant-delete',
                    'thread-create', 'thread-get', 'thread-update', 'thread-delete',
                    'message-create', 'message-list', 'message-get', 'message-update', 'message-delete',
                    'run-create', 'run-list', 'run-get', 'run-update', 'run-cancel', 'run-submit-tool-outputs',
                    'run-step-list', 'run-step-get'
                ];
                const missingTools = expectedTools.filter(tool => !registeredTools.includes(tool));
                const extraTools = registeredTools.filter(tool => !expectedTools.includes(tool));
                console.error('[BaseMCPHandler] Missing tools:', missingTools);
                console.error('[BaseMCPHandler] Extra tools:', extraTools);
            }
            else {
                console.log('[BaseMCPHandler] SUCCESS: All 22 tools registered correctly');
            }
        }
        catch (error) {
            console.error('[BaseMCPHandler] FATAL ERROR during handler system initialization:', error);
            throw error;
        }
    }
    /**
     * Initialize the prompt handlers system
     */
    initializePromptHandlers() {
        const context = {
            requestId: null
        };
        this.log('Initializing prompt handlers...');
        this.promptHandlers = createPromptHandlers(context);
        const handlerCount = Object.keys(this.promptHandlers).length;
        this.log(`Registered ${handlerCount} prompt handlers:`, Object.keys(this.promptHandlers));
    }
    /**
     * Initialize the completion handlers system
     */
    initializeCompletionHandlers() {
        const context = {
            requestId: null
        };
        this.log('Initializing completion handlers...');
        this.completionHandlers = createCompletionHandlers(context);
        const handlerCount = Object.keys(this.completionHandlers).length;
        this.log(`Registered ${handlerCount} completion handlers:`, Object.keys(this.completionHandlers));
    }
    /**
     * Main request handler - entry point for all MCP requests
     */
    async handleRequest(request) {
        try {
            // Transport-specific preprocessing
            if (this.transportAdapter?.preprocessRequest) {
                request = await this.transportAdapter.preprocessRequest(request);
            }
            // Route to appropriate handler
            let response;
            switch (request.method) {
                case 'initialize':
                    response = await this.handleInitialize(request);
                    break;
                case 'tools/list':
                    response = await this.handleToolsList(request);
                    break;
                case 'tools/call':
                    response = await this.handleToolsCall(request);
                    break;
                case 'resources/list':
                    response = await this.handleResourcesList(request);
                    break;
                case 'resources/read':
                    response = await this.handleResourcesRead(request);
                    break;
                case 'prompts/list':
                    response = await this.handlePromptsList(request);
                    break;
                case 'prompts/get':
                    response = await this.handlePromptsGet(request);
                    break;
                case 'completion/complete':
                    response = await this.handleCompletion(request);
                    break;
                default:
                    throw new MCPError(ErrorCodes.METHOD_NOT_FOUND, `Method not found: ${request.method}`);
            }
            // Transport-specific postprocessing
            if (this.transportAdapter?.postprocessResponse) {
                response = await this.transportAdapter.postprocessResponse(response);
            }
            return response;
        }
        catch (error) {
            return this.handleError(error, request.id);
        }
    }
    /**
     * Handle initialize requests
     */
    async handleInitialize(request) {
        this.log('Handling initialize request');
        this.isInitialized = true;
        return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
                protocolVersion: '2024-11-05',
                capabilities: {
                    tools: this.config.capabilities.tools || { listChanged: false },
                    resources: this.config.capabilities.resources,
                    prompts: this.config.capabilities.prompts || { listChanged: false },
                    completions: this.config.capabilities.completions || {},
                },
                serverInfo: {
                    name: this.config.serverName,
                    version: this.config.serverVersion,
                },
            },
        };
    }
    /**
     * Handle tools list requests with pagination support
     */
    async handleToolsList(request) {
        this.log('Generating tool definitions with pagination...');
        // Use the shared tool definition generator for consistency
        const allTools = generateToolDefinitions(this.toolRegistry);
        this.log(`Generated ${allTools.length} tool definitions`);
        if (allTools.length !== 22) {
            console.error(`[BaseMCPHandler] ERROR: Expected 22 tool definitions, got ${allTools.length}`);
        }
        // Apply pagination
        const paginationParams = {
            cursor: request.params?.cursor,
            limit: PAGINATION_DEFAULTS.DEFAULT_LIMIT // Use default limit for tools
        };
        const paginationResult = paginateArray(allTools, paginationParams);
        // Log pagination metadata if debug is enabled
        if (this.config.debug) {
            const metadata = createPaginationMetadata(paginationParams, paginationResult);
            this.log('Tools pagination:', metadata);
        }
        return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
                tools: paginationResult.items,
                nextCursor: paginationResult.nextCursor,
            },
        };
    }
    /**
     * Handle tools call requests with optimized registry usage
     */
    async handleToolsCall(request) {
        const { name, arguments: args } = request.params;
        try {
            this.log(`Executing tool: ${name}`);
            // Enhanced logging for debugging if enabled
            if (this.config.debug) {
                this.log(`Tool execution details:`, {
                    toolName: name,
                    arguments: args,
                    requestId: request.id,
                    timestamp: new Date().toISOString(),
                });
            }
            // Get the provider for this request (for now, use default provider)
            const provider = this.providerRegistry.getDefaultProvider();
            if (!provider) {
                throw new MCPError(ErrorCodes.INTERNAL_ERROR, 'No default provider available');
            }
            // For backward compatibility, extract OpenAIService from provider
            const openaiService = this.getOpenAIServiceFromProvider(provider);
            // Update context for this specific request (no registry recreation)
            const currentContext = {
                provider: provider,
                toolName: name,
                requestId: request.id
            };
            // Update the existing registry's context instead of recreating it
            this.updateRegistryContext(currentContext);
            // Execute the tool using the existing registry
            const result = await this.toolRegistry.execute(name, args);
            // Enhanced result formatting if debug enabled
            const responseText = this.config.debug
                ? JSON.stringify(result, null, 2)
                : JSON.stringify(result);
            return {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                    content: [
                        {
                            type: 'text',
                            text: responseText,
                        },
                    ],
                },
            };
        }
        catch (error) {
            // Enhanced error reporting if debug enabled
            const errorText = this.config.debug
                ? `Error in ${name}: ${error instanceof Error ? error.message : 'Unknown error'}\nStack: ${error instanceof Error ? error.stack : 'N/A'}`
                : `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
            return {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                    content: [
                        {
                            type: 'text',
                            text: errorText,
                        },
                    ],
                    isError: true,
                },
            };
        }
    }
    /**
     * Handle resources list requests with pagination support
     */
    async handleResourcesList(request) {
        this.log('Listing resources with pagination...');
        const allResources = getAllResources();
        this.log(`Found ${allResources.length} resources`);
        // Apply pagination
        const paginationParams = {
            cursor: request.params?.cursor,
            limit: PAGINATION_DEFAULTS.DEFAULT_LIMIT // Use default limit for resources
        };
        const paginationResult = paginateArray(allResources, paginationParams);
        // Log pagination metadata if debug is enabled
        if (this.config.debug) {
            const metadata = createPaginationMetadata(paginationParams, paginationResult);
            this.log('Resources pagination:', metadata);
        }
        return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
                resources: paginationResult.items.map((resource) => ({
                    uri: resource.uri,
                    name: resource.name,
                    description: resource.description,
                    mimeType: resource.mimeType
                })),
                nextCursor: paginationResult.nextCursor,
            },
        };
    }
    /**
     * Handle resources read requests
     */
    async handleResourcesRead(request) {
        const { uri } = request.params;
        const resourceData = getResource(uri);
        if (!resourceData) {
            throw createEnhancedError(LegacyErrorCodes.NOT_FOUND, `Resource not found: ${uri}`, {
                resourceUri: uri,
                availableResources: getAllResources().map((r) => r.uri)
            });
        }
        // Get resource content and ensure it's a string
        const rawContent = getResourceContent(uri);
        const textContent = typeof rawContent === 'string'
            ? rawContent
            : JSON.stringify(rawContent, null, 2);
        return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
                contents: [
                    {
                        uri,
                        name: resourceData.name, // Add required name field
                        mimeType: resourceData.mimeType,
                        text: textContent, // Ensure content is always a string
                    },
                ],
            },
        };
    }
    /**
     * Handle prompts list requests
     */
    async handlePromptsList(request) {
        this.log('Handling prompts/list request');
        try {
            const handler = this.promptHandlers['prompts/list'];
            if (!handler) {
                throw new MCPError(ErrorCodes.INTERNAL_ERROR, 'Prompts list handler not found');
            }
            // Update context for this request
            handler.context.requestId = request.id;
            const result = await handler.handle(request.params);
            return {
                jsonrpc: '2.0',
                id: request.id,
                result
            };
        }
        catch (error) {
            throw error instanceof MCPError ? error : new MCPError(ErrorCodes.INTERNAL_ERROR, `Failed to list prompts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Handle prompts get requests
     */
    async handlePromptsGet(request) {
        this.log('Handling prompts/get request');
        try {
            const handler = this.promptHandlers['prompts/get'];
            if (!handler) {
                throw new MCPError(ErrorCodes.INTERNAL_ERROR, 'Prompts get handler not found');
            }
            // Update context for this request
            handler.context.requestId = request.id;
            const result = await handler.handle(request.params);
            return {
                jsonrpc: '2.0',
                id: request.id,
                result
            };
        }
        catch (error) {
            throw error instanceof MCPError ? error : new MCPError(ErrorCodes.INTERNAL_ERROR, `Failed to get prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Handle completion requests
     */
    async handleCompletion(request) {
        this.log('Handling completion/complete request');
        try {
            const handler = this.completionHandlers['completion/complete'];
            if (!handler) {
                throw new MCPError(ErrorCodes.INTERNAL_ERROR, 'Completion handler not found');
            }
            // Update context for this request
            handler.context.requestId = request.id;
            const result = await handler.handle(request.params);
            return {
                jsonrpc: '2.0',
                id: request.id,
                result
            };
        }
        catch (error) {
            throw error instanceof MCPError ? error : new MCPError(ErrorCodes.INTERNAL_ERROR, `Failed to handle completion: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Update registry context without recreating the entire registry
     * This is a performance optimization to avoid the registry recreation issue
     */
    updateRegistryContext(newContext) {
        // Update the context for all registered handlers
        for (const toolName of this.toolRegistry.getRegisteredTools()) {
            const handler = this.toolRegistry.getHandler(toolName);
            if (handler) {
                handler.context = newContext;
            }
        }
    }
    /**
     * Centralized error handling with transport adapter support and JSON-RPC 2.0 compliance
     */
    handleError(error, requestId) {
        let mcpError;
        if (error instanceof MCPError) {
            mcpError = error;
        }
        else {
            // Create enhanced error for unknown errors
            mcpError = new MCPError(ErrorCodes.INTERNAL_ERROR, error instanceof Error ? error.message : 'Unknown error', {
                originalError: error instanceof Error ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                } : error,
                timestamp: new Date().toISOString(),
                requestId
            });
        }
        // Use transport adapter for error formatting if available
        if (this.transportAdapter?.formatError) {
            return this.transportAdapter.formatError(mcpError, requestId);
        }
        // Default JSON-RPC 2.0 compliant error response
        return createStandardErrorResponse(requestId, mcpError.code, mcpError.message, mcpError.data);
    }
    /**
     * Update API key and reinitialize services
     * Note: This method now works with the provider registry
     */
    updateApiKey(apiKey) {
        this.config.apiKey = apiKey;
        // For backward compatibility, we need to update the provider in the registry
        // This is a simplified approach - in a full implementation, you might want to
        // reinitialize the entire provider registry with new configuration
        const provider = this.providerRegistry.getDefaultProvider();
        if (provider) {
            // Update the provider's configuration if it supports it
            // This assumes the provider has an initialize method that can update the API key
            provider.initialize({ apiKey }).catch(error => {
                console.error('[BaseMCPHandler] Failed to update provider API key:', error);
            });
        }
        // For backward compatibility, extract OpenAIService from provider
        const openaiService = this.getOpenAIServiceFromProvider(provider);
        // Update the context in the existing registry
        const context = {
            provider: provider || this.createFallbackProvider(openaiService),
            toolName: '',
            requestId: null
        };
        this.updateRegistryContext(context);
    }
    /**
     * Helper method to extract OpenAIService from provider for backward compatibility
     * This is a bridge method to maintain compatibility with existing tool handlers
     */
    getOpenAIServiceFromProvider(provider) {
        if (!provider) {
            throw new MCPError(ErrorCodes.INTERNAL_ERROR, 'No provider available');
        }
        // For now, we assume the provider is an OpenAI provider
        // In a full implementation, you might want to check the provider type
        // and handle different provider types appropriately
        // Access the underlying OpenAI service from the provider
        // This assumes the OpenAI provider exposes its internal service
        if (provider.openaiService) {
            return provider.openaiService;
        }
        // Fallback: create a new OpenAI service with the API key from config
        // This maintains backward compatibility but doesn't fully utilize the provider system
        if (this.config.apiKey) {
            return new OpenAIService(this.config.apiKey);
        }
        throw new MCPError(ErrorCodes.INTERNAL_ERROR, 'Unable to extract OpenAI service from provider');
    }
    /**
     * Get registry statistics for debugging
     */
    getRegistryStats() {
        return this.toolRegistry.getStats();
    }
    /**
     * Check if handler is initialized
     */
    getIsInitialized() {
        return this.isInitialized;
    }
    /**
     * Create a fallback provider wrapper for backward compatibility
     * This wraps an OpenAIService in a minimal LLMProvider interface
     */
    createFallbackProvider(openaiService) {
        // Create a minimal provider wrapper that delegates to the OpenAI service
        // This maintains backward compatibility while using the new interface
        return {
            metadata: {
                name: 'openai-fallback',
                displayName: 'OpenAI (Fallback)',
                version: '1.0.0',
                description: 'Fallback OpenAI provider for backward compatibility',
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
                    streaming: false,
                }
            },
            async initialize(config) {
                // OpenAIService is already initialized
            },
            async validateConnection() {
                // For backward compatibility, assume connection is valid
                return true;
            },
            // Delegate all methods to the OpenAI service
            // Note: This is a simplified implementation for backward compatibility
            // In a full implementation, you would properly map all methods
            async createAssistant(request) {
                return openaiService.createAssistant(request);
            },
            async listAssistants(request) {
                return openaiService.listAssistants(request);
            },
            async getAssistant(assistantId) {
                return openaiService.getAssistant(assistantId);
            },
            async updateAssistant(assistantId, request) {
                return openaiService.updateAssistant(assistantId, request);
            },
            async deleteAssistant(assistantId) {
                return openaiService.deleteAssistant(assistantId);
            },
            async createThread(request) {
                return openaiService.createThread(request);
            },
            async getThread(threadId) {
                return openaiService.getThread(threadId);
            },
            async updateThread(threadId, request) {
                return openaiService.updateThread(threadId, request);
            },
            async deleteThread(threadId) {
                return openaiService.deleteThread(threadId);
            },
            async createMessage(threadId, request) {
                return openaiService.createMessage(threadId, request);
            },
            async listMessages(threadId, request) {
                return openaiService.listMessages(threadId, request);
            },
            async getMessage(threadId, messageId) {
                return openaiService.getMessage(threadId, messageId);
            },
            async updateMessage(threadId, messageId, request) {
                return openaiService.updateMessage(threadId, messageId, request);
            },
            async deleteMessage(threadId, messageId) {
                return openaiService.deleteMessage(threadId, messageId);
            },
            async createRun(threadId, request) {
                return openaiService.createRun(threadId, request);
            },
            async listRuns(threadId, request) {
                return openaiService.listRuns(threadId, request);
            },
            async getRun(threadId, runId) {
                return openaiService.getRun(threadId, runId);
            },
            async updateRun(threadId, runId, request) {
                return openaiService.updateRun(threadId, runId, request);
            },
            async cancelRun(threadId, runId) {
                return openaiService.cancelRun(threadId, runId);
            },
            async submitToolOutputs(threadId, runId, request) {
                return openaiService.submitToolOutputs(threadId, runId, request);
            },
            async listRunSteps(threadId, runId, request) {
                return openaiService.listRunSteps(threadId, runId, request);
            },
            async getRunStep(threadId, runId, stepId) {
                return openaiService.getRunStep(threadId, runId, stepId);
            },
            async handleUnsupportedOperation(operation, ...args) {
                throw new Error(`Unsupported operation: ${operation}`);
            }
        };
    }
    /**
     * Debug logging with feature flag support
     */
    log(message, ...args) {
        if (this.config.debug) {
            console.log(`[BaseMCPHandler] ${message}`, ...args);
        }
    }
}
