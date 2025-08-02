/**
 * MCP Handler for Cloudflare Workers with Hono Integration
 *
 * This handler integrates the new provider system and configuration architecture
 * with Hono framework for Cloudflare Workers deployment.
 */

import { BaseMCPHandler, SimpleMCPHandlerConfig } from '../shared/core/base-mcp-handler.js';
import { MCPRequest, MCPResponse } from '../shared/types/index.js';
import { Env } from '../shared/types/cloudflare-types.js';
import { ProviderRegistry, ProviderRegistryConfig } from '../shared/services/provider-registry.js';
import { openaiProviderFactory } from '../shared/services/providers/openai.js';

/**
 * Cloudflare Worker MCP Handler
 *
 * Extends the base MCP handler with Cloudflare Worker-specific functionality
 * and integrates with the new provider system.
 */
export class CloudflareMCPHandler extends BaseMCPHandler {
  private env: Env;

  constructor(env: Env) {
    // Validate required API key
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required but not configured in Cloudflare Secrets');
    }

    // Read configuration from environment variables with fallbacks
    const config: SimpleMCPHandlerConfig = {
      apiKey: env.OPENAI_API_KEY,
      serverName: env.SERVER_NAME || 'openai-assistants-mcp',
      serverVersion: env.SERVER_VERSION || '3.0.1',
      debug: env.DEBUG === 'true',
      capabilities: {
        tools: { listChanged: false },
        resources: { subscribe: false, listChanged: false },
        prompts: { listChanged: false },
        completions: {},
      },
    };

    // Create and initialize provider registry
    const providerRegistry = CloudflareMCPHandler.createProviderRegistry(env);

    super(config, providerRegistry);
    this.env = env;
  }

  /**
   * Create and initialize the provider registry synchronously
   * This creates the registry and registers the factory, but doesn't initialize providers yet
   */
  private static createProviderRegistry(env: Env): ProviderRegistry {
    // Create Provider Registry Config with MVP settings
    const registryConfig: ProviderRegistryConfig = {
      defaultProvider: 'openai',
      providers: [
        {
          provider: 'openai',
          enabled: true,
          config: { apiKey: env.OPENAI_API_KEY },
        },
      ],
      // MVP: Advanced features removed - implement later
      // enableHealthChecks: true,
      // healthCheckInterval: 60000, // 1 minute
      // maxRetryAttempts: 3,
      // retryDelay: 5000, // 5 seconds
    };

    // Initialize the registry
    const providerRegistry = new ProviderRegistry(registryConfig);
    providerRegistry.registerFactory(openaiProviderFactory);
    
    // Initialize the registry asynchronously in the background
    // This is a fire-and-forget operation for backward compatibility
    setTimeout(async () => {
      try {
        await providerRegistry.initialize();
        console.log('[CloudflareMCPHandler] Provider registry initialized successfully');
      } catch (error) {
        console.error('[CloudflareMCPHandler] Failed to initialize provider registry:', error);
      }
    }, 0);

    return providerRegistry;
  }

  /**
   * Static factory method for proper async initialization
   * Use this method instead of the constructor when you need to ensure
   * the provider registry is fully initialized before use
   */
  static async create(env: Env): Promise<CloudflareMCPHandler> {
    // Validate required API key
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required but not configured in Cloudflare Secrets');
    }

    // Read configuration from environment variables with fallbacks
    const config: SimpleMCPHandlerConfig = {
      apiKey: env.OPENAI_API_KEY,
      serverName: env.SERVER_NAME || 'openai-assistants-mcp',
      serverVersion: env.SERVER_VERSION || '3.0.1',
      debug: env.DEBUG === 'true',
      capabilities: {
        tools: { listChanged: false },
        resources: { subscribe: false, listChanged: false },
        prompts: { listChanged: false },
        completions: {},
      },
    };

    // Create Provider Registry Config with MVP settings
    const registryConfig: ProviderRegistryConfig = {
      defaultProvider: 'openai',
      providers: [
        {
          provider: 'openai',
          enabled: true,
          config: { apiKey: env.OPENAI_API_KEY },
        },
      ],
      // MVP: Advanced features removed - implement later
      // enableHealthChecks: true,
      // healthCheckInterval: 60000, // 1 minute
      // maxRetryAttempts: 3,
      // retryDelay: 5000, // 5 seconds
    };

    // Initialize the registry
    const providerRegistry = new ProviderRegistry(registryConfig);
    providerRegistry.registerFactory(openaiProviderFactory);
    await providerRegistry.initialize(); // Properly await initialization

    // Create handler instance with initialized registry
    const handler = Object.create(CloudflareMCPHandler.prototype);
    BaseMCPHandler.call(handler, config, providerRegistry);
    handler.env = env;
    return handler;
  }



  /**
   * Handle MCP request with Cloudflare-specific optimizations
   */
  async handleMCPRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      // Use the base handler's request processing
      return await this.handleRequest(request);
    } catch (error) {
      // Enhanced error handling for Cloudflare environment
      console.error('MCP request failed:', error);
      
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal server error',
          data: {
            timestamp: new Date().toISOString(),
            environment: 'cloudflare',
          },
        },
      };
    }
  }

  /**
   * Validate API key from environment
   */
  validateApiKey(): boolean {
    return !!this.env.OPENAI_API_KEY && this.env.OPENAI_API_KEY.length > 0;
  }

  /**
   * Get health status
   */
  getHealthStatus(): { status: string; timestamp: string; version: string } {
    return {
      status: this.validateApiKey() ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: this.env.SERVER_VERSION || '3.0.1',
    };
  }
}