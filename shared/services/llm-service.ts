/**
 * Generic LLM Service Interface - Provider-agnostic abstraction layer
 * 
 * This module defines the core interfaces and types for the generic LLM provider system.
 * It abstracts away provider-specific details (OpenAI, Anthropic, etc.) to enable
 * a unified, extensible architecture for multiple LLM providers.
 * 
 * Key Features:
 * - Provider-agnostic interface design
 * - Extensible capability system
 * - Generic request/response types
 * - Type-safe provider implementations
 * - Future-ready for multiple LLM providers
 */

import {
  MCPError,
  ErrorCodes,
} from '../types/index.js';

/**
 * Generic LLM Provider Capabilities
 * Defines what features a provider supports
 */
export interface LLMCapabilities {
  /** Provider supports assistant management */
  assistants: boolean;
  /** Provider supports conversation threads */
  threads: boolean;
  /** Provider supports message management */
  messages: boolean;
  /** Provider supports run execution */
  runs: boolean;
  /** Provider supports run step inspection */
  runSteps: boolean;
  /** Provider supports file attachments */
  fileAttachments?: boolean;
  /** Provider supports function calling */
  functionCalling?: boolean;
  /** Provider supports code interpretation */
  codeInterpreter?: boolean;
  /** Provider supports file search */
  fileSearch?: boolean;
  /** Provider supports streaming responses */
  streaming?: boolean;
  /** Provider supports custom models */
  customModels?: boolean;
  /** Maximum context length supported */
  maxContextLength?: number;
  /** Supported model names */
  supportedModels?: string[];
}

/**
 * Generic LLM Provider Metadata
 * Information about the provider itself
 */
export interface LLMProviderMetadata {
  /** Provider name (e.g., 'openai', 'anthropic', 'google') */
  name: string;
  /** Provider display name */
  displayName: string;
  /** Provider version */
  version: string;
  /** Provider description */
  description: string;
  /** Provider capabilities */
  capabilities: LLMCapabilities;
  /** Provider configuration schema */
  configSchema?: Record<string, any>;
  /** Provider documentation URL */
  documentationUrl?: string;
}

/**
 * Generic Assistant Interface
 * Provider-agnostic assistant representation
 */
export interface GenericAssistant {
  id: string;
  name: string | null;
  description: string | null;
  model: string;
  instructions: string | null;
  tools: GenericTool[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
  /** Provider-specific data (preserved for compatibility) */
  providerData?: any;
}

/**
 * Generic Tool Interface
 * Provider-agnostic tool representation
 */
export interface GenericTool {
  type: 'code_interpreter' | 'file_search' | 'function' | string;
  function?: {
    name: string;
    description?: string;
    parameters?: Record<string, any>;
  };
  /** Provider-specific tool data */
  providerData?: any;
}

/**
 * Generic Thread Interface
 * Provider-agnostic conversation thread representation
 */
export interface GenericThread {
  id: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
  /** Provider-specific data */
  providerData?: any;
}

/**
 * Generic Message Interface
 * Provider-agnostic message representation
 */
export interface GenericMessage {
  id: string;
  threadId: string;
  role: 'user' | 'assistant' | 'system';
  content: GenericMessageContent[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
  /** Provider-specific data */
  providerData?: any;
}

/**
 * Generic Message Content
 * Provider-agnostic message content representation
 */
export interface GenericMessageContent {
  type: 'text' | 'image' | 'file' | string;
  text?: string;
  imageUrl?: string;
  fileId?: string;
  /** Provider-specific content data */
  providerData?: any;
}

/**
 * Generic Run Interface
 * Provider-agnostic run execution representation
 */
export interface GenericRun {
  id: string;
  threadId: string;
  assistantId: string;
  status: 'queued' | 'in_progress' | 'requires_action' | 'cancelling' | 'cancelled' | 'failed' | 'completed' | 'incomplete' | 'expired';
  model: string;
  instructions: string;
  tools: GenericTool[];
  metadata: Record<string, any>;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  cancelledAt?: Date;
  expiresAt?: Date;
  lastError?: {
    code: string;
    message: string;
  };
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Provider-specific data */
  providerData?: any;
}

/**
 * Generic Run Step Interface
 * Provider-agnostic run step representation
 */
export interface GenericRunStep {
  id: string;
  runId: string;
  threadId: string;
  assistantId: string;
  type: 'message_creation' | 'tool_calls' | string;
  status: 'in_progress' | 'cancelled' | 'failed' | 'completed' | 'expired';
  stepDetails: any; // Provider-specific step details
  createdAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  cancelledAt?: Date;
  expiredAt?: Date;
  lastError?: {
    code: string;
    message: string;
  };
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata: Record<string, any>;
  /** Provider-specific data */
  providerData?: any;
}

/**
 * Generic Request Types
 */
export interface GenericCreateAssistantRequest {
  model: string;
  name?: string;
  description?: string;
  instructions?: string;
  tools?: GenericTool[];
  tool_resources?: {
    file_search?: {
      vector_store_ids: string[];
    };
    code_interpreter?: {
      file_ids: string[];
    };
  };
  metadata?: Record<string, any>;
  /** Provider-specific options */
  providerOptions?: any;
}

export interface GenericUpdateAssistantRequest {
  model?: string;
  name?: string;
  description?: string;
  instructions?: string;
  tools?: GenericTool[];
  tool_resources?: {
    file_search?: {
      vector_store_ids: string[];
    };
    code_interpreter?: {
      file_ids: string[];
    };
  };
  metadata?: Record<string, any>;
  /** Provider-specific options */
  providerOptions?: any;
}

export interface GenericListRequest {
  limit?: number;
  order?: 'asc' | 'desc';
  after?: string;
  before?: string;
}

export interface GenericListResponse<T> {
  data: T[];
  hasMore: boolean;
  firstId?: string;
  lastId?: string;
}

export interface GenericCreateThreadRequest {
  messages?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string | GenericMessageContent[];
    metadata?: Record<string, any>;
  }>;
  metadata?: Record<string, any>;
  /** Provider-specific options */
  providerOptions?: any;
}

export interface GenericUpdateThreadRequest {
  metadata?: Record<string, any>;
  /** Provider-specific options */
  providerOptions?: any;
}

export interface GenericCreateMessageRequest {
  role: 'user' | 'assistant' | 'system';
  content: string | GenericMessageContent[];
  metadata?: Record<string, any>;
  /** Provider-specific options */
  providerOptions?: any;
}

export interface GenericUpdateMessageRequest {
  metadata?: Record<string, any>;
  /** Provider-specific options */
  providerOptions?: any;
}

export interface GenericCreateRunRequest {
  assistantId: string;
  model?: string;
  instructions?: string;
  additionalInstructions?: string;
  tools?: GenericTool[];
  metadata?: Record<string, any>;
  /** Provider-specific options */
  providerOptions?: any;
}

export interface GenericUpdateRunRequest {
  metadata?: Record<string, any>;
  /** Provider-specific options */
  providerOptions?: any;
}

export interface GenericSubmitToolOutputsRequest {
  toolOutputs: Array<{
    toolCallId: string;
    output: string;
  }>;
  /** Provider-specific options */
  providerOptions?: any;
}

/**
 * Core LLM Provider Interface
 * All LLM providers must implement this interface
 */
export interface LLMProvider {
  /**
   * Provider metadata and capabilities
   */
  readonly metadata: LLMProviderMetadata;

  /**
   * Initialize the provider with configuration
   */
  initialize(config: Record<string, any>): Promise<void>;

  /**
   * Validate provider configuration and connectivity
   */
  validateConnection(): Promise<boolean>;

  /**
   * Assistant Management Methods
   */
  createAssistant(request: GenericCreateAssistantRequest): Promise<GenericAssistant>;
  listAssistants(request?: GenericListRequest): Promise<GenericListResponse<GenericAssistant>>;
  getAssistant(assistantId: string): Promise<GenericAssistant>;
  updateAssistant(assistantId: string, request: GenericUpdateAssistantRequest): Promise<GenericAssistant>;
  deleteAssistant(assistantId: string): Promise<{ id: string; deleted: boolean }>;

  /**
   * Thread Management Methods
   */
  createThread(request?: GenericCreateThreadRequest): Promise<GenericThread>;
  getThread(threadId: string): Promise<GenericThread>;
  updateThread(threadId: string, request: GenericUpdateThreadRequest): Promise<GenericThread>;
  deleteThread(threadId: string): Promise<{ id: string; deleted: boolean }>;

  /**
   * Message Management Methods
   */
  createMessage(threadId: string, request: GenericCreateMessageRequest): Promise<GenericMessage>;
  listMessages(threadId: string, request?: GenericListRequest): Promise<GenericListResponse<GenericMessage>>;
  getMessage(threadId: string, messageId: string): Promise<GenericMessage>;
  updateMessage(threadId: string, messageId: string, request: GenericUpdateMessageRequest): Promise<GenericMessage>;
  deleteMessage(threadId: string, messageId: string): Promise<{ id: string; deleted: boolean }>;

  /**
   * Run Management Methods
   */
  createRun(threadId: string, request: GenericCreateRunRequest): Promise<GenericRun>;
  listRuns(threadId: string, request?: GenericListRequest): Promise<GenericListResponse<GenericRun>>;
  getRun(threadId: string, runId: string): Promise<GenericRun>;
  updateRun(threadId: string, runId: string, request: GenericUpdateRunRequest): Promise<GenericRun>;
  cancelRun(threadId: string, runId: string): Promise<GenericRun>;
  submitToolOutputs(threadId: string, runId: string, request: GenericSubmitToolOutputsRequest): Promise<GenericRun>;

  /**
   * Run Step Management Methods
   */
  listRunSteps(threadId: string, runId: string, request?: GenericListRequest): Promise<GenericListResponse<GenericRunStep>>;
  getRunStep(threadId: string, runId: string, stepId: string): Promise<GenericRunStep>;

  /**
   * Provider-specific method for handling unsupported operations
   * This allows providers to gracefully handle operations they don't support
   */
  handleUnsupportedOperation(operation: string, ...args: any[]): Promise<any>;
}

/**
 * Provider Factory Interface
 * Used to create provider instances
 */
export interface LLMProviderFactory {
  /**
   * Create a new provider instance
   */
  create(config: Record<string, any>): Promise<LLMProvider>;

  /**
   * Get provider metadata without creating an instance
   */
  getMetadata(): LLMProviderMetadata;

  /**
   * Validate provider configuration
   */
  validateConfig(config: Record<string, any>): boolean;
}

/**
 * Provider Configuration Interface
 * Standard configuration structure for all providers
 */
export interface LLMProviderConfig {
  /** Provider name */
  provider: string;
  /** Provider-specific configuration */
  config: Record<string, any>;
  /** Whether this provider is enabled */
  enabled?: boolean;
  /** Provider priority (higher = preferred) */
  priority?: number;
  /** Provider-specific metadata */
  metadata?: Record<string, any>;
}

/**
 * Provider Error Class
 * Standardized error handling for providers
 */
export class LLMProviderError extends MCPError {
  constructor(
    public providerName: string,
    code: number,
    message: string,
    public originalError?: any,
    data?: any
  ) {
    super(code, `[${providerName}] ${message}`, {
      provider: providerName,
      originalError,
      ...data
    });
    this.name = 'LLMProviderError';
  }
}

/**
 * Helper function to create provider errors
 */
export function createProviderError(
  providerName: string,
  message: string,
  originalError?: any,
  code: number = ErrorCodes.INTERNAL_ERROR
): LLMProviderError {
  return new LLMProviderError(providerName, code, message, originalError);
}

/**
 * Provider Status Interface
 * Runtime status information for providers
 */
export interface LLMProviderStatus {
  /** Provider name */
  name: string;
  /** Whether provider is available */
  available: boolean;
  /** Whether provider is healthy */
  healthy: boolean;
  /** Last health check timestamp */
  lastHealthCheck?: Date;
  /** Current error if any */
  error?: string;
  /** Provider-specific status data */
  statusData?: Record<string, any>;
}