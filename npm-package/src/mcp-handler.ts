/**
 * NPM Package MCP Handler - Modern ESM Implementation
 *
 * This handler uses the shared BaseMCPHandler architecture with the SimpleMCPHandlerConfig
 * interface for streamlined configuration. It loads configuration from environment variables
 * using dotenv and provides a clean, modern interface for MCP protocol handling.
 *
 * Key features:
 * - Uses SimpleMCPHandlerConfig for simplified configuration
 * - Automatic .env file loading via dotenv
 * - Direct OpenAI API integration via BaseMCPHandler
 * - Modern ESM module structure
 * - Simplified error handling and JSON-RPC compliance
 * - Integrated provider registry system
 */

import {
  JsonRpcRequest,
  JsonRpcResponse,
  MCPError,
  ErrorCodes,
  createStandardErrorResponse
} from '../../shared/types/index.js';
import {
  BaseMCPHandler,
  SimpleMCPHandlerConfig
} from '../../shared/core/base-mcp-handler.js';
import { ProviderRegistry, ProviderRegistryConfig } from '../../shared/services/provider-registry.js';
import { openaiProviderFactory } from '../../shared/services/providers/openai.js';
import { parseProviderFromPath, isSupportedProvider } from '../../shared/core/url-parser.js';

/**
 * Modern MCP Handler for NPM Package
 *
 * This class provides a simplified interface to the BaseMCPHandler using
 * the SimpleMCPHandlerConfig interface and environment-based configuration.
 */
export class MCPHandler {
  private baseMCPHandler: BaseMCPHandler;
  private config: SimpleMCPHandlerConfig;

  constructor(apiKey: string) {
    // Validate API key
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API key is required and cannot be empty');
    }

    // Create simplified configuration using environment variables
    this.config = {
      apiKey: apiKey,
      serverName: process.env.MCP_SERVER_NAME || 'openai-assistants-mcp',
      serverVersion: process.env.MCP_SERVER_VERSION || '3.0.1',
      debug: process.env.DEBUG === 'true' || process.env.MCP_DEBUG === 'true',
      capabilities: {
        tools: { listChanged: false },
        resources: { subscribe: false, listChanged: false },
        prompts: { listChanged: false },
        completions: {},
      },
    };

    // Create and initialize provider registry
    const providerRegistry = MCPHandler.createProviderRegistry(apiKey);

    // Initialize the base handler with provider registry
    this.baseMCPHandler = new BaseMCPHandler(this.config, providerRegistry);
  }

  /**
   * Create and initialize the provider registry synchronously
   * This creates the registry and registers the factory, but doesn't initialize providers yet
   */
  private static createProviderRegistry(apiKey: string): ProviderRegistry {
    // Create Provider Registry Config (MVP)
    const registryConfig: ProviderRegistryConfig = {
      defaultProvider: 'openai',
      providers: [
        {
          provider: 'openai',
          enabled: true,
          config: { apiKey: apiKey },
        },
        // Register additional providers if their API keys are available
        ...(process.env.ANTHROPIC_API_KEY ? [{
          provider: 'anthropic',
          enabled: true,
          config: { apiKey: process.env.ANTHROPIC_API_KEY },
        }] : []),
        ...(process.env.GOOGLE_API_KEY ? [{
          provider: 'gemini',
          enabled: true,
          config: { apiKey: process.env.GOOGLE_API_KEY },
        }] : []),
      ],
      // MVP: Advanced features removed - implement later
      // // Use environment variables for optional settings with defaults
      // enableHealthChecks: process.env.ENABLE_HEALTH_CHECKS !== 'false', // Default to true
      // healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '60000'), // Default 1 minute
      // maxRetryAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3'),
      // retryDelay: parseInt(process.env.RETRY_DELAY || '5000'), // Default 5 seconds
    };

    // Initialize the registry
    const providerRegistry = new ProviderRegistry(registryConfig);
    providerRegistry.registerFactory(openaiProviderFactory);
    
    // Dynamically import and register additional providers if they're available
    try {
      // Try to import Gemini provider
      import('../../shared/services/providers/gemini.js').then((geminiModule) => {
        providerRegistry.registerFactory(geminiModule.geminiProviderFactory);
      }).catch(() => {
        // Gemini provider not available, that's OK
      });
      
      // Try to import Anthropic provider
      import('../../shared/services/providers/anthropic.js').then((anthropicModule) => {
        providerRegistry.registerFactory(anthropicModule.anthropicProviderFactory);
      }).catch(() => {
        // Anthropic provider not available, that's OK
      });
    } catch (error) {
      // Non-critical error - continue with available providers
      console.warn('[MCPHandler] Could not dynamically import additional providers:', error);
    }
    
    // Initialize the registry asynchronously in the background
    // This is a fire-and-forget operation for backward compatibility
    setTimeout(async () => {
      try {
        await providerRegistry.initialize();
        console.log('[MCPHandler] Provider registry initialized successfully');
      } catch (error) {
        console.error('[MCPHandler] Failed to initialize provider registry:', error);
      }
    }, 0);

    return providerRegistry;
  }

  /**
   * Static factory method for proper async initialization
   * Use this method instead of the constructor when you need to ensure
   * the provider registry is fully initialized before use
   */
  static async create(apiKey: string): Promise<MCPHandler> {
    // Validate API key
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API key is required and cannot be empty');
    }

    // Create simplified configuration using environment variables
    const config: SimpleMCPHandlerConfig = {
      apiKey: apiKey,
      serverName: process.env.MCP_SERVER_NAME || 'jezweb-mcp-core',
      serverVersion: process.env.MCP_SERVER_VERSION || '3.0.1',
      debug: process.env.DEBUG === 'true' || process.env.MCP_DEBUG === 'true',
      capabilities: {
        tools: { listChanged: false },
        resources: { subscribe: false, listChanged: false },
        prompts: { listChanged: false },
        completions: {},
      },
    };

    // Create Provider Registry Config (MVP)
    const registryConfig: ProviderRegistryConfig = {
      defaultProvider: 'openai',
      providers: [
        {
          provider: 'openai',
          enabled: true,
          config: { apiKey: apiKey },
        },
        // Register additional providers if their API keys are available
        ...(process.env.ANTHROPIC_API_KEY ? [{
          provider: 'anthropic',
          enabled: true,
          config: { apiKey: process.env.ANTHROPIC_API_KEY },
        }] : []),
        ...(process.env.GOOGLE_API_KEY ? [{
          provider: 'gemini',
          enabled: true,
          config: { apiKey: process.env.GOOGLE_API_KEY },
        }] : []),
      ],
      // MVP: Advanced features removed - implement later
      // enableHealthChecks: process.env.ENABLE_HEALTH_CHECKS !== 'false', // Default to true
      // healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '60000'), // Default 1 minute
      // maxRetryAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3'),
      // retryDelay: parseInt(process.env.RETRY_DELAY || '5000'), // Default 5 seconds
    };

    // Initialize the registry
    const providerRegistry = new ProviderRegistry(registryConfig);
    providerRegistry.registerFactory(openaiProviderFactory);
    await providerRegistry.initialize(); // Properly await initialization

    // Create handler instance with initialized registry
    const handler = Object.create(MCPHandler.prototype);
    handler.config = config;
    handler.baseMCPHandler = new BaseMCPHandler(config, providerRegistry);
    return handler;
  }

  /**
   * Handle incoming MCP requests using the shared BaseMCPHandler
   */
  async handleRequest(request: JsonRpcRequest, urlPath?: string): Promise<JsonRpcResponse> {
    try {
      // If a URL path is provided, parse it for provider information
      if (urlPath) {
        const parseResult = parseProviderFromPath(urlPath);
        
        // If this is an MCP path with a provider, validate the provider
        if (parseResult.isMcpPath && parseResult.provider) {
          // First check if the provider name format is valid
          if (!isValidProviderFormat(parseResult.provider)) {
            return createStandardErrorResponse(
              request.id,
              ErrorCodes.INVALID_REQUEST,
              `Invalid provider name format: ${parseResult.provider}`,
              {
                expectedFormat: 'alphanumeric characters, hyphens, and underscores only',
                timestamp: new Date().toISOString(),
              }
            );
          }
          
          // Then check if the provider is supported
          if (!isSupportedProvider(parseResult.provider)) {
            return createStandardErrorResponse(
              request.id,
              ErrorCodes.METHOD_NOT_FOUND,
              `Unsupported provider: ${parseResult.provider}`,
              {
                supportedProviders: ['openai', 'gemini', 'anthropic'],
                timestamp: new Date().toISOString(),
              }
            );
          }
          
          // Add provider information to the request context
          // This will be used by the BaseMCPHandler to select the appropriate provider
          (request as any).provider = parseResult.provider;
        }
      }

      // Validate JSON-RPC 2.0 format
      if (request.jsonrpc !== '2.0') {
        return createStandardErrorResponse(
          request.id,
          ErrorCodes.INVALID_REQUEST,
          'Invalid JSON-RPC version',
          {
            expected: '2.0',
            received: request.jsonrpc,
            documentation: 'https://www.jsonrpc.org/specification'
          }
        );
      }

      // Delegate to the shared base handler
      return await this.baseMCPHandler.handleRequest(request);
    } catch (error) {
      return createStandardErrorResponse(
        request.id,
        ErrorCodes.INTERNAL_ERROR,
        'Internal error',
        {
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          mode: 'direct'
        }
      );
    }
  }

  /**
   * Handle incoming MCP requests with provider routing support
   *
   * @param request - The JSON-RPC request
   * @param urlPath - The URL path (e.g., '/mcp/openai/tools/list')
   * @returns The JSON-RPC response
   */
  async handleRoutedRequest(request: JsonRpcRequest, urlPath: string): Promise<JsonRpcResponse> {
    try {
      // Parse the URL path to extract provider information
      const parseResult = parseProviderFromPath(urlPath);
      
      // If this is an MCP path with a provider, validate the provider
      if (parseResult.isMcpPath && parseResult.provider) {
        // First check if the provider name format is valid
        if (!isValidProviderFormat(parseResult.provider)) {
          return createStandardErrorResponse(
            request.id,
            ErrorCodes.INVALID_REQUEST,
            `Invalid provider name format: ${parseResult.provider}`,
            {
              expectedFormat: 'alphanumeric characters, hyphens, and underscores only',
              timestamp: new Date().toISOString(),
            }
          );
        }
        
        // Then check if the provider is supported
        if (!isSupportedProvider(parseResult.provider)) {
          return createStandardErrorResponse(
            request.id,
            ErrorCodes.METHOD_NOT_FOUND,
            `Unsupported provider: ${parseResult.provider}`,
            {
              supportedProviders: ['openai', 'gemini', 'anthropic'],
              timestamp: new Date().toISOString(),
            }
          );
        }
        
        // Add provider information to the request context
        // This will be used by the BaseMCPHandler to select the appropriate provider
        (request as any).provider = parseResult.provider;
      }

      // Validate JSON-RPC 2.0 format
      if (request.jsonrpc !== '2.0') {
        return createStandardErrorResponse(
          request.id,
          ErrorCodes.INVALID_REQUEST,
          'Invalid JSON-RPC version',
          {
            expected: '2.0',
            received: request.jsonrpc,
            documentation: 'https://www.jsonrpc.org/specification'
          }
        );
      }

      // Delegate to the shared base handler
      return await this.baseMCPHandler.handleRequest(request);
    } catch (error) {
      return createStandardErrorResponse(
        request.id,
        ErrorCodes.INTERNAL_ERROR,
        'Internal error',
        {
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          mode: 'routed'
        }
      );
    }
  }

  /**
   * Handle incoming MCP requests with provider routing support
   *
   * @param request - The JSON-RPC request
   * @param urlPath - The URL path (e.g., '/mcp/openai/tools/list')
   * @returns The JSON-RPC response
   */
  async handleRoutedRequest(request: JsonRpcRequest, urlPath: string): Promise<JsonRpcResponse> {
    try {
      // Parse the URL path to extract provider information
      const parseResult = parseProviderFromPath(urlPath);
      
      // If this is an MCP path with a provider, validate the provider
      if (parseResult.isMcpPath && parseResult.provider) {
        if (!isSupportedProvider(parseResult.provider)) {
          return createStandardErrorResponse(
            request.id,
            ErrorCodes.METHOD_NOT_FOUND,
            `Unsupported provider: ${parseResult.provider}`,
            {
              supportedProviders: ['openai', 'gemini', 'anthropic'],
              timestamp: new Date().toISOString(),
            }
          );
        }
        
        // Add provider information to the request context
        // This will be used by the BaseMCPHandler to select the appropriate provider
        (request as any).provider = parseResult.provider;
      }

      // Validate JSON-RPC 2.0 format
      if (request.jsonrpc !== '2.0') {
        return createStandardErrorResponse(
          request.id,
          ErrorCodes.INVALID_REQUEST,
          'Invalid JSON-RPC version',
          {
            expected: '2.0',
            received: request.jsonrpc,
            documentation: 'https://www.jsonrpc.org/specification'
          }
        );
      }

      // Delegate to the shared base handler
      return await this.baseMCPHandler.handleRequest(request);
    } catch (error) {
      return createStandardErrorResponse(
        request.id,
        ErrorCodes.INTERNAL_ERROR,
        'Internal error',
        {
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          mode: 'routed'
        }
      );
    }
  }

  /**
   * Get registry statistics (for debugging)
   */
  getStats() {
    return this.baseMCPHandler?.getRegistryStats() || { 
      totalHandlers: 0, 
      handlersByCategory: {}, 
      registeredTools: [] 
    };
  }

  /**
   * Check if handler is initialized
   */
  isInitialized(): boolean {
    return this.baseMCPHandler?.getIsInitialized() || false;
  }

  /**
   * Update API key and reinitialize if needed
   */
  updateApiKey(apiKey: string): void {
    if (this.baseMCPHandler) {
      this.baseMCPHandler.updateApiKey(apiKey);
      this.config.apiKey = apiKey;
    }
  }

  /**
   * Get current configuration (for debugging)
   */
  getConfig(): SimpleMCPHandlerConfig {
    return { ...this.config };
  }
}