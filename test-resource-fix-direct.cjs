#!/usr/bin/env node

/**
 * Direct test of the resource fix without requiring OpenAI API key
 * 
 * This test directly tests the BaseMCPHandler to verify the fix works
 * without needing to go through the full server setup.
 */

const path = require('path');

// Mock the OpenAI service to avoid API key requirements
class MockOpenAIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }
}

// Set up the path to import the shared modules
const projectRoot = path.join(__dirname);

async function testResourceFixDirect() {
  console.log('🧪 Testing Resource Fix Directly...\n');

  try {
    // Import the required modules
    const { BaseMCPHandler } = await import('./shared/core/base-mcp-handler.js');
    const { getResource, getResourceContent } = await import('./shared/resources/index.js');

    console.log('📋 Testing: Resource Content Retrieval');

    // Test the getResourceContent function directly
    const testUris = [
      'assistant://templates/coding-assistant',
      'docs://openai-assistants-api',
      'docs://best-practices'
    ];

    let allTestsPassed = true;

    for (const uri of testUris) {
      console.log(`\n🔍 Testing resource: ${uri}`);
      
      // Test getResource function
      const resource = getResource(uri);
      if (resource) {
        console.log(`   ✅ Resource metadata found: ${resource.name}`);
        console.log(`   ✅ MIME type: ${resource.mimeType}`);
      } else {
        console.log(`   ❌ Resource metadata not found`);
        allTestsPassed = false;
        continue;
      }

      // Test getResourceContent function (this is the key fix)
      const content = getResourceContent(uri);
      if (content !== undefined && content !== null) {
        const contentLength = typeof content === 'string' ? content.length : JSON.stringify(content).length;
        console.log(`   ✅ Resource content retrieved (${contentLength} chars)`);
        console.log(`   ✅ Content type: ${typeof content}`);
        
        // Show a preview of the content
        if (typeof content === 'string') {
          const preview = content.substring(0, 100).replace(/\n/g, ' ');
          console.log(`   📄 Content preview: "${preview}..."`);
        } else {
          console.log(`   📄 Content is object with keys: ${Object.keys(content).join(', ')}`);
        }
      } else {
        console.log(`   ❌ Resource content is undefined/null - FIX FAILED!`);
        allTestsPassed = false;
      }
    }

    console.log('\n📋 Testing: BaseMCPHandler Resource Read Method');

    // Create a mock handler to test the handleResourcesRead method
    const mockConfig = {
      apiKey: 'test-key',
      serverName: 'test-server',
      debug: true
    };

    // Mock the OpenAI service
    const originalOpenAIService = (await import('./shared/services/index.js')).OpenAIService;
    
    // Create handler with mock
    const handler = new BaseMCPHandler(mockConfig);

    // Test the handleResourcesRead method directly
    const testUri = 'assistant://templates/coding-assistant';
    const mockRequest = {
      jsonrpc: '2.0',
      id: 'test-123',
      method: 'resources/read',
      params: { uri: testUri }
    };

    try {
      const response = await handler.handleResourcesRead(mockRequest);
      
      console.log(`\n🔍 Testing handleResourcesRead for: ${testUri}`);
      
      if (response && response.result && response.result.contents && response.result.contents.length > 0) {
        const content = response.result.contents[0];
        
        console.log(`   ✅ Response structure is valid`);
        console.log(`   ✅ Contents array has ${response.result.contents.length} item(s)`);
        
        if (content.text !== undefined && content.text !== null) {
          const textLength = typeof content.text === 'string' ? content.text.length : JSON.stringify(content.text).length;
          console.log(`   ✅ content.text is defined (${textLength} chars)`);
          console.log(`   ✅ content.text type: ${typeof content.text}`);
          console.log(`   🎉 SUCCESS: The fix is working! content.text is no longer undefined`);
        } else {
          console.log(`   ❌ content.text is undefined/null - FIX FAILED!`);
          allTestsPassed = false;
        }

        if (content.uri === testUri) {
          console.log(`   ✅ URI matches: ${content.uri}`);
        } else {
          console.log(`   ❌ URI mismatch: expected ${testUri}, got ${content.uri}`);
          allTestsPassed = false;
        }

        if (content.mimeType) {
          console.log(`   ✅ MIME type present: ${content.mimeType}`);
        } else {
          console.log(`   ❌ MIME type missing`);
          allTestsPassed = false;
        }
      } else {
        console.log(`   ❌ Invalid response structure`);
        console.log(`   📄 Response:`, JSON.stringify(response, null, 2));
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ Error testing handleResourcesRead: ${error.message}`);
      console.log(`   📄 Error details:`, error);
      allTestsPassed = false;
    }

    // Final results
    console.log('\n📊 Direct Resource Fix Test Results:');
    console.log('====================================');
    
    if (allTestsPassed) {
      console.log('🎉 All tests passed! The resource validation fix is working correctly.');
      console.log('✅ GitHub issue #1 has been resolved:');
      console.log('   - getResourceContent() now returns actual content instead of undefined');
      console.log('   - contents[0].text is properly populated in MCP responses');
      console.log('   - Zod validation errors should no longer occur');
      process.exit(0);
    } else {
      console.log('💥 Some tests failed. The fix may need additional work.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Direct test failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

testResourceFixDirect().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});