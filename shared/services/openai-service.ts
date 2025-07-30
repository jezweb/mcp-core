/**
 * Shared OpenAI Service - Consolidated OpenAI Assistants API client
 * 
 * This service handles all interactions with the OpenAI Assistants API,
 * providing comprehensive assistant, thread, message, and run management operations.
 * Used by both Cloudflare Workers and NPM package deployments.
 * 
 * Consolidates 249 lines of duplicate service code.
 */

import {
  Assistant,
  CreateAssistantRequest,
  UpdateAssistantRequest,
  ListAssistantsRequest,
  ListAssistantsResponse,
  Thread,
  CreateThreadRequest,
  UpdateThreadRequest,
  Message,
  CreateMessageRequest,
  UpdateMessageRequest,
  ListMessagesRequest,
  ListMessagesResponse,
  Run,
  CreateRunRequest,
  UpdateRunRequest,
  ListRunsRequest,
  ListRunsResponse,
  SubmitToolOutputsRequest,
  RunStep,
  ListRunStepsRequest,
  ListRunStepsResponse,
  MCPError,
  ErrorCodes,
} from '../types/index.js';

export class OpenAIService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2',
    };

    const config: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        throw new MCPError(
          this.mapHttpStatusToErrorCode(response.status),
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof MCPError) {
        throw error;
      }
      throw new MCPError(
        ErrorCodes.INTERNAL_ERROR,
        `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { originalError: error }
      );
    }
  }

  private mapHttpStatusToErrorCode(status: number): number {
    switch (status) {
      case 401:
        return ErrorCodes.UNAUTHORIZED;
      case 403:
        return ErrorCodes.FORBIDDEN;
      case 404:
        return ErrorCodes.NOT_FOUND;
      case 429:
        return ErrorCodes.RATE_LIMITED;
      default:
        return ErrorCodes.INTERNAL_ERROR;
    }
  }

  // Assistant Management
  async createAssistant(request: CreateAssistantRequest): Promise<Assistant> {
    return this.makeRequest('/assistants', 'POST', request);
  }

  async listAssistants(request: ListAssistantsRequest = {}): Promise<ListAssistantsResponse> {
    const params = new URLSearchParams();
    if (request.limit) params.append('limit', request.limit.toString());
    if (request.order) params.append('order', request.order);
    if (request.after) params.append('after', request.after);
    if (request.before) params.append('before', request.before);

    const queryString = params.toString();
    const endpoint = queryString ? `/assistants?${queryString}` : '/assistants';
    
    return this.makeRequest(endpoint);
  }

  async getAssistant(assistantId: string): Promise<Assistant> {
    return this.makeRequest(`/assistants/${assistantId}`);
  }

  async updateAssistant(assistantId: string, request: UpdateAssistantRequest): Promise<Assistant> {
    return this.makeRequest(`/assistants/${assistantId}`, 'POST', request);
  }

  async deleteAssistant(assistantId: string): Promise<{ id: string; object: string; deleted: boolean }> {
    return this.makeRequest(`/assistants/${assistantId}`, 'DELETE');
  }

  // Thread Management
  async createThread(request: CreateThreadRequest = {}): Promise<Thread> {
    return this.makeRequest('/threads', 'POST', request);
  }

  async getThread(threadId: string): Promise<Thread> {
    return this.makeRequest(`/threads/${threadId}`);
  }

  async updateThread(threadId: string, request: UpdateThreadRequest): Promise<Thread> {
    return this.makeRequest(`/threads/${threadId}`, 'POST', request);
  }

  async deleteThread(threadId: string): Promise<{ id: string; object: string; deleted: boolean }> {
    return this.makeRequest(`/threads/${threadId}`, 'DELETE');
  }

  // Message Management
  async createMessage(threadId: string, request: CreateMessageRequest): Promise<Message> {
    return this.makeRequest(`/threads/${threadId}/messages`, 'POST', request);
  }

  async listMessages(threadId: string, request: ListMessagesRequest = {}): Promise<ListMessagesResponse> {
    const params = new URLSearchParams();
    if (request.limit) params.append('limit', request.limit.toString());
    if (request.order) params.append('order', request.order);
    if (request.after) params.append('after', request.after);
    if (request.before) params.append('before', request.before);
    if (request.run_id) params.append('run_id', request.run_id);

    const queryString = params.toString();
    const endpoint = queryString ? `/threads/${threadId}/messages?${queryString}` : `/threads/${threadId}/messages`;
    
    return this.makeRequest(endpoint);
  }

  async getMessage(threadId: string, messageId: string): Promise<Message> {
    return this.makeRequest(`/threads/${threadId}/messages/${messageId}`);
  }

  async updateMessage(threadId: string, messageId: string, request: UpdateMessageRequest): Promise<Message> {
    return this.makeRequest(`/threads/${threadId}/messages/${messageId}`, 'POST', request);
  }

  async deleteMessage(threadId: string, messageId: string): Promise<{ id: string; object: string; deleted: boolean }> {
    return this.makeRequest(`/threads/${threadId}/messages/${messageId}`, 'DELETE');
  }

  // Run Management
  async createRun(threadId: string, request: CreateRunRequest): Promise<Run> {
    return this.makeRequest(`/threads/${threadId}/runs`, 'POST', request);
  }

  async listRuns(threadId: string, request: ListRunsRequest = {}): Promise<ListRunsResponse> {
    const params = new URLSearchParams();
    if (request.limit) params.append('limit', request.limit.toString());
    if (request.order) params.append('order', request.order);
    if (request.after) params.append('after', request.after);
    if (request.before) params.append('before', request.before);

    const queryString = params.toString();
    const endpoint = queryString ? `/threads/${threadId}/runs?${queryString}` : `/threads/${threadId}/runs`;
    
    return this.makeRequest(endpoint);
  }

  async getRun(threadId: string, runId: string): Promise<Run> {
    return this.makeRequest(`/threads/${threadId}/runs/${runId}`);
  }

  async updateRun(threadId: string, runId: string, request: UpdateRunRequest): Promise<Run> {
    return this.makeRequest(`/threads/${threadId}/runs/${runId}`, 'POST', request);
  }

  async cancelRun(threadId: string, runId: string): Promise<Run> {
    return this.makeRequest(`/threads/${threadId}/runs/${runId}/cancel`, 'POST');
  }

  async submitToolOutputs(threadId: string, runId: string, request: SubmitToolOutputsRequest): Promise<Run> {
    return this.makeRequest(`/threads/${threadId}/runs/${runId}/submit_tool_outputs`, 'POST', request);
  }

  // Run Step Management
  async listRunSteps(threadId: string, runId: string, request: ListRunStepsRequest = {}): Promise<ListRunStepsResponse> {
    const params = new URLSearchParams();
    if (request.limit) params.append('limit', request.limit.toString());
    if (request.order) params.append('order', request.order);
    if (request.after) params.append('after', request.after);
    if (request.before) params.append('before', request.before);
    if (request.include) {
      request.include.forEach(include => params.append('include[]', include));
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/threads/${threadId}/runs/${runId}/steps?${queryString}` : `/threads/${threadId}/runs/${runId}/steps`;
    
    return this.makeRequest(endpoint);
  }

  async getRunStep(threadId: string, runId: string, stepId: string): Promise<RunStep> {
    return this.makeRequest(`/threads/${threadId}/runs/${runId}/steps/${stepId}`);
  }

  /**
   * Validate API key by making a simple request
   * This method was only in the npm-package version, now consolidated here
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.makeRequest('/models', 'GET', undefined);
      return true;
    } catch (error) {
      return false;
    }
  }
}