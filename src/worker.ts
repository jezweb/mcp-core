/**
 * Simplified Cloudflare Workers HTTP Adapter
 *
 * This is a standalone worker that provides all MCP functionality
 * without complex configuration dependencies for reliable deployment.
 */

import { Env } from '../shared/types';

// Inline resource definitions to avoid complex imports in Workers environment
const WORKER_RESOURCES = [
  {
    uri: 'assistant://templates/coding-assistant',
    name: 'Coding Assistant Template',
    description: 'Pre-configured template for a coding assistant with code review and debugging capabilities',
    mimeType: 'application/json'
  },
  {
    uri: 'assistant://templates/data-analyst',
    name: 'Data Analyst Template',
    description: 'Template for a data analysis assistant with statistical and visualization capabilities',
    mimeType: 'application/json'
  },
  {
    uri: 'assistant://templates/customer-support',
    name: 'Customer Support Template',
    description: 'Template for a customer support assistant with friendly and helpful responses',
    mimeType: 'application/json'
  },
  {
    uri: 'docs://openai-assistants-api',
    name: 'OpenAI Assistants API Reference',
    description: 'Comprehensive API reference with ID formats, parameters, and examples',
    mimeType: 'text/markdown'
  },
  {
    uri: 'docs://best-practices',
    name: 'Best Practices Guide',
    description: 'Guidelines for optimal usage, performance, security, and cost optimization',
    mimeType: 'text/markdown'
  },
  {
    uri: 'docs://troubleshooting/common-issues',
    name: 'Troubleshooting Guide',
    description: 'Common issues and solutions when working with OpenAI Assistants API',
    mimeType: 'text/markdown'
  },
  {
    uri: 'examples://workflows/batch-processing',
    name: 'Batch Processing Workflow',
    description: 'Example of processing multiple tasks efficiently with concurrent operations',
    mimeType: 'text/markdown'
  },
  {
    uri: 'examples://workflows/create-and-run',
    name: 'Complete Create and Run Workflow',
    description: 'Step-by-step example of creating an assistant, thread, and running a conversation',
    mimeType: 'text/markdown'
  },
  {
    uri: 'examples://workflows/file-search',
    name: 'File Search Workflow',
    description: 'Example of using file search capabilities with assistants',
    mimeType: 'text/markdown'
  }
];

// Resource content templates for demonstration
const RESOURCE_CONTENT: Record<string, any> = {
  'assistant://templates/coding-assistant': {
    model: 'gpt-4',
    name: 'Coding Assistant',
    description: 'A helpful coding assistant that can review code, debug issues, and provide programming guidance.',
    instructions: 'You are an expert coding assistant. Help users with code review, debugging, best practices, and programming questions. Always provide clear explanations and suggest improvements.',
    tools: [{ type: 'code_interpreter' }],
    metadata: {
      category: 'development',
      tags: ['coding', 'debugging', 'review']
    }
  },
  'assistant://templates/data-analyst': {
    model: 'gpt-4',
    name: 'Data Analyst',
    description: 'A data analysis assistant specialized in statistical analysis and data visualization.',
    instructions: 'You are a data analysis expert. Help users analyze data, create visualizations, and interpret statistical results. Use code interpreter for calculations and charts.',
    tools: [{ type: 'code_interpreter' }],
    metadata: {
      category: 'analytics',
      tags: ['data', 'statistics', 'visualization']
    }
  },
  'assistant://templates/customer-support': {
    model: 'gpt-3.5-turbo',
    name: 'Customer Support',
    description: 'A friendly customer support assistant for handling inquiries and providing help.',
    instructions: 'You are a helpful customer support representative. Be friendly, professional, and solution-oriented. Always try to resolve customer issues efficiently.',
    metadata: {
      category: 'support',
      tags: ['customer-service', 'support', 'help']
    }
  }
};

// Simple HTTP utilities
class HTTPUtils {
  static createCORSHeaders() {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json',
    };
  }

  static createResponse(data: any, status: number = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: this.createCORSHeaders(),
    });
  }

  static extractApiKeyFromPath(pathname: string): { apiKey?: string; error?: any } {
    const match = pathname.match(/^\/([a-zA-Z0-9_-]+)$/);
    if (!match) {
      return {
        error: {
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32600,
            message: 'Invalid URL format. Expected: /{api_key}',
          },
        },
      };
    }
    return { apiKey: match[1] };
  }

  static async parseRequest(request: Request): Promise<{ mcpRequest?: any; error?: any }> {
    try {
      const body = await request.text();
      if (!body) {
        return {
          error: {
            jsonrpc: '2.0',
            id: null,
            error: { code: -32600, message: 'Empty request body' },
          },
        };
      }

      const mcpRequest = JSON.parse(body);
      if (!mcpRequest.jsonrpc || !mcpRequest.method) {
        return {
          error: {
            jsonrpc: '2.0',
            id: mcpRequest.id || null,
            error: { code: -32600, message: 'Invalid JSON-RPC request' },
          },
        };
      }

      return { mcpRequest };
    } catch (error) {
      return {
        error: {
          jsonrpc: '2.0',
          id: null,
          error: { code: -32700, message: 'Parse error' },
        },
      };
    }
  }
}

// Simple OpenAI API client
class OpenAIClient {
  constructor(private apiKey: string) {}

  async makeRequest(endpoint: string, data: any) {
    const response = await fetch(`https://api.openai.com/v1${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    return response.json();
  }
}

// MCP Tools implementation
class MCPTools {
  constructor(private openai: OpenAIClient) {}

  async handleToolCall(method: string, params: any) {
    switch (method) {
      case 'assistant-create':
        return this.openai.makeRequest('/assistants', params);
      case 'assistant-list':
        return this.openai.makeRequest('/assistants', { method: 'GET' });
      case 'assistant-get':
        return this.openai.makeRequest(`/assistants/${params.assistant_id}`, { method: 'GET' });
      case 'assistant-update':
        const { assistant_id, ...updateData } = params;
        return this.openai.makeRequest(`/assistants/${assistant_id}`, updateData);
      case 'assistant-delete':
        return this.openai.makeRequest(`/assistants/${params.assistant_id}`, { method: 'DELETE' });
      
      case 'thread-create':
        return this.openai.makeRequest('/threads', params);
      case 'thread-get':
        return this.openai.makeRequest(`/threads/${params.thread_id}`, { method: 'GET' });
      case 'thread-update':
        const { thread_id, ...threadUpdateData } = params;
        return this.openai.makeRequest(`/threads/${thread_id}`, threadUpdateData);
      case 'thread-delete':
        return this.openai.makeRequest(`/threads/${params.thread_id}`, { method: 'DELETE' });

      case 'message-create':
        const { thread_id: msgThreadId, ...messageData } = params;
        return this.openai.makeRequest(`/threads/${msgThreadId}/messages`, messageData);
      case 'message-list':
        return this.openai.makeRequest(`/threads/${params.thread_id}/messages`, { method: 'GET' });
      case 'message-get':
        return this.openai.makeRequest(`/threads/${params.thread_id}/messages/${params.message_id}`, { method: 'GET' });
      case 'message-update':
        const { thread_id: msgUpdateThreadId, message_id, ...msgUpdateData } = params;
        return this.openai.makeRequest(`/threads/${msgUpdateThreadId}/messages/${message_id}`, msgUpdateData);
      case 'message-delete':
        return this.openai.makeRequest(`/threads/${params.thread_id}/messages/${params.message_id}`, { method: 'DELETE' });

      case 'run-create':
        const { thread_id: runThreadId, ...runData } = params;
        return this.openai.makeRequest(`/threads/${runThreadId}/runs`, runData);
      case 'run-list':
        return this.openai.makeRequest(`/threads/${params.thread_id}/runs`, { method: 'GET' });
      case 'run-get':
        return this.openai.makeRequest(`/threads/${params.thread_id}/runs/${params.run_id}`, { method: 'GET' });
      case 'run-update':
        const { thread_id: runUpdateThreadId, run_id, ...runUpdateData } = params;
        return this.openai.makeRequest(`/threads/${runUpdateThreadId}/runs/${run_id}`, runUpdateData);
      case 'run-cancel':
        return this.openai.makeRequest(`/threads/${params.thread_id}/runs/${params.run_id}/cancel`, {});
      case 'run-submit-tool-outputs':
        const { thread_id: submitThreadId, run_id: submitRunId, ...submitData } = params;
        return this.openai.makeRequest(`/threads/${submitThreadId}/runs/${submitRunId}/submit_tool_outputs`, submitData);

      case 'run-step-list':
        return this.openai.makeRequest(`/threads/${params.thread_id}/runs/${params.run_id}/steps`, { method: 'GET' });
      case 'run-step-get':
        return this.openai.makeRequest(`/threads/${params.thread_id}/runs/${params.run_id}/steps/${params.step_id}`, { method: 'GET' });

      default:
        throw new Error(`Unknown tool: ${method}`);
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      // Handle CORS preflight requests
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: HTTPUtils.createCORSHeaders(),
        });
      }

      // Only allow POST requests for MCP
      if (request.method !== 'POST') {
        return HTTPUtils.createResponse(
          {
            jsonrpc: '2.0',
            id: null,
            error: { code: -32601, message: 'Method not allowed. Use POST.' },
          },
          405
        );
      }

      // Extract API key from URL path
      const url = new URL(request.url);
      const { apiKey, error: apiKeyError } = HTTPUtils.extractApiKeyFromPath(url.pathname);
      
      if (apiKeyError) {
        return HTTPUtils.createResponse(apiKeyError, 400);
      }

      // Parse and validate JSON-RPC request
      const { mcpRequest, error: parseError } = await HTTPUtils.parseRequest(request);
      
      if (parseError) {
        return HTTPUtils.createResponse(parseError, 400);
      }

      // Handle MCP protocol methods
      if (mcpRequest.method === 'initialize') {
        return HTTPUtils.createResponse({
          jsonrpc: '2.0',
          id: mcpRequest.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: { listChanged: false },
              resources: { subscribe: false, listChanged: false },
              prompts: { listChanged: false },
            },
            serverInfo: {
              name: 'openai-assistants-mcp',
              version: '3.0.0',
            },
          },
        });
      }

      if (mcpRequest.method === 'tools/list') {
        const tools = [
          'assistant-create', 'assistant-list', 'assistant-get', 'assistant-update', 'assistant-delete',
          'thread-create', 'thread-get', 'thread-update', 'thread-delete',
          'message-create', 'message-list', 'message-get', 'message-update', 'message-delete',
          'run-create', 'run-list', 'run-get', 'run-update', 'run-cancel', 'run-submit-tool-outputs',
          'run-step-list', 'run-step-get'
        ].map(name => ({
          name,
          description: `OpenAI Assistants API: ${name}`,
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: true,
          },
        }));

        return HTTPUtils.createResponse({
          jsonrpc: '2.0',
          id: mcpRequest.id,
          result: { tools },
        });
      }

      if (mcpRequest.method === 'tools/call') {
        const openai = new OpenAIClient(apiKey!);
        const mcpTools = new MCPTools(openai);
        
        try {
          const result = await mcpTools.handleToolCall(
            mcpRequest.params.name,
            mcpRequest.params.arguments || {}
          );
          
          return HTTPUtils.createResponse({
            jsonrpc: '2.0',
            id: mcpRequest.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            },
          });
        } catch (error) {
          return HTTPUtils.createResponse({
            jsonrpc: '2.0',
            id: mcpRequest.id,
            error: {
              code: -32603,
              message: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          });
        }
      }

      if (mcpRequest.method === 'resources/list') {
        return HTTPUtils.createResponse({
          jsonrpc: '2.0',
          id: mcpRequest.id,
          result: {
            resources: WORKER_RESOURCES,
          },
        });
      }

      if (mcpRequest.method === 'resources/read') {
        const { uri } = mcpRequest.params || {};
        
        if (!uri) {
          return HTTPUtils.createResponse({
            jsonrpc: '2.0',
            id: mcpRequest.id,
            error: {
              code: -32602,
              message: 'Invalid params: uri is required',
            },
          });
        }

        // Check if resource exists
        const resource = WORKER_RESOURCES.find(r => r.uri === uri);
        if (!resource) {
          return HTTPUtils.createResponse({
            jsonrpc: '2.0',
            id: mcpRequest.id,
            error: {
              code: -32602,
              message: `Resource not found: ${uri}`,
            },
          });
        }

        // Get resource content
        const content = RESOURCE_CONTENT[uri as keyof typeof RESOURCE_CONTENT];
        if (content) {
          return HTTPUtils.createResponse({
            jsonrpc: '2.0',
            id: mcpRequest.id,
            result: {
              contents: [
                {
                  uri: uri,
                  mimeType: resource.mimeType,
                  text: JSON.stringify(content, null, 2),
                },
              ],
            },
          });
        } else {
          // Return a placeholder for resources without specific content
          const placeholderContent = {
            name: resource.name,
            description: resource.description,
            uri: resource.uri,
            mimeType: resource.mimeType,
            placeholder: true,
            message: 'This resource contains comprehensive documentation and examples. In a full implementation, this would load the actual content from the file system.'
          };

          return HTTPUtils.createResponse({
            jsonrpc: '2.0',
            id: mcpRequest.id,
            result: {
              contents: [
                {
                  uri: uri,
                  mimeType: resource.mimeType,
                  text: JSON.stringify(placeholderContent, null, 2),
                },
              ],
            },
          });
        }
      }

      // Handle other MCP methods
      return HTTPUtils.createResponse({
        jsonrpc: '2.0',
        id: mcpRequest.id,
        error: {
          code: -32601,
          message: `Method not found: ${mcpRequest.method}`,
        },
      });

    } catch (error) {
      console.error('Worker error:', error);
      return HTTPUtils.createResponse({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: 'Internal server error',
        },
      }, 500);
    }
  },
};