#!/usr/bin/env node

const https = require('https');

console.log('🔍 Testing Production Deployment Counts (Corrected JSON-RPC)');
console.log('='.repeat(60));

// Test key for production endpoint
const TEST_KEY = 'test-key';
const BASE_URL = `https://openai-assistants-mcp.jezweb.ai/mcp/${TEST_KEY}`;

function makeJsonRpcRequest(method, params = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      jsonrpc: '2.0',
      id: Math.random(),
      method: method,
      params: params
    });

    const options = {
      hostname: 'openai-assistants-mcp.jezweb.ai',
      port: 443,
      path: `/mcp/${TEST_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`\n📡 JSON-RPC Request: ${method}`);
    console.log(`   URL: ${BASE_URL}`);
    console.log(`   Method: POST`);
    console.log(`   Payload: ${postData}`);
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, error: e.message });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

async function testProductionJsonRpc() {
  try {
    // Test tools/list
    console.log('\n1. Testing tools/list via JSON-RPC...');
    const toolsResponse = await makeJsonRpcRequest('tools/list');
    console.log(`   Status: ${toolsResponse.status}`);
    
    if (toolsResponse.data && toolsResponse.data.result && toolsResponse.data.result.tools) {
      console.log(`   ✅ Tools found: ${toolsResponse.data.result.tools.length}`);
      console.log(`   Tool names: ${toolsResponse.data.result.tools.map(t => t.name).slice(0, 5).join(', ')}${toolsResponse.data.result.tools.length > 5 ? '...' : ''}`);
    } else if (toolsResponse.data && toolsResponse.data.error) {
      console.log(`   ❌ JSON-RPC Error: ${toolsResponse.data.error.message}`);
      console.log(`   Error Code: ${toolsResponse.data.error.code}`);
    } else {
      console.log(`   ❌ Unexpected response format`);
      console.log(`   Response: ${JSON.stringify(toolsResponse.data, null, 2).substring(0, 500)}...`);
    }

    // Test resources/list
    console.log('\n2. Testing resources/list via JSON-RPC...');
    const resourcesResponse = await makeJsonRpcRequest('resources/list');
    console.log(`   Status: ${resourcesResponse.status}`);
    
    if (resourcesResponse.data && resourcesResponse.data.result && resourcesResponse.data.result.resources) {
      console.log(`   ✅ Resources found: ${resourcesResponse.data.result.resources.length}`);
      console.log(`   Resource URIs: ${resourcesResponse.data.result.resources.map(r => r.uri).slice(0, 5).join(', ')}${resourcesResponse.data.result.resources.length > 5 ? '...' : ''}`);
    } else if (resourcesResponse.data && resourcesResponse.data.error) {
      console.log(`   ❌ JSON-RPC Error: ${resourcesResponse.data.error.message}`);
      console.log(`   Error Code: ${resourcesResponse.data.error.code}`);
    } else {
      console.log(`   ❌ Unexpected response format`);
      console.log(`   Response: ${JSON.stringify(resourcesResponse.data, null, 2).substring(0, 500)}...`);
    }

    // Test a specific resource
    console.log('\n3. Testing specific resource access via JSON-RPC...');
    const specificResourceResponse = await makeJsonRpcRequest('resources/read', {
      uri: 'assistant://templates/coding-assistant'
    });
    console.log(`   Status: ${specificResourceResponse.status}`);
    
    if (specificResourceResponse.data && specificResourceResponse.data.result) {
      console.log(`   ✅ Resource content loaded: ${specificResourceResponse.data.result.contents ? 'Yes' : 'No'}`);
      if (specificResourceResponse.data.result.contents && specificResourceResponse.data.result.contents[0]) {
        console.log(`   Content type: ${specificResourceResponse.data.result.contents[0].mimeType}`);
        console.log(`   Content length: ${specificResourceResponse.data.result.contents[0].text ? specificResourceResponse.data.result.contents[0].text.length : 'N/A'} chars`);
      }
    } else if (specificResourceResponse.data && specificResourceResponse.data.error) {
      console.log(`   ❌ JSON-RPC Error: ${specificResourceResponse.data.error.message}`);
    } else {
      console.log(`   ❌ No resource content found`);
    }

    // Summary
    console.log('\n📊 PRODUCTION DEPLOYMENT SUMMARY (JSON-RPC)');
    console.log('='.repeat(60));
    const toolsCount = toolsResponse.data?.result?.tools?.length;
    const resourcesCount = resourcesResponse.data?.result?.resources?.length;
    
    console.log(`Tools count: ${toolsCount || 'ERROR'} (Expected: 22)`);
    console.log(`Resources count: ${resourcesCount || 'ERROR'} (Expected: 13)`);
    
    const toolsMatch = toolsCount === 22;
    const resourcesMatch = resourcesCount === 13;
    
    if (toolsMatch && resourcesMatch) {
      console.log('✅ Production counts match expected values!');
    } else {
      console.log('❌ Production counts DO NOT match expected values!');
      console.log(`   Tools: ${toolsMatch ? '✅' : '❌'} (${toolsCount || 'ERROR'}/22)`);
      console.log(`   Resources: ${resourcesMatch ? '✅' : '❌'} (${resourcesCount || 'ERROR'}/13)`);
    }

    // Additional debugging info
    if (toolsResponse.data?.error || resourcesResponse.data?.error) {
      console.log('\n🔍 ERROR DETAILS:');
      if (toolsResponse.data?.error) {
        console.log(`   Tools Error: ${JSON.stringify(toolsResponse.data.error, null, 2)}`);
      }
      if (resourcesResponse.data?.error) {
        console.log(`   Resources Error: ${JSON.stringify(resourcesResponse.data.error, null, 2)}`);
      }
    }

  } catch (error) {
    console.error('❌ Error testing production:', error.message);
  }
}

testProductionJsonRpc();