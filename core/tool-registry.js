/**
 * Tool Registry - Central registry for managing and executing tool handlers
 *
 * This class implements the Registry pattern and acts as a facade for tool execution:
 * - Maintains a map of tool names to handler instances
 * - Provides registration and execution methods
 * - Handles unknown tools with proper error messages
 * - Supports dynamic handler registration for extensibility
 *
 * Usage:
 * 1. Register handlers: registry.register('assistant-create', new AssistantCreateHandler(context))
 * 2. Execute tools: await registry.execute('assistant-create', args)
 */
import { MCPError, ErrorCodes } from '../types/index.js';
/**
 * Central registry for tool handlers
 *
 * Responsibilities:
 * - Store and manage tool handler instances
 * - Route tool execution requests to appropriate handlers
 * - Provide introspection capabilities
 * - Handle registration and deregistration of handlers
 */
export class ToolRegistry {
    handlers = new Map();
    context;
    constructor(context) {
        this.context = context;
    }
    /**
     * Register a tool handler
     *
     * @param toolName - The name of the tool (e.g., 'assistant-create')
     * @param handler - The handler instance
     * @throws MCPError if tool is already registered
     */
    register(toolName, handler) {
        try {
            console.log(`[ToolRegistry] DEBUG: Attempting to register tool: ${toolName}`);
            if (this.handlers.has(toolName)) {
                const error = new MCPError(ErrorCodes.INTERNAL_ERROR, `Tool '${toolName}' is already registered. Cannot register duplicate handlers.`);
                console.error(`[ToolRegistry] ERROR: ${error.message}`);
                throw error;
            }
            // Validate that the handler's tool name matches the registration name
            const handlerToolName = handler.getToolName();
            console.log(`[ToolRegistry] DEBUG: Handler reports tool name: ${handlerToolName}`);
            if (handlerToolName !== toolName) {
                const error = new MCPError(ErrorCodes.INTERNAL_ERROR, `Handler tool name '${handlerToolName}' does not match registration name '${toolName}'.`);
                console.error(`[ToolRegistry] ERROR: ${error.message}`);
                throw error;
            }
            this.handlers.set(toolName, handler);
            this.logRegistration(toolName, handler);
            console.log(`[ToolRegistry] SUCCESS: Registered tool: ${toolName} (total: ${this.handlers.size})`);
        }
        catch (error) {
            console.error(`[ToolRegistry] FATAL ERROR registering ${toolName}:`, error);
            throw error;
        }
    }
    /**
     * Unregister a tool handler
     *
     * @param toolName - The name of the tool to unregister
     * @returns true if handler was found and removed, false otherwise
     */
    unregister(toolName) {
        const removed = this.handlers.delete(toolName);
        if (removed) {
            console.log(`[ToolRegistry] Unregistered handler for tool: ${toolName}`);
        }
        return removed;
    }
    /**
     * Execute a tool by name
     *
     * @param toolName - The name of the tool to execute
     * @param args - The arguments to pass to the tool
     * @returns Promise resolving to the tool execution result
     * @throws MCPError if tool is not found or execution fails
     */
    async execute(toolName, args) {
        const handler = this.handlers.get(toolName);
        if (!handler) {
            throw this.createUnknownToolError(toolName);
        }
        try {
            // Update context with current tool name for logging
            const executionContext = {
                ...this.context,
                toolName
            };
            // Create a new handler instance with updated context for this execution
            const contextualHandler = Object.create(Object.getPrototypeOf(handler));
            Object.assign(contextualHandler, handler);
            contextualHandler.context = executionContext;
            return await contextualHandler.handle(args);
        }
        catch (error) {
            // Re-throw with additional context if it's not already an MCPError
            if (!(error instanceof MCPError)) {
                throw new MCPError(ErrorCodes.INTERNAL_ERROR, `Tool execution failed for '${toolName}': ${error instanceof Error ? error.message : 'Unknown error'}`, { originalError: error, toolName, args: this.sanitizeArgsForLogging(args) });
            }
            throw error;
        }
    }
    /**
     * Check if a tool is registered
     *
     * @param toolName - The name of the tool to check
     * @returns true if the tool is registered, false otherwise
     */
    isRegistered(toolName) {
        return this.handlers.has(toolName);
    }
    /**
     * Get all registered tool names
     *
     * @returns Array of registered tool names
     */
    getRegisteredTools() {
        return Array.from(this.handlers.keys()).sort();
    }
    /**
     * Get registry statistics
     *
     * @returns Statistics about the registry
     */
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
    /**
     * Get handler for a specific tool (for testing/debugging)
     *
     * @param toolName - The name of the tool
     * @returns The handler instance or undefined if not found
     */
    getHandler(toolName) {
        return this.handlers.get(toolName);
    }
    /**
     * Clear all registered handlers (useful for testing)
     */
    clear() {
        const count = this.handlers.size;
        this.handlers.clear();
        console.log(`[ToolRegistry] Cleared ${count} registered handlers`);
    }
    /**
     * Register multiple handlers at once
     *
     * @param handlerMap - Map of tool names to handler instances
     */
    registerBatch(handlerMap) {
        for (const [toolName, handler] of Object.entries(handlerMap)) {
            this.register(toolName, handler);
        }
    }
    /**
     * Create an error for unknown tools with helpful suggestions
     */
    createUnknownToolError(toolName) {
        const registeredTools = this.getRegisteredTools();
        if (registeredTools.length === 0) {
            return new MCPError(ErrorCodes.METHOD_NOT_FOUND, `Tool not found: '${toolName}'. No tools are currently registered.`);
        }
        // Find similar tool names for suggestions
        const suggestions = this.findSimilarTools(toolName, registeredTools);
        const suggestionText = suggestions.length > 0
            ? ` Did you mean: ${suggestions.join(', ')}?`
            : '';
        return new MCPError(ErrorCodes.METHOD_NOT_FOUND, `Tool not found: '${toolName}'.${suggestionText} Available tools: ${registeredTools.join(', ')}.`);
    }
    /**
     * Find similar tool names for suggestions
     */
    findSimilarTools(toolName, availableTools) {
        const suggestions = [];
        const lowerToolName = toolName.toLowerCase();
        for (const tool of availableTools) {
            const lowerTool = tool.toLowerCase();
            // Exact prefix match
            if (lowerTool.startsWith(lowerToolName) || lowerToolName.startsWith(lowerTool)) {
                suggestions.push(tool);
            }
            // Contains match
            else if (lowerTool.includes(lowerToolName) || lowerToolName.includes(lowerTool)) {
                suggestions.push(tool);
            }
        }
        return suggestions.slice(0, 3); // Limit to 3 suggestions
    }
    /**
     * Log handler registration
     */
    logRegistration(toolName, handler) {
        console.log(`[ToolRegistry] Registered handler for tool: ${toolName} (category: ${handler.getCategory()})`);
    }
    /**
     * Sanitize arguments for logging (remove sensitive data)
     */
    sanitizeArgsForLogging(args) {
        if (!args || typeof args !== 'object') {
            return args;
        }
        const sanitized = { ...args };
        // Remove or mask sensitive fields
        const sensitiveFields = ['api_key', 'token', 'password', 'secret'];
        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        }
        return sanitized;
    }
}
