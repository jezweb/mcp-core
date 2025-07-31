/**
 * NPM Package MCP Handler - Direct Implementation
 * 
 * This version uses the shared handler system directly instead of proxying
 * to the Cloudflare Worker, eliminating network dependencies and ensuring
 * consistent behavior between deployments.
 */

const { OpenAIService } = require('../openai-service.cjs');

/**
 * Import shared handler system components
 * We'll create CommonJS-compatible versions that use the same logic
 */

// Import the shared resources system
const { getAllResources } = require('../shared/resources/resources.cjs');

/**
 * Base Tool Handler - CommonJS version matching shared system
 */
class BaseToolHandler {
  constructor(context) {
    this.context = context;
  }

  getToolName() {
    throw new Error('getToolName must be implemented by subclasses');
  }

  getCategory() {
    throw new Error('getCategory must be implemented by subclasses');
  }

  async handle(args) {
    throw new Error('handle must be implemented by subclasses');
  }

  validateRequiredParams(args, requiredParams) {
    for (const param of requiredParams) {
      if (!args[param]) {
        throw new Error(`${param} is required`);
      }
    }
  }
}

/**
 * Tool Registry - CommonJS version matching shared system
 */
class ToolRegistry {
  constructor(context) {
    this.handlers = new Map();
    this.context = context;
  }

  register(toolName, handler) {
    if (this.handlers.has(toolName)) {
      throw new Error(`Tool '${toolName}' is already registered`);
    }
    this.handlers.set(toolName, handler);
  }

  async execute(toolName, args) {
    const handler = this.handlers.get(toolName);
    if (!handler) {
      throw new Error(`Unknown tool: ${toolName}`);
    }
    return await handler.handle(args);
  }

  isRegistered(toolName) {
    return this.handlers.has(toolName);
  }

  getRegisteredTools() {
    return Array.from(this.handlers.keys()).sort();
  }

  getStats() {
    const handlersByCategory = {};
    for (const handler of this.handlers.values()) {
      const category = handler.getCategory();
      handlersByCategory[category] = (handlersByCategory[category] || 0) + 1;
    }

    return {
      totalHandlers: this.handlers.size,
      handlersByCategory,
      registeredTools: this.getRegisteredTools()
    };
  }
}

/**
 * Assistant Handlers
 */
class AssistantCreateHandler extends BaseToolHandler {
  getToolName() { return 'assistant-create'; }
  getCategory() { return 'assistant'; }
  
  async handle(args) {
    this.validateRequiredParams(args, ['model']);
    return await this.context.openaiService.createAssistant(args);
  }
}

class AssistantListHandler extends BaseToolHandler {
  getToolName() { return 'assistant-list'; }
  getCategory() { return 'assistant'; }
  
  async handle(args) {
    return await this.context.openaiService.listAssistants(args);
  }
}

class AssistantGetHandler extends BaseToolHandler {
  getToolName() { return 'assistant-get'; }
  getCategory() { return 'assistant'; }
  
  async handle(args) {
    this.validateRequiredParams(args, ['assistant_id']);
    return await this.context.openaiService.getAssistant(args.assistant_id);
  }
}

class AssistantUpdateHandler extends BaseToolHandler {
  getToolName() { return 'assistant-update'; }
  getCategory() { return 'assistant'; }
  
  async handle(args) {
    this.validateRequiredParams(args, ['assistant_id']);
    const { assistant_id, ...updateData } = args;
    return await this.context.openaiService.updateAssistant(assistant_id, updateData);
  }
}

class AssistantDeleteHandler extends BaseToolHandler {
  getToolName() { return 'assistant-delete'; }
  getCategory() { return 'assistant'; }
  
  async handle(args) {
    this.validateRequiredParams(args, ['assistant_id']);
    return await this.context.openaiService.deleteAssistant(args.assistant_id);
  }
}

/**
 * Thread Handlers
 */
class ThreadCreateHandler extends BaseToolHandler {
  getToolName() { return 'thread-create'; }
  getCategory() { return 'thread'; }
  
  async handle(args) {
    return await this.context.openaiService.createThread(args);
  }
}

class ThreadGetHandler extends BaseToolHandler {
  getToolName() { return 'thread-get'; }
  getCategory() { return 'thread'; }
  
  async handle(args) {
    this.validateRequiredParams(args, ['thread_id']);
    return await this.context.openaiService.getThread(args.thread_id);
  }
}

class ThreadUpdateHandler extends BaseToolHandler {
  getToolName() { return 'thread-update'; }
  getCategory() { return 'thread'; }
  
  async handle(args) {
    this.validateRequiredParams(args, ['thread_id']);
    const { thread_id, ...updateData } = args;
    return await this.context.openaiService.updateThread(thread_id, updateData);
  }
}

class ThreadDeleteHandler extends BaseToolHandler {
  getToolName() { return 'thread-delete'; }
  getCategory() { return 'thread'; }
  
  async handle(args) {
    this.validateRequiredParams(args, ['thread_id']);
    return await this.context.openaiService.deleteThread(args.thread_id);
  }
}

/**
 * Message Handlers
 */
class MessageCreateHandler extends BaseToolHandler {
  getToolName() { return 'message-create'; }
  getCategory() { return 'message'; }
  
  async handle(args) {
    this.validateRequiredParams(args, ['thread_id', 'role', 'content']);
    const { thread_id, ...messageData } = args;
    return await this.context.openaiService.createMessage(thread_id, messageData);
  }
}

class MessageListHandler extends BaseToolHandler {
  getToolName() { return 'message-list'; }
  getCategory() { return 'message'; }
  
  async handle(args) {
    this.validateRequiredParams(args, ['thread_id']);
    const { thread_id, ...listData } = args;
    return await this.context.openaiService.listMessages(thread_id, listData);
  }
}

class MessageGetHandler extends BaseToolHandler {
  getToolName() { return 'message-get'; }
  getCategory() { return 'message'; }
  
  async handle(args) {
    this.validateRequiredParams(args, ['thread_id', 'message_id']);
    return await this.context.openaiService.getMessage(args.thread_id, args.message_id);
  }
}

class MessageUpdateHandler extends BaseToolHandler {
  getToolName() { return 'message-update'; }
  getCategory() { return 'message'; }
  
  async handle(args) {
    this.validateRequiredParams(args, ['thread_id', 'message_id']);
    const { thread_id, message_id, ...updateData } = args;
    return await this.context.openaiService.updateMessage(thread_id, message_id, updateData);
  }
}

class MessageDeleteHandler extends BaseToolHandler {
  getToolName() { return 'message-delete'; }
  getCategory() { return 'message'; }
  
  async handle(args) {
    this.validateRequiredParams(args, ['thread_id', 'message_id']);
    return await this.context.openaiService.deleteMessage(args.thread_id, args.message_id);
  }
}

/**
 * Run Handlers
 */
class RunCreateHandler extends BaseToolHandler {
  getToolName() { return 'run-create'; }
  getCategory() { return 'run'; }
  
  async handle(args) {
    this.validateRequiredParams(args, ['thread_id', 'assistant_id']);
    const { thread_id, ...runData } = args;
    return await this.context.openaiService.createRun(thread_id, runData);
  }
}

class RunListHandler extends BaseToolHandler {
  getToolName() { return 'run-list'; }
  getCategory() { return 'run'; }
  
  async handle(args) {
    this.validateRequiredParams(args, ['thread_id']);
    const { thread_id, ...listData } = args;
    return await this.context.openaiService.listRuns(thread_id, listData);
  }
}

class RunGetHandler extends BaseToolHandler {
  getToolName() { return 'run-get'; }
  getCategory() { return 'run'; }
  
  async handle(args) {
    this.validateRequiredParams(args, ['thread_id', 'run_id']);
    return await this.context.openaiService.getRun(args.thread_id, args.run_id);
  }
}

class RunUpdateHandler extends BaseToolHandler {
  getToolName() { return 'run-update'; }
  getCategory() { return 'run'; }
  
  async handle(args) {
    this.validateRequiredParams(args, ['thread_id', 'run_id']);
    const { thread_id, run_id, ...updateData } = args;
    return await this.context.openaiService.updateRun(thread_id, run_id, updateData);
  }
}

class RunCancelHandler extends BaseToolHandler {
  getToolName() { return 'run-cancel'; }
  getCategory() { return 'run'; }
  
  async handle(args) {
    this.validateRequiredParams(args, ['thread_id', 'run_id']);
    return await this.context.openaiService.cancelRun(args.thread_id, args.run_id);
  }
}

class RunSubmitToolOutputsHandler extends BaseToolHandler {
  getToolName() { return 'run-submit-tool-outputs'; }
  getCategory() { return 'run'; }
  
  async handle(args) {
    this.validateRequiredParams(args, ['thread_id', 'run_id', 'tool_outputs']);
    const { thread_id, run_id, ...submitData } = args;
    return await this.context.openaiService.submitToolOutputs(thread_id, run_id, submitData);
  }
}

/**
 * Run Step Handlers
 */
class RunStepListHandler extends BaseToolHandler {
  getToolName() { return 'run-step-list'; }
  getCategory() { return 'run-step'; }
  
  async handle(args) {
    this.validateRequiredParams(args, ['thread_id', 'run_id']);
    const { thread_id, run_id, ...listData } = args;
    return await this.context.openaiService.listRunSteps(thread_id, run_id, listData);
  }
}

class RunStepGetHandler extends BaseToolHandler {
  getToolName() { return 'run-step-get'; }
  getCategory() { return 'run-step'; }
  
  async handle(args) {
    this.validateRequiredParams(args, ['thread_id', 'run_id', 'step_id']);
    return await this.context.openaiService.getRunStep(args.thread_id, args.run_id, args.step_id);
  }
}

/**
 * Load tool definitions from the shared definitions directory
 */
function loadToolDefinitions() {
  const fs = require('fs');
  const path = require('path');
  
  const tools = [];
  const toolsDir = path.join(__dirname, '../../definitions/tools');
  
  function loadToolsFromDir(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        loadToolsFromDir(fullPath);
      } else if (item.endsWith('.json')) {
        try {
          const toolDef = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          tools.push(toolDef);
        } catch (error) {
          console.warn(`Failed to load tool definition from ${fullPath}:`, error.message);
        }
      }
    }
  }
  
  loadToolsFromDir(toolsDir);
  return tools;
}

/**
 * Setup function to create and configure the handler system
 */
function setupHandlerSystem(context) {
  const registry = new ToolRegistry(context);
  
  // Create all handlers
  const handlers = [
    // Assistant handlers (5)
    new AssistantCreateHandler(context),
    new AssistantListHandler(context),
    new AssistantGetHandler(context),
    new AssistantUpdateHandler(context),
    new AssistantDeleteHandler(context),
    
    // Thread handlers (4)
    new ThreadCreateHandler(context),
    new ThreadGetHandler(context),
    new ThreadUpdateHandler(context),
    new ThreadDeleteHandler(context),
    
    // Message handlers (5)
    new MessageCreateHandler(context),
    new MessageListHandler(context),
    new MessageGetHandler(context),
    new MessageUpdateHandler(context),
    new MessageDeleteHandler(context),
    
    // Run handlers (6)
    new RunCreateHandler(context),
    new RunListHandler(context),
    new RunGetHandler(context),
    new RunUpdateHandler(context),
    new RunCancelHandler(context),
    new RunSubmitToolOutputsHandler(context),
    
    // Run step handlers (2)
    new RunStepListHandler(context),
    new RunStepGetHandler(context)
  ];
  
  // Register all handlers
  for (const handler of handlers) {
    registry.register(handler.getToolName(), handler);
  }
  
  console.log(`[NPM-HandlerSystem] Initialized with ${handlers.length} handlers`);
  console.log(`[NPM-HandlerSystem] Expected: 22 tools (assistant:5, thread:4, message:5, run:6, run-step:2)`);
  
  const stats = registry.getStats();
  console.log(`[NPM-HandlerSystem] Actual: ${stats.totalHandlers} tools`, stats.handlersByCategory);
  
  return registry;
}

/**
 * Direct Implementation MCP Handler (No Proxy)
 */
class MCPHandler {
  constructor(apiKey) {
    // Validate API key
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API key is required and cannot be empty');
    }

    // Initialize OpenAI service
    this.openaiService = new OpenAIService(apiKey);
    
    // Create context for handlers
    const context = {
      openaiService: this.openaiService
    };
    
    // Initialize the handler system
    this.toolRegistry = setupHandlerSystem(context);
    
    console.log(`[NPM-MCPHandler] Initialized in direct mode with ${this.toolRegistry.handlers.size} tools`);
  }

  /**
   * Handle incoming MCP requests
   */
  async handleRequest(request) {
    try {
      // Validate JSON-RPC 2.0 format
      if (request.jsonrpc !== '2.0') {
        return this.createErrorResponse(request.id, -32600, 'Invalid JSON-RPC version');
      }

      // Handle different MCP methods
      switch (request.method) {
        case 'initialize':
          return this.handleInitialize(request);
        case 'tools/list':
          return this.handleToolsList(request);
        case 'tools/call':
          return this.handleToolsCall(request);
        case 'resources/list':
          return this.handleResourcesList(request);
        case 'resources/read':
          return this.handleResourcesRead(request);
        default:
          return this.createErrorResponse(request.id, -32601, 'Method not found');
      }
    } catch (error) {
      return this.createErrorResponse(
        request.id,
        -32603,
        'Internal error',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Handle initialize request
   */
  handleInitialize(request) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: { listChanged: false },
          resources: { subscribe: false, listChanged: false }
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
  handleToolsList(request) {
    // Load tool definitions from shared definitions directory
    const tools = loadToolDefinitions();
    
    console.log(`[NPM-MCPHandler] Returning ${tools.length} tool definitions`);
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: { tools }
    };
  }

  /**
   * Handle tools call request
   */
  async handleToolsCall(request) {
    try {
      const { name, arguments: args } = request.params;
      
      console.log(`[NPM-MCPHandler] Executing tool: ${name}`);
      
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
      console.error(`[NPM-MCPHandler] Tool execution error:`, error);
      
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
  handleResourcesList(request) {
    // Use the shared resources system
    const resources = getAllResources();
    
    console.log(`[NPM-MCPHandler] Returning ${resources.length} resources`);
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: { resources }
    };
  }

  /**
   * Handle resources read request
   */
  handleResourcesRead(request) {
    const { uri } = request.params;
    
    try {
      // Use the shared resources system
      const { getResource, getResourceContent } = require('../../shared/resources/resources.cjs');
      
      const resource = getResource(uri);
      if (!resource) {
        return this.createErrorResponse(request.id, -32602, 'Resource not found');
      }
      
      const content = getResourceContent(uri);
      
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          contents: [
            {
              uri: resource.uri,
              mimeType: resource.mimeType || 'text/plain',
              text: content
            }
          ]
        }
      };
    } catch (error) {
      return this.createErrorResponse(
        request.id,
        -32603,
        'Failed to read resource',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Create error response
   */
  createErrorResponse(id, code, message, data) {
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

  /**
   * Get registry statistics
   */
  getStats() {
    return this.toolRegistry?.getStats() || { totalHandlers: 0, handlersByCategory: {}, registeredTools: [] };
  }

  /**
   * Check if handler is initialized
   */
  isInitialized() {
    return this.toolRegistry !== null;
  }
}

module.exports = { MCPHandler };