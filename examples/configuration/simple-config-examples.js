/**
 * Simple Configuration Examples - Jezweb MCP Core v3.0
 * 
 * These examples demonstrate the actual configuration patterns used in the
 * unified provider-agnostic architecture. All examples are based on the
 * real implementation and are production-ready.
 */

// ============================================================================
// CLOUDFLARE WORKERS EXAMPLES
// ============================================================================

/**
 * Example 1: Basic Cloudflare Workers Setup
 * Minimal configuration using environment variables
 */
export const basicCloudflareExample = {
  // wrangler.toml
  wranglerConfig: `
name = "openai-assistants-mcp"
main = "src/worker.js"
compatibility_date = "2024-01-01"

[env.production.vars]
SERVER_NAME = "openai-assistants-mcp"
SERVER_VERSION = "3.0.1"
DEBUG = "false"

# Set via: wrangler secret put OPENAI_API_KEY --env production
`,

  // src/worker.js - Basic implementation without Hono
  workerCode: `
import { CloudflareMCPHandler } from './mcp-handler.js';

export default {
  async fetch(request, env, ctx) {
    try {
      // Validate API key
      if (!env.OPENAI_API_KEY) {
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32001,
            message: 'API key not configured'
          }
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Handler automatically creates provider registry
      const handler = new CloudflareMCPHandler(env);
      
      // Parse MCP request
      const mcpRequest = await request.json();
      
      // Process request through unified architecture
      const response = await handler.handleMCPRequest(mcpRequest);
      
      return new Response(JSON.stringify(response), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: error.message || 'Internal server error',
          data: {
            timestamp: new Date().toISOString(),
            environment: 'cloudflare'
          }
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
`
};

/**
 * Example 2: Advanced Cloudflare Workers Setup
 * With proper async initialization and error handling
 */
export const advancedCloudflareExample = {
  // src/worker.js - Advanced implementation with Hono framework (matches actual implementation)
  workerCode: `
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { CloudflareMCPHandler } from './mcp-handler.js';

// Create Hono app with Cloudflare Worker bindings
const app = new Hono();

// Global middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Conditional logging middleware (only in debug mode)
app.use('*', async (c, next) => {
  const debugEnabled = c.env.DEBUG === 'true';
  if (debugEnabled) {
    return logger()(c, next);
  }
  await next();
});

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    name: c.env.SERVER_NAME || 'openai-assistants-mcp',
    version: c.env.SERVER_VERSION || '3.0.1',
    status: 'running',
    framework: 'Hono',
    deployment: 'cloudflare-workers',
    debug: c.env.DEBUG === 'true',
    timestamp: new Date().toISOString(),
  });
});

// Detailed health check endpoint
app.get('/health', async (c) => {
  try {
    const handler = new CloudflareMCPHandler(c.env);
    const healthStatus = handler.getHealthStatus();
    
    return c.json({
      ...healthStatus,
      name: c.env.SERVER_NAME || 'openai-assistants-mcp',
      framework: 'Hono',
      deployment: 'cloudflare-workers',
      capabilities: {
        tools: true,
        resources: true,
        prompts: true,
        completions: true,
      },
    });
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

// MCP request validation middleware
app.use('/mcp/*', async (c, next) => {
  if (!c.env.OPENAI_API_KEY) {
    return c.json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32001,
        message: 'API key not configured'
      },
    }, 500);
  }

  if (c.req.method !== 'POST') {
    return c.json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32601,
        message: 'Method not allowed. Use POST for MCP requests.'
      },
    }, 405);
  }

  try {
    const mcpHandler = new CloudflareMCPHandler(c.env);
    c.set('mcpHandler', mcpHandler);
  } catch (error) {
    return c.json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32603,
        message: 'Failed to initialize MCP handler',
        data: { error: error.message }
      },
    }, 500);
  }

  await next();
});

// Main MCP endpoint
app.post('/mcp/*', async (c) => {
  const mcpHandler = c.get('mcpHandler');
  
  try {
    const requestBody = await c.req.text();
    
    if (!requestBody) {
      return c.json({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32600,
          message: 'Empty request body'
        },
      }, 400);
    }

    let mcpRequest;
    try {
      mcpRequest = JSON.parse(requestBody);
    } catch (parseError) {
      return c.json({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error'
        },
      }, 400);
    }

    if (!mcpRequest.jsonrpc || !mcpRequest.method) {
      return c.json({
        jsonrpc: '2.0',
        id: mcpRequest.id || null,
        error: {
          code: -32600,
          message: 'Invalid JSON-RPC request'
        },
      }, 400);
    }

    const response = await mcpHandler.handleMCPRequest(mcpRequest);
    return c.json(response);

  } catch (error) {
    console.error('MCP request processing failed:', error);
    
    return c.json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32603,
        message: 'Internal server error',
        data: { error: error.message }
      },
    }, 500);
  }
});

// Export the Hono app
export default app;
`,

  // package.json for Hono-based worker
  packageJson: `
{
  "name": "openai-assistants-mcp-worker",
  "version": "3.0.1",
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy"
  },
  "dependencies": {
    "hono": "^4.0.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.0.0",
    "wrangler": "^3.0.0"
  }
}
`
};

// ============================================================================
// NPM PACKAGE EXAMPLES
// ============================================================================

/**
 * Example 3: Basic NPM Package Setup
 * Simple initialization with environment variables
 */
export const basicNpmExample = {
  // package.json dependencies
  packageJson: `
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "jezweb-mcp-core": "^3.0.0",
    "dotenv": "^16.0.0"
  },
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  }
}
`,

  // .env file
  envFile: `
OPENAI_API_KEY=sk-your-openai-api-key-here
MCP_SERVER_NAME=my-mcp-server
MCP_SERVER_VERSION=1.0.0
DEBUG=true
`,

  // server.js
  serverCode: `
import { MCPHandler } from 'jezweb-mcp-core';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  try {
    // Validate required environment variables
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    // Initialize handler with provider registry
    const handler = new MCPHandler(process.env.OPENAI_API_KEY);
    
    // Verify initialization
    console.log('Handler initialized:', handler.isInitialized());
    console.log('Handler stats:', handler.getStats());
    
    // Example: Process a tools/list request
    const listRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };
    
    const response = await handler.handleRequest(listRequest);
    console.log('Tools available:', response.result?.tools?.length || 0);
    
  } catch (error) {
    console.error('Server initialization failed:', error);
    process.exit(1);
  }
}

main();
`
};

/**
 * Example 4: Advanced NPM Package Setup
 * With proper async initialization and comprehensive error handling
 */
export const advancedNpmExample = {
  // server.js with advanced patterns
  serverCode: `
import { MCPHandler } from 'jezweb-mcp-core';
import dotenv from 'dotenv';
import { createServer } from 'http';

// Load environment variables
dotenv.config();

class MCPServer {
  constructor() {
    this.handler = null;
    this.server = null;
  }
  
  async initialize() {
    try {
      // Validate environment
      this.validateEnvironment();
      
      // Use async factory method for proper initialization
      this.handler = await MCPHandler.create(process.env.OPENAI_API_KEY);
      
      // Verify handler is ready
      if (!this.handler.isInitialized()) {
        throw new Error('Handler failed to initialize properly');
      }
      
      console.log('✅ MCP Handler initialized successfully');
      console.log('📊 Handler stats:', this.handler.getStats());
      
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      throw error;
    }
  }
  
  validateEnvironment() {
    const required = ['OPENAI_API_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(\`Missing required environment variables: \${missing.join(', ')}\`);
    }
  }
  
  async handleRequest(request) {
    try {
      // Validate JSON-RPC 2.0 format
      if (!request.jsonrpc || request.jsonrpc !== '2.0') {
        return {
          jsonrpc: '2.0',
          id: request.id || null,
          error: {
            code: -32600,
            message: 'Invalid Request - must be JSON-RPC 2.0'
          }
        };
      }
      
      // Process through unified architecture
      const response = await this.handler.handleRequest(request);
      
      // Log successful requests in debug mode
      if (process.env.DEBUG === 'true') {
        console.log(\`✅ \${request.method} - Success\`);
      }
      
      return response;
      
    } catch (error) {
      console.error(\`❌ \${request.method} - Error:\`, error);
      
      return {
        jsonrpc: '2.0',
        id: request.id || null,
        error: {
          code: -32603,
          message: 'Internal error',
          data: {
            details: error.message,
            timestamp: new Date().toISOString()
          }
        }
      };
    }
  }
  
  async startHttpServer(port = 3000) {
    this.server = createServer(async (req, res) => {
      if (req.method === 'POST' && req.url === '/mcp') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          try {
            const request = JSON.parse(body);
            const response = await this.handleRequest(request);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              jsonrpc: '2.0',
              id: null,
              error: { code: -32700, message: 'Parse error' }
            }));
          }
        });
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });
    
    this.server.listen(port, () => {
      console.log(\`🚀 MCP Server listening on port \${port}\`);
    });
  }
  
  async shutdown() {
    if (this.server) {
      this.server.close();
      console.log('🛑 Server shutdown complete');
    }
  }
}

// Main execution
async function main() {
  const server = new MCPServer();
  
  try {
    await server.initialize();
    
    // Start HTTP server if requested
    if (process.env.HTTP_PORT) {
      await server.startHttpServer(parseInt(process.env.HTTP_PORT));
    }
    
    // Graceful shutdown handling
    process.on('SIGINT', async () => {
      console.log('\\n🛑 Received SIGINT, shutting down gracefully...');
      await server.shutdown();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Server failed to start:', error);
    process.exit(1);
  }
}

main();
`
};

// ============================================================================
// CONFIGURATION VALIDATION EXAMPLES
// ============================================================================

/**
 * Example 5: Configuration Validation Utilities
 * Helper functions to validate configuration
 */
export const configValidationExample = {
  // validation.js
  validationCode: `
/**
 * Configuration validation utilities
 */

export function validateOpenAIApiKey(apiKey) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }
  
  if (typeof apiKey !== 'string') {
    throw new Error('OpenAI API key must be a string');
  }
  
  if (!apiKey.startsWith('sk-')) {
    throw new Error('OpenAI API key must start with "sk-"');
  }
  
  if (apiKey.length < 20) {
    throw new Error('OpenAI API key appears to be invalid (too short)');
  }
  
  return true;
}

export function validateEnvironment() {
  const config = {
    apiKey: process.env.OPENAI_API_KEY,
    serverName: process.env.MCP_SERVER_NAME || 'jezweb-mcp-core',
    serverVersion: process.env.MCP_SERVER_VERSION || '3.0.1',
    debug: process.env.DEBUG === 'true' || process.env.MCP_DEBUG === 'true'
  };
  
  // Validate API key
  validateOpenAIApiKey(config.apiKey);
  
  // Validate server name
  if (config.serverName && typeof config.serverName !== 'string') {
    throw new Error('Server name must be a string');
  }
  
  // Validate version format
  if (config.serverVersion && !/^\\d+\\.\\d+\\.\\d+/.test(config.serverVersion)) {
    console.warn('Server version should follow semantic versioning (x.y.z)');
  }
  
  return config;
}

export async function testHandlerInitialization(apiKey) {
  const { MCPHandler } = await import('jezweb-mcp-core');
  
  try {
    // Test basic initialization
    const handler = new MCPHandler(apiKey);
    
    // Test async initialization
    const asyncHandler = await MCPHandler.create(apiKey);
    
    // Verify both handlers are working
    const stats1 = handler.getStats();
    const stats2 = asyncHandler.getStats();
    
    console.log('✅ Basic initialization:', handler.isInitialized());
    console.log('✅ Async initialization:', asyncHandler.isInitialized());
    console.log('📊 Tools registered:', stats1.registeredTools.length);
    
    return {
      basicHandler: handler,
      asyncHandler: asyncHandler,
      toolCount: stats1.registeredTools.length
    };
    
  } catch (error) {
    console.error('❌ Handler initialization test failed:', error);
    throw error;
  }
}
`
};

// ============================================================================
// TESTING EXAMPLES
// ============================================================================

/**
 * Example 6: Testing Configuration
 * Examples of how to test the configuration
 */
export const testingExample = {
  // test.js
  testCode: `
import { MCPHandler } from 'jezweb-mcp-core';
import { validateEnvironment, testHandlerInitialization } from './validation.js';

async function runTests() {
  console.log('🧪 Running configuration tests...');
  
  try {
    // Test 1: Environment validation
    console.log('\\n1️⃣ Testing environment validation...');
    const config = validateEnvironment();
    console.log('✅ Environment validation passed');
    console.log('📋 Config:', config);
    
    // Test 2: Handler initialization
    console.log('\\n2️⃣ Testing handler initialization...');
    const { basicHandler, asyncHandler, toolCount } = await testHandlerInitialization(config.apiKey);
    console.log(\`✅ Handler initialization passed - \${toolCount} tools registered\`);
    
    // Test 3: Basic MCP request
    console.log('\\n3️⃣ Testing basic MCP request...');
    const listRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };
    
    const response = await basicHandler.handleRequest(listRequest);
    
    if (response.result && response.result.tools) {
      console.log(\`✅ Tools list request passed - \${response.result.tools.length} tools returned\`);
    } else {
      throw new Error('Invalid tools list response');
    }
    
    // Test 4: Provider system integration
    console.log('\\n4️⃣ Testing provider system integration...');
    const stats = basicHandler.getStats();
    
    if (stats.registeredTools && stats.registeredTools.length > 0) {
      console.log('✅ Provider system integration passed');
      console.log('📊 Registered tools:', stats.registeredTools.slice(0, 5).join(', '), '...');
    } else {
      throw new Error('No tools registered - provider system may not be working');
    }
    
    console.log('\\n🎉 All tests passed! Configuration is working correctly.');
    
  } catch (error) {
    console.error('\\n❌ Tests failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  runTests();
}
`
};

// Export all examples
export default {
  cloudflare: {
    basic: basicCloudflareExample,
    advanced: advancedCloudflareExample
  },
  npm: {
    basic: basicNpmExample,
    advanced: advancedNpmExample
  },
  validation: configValidationExample,
  testing: testingExample
};