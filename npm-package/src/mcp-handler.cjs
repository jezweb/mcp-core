/**
 * NPM Package MCP Handler - Thin Wrapper around BaseMCPHandler
 * 
 * This handler extends the shared BaseMCPHandler with NPM package-specific
 * optimizations and transport handling. It eliminates all code duplication
 * while preserving NPM package functionality.
 */

// Import the shared BaseMCPHandler and related components
const { BaseMCPHandler } = require('../../shared/core/base-mcp-handler.cjs');
const { StdioTransportAdapter } = require('../../shared/core/transport-adapters.cjs');

/**
 * NPM Package-specific MCP Handler
 * 
 * This class extends the shared BaseMCPHandler and adds NPM package-specific
 * optimizations and transport handling. It maintains all the functionality of the
 * original handler while eliminating code duplication.
 */
class MCPHandler extends BaseMCPHandler {
  constructor(apiKey) {
    // Validate API key
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API key is required and cannot be empty');
    }

    // Configure for NPM package environment
    const config = {
      apiKey,
      serverName: 'openai-assistants-mcp',
      serverVersion: '1.0.0',
      debug: false, // Disable debug logging in production
      capabilities: {
        tools: { listChanged: false },
        resources: { subscribe: false, listChanged: false },
        prompts: { listChanged: false },
        completions: {},
      },
    };

    // Use Stdio transport adapter for NPM package
    const transportAdapter = new StdioTransportAdapter();

    super(config, transportAdapter);
    
    console.log(`[NPM-MCPHandler] Initialized using shared BaseMCPHandler with ${this.getRegistryStats().totalHandlers} tools`);
  }

  /**
   * Handle MCP request with NPM package optimizations
   * 
   * This method maintains the same interface as the original handler
   * but now uses the shared base implementation with Stdio-specific transport.
   */
  async handleRequest(request) {
    // Use the shared base handler implementation
    return super.handleRequest(request);
  }

  /**
   * Get registry statistics (for debugging and monitoring)
   */
  getStats() {
    return this.getRegistryStats();
  }

  /**
   * Check if handler is initialized
   */
  isInitialized() {
    return this.getIsInitialized();
  }

  /**
   * Update API key and reinitialize services
   */
  updateApiKey(apiKey) {
    super.updateApiKey(apiKey);
  }
}

module.exports = { MCPHandler };