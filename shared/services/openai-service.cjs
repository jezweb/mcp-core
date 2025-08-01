/**
 * CommonJS version of OpenAI Service for NPM package compatibility
 * 
 * This file provides CommonJS-compatible versions of the OpenAI service
 * that can be used by the NPM package while maintaining the same functionality
 * as the TypeScript version.
 */

/**
 * OpenAI Service for handling API interactions
 */
class OpenAIService {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseURL = options.baseURL || 'https://api.openai.com/v1';
    this.timeout = options.timeout || 30000;
    this.maxRetries = options.maxRetries || 3;
  }

  /**
   * Make a request to the OpenAI API
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'openai-assistants-mcp/2.2.4',
      ...options.headers
    };

    const requestOptions = {
      method: options.method || 'GET',
      headers,
      ...options
    };

    if (options.body && typeof options.body === 'object') {
      requestOptions.body = JSON.stringify(options.body);
    }

    let lastError;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries - 1) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * List assistants
   */
  async listAssistants(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.order) queryParams.append('order', params.order);
    if (params.after) queryParams.append('after', params.after);
    if (params.before) queryParams.append('before', params.before);

    const endpoint = `/assistants${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.makeRequest(endpoint);
  }

  /**
   * Create an assistant
   */
  async createAssistant(params) {
    return this.makeRequest('/assistants', {
      method: 'POST',
      body: params
    });
  }

  /**
   * Get an assistant
   */
  async getAssistant(assistantId) {
    return this.makeRequest(`/assistants/${assistantId}`);
  }

  /**
   * Update an assistant
   */
  async updateAssistant(assistantId, params) {
    return this.makeRequest(`/assistants/${assistantId}`, {
      method: 'POST',
      body: params
    });
  }

  /**
   * Delete an assistant
   */
  async deleteAssistant(assistantId) {
    return this.makeRequest(`/assistants/${assistantId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Create a thread
   */
  async createThread(params = {}) {
    return this.makeRequest('/threads', {
      method: 'POST',
      body: params
    });
  }

  /**
   * Get a thread
   */
  async getThread(threadId) {
    return this.makeRequest(`/threads/${threadId}`);
  }

  /**
   * Update a thread
   */
  async updateThread(threadId, params) {
    return this.makeRequest(`/threads/${threadId}`, {
      method: 'POST',
      body: params
    });
  }

  /**
   * Delete a thread
   */
  async deleteThread(threadId) {
    return this.makeRequest(`/threads/${threadId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Create a message
   */
  async createMessage(threadId, params) {
    return this.makeRequest(`/threads/${threadId}/messages`, {
      method: 'POST',
      body: params
    });
  }

  /**
   * List messages
   */
  async listMessages(threadId, params = {}) {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.order) queryParams.append('order', params.order);
    if (params.after) queryParams.append('after', params.after);
    if (params.before) queryParams.append('before', params.before);
    if (params.run_id) queryParams.append('run_id', params.run_id);

    const endpoint = `/threads/${threadId}/messages${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.makeRequest(endpoint);
  }

  /**
   * Get a message
   */
  async getMessage(threadId, messageId) {
    return this.makeRequest(`/threads/${threadId}/messages/${messageId}`);
  }

  /**
   * Update a message
   */
  async updateMessage(threadId, messageId, params) {
    return this.makeRequest(`/threads/${threadId}/messages/${messageId}`, {
      method: 'POST',
      body: params
    });
  }

  /**
   * Delete a message
   */
  async deleteMessage(threadId, messageId) {
    return this.makeRequest(`/threads/${threadId}/messages/${messageId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Upload a file
   */
  async uploadFile(file, purpose) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', purpose);

    return this.makeRequest('/files', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
        // Don't set Content-Type for FormData
      }
    });
  }

  /**
   * List files
   */
  async listFiles(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.purpose) queryParams.append('purpose', params.purpose);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.order) queryParams.append('order', params.order);
    if (params.after) queryParams.append('after', params.after);

    const endpoint = `/files${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.makeRequest(endpoint);
  }

  /**
   * Get a file
   */
  async getFile(fileId) {
    return this.makeRequest(`/files/${fileId}`);
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId) {
    return this.makeRequest(`/files/${fileId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Get file content
   */
  async getFileContent(fileId) {
    return this.makeRequest(`/files/${fileId}/content`);
  }
}

module.exports = {
  OpenAIService
};