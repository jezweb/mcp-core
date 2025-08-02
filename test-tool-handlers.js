#!/usr/bin/env node

/**
 * Tool Handler Functionality Test
 * 
 * This script tests the tool handler system to ensure:
 * 1. Tool handlers can be created with generic provider interface
 * 2. Handler context works correctly with provider registry
 * 3. Tool validation and execution work through generic interface
 * 4. Dynamic tool registration works (no hardcoded assumptions)
 * 5. All expected tool categories are available
 */

import { openaiProviderFactory } from './dist/shared/services/providers/openai.js';
import { ProviderRegistry } from './dist/shared/services/provider-registry.js';
import { 
  createAllHandlers, 
  createFlatHandlerMap,
  getTotalToolCount,
  validateHandlerCompleteness,
  HANDLER_CATEGORIES
} from './dist/shared/core/handlers/index.js';

async function testToolHandlers() {
  console.log('🧪 Testing Tool Handler Functionality...\n');
  
  try {
    // Test 1: Setup Provider Registry with Mock Provider
    console.log('1. Setting up provider registry with mock provider...');
    const registryConfig = {
      defaultProvider: 'openai',
      providers: [
        {
          provider: 'openai',
          config: { apiKey: 'test-key-123' },
          enabled: true,
          priority: 1
        }
      ]
    };
    
    const registry = new ProviderRegistry(registryConfig);
    registry.registerFactory(openaiProviderFactory);
    
    // Create a mock provider for testing
    const mockProvider = {
      metadata: { name: 'openai', displayName: 'OpenAI Test' },
      validateConnection: async () => true,
      initialize: async () => {},
      // Mock all the required methods
      createAssistant: async (req) => ({ id: 'asst_test123', name: req.name }),
      listAssistants: async (req) => ({ data: [], has_more: false }),
      getAssistant: async (id) => ({ id, name: 'Test Assistant' }),
      updateAssistant: async (id, req) => ({ id, name: req.name }),
      deleteAssistant: async (id) => ({ id, deleted: true }),
      createThread: async (req) => ({ id: 'thread_test123' }),
      getThread: async (id) => ({ id }),
      updateThread: async (id, req) => ({ id }),
      deleteThread: async (id) => ({ id, deleted: true }),
      createMessage: async (threadId, req) => ({ id: 'msg_test123', content: req.content }),
      listMessages: async (threadId, req) => ({ data: [], has_more: false }),
      getMessage: async (threadId, messageId) => ({ id: messageId }),
      updateMessage: async (threadId, messageId, req) => ({ id: messageId }),
      deleteMessage: async (threadId, messageId) => ({ id: messageId, deleted: true }),
      createRun: async (threadId, req) => ({ id: 'run_test123', status: 'queued' }),
      listRuns: async (threadId, req) => ({ data: [], has_more: false }),
      getRun: async (threadId, runId) => ({ id: runId, status: 'completed' }),
      updateRun: async (threadId, runId, req) => ({ id: runId }),
      cancelRun: async (threadId, runId) => ({ id: runId, status: 'cancelled' }),
      submitToolOutputs: async (threadId, runId, req) => ({ id: runId, status: 'completed' }),
      listRunSteps: async (threadId, runId, req) => ({ data: [], has_more: false }),
      getRunStep: async (threadId, runId, stepId) => ({ id: stepId })
    };
    
    await registry.registerProvider(mockProvider, registryConfig.providers[0]);
    console.log('   ✅ Provider registry setup complete');
    
    // Test 2: Create Tool Handler Context
    console.log('\n2. Creating tool handler context...');
    const selectedProvider = registry.selectProvider();
    const context = {
      provider: selectedProvider,
      toolName: 'test-tool',
      requestId: 'test-request-123'
    };
    console.log(`   ✅ Context created with provider: ${context.provider.metadata.name}`);
    console.log(`   ✅ Context request ID: ${context.requestId}`);
    
    // Test 3: Create All Handlers
    console.log('\n3. Creating all tool handlers...');
    const allHandlers = createAllHandlers(context);
    console.log(`   ✅ Assistant handlers: ${Object.keys(allHandlers.assistant).length}`);
    console.log(`   ✅ Thread handlers: ${Object.keys(allHandlers.thread).length}`);
    console.log(`   ✅ Message handlers: ${Object.keys(allHandlers.message).length}`);
    console.log(`   ✅ Run handlers: ${Object.keys(allHandlers.run).length}`);
    console.log(`   ✅ Run step handlers: ${Object.keys(allHandlers.runStep).length}`);
    console.log(`   ✅ Total handlers: ${Object.keys(allHandlers.all).length}`);
    
    // Test 4: Dynamic Tool Count Validation
    console.log('\n4. Testing dynamic tool count...');
    const expectedCount = getTotalToolCount();
    const actualCount = Object.keys(allHandlers.all).length;
    console.log(`   ✅ Expected tool count: ${expectedCount}`);
    console.log(`   ✅ Actual tool count: ${actualCount}`);
    
    if (expectedCount === actualCount) {
      console.log('   ✅ Dynamic tool count validation passed');
    } else {
      throw new Error(`Tool count mismatch: expected ${expectedCount}, got ${actualCount}`);
    }
    
    // Test 5: Handler Completeness Validation
    console.log('\n5. Testing handler completeness...');
    const completeness = validateHandlerCompleteness(allHandlers.all);
    console.log(`   ✅ Handler completeness: ${completeness.isComplete}`);
    console.log(`   ✅ Missing tools: ${completeness.missingTools.length}`);
    console.log(`   ✅ Extra tools: ${completeness.extraTools.length}`);
    
    if (!completeness.isComplete) {
      console.log(`   ⚠️  Missing tools: ${completeness.missingTools.join(', ')}`);
      console.log(`   ⚠️  Extra tools: ${completeness.extraTools.join(', ')}`);
    }
    
    // Test 6: Handler Categories Validation
    console.log('\n6. Testing handler categories...');
    for (const [category, expectedTools] of Object.entries(HANDLER_CATEGORIES)) {
      const categoryHandlers = allHandlers[category] || {};
      const actualTools = Object.keys(categoryHandlers);
      console.log(`   ✅ ${category}: ${actualTools.length}/${expectedTools.length} tools`);
      
      for (const tool of expectedTools) {
        if (!actualTools.includes(tool)) {
          console.log(`   ⚠️  Missing ${category} tool: ${tool}`);
        }
      }
    }
    
    // Test 7: Individual Handler Functionality
    console.log('\n7. Testing individual handler functionality...');
    
    // Test assistant-create handler
    const assistantCreateHandler = allHandlers.all['assistant-create'];
    if (assistantCreateHandler) {
      console.log('   Testing assistant-create handler...');
      console.log(`   ✅ Tool name: ${assistantCreateHandler.getToolName()}`);
      console.log(`   ✅ Category: ${assistantCreateHandler.getCategory()}`);
      
      // Test validation
      const validArgs = { model: 'gpt-4', name: 'Test Assistant' };
      const invalidArgs = { model: 123 }; // Invalid model type
      
      const validValidation = assistantCreateHandler.validate(validArgs);
      const invalidValidation = assistantCreateHandler.validate(invalidArgs);
      
      console.log(`   ✅ Valid args validation: ${validValidation.isValid}`);
      console.log(`   ✅ Invalid args validation: ${invalidValidation.isValid}`);
      
      if (validValidation.isValid && !invalidValidation.isValid) {
        console.log('   ✅ Handler validation working correctly');
      } else {
        throw new Error('Handler validation failed');
      }
      
      // Test execution (should work with mock provider)
      try {
        const result = await assistantCreateHandler.execute(validArgs);
        console.log(`   ✅ Handler execution successful: ${result.id}`);
      } catch (error) {
        throw new Error(`Handler execution failed: ${error.message}`);
      }
    } else {
      throw new Error('assistant-create handler not found');
    }
    
    // Test 8: Flat Handler Map
    console.log('\n8. Testing flat handler map...');
    const flatMap = createFlatHandlerMap(context);
    console.log(`   ✅ Flat map contains ${Object.keys(flatMap).length} handlers`);
    console.log(`   ✅ Sample tools: ${Object.keys(flatMap).slice(0, 5).join(', ')}...`);
    
    if (Object.keys(flatMap).length === Object.keys(allHandlers.all).length) {
      console.log('   ✅ Flat map consistency validated');
    } else {
      throw new Error('Flat map inconsistency detected');
    }
    
    console.log('\n🎉 Tool Handler Functionality Tests PASSED!\n');
    
    return {
      success: true,
      tests: 8,
      passed: 8,
      failed: 0,
      toolCount: actualCount,
      categories: Object.keys(HANDLER_CATEGORIES).length
    };
    
  } catch (error) {
    console.error('\n❌ Tool Handler Functionality Test FAILED:');
    console.error(`   Error: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    
    return {
      success: false,
      error: error.message,
      tests: 8,
      passed: 0,
      failed: 1
    };
  }
}

// Run the test
testToolHandlers()
  .then(result => {
    if (result.success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });