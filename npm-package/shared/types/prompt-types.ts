/**
 * Prompt Types - MCP Prompts Protocol Type Definitions
 * 
 * This module defines all types related to the MCP prompts protocol,
 * following the official MCP specification for prompts/list and prompts/get.
 */

import { JsonRpcRequest, JsonRpcResponse } from './core-types.js';

// MCP Prompts Protocol Types

/**
 * Prompt argument definition
 */
export interface PromptArgument {
  /** The name of the argument */
  name: string;
  /** Description of the argument */
  description?: string;
  /** Whether the argument is required */
  required?: boolean;
}

/**
 * Prompt definition
 */
export interface Prompt {
  /** Unique identifier for the prompt */
  name: string;
  /** Human-readable title for display */
  title?: string;
  /** Human-readable description */
  description?: string;
  /** List of arguments for customization */
  arguments?: PromptArgument[];
}

/**
 * Prompt message content types
 */
export interface PromptTextContent {
  type: 'text';
  text: string;
}

export interface PromptImageContent {
  type: 'image';
  data: string; // base64-encoded image data
  mimeType: string;
}

export interface PromptAudioContent {
  type: 'audio';
  data: string; // base64-encoded audio data
  mimeType: string;
}

export interface PromptResourceContent {
  type: 'resource';
  resource: {
    uri: string;
    name?: string;
    title?: string;
    mimeType?: string;
    text?: string;
    blob?: string;
  };
}

export type PromptContent = 
  | PromptTextContent 
  | PromptImageContent 
  | PromptAudioContent 
  | PromptResourceContent;

/**
 * Prompt message
 */
export interface PromptMessage {
  /** Role of the message sender */
  role: 'user' | 'assistant';
  /** Content of the message */
  content: PromptContent;
}

// MCP Prompts Request/Response Types

/**
 * Request to list available prompts
 */
export interface MCPPromptsListRequest extends JsonRpcRequest {
  method: 'prompts/list';
  params?: {
    cursor?: string;
  };
}

/**
 * Response for listing available prompts
 */
export interface MCPPromptsListResponse extends JsonRpcResponse {
  result: {
    prompts: Prompt[];
    nextCursor?: string;
  };
}

/**
 * Request to get a specific prompt
 */
export interface MCPPromptsGetRequest extends JsonRpcRequest {
  method: 'prompts/get';
  params: {
    name: string;
    arguments?: Record<string, string>;
  };
}

/**
 * Response for getting a specific prompt
 */
export interface MCPPromptsGetResponse extends JsonRpcResponse {
  result: {
    description?: string;
    messages: PromptMessage[];
  };
}

// Prompt Template Types for OpenAI Assistants

/**
 * Assistant creation prompt template
 */
export interface AssistantPromptTemplate {
  name: string;
  title: string;
  description: string;
  arguments: PromptArgument[];
  generateMessages: (args: Record<string, string>) => PromptMessage[];
}

/**
 * Thread management prompt template
 */
export interface ThreadPromptTemplate {
  name: string;
  title: string;
  description: string;
  arguments: PromptArgument[];
  generateMessages: (args: Record<string, string>) => PromptMessage[];
}

/**
 * Run configuration prompt template
 */
export interface RunPromptTemplate {
  name: string;
  title: string;
  description: string;
  arguments: PromptArgument[];
  generateMessages: (args: Record<string, string>) => PromptMessage[];
}

/**
 * Generic prompt template interface
 */
export interface PromptTemplate {
  name: string;
  title: string;
  description: string;
  arguments: PromptArgument[];
  generateMessages: (args: Record<string, string>) => PromptMessage[];
  category?: string;
  tags?: string[];
}

/**
 * Prompt registry for managing all available prompts
 */
export interface PromptRegistry {
  /** Get all available prompts */
  getPrompts(): Prompt[];
  /** Get a specific prompt by name */
  getPrompt(name: string): Prompt | null;
  /** Generate messages for a prompt with arguments */
  generatePromptMessages(name: string, args?: Record<string, string>): PromptMessage[];
  /** Register a new prompt template */
  registerPrompt(template: PromptTemplate): void;
  /** Check if a prompt exists */
  hasPrompt(name: string): boolean;
}

/**
 * Prompt validation result
 */
export interface PromptValidationResult {
  isValid: boolean;
  errors: string[];
  missingArguments: string[];
}

/**
 * Prompt execution context
 */
export interface PromptExecutionContext {
  promptName: string;
  arguments: Record<string, string>;
  requestId: string | number | null;
}