#!/usr/bin/env node

/**
 * Thin Stdio Adapter for NPM Package
 *
 * This adapter handles only stdio-specific concerns:
 * - Process error handling and graceful shutdown
 * - Readline interface setup for stdin/stdout
 * - JSON-RPC message parsing from stdio lines
 * - MCP protocol initialization handshake
 * - Environment variable validation for API key
 * 
 * All business logic is delegated to the shared BaseMCPHandler.
 */

const { BaseMCPHandler } = require('../shared/core/base-mcp-handler.ts');
const { StdioTransportAdapter, RequestRouter } = require('../shared/core/transport-adapters.ts');
const { initializeGlobalConfig, ConfigUtils } = require('../shared/config/index.ts');

/**
 * Thin MCP Server using shared core components
 */
class ThinMCPServer {
  constructor() {
    this.mcpHandler = null;
    this.isInitialized = false;
    this.debug = process.env.DEBUG === 'true';
    
    // Create stdio transport adapter
    this.stdioAdapter = new StdioTransportAdapter(this.debug);
    
    // Setup transport-specific concerns
    this.stdioAdapter.setupErrorHandling();
    this.stdioAdapter.setupStdioInterface(this.handleInput.bind(this));
    
    this.stdioAdapter.logDebug('Thin MCP Server starting with shared core architecture...');
  }

  async handleInput(line) {
    try {
      // Parse and validate request using transport adapter
      const { mcpRequest, error } = this.stdioAdapter.parseRequest(line);
      
      if (error) {
        this.stdioAdapter.sendResponse(error);
        return;
      }
      
      if (!mcpRequest) {
        // Empty line handshake - no response needed
        return;
      }

      // Route request using shared routing logic
      const methodType = RequestRouter.getMethodType(mcpRequest.method);
      
      switch (methodType) {
        case 'initialize':
          await this.handleInitialize(mcpRequest);
          break;
        case 'mcp':
          await this.handleMCPRequest(mcpRequest);
          break;
        default:
          this.stdioAdapter.sendErrorResponse(
            mcpRequest.id, 
            -32601, 
            'Method not found', 
            `Unknown method: ${mcpRequest.method}`
          );
      }

    } catch (error) {
      this.stdioAdapter.logError('Error handling input:', error);
      this.stdioAdapter.sendErrorResponse(null, -32603, 'Internal error', error.message);
    }
  }

  async handleInitialize(request) {
    this.stdioAdapter.logDebug('Handling initialize request:', request.params);

    // Get API key from environment (will be set by MCP client)
    const apiKey = process.env.OPENAI_API_KEY;
    
    // Initialize the shared MCP handler if API key is available
    if (apiKey) {
      try {
        // Initialize global configuration system for NPM package
        await initializeGlobalConfig();

        // Create development configuration with feature flags
        const developmentConfig = ConfigUtils.createDevelopmentConfig();
        
        const config = {
          apiKey,
          serverName: 'openai-assistants-mcp',
          serverVersion: '2.2.4-thin-adapter',
          debug: this.debug,
          environment: 'development',
          deployment: 'npm',
          capabilities: {
            tools: { listChanged: false },
            resources: { subscribe: false, listChanged: false },
            prompts: { listChanged: false },
            completions: {},
          },
        };

        // Use stdio transport adapter for any transport-specific optimizations
        this.mcpHandler = new BaseMCPHandler(config, this.stdioAdapter);
        this.stdioAdapter.logDebug('Shared MCP handler initialized with API key and configuration system');
      } catch (error) {
        this.stdioAdapter.logError('Failed to initialize MCP handler:', error);
        // Don't fail initialization - just log the error
      }
    } else {
      this.stdioAdapter.logDebug('No API key provided during initialization - will validate when tools are called');
    }

    this.isInitialized = true;

    // Send initialization response using transport adapter
    const response = this.stdioAdapter.createInitializeResponse(
      request.id,
      'openai-assistants-mcp',
      '2.2.4-thin-adapter'
    );
    this.stdioAdapter.sendResponse(response);

    // Send immediate server info notification that MCP clients expect
    const notification = this.stdioAdapter.createInitializedNotification();
    this.stdioAdapter.sendResponse(notification);
    
    this.stdioAdapter.logDebug('Initialization complete with shared core architecture');
  }

  async handleMCPRequest(request) {
    if (!this.isInitialized) {
      this.stdioAdapter.sendErrorResponse(request.id, -32002, 'Server not initialized', 'Call initialize first');
      return;
    }

    // Validate API key when tools are actually called
    const { apiKey, error: apiKeyError } = this.stdioAdapter.validateApiKey();
    if (apiKeyError) {
      this.stdioAdapter.sendResponse(apiKeyError);
      return;
    }

    // Initialize MCP handler if not already done or if API key changed
    if (!this.mcpHandler) {
      try {
        // Initialize global configuration system for NPM package
        await initializeGlobalConfig();

        // Create development configuration with feature flags
        const developmentConfig = ConfigUtils.createDevelopmentConfig();
        
        const config = {
          apiKey,
          serverName: 'openai-assistants-mcp',
          serverVersion: '2.2.4-thin-adapter',
          debug: this.debug,
          environment: 'development',
          deployment: 'npm',
          capabilities: {
            tools: { listChanged: false },
            resources: { subscribe: false, listChanged: false },
            prompts: { listChanged: false },
            completions: {},
          },
        };

        this.mcpHandler = new BaseMCPHandler(config, this.stdioAdapter);
        this.stdioAdapter.logDebug('Shared MCP handler initialized/updated with API key and configuration system');
      } catch (error) {
        this.stdioAdapter.logError('Failed to initialize MCP handler:', error);
        this.stdioAdapter.sendErrorResponse(request.id, -32603, 'Internal error', 'Failed to initialize MCP handler');
        return;
      }
    }

    this.stdioAdapter.logDebug(`Processing MCP request: ${request.method} using shared core`);

    try {
      // Delegate all business logic to the shared handler
      const response = await this.mcpHandler.handleRequest(request);
      this.stdioAdapter.sendResponse(response);

    } catch (error) {
      this.stdioAdapter.logError(`MCP request error for ${request.method}:`, error);
      
      const response = {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        }
      };

      this.stdioAdapter.sendResponse(response);
    }
  }
}

// Start the server
if (require.main === module) {
  console.error('[INFO] Starting Thin OpenAI Assistants MCP Server with shared core...');
  console.error('[INFO] API key will be validated when tools are called');
  console.error('[INFO] Using shared BaseMCPHandler for all business logic');
  console.error('[INFO] Transport adapter handles only stdio-specific concerns');
  new ThinMCPServer();
}

module.exports = { ThinMCPServer };