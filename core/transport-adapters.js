/**
 * Transport Adapters for Thin Deployment Adapters
 *
 * This module provides shared transport-specific logic that can be used
 * by thin deployment adapters to handle protocol-specific concerns while
 * delegating all business logic to the BaseMCPHandler.
 */
import { ErrorCodes, LegacyErrorCodes, createStandardErrorResponse, createEnhancedError, } from '../types/index.js';
/**
 * Cloudflare Workers Transport Adapter
 * Handles HTTP-specific optimizations for Cloudflare Workers
 */
export class CloudflareWorkerTransportAdapter {
    async preprocessRequest(request) {
        // HTTP transport doesn't need special preprocessing
        return request;
    }
    async postprocessResponse(response) {
        // HTTP transport doesn't need special postprocessing
        // The Worker handles JSON -> HTTP conversion
        return response;
    }
    formatError(error, requestId) {
        return createStandardErrorResponse(requestId, error.code, error.message, error.data);
    }
}
/**
 * HTTP Transport Adapter for Cloudflare Workers
 * Handles HTTP-specific request/response processing
 */
export class HTTPTransportAdapter {
    /**
     * Extract API key from URL path
     */
    extractApiKeyFromPath(pathname) {
        const pathParts = pathname.split('/');
        // Expected format: /mcp/{api-key}
        if (pathParts.length !== 3 || pathParts[1] !== 'mcp') {
            const errorResponse = createStandardErrorResponse(null, ErrorCodes.INVALID_REQUEST, 'Invalid URL format. Expected: /mcp/{api-key}', {
                receivedPath: pathname,
                expectedFormat: '/mcp/{api-key}',
                documentation: 'https://docs.openai.com/api-reference'
            });
            return { apiKey: null, error: errorResponse };
        }
        const apiKey = pathParts[2];
        if (!apiKey || apiKey.length < 10) {
            const authError = createEnhancedError(LegacyErrorCodes.UNAUTHORIZED, 'Invalid or missing API key', {
                keyLength: apiKey?.length || 0,
                minLength: 10,
                documentation: 'https://docs.openai.com/api-reference/authentication'
            });
            const errorResponse = createStandardErrorResponse(null, authError.code, authError.message, authError.data);
            return { apiKey: null, error: errorResponse };
        }
        return { apiKey, error: null };
    }
    /**
     * Parse and validate JSON-RPC request from HTTP body
     */
    async parseRequest(request) {
        // Parse request body
        let mcpRequest;
        try {
            mcpRequest = await request.json();
        }
        catch (error) {
            const errorResponse = createStandardErrorResponse(null, ErrorCodes.PARSE_ERROR, 'Invalid JSON in request body', {
                parseError: error instanceof Error ? error.message : 'Unknown parse error',
                documentation: 'https://www.jsonrpc.org/specification'
            });
            return { mcpRequest: null, error: errorResponse };
        }
        // Validate JSON-RPC format
        if (!mcpRequest.jsonrpc || mcpRequest.jsonrpc !== '2.0' || !mcpRequest.method) {
            const errorResponse = createStandardErrorResponse(mcpRequest.id || null, ErrorCodes.INVALID_REQUEST, 'Invalid JSON-RPC 2.0 request format', {
                missingFields: {
                    jsonrpc: !mcpRequest.jsonrpc || mcpRequest.jsonrpc !== '2.0',
                    method: !mcpRequest.method
                },
                received: {
                    jsonrpc: mcpRequest.jsonrpc,
                    method: mcpRequest.method
                },
                documentation: 'https://www.jsonrpc.org/specification'
            });
            return { mcpRequest: null, error: errorResponse };
        }
        return { mcpRequest, error: null };
    }
    /**
     * Create HTTP Response with CORS headers
     */
    createResponse(data, status = 200) {
        return new Response(JSON.stringify(data), {
            status,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
        });
    }
    /**
     * Create CORS preflight response
     */
    createCORSResponse() {
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
    /**
     * Create method not allowed response
     */
    createMethodNotAllowedResponse() {
        return new Response('Method not allowed', {
            status: 405,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'text/plain',
            },
        });
    }
    /**
     * Create error response with enhanced error details
     */
    createErrorResponse(error, requestId = null) {
        const errorResponse = createStandardErrorResponse(requestId, ErrorCodes.INTERNAL_ERROR, 'Internal server error', {
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? {
                name: error.name,
                message: error.message
            } : 'Unknown error'
        });
        return this.createResponse(errorResponse, 500);
    }
}
/**
 * Stdio Transport Helper Class
 * Provides stdio-specific utilities for NPM package deployment
 */
class StdioTransportHelper {
    debug;
    constructor(debug = false) {
        this.debug = debug;
    }
    /**
     * Setup error handling for the process
     */
    setupErrorHandling() {
        // Prevent crashes that cause connection issues with MCP clients
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
    /**
     * Setup stdio interface with readline
     */
    setupStdioInterface(handleInput) {
        const readline = require('readline');
        // Ensure stdout is line-buffered for MCP client compatibility
        process.stdout.setEncoding('utf8');
        if (process.stdout.isTTY) {
            // Type assertion for Node.js internal property
            process.stdout._flush = process.stdout._flush || (() => { });
        }
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false
        });
        rl.on('line', (line) => {
            handleInput(line.trim());
        });
        rl.on('close', () => {
            this.logDebug('Stdin closed, exiting');
            process.exit(0);
        });
    }
    /**
     * Parse and validate JSON-RPC request from stdio line
     */
    parseRequest(line) {
        // Handle empty line handshake that MCP clients send
        if (line === '') {
            this.logDebug('Received empty line handshake from MCP client');
            return { mcpRequest: null, error: null };
        }
        this.logDebug('Received input:', line);
        // Parse JSON-RPC message
        let request;
        try {
            request = JSON.parse(line);
        }
        catch (parseError) {
            this.logError('JSON parse error:', parseError);
            const errorResponse = this.createErrorResponse(null, -32700, 'Parse error', parseError instanceof Error ? parseError.message : 'Unknown parse error');
            return { mcpRequest: null, error: errorResponse };
        }
        // Validate JSON-RPC 2.0 format
        if (request.jsonrpc !== '2.0') {
            const errorResponse = this.createErrorResponse(request.id, -32600, 'Invalid Request', 'Invalid JSON-RPC version');
            return { mcpRequest: null, error: errorResponse };
        }
        return { mcpRequest: request, error: null };
    }
    /**
     * Send response via stdout
     */
    sendResponse(response) {
        // Ensure messages are UTF-8 encoded and delimited by newlines
        // Messages MUST NOT contain embedded newlines
        const message = JSON.stringify(response);
        // Validate no embedded newlines
        if (message.includes('\n') || message.includes('\r')) {
            this.logError('Response contains embedded newlines, this will break MCP client compatibility');
            // Remove embedded newlines to prevent protocol violation
            const cleanMessage = message.replace(/[\n\r]/g, ' ');
            process.stdout.write(cleanMessage + '\n');
        }
        else {
            process.stdout.write(message + '\n');
        }
        this.logDebug('Sent response:', message);
    }
    /**
     * Send error response
     */
    sendErrorResponse(id, code, message, data = null) {
        const response = this.createErrorResponse(id, code, message, data);
        this.sendResponse(response);
    }
    /**
     * Create error response
     */
    createErrorResponse(id, code, message, data = null) {
        return {
            jsonrpc: '2.0',
            id: id,
            error: {
                code: code,
                message: message,
                ...(data && { data: data })
            }
        };
    }
    /**
     * Create initialize response
     */
    createInitializeResponse(id, serverName, serverVersion) {
        return {
            jsonrpc: '2.0',
            id: id,
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
                    name: serverName,
                    version: serverVersion
                }
            }
        };
    }
    /**
     * Create initialized notification
     */
    createInitializedNotification() {
        return {
            jsonrpc: '2.0',
            method: 'notifications/initialized',
            params: {}
        };
    }
    /**
     * Validate API key from environment
     */
    validateApiKey() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            const errorResponse = this.createErrorResponse(null, -32602, 'Invalid params', 'OPENAI_API_KEY environment variable is required. Please configure it in your MCP client.');
            return { apiKey: null, error: errorResponse };
        }
        return { apiKey, error: null };
    }
    /**
     * Debug logging
     */
    logDebug(...args) {
        if (this.debug) {
            console.error('[DEBUG]', ...args);
        }
    }
    /**
     * Error logging
     */
    logError(...args) {
        console.error('[ERROR]', ...args);
    }
}
/**
 * Stdio Transport Adapter that implements the TransportAdapter interface
 */
export class StdioTransportAdapter extends StdioTransportHelper {
    async preprocessRequest(request) {
        // Stdio transport doesn't need special preprocessing
        return request;
    }
    async postprocessResponse(response) {
        // Stdio transport doesn't need special postprocessing
        return response;
    }
    formatError(error, requestId) {
        return this.createErrorResponse(requestId, error.code, error.message, error.data);
    }
}
/**
 * Alias for backward compatibility
 */
export const ProxyTransportAdapter = CloudflareWorkerTransportAdapter;
export const LocalDevTransportAdapter = StdioTransportAdapter;
/**
 * Shared request routing logic
 */
export class RequestRouter {
    /**
     * Route request to appropriate method
     */
    static getMethodType(method) {
        switch (method) {
            case 'initialize':
                return 'initialize';
            case 'tools/list':
            case 'tools/call':
            case 'resources/list':
            case 'resources/read':
            case 'prompts/list':
            case 'prompts/get':
            case 'completion/complete':
                return 'mcp';
            default:
                return 'unknown';
        }
    }
    /**
     * Check if server is initialized for MCP requests
     */
    static requiresInitialization(method) {
        return method !== 'initialize';
    }
}
