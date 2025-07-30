/**
 * Test MCP Resources functionality
 * 
 * This test verifies that both implementations correctly handle MCP resources
 * including listing resources and reading resource content.
 */

import { MCPHandler } from '../../src/mcp-handler.js';
import { MCPHandler as NPMHandler } from '../../npm-package/src/mcp-handler.js';

// Test data
const testRequests = {
  initialize: {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      clientInfo: { name: 'test-client', version: '1.0.0' }
    }
  },
  resourcesList: {
    jsonrpc: '2.0',
    id: 2,
    method: 'resources/list',
    params: {}
  },
  resourcesRead: {
    jsonrpc: '2.0',
    id: 3,
    method: 'resources/read',
    params: {
      uri: 'assistant://templates/coding-assistant'
    }
  },
  resourcesReadInvalid: {
    jsonrpc: '2.0',
    id: 4,
    method: 'resources/read',
    params: {
      uri: 'invalid://resource/uri'
    }
  }
};

async function testResourceFunctionality() {
  console.log('🧪 Testing MCP Resources Functionality...\n');

  // Test Cloudflare Workers implementation
  console.log('📦 Testing Cloudflare Workers Implementation:');
  const cloudflareHandler = new MCPHandler('test-api-key');
  
  try {
    // Test initialize with resources capability
    const initResponse = await cloudflareHandler.handleRequest(testRequests.initialize);
    console.log('✅ Initialize response includes resources capability:', 
      !!initResponse.result?.capabilities?.resources);

    // Test resources list
    const listResponse = await cloudflareHandler.handleRequest(testRequests.resourcesList);
    console.log('✅ Resources list returned', listResponse.result?.resources?.length, 'resources');
    
    // Verify expected resources are present
    const resources = listResponse.result?.resources || [];
    const expectedResources = [
      'assistant://templates/coding-assistant',
      'assistant://templates/writing-assistant',
      'examples://workflows/create-and-run',
      'docs://openai-assistants-api'
    ];
    
    const foundResources = expectedResources.filter(uri => 
      resources.some(r => r.uri === uri)
    );
    console.log('✅ Found', foundResources.length, 'of', expectedResources.length, 'expected resources');

    // Test resource read
    const readResponse = await cloudflareHandler.handleRequest(testRequests.resourcesRead);
    console.log('✅ Resource read successful, content type:', 
      readResponse.result?.contents?.[0]?.mimeType);
    
    // Test invalid resource read
    const invalidReadResponse = await cloudflareHandler.handleRequest(testRequests.resourcesReadInvalid);
    console.log('✅ Invalid resource correctly returns error:', 
      !!invalidReadResponse.error);

  } catch (error) {
    console.error('❌ Cloudflare Workers implementation error:', error.message);
  }

  console.log('\n📦 Testing NPM Package Implementation:');
  
  // Test NPM package implementation (direct mode)
  const npmHandler = new NPMHandler('direct-test-key');
  
  try {
    // Test initialize with resources capability
    const initResponse = await npmHandler.handleRequest(testRequests.initialize);
    console.log('✅ Initialize response includes resources capability:', 
      !!initResponse.result?.capabilities?.resources);

    // Test resources list
    const listResponse = await npmHandler.handleRequest(testRequests.resourcesList);
    console.log('✅ Resources list returned', listResponse.result?.resources?.length, 'resources');
    
    // Test resource read
    const readResponse = await npmHandler.handleRequest(testRequests.resourcesRead);
    console.log('✅ Resource read successful, content type:', 
      readResponse.result?.contents?.[0]?.mimeType);
    
    // Test invalid resource read
    const invalidReadResponse = await npmHandler.handleRequest(testRequests.resourcesReadInvalid);
    console.log('✅ Invalid resource correctly returns error:', 
      !!invalidReadResponse.error);

  } catch (error) {
    console.error('❌ NPM package implementation error:', error.message);
  }

  console.log('\n🔍 Testing Resource Content Quality:');
  
  try {
    // Test specific resource content
    const codingAssistantResponse = await cloudflareHandler.handleRequest(testRequests.resourcesRead);
    const content = codingAssistantResponse.result?.contents?.[0]?.text;
    
    if (content) {
      const parsedContent = JSON.parse(content);
      console.log('✅ Coding assistant template includes:');
      console.log('  - Model:', parsedContent.model);
      console.log('  - Name:', parsedContent.name);
      console.log('  - Tools:', parsedContent.tools?.length || 0, 'tools');
      console.log('  - Instructions length:', parsedContent.instructions?.length || 0, 'characters');
    }

    // Test workflow example
    const workflowRequest = {
      ...testRequests.resourcesRead,
      params: { uri: 'examples://workflows/create-and-run' }
    };
    const workflowResponse = await cloudflareHandler.handleRequest(workflowRequest);
    const workflowContent = workflowResponse.result?.contents?.[0]?.text;
    
    if (workflowContent) {
      console.log('✅ Workflow example includes:');
      console.log('  - Content length:', workflowContent.length, 'characters');
      console.log('  - Contains steps:', workflowContent.includes('Step 1:'));
      console.log('  - Contains JSON examples:', workflowContent.includes('```json'));
    }

  } catch (error) {
    console.error('❌ Resource content test error:', error.message);
  }

  console.log('\n✨ Resource functionality testing complete!');
}

// Run the test
testResourceFunctionality().catch(console.error);

export { testResourceFunctionality };