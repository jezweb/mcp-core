/**
 * NPM Package MCP Handler with Proxy Mode Support
 * 
 * This handler extends the shared BaseMCPHandler with NPM package-specific
 * functionality including proxy mode for Cloudflare Workers and direct mode
 * for local OpenAI API calls. It eliminates the previous duplication while
 * preserving all NPM package functionality.
 */

import {
  JsonRpcRequest,
  JsonRpcResponse,
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
  MCPError,
  ErrorCodes,
  createStandardErrorResponse
} from '@shared/types';
import {
  BaseMCPHandler,
  BaseMCPHandlerConfig,
  StdioTransportAdapter,
  ProxyTransportAdapter
} from '../../shared/core/index.js';

/**
 * Enhanced MCP Handler for NPM Package with Proxy Mode Support
 * 
 * This class extends the shared BaseMCPHandler and adds NPM package-specific
 * functionality including proxy mode support and stdio transport handling.
 */
export class MCPHandler {
  private baseMCPHandler: BaseMCPHandler | null = null;
  private isProxyMode: boolean = false;
  private proxyAdapter: ProxyTransportAdapter | null = null;

  constructor(apiKey: string) {
    if (apiKey === 'CLOUDFLARE_PROXY_MODE') {
      throw new Error('API key is required for Cloudflare Worker proxy mode');
    }

    // Check if API key is provided and non-empty
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API key is required and cannot be empty');
    }

    // Use proxy mode for any valid API key (removes sk- prefix requirement)
    // Use Cloudflare Worker with API key in URL
    this.isProxyMode = true;
    const cloudflareWorkerUrl = `https://openai-assistants-mcp.jezweb.ai/mcp/${apiKey}`;
    this.proxyAdapter = new ProxyTransportAdapter(cloudflareWorkerUrl);
    
    // Create a dummy handler for proxy mode (won't be used for tool execution)
    const config: BaseMCPHandlerConfig = {
      apiKey: 'proxy-mode',
      serverName: 'openai-assistants-mcp',
      serverVersion: '1.0.0',
      debug: false,
      capabilities: {
        tools: { listChanged: false },
        resources: { subscribe: false, listChanged: false },
        prompts: { listChanged: false },
        completions: {},
      },
    };
    this.baseMCPHandler = new BaseMCPHandler(config, this.proxyAdapter);
  }

  /**
   * Handle incoming MCP requests with proxy mode support
   */
  async handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    try {
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

      // If in proxy mode, forward the request to Cloudflare Worker
      if (this.isProxyMode && this.proxyAdapter) {
        return await this.proxyAdapter.forwardToCloudflareWorker(request);
      }

      // Use the shared base handler for direct mode
      if (!this.baseMCPHandler) {
        return createStandardErrorResponse(
          request.id,
          ErrorCodes.INTERNAL_ERROR,
          'Handler not initialized',
          {
            mode: 'direct',
            timestamp: new Date().toISOString()
          }
        );
      }

      return await this.baseMCPHandler.handleRequest(request);
    } catch (error) {
      return createStandardErrorResponse(
        request.id,
        ErrorCodes.INTERNAL_ERROR,
        'Internal error',
        {
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          mode: this.isProxyMode ? 'proxy' : 'direct'
        }
      );
    }
  }

  /**
   * Create error response in the format expected by the NPM package
   * @deprecated Use createStandardErrorResponse instead for JSON-RPC 2.0 compliance
   */
  private createErrorResponse(
    id: string | number | null,
    code: number,
    message: string,
    data?: any
  ): JsonRpcResponse {
    return createStandardErrorResponse(id, code, message, data);
  }

  /**
   * Get registry statistics (for debugging)
   */
  getStats() {
    return this.baseMCPHandler?.getRegistryStats() || { totalHandlers: 0, handlersByCategory: {}, registeredTools: [] };
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
    if (this.baseMCPHandler && !this.isProxyMode) {
      this.baseMCPHandler.updateApiKey(apiKey);
    }
  }
}