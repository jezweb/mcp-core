/**
 * Cloudflare Worker with Hono Framework - Phase 5: Modernization
 * 
 * This is the modernized Cloudflare Worker implementation using Hono framework
 * with integration to the new provider system and simplified configuration.
 * 
 * Key Features:
 * - Hono framework for routing and middleware
 * - Integration with new provider system
 * - Simplified configuration system
 * - Proper error handling with JSON-RPC 2.0 compliance
 * - Health check endpoints
 * - CORS support
 * - Request logging middleware
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { CloudflareMCPHandler } from './mcp-handler.js';
import { Env } from '../shared/types/cloudflare-types.js';
import { MCPRequest, MCPResponse } from '../shared/types/index.js';

// Create Hono app with Cloudflare Worker bindings and context variables
const app = new Hono<{
  Bindings: Env;
  Variables: {
    mcpHandler: CloudflareMCPHandler;
  };
}>();

// Global middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Conditional logging middleware (only in debug mode)
app.use('*', async (c, next) => {
  // Check if debug is enabled via environment
  const debugEnabled = c.env.DEBUG === 'true' || c.env.NODE_ENV === 'development';
  
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
    environment: c.env.ENVIRONMENT || 'unknown',
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
      debug: c.env.DEBUG === 'true',
      environment: c.env.ENVIRONMENT || 'unknown',
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
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

// MCP request validation middleware
app.use('/mcp/*', async (c, next) => {
  // Validate API key
  if (!c.env.OPENAI_API_KEY) {
    return c.json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32001,
        message: 'API key not configured',
        data: {
          timestamp: new Date().toISOString(),
          environment: 'cloudflare',
        },
      },
    }, 500);
  }

  // Only allow POST requests for MCP
  if (c.req.method !== 'POST') {
    return c.json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32601,
        message: 'Method not allowed. Use POST for MCP requests.',
        data: {
          method: c.req.method,
          timestamp: new Date().toISOString(),
        },
      },
    }, 405);
  }

  // Create and attach MCP handler to context
  try {
    const mcpHandler = new CloudflareMCPHandler(c.env);
    c.set('mcpHandler', mcpHandler);
  } catch (error) {
    // Provide specific error messages for configuration issues
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isConfigError = errorMessage.includes('OPENAI_API_KEY') || errorMessage.includes('configuration');
    
    return c.json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: isConfigError ? -32001 : -32603,
        message: isConfigError ? 'Configuration error' : 'Failed to initialize MCP handler',
        data: {
          error: errorMessage,
          timestamp: new Date().toISOString(),
          environment: c.env.ENVIRONMENT || 'unknown',
          debug: c.env.DEBUG === 'true',
        },
      },
    }, 500);
  }

  await next();
});

// Main MCP endpoint
app.post('/mcp/*', async (c) => {
  const mcpHandler = c.get('mcpHandler');
  
  try {
    // Parse JSON-RPC request
    const requestBody = await c.req.text();
    
    if (!requestBody) {
      return c.json({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32600,
          message: 'Empty request body',
          data: {
            timestamp: new Date().toISOString(),
          },
        },
      }, 400);
    }

    let mcpRequest: MCPRequest;
    try {
      mcpRequest = JSON.parse(requestBody);
    } catch (parseError) {
      return c.json({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error',
          data: {
            error: parseError instanceof Error ? parseError.message : 'Invalid JSON',
            timestamp: new Date().toISOString(),
          },
        },
      }, 400);
    }

    // Validate JSON-RPC structure
    if (!mcpRequest.jsonrpc || !mcpRequest.method) {
      return c.json({
        jsonrpc: '2.0',
        id: mcpRequest.id || null,
        error: {
          code: -32600,
          message: 'Invalid JSON-RPC request',
          data: {
            missing: !mcpRequest.jsonrpc ? 'jsonrpc' : 'method',
            timestamp: new Date().toISOString(),
          },
        },
      }, 400);
    }

    // Process MCP request
    const response = await mcpHandler.handleMCPRequest(mcpRequest);
    
    // Return JSON-RPC response
    return c.json(response);

  } catch (error) {
    console.error('MCP request processing failed:', error);
    
    return c.json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32603,
        message: 'Internal server error',
        data: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      },
    }, 500);
  }
});

// Catch-all for unsupported routes
app.all('*', (c) => {
  return c.json({
    error: 'Not Found',
    message: `Route ${c.req.method} ${c.req.path} not found`,
    availableEndpoints: {
      'GET /': 'Basic health check',
      'GET /health': 'Detailed health status',
      'POST /mcp/*': 'MCP JSON-RPC requests',
    },
    timestamp: new Date().toISOString(),
  }, 404);
});

// Error handling middleware
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  
  return c.json({
    jsonrpc: '2.0',
    id: null,
    error: {
      code: -32603,
      message: 'Internal server error',
      data: {
        error: err.message,
        timestamp: new Date().toISOString(),
      },
    },
  }, 500);
});

// Export the Hono app as the default export for Cloudflare Workers
export default app;