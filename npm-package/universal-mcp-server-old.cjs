#!/usr/bin/env node

/**
 * OpenAI Assistants MCP Server v3.0.0 - CommonJS Version
 * 
 * A Model Context Protocol server that provides comprehensive access to OpenAI's Assistants API.
 * This version is optimized for npm package distribution with full backward compatibility.
 * 
 * Features:
 * - Complete OpenAI Assistants API coverage (22 tools)
 * - Robust error handling and validation
 * - Roo and Claude Desktop compatibility
 * - Stdio transport with JSON-RPC 2.0
 * - Environment-based API key configuration
 */

const readline = require('readline');
const { OpenAIService, MCPError, ErrorCodes } = require('./openai-service.cjs');

class OpenAIAssistantsMCPServer {
  constructor() {
    this.openaiService = null;
    this.isInitialized = false;
    this.debug = process.env.DEBUG === 'true';
    
    // Setup readline interface for stdio
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });
    
    this.setupErrorHandling();
    this.setupStdioInterface();
    
    this.logDebug('OpenAI Assistants MCP Server v3.0.0 starting...');
  }

  setupErrorHandling() {
    process.on('uncaughtException', (error) => {
      this.logError('Uncaught exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logError('Unhandled rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

    process.on('SIGINT', () => {
      this.logDebug('Received SIGINT, shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.logDebug('Received SIGTERM, shutting down gracefully...');
      process.exit(0);
    });
  }

  setupStdioInterface() {
    this.rl.on('line', async (line) => {
      await this.handleInput(line);
    });

    this.rl.on('close', () => {
      this.logDebug('Stdio interface closed');
      process.exit(0);
    });
  }

  async handleInput(line) {
    try {
      // Skip empty lines (used for handshake)
      if (!line.trim()) {
        return;
      }

      // Parse JSON-RPC request
      let request;
      try {
        request = JSON.parse(line);
      } catch (error) {
        this.sendErrorResponse(null, ErrorCodes.PARSE_ERROR, 'Parse error', 'Invalid JSON');
        return;
      }

      // Validate JSON-RPC format
      if (!request.jsonrpc || request.jsonrpc !== '2.0' || !request.method) {
        this.sendErrorResponse(request.id || null, ErrorCodes.INVALID_REQUEST, 'Invalid Request', 'Invalid JSON-RPC format');
        return;
      }

      // Handle different request types
      if (request.method === 'initialize') {
        await this.handleInitialize(request);
      } else if (request.method === 'tools/list') {
        await this.handleToolsList(request);
      } else if (request.method === 'tools/call') {
        await this.handleToolCall(request);
      } else {
        this.sendErrorResponse(request.id, ErrorCodes.METHOD_NOT_FOUND, 'Method not found', `Unknown method: ${request.method}`);
      }

    } catch (error) {
      this.logError('Error handling input:', error);
      this.sendErrorResponse(null, ErrorCodes.INTERNAL_ERROR, 'Internal error', error.message);
    }
  }

  async handleInitialize(request) {
    this.logDebug('Handling initialize request:', request.params);

    // Get API key from environment (will be set by MCP client)
    const apiKey = process.env.OPENAI_API_KEY;
    
    // Initialize OpenAI service if API key is available
    if (apiKey) {
      try {
        this.openaiService = new OpenAIService(apiKey);
        this.logDebug('OpenAI service initialized with API key');
      } catch (error) {
        this.logError('Failed to initialize OpenAI service:', error);
        // Don't fail initialization - just log the error
      }
    } else {
      this.logDebug('No API key provided during initialization - will validate when tools are called');
    }

    this.isInitialized = true;

    // Send initialization response
    const response = {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: { listChanged: false },
          resources: { subscribe: false, listChanged: false },
          prompts: { listChanged: false },
          completions: {}
        },
        serverInfo: {
          name: 'openai-assistants-mcp',
          version: '3.0.0'
        }
      }
    };

    this.sendResponse(response);

    // Send immediate server info notification that MCP clients expect
    const notification = {
      jsonrpc: '2.0',
      method: 'notifications/initialized',
      params: {}
    };
    this.sendResponse(notification);
    
    this.logDebug('Initialization complete');
  }

  async handleToolsList(request) {
    if (!this.isInitialized) {
      this.sendErrorResponse(request.id, ErrorCodes.INVALID_REQUEST, 'Server not initialized', 'Call initialize first');
      return;
    }

    const tools = [
      // Assistant Management
      {
        name: 'assistant-create',
        description: 'Create a new assistant with specified configuration',
        inputSchema: {
          type: 'object',
          properties: {
            model: { type: 'string', description: 'The model to use for the assistant' },
            name: { type: 'string', description: 'The name of the assistant' },
            description: { type: 'string', description: 'The description of the assistant' },
            instructions: { type: 'string', description: 'The system instructions for the assistant' },
            tools: { type: 'array', description: 'Tools available to the assistant' },
            metadata: { type: 'object', description: 'Metadata for the assistant' }
          },
          required: ['model']
        }
      },
      {
        name: 'assistant-list',
        description: 'List assistants with optional pagination',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Number of assistants to return (1-100)' },
            order: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order' },
            after: { type: 'string', description: 'Cursor for pagination' },
            before: { type: 'string', description: 'Cursor for pagination' }
          }
        }
      },
      {
        name: 'assistant-get',
        description: 'Retrieve a specific assistant by ID',
        inputSchema: {
          type: 'object',
          properties: {
            assistant_id: { type: 'string', description: 'The ID of the assistant to retrieve' }
          },
          required: ['assistant_id']
        }
      },
      {
        name: 'assistant-update',
        description: 'Update an existing assistant',
        inputSchema: {
          type: 'object',
          properties: {
            assistant_id: { type: 'string', description: 'The ID of the assistant to update' },
            model: { type: 'string', description: 'The model to use for the assistant' },
            name: { type: 'string', description: 'The name of the assistant' },
            description: { type: 'string', description: 'The description of the assistant' },
            instructions: { type: 'string', description: 'The system instructions for the assistant' },
            tools: { type: 'array', description: 'Tools available to the assistant' },
            metadata: { type: 'object', description: 'Metadata for the assistant' }
          },
          required: ['assistant_id']
        }
      },
      {
        name: 'assistant-delete',
        description: 'Delete an assistant',
        inputSchema: {
          type: 'object',
          properties: {
            assistant_id: { type: 'string', description: 'The ID of the assistant to delete' }
          },
          required: ['assistant_id']
        }
      },

      // Thread Management
      {
        name: 'thread-create',
        description: 'Create a new conversation thread',
        inputSchema: {
          type: 'object',
          properties: {
            messages: { type: 'array', description: 'Initial messages for the thread' },
            metadata: { type: 'object', description: 'Metadata for the thread' }
          }
        }
      },
      {
        name: 'thread-get',
        description: 'Retrieve a specific thread by ID',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: { type: 'string', description: 'The ID of the thread to retrieve' }
          },
          required: ['thread_id']
        }
      },
      {
        name: 'thread-update',
        description: 'Update an existing thread',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: { type: 'string', description: 'The ID of the thread to update' },
            metadata: { type: 'object', description: 'Metadata for the thread' }
          },
          required: ['thread_id']
        }
      },
      {
        name: 'thread-delete',
        description: 'Delete a thread',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: { type: 'string', description: 'The ID of the thread to delete' }
          },
          required: ['thread_id']
        }
      },

      // Message Management
      {
        name: 'message-create',
        description: 'Create a new message in a thread',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: { type: 'string', description: 'The ID of the thread' },
            role: { type: 'string', enum: ['user', 'assistant'], description: 'The role of the message sender' },
            content: { type: 'string', description: 'The content of the message' },
            metadata: { type: 'object', description: 'Metadata for the message' }
          },
          required: ['thread_id', 'role', 'content']
        }
      },
      {
        name: 'message-list',
        description: 'List messages in a thread with optional pagination',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: { type: 'string', description: 'The ID of the thread' },
            limit: { type: 'number', description: 'Number of messages to return (1-100)' },
            order: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order' },
            after: { type: 'string', description: 'Cursor for pagination' },
            before: { type: 'string', description: 'Cursor for pagination' },
            run_id: { type: 'string', description: 'Filter by run ID' }
          },
          required: ['thread_id']
        }
      },
      {
        name: 'message-get',
        description: 'Retrieve a specific message by ID',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: { type: 'string', description: 'The ID of the thread' },
            message_id: { type: 'string', description: 'The ID of the message to retrieve' }
          },
          required: ['thread_id', 'message_id']
        }
      },
      {
        name: 'message-update',
        description: 'Update an existing message',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: { type: 'string', description: 'The ID of the thread' },
            message_id: { type: 'string', description: 'The ID of the message to update' },
            metadata: { type: 'object', description: 'Metadata for the message' }
          },
          required: ['thread_id', 'message_id']
        }
      },
      {
        name: 'message-delete',
        description: 'Delete a message',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: { type: 'string', description: 'The ID of the thread' },
            message_id: { type: 'string', description: 'The ID of the message to delete' }
          },
          required: ['thread_id', 'message_id']
        }
      },

      // Run Management
      {
        name: 'run-create',
        description: 'Create a new run to execute an assistant on a thread',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: { type: 'string', description: 'The ID of the thread' },
            assistant_id: { type: 'string', description: 'The ID of the assistant' },
            model: { type: 'string', description: 'Override the model for this run' },
            instructions: { type: 'string', description: 'Override instructions for this run' },
            additional_instructions: { type: 'string', description: 'Additional instructions for this run' },
            tools: { type: 'array', description: 'Override tools for this run' },
            metadata: { type: 'object', description: 'Metadata for the run' }
          },
          required: ['thread_id', 'assistant_id']
        }
      },
      {
        name: 'run-list',
        description: 'List runs in a thread with optional pagination',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: { type: 'string', description: 'The ID of the thread' },
            limit: { type: 'number', description: 'Number of runs to return (1-100)' },
            order: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order' },
            after: { type: 'string', description: 'Cursor for pagination' },
            before: { type: 'string', description: 'Cursor for pagination' }
          },
          required: ['thread_id']
        }
      },
      {
        name: 'run-get',
        description: 'Retrieve a specific run by ID',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: { type: 'string', description: 'The ID of the thread' },
            run_id: { type: 'string', description: 'The ID of the run to retrieve' }
          },
          required: ['thread_id', 'run_id']
        }
      },
      {
        name: 'run-update',
        description: 'Update an existing run',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: { type: 'string', description: 'The ID of the thread' },
            run_id: { type: 'string', description: 'The ID of the run to update' },
            metadata: { type: 'object', description: 'Metadata for the run' }
          },
          required: ['thread_id', 'run_id']
        }
      },
      {
        name: 'run-cancel',
        description: 'Cancel a run that is in progress',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: { type: 'string', description: 'The ID of the thread' },
            run_id: { type: 'string', description: 'The ID of the run to cancel' }
          },
          required: ['thread_id', 'run_id']
        }
      },
      {
        name: 'run-submit-tool-outputs',
        description: 'Submit tool outputs for a run that requires action',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: { type: 'string', description: 'The ID of the thread' },
            run_id: { type: 'string', description: 'The ID of the run' },
            tool_outputs: { type: 'array', description: 'The tool outputs to submit' }
          },
          required: ['thread_id', 'run_id', 'tool_outputs']
        }
      },

      // Run Step Management
      {
        name: 'run-step-list',
        description: 'List run steps with optional pagination',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: { type: 'string', description: 'The ID of the thread' },
            run_id: { type: 'string', description: 'The ID of the run' },
            limit: { type: 'number', description: 'Number of run steps to return (1-100)' },
            order: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order' },
            after: { type: 'string', description: 'Cursor for pagination' },
            before: { type: 'string', description: 'Cursor for pagination' }
          },
          required: ['thread_id', 'run_id']
        }
      },
      {
        name: 'run-step-get',
        description: 'Retrieve a specific run step by ID',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: { type: 'string', description: 'The ID of the thread' },
            run_id: { type: 'string', description: 'The ID of the run' },
            step_id: { type: 'string', description: 'The ID of the run step to retrieve' }
          },
          required: ['thread_id', 'run_id', 'step_id']
        }
      }
    ];

    const response = {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        tools: tools
      }
    };

    this.sendResponse(response);
  }

  async handleToolCall(request) {
    if (!this.isInitialized) {
      this.sendErrorResponse(request.id, ErrorCodes.INVALID_REQUEST, 'Server not initialized', 'Call initialize first');
      return;
    }

    // Validate API key when tools are actually called
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.sendErrorResponse(request.id, ErrorCodes.UNAUTHORIZED, 'Missing API key', 'OPENAI_API_KEY environment variable is required');
      return;
    }

    // Initialize OpenAI service if not already done or if API key changed
    if (!this.openaiService) {
      try {
        this.openaiService = new OpenAIService(apiKey);
        this.logDebug('OpenAI service initialized/updated with API key');
      } catch (error) {
        this.logError('Failed to initialize OpenAI service:', error);
        this.sendErrorResponse(request.id, ErrorCodes.INTERNAL_ERROR, 'Service initialization failed', 'Failed to initialize OpenAI service');
        return;
      }
    }

    const { name: toolName, arguments: toolArgs } = request.params;
    this.logDebug(`Processing tool call: ${toolName}`);

    try {
      let result;

      // Route tool calls to appropriate service methods
      switch (toolName) {
        // Assistant Management
        case 'assistant-create':
          result = await this.openaiService.createAssistant(toolArgs);
          break;
        case 'assistant-list':
          result = await this.openaiService.listAssistants(toolArgs);
          break;
        case 'assistant-get':
          result = await this.openaiService.getAssistant(toolArgs.assistant_id);
          break;
        case 'assistant-update':
          const { assistant_id: updateAssistantId, ...updateAssistantData } = toolArgs;
          result = await this.openaiService.updateAssistant(updateAssistantId, updateAssistantData);
          break;
        case 'assistant-delete':
          result = await this.openaiService.deleteAssistant(toolArgs.assistant_id);
          break;

        // Thread Management
        case 'thread-create':
          result = await this.openaiService.createThread(toolArgs);
          break;
        case 'thread-get':
          result = await this.openaiService.getThread(toolArgs.thread_id);
          break;
        case 'thread-update':
          const { thread_id: updateThreadId, ...updateThreadData } = toolArgs;
          result = await this.openaiService.updateThread(updateThreadId, updateThreadData);
          break;
        case 'thread-delete':
          result = await this.openaiService.deleteThread(toolArgs.thread_id);
          break;

        // Message Management
        case 'message-create':
          const { thread_id: createMsgThreadId, ...createMsgData } = toolArgs;
          result = await this.openaiService.createMessage(createMsgThreadId, createMsgData);
          break;
        case 'message-list':
          const { thread_id: listMsgThreadId, ...listMsgParams } = toolArgs;
          result = await this.openaiService.listMessages(listMsgThreadId, listMsgParams);
          break;
        case 'message-get':
          result = await this.openaiService.getMessage(toolArgs.thread_id, toolArgs.message_id);
          break;
        case 'message-update':
          const { thread_id: updateMsgThreadId, message_id: updateMsgId, ...updateMsgData } = toolArgs;
          result = await this.openaiService.updateMessage(updateMsgThreadId, updateMsgId, updateMsgData);
          break;
        case 'message-delete':
          result = await this.openaiService.deleteMessage(toolArgs.thread_id, toolArgs.message_id);
          break;

        // Run Management
        case 'run-create':
          const { thread_id: createRunThreadId, ...createRunData } = toolArgs;
          result = await this.openaiService.createRun(createRunThreadId, createRunData);
          break;
        case 'run-list':
          const { thread_id: listRunThreadId, ...listRunParams } = toolArgs;
          result = await this.openaiService.listRuns(listRunThreadId, listRunParams);
          break;
        case 'run-get':
          result = await this.openaiService.getRun(toolArgs.thread_id, toolArgs.run_id);
          break;
        case 'run-update':
          const { thread_id: updateRunThreadId, run_id: updateRunId, ...updateRunData } = toolArgs;
          result = await this.openaiService.updateRun(updateRunThreadId, updateRunId, updateRunData);
          break;
        case 'run-cancel':
          result = await this.openaiService.cancelRun(toolArgs.thread_id, toolArgs.run_id);
          break;
        case 'run-submit-tool-outputs':
          const { thread_id: submitThreadId, run_id: submitRunId, ...submitData } = toolArgs;
          result = await this.openaiService.submitToolOutputs(submitThreadId, submitRunId, submitData);
          break;

        // Run Step Management
        case 'run-step-list':
          const { thread_id: listStepThreadId, run_id: listStepRunId, ...listStepParams } = toolArgs;
          result = await this.openaiService.listRunSteps(listStepThreadId, listStepRunId, listStepParams);
          break;
        case 'run-step-get':
          result = await this.openaiService.getRunStep(toolArgs.thread_id, toolArgs.run_id, toolArgs.step_id);
          break;

        default:
          this.sendErrorResponse(request.id, ErrorCodes.METHOD_NOT_FOUND, 'Unknown tool', `Tool '${toolName}' is not supported`);
          return;
      }

      // Send successful response
      const response = {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ],
          isError: false
        }
      };

      this.sendResponse(response);

    } catch (error) {
      this.logError(`Tool call error for ${toolName}:`, error);
      
      // Handle MCP errors with proper error codes
      if (error instanceof MCPError) {
        this.sendErrorResponse(request.id, error.code, error.message, error.data);
      } else {
        // Send error as content for better compatibility
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

        this.sendResponse(response);
      }
    }
  }

  sendResponse(response) {
    const responseStr = JSON.stringify(response);
    console.log(responseStr);
    this.logDebug('Sent response:', responseStr);
  }

  sendErrorResponse(id, code, message, data = null) {
    const response = {
      jsonrpc: '2.0',
      id: id,
      error: {
        code: code,
        message: message,
        data: data
      }
    };

    this.sendResponse(response);
  }

  logDebug(...args) {
    if (this.debug) {
      console.error('[DEBUG]', ...args);
    }
  }

  logError(...args) {
    console.error('[ERROR]', ...args);
  }
}

// Start the server
if (require.main === module) {
  console.error('[INFO] Starting OpenAI Assistants MCP Server v3.0.0...');
  console.error('[INFO] API key will be validated when tools are called');
  console.error('[INFO] Set DEBUG=true environment variable for debug logging');
  new OpenAIAssistantsMCPServer();
}

module.exports = { OpenAIAssistantsMCPServer };