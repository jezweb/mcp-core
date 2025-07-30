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
  MCPResourcesListRequest,
  MCPResourcesListResponse,
  MCPResourcesReadRequest,
  MCPResourcesReadResponse,
  MCPTool,
  MCPError,
  ErrorCodes
} from './types.js';
import { OpenAIService } from './openai-service.js';
import { enhancedTools } from './mcp-handler-tools.js';
import { mcpResources, getResourceContent } from './resources.js';
import {
  validateOpenAIId,
  validateModel,
  validateCreateAssistantParams,
  validateRequiredString,
  validateMessageRole,
  validatePaginationParams,
  validateArray,
  validateMetadata,
  ValidationResult
} from './validation.js';

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
        case 'resources/list':
          return this.handleResourcesList(request as MCPResourcesListRequest);
        case 'resources/read':
          return this.handleResourcesRead(request as MCPResourcesReadRequest);
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
          },
          resources: {
            subscribe: false,
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
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: { tools: enhancedTools }
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
          // Comprehensive validation for assistant creation
          const createAssistantValidation = validateCreateAssistantParams(args);
          if (!createAssistantValidation.isValid) {
            throw createAssistantValidation.error;
          }
          result = await this.openaiService.createAssistant(args as any);
          break;
        case 'assistant-list':
          // Validate pagination parameters
          const listAssistantsValidation = validatePaginationParams(args);
          if (!listAssistantsValidation.isValid) {
            throw listAssistantsValidation.error;
          }
          result = await this.openaiService.listAssistants(args);
          break;
        case 'assistant-get':
          // Validate assistant ID
          const getAssistantValidation = validateOpenAIId(args.assistant_id, 'assistant', 'assistant_id');
          if (!getAssistantValidation.isValid) {
            throw getAssistantValidation.error;
          }
          result = await this.openaiService.getAssistant(args.assistant_id);
          break;
        case 'assistant-update':
          // Validate assistant ID and optional parameters
          const updateAssistantIdValidation = validateOpenAIId(args.assistant_id, 'assistant', 'assistant_id');
          if (!updateAssistantIdValidation.isValid) {
            throw updateAssistantIdValidation.error;
          }
          
          const { assistant_id: updateAssistantId, ...updateAssistantData } = args;
          
          // Validate model if provided
          if (updateAssistantData.model) {
            const modelValidation = validateModel(updateAssistantData.model);
            if (!modelValidation.isValid) {
              throw modelValidation.error;
            }
          }
          
          // Validate metadata if provided
          if (updateAssistantData.metadata !== undefined) {
            const metadataValidation = validateMetadata(updateAssistantData.metadata);
            if (!metadataValidation.isValid) {
              throw metadataValidation.error;
            }
          }
          
          result = await this.openaiService.updateAssistant(updateAssistantId, updateAssistantData);
          break;
        case 'assistant-delete':
          // Validate assistant ID
          const deleteAssistantValidation = validateOpenAIId(args.assistant_id, 'assistant', 'assistant_id');
          if (!deleteAssistantValidation.isValid) {
            throw deleteAssistantValidation.error;
          }
          result = await this.openaiService.deleteAssistant(args.assistant_id);
          break;

        // Thread Management
        case 'thread-create':
          // Validate metadata if provided
          if (args.metadata !== undefined) {
            const metadataValidation = validateMetadata(args.metadata);
            if (!metadataValidation.isValid) {
              throw metadataValidation.error;
            }
          }
          result = await this.openaiService.createThread(args);
          break;
        case 'thread-get':
          // Validate thread ID
          const getThreadValidation = validateOpenAIId(args.thread_id, 'thread', 'thread_id');
          if (!getThreadValidation.isValid) {
            throw getThreadValidation.error;
          }
          result = await this.openaiService.getThread(args.thread_id);
          break;
        case 'thread-update':
          // Validate thread ID
          const updateThreadIdValidation = validateOpenAIId(args.thread_id, 'thread', 'thread_id');
          if (!updateThreadIdValidation.isValid) {
            throw updateThreadIdValidation.error;
          }
          
          const { thread_id: updateThreadId, ...updateThreadData } = args;
          
          // Validate metadata if provided
          if (updateThreadData.metadata !== undefined) {
            const metadataValidation = validateMetadata(updateThreadData.metadata);
            if (!metadataValidation.isValid) {
              throw metadataValidation.error;
            }
          }
          
          result = await this.openaiService.updateThread(updateThreadId, updateThreadData);
          break;
        case 'thread-delete':
          // Validate thread ID
          const deleteThreadValidation = validateOpenAIId(args.thread_id, 'thread', 'thread_id');
          if (!deleteThreadValidation.isValid) {
            throw deleteThreadValidation.error;
          }
          result = await this.openaiService.deleteThread(args.thread_id);
          break;

        // Message Management
        case 'message-create':
          // Validate required thread ID
          const createMessageThreadValidation = validateOpenAIId(args.thread_id, 'thread', 'thread_id');
          if (!createMessageThreadValidation.isValid) {
            throw createMessageThreadValidation.error;
          }
          
          // Validate required role
          const roleValidation = validateMessageRole(args.role);
          if (!roleValidation.isValid) {
            throw roleValidation.error;
          }
          
          // Validate required content
          const contentValidation = validateRequiredString(args.content, 'content', ['"Hello, how can I help you?"', '"Please analyze this data."']);
          if (!contentValidation.isValid) {
            throw contentValidation.error;
          }
          
          // Validate metadata if provided
          if (args.metadata !== undefined) {
            const metadataValidation = validateMetadata(args.metadata);
            if (!metadataValidation.isValid) {
              throw metadataValidation.error;
            }
          }
          
          const { thread_id: createMessageThreadId, ...createMessageData } = args;
          result = await this.openaiService.createMessage(createMessageThreadId, createMessageData as any);
          break;
        case 'message-list':
          // Validate thread ID
          const listMessageThreadValidation = validateOpenAIId(args.thread_id, 'thread', 'thread_id');
          if (!listMessageThreadValidation.isValid) {
            throw listMessageThreadValidation.error;
          }
          
          const { thread_id: listMessageThreadId, ...listMessageData } = args;
          
          // Validate pagination parameters
          const listMessagePaginationValidation = validatePaginationParams(listMessageData);
          if (!listMessagePaginationValidation.isValid) {
            throw listMessagePaginationValidation.error;
          }
          
          // Validate run_id if provided
          if (listMessageData.run_id) {
            const runIdValidation = validateOpenAIId(listMessageData.run_id, 'run', 'run_id');
            if (!runIdValidation.isValid) {
              throw runIdValidation.error;
            }
          }
          
          result = await this.openaiService.listMessages(listMessageThreadId, listMessageData);
          break;
        case 'message-get':
          // Validate thread ID
          const getMessageThreadValidation = validateOpenAIId(args.thread_id, 'thread', 'thread_id');
          if (!getMessageThreadValidation.isValid) {
            throw getMessageThreadValidation.error;
          }
          
          // Validate message ID
          const getMessageValidation = validateOpenAIId(args.message_id, 'message', 'message_id');
          if (!getMessageValidation.isValid) {
            throw getMessageValidation.error;
          }
          
          result = await this.openaiService.getMessage(args.thread_id, args.message_id);
          break;
        case 'message-update':
          // Validate thread ID
          const updateMessageThreadValidation = validateOpenAIId(args.thread_id, 'thread', 'thread_id');
          if (!updateMessageThreadValidation.isValid) {
            throw updateMessageThreadValidation.error;
          }
          
          // Validate message ID
          const updateMessageValidation = validateOpenAIId(args.message_id, 'message', 'message_id');
          if (!updateMessageValidation.isValid) {
            throw updateMessageValidation.error;
          }
          
          const { thread_id: updateMessageThreadId, message_id: updateMessageId, ...updateMessageData } = args;
          
          // Validate metadata if provided
          if (updateMessageData.metadata !== undefined) {
            const metadataValidation = validateMetadata(updateMessageData.metadata);
            if (!metadataValidation.isValid) {
              throw metadataValidation.error;
            }
          }
          
          result = await this.openaiService.updateMessage(updateMessageThreadId, updateMessageId, updateMessageData);
          break;
        case 'message-delete':
          // Validate thread ID
          const deleteMessageThreadValidation = validateOpenAIId(args.thread_id, 'thread', 'thread_id');
          if (!deleteMessageThreadValidation.isValid) {
            throw deleteMessageThreadValidation.error;
          }
          
          // Validate message ID
          const deleteMessageValidation = validateOpenAIId(args.message_id, 'message', 'message_id');
          if (!deleteMessageValidation.isValid) {
            throw deleteMessageValidation.error;
          }
          
          result = await this.openaiService.deleteMessage(args.thread_id, args.message_id);
          break;

        // Run Management
        case 'run-create':
          // Validate required thread ID
          const createRunThreadValidation = validateOpenAIId(args.thread_id, 'thread', 'thread_id');
          if (!createRunThreadValidation.isValid) {
            throw createRunThreadValidation.error;
          }
          
          // Validate required assistant ID
          const createRunAssistantValidation = validateOpenAIId(args.assistant_id, 'assistant', 'assistant_id');
          if (!createRunAssistantValidation.isValid) {
            throw createRunAssistantValidation.error;
          }
          
          // Validate model if provided
          if (args.model) {
            const modelValidation = validateModel(args.model);
            if (!modelValidation.isValid) {
              throw modelValidation.error;
            }
          }
          
          // Validate metadata if provided
          if (args.metadata !== undefined) {
            const metadataValidation = validateMetadata(args.metadata);
            if (!metadataValidation.isValid) {
              throw metadataValidation.error;
            }
          }
          
          const { thread_id: createRunThreadId, ...createRunData } = args;
          result = await this.openaiService.createRun(createRunThreadId, createRunData as any);
          break;
        case 'run-list':
          // Validate thread ID
          const listRunThreadValidation = validateOpenAIId(args.thread_id, 'thread', 'thread_id');
          if (!listRunThreadValidation.isValid) {
            throw listRunThreadValidation.error;
          }
          
          const { thread_id: listRunThreadId, ...listRunData } = args;
          
          // Validate pagination parameters
          const listRunPaginationValidation = validatePaginationParams(listRunData);
          if (!listRunPaginationValidation.isValid) {
            throw listRunPaginationValidation.error;
          }
          
          result = await this.openaiService.listRuns(listRunThreadId, listRunData);
          break;
        case 'run-get':
          // Validate thread ID
          const getRunThreadValidation = validateOpenAIId(args.thread_id, 'thread', 'thread_id');
          if (!getRunThreadValidation.isValid) {
            throw getRunThreadValidation.error;
          }
          
          // Validate run ID
          const getRunValidation = validateOpenAIId(args.run_id, 'run', 'run_id');
          if (!getRunValidation.isValid) {
            throw getRunValidation.error;
          }
          
          result = await this.openaiService.getRun(args.thread_id, args.run_id);
          break;
        case 'run-update':
          // Validate thread ID
          const updateRunThreadValidation = validateOpenAIId(args.thread_id, 'thread', 'thread_id');
          if (!updateRunThreadValidation.isValid) {
            throw updateRunThreadValidation.error;
          }
          
          // Validate run ID
          const updateRunValidation = validateOpenAIId(args.run_id, 'run', 'run_id');
          if (!updateRunValidation.isValid) {
            throw updateRunValidation.error;
          }
          
          const { thread_id: updateRunThreadId, run_id: updateRunId, ...updateRunData } = args;
          
          // Validate metadata if provided
          if (updateRunData.metadata !== undefined) {
            const metadataValidation = validateMetadata(updateRunData.metadata);
            if (!metadataValidation.isValid) {
              throw metadataValidation.error;
            }
          }
          
          result = await this.openaiService.updateRun(updateRunThreadId, updateRunId, updateRunData);
          break;
        case 'run-cancel':
          // Validate thread ID
          const cancelRunThreadValidation = validateOpenAIId(args.thread_id, 'thread', 'thread_id');
          if (!cancelRunThreadValidation.isValid) {
            throw cancelRunThreadValidation.error;
          }
          
          // Validate run ID
          const cancelRunValidation = validateOpenAIId(args.run_id, 'run', 'run_id');
          if (!cancelRunValidation.isValid) {
            throw cancelRunValidation.error;
          }
          
          result = await this.openaiService.cancelRun(args.thread_id, args.run_id);
          break;
        case 'run-submit-tool-outputs':
          // Validate required thread ID
          const submitThreadValidation = validateOpenAIId(args.thread_id, 'thread', 'thread_id');
          if (!submitThreadValidation.isValid) {
            throw submitThreadValidation.error;
          }
          
          // Validate required run ID
          const submitRunValidation = validateOpenAIId(args.run_id, 'run', 'run_id');
          if (!submitRunValidation.isValid) {
            throw submitRunValidation.error;
          }
          
          // Validate required tool_outputs array
          const toolOutputsValidation = validateArray(args.tool_outputs, 'tool_outputs', true);
          if (!toolOutputsValidation.isValid) {
            throw toolOutputsValidation.error;
          }
          
          // Validate each tool output
          if (args.tool_outputs && Array.isArray(args.tool_outputs)) {
            for (let i = 0; i < args.tool_outputs.length; i++) {
              const output = args.tool_outputs[i];
              
              if (!output.tool_call_id) {
                throw new MCPError(
                  ErrorCodes.INVALID_PARAMS,
                  `Tool output at index ${i} is missing 'tool_call_id'. Each tool output must include the tool_call_id from the run's required_action. Example: {"tool_call_id": "call_abc123def456ghi789jkl012", "output": "result"}.`
                );
              }
              
              const toolCallIdValidation = validateOpenAIId(output.tool_call_id, 'tool_call', `tool_outputs[${i}].tool_call_id`);
              if (!toolCallIdValidation.isValid) {
                throw toolCallIdValidation.error;
              }
              
              if (!output.output || typeof output.output !== 'string') {
                throw new MCPError(
                  ErrorCodes.INVALID_PARAMS,
                  `Tool output at index ${i} is missing or has invalid 'output'. Provide the function result as a string. Example: {"tool_call_id": "call_abc123def456ghi789jkl012", "output": "The calculation result is 42"}.`
                );
              }
            }
          }
          
          const { thread_id: submitThreadId, run_id: submitRunId, ...submitData } = args;
          result = await this.openaiService.submitToolOutputs(submitThreadId, submitRunId, submitData as any);
          break;

        // Run Step Management
        case 'run-step-list':
          // Validate thread ID
          const listStepThreadValidation = validateOpenAIId(args.thread_id, 'thread', 'thread_id');
          if (!listStepThreadValidation.isValid) {
            throw listStepThreadValidation.error;
          }
          
          // Validate run ID
          const listStepRunValidation = validateOpenAIId(args.run_id, 'run', 'run_id');
          if (!listStepRunValidation.isValid) {
            throw listStepRunValidation.error;
          }
          
          const { thread_id: listStepThreadId, run_id: listStepRunId, ...listStepData } = args;
          
          // Validate pagination parameters
          const listStepPaginationValidation = validatePaginationParams(listStepData);
          if (!listStepPaginationValidation.isValid) {
            throw listStepPaginationValidation.error;
          }
          
          result = await this.openaiService.listRunSteps(listStepThreadId, listStepRunId, listStepData);
          break;
        case 'run-step-get':
          // Validate thread ID
          const getStepThreadValidation = validateOpenAIId(args.thread_id, 'thread', 'thread_id');
          if (!getStepThreadValidation.isValid) {
            throw getStepThreadValidation.error;
          }
          
          // Validate run ID
          const getStepRunValidation = validateOpenAIId(args.run_id, 'run', 'run_id');
          if (!getStepRunValidation.isValid) {
            throw getStepRunValidation.error;
          }
          
          // Validate step ID
          const getStepValidation = validateOpenAIId(args.step_id, 'step', 'step_id');
          if (!getStepValidation.isValid) {
            throw getStepValidation.error;
          }
          
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
   * Handle resources list request
   */
  private handleResourcesList(request: MCPResourcesListRequest): MCPResourcesListResponse {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        resources: mcpResources,
      },
    };
  }

  /**
   * Handle resources read request
   */
  private handleResourcesRead(request: MCPResourcesReadRequest): MCPResourcesReadResponse {
    const { uri } = request.params;
    
    const resourceData = getResourceContent(uri);
    if (!resourceData) {
      return this.createErrorResponse(
        request.id,
        ErrorCodes.NOT_FOUND,
        `Resource not found: ${uri}`
      ) as MCPResourcesReadResponse;
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