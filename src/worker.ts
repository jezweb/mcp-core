import { MCPHandler } from './mcp-handler.js';
import { MCPRequest, MCPError, ErrorCodes, Env, createStandardErrorResponse, LegacyErrorCodes, createEnhancedError } from '@shared/types';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Only allow POST requests for MCP
    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'text/plain',
        },
      });
    }

    try {
      // Extract API key from URL path
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      
      // Expected format: /mcp/{api-key}
      if (pathParts.length !== 3 || pathParts[1] !== 'mcp') {
        const errorResponse = createStandardErrorResponse(
          null,
          ErrorCodes.INVALID_REQUEST,
          'Invalid URL format. Expected: /mcp/{api-key}',
          {
            receivedPath: url.pathname,
            expectedFormat: '/mcp/{api-key}',
            documentation: 'https://docs.openai.com/api-reference'
          }
        );
        
        return new Response(
          JSON.stringify(errorResponse),
          {
            status: 400,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
            },
          }
        );
      }

      const apiKey = pathParts[2];
      if (!apiKey || apiKey.length < 10) {
        const authError = createEnhancedError(
          LegacyErrorCodes.UNAUTHORIZED,
          'Invalid or missing API key',
          {
            keyLength: apiKey?.length || 0,
            minLength: 10,
            documentation: 'https://docs.openai.com/api-reference/authentication'
          }
        );
        
        const errorResponse = createStandardErrorResponse(
          null,
          authError.code,
          authError.message,
          authError.data
        );
        
        return new Response(
          JSON.stringify(errorResponse),
          {
            status: 401,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Parse request body
      let mcpRequest: MCPRequest;
      try {
        mcpRequest = await request.json();
      } catch (error) {
        const errorResponse = createStandardErrorResponse(
          null,
          ErrorCodes.PARSE_ERROR,
          'Invalid JSON in request body',
          {
            parseError: error instanceof Error ? error.message : 'Unknown parse error',
            documentation: 'https://www.jsonrpc.org/specification'
          }
        );
        
        return new Response(
          JSON.stringify(errorResponse),
          {
            status: 400,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Validate JSON-RPC format
      if (!mcpRequest.jsonrpc || mcpRequest.jsonrpc !== '2.0' || !mcpRequest.method) {
        const errorResponse = createStandardErrorResponse(
          mcpRequest.id || null,
          ErrorCodes.INVALID_REQUEST,
          'Invalid JSON-RPC 2.0 request format',
          {
            missingFields: {
              jsonrpc: !mcpRequest.jsonrpc || mcpRequest.jsonrpc !== '2.0',
              method: !mcpRequest.method
            },
            received: {
              jsonrpc: mcpRequest.jsonrpc,
              method: mcpRequest.method
            },
            documentation: 'https://www.jsonrpc.org/specification'
          }
        );
        
        return new Response(
          JSON.stringify(errorResponse),
          {
            status: 400,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Create MCP handler and process request
      const mcpHandler = new MCPHandler(apiKey);
      const response = await mcpHandler.handleRequest(mcpRequest);

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Worker error:', error);
      
      const errorResponse = createStandardErrorResponse(
        null,
        ErrorCodes.INTERNAL_ERROR,
        'Internal server error',
        {
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? {
            name: error.name,
            message: error.message
          } : 'Unknown error'
        }
      );
      
      return new Response(
        JSON.stringify(errorResponse),
        {
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        }
      );
    }
  },
};