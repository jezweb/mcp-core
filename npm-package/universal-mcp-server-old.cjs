#!/usr/bin/env node

/**
 * Roo-Compatible MCP Server
 * 
 * This server addresses specific protocol violations and formatting issues
 * identified in research for Roo compatibility:
 * - Proper JSON-RPC message formatting with UTF-8 encoding and newline delimiters
 * - Correct initialization handshake sequence that Roo expects
 * - Proper error handling to prevent crashes that cause connection issues
 * - Stdout line-buffered for Roo compatibility
 * - Handles empty line handshake that Roo sends
 * - Sends immediate server info notification that Roo expects
 */

const readline = require('readline');
const { OpenAIService } = require('./openai-service.cjs');

class RooCompatibleMCPServer {
  constructor() {
    this.openaiService = null;
    this.isInitialized = false;
    this.debug = process.env.DEBUG === 'true';
    
    // Ensure stdout is line-buffered for Roo compatibility
    process.stdout.setEncoding('utf8');
    if (process.stdout.isTTY) {
      process.stdout._flush = process.stdout._flush || (() => {});
    }
    
    this.setupErrorHandling();
    this.setupStdioInterface();
    this.logDebug('Server starting...');
  }

  setupErrorHandling() {
    // Prevent crashes that cause connection issues with Roo
    process.on('uncaughtException', (error) => {
      this.logError('Uncaught exception:', error);
      this.sendErrorResponse(null, -32603, 'Internal server error', error.message);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logError('Unhandled rejection at:', promise, 'reason:', reason);
      this.sendErrorResponse(null, -32603, 'Internal server error', String(reason));
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      this.logDebug('Received SIGTERM, shutting down gracefully');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      this.logDebug('Received SIGINT, shutting down gracefully');
      process.exit(0);
    });
  }

  setupStdioInterface() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    rl.on('line', (line) => {
      this.handleInput(line.trim());
    });

    rl.on('close', () => {
      this.logDebug('Stdin closed, exiting');
      process.exit(0);
    });
  }

  async handleInput(line) {
    try {
      // Handle empty line handshake that Roo sends
      if (line === '') {
        this.logDebug('Received empty line handshake from Roo');
        return;
      }

      this.logDebug('Received input:', line);

      // Parse JSON-RPC message
      let request;
      try {
        request = JSON.parse(line);
      } catch (parseError) {
        this.logError('JSON parse error:', parseError);
        this.sendErrorResponse(null, -32700, 'Parse error', parseError.message);
        return;
      }

      // Validate JSON-RPC 2.0 format
      if (request.jsonrpc !== '2.0') {
        this.sendErrorResponse(request.id, -32600, 'Invalid Request', 'Invalid JSON-RPC version');
        return;
      }

      // Route request to appropriate handler
      await this.routeRequest(request);

    } catch (error) {
      this.logError('Error handling input:', error);
      this.sendErrorResponse(null, -32603, 'Internal error', error.message);
    }
  }

  async routeRequest(request) {
    const { method, params, id } = request;

    try {
      switch (method) {
        case 'initialize':
          await this.handleInitialize(request);
          break;
        case 'tools/list':
          await this.handleToolsList(request);
          break;
        case 'tools/call':
          await this.handleToolsCall(request);
          break;
        default:
          this.sendErrorResponse(id, -32601, 'Method not found', `Unknown method: ${method}`);
      }
    } catch (error) {
      this.logError(`Error in ${method}:`, error);
      this.sendErrorResponse(id, -32603, 'Internal error', error.message);
    }
  }

  async handleInitialize(request) {
    const { params, id } = request;
    
    this.logDebug('Handling initialize request:', params);

    // Get API key from environment (will be set by MCP client)
    const apiKey = process.env.OPENAI_API_KEY;
    
    // Initialize without API key validation - validation happens when tools are called
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
      id: id,
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

    this.sendResponse(response);

    // Send immediate server info notification that Roo expects
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
      this.sendErrorResponse(request.id, -32002, 'Server not initialized', 'Call initialize first');
      return;
    }

    const tools = [
      // Assistant Management Tools
      {
        name: 'assistant-create',
        description: 'Create a new OpenAI assistant with specified instructions and tools',
        inputSchema: {
          type: 'object',
          properties: {
            model: { type: 'string', description: 'The model to use for the assistant (e.g., gpt-4, gpt-3.5-turbo)' },
            name: { type: 'string', description: 'The name of the assistant' },
            description: { type: 'string', description: 'The description of the assistant' },
            instructions: { type: 'string', description: 'The system instructions for the assistant' },
            tools: { type: 'array', description: 'List of tools enabled for the assistant' },
            metadata: { type: 'object', description: 'Set of key-value pairs for storing additional information' }
          },
          required: ['model']
        }
      },
      {
        name: 'assistant-list',
        description: 'List all assistants with optional pagination and filtering',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Number of assistants to return (1-100, default: 20)' },
            order: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order by created_at timestamp' },
            after: { type: 'string', description: 'Cursor for pagination (assistant ID)' },
            before: { type: 'string', description: 'Cursor for pagination (assistant ID)' }
          }
        }
      },
      {
        name: 'assistant-get',
        description: 'Retrieve details of a specific assistant',
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
            tools: { type: 'array', description: 'List of tools enabled for the assistant' },
            metadata: { type: 'object', description: 'Set of key-value pairs for storing additional information' }
          },
          required: ['assistant_id']
        }
      },
      {
        name: 'assistant-delete',
        description: 'Delete an assistant permanently',
        inputSchema: {
          type: 'object',
          properties: {
            assistant_id: { type: 'string', description: 'The ID of the assistant to delete' }
          },
          required: ['assistant_id']
        }
      },

      // Thread Management Tools
      {
        name: 'thread-create',
        description: 'Create a new conversation thread',
        inputSchema: {
          type: 'object',
          properties: {
            messages: { type: 'array', description: 'Initial messages for the thread' },
            metadata: { type: 'object', description: 'Set of key-value pairs for storing additional information' }
          }
        }
      },
      {
        name: 'thread-get',
        description: 'Retrieve details of a specific thread',
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
            metadata: { type: 'object', description: 'Set of key-value pairs for storing additional information' }
          },
          required: ['thread_id']
        }
      },
      {
        name: 'thread-delete',
        description: 'Delete a thread permanently',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: { type: 'string', description: 'The ID of the thread to delete' }
          },
          required: ['thread_id']
        }
      },

      // Message Management Tools
      {
        name: 'message-create',
        description: 'Add a message to a thread',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: { type: 'string', description: 'The ID of the thread to add the message to' },
            role: { type: 'string', enum: ['user', 'assistant'], description: 'The role of the message sender' },
            content: { type: 'string', description: 'The content of the message' },
            metadata: { type: 'object', description: 'Set of key-value pairs for storing additional information' }
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
            thread_id: { type: 'string', description: 'The ID of the thread to list messages from' },
            limit: { type: 'number', description: 'Number of messages to return (1-100, default: 20)' },
            order: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order by created_at timestamp' },
            after: { type: 'string', description: 'Cursor for pagination (message ID)' },
            before: { type: 'string', description: 'Cursor for pagination (message ID)' },
            run_id: { type: 'string', description: 'Filter messages by run ID' }
          },
          required: ['thread_id']
        }
      },
      {
        name: 'message-get',
        description: 'Retrieve details of a specific message',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: { type: 'string', description: 'The ID of the thread containing the message' },
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
            thread_id: { type: 'string', description: 'The ID of the thread containing the message' },
            message_id: { type: 'string', description: 'The ID of the message to update' },
            metadata: { type: 'object', description: 'Set of key-value pairs for storing additional information' }
          },
          required: ['thread_id', 'message_id']
        }
      },
      {
        name: 'message-delete',
        description: 'Delete a message from a thread',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: { type: 'string', description: 'The ID of the thread containing the message' },
            message_id: { type: 'string', description: 'The ID of the message to delete' }
          },
          required: ['thread_id', 'message_id']
        }
      },

      // Run Management Tools
      {
        name: 'run-create',
        description: 'Start a new assistant run on a thread',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: { type: 'string', description: 'The ID of the thread to run the assistant on' },
            assistant_id: { type: 'string', description: 'The ID of the assistant to use for the run' },
            model: { type: 'string', description: 'Override the model used by the assistant' },
            instructions: { type: 'string', description: 'Override the instructions of the assistant' },
            additional_instructions: { type: 'string', description: 'Additional instructions to append to the assistant instructions' },
            tools: { type: 'array', description: 'Override the tools used by the assistant' },
            metadata: { type: 'object', description: 'Set of key-value pairs for storing additional information' }
          },
          required: ['thread_id', 'assistant_id']
        }
      },
      {
        name: 'run-list',
        description: 'List runs for a thread with optional pagination',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: { type: 'string', description: 'The ID of the thread to list runs from' },
            limit: { type: 'number', description: 'Number of runs to return (1-100, default: 20)' },
            order: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order by created_at timestamp' },
            after: { type: 'string', description: 'Cursor for pagination (run ID)' },
            before: { type: 'string', description: 'Cursor for pagination (run ID)' }
          },
          required: ['thread_id']
        }
      },
      {
        name: 'run-get',
        description: 'Retrieve details of a specific run',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: { type: 'string', description: 'The ID of the thread containing the run' },
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
            thread_id: { type: 'string', description: 'The ID of the thread containing the run' },
            run_id: { type: 'string', description: 'The ID of the run to update' },
            metadata: { type: 'object', description: 'Set of key-value pairs for storing additional information' }
          },
          required: ['thread_id', 'run_id']
        }
      },
      {
        name: 'run-cancel',
        description: 'Cancel a running assistant execution',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: { type: 'string', description: 'The ID of the thread containing the run' },
            run_id: { type: 'string', description: 'The ID of the run to cancel' }
          },
          required: ['thread_id', 'run_id']
        }
      },
      {
        name: 'run-submit-tool-outputs',
        description: 'Submit tool call results to continue a run',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: { type: 'string', description: 'The ID of the thread containing the run' },
            run_id: { type: 'string', description: 'The ID of the run to submit tool outputs for' },
            tool_outputs: { type: 'array', description: 'List of tool outputs to submit' }
          },
          required: ['thread_id', 'run_id', 'tool_outputs']
        }
      },

      // Run Step Management Tools
      {
        name: 'run-step-list',
        description: 'List steps in a run execution',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: { type: 'string', description: 'The ID of the thread containing the run' },
            run_id: { type: 'string', description: 'The ID of the run to list steps from' },
            limit: { type: 'number', description: 'Number of steps to return (1-100, default: 20)' },
            order: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order by created_at timestamp' },
            after: { type: 'string', description: 'Cursor for pagination (step ID)' },
            before: { type: 'string', description: 'Cursor for pagination (step ID)' }
          },
          required: ['thread_id', 'run_id']
        }
      },
      {
        name: 'run-step-get',
        description: 'Get details of a specific run step',
        inputSchema: {
          type: 'object',
          properties: {
            thread_id: { type: 'string', description: 'The ID of the thread containing the run' },
            run_id: { type: 'string', description: 'The ID of the run containing the step' },
            step_id: { type: 'string', description: 'The ID of the step to retrieve' }
          },
          required: ['thread_id', 'run_id', 'step_id']
        }
      }
    ];

    const response = {
      jsonrpc: '2.0',
      id: request.id,
      result: { tools }
    };

    this.sendResponse(response);
  }

  async handleToolsCall(request) {
    if (!this.isInitialized) {
      this.sendErrorResponse(request.id, -32002, 'Server not initialized', 'Call initialize first');
      return;
    }

    // Validate API key when tools are actually called
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.sendErrorResponse(request.id, -32602, 'Invalid params', 'OPENAI_API_KEY environment variable is required. Please configure it in your MCP client.');
      return;
    }

    if (!apiKey || apiKey.trim().length === 0) {
      this.sendErrorResponse(request.id, -32602, 'Invalid params', 'OPENAI_API_KEY must be a valid non-empty API key');
      return;
    }

    // Initialize OpenAI service if not already done or if API key changed
    if (!this.openaiService || this.openaiService.apiKey !== apiKey) {
      try {
        this.openaiService = new OpenAIService(apiKey);
        this.logDebug('OpenAI service initialized/updated with API key');
      } catch (error) {
        this.logError('Failed to initialize OpenAI service:', error);
        this.sendErrorResponse(request.id, -32603, 'Internal error', 'Failed to initialize OpenAI service');
        return;
      }
    }

    const { name, arguments: args } = request.params;
    this.logDebug(`Calling tool: ${name}`, args);

    try {
      let result;

      switch (name) {
        // Assistant Management
        case 'assistant-create':
          if (!args.model) {
            throw new Error('model is required');
          }
          result = await this.openaiService.createAssistant(args);
          break;
        case 'assistant-list':
          result = await this.openaiService.listAssistants(args);
          break;
        case 'assistant-get':
          if (!args.assistant_id) {
            throw new Error('assistant_id is required');
          }
          result = await this.openaiService.getAssistant(args.assistant_id);
          break;
        case 'assistant-update':
          if (!args.assistant_id) {
            throw new Error('assistant_id is required');
          }
          const { assistant_id: updateAssistantId, ...updateAssistantData } = args;
          result = await this.openaiService.updateAssistant(updateAssistantId, updateAssistantData);
          break;
        case 'assistant-delete':
          if (!args.assistant_id) {
            throw new Error('assistant_id is required');
          }
          result = await this.openaiService.deleteAssistant(args.assistant_id);
          break;

        // Thread Management
        case 'thread-create':
          result = await this.openaiService.createThread(args);
          break;
        case 'thread-get':
          if (!args.thread_id) {
            throw new Error('thread_id is required');
          }
          result = await this.openaiService.getThread(args.thread_id);
          break;
        case 'thread-update':
          if (!args.thread_id) {
            throw new Error('thread_id is required');
          }
          const { thread_id: updateThreadId, ...updateThreadData } = args;
          result = await this.openaiService.updateThread(updateThreadId, updateThreadData);
          break;
        case 'thread-delete':
          if (!args.thread_id) {
            throw new Error('thread_id is required');
          }
          result = await this.openaiService.deleteThread(args.thread_id);
          break;

        // Message Management
        case 'message-create':
          if (!args.thread_id || !args.role || !args.content) {
            throw new Error('thread_id, role, and content are required');
          }
          const { thread_id: createMessageThreadId, ...createMessageData } = args;
          result = await this.openaiService.createMessage(createMessageThreadId, createMessageData);
          break;
        case 'message-list':
          if (!args.thread_id) {
            throw new Error('thread_id is required');
          }
          const { thread_id: listMessageThreadId, ...listMessageData } = args;
          result = await this.openaiService.listMessages(listMessageThreadId, listMessageData);
          break;
        case 'message-get':
          if (!args.thread_id || !args.message_id) {
            throw new Error('thread_id and message_id are required');
          }
          result = await this.openaiService.getMessage(args.thread_id, args.message_id);
          break;
        case 'message-update':
          if (!args.thread_id || !args.message_id) {
            throw new Error('thread_id and message_id are required');
          }
          const { thread_id: updateMessageThreadId, message_id: updateMessageId, ...updateMessageData } = args;
          result = await this.openaiService.updateMessage(updateMessageThreadId, updateMessageId, updateMessageData);
          break;
        case 'message-delete':
          if (!args.thread_id || !args.message_id) {
            throw new Error('thread_id and message_id are required');
          }
          result = await this.openaiService.deleteMessage(args.thread_id, args.message_id);
          break;

        // Run Management
        case 'run-create':
          if (!args.thread_id || !args.assistant_id) {
            throw new Error('thread_id and assistant_id are required');
          }
          const { thread_id: createRunThreadId, ...createRunData } = args;
          result = await this.openaiService.createRun(createRunThreadId, createRunData);
          break;
        case 'run-list':
          if (!args.thread_id) {
            throw new Error('thread_id is required');
          }
          const { thread_id: listRunThreadId, ...listRunData } = args;
          result = await this.openaiService.listRuns(listRunThreadId, listRunData);
          break;
        case 'run-get':
          if (!args.thread_id || !args.run_id) {
            throw new Error('thread_id and run_id are required');
          }
          result = await this.openaiService.getRun(args.thread_id, args.run_id);
          break;
        case 'run-update':
          if (!args.thread_id || !args.run_id) {
            throw new Error('thread_id and run_id are required');
          }
          const { thread_id: updateRunThreadId, run_id: updateRunId, ...updateRunData } = args;
          result = await this.openaiService.updateRun(updateRunThreadId, updateRunId, updateRunData);
          break;
        case 'run-cancel':
          if (!args.thread_id || !args.run_id) {
            throw new Error('thread_id and run_id are required');
          }
          result = await this.openaiService.cancelRun(args.thread_id, args.run_id);
          break;
        case 'run-submit-tool-outputs':
          if (!args.thread_id || !args.run_id || !args.tool_outputs) {
            throw new Error('thread_id, run_id, and tool_outputs are required');
          }
          const { thread_id: submitThreadId, run_id: submitRunId, ...submitData } = args;
          result = await this.openaiService.submitToolOutputs(submitThreadId, submitRunId, submitData);
          break;

        // Run Step Management
        case 'run-step-list':
          if (!args.thread_id || !args.run_id) {
            throw new Error('thread_id and run_id are required');
          }
          const { thread_id: listStepThreadId, run_id: listStepRunId, ...listStepData } = args;
          result = await this.openaiService.listRunSteps(listStepThreadId, listStepRunId, listStepData);
          break;
        case 'run-step-get':
          if (!args.thread_id || !args.run_id || !args.step_id) {
            throw new Error('thread_id, run_id, and step_id are required');
          }
          result = await this.openaiService.getRunStep(args.thread_id, args.run_id, args.step_id);
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      const response = {
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

      this.sendResponse(response);

    } catch (error) {
      this.logError(`Tool call error for ${name}:`, error);
      
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

  sendResponse(response) {
    // Ensure messages are UTF-8 encoded and delimited by newlines
    // Messages MUST NOT contain embedded newlines
    const message = JSON.stringify(response);
    
    // Validate no embedded newlines
    if (message.includes('\n') || message.includes('\r')) {
      this.logError('Response contains embedded newlines, this will break Roo compatibility');
      // Remove embedded newlines to prevent protocol violation
      const cleanMessage = message.replace(/[\n\r]/g, ' ');
      process.stdout.write(cleanMessage + '\n');
    } else {
      process.stdout.write(message + '\n');
    }
    
    this.logDebug('Sent response:', message);
  }

  sendErrorResponse(id, code, message, data = null) {
    const response = {
      jsonrpc: '2.0',
      id: id,
      error: {
        code: code,
        message: message,
        ...(data && { data: data })
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
  console.error('[INFO] Starting OpenAI Assistants MCP Server...');
  console.error('[INFO] API key will be validated when tools are called');
  new RooCompatibleMCPServer();
}

module.exports = { RooCompatibleMCPServer };