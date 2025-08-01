/**
 * NPM Package MCP Handler - Direct Mode Only
 * 
 * This handler uses the shared BaseMCPHandler architecture with direct OpenAI API calls
 * via the StdioTransportAdapter. The previous proxy mode has been eliminated to improve
 * reliability, performance, and maintainability.
 * 
 * Key improvements:
 * - Eliminates proxy mode fragility and network dependencies
 * - Uses direct OpenAI API calls for better performance
 * - Leverages shared core components for consistency
 * - Simplified architecture with fewer failure points
 */

import {
  JsonRpcRequest,
  JsonRpcResponse,
  MCPError,
  ErrorCodes,
  createStandardErrorResponse
} from '@shared/types';
import {
  BaseMCPHandler,
  BaseMCPHandlerConfig,
  StdioTransportAdapter
} from '../../shared/core/index.js';

/**
 * Enhanced MCP Handler for NPM Package - Direct Mode Only
 * 
 * This class extends the shared BaseMCPHandler and uses the StdioTransportAdapter
 * for direct OpenAI API communication. All proxy mode logic has been removed.
 */
export class MCPHandler {
  private baseMCPHandler: BaseMCPHandler;
  private stdioAdapter: StdioTransportAdapter;

  constructor(apiKey: string) {
    // Validate API key
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API key is required and cannot be empty');
    }

    // Create stdio transport adapter for direct mode
    this.stdioAdapter = new StdioTransportAdapter();
    
    // Configure the base MCP handler for direct mode
    const config: BaseMCPHandlerConfig = {
      apiKey: apiKey,
      serverName: 'openai-assistants-mcp',
      serverVersion: '2.2.4',
      debug: process.env.DEBUG === 'true',
      capabilities: {
        tools: { listChanged: false },
        resources: { subscribe: false, listChanged: false },
        prompts: { listChanged: false },
        completions: {},
      },
    };

    // Initialize the base handler with stdio transport adapter
    this.baseMCPHandler = new BaseMCPHandler(config, this.stdioAdapter);
  }

  /**
   * Handle incoming MCP requests using direct mode only
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

      // Use the shared base handler for all requests (direct mode only)
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
    }
  }
}