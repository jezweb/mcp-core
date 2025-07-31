/**
 * Prompts Functionality Test
 * 
 * Tests the MCP prompts protocol implementation including:
 * - prompts/list functionality
 * - prompts/get functionality
 * - Prompt template validation
 * - Error handling
 */

const { BaseMCPHandler } = require('../../shared/core/base-mcp-handler.js');

/**
 * Test configuration
 */
const TEST_CONFIG = {
  apiKey: 'test-api-key-for-prompts',
  serverName: 'test-prompts-server',
  serverVersion: '1.0.0-test',
  debug: true,
  capabilities: {
    tools: { listChanged: false },
    resources: { subscribe: false, listChanged: false },
    prompts: { listChanged: true }
  }
};

/**
 * Test prompts/list functionality
 */
async function testPromptsList() {
  console.log('\n🧪 Testing prompts/list...');
  
  try {
    const handler = new BaseMCPHandler(TEST_CONFIG);
    
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'prompts/list',
      params: {}
    };
    
    const response = await handler.handleRequest(request);
    
    // Validate response structure
    if (!response.result || !Array.isArray(response.result.prompts)) {
      throw new Error('Invalid response structure');
    }
    
    const prompts = response.result.prompts;
    console.log(`✅ Found ${prompts.length} prompts`);
    
    // Validate each prompt has required fields
    for (const prompt of prompts) {
      if (!prompt.name || !prompt.description) {
        throw new Error(`Invalid prompt structure: ${JSON.stringify(prompt)}`);
      }
    }
    
    // Check for expected prompts
    const expectedPrompts = [
      'create-coding-assistant',
      'create-data-analyst',
      'create-writing-assistant',
      'review-code',
      'explain-code'
    ];
    
    for (const expectedPrompt of expectedPrompts) {
      const found = prompts.find(p => p.name === expectedPrompt);
      if (!found) {
        throw new Error(`Expected prompt not found: ${expectedPrompt}`);
      }
      console.log(`✅ Found expected prompt: ${expectedPrompt}`);
    }
    
    console.log('✅ prompts/list test passed');
    return true;
  } catch (error) {
    console.error('❌ prompts/list test failed:', error.message);
    return false;
  }
}

/**
 * Test prompts/get functionality
 */
async function testPromptsGet() {
  console.log('\n🧪 Testing prompts/get...');
  
  try {
    const handler = new BaseMCPHandler(TEST_CONFIG);
    
    // Test getting a prompt with arguments
    const request = {
      jsonrpc: '2.0',
      id: 2,
      method: 'prompts/get',
      params: {
        name: 'review-code',
        arguments: {
          code: 'def hello():\n    print("world")',
          language: 'python',
          focus_areas: 'best_practices'
        }
      }
    };
    
    const response = await handler.handleRequest(request);
    
    // Validate response structure
    if (!response.result || !Array.isArray(response.result.messages)) {
      throw new Error('Invalid response structure');
    }
    
    const { description, messages } = response.result;
    console.log(`✅ Got prompt with description: ${description}`);
    console.log(`✅ Generated ${messages.length} messages`);
    
    // Validate message structure
    for (const message of messages) {
      if (!message.role || !message.content || !message.content.type) {
        throw new Error(`Invalid message structure: ${JSON.stringify(message)}`);
      }
      
      if (message.role !== 'user' && message.role !== 'assistant') {
        throw new Error(`Invalid message role: ${message.role}`);
      }
      
      if (message.content.type === 'text' && !message.content.text) {
        throw new Error('Text content missing text field');
      }
    }
    
    // Check that arguments were incorporated
    const messageText = messages[0].content.text;
    if (!messageText.includes('python') || !messageText.includes('best_practices')) {
      throw new Error('Arguments not properly incorporated into prompt');
    }
    
    console.log('✅ prompts/get test passed');
    return true;
  } catch (error) {
    console.error('❌ prompts/get test failed:', error.message);
    return false;
  }
}

/**
 * Test prompts/get error handling
 */
async function testPromptsGetErrorHandling() {
  console.log('\n🧪 Testing prompts/get error handling...');
  
  try {
    const handler = new BaseMCPHandler(TEST_CONFIG);
    
    // Test with non-existent prompt
    const request = {
      jsonrpc: '2.0',
      id: 3,
      method: 'prompts/get',
      params: {
        name: 'non-existent-prompt'
      }
    };
    
    const response = await handler.handleRequest(request);
    
    // Should return an error
    if (!response.error) {
      throw new Error('Expected error for non-existent prompt');
    }
    
    console.log('✅ Properly handled non-existent prompt error');
    
    // Test with missing required arguments
    const request2 = {
      jsonrpc: '2.0',
      id: 4,
      method: 'prompts/get',
      params: {
        name: 'review-code',
        arguments: {
          // Missing required 'code' argument
          language: 'python'
        }
      }
    };
    
    const response2 = await handler.handleRequest(request2);
    
    // Should return an error
    if (!response2.error) {
      throw new Error('Expected error for missing required arguments');
    }
    
    console.log('✅ Properly handled missing required arguments error');
    console.log('✅ prompts/get error handling test passed');
    return true;
  } catch (error) {
    console.error('❌ prompts/get error handling test failed:', error.message);
    return false;
  }
}

/**
 * Test initialize response includes prompts capability
 */
async function testInitializeWithPrompts() {
  console.log('\n🧪 Testing initialize with prompts capability...');
  
  try {
    const handler = new BaseMCPHandler(TEST_CONFIG);
    
    const request = {
      jsonrpc: '2.0',
      id: 0,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }
    };
    
    const response = await handler.handleRequest(request);
    
    // Check that prompts capability is included
    if (!response.result.capabilities.prompts) {
      throw new Error('Prompts capability not included in initialize response');
    }
    
    console.log('✅ Prompts capability included in initialize response');
    console.log('✅ Initialize with prompts test passed');
    return true;
  } catch (error) {
    console.error('❌ Initialize with prompts test failed:', error.message);
    return false;
  }
}

/**
 * Run all prompts tests
 */
async function runPromptsTests() {
  console.log('🚀 Starting MCP Prompts Functionality Tests...');
  
  const tests = [
    testInitializeWithPrompts,
    testPromptsList,
    testPromptsGet,
    testPromptsGetErrorHandling
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ Test failed with exception:`, error);
      failed++;
    }
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All prompts functionality tests passed!');
    return true;
  } else {
    console.log('\n💥 Some prompts functionality tests failed!');
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runPromptsTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = {
  runPromptsTests,
  testPromptsList,
  testPromptsGet,
  testPromptsGetErrorHandling,
  testInitializeWithPrompts
};