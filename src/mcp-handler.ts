/**
 * Cloudflare Workers MCP Handler
 * 
 * This handler extends the shared BaseMCPHandler with Cloudflare Workers-specific
 * optimizations and transport handling. It eliminates the previous duplication
 * while preserving all Cloudflare Workers functionality.
 */

import {
  MCPRequest,
  MCPResponse,
} from '@shared/types';
import {
  BaseMCPHandler,
  BaseMCPHandlerConfig,
  CloudflareWorkerTransportAdapter
} from '../shared/core/index.js';

/**
 * Cloudflare Workers-specific MCP Handler
 * 
 * This class extends the shared BaseMCPHandler and adds Cloudflare Workers-specific
 * optimizations and transport handling. It maintains all the functionality of the
 * original handler while eliminating code duplication.
 */
export class MCPHandler extends BaseMCPHandler {
  constructor(apiKey: string) {
    // Configure for Cloudflare Workers environment
    const config: BaseMCPHandlerConfig = {
      apiKey,
      serverName: 'openai-assistants-mcp',
      serverVersion: '1.0.0',
      debug: false, // Disable debug logging in production Workers
      capabilities: {
        tools: { listChanged: false },
        resources: { subscribe: false, listChanged: false },
        completions: {},
      },
    };

    // Use Cloudflare Workers transport adapter
    const transportAdapter = new CloudflareWorkerTransportAdapter();

    super(config, transportAdapter);
  }

  /**
   * Handle MCP request with Cloudflare Workers optimizations
   * 
   * This method maintains the same interface as the original handler
   * but now uses the shared base implementation with Workers-specific transport.
   */
  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    // Use the shared base handler implementation
    return super.handleRequest(request);
  }

  /**
   * Get registry statistics (for debugging and monitoring)
   */
  getStats() {
    return this.getRegistryStats();
  }
}