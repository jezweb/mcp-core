/**
 * Comprehensive validation tests for OpenAI Assistants MCP Server
 * Tests the improved error messages and validation following MCP best practices
 */

import { MCPHandler } from '../../src/mcp-handler.js';
import { ErrorCodes } from '../../src/types.js';

// Mock OpenAI service for testing
class MockOpenAIService {
  async createAssistant() { return { id: 'asst_test123456789012345678' }; }
  async listAssistants() { return { data: [] }; }
  async getAssistant() { return { id: 'asst_test123456789012345678' }; }
  async updateAssistant() { return { id: 'asst_test123456789012345678' }; }
  async deleteAssistant() { return { deleted: true }; }
  async createThread() { return { id: 'thread_test123456789012345678' }; }
  async getThread() { return { id: 'thread_test123456789012345678' }; }
  async updateThread() { return { id: 'thread_test123456789012345678' }; }
  async deleteThread() { return { deleted: true }; }
  async createMessage() { return { id: 'msg_test123456789012345678' }; }
  async listMessages() { return { data: [] }; }
  async getMessage() { return { id: 'msg_test123456789012345678' }; }
  async updateMessage() { return { id: 'msg_test123456789012345678' }; }
  async deleteMessage() { return { deleted: true }; }
  async createRun() { return { id: 'run_test123456789012345678' }; }
  async listRuns() { return { data: [] }; }
  async getRun() { return { id: 'run_test123456789012345678' }; }
  async updateRun() { return { id: 'run_test123456789012345678' }; }
  async cancelRun() { return { id: 'run_test123456789012345678' }; }
  async submitToolOutputs() { return { id: 'run_test123456789012345678' }; }
  async listRunSteps() { return { data: [] }; }
  async getRunStep() { return { id: 'step_test123456789012345678' }; }
}

class ValidationTestSuite {
  constructor() {
    this.handler = new MCPHandler('test-api-key');
    this.handler.openaiService = new MockOpenAIService();
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Running comprehensive validation tests...\n');

    // Test categories
    await this.testAssistantValidation();
    await this.testThreadValidation();
    await this.testMessageValidation();
    await this.testRunValidation();
    await this.testRunStepValidation();
    await this.testPaginationValidation();
    await this.testModelValidation();
    await this.testIdFormatValidation();
    await this.testMetadataValidation();

    this.printResults();
  }

  async testAssistantValidation() {
    console.log('📋 Testing Assistant Validation...');

    // Test missing model parameter
    await this.expectValidationError(
      'assistant-create',
      {},
      'Missing required parameter: model',
      'Should reject assistant creation without model'
    );

    // Test invalid model
    await this.expectValidationError(
      'assistant-create',
      { model: 'invalid-model' },
      'Invalid model \'invalid-model\'',
      'Should reject invalid model names'
    );

    // Test invalid assistant ID format
    await this.expectValidationError(
      'assistant-get',
      { assistant_id: 'invalid-id' },
      'Invalid assistant ID format',
      'Should reject malformed assistant IDs'
    );

    // Test missing assistant ID
    await this.expectValidationError(
      'assistant-get',
      {},
      'Required parameter \'assistant_id\' is missing',
      'Should reject missing assistant ID'
    );

    // Test valid assistant creation
    await this.expectSuccess(
      'assistant-create',
      { model: 'gpt-4', name: 'Test Assistant' },
      'Should accept valid assistant creation'
    );

    console.log('✅ Assistant validation tests completed\n');
  }

  async testThreadValidation() {
    console.log('🧵 Testing Thread Validation...');

    // Test invalid thread ID format
    await this.expectValidationError(
      'thread-get',
      { thread_id: 'invalid-thread-id' },
      'Invalid thread ID format',
      'Should reject malformed thread IDs'
    );

    // Test missing thread ID
    await this.expectValidationError(
      'thread-get',
      {},
      'Required parameter \'thread_id\' is missing',
      'Should reject missing thread ID'
    );

    // Test valid thread operations
    await this.expectSuccess(
      'thread-create',
      { metadata: { session: 'test' } },
      'Should accept valid thread creation'
    );

    await this.expectSuccess(
      'thread-get',
      { thread_id: 'thread_test123456789012345678' },
      'Should accept valid thread ID'
    );

    console.log('✅ Thread validation tests completed\n');
  }

  async testMessageValidation() {
    console.log('💬 Testing Message Validation...');

    // Test missing required parameters
    await this.expectValidationError(
      'message-create',
      {},
      'Required parameter \'thread_id\' is missing',
      'Should reject missing thread_id'
    );

    await this.expectValidationError(
      'message-create',
      { thread_id: 'thread_test123456789012345678' },
      'Required parameter \'role\' is missing',
      'Should reject missing role'
    );

    await this.expectValidationError(
      'message-create',
      { 
        thread_id: 'thread_test123456789012345678',
        role: 'user'
      },
      'Required parameter \'content\' is missing',
      'Should reject missing content'
    );

    // Test invalid role
    await this.expectValidationError(
      'message-create',
      { 
        thread_id: 'thread_test123456789012345678',
        role: 'invalid-role',
        content: 'test'
      },
      'Invalid value \'invalid-role\' for parameter \'role\'',
      'Should reject invalid message roles'
    );

    // Test valid message creation
    await this.expectSuccess(
      'message-create',
      { 
        thread_id: 'thread_test123456789012345678',
        role: 'user',
        content: 'Hello, how can I help you?'
      },
      'Should accept valid message creation'
    );

    console.log('✅ Message validation tests completed\n');
  }

  async testRunValidation() {
    console.log('🏃 Testing Run Validation...');

    // Test missing required parameters
    await this.expectValidationError(
      'run-create',
      {},
      'Required parameter \'thread_id\' is missing',
      'Should reject missing thread_id'
    );

    await this.expectValidationError(
      'run-create',
      { thread_id: 'thread_test123456789012345678' },
      'Required parameter \'assistant_id\' is missing',
      'Should reject missing assistant_id'
    );

    // Test invalid tool outputs
    await this.expectValidationError(
      'run-submit-tool-outputs',
      {
        thread_id: 'thread_test123456789012345678',
        run_id: 'run_test123456789012345678',
        tool_outputs: 'not-an-array'
      },
      'Parameter \'tool_outputs\' must be an array',
      'Should reject non-array tool_outputs'
    );

    // Test missing tool_outputs
    await this.expectValidationError(
      'run-submit-tool-outputs',
      {
        thread_id: 'thread_test123456789012345678',
        run_id: 'run_test123456789012345678'
      },
      'Required parameter \'tool_outputs\' is missing',
      'Should reject missing tool_outputs'
    );

    // Test valid run creation
    await this.expectSuccess(
      'run-create',
      { 
        thread_id: 'thread_test123456789012345678',
        assistant_id: 'asst_test123456789012345678'
      },
      'Should accept valid run creation'
    );

    console.log('✅ Run validation tests completed\n');
  }

  async testRunStepValidation() {
    console.log('👣 Testing Run Step Validation...');

    // Test missing step ID
    await this.expectValidationError(
      'run-step-get',
      {
        thread_id: 'thread_test123456789012345678',
        run_id: 'run_test123456789012345678'
      },
      'Required parameter \'step_id\' is missing',
      'Should reject missing step_id'
    );

    // Test invalid step ID format
    await this.expectValidationError(
      'run-step-get',
      {
        thread_id: 'thread_test123456789012345678',
        run_id: 'run_test123456789012345678',
        step_id: 'invalid-step-id'
      },
      'Invalid step ID format',
      'Should reject malformed step IDs'
    );

    // Test valid step retrieval
    await this.expectSuccess(
      'run-step-get',
      {
        thread_id: 'thread_test123456789012345678',
        run_id: 'run_test123456789012345678',
        step_id: 'step_test123456789012345678'
      },
      'Should accept valid step retrieval'
    );

    console.log('✅ Run Step validation tests completed\n');
  }

  async testPaginationValidation() {
    console.log('📄 Testing Pagination Validation...');

    // Test invalid limit
    await this.expectValidationError(
      'assistant-list',
      { limit: 0 },
      'Parameter \'limit\' must be between 1 and 100',
      'Should reject limit below minimum'
    );

    await this.expectValidationError(
      'assistant-list',
      { limit: 101 },
      'Parameter \'limit\' must be between 1 and 100',
      'Should reject limit above maximum'
    );

    // Test invalid order
    await this.expectValidationError(
      'assistant-list',
      { order: 'invalid-order' },
      'Invalid value \'invalid-order\' for parameter \'order\'',
      'Should reject invalid order values'
    );

    // Test conflicting pagination cursors
    await this.expectValidationError(
      'assistant-list',
      { 
        after: 'asst_test123456789012345678',
        before: 'asst_test123456789012345679'
      },
      'Cannot specify both \'after\' and \'before\' parameters simultaneously',
      'Should reject both after and before cursors'
    );

    // Test valid pagination
    await this.expectSuccess(
      'assistant-list',
      { limit: 20, order: 'desc' },
      'Should accept valid pagination parameters'
    );

    console.log('✅ Pagination validation tests completed\n');
  }

  async testModelValidation() {
    console.log('🤖 Testing Model Validation...');

    // Test supported models
    const supportedModels = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];
    
    for (const model of supportedModels) {
      await this.expectSuccess(
        'assistant-create',
        { model },
        `Should accept supported model: ${model}`
      );
    }

    // Test unsupported models
    const unsupportedModels = ['gpt-2', 'claude-3', 'llama-2'];
    
    for (const model of unsupportedModels) {
      await this.expectValidationError(
        'assistant-create',
        { model },
        `Invalid model '${model}'`,
        `Should reject unsupported model: ${model}`
      );
    }

    console.log('✅ Model validation tests completed\n');
  }

  async testIdFormatValidation() {
    console.log('🆔 Testing ID Format Validation...');

    const idTests = [
      {
        type: 'assistant',
        valid: ['asst_abc123def456ghi789jkl012'],
        invalid: ['asst_', 'asst_short', 'invalid_format', 'thread_abc123def456ghi789jkl012']
      },
      {
        type: 'thread',
        valid: ['thread_abc123def456ghi789jkl012'],
        invalid: ['thread_', 'thread_short', 'asst_abc123def456ghi789jkl012']
      },
      {
        type: 'message',
        valid: ['msg_abc123def456ghi789jkl012'],
        invalid: ['msg_', 'msg_short', 'message_abc123def456ghi789jkl012']
      },
      {
        type: 'run',
        valid: ['run_abc123def456ghi789jkl012'],
        invalid: ['run_', 'run_short', 'execution_abc123def456ghi789jkl012']
      }
    ];

    for (const test of idTests) {
      // Test valid IDs
      for (const validId of test.valid) {
        const toolName = `${test.type}-get`;
        const paramName = `${test.type}_id`;
        
        await this.expectSuccess(
          toolName,
          { [paramName]: validId },
          `Should accept valid ${test.type} ID: ${validId}`
        );
      }

      // Test invalid IDs
      for (const invalidId of test.invalid) {
        const toolName = `${test.type}-get`;
        const paramName = `${test.type}_id`;
        
        await this.expectValidationError(
          toolName,
          { [paramName]: invalidId },
          `Invalid ${test.type} ID format`,
          `Should reject invalid ${test.type} ID: ${invalidId}`
        );
      }
    }

    console.log('✅ ID format validation tests completed\n');
  }

  async testMetadataValidation() {
    console.log('📝 Testing Metadata Validation...');

    // Test invalid metadata type
    await this.expectValidationError(
      'assistant-create',
      { 
        model: 'gpt-4',
        metadata: 'not-an-object'
      },
      'Parameter \'metadata\' must be an object',
      'Should reject non-object metadata'
    );

    // Test array as metadata
    await this.expectValidationError(
      'assistant-create',
      { 
        model: 'gpt-4',
        metadata: ['not', 'an', 'object']
      },
      'Parameter \'metadata\' must be an object',
      'Should reject array metadata'
    );

    // Test oversized metadata
    const largeMetadata = {};
    for (let i = 0; i < 1000; i++) {
      largeMetadata[`key_${i}`] = `This is a very long value that will make the metadata exceed the 16KB limit when repeated many times in the object`;
    }

    await this.expectValidationError(
      'assistant-create',
      { 
        model: 'gpt-4',
        metadata: largeMetadata
      },
      'Parameter \'metadata\' exceeds the 16KB size limit',
      'Should reject oversized metadata'
    );

    // Test valid metadata
    await this.expectSuccess(
      'assistant-create',
      { 
        model: 'gpt-4',
        metadata: { 
          department: 'support',
          version: '1.0',
          created_by: 'admin'
        }
      },
      'Should accept valid metadata'
    );

    console.log('✅ Metadata validation tests completed\n');
  }

  async expectValidationError(toolName, args, expectedErrorSubstring, description) {
    try {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      };

      const response = await this.handler.handleRequest(request);
      
      if (response.error) {
        if (response.error.message.includes(expectedErrorSubstring)) {
          this.testResults.push({ 
            status: 'PASS', 
            description,
            details: `Correctly rejected with: ${response.error.message}`
          });
        } else {
          this.testResults.push({ 
            status: 'FAIL', 
            description,
            details: `Expected error containing "${expectedErrorSubstring}", got: ${response.error.message}`
          });
        }
      } else if (response.result && response.result.isError) {
        const errorText = response.result.content[0].text;
        if (errorText.includes(expectedErrorSubstring)) {
          this.testResults.push({ 
            status: 'PASS', 
            description,
            details: `Correctly rejected with: ${errorText}`
          });
        } else {
          this.testResults.push({ 
            status: 'FAIL', 
            description,
            details: `Expected error containing "${expectedErrorSubstring}", got: ${errorText}`
          });
        }
      } else {
        this.testResults.push({ 
          status: 'FAIL', 
          description,
          details: 'Expected validation error but request succeeded'
        });
      }
    } catch (error) {
      this.testResults.push({ 
        status: 'FAIL', 
        description,
        details: `Unexpected error: ${error.message}`
      });
    }
  }

  async expectSuccess(toolName, args, description) {
    try {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      };

      const response = await this.handler.handleRequest(request);
      
      if (response.error) {
        this.testResults.push({ 
          status: 'FAIL', 
          description,
          details: `Expected success but got error: ${response.error.message}`
        });
      } else if (response.result && response.result.isError) {
        this.testResults.push({ 
          status: 'FAIL', 
          description,
          details: `Expected success but got error: ${response.result.content[0].text}`
        });
      } else {
        this.testResults.push({ 
          status: 'PASS', 
          description,
          details: 'Request succeeded as expected'
        });
      }
    } catch (error) {
      this.testResults.push({ 
        status: 'FAIL', 
        description,
        details: `Unexpected error: ${error.message}`
      });
    }
  }

  printResults() {
    console.log('📊 Test Results Summary');
    console.log('========================\n');

    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const total = this.testResults.length;

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

    if (failed > 0) {
      console.log('❌ Failed Tests:');
      console.log('================');
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach((result, index) => {
          console.log(`${index + 1}. ${result.description}`);
          console.log(`   Details: ${result.details}\n`);
        });
    }

    if (passed === total) {
      console.log('🎉 All validation tests passed! The improved error handling and validation is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please review the validation implementation.');
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testSuite = new ValidationTestSuite();
  testSuite.runAllTests().catch(console.error);
}

export { ValidationTestSuite };