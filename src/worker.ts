import { MCPHandler } from './mcp-handler.js';
import { MCPRequest, MCPError, ErrorCodes, Env } from './types.js';

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
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: {
              code: ErrorCodes.INVALID_REQUEST,
              message: 'Invalid URL format. Expected: /mcp/{api-key}',
            },
          }),
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
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: {
              code: ErrorCodes.UNAUTHORIZED,
              message: 'Invalid or missing API key',
            },
          }),
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
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: {
              code: ErrorCodes.PARSE_ERROR,
              message: 'Invalid JSON in request body',
            },
          }),
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
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id: mcpRequest.id || null,
            error: {
              code: ErrorCodes.INVALID_REQUEST,
              message: 'Invalid JSON-RPC 2.0 request format',
            },
          }),
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
      
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: ErrorCodes.INTERNAL_ERROR,
            message: 'Internal server error',
          },
        }),
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