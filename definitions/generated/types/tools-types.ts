/**
 * Generated Tools Types
 * 
 * This file is auto-generated from JSON tools definitions.
 * Do not edit manually - changes will be overwritten.
 * 
 * Generated at: 2025-07-31T05:43:46.938Z
 */

export interface AssistantCreateParams {
  /** The OpenAI model to use for the assistant (e.g., "gpt-4", "gpt-3.5-turbo", "gpt-4-turbo"). Choose gpt-4 for complex reasoning, gpt-3.5-turbo for faster responses, or gpt-4-turbo for balanced performance. */
  model: string;
  /** A descriptive name for the assistant (e.g., "Customer Support Bot", "Code Review Assistant", "Content Writer"). This helps identify the assistant's purpose. */
  name?: string;
  /** A brief description of what the assistant does and its intended use case (e.g., "Helps customers with product questions and troubleshooting"). */
  description?: string;
  /** System instructions that define the assistant's behavior, personality, and capabilities. Be specific about the assistant's role, tone, and how it should respond to users. */
  instructions?: string;
  /** Array of tools to enable for the assistant. Available tools: code_interpreter (for running Python code), file_search (for searching uploaded files), function (for custom API calls). */
  tools?: Record<string, any>[];
  /** Custom key-value pairs for storing additional information about the assistant (e.g., {"department": "support", "version": "1.0", "created_by": "admin"}). */
  metadata?: Record<string, any>;
}

export interface AssistantListParams {
  /** Maximum number of assistants to return in one request (1-100, default: 20). Use smaller values for quick previews, larger for comprehensive listings. */
  limit?: number;
  /** Sort order by creation date: "desc" for newest first (default), "asc" for oldest first. */
  order?: 'asc' | 'desc';
  /** Pagination cursor - assistant ID to start listing after (format: "asst_abc123..."). Use for getting the next page of results. */
  after?: string;
  /** Pagination cursor - assistant ID to end listing before (format: "asst_abc123..."). Use for getting the previous page of results. */
  before?: string;
}

export interface AssistantGetParams {
  /** The unique identifier of the assistant to retrieve (format: "asst_abc123..."). Get this from assistant-create response or assistant-list results. */
  assistant_id: string;
}

export interface AssistantUpdateParams {
  /** The unique identifier of the assistant to update (format: "asst_abc123..."). */
  assistant_id: string;
  /** The OpenAI model to use for the assistant (e.g., "gpt-4", "gpt-3.5-turbo", "gpt-4-turbo"). Leave unchanged if not specified. */
  model?: string;
  /** New name for the assistant. Leave unchanged if not specified. */
  name?: string;
  /** New description of what the assistant does. Leave unchanged if not specified. */
  description?: string;
  /** New system instructions that define the assistant's behavior. Leave unchanged if not specified. */
  instructions?: string;
  /** New array of tools to enable for the assistant. Replaces existing tools if specified. */
  tools?: Record<string, any>[];
  /** New metadata key-value pairs. Replaces existing metadata if specified. */
  metadata?: Record<string, any>;
}

export interface AssistantDeleteParams {
  /** The unique identifier of the assistant to delete (format: "asst_abc123..."). Double-check this ID as deletion is irreversible. */
  assistant_id: string;
}

export interface ThreadCreateParams {
  /** Optional array of initial messages to start the conversation. Each message should have role ("user" or "assistant") and content. */
  messages?: any[];
  /** Custom key-value pairs for organizing threads (e.g., {"customer_id": "12345", "session_type": "support", "priority": "high"}). */
  metadata?: Record<string, any>;
}

export interface ThreadGetParams {
  /** The unique identifier of the thread to retrieve (format: "thread_abc123..."). Get this from thread-create response or other thread operations. */
  thread_id: string;
}

export interface ThreadUpdateParams {
  /** The unique identifier of the thread to update (format: "thread_abc123..."). */
  thread_id: string;
  /** New metadata key-value pairs to replace existing metadata. Use for organizing threads (e.g., {"priority": "high", "department": "support", "status": "resolved"}). */
  metadata?: Record<string, any>;
}

export interface ThreadDeleteParams {
  /** The unique identifier of the thread to delete (format: "thread_abc123..."). Double-check this ID as deletion is irreversible and will remove all messages and runs. */
  thread_id: string;
}

export interface MessageCreateParams {
  /** The unique identifier of the thread to add the message to (format: "thread_abc123..."). */
  thread_id: string;
  /** The role of the message sender. Use "user" for human messages, "assistant" for AI responses. */
  role: 'user' | 'assistant';
  /** The text content of the message. This is what the assistant will see and respond to. */
  content: string;
  /** Optional metadata for the message (e.g., {"source": "web", "timestamp": "2025-01-31T02:37:00.000Z", "user_id": "12345"}). */
  metadata?: Record<string, any>;
}

export interface MessageListParams {
  /** The unique identifier of the thread to list messages from (format: "thread_abc123..."). */
  thread_id: string;
  /** Maximum number of messages to return in one request (1-100, default: 20). Use smaller values for quick previews, larger for comprehensive history. */
  limit?: number;
  /** Sort order by creation date: "desc" for newest first (default), "asc" for oldest first (chronological order). */
  order?: 'asc' | 'desc';
  /** Pagination cursor - message ID to start listing after (format: "msg_abc123..."). Use for getting the next page of results. */
  after?: string;
  /** Pagination cursor - message ID to end listing before (format: "msg_abc123..."). Use for getting the previous page of results. */
  before?: string;
  /** Filter messages by specific run ID (format: "run_abc123..."). Shows only messages from that particular assistant run. */
  run_id?: string;
}

export interface MessageGetParams {
  /** The unique identifier of the thread containing the message (format: "thread_abc123..."). */
  thread_id: string;
  /** The unique identifier of the message to retrieve (format: "msg_abc123..."). */
  message_id: string;
}

export interface MessageUpdateParams {
  /** The unique identifier of the thread containing the message (format: "thread_abc123..."). */
  thread_id: string;
  /** The unique identifier of the message to update (format: "msg_abc123..."). */
  message_id: string;
  /** New metadata key-value pairs to replace existing metadata (e.g., {"importance": "high", "category": "question"}). */
  metadata?: Record<string, any>;
}

export interface MessageDeleteParams {
  /** The unique identifier of the thread containing the message (format: "thread_abc123..."). */
  thread_id: string;
  /** The unique identifier of the message to delete (format: "msg_abc123..."). Double-check this ID as deletion is irreversible. */
  message_id: string;
}

export interface RunCreateParams {
  /** The unique identifier of the thread to run the assistant on (format: "thread_abc123..."). */
  thread_id: string;
  /** The unique identifier of the assistant to use for the run (format: "asst_abc123..."). */
  assistant_id: string;
  /** Override the model used by the assistant for this run (e.g., "gpt-4", "gpt-3.5-turbo"). Leave empty to use assistant's default model. */
  model?: string;
  /** Override the instructions of the assistant for this run. Use to provide run-specific context or modify behavior. */
  instructions?: string;
  /** Additional instructions to append to the assistant's existing instructions for this run. */
  additional_instructions?: string;
  /** Override the tools used by the assistant for this run. Replaces assistant's tools if specified. */
  tools?: Record<string, any>[];
  /** Custom metadata for the run (e.g., {"priority": "high", "source": "api", "user_id": "12345"}). */
  metadata?: Record<string, any>;
}

export interface RunListParams {
  /** The unique identifier of the thread to list runs from (format: "thread_abc123..."). */
  thread_id: string;
  /** Maximum number of runs to return in one request (1-100, default: 20). */
  limit?: number;
  /** Sort order by creation date: "desc" for newest first (default), "asc" for oldest first. */
  order?: 'asc' | 'desc';
  /** Pagination cursor - run ID to start listing after (format: "run_abc123..."). */
  after?: string;
  /** Pagination cursor - run ID to end listing before (format: "run_abc123..."). */
  before?: string;
}

export interface RunGetParams {
  /** The unique identifier of the thread containing the run (format: "thread_abc123..."). */
  thread_id: string;
  /** The unique identifier of the run to retrieve (format: "run_abc123..."). */
  run_id: string;
}

export interface RunUpdateParams {
  /** The unique identifier of the thread containing the run (format: "thread_abc123..."). */
  thread_id: string;
  /** The unique identifier of the run to update (format: "run_abc123..."). */
  run_id: string;
  /** New metadata key-value pairs to replace existing metadata (e.g., {"priority": "high", "category": "analysis"}). */
  metadata?: Record<string, any>;
}

export interface RunCancelParams {
  /** The unique identifier of the thread containing the run (format: "thread_abc123..."). */
  thread_id: string;
  /** The unique identifier of the run to cancel (format: "run_abc123..."). Only runs in 'in_progress' or 'requires_action' status can be cancelled. */
  run_id: string;
}

export interface RunSubmitToolOutputsParams {
  /** The unique identifier of the thread containing the run (format: "thread_abc123..."). */
  thread_id: string;
  /** The unique identifier of the run to submit tool outputs for (format: "run_abc123..."). Must be in 'requires_action' status. */
  run_id: string;
  /** Array of tool outputs to submit. Each output should correspond to a tool call made by the assistant. */
  tool_outputs: Record<string, any>[];
}

export interface RunStepListParams {
  /** The unique identifier of the thread containing the run (format: "thread_abc123..."). */
  thread_id: string;
  /** The unique identifier of the run to list steps from (format: "run_abc123..."). */
  run_id: string;
  /** Maximum number of steps to return in one request (1-100, default: 20). */
  limit?: number;
  /** Sort order by creation date: "desc" for newest first (default), "asc" for oldest first (chronological order). */
  order?: 'asc' | 'desc';
  /** Pagination cursor - step ID to start listing after (format: "step_abc123..."). */
  after?: string;
  /** Pagination cursor - step ID to end listing before (format: "step_abc123..."). */
  before?: string;
}

export interface RunStepGetParams {
  /** The unique identifier of the thread containing the run (format: "thread_abc123..."). */
  thread_id: string;
  /** The unique identifier of the run containing the step (format: "run_abc123..."). */
  run_id: string;
  /** The unique identifier of the step to retrieve (format: "step_abc123..."). */
  step_id: string;
}

// Union type of all tools types
export type ToolsTypes = AssistantCreateParams | AssistantListParams | AssistantGetParams | AssistantUpdateParams | AssistantDeleteParams | ThreadCreateParams | ThreadGetParams | ThreadUpdateParams | ThreadDeleteParams | MessageCreateParams | MessageListParams | MessageGetParams | MessageUpdateParams | MessageDeleteParams | RunCreateParams | RunListParams | RunGetParams | RunUpdateParams | RunCancelParams | RunSubmitToolOutputsParams | RunStepListParams | RunStepGetParams;

// tools name to type mapping
export interface ToolsTypesMap {
  'assistant-create': AssistantCreateParams;
  'assistant-list': AssistantListParams;
  'assistant-get': AssistantGetParams;
  'assistant-update': AssistantUpdateParams;
  'assistant-delete': AssistantDeleteParams;
  'thread-create': ThreadCreateParams;
  'thread-get': ThreadGetParams;
  'thread-update': ThreadUpdateParams;
  'thread-delete': ThreadDeleteParams;
  'message-create': MessageCreateParams;
  'message-list': MessageListParams;
  'message-get': MessageGetParams;
  'message-update': MessageUpdateParams;
  'message-delete': MessageDeleteParams;
  'run-create': RunCreateParams;
  'run-list': RunListParams;
  'run-get': RunGetParams;
  'run-update': RunUpdateParams;
  'run-cancel': RunCancelParams;
  'run-submit-tool-outputs': RunSubmitToolOutputsParams;
  'run-step-list': RunStepListParams;
  'run-step-get': RunStepGetParams;
}
