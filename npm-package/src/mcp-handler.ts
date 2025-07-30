/**
 * MCP Protocol Handler for stdio transport
 *
 * This file implements the core Model Context Protocol (MCP) message handling
 * and routing logic adapted for stdio transport with OpenAI Assistants operations.
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
  MCPTool,
  MCPError,
  ErrorCodes
} from '@shared/types';
import { OpenAIService } from '@shared/services';
import { enhancedTools } from './mcp-handler-tools.js';
import { mcpResources, getResourceContent } from '@shared/resources';
import { setupHandlerSystem, ToolRegistry } from '../../shared/core/index.js';

export class MCPHandler {
  private openaiService: OpenAIService | null = null;
  private isProxyMode: boolean = false;
  private cloudflareWorkerUrl: string = 'https://assistants.jezweb.com/mcp';
  private toolRegistry: ToolRegistry | null = null;

  constructor(apiKey: string) {
    if (apiKey === 'CLOUDFLARE_PROXY_MODE') {
      this.isProxyMode = true;
      // This should not happen - we need a real API key for the URL
      throw new Error('API key is required for Cloudflare Worker proxy mode');
    } else {
      // Check if this looks like an OpenAI API key
      if (apiKey.startsWith('sk-')) {
        // Use Cloudflare Worker with API key in URL
        this.isProxyMode = true;
        this.cloudflareWorkerUrl = `https://assistants.jezweb.com/mcp/${apiKey}`;
      } else {
        // Direct OpenAI service (for local development)
        this.openaiService = new OpenAIService(apiKey);
        
        // Initialize the handler system for direct mode
        const context = {
          openaiService: this.openaiService,
          toolName: '',
          requestId: null
        };
        this.toolRegistry = setupHandlerSystem(context);
      }
    }
  }

  /**
   * Handle incoming MCP requests
   */
  async handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    try {
      // Validate JSON-RPC 2.0 format
      if (request.jsonrpc !== '2.0') {
        return this.createErrorResponse(request.id, ErrorCodes.INVALID_REQUEST, 'Invalid JSON-RPC version');
      }

      // If in proxy mode, forward the request to Cloudflare Worker
      if (this.isProxyMode) {
        return this.forwardToCloudflareWorker(request);
      }

      switch (request.method) {
        case 'initialize':
          return this.handleInitialize(request as MCPInitializeRequest);
        case 'tools/list':
          return this.handleToolsList(request as MCPToolsListRequest);
        case 'tools/call':
          return this.handleToolsCall(request as MCPToolsCallRequest);
        case 'resources/list':
          return this.handleResourcesList(request as MCPResourcesListRequest);
        case 'resources/read':
          return this.handleResourcesRead(request as MCPResourcesReadRequest);
        default:
          return this.createErrorResponse(request.id, ErrorCodes.METHOD_NOT_FOUND, 'Method not found');
      }
    } catch (error) {
      return this.createErrorResponse(
        request.id,
        ErrorCodes.INTERNAL_ERROR,
        'Internal error',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Forward request to Cloudflare Worker
   */
  private async forwardToCloudflareWorker(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    try {
      const response = await fetch(this.cloudflareWorkerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json() as JsonRpcResponse;
      return result;
    } catch (error) {
      return this.createErrorResponse(
        request.id,
        ErrorCodes.INTERNAL_ERROR,
        'Proxy request failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Handle initialize request
   */
  private async handleInitialize(request: MCPInitializeRequest): Promise<MCPInitializeResponse> {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {
            listChanged: false
          },
          resources: {
            subscribe: false,
            listChanged: false
          }
        },
        serverInfo: {
          name: 'openai-assistants-mcp',
          version: '1.0.0'
        }
      }
    };
  }

  /**
   * Handle tools list request
   */
  private async handleToolsList(request: MCPToolsListRequest): Promise<MCPToolsListResponse> {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: { tools: enhancedTools }
    };
  }

  /**
   * Handle tools call request
   */
  private async handleToolsCall(request: MCPToolsCallRequest): Promise<MCPToolsCallResponse> {
    // If in proxy mode, forward to Cloudflare Worker
    if (this.isProxyMode) {
      return this.forwardToCloudflareWorker(request) as Promise<MCPToolsCallResponse>;
    }

    // For direct mode, use the handler registry
    if (!this.openaiService || !this.toolRegistry) {
      return this.createErrorResponse(request.id, ErrorCodes.INTERNAL_ERROR, 'OpenAI service or tool registry not initialized') as MCPToolsCallResponse;
    }

    try {
      const { name, arguments: args } = request.params;
      
      // Update the context with current request information
      const updatedContext = {
        openaiService: this.openaiService as any, // Type assertion to handle compatibility
        toolName: name,
        requestId: request.id
      };
      
      // Update the registry context for this request
      this.toolRegistry = setupHandlerSystem(updatedContext);
      
      // Execute the tool using the registry
      const result = await this.toolRegistry.execute(name, args);

      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        }
      };

    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        }
      };
    }
  }

  /**
   * Handle resources list request
   */
  private handleResourcesList(request: MCPResourcesListRequest): MCPResourcesListResponse {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        resources: mcpResources,
      },
    };
  }

  /**
   * Handle resources read request
   */
  private handleResourcesRead(request: MCPResourcesReadRequest): MCPResourcesReadResponse {
    const { uri } = request.params;
    
    const resourceData = getResourceContent(uri);
    if (!resourceData) {
      return this.createErrorResponse(
        request.id,
        ErrorCodes.NOT_FOUND,
        `Resource not found: ${uri}`
      ) as MCPResourcesReadResponse;
    }

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        contents: [
          {
            uri,
            mimeType: resourceData.mimeType,
            text: resourceData.content,
          },
        ],
      },
    };
  }

  /**
   * Create error response
   */
  private createErrorResponse(
    id: string | number | null,
    code: number,
    message: string,
    data?: any
  ): JsonRpcResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
        data
      }
    };
  }
}