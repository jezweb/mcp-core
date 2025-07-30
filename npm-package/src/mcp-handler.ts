/**
 * MCP Protocol Handler for stdio transport
 * 
 * This file implements the core Model Context Protocol (MCP) message handling
 * and routing logic adapted for stdio transport with vector store operations.
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
  MCPTool,
  MCPError,
  ErrorCodes
} from './types.js';
import { OpenAIService } from './openai-service.js';

export class MCPHandler {
  private openaiService: OpenAIService | null = null;
  private isProxyMode: boolean = false;
  private cloudflareWorkerUrl: string = 'https://vectorstore.jezweb.com/mcp';

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
        this.cloudflareWorkerUrl = `https://vectorstore.jezweb.com/mcp/${apiKey}`;
      } else {
        // Direct OpenAI service (for local development)
        this.openaiService = new OpenAIService(apiKey);
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
    const tools: MCPTool[] = [
      // Assistant Management Tools
      {
        name: 'assistant-create',
        description: 'Create a new OpenAI assistant with specified instructions and tools',
        inputSchema: {
          type: 'object',
          properties: {
            model: {
              type: 'string',
              description: 'The model to use for the assistant (e.g., gpt-4, gpt-3.5-turbo)',
            },
            name: {
              type: 'string',
              description: 'The name of the assistant',
            },
            description: {
              type: 'string',
              description: 'The description of the assistant',
            },
            instructions: {
              type: 'string',
              description: 'The system instructions for the assistant',
            },
            tools: {
              type: 'array',
              description: 'List of tools enabled for the assistant',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['code_interpreter', 'file_search', 'function'],
                  },
                },
              },
            },
            metadata: {
              type: 'object',
              description: 'Set of key-value pairs for storing additional information',
            },
          },
          required: ['model'],
        },
      },
      {
        name: 'assistant-list',
        description: 'List all assistants with optional pagination and filtering',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of assistants to return (1-100, default: 20)',
            },
            order: {
              type: 'string',
              enum: ['asc', 'desc'],
              description: 'Sort order by created_at timestamp',
            },
            after: {
              type: 'string',
              description: 'Cursor for pagination (assistant ID)',
            },
            before: {
              type: 'string',
              description: 'Cursor for pagination (assistant ID)',
            },
          },
        },
      },
      {
        name: 'assistant-get',
        description: 'Retrieve details of a specific assistant',
        inputSchema: {
          type: 'object',
          properties: {
            assistant_id: {
              type: 'string',
              description: 'The ID of the assistant to retrieve',
            },
          },
          required: ['assistant_id'],
        },
      },
      {
        name: 'assistant-update',
        description: 'Update an existing assistant',
        inputSchema: {
          type: 'object',
          properties: {
            assistant_id: {
              type: 'string',
              description: 'The ID of the assistant to update',
            },
            model: {
              type: 'string',
              description: 'The model to use for the assistant',
            },
            name: {
              type: 'string',
              description: 'The name of the assistant',
            },
            description: {
              type: 'string',
              description: 'The description of the assistant',
            },
            instructions: {
              type: 'string',
              description: 'The system instructions for the assistant',
            },
            tools: {
              type: 'array',
              description: 'List of tools enabled for the assistant',
            },
            metadata: {
              type: 'object',
              description: 'Set of key-value pairs for storing additional information',
            },
          },
          required: ['assistant_id'],
        },
      },
      {
        name: 'assistant-delete',
        description: 'Delete an assistant permanently',
        inputSchema: {
          type: 'object',
          properties: {
            assistant_id: {
              type: 'string',
              description: 'The ID of the assistant to delete',
            },
          },
          required: ['assistant_id'],
        },
      },

      // Thread Management Tools
      {
        name: 'thread-create',
        description: 'Create a new conversation thread',
        inputSchema: {
          type: 'object',
          properties: {
            messages: {
              type: 'array',
              description: 'Initial messages for the thread',
            },
            metadata: {
              type: 'object',
              description: 'Set of key-value pairs for storing additional information',
            },
          },
        },
      },
      {
        name: 'thread-get',
        description: 'Retrieve details of a specific thread',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: {
              type: 'string',
              description: 'The ID of the thread to retrieve',
            },
          },
          required: ['thread_id'],
        },
      },
      {
        name: 'thread-update',
        description: 'Update an existing thread',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: {
              type: 'string',
              description: 'The ID of the thread to update',
            },
            metadata: {
              type: 'object',
              description: 'Set of key-value pairs for storing additional information',
            },
          },
          required: ['thread_id'],
        },
      },
      {
        name: 'thread-delete',
        description: 'Delete a thread permanently',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: {
              type: 'string',
              description: 'The ID of the thread to delete',
            },
          },
          required: ['thread_id'],
        },
      },

      // Message Management Tools
      {
        name: 'message-create',
        description: 'Add a message to a thread',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: {
              type: 'string',
              description: 'The ID of the thread to add the message to',
            },
            role: {
              type: 'string',
              enum: ['user', 'assistant'],
              description: 'The role of the message sender',
            },
            content: {
              type: 'string',
              description: 'The content of the message',
            },
            metadata: {
              type: 'object',
              description: 'Set of key-value pairs for storing additional information',
            },
          },
          required: ['thread_id', 'role', 'content'],
        },
      },
      {
        name: 'message-list',
        description: 'List messages in a thread with optional pagination',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: {
              type: 'string',
              description: 'The ID of the thread to list messages from',
            },
            limit: {
              type: 'number',
              description: 'Number of messages to return (1-100, default: 20)',
            },
            order: {
              type: 'string',
              enum: ['asc', 'desc'],
              description: 'Sort order by created_at timestamp',
            },
            after: {
              type: 'string',
              description: 'Cursor for pagination (message ID)',
            },
            before: {
              type: 'string',
              description: 'Cursor for pagination (message ID)',
            },
            run_id: {
              type: 'string',
              description: 'Filter messages by run ID',
            },
          },
          required: ['thread_id'],
        },
      },
      {
        name: 'message-get',
        description: 'Retrieve details of a specific message',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: {
              type: 'string',
              description: 'The ID of the thread containing the message',
            },
            message_id: {
              type: 'string',
              description: 'The ID of the message to retrieve',
            },
          },
          required: ['thread_id', 'message_id'],
        },
      },
      {
        name: 'message-update',
        description: 'Update an existing message',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: {
              type: 'string',
              description: 'The ID of the thread containing the message',
            },
            message_id: {
              type: 'string',
              description: 'The ID of the message to update',
            },
            metadata: {
              type: 'object',
              description: 'Set of key-value pairs for storing additional information',
            },
          },
          required: ['thread_id', 'message_id'],
        },
      },
      {
        name: 'message-delete',
        description: 'Delete a message from a thread',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: {
              type: 'string',
              description: 'The ID of the thread containing the message',
            },
            message_id: {
              type: 'string',
              description: 'The ID of the message to delete',
            },
          },
          required: ['thread_id', 'message_id'],
        },
      },

      // Run Management Tools
      {
        name: 'run-create',
        description: 'Start a new assistant run on a thread',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: {
              type: 'string',
              description: 'The ID of the thread to run the assistant on',
            },
            assistant_id: {
              type: 'string',
              description: 'The ID of the assistant to use for the run',
            },
            model: {
              type: 'string',
              description: 'Override the model used by the assistant',
            },
            instructions: {
              type: 'string',
              description: 'Override the instructions of the assistant',
            },
            additional_instructions: {
              type: 'string',
              description: 'Additional instructions to append to the assistant instructions',
            },
            tools: {
              type: 'array',
              description: 'Override the tools used by the assistant',
            },
            metadata: {
              type: 'object',
              description: 'Set of key-value pairs for storing additional information',
            },
          },
          required: ['thread_id', 'assistant_id'],
        },
      },
      {
        name: 'run-list',
        description: 'List runs for a thread with optional pagination',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: {
              type: 'string',
              description: 'The ID of the thread to list runs from',
            },
            limit: {
              type: 'number',
              description: 'Number of runs to return (1-100, default: 20)',
            },
            order: {
              type: 'string',
              enum: ['asc', 'desc'],
              description: 'Sort order by created_at timestamp',
            },
            after: {
              type: 'string',
              description: 'Cursor for pagination (run ID)',
            },
            before: {
              type: 'string',
              description: 'Cursor for pagination (run ID)',
            },
          },
          required: ['thread_id'],
        },
      },
      {
        name: 'run-get',
        description: 'Retrieve details of a specific run',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: {
              type: 'string',
              description: 'The ID of the thread containing the run',
            },
            run_id: {
              type: 'string',
              description: 'The ID of the run to retrieve',
            },
          },
          required: ['thread_id', 'run_id'],
        },
      },
      {
        name: 'run-update',
        description: 'Update an existing run',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: {
              type: 'string',
              description: 'The ID of the thread containing the run',
            },
            run_id: {
              type: 'string',
              description: 'The ID of the run to update',
            },
            metadata: {
              type: 'object',
              description: 'Set of key-value pairs for storing additional information',
            },
          },
          required: ['thread_id', 'run_id'],
        },
      },
      {
        name: 'run-cancel',
        description: 'Cancel a running assistant execution',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: {
              type: 'string',
              description: 'The ID of the thread containing the run',
            },
            run_id: {
              type: 'string',
              description: 'The ID of the run to cancel',
            },
          },
          required: ['thread_id', 'run_id'],
        },
      },
      {
        name: 'run-submit-tool-outputs',
        description: 'Submit tool call results to continue a run',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: {
              type: 'string',
              description: 'The ID of the thread containing the run',
            },
            run_id: {
              type: 'string',
              description: 'The ID of the run to submit tool outputs for',
            },
            tool_outputs: {
              type: 'array',
              description: 'List of tool outputs to submit',
              items: {
                type: 'object',
                properties: {
                  tool_call_id: {
                    type: 'string',
                    description: 'The ID of the tool call',
                  },
                  output: {
                    type: 'string',
                    description: 'The output of the tool call',
                  },
                },
                required: ['tool_call_id', 'output'],
              },
            },
          },
          required: ['thread_id', 'run_id', 'tool_outputs'],
        },
      },

      // Run Step Management Tools
      {
        name: 'run-step-list',
        description: 'List steps in a run execution',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: {
              type: 'string',
              description: 'The ID of the thread containing the run',
            },
            run_id: {
              type: 'string',
              description: 'The ID of the run to list steps from',
            },
            limit: {
              type: 'number',
              description: 'Number of steps to return (1-100, default: 20)',
            },
            order: {
              type: 'string',
              enum: ['asc', 'desc'],
              description: 'Sort order by created_at timestamp',
            },
            after: {
              type: 'string',
              description: 'Cursor for pagination (step ID)',
            },
            before: {
              type: 'string',
              description: 'Cursor for pagination (step ID)',
            },
          },
          required: ['thread_id', 'run_id'],
        },
      },
      {
        name: 'run-step-get',
        description: 'Get details of a specific run step',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: {
              type: 'string',
              description: 'The ID of the thread containing the run',
            },
            run_id: {
              type: 'string',
              description: 'The ID of the run containing the step',
            },
            step_id: {
              type: 'string',
              description: 'The ID of the step to retrieve',
            },
          },
          required: ['thread_id', 'run_id', 'step_id'],
        },
      },
    ];
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: { tools }
    };
  }

  /**
   * Handle tools call request
   */
  private async handleToolsCall(request: MCPToolsCallRequest): Promise<MCPToolsCallResponse> {
    if (!this.openaiService) {
      return this.createErrorResponse(request.id, ErrorCodes.INTERNAL_ERROR, 'OpenAI service not initialized') as MCPToolsCallResponse;
    }

    try {
      const { name, arguments: args } = request.params;
      let result: any;

      switch (name) {
        // Assistant Management
        case 'assistant-create':
          // Validate required fields
          if (!args.model) {
            throw new MCPError(
              ErrorCodes.INVALID_PARAMS,
              'Missing required parameter: model'
            );
          }
          result = await this.openaiService.createAssistant(args as any);
          break;
        case 'assistant-list':
          result = await this.openaiService.listAssistants(args);
          break;
        case 'assistant-get':
          result = await this.openaiService.getAssistant(args.assistant_id);
          break;
        case 'assistant-update':
          const { assistant_id: updateAssistantId, ...updateAssistantData } = args;
          result = await this.openaiService.updateAssistant(updateAssistantId, updateAssistantData);
          break;
        case 'assistant-delete':
          result = await this.openaiService.deleteAssistant(args.assistant_id);
          break;

        // Thread Management
        case 'thread-create':
          result = await this.openaiService.createThread(args);
          break;
        case 'thread-get':
          result = await this.openaiService.getThread(args.thread_id);
          break;
        case 'thread-update':
          const { thread_id: updateThreadId, ...updateThreadData } = args;
          result = await this.openaiService.updateThread(updateThreadId, updateThreadData);
          break;
        case 'thread-delete':
          result = await this.openaiService.deleteThread(args.thread_id);
          break;

        // Message Management
        case 'message-create':
          // Validate required fields
          if (!args.thread_id || !args.role || !args.content) {
            throw new MCPError(
              ErrorCodes.INVALID_PARAMS,
              'Missing required parameters: thread_id, role, content'
            );
          }
          const { thread_id: createMessageThreadId, ...createMessageData } = args;
          result = await this.openaiService.createMessage(createMessageThreadId, createMessageData as any);
          break;
        case 'message-list':
          const { thread_id: listMessageThreadId, ...listMessageData } = args;
          result = await this.openaiService.listMessages(listMessageThreadId, listMessageData);
          break;
        case 'message-get':
          result = await this.openaiService.getMessage(args.thread_id, args.message_id);
          break;
        case 'message-update':
          const { thread_id: updateMessageThreadId, message_id: updateMessageId, ...updateMessageData } = args;
          result = await this.openaiService.updateMessage(updateMessageThreadId, updateMessageId, updateMessageData);
          break;
        case 'message-delete':
          result = await this.openaiService.deleteMessage(args.thread_id, args.message_id);
          break;

        // Run Management
        case 'run-create':
          // Validate required fields
          if (!args.thread_id || !args.assistant_id) {
            throw new MCPError(
              ErrorCodes.INVALID_PARAMS,
              'Missing required parameters: thread_id, assistant_id'
            );
          }
          const { thread_id: createRunThreadId, ...createRunData } = args;
          result = await this.openaiService.createRun(createRunThreadId, createRunData as any);
          break;
        case 'run-list':
          const { thread_id: listRunThreadId, ...listRunData } = args;
          result = await this.openaiService.listRuns(listRunThreadId, listRunData);
          break;
        case 'run-get':
          result = await this.openaiService.getRun(args.thread_id, args.run_id);
          break;
        case 'run-update':
          const { thread_id: updateRunThreadId, run_id: updateRunId, ...updateRunData } = args;
          result = await this.openaiService.updateRun(updateRunThreadId, updateRunId, updateRunData);
          break;
        case 'run-cancel':
          result = await this.openaiService.cancelRun(args.thread_id, args.run_id);
          break;
        case 'run-submit-tool-outputs':
          // Validate required fields
          if (!args.thread_id || !args.run_id || !args.tool_outputs) {
            throw new MCPError(
              ErrorCodes.INVALID_PARAMS,
              'Missing required parameters: thread_id, run_id, tool_outputs'
            );
          }
          const { thread_id: submitThreadId, run_id: submitRunId, ...submitData } = args;
          result = await this.openaiService.submitToolOutputs(submitThreadId, submitRunId, submitData as any);
          break;

        // Run Step Management
        case 'run-step-list':
          const { thread_id: listStepThreadId, run_id: listStepRunId, ...listStepData } = args;
          result = await this.openaiService.listRunSteps(listStepThreadId, listStepRunId, listStepData);
          break;
        case 'run-step-get':
          result = await this.openaiService.getRunStep(args.thread_id, args.run_id, args.step_id);
          break;

        default:
          throw new MCPError(ErrorCodes.METHOD_NOT_FOUND, `Unknown tool: ${name}`);
      }

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