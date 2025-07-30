/**
 * OpenAI Service for Roo-Compatible MCP Server
 * 
 * This service handles all interactions with the OpenAI Assistants API,
 * providing comprehensive assistant, thread, message, and run management operations
 * with proper error handling and Roo compatibility.
 */

const https = require('https');
const { URL } = require('url');

class MCPError extends Error {
  constructor(code, message, data = null) {
    super(message);
    this.name = 'MCPError';
    this.code = code;
    this.data = data;
  }
}

const ErrorCodes = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  UNAUTHORIZED: -32001,
  FORBIDDEN: -32002,
  NOT_FOUND: -32003,
  RATE_LIMITED: -32004,
};

class OpenAIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.openai.com/v1';
  }

  // Assistant Management
  async createAssistant(request) {
    return await this.makeRequest('POST', '/assistants', request);
  }

  async listAssistants(request = {}) {
    const params = new URLSearchParams();
    if (request.limit) params.append('limit', request.limit.toString());
    if (request.order) params.append('order', request.order);
    if (request.after) params.append('after', request.after);
    if (request.before) params.append('before', request.before);

    const queryString = params.toString();
    const endpoint = queryString ? `/assistants?${queryString}` : '/assistants';
    
    return await this.makeRequest('GET', endpoint);
  }

  async getAssistant(assistantId) {
    return await this.makeRequest('GET', `/assistants/${assistantId}`);
  }

  async updateAssistant(assistantId, request) {
    return await this.makeRequest('POST', `/assistants/${assistantId}`, request);
  }

  async deleteAssistant(assistantId) {
    return await this.makeRequest('DELETE', `/assistants/${assistantId}`);
  }

  // Thread Management
  async createThread(request = {}) {
    return await this.makeRequest('POST', '/threads', request);
  }

  async getThread(threadId) {
    return await this.makeRequest('GET', `/threads/${threadId}`);
  }

  async updateThread(threadId, request) {
    return await this.makeRequest('POST', `/threads/${threadId}`, request);
  }

  async deleteThread(threadId) {
    return await this.makeRequest('DELETE', `/threads/${threadId}`);
  }

  // Message Management
  async createMessage(threadId, request) {
    return await this.makeRequest('POST', `/threads/${threadId}/messages`, request);
  }

  async listMessages(threadId, request = {}) {
    const params = new URLSearchParams();
    if (request.limit) params.append('limit', request.limit.toString());
    if (request.order) params.append('order', request.order);
    if (request.after) params.append('after', request.after);
    if (request.before) params.append('before', request.before);
    if (request.run_id) params.append('run_id', request.run_id);

    const queryString = params.toString();
    const endpoint = queryString ? `/threads/${threadId}/messages?${queryString}` : `/threads/${threadId}/messages`;
    
    return await this.makeRequest('GET', endpoint);
  }

  async getMessage(threadId, messageId) {
    return await this.makeRequest('GET', `/threads/${threadId}/messages/${messageId}`);
  }

  async updateMessage(threadId, messageId, request) {
    return await this.makeRequest('POST', `/threads/${threadId}/messages/${messageId}`, request);
  }

  async deleteMessage(threadId, messageId) {
    return await this.makeRequest('DELETE', `/threads/${threadId}/messages/${messageId}`);
  }

  // Run Management
  async createRun(threadId, request) {
    return await this.makeRequest('POST', `/threads/${threadId}/runs`, request);
  }

  async listRuns(threadId, request = {}) {
    const params = new URLSearchParams();
    if (request.limit) params.append('limit', request.limit.toString());
    if (request.order) params.append('order', request.order);
    if (request.after) params.append('after', request.after);
    if (request.before) params.append('before', request.before);

    const queryString = params.toString();
    const endpoint = queryString ? `/threads/${threadId}/runs?${queryString}` : `/threads/${threadId}/runs`;
    
    return await this.makeRequest('GET', endpoint);
  }

  async getRun(threadId, runId) {
    return await this.makeRequest('GET', `/threads/${threadId}/runs/${runId}`);
  }

  async updateRun(threadId, runId, request) {
    return await this.makeRequest('POST', `/threads/${threadId}/runs/${runId}`, request);
  }

  async cancelRun(threadId, runId) {
    return await this.makeRequest('POST', `/threads/${threadId}/runs/${runId}/cancel`);
  }

  async submitToolOutputs(threadId, runId, request) {
    return await this.makeRequest('POST', `/threads/${threadId}/runs/${runId}/submit_tool_outputs`, request);
  }

  // Run Step Management
  async listRunSteps(threadId, runId, request = {}) {
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
    
    return await this.makeRequest('GET', endpoint);
  }

  async getRunStep(threadId, runId, stepId) {
    return await this.makeRequest('GET', `/threads/${threadId}/runs/${runId}/steps/${stepId}`);
  }

  /**
   * Validate API key by making a simple request
   */
  async validateApiKey() {
    try {
      await this.makeRequest('GET', '/models', undefined, false);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Make HTTP request to OpenAI API using Node.js https module
   */
  async makeRequest(method, endpoint, body = null, throwOnError = true) {
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.baseUrl}${endpoint}`);
      
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
          'User-Agent': 'roo-compatible-assistants-mcp-server/1.0.0'
        }
      };

      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        const bodyString = JSON.stringify(body);
        options.headers['Content-Length'] = Buffer.byteLength(bodyString);
      }

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
              let errorData = {};
              try {
                errorData = JSON.parse(data);
              } catch (parseError) {
                // Ignore parse errors for error responses
              }

              if (!throwOnError) {
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
              }

              // Map OpenAI error codes to MCP error codes
              let mcpErrorCode = ErrorCodes.INTERNAL_ERROR;
              if (res.statusCode === 401) {
                mcpErrorCode = ErrorCodes.UNAUTHORIZED;
              } else if (res.statusCode === 403) {
                mcpErrorCode = ErrorCodes.FORBIDDEN;
              } else if (res.statusCode === 404) {
                mcpErrorCode = ErrorCodes.NOT_FOUND;
              } else if (res.statusCode === 429) {
                mcpErrorCode = ErrorCodes.RATE_LIMITED;
              }

              const errorMessage = errorData?.error?.message || `OpenAI API error: ${res.statusCode} ${res.statusMessage}`;
              
              reject(new MCPError(
                mcpErrorCode,
                errorMessage,
                errorData
              ));
              return;
            }

            // Parse successful response
            try {
              const result = JSON.parse(data);
              resolve(result);
            } catch (parseError) {
              reject(new MCPError(
                ErrorCodes.INTERNAL_ERROR,
                `Failed to parse OpenAI API response: ${parseError.message}`,
                { originalError: parseError, responseData: data }
              ));
            }
          } catch (error) {
            reject(new MCPError(
              ErrorCodes.INTERNAL_ERROR,
              `Error processing OpenAI API response: ${error.message}`,
              { originalError: error }
            ));
          }
        });
      });

      req.on('error', (error) => {
        reject(new MCPError(
          ErrorCodes.INTERNAL_ERROR,
          `Network error: ${error.message}`,
          { originalError: error }
        ));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new MCPError(
          ErrorCodes.INTERNAL_ERROR,
          'Request timeout',
          { timeout: true }
        ));
      });

      // Set timeout (30 seconds)
      req.setTimeout(30000);

      // Write request body if present
      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }
}

module.exports = { OpenAIService, MCPError, ErrorCodes };