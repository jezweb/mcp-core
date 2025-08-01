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
import { getAllResources, getResource, getResourceContent } from '../resources/index.js';
import { setupHandlerSystem, generateToolDefinitions } from './index.js';
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
    constructor(config, transportAdapter) {
        this.promptHandlers = {};
        this.completionHandlers = {};
        this.isInitialized = false;
        // Set default configuration
        this.config = {
            serverName: 'openai-assistants-mcp',
            serverVersion: '1.0.0',
            debug: false,
            capabilities: {
                tools: { listChanged: false },
                resources: { subscribe: false, listChanged: false },
                prompts: { listChanged: false },
                completions: {},
            },
            ...config,
        };
        this.transportAdapter = transportAdapter;
        this.openaiService = new OpenAIService(config.apiKey);
        // Initialize the handler system once (performance optimization)
        this.initializeHandlerSystem();
        this.initializePromptHandlers();
        this.initializeCompletionHandlers();
    }
    /**
     * Initialize the handler system with performance optimizations
     */
    initializeHandlerSystem() {
        const context = {
            openaiService: this.openaiService,
            toolName: '',
            requestId: null
        };
        console.log('[BaseMCPHandler] DEBUG: Starting handler system initialization...');
        this.log('Initializing handler system...');
        try {
            this.toolRegistry = setupHandlerSystem(context);
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
        // Log pagination metadata
        const metadata = createPaginationMetadata(paginationParams, paginationResult);
        this.log('Tools pagination:', metadata);
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
            // Update context for this specific request (no registry recreation)
            const currentContext = {
                openaiService: this.openaiService,
                toolName: name,
                requestId: request.id
            };
            // Update the existing registry's context instead of recreating it
            this.updateRegistryContext(currentContext);
            // Execute the tool using the existing registry
            const result = await this.toolRegistry.execute(name, args);
            return {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                },
            };
        }
        catch (error) {
            return {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
        // Log pagination metadata
        const metadata = createPaginationMetadata(paginationParams, paginationResult);
        this.log('Resources pagination:', metadata);
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
     */
    updateApiKey(apiKey) {
        this.config.apiKey = apiKey;
        this.openaiService = new OpenAIService(apiKey);
        // Update the context in the existing registry
        const context = {
            openaiService: this.openaiService,
            toolName: '',
            requestId: null
        };
        this.updateRegistryContext(context);
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
     * Debug logging
     */
    log(message, ...args) {
        if (this.config.debug) {
            console.log(`[BaseMCPHandler] ${message}`, ...args);
        }
    }
}
