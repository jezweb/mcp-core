import {
  MCPRequest,
  MCPResponse,
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
  ErrorCodes,
} from '@shared/types';
import { OpenAIService } from '@shared/services';
import { mcpResources, getResourceContent } from '@shared/resources';
import { setupHandlerSystem, ToolRegistry, generateToolDefinitions } from '../shared/core/index.js';

export class MCPHandler {
  private openaiService: OpenAIService;
  private toolRegistry: ToolRegistry;

  constructor(apiKey: string) {
    this.openaiService = new OpenAIService(apiKey);
    
    // Initialize the handler system
    const context = {
      openaiService: this.openaiService,
      toolName: '',
      requestId: null
    };
    
    console.log('[MCPHandler] Initializing handler system...');
    this.toolRegistry = setupHandlerSystem(context);
    
    // Debug: Check how many tools were registered
    const registeredTools = this.toolRegistry.getRegisteredTools();
    console.log(`[MCPHandler] Registered ${registeredTools.length} tools:`, registeredTools);
    
    if (registeredTools.length !== 22) {
      console.error(`[MCPHandler] ERROR: Expected 22 tools, got ${registeredTools.length}`);
      console.error('[MCPHandler] Registry stats:', this.toolRegistry.getStats());
    }
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
        case 'resources/list':
          return this.handleResourcesList(request as MCPResourcesListRequest);
        case 'resources/read':
          return this.handleResourcesRead(request as MCPResourcesReadRequest);
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
          resources: {
            subscribe: false,
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
    // Generate tool definitions dynamically from the modular handler system
    console.log('[MCPHandler] Generating tool definitions...');
    const tools = generateToolDefinitions(this.toolRegistry);
    console.log(`[MCPHandler] Generated ${tools.length} tool definitions`);
    
    if (tools.length !== 22) {
      console.error(`[MCPHandler] ERROR: Expected 22 tool definitions, got ${tools.length}`);
      const registeredTools = this.toolRegistry.getRegisteredTools();
      console.error(`[MCPHandler] Registry has ${registeredTools.length} tools:`, registeredTools);
    }

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
      // Update the context with current request information
      const updatedContext = {
        openaiService: this.openaiService,
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

  private handleResourcesList(request: MCPResourcesListRequest): MCPResourcesListResponse {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        resources: mcpResources,
      },
    };
  }

  private handleResourcesRead(request: MCPResourcesReadRequest): MCPResourcesReadResponse {
    const { uri } = request.params;
    
    const resourceData = getResourceContent(uri);
    if (!resourceData) {
      throw new MCPError(
        ErrorCodes.NOT_FOUND,
        `Resource not found: ${uri}`
      );
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
}