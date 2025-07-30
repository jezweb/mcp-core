/**
 * Shared test utilities and helpers for OpenAI Assistants MCP Server testing
 * Provides common functionality for both Cloudflare Workers and NPM package tests
 */

/**
 * Test result tracking and reporting utilities
 */
export class TestTracker {
  constructor(suiteName = 'Test Suite') {
    this.suiteName = suiteName;
    this.testResults = [];
    this.currentTest = null;
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logMessage);
    this.testResults.push({ timestamp, type, message, test: this.currentTest });
  }

  async runTest(testName, testFn) {
    this.currentTest = testName;
    this.log(`Starting test: ${testName}`, 'test');
    const testStartTime = Date.now();
    
    try {
      const result = await testFn();
      const duration = Date.now() - testStartTime;
      this.log(`✅ PASSED: ${testName} (${duration}ms)`, 'pass');
      return result;
    } catch (error) {
      const duration = Date.now() - testStartTime;
      this.log(`❌ FAILED: ${testName} (${duration}ms) - ${error.message}`, 'fail');
      throw error;
    } finally {
      this.currentTest = null;
    }
  }

  generateReport() {
    const passed = this.testResults.filter(r => r.type === 'pass').length;
    const failed = this.testResults.filter(r => r.type === 'fail').length;
    const total = passed + failed;
    const duration = Date.now() - this.startTime;

    console.log('\n' + '='.repeat(80));
    console.log(`📊 TEST REPORT - ${this.suiteName}`);
    console.log('='.repeat(80));
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${total > 0 ? Math.round((passed / total) * 100) : 0}%`);
    console.log(`Total Duration: ${duration}ms`);
    console.log('='.repeat(80));

    // Group results by test
    const testGroups = {};
    this.testResults.forEach(result => {
      if (result.test && (result.type === 'pass' || result.type === 'fail')) {
        if (!testGroups[result.test]) {
          testGroups[result.test] = [];
        }
        testGroups[result.test].push(result);
      }
    });

    Object.keys(testGroups).forEach(testName => {
      const results = testGroups[testName];
      const status = results.some(r => r.type === 'fail') ? '❌' : '✅';
      console.log(`${status} ${testName}`);
    });

    return { passed, failed, total, duration, success: failed === 0 };
  }
}

/**
 * Mock OpenAI API response generators
 */
export class MockOpenAIResponses {
  static createAssistant(overrides = {}) {
    return {
      id: `asst_${Math.random().toString(36).substr(2, 9)}`,
      object: 'assistant',
      created_at: Math.floor(Date.now() / 1000),
      name: 'Test Assistant',
      description: 'A test assistant for validation',
      model: 'gpt-4',
      instructions: 'You are a helpful test assistant.',
      tools: [{ type: 'code_interpreter' }],
      metadata: { test: 'true' },
      ...overrides
    };
  }

  static createThread(overrides = {}) {
    return {
      id: `thread_${Math.random().toString(36).substr(2, 9)}`,
      object: 'thread',
      created_at: Math.floor(Date.now() / 1000),
      metadata: {},
      ...overrides
    };
  }

  static createMessage(overrides = {}) {
    return {
      id: `msg_${Math.random().toString(36).substr(2, 9)}`,
      object: 'thread.message',
      created_at: Math.floor(Date.now() / 1000),
      thread_id: `thread_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: [
        {
          type: 'text',
          text: {
            value: 'Test message content',
            annotations: []
          }
        }
      ],
      metadata: {},
      ...overrides
    };
  }

  static createRun(overrides = {}) {
    return {
      id: `run_${Math.random().toString(36).substr(2, 9)}`,
      object: 'thread.run',
      created_at: Math.floor(Date.now() / 1000),
      thread_id: `thread_${Math.random().toString(36).substr(2, 9)}`,
      assistant_id: `asst_${Math.random().toString(36).substr(2, 9)}`,
      status: 'completed',
      model: 'gpt-4',
      instructions: 'You are a helpful assistant.',
      tools: [],
      metadata: {},
      ...overrides
    };
  }

  static createRunStep(overrides = {}) {
    return {
      id: `step_${Math.random().toString(36).substr(2, 9)}`,
      object: 'thread.run.step',
      created_at: Math.floor(Date.now() / 1000),
      thread_id: `thread_${Math.random().toString(36).substr(2, 9)}`,
      run_id: `run_${Math.random().toString(36).substr(2, 9)}`,
      type: 'message_creation',
      status: 'completed',
      step_details: {
        type: 'message_creation',
        message_creation: {
          message_id: `msg_${Math.random().toString(36).substr(2, 9)}`
        }
      },
      ...overrides
    };
  }

  static createListResponse(items, hasMore = false) {
    return {
      object: 'list',
      data: items,
      first_id: items.length > 0 ? items[0].id : null,
      last_id: items.length > 0 ? items[items.length - 1].id : null,
      has_more: hasMore
    };
  }

  static createDeleteResponse(id, object) {
    return {
      id,
      object: `${object}.deleted`,
      deleted: true
    };
  }

  static createErrorResponse(code, message, type = 'invalid_request_error') {
    return {
      error: {
        message,
        type,
        code,
        param: null
      }
    };
  }
}

/**
 * Test data generators for consistent test scenarios
 */
export class TestDataGenerator {
  static getValidAssistantData() {
    return {
      model: 'gpt-4',
      name: 'Test Assistant',
      description: 'A test assistant for validation',
      instructions: 'You are a helpful test assistant.',
      tools: [{ type: 'code_interpreter' }],
      metadata: { test: 'true', environment: 'testing' }
    };
  }

  static getValidThreadData() {
    return {
      messages: [
        {
          role: 'user',
          content: 'Hello, this is a test message.'
        }
      ],
      metadata: { test: 'true', environment: 'testing' }
    };
  }

  static getValidMessageData() {
    return {
      role: 'user',
      content: 'This is a test message for validation.',
      metadata: { test: 'true', environment: 'testing' }
    };
  }

  static getValidRunData() {
    return {
      model: 'gpt-4',
      instructions: 'You are a helpful test assistant.',
      additional_instructions: 'Please be concise in your responses.',
      tools: [{ type: 'code_interpreter' }],
      metadata: { test: 'true', environment: 'testing' }
    };
  }

  static getInvalidData() {
    return {
      missingModel: { name: 'Test' }, // Missing required model
      emptyString: { model: '' }, // Empty required field
      invalidType: { model: 123 }, // Wrong type
      tooLong: { model: 'gpt-4', name: 'x'.repeat(300) }, // Too long
      invalidEnum: { model: 'invalid-model' } // Invalid enum value
    };
  }

  static getEdgeCaseData() {
    return {
      maxLength: {
        model: 'gpt-4',
        name: 'x'.repeat(256), // Maximum allowed length
        description: 'x'.repeat(512),
        instructions: 'x'.repeat(32768)
      },
      specialCharacters: {
        model: 'gpt-4',
        name: 'Test Assistant with 特殊字符 and émojis 🤖',
        description: 'Description with newlines\nand\ttabs',
        instructions: 'Instructions with "quotes" and \'apostrophes\''
      },
      unicode: {
        model: 'gpt-4',
        name: '测试助手',
        description: 'Тестовый помощник',
        instructions: 'あなたは役に立つアシスタントです。'
      }
    };
  }

  static getPerformanceTestData() {
    return {
      largeMetadata: {
        model: 'gpt-4',
        metadata: Object.fromEntries(
          Array.from({ length: 100 }, (_, i) => [`key${i}`, `value${i}`])
        )
      },
      manyTools: {
        model: 'gpt-4',
        tools: Array.from({ length: 10 }, () => ({ type: 'code_interpreter' }))
      },
      longInstructions: {
        model: 'gpt-4',
        instructions: 'You are a helpful assistant. '.repeat(1000)
      }
    };
  }
}

/**
 * MCP request/response validation utilities
 */
export class MCPValidator {
  static validateMCPRequest(request) {
    const errors = [];

    if (!request.jsonrpc || request.jsonrpc !== '2.0') {
      errors.push('Invalid or missing jsonrpc version');
    }

    if (request.id === undefined || request.id === null) {
      errors.push('Missing request ID');
    }

    if (!request.method || typeof request.method !== 'string') {
      errors.push('Invalid or missing method');
    }

    return errors;
  }

  static validateMCPResponse(response) {
    const errors = [];

    if (!response.jsonrpc || response.jsonrpc !== '2.0') {
      errors.push('Invalid or missing jsonrpc version');
    }

    if (response.id === undefined || response.id === null) {
      errors.push('Missing response ID');
    }

    if (!response.result && !response.error) {
      errors.push('Response must have either result or error');
    }

    if (response.result && response.error) {
      errors.push('Response cannot have both result and error');
    }

    return errors;
  }

  static validateToolDefinition(tool) {
    const errors = [];

    if (!tool.name || typeof tool.name !== 'string') {
      errors.push('Tool must have a valid name');
    }

    if (!tool.description || typeof tool.description !== 'string') {
      errors.push('Tool must have a valid description');
    }

    if (!tool.inputSchema || typeof tool.inputSchema !== 'object') {
      errors.push('Tool must have a valid inputSchema');
    }

    return errors;
  }
}

/**
 * Performance measurement utilities
 */
export class PerformanceTracker {
  constructor() {
    this.measurements = [];
  }

  async measure(name, fn) {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.measurements.push({ name, duration, success: true });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.measurements.push({ name, duration, success: false, error: error.message });
      throw error;
    }
  }

  getStats() {
    const successful = this.measurements.filter(m => m.success);
    const failed = this.measurements.filter(m => !m.success);
    
    if (successful.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, failed: failed.length };
    }

    const durations = successful.map(m => m.duration);
    return {
      count: successful.length,
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      failed: failed.length
    };
  }

  generateReport() {
    const stats = this.getStats();
    console.log('\n📈 Performance Report:');
    console.log(`Total Measurements: ${stats.count + stats.failed}`);
    console.log(`Successful: ${stats.count}`);
    console.log(`Failed: ${stats.failed}`);
    if (stats.count > 0) {
      console.log(`Average Duration: ${stats.avg.toFixed(2)}ms`);
      console.log(`Min Duration: ${stats.min.toFixed(2)}ms`);
      console.log(`Max Duration: ${stats.max.toFixed(2)}ms`);
    }
    return stats;
  }
}

/**
 * Environment detection utilities
 */
export class EnvironmentDetector {
  static isCloudflareWorkers() {
    return typeof globalThis.caches !== 'undefined' && 
           typeof globalThis.Request !== 'undefined' &&
           typeof process === 'undefined';
  }

  static isNode() {
    return typeof process !== 'undefined' && 
           process.versions && 
           process.versions.node;
  }

  static getEnvironmentInfo() {
    return {
      isCloudflareWorkers: this.isCloudflareWorkers(),
      isNode: this.isNode(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      nodeVersion: this.isNode() ? process.version : null,
      platform: this.isNode() ? process.platform : 'Unknown'
    };
  }
}

/**
 * Retry utilities for flaky tests
 */
export class RetryHelper {
  static async withRetry(fn, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt === maxRetries) {
          throw error;
        }
        
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
    
    throw lastError;
  }
}