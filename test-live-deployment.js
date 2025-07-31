#!/usr/bin/env node

/**
 * Live Deployment Test for OpenAI Assistants MCP Server
 * Tests the deployed Cloudflare Worker
 */

const WORKER_URL = 'https://openai-assistants-mcp.jezweb.ai';
const TEST_API_KEY = 'test-api-key-12345';

async function testMCPEndpoint(method, params = {}) {
  const url = `${WORKER_URL}/mcp/${TEST_API_KEY}`;
  
  const payload = {
    jsonrpc: '2.0',
    id: Math.floor(Math.random() * 1000),
    method,
    params
  };

  console.log(`\n🧪 Testing ${method}...`);
  console.log(`URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.error(`❌ Error testing ${method}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing Live Deployment of OpenAI Assistants MCP Server');
  console.log(`Worker URL: ${WORKER_URL}`);
  console.log('=' .repeat(60));

  const results = [];

  // Test 1: Initialize
  const initResult = await testMCPEndpoint('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'live-test-client',
      version: '1.0.0'
    }
  });
  results.push({ test: 'initialize', ...initResult });

  // Test 2: Tools List
  const toolsResult = await testMCPEndpoint('tools/list', {});
  results.push({ test: 'tools/list', ...toolsResult });

  // Test 3: Invalid Method (should return error)
  const invalidResult = await testMCPEndpoint('invalid-method', {});
  results.push({ test: 'invalid-method', ...invalidResult });

  // Test 4: API Key validation (invalid key)
  console.log('\n🧪 Testing API Key Validation...');
  try {
    const invalidKeyUrl = `${WORKER_URL}/mcp/invalid-key`;
    const response = await fetch(invalidKeyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {}
      })
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    results.push({ 
      test: 'api-key-validation', 
      success: response.status === 401, 
      data, 
      status: response.status 
    });
  } catch (error) {
    console.error('❌ Error testing API key validation:', error.message);
    results.push({ test: 'api-key-validation', success: false, error: error.message });
  }

  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  
  let passed = 0;
  let total = results.length;
  
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.test} (Status: ${result.status || 'N/A'})`);
    if (result.success) passed++;
  });
  
  console.log(`\nResults: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Deployment is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the output above.');
  }

  return passed === total;
}

// Run the tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});