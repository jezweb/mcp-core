/**
 * Foundation Test - Basic test to verify the handler system works
 * 
 * This test validates that:
 * - All handlers can be instantiated
 * - The registry can be set up correctly
 * - Basic validation and execution flow works
 * - No critical import or type errors exist
 * 
 * Run this test to verify Phase 1 foundation is ready.
 */

import { setupHandlerSystem, SYSTEM_INFO, validateHandlerCompleteness } from './core/index.js';
import { OpenAIService } from './services/index.js';

/**
 * Mock OpenAI service for testing
 */
class MockOpenAIService extends OpenAIService {
  constructor() {
    super('test-api-key');
  }

  // Override methods to return mock data instead of making real API calls
  async createAssistant(request: any): Promise<any> {
    return {
      id: 'asst_test123',
      object: 'assistant',
      created_at: Date.now(),
      name: request.name || 'Test Assistant',
      model: request.model,
      instructions: request.instructions || null,
      tools: request.tools || [],
      metadata: request.metadata || {}
    };
  }

  async listAssistants(request: any = {}): Promise<any> {
    return {
      object: 'list',
      data: [],
      first_id: null,
      last_id: null,
      has_more: false
    };
  }

  // Add other mock methods as needed for testing
}

/**
 * Test the foundation setup
 */
async function testFoundation(): Promise<void> {
  console.log('🧪 Testing Handler System Foundation...');
  console.log('📊 System Info:', SYSTEM_INFO);

  try {
    // Step 1: Create mock context
    const mockOpenAIService = new MockOpenAIService();
    const context = {
      openaiService: mockOpenAIService,
      toolName: 'test',
      requestId: 'test-123'
    };

    console.log('✅ Step 1: Mock context created');

    // Step 2: Setup handler system
    const registry = setupHandlerSystem(context);
    console.log('✅ Step 2: Handler system setup complete');

    // Step 3: Verify all handlers are registered
    const stats = registry.getStats();
    console.log('📈 Registry Stats:', stats);

    if (stats.totalHandlers !== SYSTEM_INFO.totalHandlers) {
      throw new Error(`Expected ${SYSTEM_INFO.totalHandlers} handlers, got ${stats.totalHandlers}`);
    }
    console.log('✅ Step 3: All handlers registered correctly');

    // Step 4: Test a simple handler execution (assistant-create)
    const testArgs = {
      model: 'gpt-4',
      name: 'Test Assistant',
      instructions: 'You are a helpful test assistant.'
    };

    const result = await registry.execute('assistant-create', testArgs);
    console.log('📝 Test execution result:', result);

    if (!result.id || !result.id.startsWith('asst_')) {
      throw new Error('Invalid assistant creation result');
    }
    console.log('✅ Step 4: Handler execution successful');

    // Step 5: Test validation error handling
    try {
      await registry.execute('assistant-create', { model: 'invalid-model' });
      throw new Error('Should have thrown validation error');
    } catch (error: any) {
      if (error.message.includes('Invalid model')) {
        console.log('✅ Step 5: Validation error handling works');
      } else {
        throw error;
      }
    }

    // Step 6: Test unknown tool handling
    try {
      await registry.execute('unknown-tool', {});
      throw new Error('Should have thrown unknown tool error');
    } catch (error: any) {
      if (error.message.includes('Tool not found')) {
        console.log('✅ Step 6: Unknown tool error handling works');
      } else {
        throw error;
      }
    }

    console.log('🎉 Foundation test completed successfully!');
    console.log('🚀 Phase 1 architecture is ready for tool handler extraction.');

  } catch (error) {
    console.error('❌ Foundation test failed:', error);
    throw error;
  }
}

/**
 * Run the test if this file is executed directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  testFoundation().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export { testFoundation };