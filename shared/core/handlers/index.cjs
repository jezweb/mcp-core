/**
 * CommonJS version of Handler System for NPM package compatibility
 * 
 * This file provides a simplified CommonJS-compatible version of the handler system
 * that can be used by the NPM package while maintaining the same functionality
 * as the TypeScript version.
 */

const { OpenAIService } = require('../../services/openai-service.cjs');

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

  registerBatch(handlers) {
    for (const [toolName, handler] of Object.entries(handlers)) {
      this.register(toolName, handler);
    }
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

  getHandler(toolName) {
    return this.handlers.get(toolName);
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
  const toolsDir = path.join(__dirname, '../../../definitions/tools');
  
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
 * Generate tool definitions for the registry
 */
function generateToolDefinitions(registry) {
  return loadToolDefinitions();
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
  
  console.log(`[HandlerSystem] Initialized with ${handlers.length} handlers`);
  console.log(`[HandlerSystem] Expected: 22 tools (assistant:5, thread:4, message:5, run:6, run-step:2)`);
  
  const stats = registry.getStats();
  console.log(`[HandlerSystem] Actual: ${stats.totalHandlers} tools`, stats.handlersByCategory);
  
  return registry;
}

module.exports = {
  BaseToolHandler,
  ToolRegistry,
  setupHandlerSystem,
  generateToolDefinitions,
  loadToolDefinitions,
  
  // Individual handler exports
  AssistantCreateHandler,
  AssistantListHandler,
  AssistantGetHandler,
  AssistantUpdateHandler,
  AssistantDeleteHandler,
  ThreadCreateHandler,
  ThreadGetHandler,
  ThreadUpdateHandler,
  ThreadDeleteHandler,
  MessageCreateHandler,
  MessageListHandler,
  MessageGetHandler,
  MessageUpdateHandler,
  MessageDeleteHandler,
  RunCreateHandler,
  RunListHandler,
  RunGetHandler,
  RunUpdateHandler,
  RunCancelHandler,
  RunSubmitToolOutputsHandler,
  RunStepListHandler,
  RunStepGetHandler
};