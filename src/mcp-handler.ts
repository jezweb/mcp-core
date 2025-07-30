import {
  MCPRequest,
  MCPResponse,
  MCPInitializeRequest,
  MCPInitializeResponse,
  MCPToolsListRequest,
  MCPToolsListResponse,
  MCPToolsCallRequest,
  MCPToolsCallResponse,
  MCPTool,
  MCPError,
  ErrorCodes,
} from './types.js';
import { OpenAIService } from './services/openai-service.js';

export class MCPHandler {
  private openaiService: OpenAIService;

  constructor(apiKey: string) {
    this.openaiService = new OpenAIService(apiKey);
  }

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      switch (request.method) {
        case 'initialize':
          return this.handleInitialize(request as MCPInitializeRequest);
        case 'tools/list':
          return this.handleToolsList(request as MCPToolsListRequest);
        case 'tools/call':
          return this.handleToolsCall(request as MCPToolsCallRequest);
        default:
          throw new MCPError(
            ErrorCodes.METHOD_NOT_FOUND,
            `Method not found: ${request.method}`
          );
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: error instanceof MCPError ? error.code : ErrorCodes.INTERNAL_ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
          data: error instanceof MCPError ? error.data : undefined,
        },
      };
    }
  }

  private handleInitialize(request: MCPInitializeRequest): MCPInitializeResponse {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {
            listChanged: false,
          },
        },
        serverInfo: {
          name: 'openai-assistants-mcp',
          version: '1.0.0',
        },
      },
    };
  }

  private handleToolsList(request: MCPToolsListRequest): MCPToolsListResponse {
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
      result: {
        tools,
      },
    };
  }

  private async handleToolsCall(request: MCPToolsCallRequest): Promise<MCPToolsCallResponse> {
    const { name, arguments: args } = request.params;

    try {
      let result: any;

      switch (name) {
        // Assistant Management
        case 'assistant-create':
          result = await this.openaiService.createAssistant(args);
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
          const { thread_id: createMessageThreadId, ...createMessageData } = args;
          result = await this.openaiService.createMessage(createMessageThreadId, createMessageData);
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
          const { thread_id: createRunThreadId, ...createRunData } = args;
          result = await this.openaiService.createRun(createRunThreadId, createRunData);
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
          const { thread_id: submitThreadId, run_id: submitRunId, ...submitData } = args;
          result = await this.openaiService.submitToolOutputs(submitThreadId, submitRunId, submitData);
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
          throw new MCPError(
            ErrorCodes.METHOD_NOT_FOUND,
            `Tool not found: ${name}`
          );
      }

      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        },
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        },
      };
    }
  }
}