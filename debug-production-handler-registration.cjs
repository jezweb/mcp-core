#!/usr/bin/env node

/**
 * Debug Production Handler Registration
 * 
 * This script tests the production Cloudflare Worker deployment to identify
 * where handler registration is failing. It will help us understand why only
 * 10 tools are showing instead of the expected 22.
 */

const https = require('https');

const CLOUDFLARE_WORKER_URL = 'https://openai-assistants-mcp.jezweb.ai/mcp';

async function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData, error: error.message });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function testProduction() {
  console.log('🔍 Testing Production Cloudflare Worker Handler Registration');
  console.log('='.repeat(70));
  
  try {
    // Test 1: Initialize request
    console.log('\n1. Testing initialize request...');
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        clientInfo: { name: 'debug-client', version: '1.0.0' }
      }
    };

    const initResponse = await makeRequest(`${CLOUDFLARE_WORKER_URL}/test-key`, initRequest);
    console.log('   Status:', initResponse.status);
    console.log('   Response:', JSON.stringify(initResponse.data, null, 2));

    if (initResponse.status !== 200) {
      console.error('❌ Initialize request failed');
      return;
    }

    // Test 2: Tools list request
    console.log('\n2. Testing tools/list request...');
    const toolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    };

    const toolsResponse = await makeRequest(`${CLOUDFLARE_WORKER_URL}/test-key`, toolsRequest);
    console.log('   Status:', toolsResponse.status);
    
    if (toolsResponse.data && toolsResponse.data.result && toolsResponse.data.result.tools) {
      const tools = toolsResponse.data.result.tools;
      console.log(`   Found ${tools.length} tools:`);
      
      // Group tools by category
      const toolsByCategory = {};
      tools.forEach(tool => {
        // Extract category from tool name (e.g., 'assistant-create' -> 'assistant')
        const category = tool.name.split('-')[0];
        if (!toolsByCategory[category]) {
          toolsByCategory[category] = [];
        }
        toolsByCategory[category].push(tool.name);
      });
      
      console.log('\n   Tools by category:');
      Object.entries(toolsByCategory).forEach(([category, toolNames]) => {
        console.log(`     ${category}: ${toolNames.length} tools`);
        toolNames.forEach(name => console.log(`       - ${name}`));
      });
      
      // Check for missing categories
      const expectedCategories = ['assistant', 'thread', 'message', 'run', 'run-step'];
      const missingCategories = expectedCategories.filter(cat => !toolsByCategory[cat]);
      
      if (missingCategories.length > 0) {
        console.log('\n   ❌ Missing categories:', missingCategories);
      } else {
        console.log('\n   ✅ All expected categories present');
      }
      
      // Expected tool counts
      const expectedCounts = {
        assistant: 5,
        thread: 4,
        message: 5,
        run: 6,
        'run-step': 2
      };
      
      console.log('\n   Expected vs Actual counts:');
      Object.entries(expectedCounts).forEach(([category, expected]) => {
        const actual = toolsByCategory[category]?.length || 0;
        const status = actual === expected ? '✅' : '❌';
        console.log(`     ${status} ${category}: ${actual}/${expected}`);
      });
      
    } else {
      console.error('❌ No tools found in response');
      console.log('   Full response:', JSON.stringify(toolsResponse.data, null, 2));
    }

    // Test 3: Resources list request
    console.log('\n3. Testing resources/list request...');
    const resourcesRequest = {
      jsonrpc: '2.0',
      id: 3,
      method: 'resources/list',
      params: {}
    };

    const resourcesResponse = await makeRequest(`${CLOUDFLARE_WORKER_URL}/test-key`, resourcesRequest);
    console.log('   Status:', resourcesResponse.status);
    
    if (resourcesResponse.data && resourcesResponse.data.result && resourcesResponse.data.result.resources) {
      const resources = resourcesResponse.data.result.resources;
      console.log(`   Found ${resources.length} resources:`);
      resources.forEach((resource, i) => {
        console.log(`     ${i + 1}. ${resource.uri} - ${resource.name}`);
      });
    } else {
      console.error('❌ No resources found in response');
      console.log('   Full response:', JSON.stringify(resourcesResponse.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error testing production:', error.message);
  }
}

// Run the test
testProduction().then(() => {
  console.log('\n🏁 Production testing complete');
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});