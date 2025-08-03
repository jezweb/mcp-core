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

import {
  MCPRequest,
  MCPResponse,
  MCPInitializeRequest,
  MCPInitializeResponse,
  MCPToolsListRequest,
  MCPToolsListResponse,
  MCPToolsCallRequest,
  MCPToolsCallResponse,
  MCPResourcesListRequest,
  MCPResourcesListResponse,
  MCPResourcesReadRequest,
  MCPResourcesReadResponse,
  MCPPromptsListRequest,
  MCPPromptsListResponse,
  MCPPromptsGetRequest,
  MCPPromptsGetResponse,
  MCPCompletionRequest,
  MCPCompletionResponse,
  MCPError,
  ErrorCodes,
  LegacyErrorCodes,
  createEnhancedError,
  createStandardErrorResponse,
} from '../types/index.js';
import { OpenAIService } from '../services/openai-service.js';
import {
  LLMProvider,
  ProviderRegistry,
  getGlobalProviderRegistry,
  initializeGlobalProviderRegistry,
} from '../types/generic-types.js';
import { openaiProviderFactory } from '../services/providers/openai.js';
import { getAllResources, getResource, getResourceContent } from '../resources/index.js';
import { parseProviderFromPath, isSupportedProvider } from './url-parser.js';
import { ToolRegistry } from './tool-registry.js';
import { createFlatHandlerMap, validateHandlerCompleteness, HANDLER_CATEGORIES } from './handlers/index.js';
import { generateToolDefinitions } from './tool-definitions.js';
import { createPromptHandlers, PromptHandlerContext } from './handlers/prompt-handlers.js';
import { createCompletionHandlers, CompletionHandlerContext } from './handlers/completion-handlers.js';
import {
  paginateArray,
  validatePaginationParams,
  createPaginationMetadata,
  PAGINATION_DEFAULTS
} from './pagination-utils.js';

/**
 * Simple configuration interface for the base MCP handler
 */
export interface SimpleMCPHandlerConfig {
  /** OpenAI API key (for backward compatibility) */
  apiKey?: string;
  /** Server name for identification */
  serverName?: string;
  /** Server version */
  serverVersion?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom capabilities */
  capabilities?: {
    tools?: { listChanged?: boolean };
    resources?: { subscribe?: boolean; listChanged?: boolean };
    prompts?: { listChanged?: boolean };
    completions?: {};
  };
}

// Import TransportAdapter from transport-adapters module
import { TransportAdapter } from './transport-adapters.js';

/**
 * Base MCP Handler class that consolidates all deployment targets
 * 
 * This class implements the core MCP protocol logic and can be extended
 * or adapted for different deployment environments through the adapter pattern.
 */
export class BaseMCPHandler {
  protected providerRegistry: ProviderRegistry;
  protected toolRegistry!: ToolRegistry; // Definite assignment assertion - initialized in initializeHandlerSystem
  protected promptHandlers: Record<string, any> = {};
  protected completionHandlers: Record<string, any> = {};
  protected config: SimpleMCPHandlerConfig & {
    serverName: string;
    serverVersion: string;
    debug: boolean;
    capabilities: NonNullable<SimpleMCPHandlerConfig['capabilities']>;
  };
  protected transportAdapter?: TransportAdapter;
  protected isInitialized: boolean = false;

  constructor(config: SimpleMCPHandlerConfig, providerRegistryOrTransportAdapter?: ProviderRegistry | TransportAdapter, transportAdapter?: TransportAdapter) {
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
        this.providerRegistry = providerRegistryOrTransportAdapter as ProviderRegistry;
        this.transportAdapter = transportAdapter;
      } else {
        // It's a TransportAdapter (backward compatibility mode)
        this.transportAdapter = providerRegistryOrTransportAdapter as TransportAdapter;
        // Create a default provider registry for backward compatibility
        this.providerRegistry = this.createBackwardCompatibilityRegistry(config);
      }
    } else {
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
  private createBackwardCompatibilityRegistry(config: SimpleMCPHandlerConfig): ProviderRegistry {
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
  private initializeHandlerSystem(): void {
    // Get the default provider from the registry
    let provider = this.providerRegistry.getDefaultProvider();
    let openaiService: OpenAIService;

    if (!provider) {
      // If no provider is available yet (registry not initialized), use fallback
      console.warn('[BaseMCPHandler] No default provider available yet, using fallback OpenAI service');
      if (this.config.apiKey) {
        openaiService = new OpenAIService(this.config.apiKey);
      } else {
        throw new MCPError(ErrorCodes.INTERNAL_ERROR, 'No provider available and no API key for fallback');
      }
    } else {
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
      
      // Log registered tools for debugging (dynamic count)
      const registeredTools = this.toolRegistry.getRegisteredTools();
      console.log(`[BaseMCPHandler] DEBUG: Registry returned ${registeredTools.length} tools`);
      this.log(`Registered ${registeredTools.length} tools:`, registeredTools);
      
      // Dynamic validation - no hardcoded tool count assumption
      if (registeredTools.length > 0) {
        console.log(`[BaseMCPHandler] SUCCESS: ${registeredTools.length} tools registered successfully`);
      } else {
        console.warn('[BaseMCPHandler] WARNING: No tools were registered');
      }
    } catch (error) {
      console.error('[BaseMCPHandler] FATAL ERROR during handler system initialization:', error);
      throw error;
    }
  }

  /**
   * Initialize the prompt handlers system
   */
  private initializePromptHandlers(): void {
    const context: PromptHandlerContext = {
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
  private initializeCompletionHandlers(): void {
    const context: CompletionHandlerContext = {
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
  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      // Transport-specific preprocessing
      if (this.transportAdapter?.preprocessRequest) {
        request = await this.transportAdapter.preprocessRequest(request);
      }

      // Check if we have provider information in the request context
      let provider: LLMProvider | undefined;
      
      // Check if we have provider information in the request context
      if ((request as any).provider) {
        const providerName = (request as any).provider;
        
        // Validate provider name format
        if (typeof providerName === 'string' && providerName.trim().length > 0) {
          // Get the provider from registry
          provider = this.providerRegistry.getProvider(providerName);
          
          // If provider not found, throw appropriate error
          if (!provider) {
            const availableProviders = Array.from(this.providerRegistry['providers'].keys());
            throw new MCPError(
              ErrorCodes.METHOD_NOT_FOUND,
              `Provider not found: ${providerName}`,
              {
                availableProviders: availableProviders,
                requestedProvider: providerName
              }
            );
          }
        }
      }
      
      // If no specific provider requested, use default provider
      if (!provider) {
        provider = this.providerRegistry.getDefaultProvider();
      }
      
      if (!provider) {
        throw new MCPError(ErrorCodes.INTERNAL_ERROR, 'No default provider available');
      }

      // Route to appropriate handler
      let response: MCPResponse;
      switch (request.method) {
        case 'initialize':
          response = await this.handleInitialize(request as MCPInitializeRequest);
          break;
        case 'tools/list':
          response = await this.handleToolsList(request as MCPToolsListRequest);
          break;
        case 'tools/call':
          response = await this.handleToolsCall(request as MCPToolsCallRequest);
          break;
        case 'resources/list':
          response = await this.handleResourcesList(request as MCPResourcesListRequest);
          break;
        case 'resources/read':
          response = await this.handleResourcesRead(request as MCPResourcesReadRequest);
          break;
        case 'prompts/list':
          response = await this.handlePromptsList(request as MCPPromptsListRequest);
          break;
        case 'prompts/get':
          response = await this.handlePromptsGet(request as MCPPromptsGetRequest);
          break;
        case 'completion/complete':
          response = await this.handleCompletion(request as MCPCompletionRequest);
          break;
        default:
          throw new MCPError(
            ErrorCodes.METHOD_NOT_FOUND,
            `Method not found: ${request.method}`
          );
      }

      // Transport-specific postprocessing
      if (this.transportAdapter?.postprocessResponse) {
        response = await this.transportAdapter.postprocessResponse(response);
      }

      return response;
    } catch (error) {
      return this.handleError(error, request.id);
    }
  }

  /**
   * Handle initialize requests
   */
  protected async handleInitialize(request: MCPInitializeRequest): Promise<MCPInitializeResponse> {
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
   * Handle tools list requests - returns all tools (no pagination needed)
   */
  protected async handleToolsList(request: MCPToolsListRequest): Promise<MCPToolsListResponse> {
    this.log('Generating tool definitions...');
    
    // Use the shared tool definition generator for consistency
    const allTools = generateToolDefinitions(this.toolRegistry);
    this.log(`Generated ${allTools.length} tool definitions`);
    
    // Log tool count for debugging (no hardcoded validation)
    this.log(`Tool definitions generated: ${allTools.length} tools available`);

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        tools: allTools,
      },
    };
  }

  /**
   * Handle tools call requests with optimized registry usage
   */
  protected async handleToolsCall(request: MCPToolsCallRequest): Promise<MCPToolsCallResponse> {
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
      
      // Get the provider for this request based on context or default
      let provider: LLMProvider | undefined;
      
      // Check if we have provider information in the request context
      if ((request as any).provider) {
        const providerName = (request as any).provider;
        
        // Validate provider name format
        if (typeof providerName !== 'string' || providerName.trim().length === 0) {
          throw new MCPError(ErrorCodes.INVALID_PARAMS, `Invalid provider name: ${providerName}`);
        }
        
        // Get the provider from registry
        provider = this.providerRegistry.getProvider(providerName);
        
        // If provider not found, throw appropriate error
        if (!provider) {
          const availableProviders = this.providerRegistry.getAvailableProviders();
          throw new MCPError(
            ErrorCodes.METHOD_NOT_FOUND,
            `Provider not found: ${providerName}`,
            {
              availableProviders: availableProviders.map(p => p.metadata.name),
              requestedProvider: providerName
            }
          );
        }
      }
      
      // If no specific provider requested, use default provider
      if (!provider) {
        provider = this.providerRegistry.getDefaultProvider();
      }
      
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
    } catch (error) {
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
  protected async handleResourcesList(request: MCPResourcesListRequest): Promise<MCPResourcesListResponse> {
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
        resources: paginationResult.items.map((resource: any) => ({
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
  protected async handleResourcesRead(request: MCPResourcesReadRequest): Promise<MCPResourcesReadResponse> {
    const { uri } = request.params;
    
    const resourceData = getResource(uri) as any;
    if (!resourceData) {
      throw createEnhancedError(
        LegacyErrorCodes.NOT_FOUND,
        `Resource not found: ${uri}`,
        {
          resourceUri: uri,
          availableResources: getAllResources().map((r: any) => r.uri)
        }
      );
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
            name: resourceData.name,           // Add required name field
            mimeType: resourceData.mimeType,
            text: textContent,                 // Ensure content is always a string
          },
        ],
      },
    };
  }

  /**
   * Handle prompts list requests
   */
  protected async handlePromptsList(request: MCPPromptsListRequest): Promise<MCPPromptsListResponse> {
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
    } catch (error) {
      throw error instanceof MCPError ? error : new MCPError(
        ErrorCodes.INTERNAL_ERROR,
        `Failed to list prompts: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Handle prompts get requests
   */
  protected async handlePromptsGet(request: MCPPromptsGetRequest): Promise<MCPPromptsGetResponse> {
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
    } catch (error) {
      throw error instanceof MCPError ? error : new MCPError(
        ErrorCodes.INTERNAL_ERROR,
        `Failed to get prompt: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Handle completion requests
   */
  protected async handleCompletion(request: MCPCompletionRequest): Promise<MCPCompletionResponse> {
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
    } catch (error) {
      throw error instanceof MCPError ? error : new MCPError(
        ErrorCodes.INTERNAL_ERROR,
        `Failed to handle completion: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update registry context without recreating the entire registry
   * This is a performance optimization to avoid the registry recreation issue
   */
  private updateRegistryContext(newContext: any): void {
    // Update the context for all registered handlers
    for (const toolName of this.toolRegistry.getRegisteredTools()) {
      const handler = this.toolRegistry.getHandler(toolName);
      if (handler) {
        (handler as any).context = newContext;
      }
    }
  }

  /**
   * Centralized error handling with transport adapter support and JSON-RPC 2.0 compliance
   */
  protected handleError(error: any, requestId: string | number | null): MCPResponse {
    let mcpError: MCPError;
    
    if (error instanceof MCPError) {
      mcpError = error;
    } else {
      // Create enhanced error for unknown errors
      mcpError = new MCPError(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Unknown error',
        {
          originalError: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error,
          timestamp: new Date().toISOString(),
          requestId
        }
      );
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
  updateApiKey(apiKey: string): void {
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
  private getOpenAIServiceFromProvider(provider: LLMProvider | undefined): OpenAIService {
    if (!provider) {
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, 'No provider available');
    }

    // For now, we assume the provider is an OpenAI provider
    // In a full implementation, you might want to check the provider type
    // and handle different provider types appropriately
    
    // Access the underlying OpenAI service from the provider
    // This assumes the OpenAI provider exposes its internal service
    if ((provider as any).openaiService) {
      return (provider as any).openaiService;
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
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Create a fallback provider wrapper for backward compatibility
   * This wraps an OpenAIService in a minimal LLMProvider interface
   */
  private createFallbackProvider(openaiService: OpenAIService): LLMProvider {
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
      
      async initialize(config: Record<string, any>): Promise<void> {
        // OpenAIService is already initialized
      },
      
      async validateConnection(): Promise<boolean> {
        // For backward compatibility, assume connection is valid
        return true;
      },
      
      // Delegate all methods to the OpenAI service
      // Note: This is a simplified implementation for backward compatibility
      // In a full implementation, you would properly map all methods
      
      async createAssistant(request: any): Promise<any> {
        return openaiService.createAssistant(request);
      },
      
      async listAssistants(request?: any): Promise<any> {
        return openaiService.listAssistants(request);
      },
      
      async getAssistant(assistantId: string): Promise<any> {
        return openaiService.getAssistant(assistantId);
      },
      
      async updateAssistant(assistantId: string, request: any): Promise<any> {
        return openaiService.updateAssistant(assistantId, request);
      },
      
      async deleteAssistant(assistantId: string): Promise<any> {
        return openaiService.deleteAssistant(assistantId);
      },
      
      async createThread(request?: any): Promise<any> {
        return openaiService.createThread(request);
      },
      
      async getThread(threadId: string): Promise<any> {
        return openaiService.getThread(threadId);
      },
      
      async updateThread(threadId: string, request: any): Promise<any> {
        return openaiService.updateThread(threadId, request);
      },
      
      async deleteThread(threadId: string): Promise<any> {
        return openaiService.deleteThread(threadId);
      },
      
      async createMessage(threadId: string, request: any): Promise<any> {
        return openaiService.createMessage(threadId, request);
      },
      
      async listMessages(threadId: string, request?: any): Promise<any> {
        return openaiService.listMessages(threadId, request);
      },
      
      async getMessage(threadId: string, messageId: string): Promise<any> {
        return openaiService.getMessage(threadId, messageId);
      },
      
      async updateMessage(threadId: string, messageId: string, request: any): Promise<any> {
        return openaiService.updateMessage(threadId, messageId, request);
      },
      
      async deleteMessage(threadId: string, messageId: string): Promise<any> {
        return openaiService.deleteMessage(threadId, messageId);
      },
      
      async createRun(threadId: string, request: any): Promise<any> {
        return openaiService.createRun(threadId, request);
      },
      
      async listRuns(threadId: string, request?: any): Promise<any> {
        return openaiService.listRuns(threadId, request);
      },
      
      async getRun(threadId: string, runId: string): Promise<any> {
        return openaiService.getRun(threadId, runId);
      },
      
      async updateRun(threadId: string, runId: string, request: any): Promise<any> {
        return openaiService.updateRun(threadId, runId, request);
      },
      
      async cancelRun(threadId: string, runId: string): Promise<any> {
        return openaiService.cancelRun(threadId, runId);
      },
      
      async submitToolOutputs(threadId: string, runId: string, request: any): Promise<any> {
        return openaiService.submitToolOutputs(threadId, runId, request);
      },
      
      async listRunSteps(threadId: string, runId: string, request?: any): Promise<any> {
        return openaiService.listRunSteps(threadId, runId, request);
      },
      
      async getRunStep(threadId: string, runId: string, stepId: string): Promise<any> {
        return openaiService.getRunStep(threadId, runId, stepId);
      },
      
      async handleUnsupportedOperation(operation: string, ...args: any[]): Promise<any> {
        throw new Error(`Unsupported operation: ${operation}`);
      }
    };
  }

  /**
   * Debug logging with feature flag support
   */
  protected log(message: string, ...args: any[]): void {
    if (this.config.debug) {
      console.log(`[BaseMCPHandler] ${message}`, ...args);
    }
  }
}