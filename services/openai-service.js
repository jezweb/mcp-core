/**
 * Shared OpenAI Service - Consolidated OpenAI Assistants API client
 *
 * This service handles all interactions with the OpenAI Assistants API,
 * providing comprehensive assistant, thread, message, and run management operations.
 * Used by both Cloudflare Workers and NPM package deployments.
 *
 * Consolidates 249 lines of duplicate service code.
 */
import { MCPError, ErrorCodes, formatOpenAIError, } from '../types/index.js';
export class OpenAIService {
    apiKey;
    baseUrl = 'https://api.openai.com/v1';
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    async makeRequest(endpoint, method = 'GET', body) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2',
        };
        const config = {
            method,
            headers,
        };
        if (body && (method === 'POST' || method === 'PUT')) {
            config.body = JSON.stringify(body);
        }
        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw formatOpenAIError(response.status, errorData, `${method} ${endpoint}`);
            }
            return await response.json();
        }
        catch (error) {
            if (error instanceof MCPError) {
                throw error;
            }
            throw new MCPError(ErrorCodes.INTERNAL_ERROR, `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { originalError: error });
        }
    }
    mapHttpStatusToErrorCode(status) {
        // Legacy method kept for backward compatibility
        // New code should use formatOpenAIError instead
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
    async createAssistant(request) {
        return this.makeRequest('/assistants', 'POST', request);
    }
    async listAssistants(request = {}) {
        const params = new URLSearchParams();
        if (request.limit)
            params.append('limit', request.limit.toString());
        if (request.order)
            params.append('order', request.order);
        if (request.after)
            params.append('after', request.after);
        if (request.before)
            params.append('before', request.before);
        const queryString = params.toString();
        const endpoint = queryString ? `/assistants?${queryString}` : '/assistants';
        return this.makeRequest(endpoint);
    }
    async getAssistant(assistantId) {
        return this.makeRequest(`/assistants/${assistantId}`);
    }
    async updateAssistant(assistantId, request) {
        return this.makeRequest(`/assistants/${assistantId}`, 'POST', request);
    }
    async deleteAssistant(assistantId) {
        return this.makeRequest(`/assistants/${assistantId}`, 'DELETE');
    }
    // Thread Management
    async createThread(request = {}) {
        return this.makeRequest('/threads', 'POST', request);
    }
    async getThread(threadId) {
        return this.makeRequest(`/threads/${threadId}`);
    }
    async updateThread(threadId, request) {
        return this.makeRequest(`/threads/${threadId}`, 'POST', request);
    }
    async deleteThread(threadId) {
        return this.makeRequest(`/threads/${threadId}`, 'DELETE');
    }
    // Message Management
    async createMessage(threadId, request) {
        return this.makeRequest(`/threads/${threadId}/messages`, 'POST', request);
    }
    async listMessages(threadId, request = {}) {
        const params = new URLSearchParams();
        if (request.limit)
            params.append('limit', request.limit.toString());
        if (request.order)
            params.append('order', request.order);
        if (request.after)
            params.append('after', request.after);
        if (request.before)
            params.append('before', request.before);
        if (request.run_id)
            params.append('run_id', request.run_id);
        const queryString = params.toString();
        const endpoint = queryString ? `/threads/${threadId}/messages?${queryString}` : `/threads/${threadId}/messages`;
        return this.makeRequest(endpoint);
    }
    async getMessage(threadId, messageId) {
        return this.makeRequest(`/threads/${threadId}/messages/${messageId}`);
    }
    async updateMessage(threadId, messageId, request) {
        return this.makeRequest(`/threads/${threadId}/messages/${messageId}`, 'POST', request);
    }
    async deleteMessage(threadId, messageId) {
        return this.makeRequest(`/threads/${threadId}/messages/${messageId}`, 'DELETE');
    }
    // Run Management
    async createRun(threadId, request) {
        return this.makeRequest(`/threads/${threadId}/runs`, 'POST', request);
    }
    async listRuns(threadId, request = {}) {
        const params = new URLSearchParams();
        if (request.limit)
            params.append('limit', request.limit.toString());
        if (request.order)
            params.append('order', request.order);
        if (request.after)
            params.append('after', request.after);
        if (request.before)
            params.append('before', request.before);
        const queryString = params.toString();
        const endpoint = queryString ? `/threads/${threadId}/runs?${queryString}` : `/threads/${threadId}/runs`;
        return this.makeRequest(endpoint);
    }
    async getRun(threadId, runId) {
        return this.makeRequest(`/threads/${threadId}/runs/${runId}`);
    }
    async updateRun(threadId, runId, request) {
        return this.makeRequest(`/threads/${threadId}/runs/${runId}`, 'POST', request);
    }
    async cancelRun(threadId, runId) {
        return this.makeRequest(`/threads/${threadId}/runs/${runId}/cancel`, 'POST');
    }
    async submitToolOutputs(threadId, runId, request) {
        return this.makeRequest(`/threads/${threadId}/runs/${runId}/submit_tool_outputs`, 'POST', request);
    }
    // Run Step Management
    async listRunSteps(threadId, runId, request = {}) {
        const params = new URLSearchParams();
        if (request.limit)
            params.append('limit', request.limit.toString());
        if (request.order)
            params.append('order', request.order);
        if (request.after)
            params.append('after', request.after);
        if (request.before)
            params.append('before', request.before);
        if (request.include) {
            request.include.forEach(include => params.append('include[]', include));
        }
        const queryString = params.toString();
        const endpoint = queryString ? `/threads/${threadId}/runs/${runId}/steps?${queryString}` : `/threads/${threadId}/runs/${runId}/steps`;
        return this.makeRequest(endpoint);
    }
    async getRunStep(threadId, runId, stepId) {
        return this.makeRequest(`/threads/${threadId}/runs/${runId}/steps/${stepId}`);
    }
    /**
     * Validate API key by making a simple request
     * This method was only in the npm-package version, now consolidated here
     */
    async validateApiKey() {
        try {
            await this.makeRequest('/models', 'GET', undefined);
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
