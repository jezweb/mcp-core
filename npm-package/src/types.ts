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
  params?: {};
}

export interface MCPTool {
  name: string;
  description: string;
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

// MCP Resources types (legacy compatibility)
export interface Resource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

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

// Common error codes
export const ErrorCodes = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  UNAUTHORIZED: -32001,
  FORBIDDEN: -32002,
  NOT_FOUND: -32003,
  RATE_LIMITED: -32004,
} as const;

// Response interfaces for tools
export interface ToolResponse {
  success: boolean;
  data?: any;
  error?: string;
}