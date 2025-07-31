/**
 * Core Types - Shared type definitions for OpenAI Assistants MCP Server
 * 
 * This module consolidates all common type definitions used across both
 * Cloudflare Workers and NPM package deployments.
 * 
 * Consolidates 620 lines of duplicate type definitions.
 */

// JSON-RPC 2.0 base types
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number | null;
  method: string;
  params?: any;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: any;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}

// MCP Protocol types (legacy compatibility)
export interface MCPRequest extends JsonRpcRequest {}
export interface MCPResponse extends JsonRpcResponse {}

// MCP Initialize types
export interface MCPInitializeRequest extends JsonRpcRequest {
  method: 'initialize';
  params: {
    protocolVersion: string;
    capabilities: {
      tools?: {};
    };
    clientInfo: {
      name: string;
      version: string;
    };
  };
}

export interface MCPInitializeResponse extends JsonRpcResponse {
  result: {
    protocolVersion: string;
    capabilities: {
      tools: {
        listChanged?: boolean;
      };
      resources?: {
        subscribe?: boolean;
        listChanged?: boolean;
      };
      prompts?: {
        listChanged?: boolean;
      };
      completions?: {};
    };
    serverInfo: {
      name: string;
      version: string;
    };
  };
}

// MCP Tools types
export interface MCPToolsListRequest extends JsonRpcRequest {
  method: 'tools/list';
  params?: {
    cursor?: string;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface Tool extends MCPTool {} // Legacy compatibility

export interface MCPToolsListResponse extends JsonRpcResponse {
  result: {
    tools: MCPTool[];
    nextCursor?: string;
  };
}

export interface MCPToolsCallRequest extends JsonRpcRequest {
  method: 'tools/call';
  params: {
    name: string;
    arguments: Record<string, any>;
  };
}

export interface MCPToolsCallResponse extends JsonRpcResponse {
  result: {
    content: Array<{
      type: 'text';
      text: string;
    }>;
    isError?: boolean;
  };
}

// MCP Resources types
export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPResourcesListRequest extends JsonRpcRequest {
  method: 'resources/list';
  params?: {
    cursor?: string;
  };
}

export interface MCPResourcesListResponse extends JsonRpcResponse {
  result: {
    resources: MCPResource[];
    nextCursor?: string;
  };
}

export interface MCPResourcesReadRequest extends JsonRpcRequest {
  method: 'resources/read';
  params: {
    uri: string;
  };
}

export interface MCPResourcesReadResponse extends JsonRpcResponse {
  result: {
    contents: Array<{
      uri: string;
      mimeType?: string;
      text?: string;
      blob?: string;
    }>;
  };
}

// Legacy compatibility
export interface Resource extends MCPResource {}

// OpenAI Assistants API types
export interface Assistant {
  id: string;
  object: 'assistant';
  created_at: number;
  name: string | null;
  description: string | null;
  model: string;
  instructions: string | null;
  tools: Array<{
    type: 'code_interpreter' | 'file_search' | 'function';
    function?: {
      name: string;
      description?: string;
      parameters?: Record<string, any>;
    };
  }>;
  tool_resources?: {
    code_interpreter?: {
      file_ids: string[];
    };
    file_search?: {
      vector_store_ids: string[];
    };
  };
  metadata: Record<string, any>;
  temperature?: number | null;
  top_p?: number | null;
  response_format?: 'auto' | { type: 'text' | 'json_object' };
}

export interface CreateAssistantRequest {
  model: string;
  name?: string;
  description?: string;
  instructions?: string;
  tools?: Array<{
    type: 'code_interpreter' | 'file_search' | 'function';
    function?: {
      name: string;
      description?: string;
      parameters?: Record<string, any>;
    };
  }>;
  tool_resources?: {
    code_interpreter?: {
      file_ids: string[];
    };
    file_search?: {
      vector_store_ids: string[];
    };
  };
  metadata?: Record<string, any>;
  temperature?: number;
  top_p?: number;
  response_format?: 'auto' | { type: 'text' | 'json_object' };
}

export interface UpdateAssistantRequest {
  model?: string;
  name?: string;
  description?: string;
  instructions?: string;
  tools?: Array<{
    type: 'code_interpreter' | 'file_search' | 'function';
    function?: {
      name: string;
      description?: string;
      parameters?: Record<string, any>;
    };
  }>;
  tool_resources?: {
    code_interpreter?: {
      file_ids: string[];
    };
    file_search?: {
      vector_store_ids: string[];
    };
  };
  metadata?: Record<string, any>;
  temperature?: number;
  top_p?: number;
  response_format?: 'auto' | { type: 'text' | 'json_object' };
}

export interface ListAssistantsRequest {
  limit?: number;
  order?: 'asc' | 'desc';
  after?: string;
  before?: string;
}

export interface ListAssistantsResponse {
  object: 'list';
  data: Assistant[];
  first_id?: string;
  last_id?: string;
  has_more: boolean;
}

// Thread types
export interface Thread {
  id: string;
  object: 'thread';
  created_at: number;
  tool_resources?: {
    code_interpreter?: {
      file_ids: string[];
    };
    file_search?: {
      vector_store_ids: string[];
    };
  };
  metadata: Record<string, any>;
}

export interface CreateThreadRequest {
  messages?: Array<{
    role: 'user' | 'assistant';
    content: string | Array<{
      type: 'text' | 'image_url' | 'image_file';
      text?: { value: string; annotations?: any[] };
      image_url?: { url: string; detail?: 'auto' | 'low' | 'high' };
      image_file?: { file_id: string; detail?: 'auto' | 'low' | 'high' };
    }>;
    attachments?: Array<{
      file_id: string;
      tools: Array<{ type: 'code_interpreter' | 'file_search' }>;
    }>;
    metadata?: Record<string, any>;
  }>;
  tool_resources?: {
    code_interpreter?: {
      file_ids: string[];
    };
    file_search?: {
      vector_store_ids: string[];
    };
  };
  metadata?: Record<string, any>;
}

export interface UpdateThreadRequest {
  tool_resources?: {
    code_interpreter?: {
      file_ids: string[];
    };
    file_search?: {
      vector_store_ids: string[];
    };
  };
  metadata?: Record<string, any>;
}

// Message types
export interface Message {
  id: string;
  object: 'thread.message';
  created_at: number;
  thread_id: string;
  status: 'in_progress' | 'incomplete' | 'completed';
  incomplete_details?: {
    reason: 'content_filter' | 'max_tokens' | 'run_cancelled' | 'run_expired' | 'run_failed';
  };
  completed_at?: number;
  incomplete_at?: number;
  role: 'user' | 'assistant';
  content: Array<{
    type: 'text' | 'image_url' | 'image_file';
    text?: {
      value: string;
      annotations: Array<{
        type: 'file_citation' | 'file_path';
        text: string;
        start_index: number;
        end_index: number;
        file_citation?: {
          file_id: string;
          quote?: string;
        };
        file_path?: {
          file_id: string;
        };
      }>;
    };
    image_url?: { url: string; detail?: 'auto' | 'low' | 'high' };
    image_file?: { file_id: string; detail?: 'auto' | 'low' | 'high' };
  }>;
  assistant_id?: string;
  run_id?: string;
  attachments?: Array<{
    file_id: string;
    tools: Array<{ type: 'code_interpreter' | 'file_search' }>;
  }>;
  metadata: Record<string, any>;
}

export interface CreateMessageRequest {
  role: 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'image_url' | 'image_file';
    text?: { value: string };
    image_url?: { url: string; detail?: 'auto' | 'low' | 'high' };
    image_file?: { file_id: string; detail?: 'auto' | 'low' | 'high' };
  }>;
  attachments?: Array<{
    file_id: string;
    tools: Array<{ type: 'code_interpreter' | 'file_search' }>;
  }>;
  metadata?: Record<string, any>;
}

export interface UpdateMessageRequest {
  metadata?: Record<string, any>;
}

export interface ListMessagesRequest {
  limit?: number;
  order?: 'asc' | 'desc';
  after?: string;
  before?: string;
  run_id?: string;
}

export interface ListMessagesResponse {
  object: 'list';
  data: Message[];
  first_id?: string;
  last_id?: string;
  has_more: boolean;
}

// Run types
export interface Run {
  id: string;
  object: 'thread.run';
  created_at: number;
  thread_id: string;
  assistant_id: string;
  status: 'queued' | 'in_progress' | 'requires_action' | 'cancelling' | 'cancelled' | 'failed' | 'completed' | 'incomplete' | 'expired';
  required_action?: {
    type: 'submit_tool_outputs';
    submit_tool_outputs: {
      tool_calls: Array<{
        id: string;
        type: 'function';
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
  };
  last_error?: {
    code: 'server_error' | 'rate_limit_exceeded' | 'invalid_prompt';
    message: string;
  };
  expires_at?: number;
  started_at?: number;
  cancelled_at?: number;
  failed_at?: number;
  completed_at?: number;
  incomplete_details?: {
    reason: 'max_completion_tokens' | 'max_prompt_tokens';
  };
  model: string;
  instructions: string;
  tools: Array<{
    type: 'code_interpreter' | 'file_search' | 'function';
    function?: {
      name: string;
      description?: string;
      parameters?: Record<string, any>;
    };
  }>;
  metadata: Record<string, any>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  temperature?: number;
  top_p?: number;
  max_prompt_tokens?: number;
  max_completion_tokens?: number;
  truncation_strategy?: {
    type: 'auto' | 'last_messages';
    last_messages?: number;
  };
  tool_choice?: 'none' | 'auto' | 'required' | { type: 'function'; function: { name: string } };
  parallel_tool_calls?: boolean;
  response_format?: 'auto' | { type: 'text' | 'json_object' };
}

export interface CreateRunRequest {
  assistant_id: string;
  model?: string;
  instructions?: string;
  additional_instructions?: string;
  additional_messages?: Array<{
    role: 'user' | 'assistant';
    content: string | Array<{
      type: 'text' | 'image_url' | 'image_file';
      text?: { value: string };
      image_url?: { url: string; detail?: 'auto' | 'low' | 'high' };
      image_file?: { file_id: string; detail?: 'auto' | 'low' | 'high' };
    }>;
    attachments?: Array<{
      file_id: string;
      tools: Array<{ type: 'code_interpreter' | 'file_search' }>;
    }>;
    metadata?: Record<string, any>;
  }>;
  tools?: Array<{
    type: 'code_interpreter' | 'file_search' | 'function';
    function?: {
      name: string;
      description?: string;
      parameters?: Record<string, any>;
    };
  }>;
  metadata?: Record<string, any>;
  temperature?: number;
  top_p?: number;
  max_prompt_tokens?: number;
  max_completion_tokens?: number;
  truncation_strategy?: {
    type: 'auto' | 'last_messages';
    last_messages?: number;
  };
  tool_choice?: 'none' | 'auto' | 'required' | { type: 'function'; function: { name: string } };
  parallel_tool_calls?: boolean;
  response_format?: 'auto' | { type: 'text' | 'json_object' };
}

export interface UpdateRunRequest {
  metadata?: Record<string, any>;
}

export interface ListRunsRequest {
  limit?: number;
  order?: 'asc' | 'desc';
  after?: string;
  before?: string;
}

export interface ListRunsResponse {
  object: 'list';
  data: Run[];
  first_id?: string;
  last_id?: string;
  has_more: boolean;
}

export interface SubmitToolOutputsRequest {
  tool_outputs: Array<{
    tool_call_id: string;
    output: string;
  }>;
  stream?: boolean;
}

// Run Step types
export interface RunStep {
  id: string;
  object: 'thread.run.step';
  created_at: number;
  assistant_id: string;
  thread_id: string;
  run_id: string;
  type: 'message_creation' | 'tool_calls';
  status: 'in_progress' | 'cancelled' | 'failed' | 'completed' | 'expired';
  step_details: {
    type: 'message_creation' | 'tool_calls';
    message_creation?: {
      message_id: string;
    };
    tool_calls?: Array<{
      id: string;
      type: 'code_interpreter' | 'file_search' | 'function';
      code_interpreter?: {
        input: string;
        outputs: Array<{
          type: 'logs' | 'image';
          logs?: string;
          image?: {
            file_id: string;
          };
        }>;
      };
      file_search?: {
        ranking_options?: {
          ranker: 'auto' | 'default_2024_08_21';
          score_threshold: number;
        };
        results?: Array<{
          file_id: string;
          file_name: string;
          score: number;
          content: Array<{
            type: 'text';
            text: string;
          }>;
        }>;
      };
      function?: {
        name: string;
        arguments: string;
        output?: string;
      };
    }>;
  };
  last_error?: {
    code: 'server_error' | 'rate_limit_exceeded';
    message: string;
  };
  expired_at?: number;
  cancelled_at?: number;
  failed_at?: number;
  completed_at?: number;
  metadata: Record<string, any>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ListRunStepsRequest {
  limit?: number;
  order?: 'asc' | 'desc';
  after?: string;
  before?: string;
  include?: string[];
}

export interface ListRunStepsResponse {
  object: 'list';
  data: RunStep[];
  first_id?: string;
  last_id?: string;
  has_more: boolean;
}

// Error types
export class MCPError extends Error {
  constructor(
    public code: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

// Enhanced error creation helpers for JSON-RPC 2.0 compliance
export function createEnhancedError(
  legacyCode: number,
  message: string,
  additionalData?: any
): MCPError {
  const mapping = ErrorCodeMapping[legacyCode as keyof typeof ErrorCodeMapping];
  
  if (mapping) {
    // Use standard JSON-RPC code with enhanced data
    const enhancedData = {
      originalCode: legacyCode,
      category: mapping.category,
      documentation: mapping.documentation,
      ...additionalData
    };
    
    return new MCPError(mapping.standardCode, message, enhancedData);
  }
  
  // Fallback for unmapped codes
  return new MCPError(legacyCode, message, additionalData);
}

// Helper to create standard JSON-RPC error responses
export function createStandardErrorResponse(
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

// Helper to format OpenAI API errors with enhanced data
export function formatOpenAIError(
  httpStatus: number,
  openaiError: any,
  context?: string
): MCPError {
  let legacyCode: number;
  let message: string;
  
  switch (httpStatus) {
    case 401:
      legacyCode = LegacyErrorCodes.UNAUTHORIZED;
      message = 'Authentication failed. Please check your API key.';
      break;
    case 403:
      legacyCode = LegacyErrorCodes.FORBIDDEN;
      message = 'Access forbidden. Please check your permissions.';
      break;
    case 404:
      legacyCode = LegacyErrorCodes.NOT_FOUND;
      message = 'Resource not found. Please check the ID and try again.';
      break;
    case 429:
      legacyCode = LegacyErrorCodes.RATE_LIMITED;
      message = 'Rate limit exceeded. Please wait and try again.';
      break;
    default:
      return new MCPError(
        ErrorCodes.INTERNAL_ERROR,
        openaiError?.error?.message || `HTTP ${httpStatus}: Request failed`,
        {
          httpStatus,
          openaiError,
          context
        }
      );
  }
  
  return createEnhancedError(legacyCode, message, {
    httpStatus,
    openaiError,
    context,
    retryAfter: httpStatus === 429 ? '60s' : undefined
  });
}

// JSON-RPC 2.0 Standard Error Codes
export const ErrorCodes = {
  // Standard JSON-RPC 2.0 error codes
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  
  // Legacy custom codes mapped to standard codes for backward compatibility
  // These now map to standard JSON-RPC codes with enhanced info in error.data
  UNAUTHORIZED: -32603,    // Maps to Internal Error (was -32001)
  FORBIDDEN: -32603,       // Maps to Internal Error (was -32002)
  NOT_FOUND: -32602,       // Maps to Invalid Params (was -32003)
  RATE_LIMITED: -32602,    // Maps to Invalid Params (was -32004)
} as const;

// Legacy error codes for backward compatibility and enhanced error data
export const LegacyErrorCodes = {
  UNAUTHORIZED: -32001,
  FORBIDDEN: -32002,
  NOT_FOUND: -32003,
  RATE_LIMITED: -32004,
} as const;

// Error code mapping for enhanced error data
export const ErrorCodeMapping = {
  [LegacyErrorCodes.UNAUTHORIZED]: {
    standardCode: ErrorCodes.UNAUTHORIZED,
    category: 'authentication',
    documentation: 'https://docs.openai.com/api-reference/authentication'
  },
  [LegacyErrorCodes.FORBIDDEN]: {
    standardCode: ErrorCodes.FORBIDDEN,
    category: 'authorization',
    documentation: 'https://docs.openai.com/api-reference/errors'
  },
  [LegacyErrorCodes.NOT_FOUND]: {
    standardCode: ErrorCodes.NOT_FOUND,
    category: 'resource',
    documentation: 'https://docs.openai.com/api-reference/assistants'
  },
  [LegacyErrorCodes.RATE_LIMITED]: {
    standardCode: ErrorCodes.RATE_LIMITED,
    category: 'rate_limiting',
    documentation: 'https://docs.openai.com/api-reference/rate-limits'
  },
} as const;

// MCP Completions types
export interface MCPCompletionRequest extends JsonRpcRequest {
  method: 'completion/complete';
  params: {
    ref: {
      type: 'ref/prompt' | 'ref/resource';
      name: string;
    };
    argument: {
      name: string;
      value: string;
    };
  };
}

export interface MCPCompletionItem {
  values: string[];
  total?: number;
  hasMore?: boolean;
}

export interface MCPCompletionResponse extends JsonRpcResponse {
  result: {
    completions: MCPCompletionItem[];
  };
}

// Response interfaces for tools
export interface ToolResponse {
  success: boolean;
  data?: any;
  error?: string;
}