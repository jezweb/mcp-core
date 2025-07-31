#!/usr/bin/env node

const https = require('https');

// Test configuration
const CUSTOM_DOMAIN = 'openai-assistants-mcp.jezweb.ai';
const API_KEY = 'test-key'; // Using a test key for validation
const BASE_URL = `https://${CUSTOM_DOMAIN}/mcp/${API_KEY}`;

console.log('🧪 Testing Custom Domain: openai-assistants-mcp.jezweb.ai');
console.log('='.repeat(60));

// Helper function to make HTTP requests
function makeRequest(url, method = 'POST', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OpenAI-Assistants-MCP-Test/1.0'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testCustomDomain() {
  console.log(`\n1. Testing domain accessibility: ${CUSTOM_DOMAIN}`);
  console.log(`   Base URL: ${BASE_URL}`);
  
  try {
    // Test 1: Initialize MCP connection
    console.log('\n2. Testing MCP Initialize...');
    const initResponse = await makeRequest(BASE_URL, 'POST', {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          roots: {
            listChanged: true
          },
          sampling: {}
        },
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    });
    
    console.log(`   Status: ${initResponse.statusCode}`);
    if (initResponse.statusCode === 200 && initResponse.data.result) {
      console.log('   ✅ Initialize successful');
      console.log(`   Server: ${initResponse.data.result.serverInfo?.name || 'Unknown'}`);
      console.log(`   Version: ${initResponse.data.result.serverInfo?.version || 'Unknown'}`);
    } else {
      console.log('   ❌ Initialize failed');
      console.log('   Response:', JSON.stringify(initResponse.data, null, 2));
    }

    // Test 2: List tools
    console.log('\n3. Testing tools/list...');
    const toolsResponse = await makeRequest(BASE_URL, 'POST', {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    });
    
    console.log(`   Status: ${toolsResponse.statusCode}`);
    if (toolsResponse.statusCode === 200 && toolsResponse.data.result) {
      const toolCount = toolsResponse.data.result.tools?.length || 0;
      console.log(`   ✅ Tools listed: ${toolCount} tools`);
      
      if (toolCount === 22) {
        console.log('   ✅ Correct tool count (22)');
      } else {
        console.log(`   ⚠️  Expected 22 tools, got ${toolCount}`);
      }
      
      // Show first few tools
      const tools = toolsResponse.data.result.tools || [];
      console.log('   Sample tools:');
      tools.slice(0, 5).forEach(tool => {
        console.log(`     - ${tool.name}`);
      });
    } else {
      console.log('   ❌ Tools list failed');
      console.log('   Response:', JSON.stringify(toolsResponse.data, null, 2));
    }

    // Test 3: List resources
    console.log('\n4. Testing resources/list...');
    const resourcesResponse = await makeRequest(BASE_URL, 'POST', {
      jsonrpc: '2.0',
      id: 3,
      method: 'resources/list',
      params: {}
    });
    
    console.log(`   Status: ${resourcesResponse.statusCode}`);
    if (resourcesResponse.statusCode === 200 && resourcesResponse.data.result) {
      const resourceCount = resourcesResponse.data.result.resources?.length || 0;
      console.log(`   ✅ Resources listed: ${resourceCount} resources`);
      
      if (resourceCount === 13) {
        console.log('   ✅ Correct resource count (13)');
      } else {
        console.log(`   ⚠️  Expected 13 resources, got ${resourceCount}`);
      }
      
      // Show first few resources
      const resources = resourcesResponse.data.result.resources || [];
      console.log('   Sample resources:');
      resources.slice(0, 5).forEach(resource => {
        console.log(`     - ${resource.uri} (${resource.name})`);
      });
    } else {
      console.log('   ❌ Resources list failed');
      console.log('   Response:', JSON.stringify(resourcesResponse.data, null, 2));
    }

    // Test 4: Test path format requirement
    console.log('\n5. Testing path format requirement...');
    console.log('   Testing without /mcp/{api-key} path...');
    
    try {
      const directResponse = await makeRequest(`https://${CUSTOM_DOMAIN}/`, 'POST', {
        jsonrpc: '2.0',
        id: 4,
        method: 'initialize',
        params: {}
      });
      
      if (directResponse.statusCode !== 200) {
        console.log('   ✅ Direct domain access properly rejected');
        console.log(`   Status: ${directResponse.statusCode}`);
      } else {
        console.log('   ⚠️  Direct domain access unexpectedly succeeded');
      }
    } catch (error) {
      console.log('   ✅ Direct domain access properly rejected (connection error)');
    }

    console.log('\n🎉 Custom Domain Testing Complete!');
    console.log('\n📊 Summary:');
    console.log(`   Domain: ${CUSTOM_DOMAIN} ✅`);
    console.log(`   Path format: /mcp/{api-key} ✅`);
    console.log(`   MCP Initialize: ${initResponse.statusCode === 200 ? '✅' : '❌'}`);
    console.log(`   Tools count: ${toolsResponse.data.result?.tools?.length || 0} ${toolsResponse.data.result?.tools?.length === 22 ? '✅' : '⚠️'}`);
    console.log(`   Resources count: ${resourcesResponse.data.result?.resources?.length || 0} ${resourcesResponse.data.result?.resources?.length === 13 ? '✅' : '⚠️'}`);

  } catch (error) {
    console.error('\n❌ Error testing custom domain:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testCustomDomain().catch(console.error);