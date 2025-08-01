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
import { OpenAIService } from '../services/index.js';
import { getAllResources, getResource, getResourceContent } from '../resources/index.js';
import { ToolRegistry } from './tool-registry.js';
import { createFlatHandlerMap, validateHandlerCompleteness, TOTAL_TOOL_COUNT, HANDLER_CATEGORIES } from './handlers/index.js';
import { generateToolDefinitions } from './tool-definitions.js';
import { createPromptHandlers, PromptHandlerContext } from './handlers/prompt-handlers.js';
import { createCompletionHandlers, CompletionHandlerContext } from './handlers/completion-handlers.js';
import {
  paginateArray,
  validatePaginationParams,
  createPaginationMetadata,
  PAGINATION_DEFAULTS
} from './pagination-utils.js';
import {
  ConfigurationSystem,
  getGlobalConfigSystem,
  isFeatureEnabled,
  getConfig,
  type MCPServerConfig,
  type EvaluationContext
} from '../config/index.js';

/**
 * Configuration interface for the base MCP handler
 */
export interface BaseMCPHandlerConfig {
  /** OpenAI API key */
  apiKey: string;
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
  /** Configuration system instance (optional) */
  configSystem?: ConfigurationSystem;
  /** Environment for feature flag evaluation */
  environment?: string;
  /** Deployment type for feature flag evaluation */
  deployment?: string;
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
  protected openaiService: OpenAIService;
  protected toolRegistry!: ToolRegistry; // Definite assignment assertion - initialized in initializeHandlerSystem
  protected promptHandlers: Record<string, any> = {};
  protected completionHandlers: Record<string, any> = {};
  protected config: BaseMCPHandlerConfig & {
    serverName: string;
    serverVersion: string;
    debug: boolean;
    capabilities: NonNullable<BaseMCPHandlerConfig['capabilities']>;
    environment: string;
    deployment: string;
  };
  protected transportAdapter?: TransportAdapter;
  protected isInitialized: boolean = false;
  protected configSystem: ConfigurationSystem;
  protected evaluationContext: EvaluationContext;

  constructor(config: BaseMCPHandlerConfig, transportAdapter?: TransportAdapter) {
    // Set default configuration
    this.config = {
      ...config,
      serverName: config.serverName || 'openai-assistants-mcp',
      serverVersion: config.serverVersion || '2.2.4',
      debug: config.debug || false,
      capabilities: {
        tools: { listChanged: false },
        resources: { subscribe: false, listChanged: false },
        prompts: { listChanged: false },
        completions: {},
        ...config.capabilities,
      },
      environment: config.environment || 'development',
      deployment: config.deployment || 'local',
    };

    this.transportAdapter = transportAdapter;
    this.openaiService = new OpenAIService(config.apiKey);
    
    // Initialize configuration system
    this.configSystem = config.configSystem || getGlobalConfigSystem();
    
    // Create evaluation context for feature flags
    this.evaluationContext = {
      environment: this.config.environment,
      deployment: this.config.deployment,
      timestamp: new Date().toISOString(),
      metadata: {
        serverName: this.config.serverName,
        serverVersion: this.config.serverVersion,
      },
    };
    
    // Initialize the handler system once (performance optimization)
    this.initializeHandlerSystem();
    this.initializePromptHandlers();
    this.initializeCompletionHandlers();
  }

  /**
   * Initialize the handler system with performance optimizations
   */
  private initializeHandlerSystem(): void {
    const context = {
      openaiService: this.openaiService,
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
      } else {
        console.log('[BaseMCPHandler] SUCCESS: All 22 tools registered correctly');
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
   * Handle tools list requests with pagination support
   */
  protected async handleToolsList(request: MCPToolsListRequest): Promise<MCPToolsListResponse> {
    this.log('Generating tool definitions with pagination...');
    
    // Check if tools feature is enabled
    if (!this.isFeatureEnabled('tools')) {
      throw new MCPError(
        ErrorCodes.METHOD_NOT_FOUND,
        'Tools functionality is disabled'
      );
    }
    
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
    
    // Log pagination metadata if enhanced logging is enabled
    if (this.isFeatureEnabled('enhanced-logging')) {
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
  protected async handleToolsCall(request: MCPToolsCallRequest): Promise<MCPToolsCallResponse> {
    const { name, arguments: args } = request.params;

    // Check if tools feature is enabled
    if (!this.isFeatureEnabled('tools')) {
      throw new MCPError(
        ErrorCodes.METHOD_NOT_FOUND,
        'Tools functionality is disabled'
      );
    }

    try {
      this.log(`Executing tool: ${name}`);
      
      // Enhanced logging for debugging if enabled
      if (this.isFeatureEnabled('enhanced-logging')) {
        this.log(`Tool execution details:`, {
          toolName: name,
          arguments: args,
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
      }
      
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

      // Enhanced result formatting if enabled
      const responseText = this.isFeatureEnabled('enhanced-formatting')
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
      // Enhanced error reporting if enabled
      const errorText = this.isFeatureEnabled('enhanced-error-reporting')
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
    
    // Check if resources feature is enabled
    if (!this.isFeatureEnabled('resources')) {
      throw new MCPError(
        ErrorCodes.METHOD_NOT_FOUND,
        'Resources functionality is disabled'
      );
    }
    
    const allResources = getAllResources();
    this.log(`Found ${allResources.length} resources`);

    // Apply pagination
    const paginationParams = {
      cursor: request.params?.cursor,
      limit: PAGINATION_DEFAULTS.DEFAULT_LIMIT // Use default limit for resources
    };

    const paginationResult = paginateArray(allResources, paginationParams);
    
    // Log pagination metadata if enhanced logging is enabled
    if (this.isFeatureEnabled('enhanced-logging')) {
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
   */
  updateApiKey(apiKey: string): void {
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
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if a feature is enabled using the feature flags system
   */
  protected isFeatureEnabled(flagName: string): boolean {
    return this.configSystem.isFeatureEnabled(flagName, this.evaluationContext);
  }

  /**
   * Get feature configuration
   */
  protected getFeatureConfig(flagName: string): any {
    return this.configSystem.getFeatureConfig(flagName, this.evaluationContext);
  }

  /**
   * Update evaluation context (e.g., when user context changes)
   */
  updateEvaluationContext(updates: Partial<EvaluationContext>): void {
    this.evaluationContext = {
      ...this.evaluationContext,
      ...updates,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get current configuration from the configuration system
   */
  getCurrentConfig(): MCPServerConfig {
    return this.configSystem.getConfiguration();
  }

  /**
   * Debug logging with feature flag support
   */
  protected log(message: string, ...args: any[]): void {
    const shouldLog = this.config.debug || this.isFeatureEnabled('debug-logging');
    if (shouldLog) {
      const timestamp = this.isFeatureEnabled('enhanced-logging')
        ? `[${new Date().toISOString()}] `
        : '';
      console.log(`${timestamp}[BaseMCPHandler] ${message}`, ...args);
    }
  }
}