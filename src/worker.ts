/**
 * Thin HTTP Adapter for Cloudflare Workers
 * 
 * This adapter handles only HTTP-specific concerns:
 * - CORS preflight requests
 * - HTTP method validation
 * - URL path parsing for API key extraction
 * - JSON-RPC request parsing from HTTP body
 * - HTTP response formatting
 * 
 * All business logic is delegated to the shared BaseMCPHandler.
 */

import { BaseMCPHandler, BaseMCPHandlerConfig, CloudflareWorkerTransportAdapter } from '../shared/core/index.js';
import { HTTPTransportAdapter } from '../shared/core/transport-adapters.js';
import { initializeGlobalConfig, ConfigUtils } from '../shared/config/index.js';
import { Env } from '@shared/types';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const httpAdapter = new HTTPTransportAdapter();

    try {
      // Handle CORS preflight requests
      if (request.method === 'OPTIONS') {
        return httpAdapter.createCORSResponse();
      }

      // Only allow POST requests for MCP
      if (request.method !== 'POST') {
        return httpAdapter.createMethodNotAllowedResponse();
      }

      // Extract API key from URL path
      const url = new URL(request.url);
      const { apiKey, error: apiKeyError } = httpAdapter.extractApiKeyFromPath(url.pathname);
      
      if (apiKeyError) {
        return httpAdapter.createResponse(apiKeyError, 400);
      }

      // Parse and validate JSON-RPC request
      const { mcpRequest, error: parseError } = await httpAdapter.parseRequest(request);
      
      if (parseError) {
        return httpAdapter.createResponse(parseError, 400);
      }

      if (!mcpRequest) {
        // This shouldn't happen with current logic, but handle gracefully
        return httpAdapter.createResponse(
          { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid request' } },
          400
        );
      }

      // Initialize global configuration system for Cloudflare Workers
      await initializeGlobalConfig();

      // Create production configuration with feature flags
      const productionConfig = ConfigUtils.createProductionConfig();
      
      // Create and configure the shared MCP handler
      const config: BaseMCPHandlerConfig = {
        apiKey: apiKey!,
        serverName: 'openai-assistants-mcp',
        serverVersion: '2.2.4',
        debug: false, // Disable debug logging in production Workers
        environment: 'production',
        deployment: 'cloudflare',
        capabilities: {
          tools: { listChanged: false },
          resources: { subscribe: false, listChanged: false },
          prompts: { listChanged: false },
          completions: {},
        },
      };

      // Use Cloudflare Workers transport adapter for any transport-specific optimizations
      const transportAdapter = new CloudflareWorkerTransportAdapter();
      const mcpHandler = new BaseMCPHandler(config, transportAdapter);

      // Delegate all business logic to the shared handler
      const response = await mcpHandler.handleRequest(mcpRequest);

      // Return HTTP response with proper headers
      return httpAdapter.createResponse(response, 200);

    } catch (error) {
      console.error('Worker error:', error);
      return httpAdapter.createErrorResponse(error);
    }
  },
};