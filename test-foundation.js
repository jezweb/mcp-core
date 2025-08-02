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
import { setupHandlerSystem, SYSTEM_INFO } from './core/index.js';
/**
 * Mock LLM Provider for testing
 */
class MockLLMProvider {
    metadata = {
        name: 'mock-provider',
        displayName: 'Mock Provider',
        version: '1.0.0',
        description: 'Mock provider for testing',
        capabilities: {
            assistants: true,
            threads: true,
            messages: true,
            runs: true,
            runSteps: true,
        }
    };
    async initialize(config) {
        // Mock initialization
    }
    async validateConnection() {
        return true;
    }
    async createAssistant(request) {
        return {
            id: 'asst_test123',
            name: request.name || 'Test Assistant',
            description: request.description || null,
            model: request.model,
            instructions: request.instructions || null,
            tools: request.tools || [],
            metadata: request.metadata || {},
            createdAt: new Date(),
            providerData: {}
        };
    }
    async listAssistants(request = {}) {
        return {
            data: [],
            hasMore: false
        };
    }
    async getAssistant(assistantId) {
        return {
            id: assistantId,
            name: 'Test Assistant',
            description: null,
            model: 'gpt-4',
            instructions: null,
            tools: [],
            metadata: {},
            createdAt: new Date(),
            providerData: {}
        };
    }
    async updateAssistant(assistantId, request) {
        return {
            id: assistantId,
            name: request.name || 'Updated Assistant',
            description: request.description || null,
            model: request.model || 'gpt-4',
            instructions: request.instructions || null,
            tools: request.tools || [],
            metadata: request.metadata || {},
            createdAt: new Date(),
            updatedAt: new Date(),
            providerData: {}
        };
    }
    async deleteAssistant(assistantId) {
        return { id: assistantId, deleted: true };
    }
    async createThread(request = {}) {
        return {
            id: 'thread_test123',
            metadata: request.metadata || {},
            createdAt: new Date(),
            providerData: {}
        };
    }
    async getThread(threadId) {
        return {
            id: threadId,
            metadata: {},
            createdAt: new Date(),
            providerData: {}
        };
    }
    async updateThread(threadId, request) {
        return {
            id: threadId,
            metadata: request.metadata || {},
            createdAt: new Date(),
            updatedAt: new Date(),
            providerData: {}
        };
    }
    async deleteThread(threadId) {
        return { id: threadId, deleted: true };
    }
    async createMessage(threadId, request) {
        return {
            id: 'msg_test123',
            threadId,
            role: request.role,
            content: Array.isArray(request.content) ? request.content : [{ type: 'text', text: request.content }],
            metadata: request.metadata || {},
            createdAt: new Date(),
            providerData: {}
        };
    }
    async listMessages(threadId, request = {}) {
        return {
            data: [],
            hasMore: false
        };
    }
    async getMessage(threadId, messageId) {
        return {
            id: messageId,
            threadId,
            role: 'user',
            content: [{ type: 'text', text: 'Test message' }],
            metadata: {},
            createdAt: new Date(),
            providerData: {}
        };
    }
    async updateMessage(threadId, messageId, request) {
        return {
            id: messageId,
            threadId,
            role: 'user',
            content: [{ type: 'text', text: 'Updated message' }],
            metadata: request.metadata || {},
            createdAt: new Date(),
            updatedAt: new Date(),
            providerData: {}
        };
    }
    async deleteMessage(threadId, messageId) {
        return { id: messageId, deleted: true };
    }
    async createRun(threadId, request) {
        return {
            id: 'run_test123',
            threadId,
            assistantId: request.assistantId,
            status: 'completed',
            model: request.model || 'gpt-4',
            instructions: request.instructions || '',
            tools: request.tools || [],
            metadata: request.metadata || {},
            createdAt: new Date(),
            completedAt: new Date(),
            providerData: {}
        };
    }
    async listRuns(threadId, request = {}) {
        return {
            data: [],
            hasMore: false
        };
    }
    async getRun(threadId, runId) {
        return {
            id: runId,
            threadId,
            assistantId: 'asst_test123',
            status: 'completed',
            model: 'gpt-4',
            instructions: '',
            tools: [],
            metadata: {},
            createdAt: new Date(),
            completedAt: new Date(),
            providerData: {}
        };
    }
    async updateRun(threadId, runId, request) {
        return {
            id: runId,
            threadId,
            assistantId: 'asst_test123',
            status: 'completed',
            model: 'gpt-4',
            instructions: '',
            tools: [],
            metadata: request.metadata || {},
            createdAt: new Date(),
            completedAt: new Date(),
            providerData: {}
        };
    }
    async cancelRun(threadId, runId) {
        return {
            id: runId,
            threadId,
            assistantId: 'asst_test123',
            status: 'cancelled',
            model: 'gpt-4',
            instructions: '',
            tools: [],
            metadata: {},
            createdAt: new Date(),
            cancelledAt: new Date(),
            providerData: {}
        };
    }
    async submitToolOutputs(threadId, runId, request) {
        return {
            id: runId,
            threadId,
            assistantId: 'asst_test123',
            status: 'completed',
            model: 'gpt-4',
            instructions: '',
            tools: [],
            metadata: {},
            createdAt: new Date(),
            completedAt: new Date(),
            providerData: {}
        };
    }
    async listRunSteps(threadId, runId, request = {}) {
        return {
            data: [],
            hasMore: false
        };
    }
    async getRunStep(threadId, runId, stepId) {
        return {
            id: stepId,
            runId,
            threadId,
            assistantId: 'asst_test123',
            type: 'message_creation',
            status: 'completed',
            stepDetails: {},
            createdAt: new Date(),
            completedAt: new Date(),
            metadata: {},
            providerData: {}
        };
    }
    async handleUnsupportedOperation(operation, ...args) {
        throw new Error(`Unsupported operation: ${operation}`);
    }
}
/**
 * Test the foundation setup
 */
async function testFoundation() {
    console.log('🧪 Testing Handler System Foundation...');
    console.log('📊 System Info:', SYSTEM_INFO);
    try {
        // Step 1: Create mock context
        const mockProvider = new MockLLMProvider();
        const context = {
            provider: mockProvider,
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
        }
        catch (error) {
            if (error.message.includes('Invalid model')) {
                console.log('✅ Step 5: Validation error handling works');
            }
            else {
                throw error;
            }
        }
        // Step 6: Test unknown tool handling
        try {
            await registry.execute('unknown-tool', {});
            throw new Error('Should have thrown unknown tool error');
        }
        catch (error) {
            if (error.message.includes('Tool not found')) {
                console.log('✅ Step 6: Unknown tool error handling works');
            }
            else {
                throw error;
            }
        }
        console.log('🎉 Foundation test completed successfully!');
        console.log('🚀 Phase 1 architecture is ready for tool handler extraction.');
    }
    catch (error) {
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
