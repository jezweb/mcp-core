#!/usr/bin/env node

const https = require('https');

console.log('🔍 Testing Correct Deployment URLs');
console.log('='.repeat(50));

// Test function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function testDeployment(url, name) {
  console.log(`\n📡 Testing ${name}: ${url}`);
  
  try {
    // Test tools/list
    console.log('  🔧 Testing tools/list...');
    const toolsResponse = await makeRequest(url, {
      body: {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list'
      }
    });
    
    if (toolsResponse.status === 200 && toolsResponse.body.result) {
      const toolCount = toolsResponse.body.result.tools?.length || 0;
      console.log(`    ✅ Tools found: ${toolCount}`);
      if (toolCount > 0) {
        console.log(`    📝 First 5 tools: ${toolsResponse.body.result.tools.slice(0, 5).map(t => t.name).join(', ')}`);
      }
    } else {
      console.log(`    ❌ Tools request failed: ${toolsResponse.status}`);
      console.log(`    📄 Response: ${JSON.stringify(toolsResponse.body, null, 2)}`);
    }
    
    // Test resources/list
    console.log('  📚 Testing resources/list...');
    const resourcesResponse = await makeRequest(url, {
      body: {
        jsonrpc: '2.0',
        id: 2,
        method: 'resources/list'
      }
    });
    
    if (resourcesResponse.status === 200 && resourcesResponse.body.result) {
      const resourceCount = resourcesResponse.body.result.resources?.length || 0;
      console.log(`    ✅ Resources found: ${resourceCount}`);
      if (resourceCount > 0) {
        console.log(`    📝 First 5 resources: ${resourcesResponse.body.result.resources.slice(0, 5).map(r => r.uri).join(', ')}`);
      }
    } else {
      console.log(`    ❌ Resources request failed: ${resourcesResponse.status}`);
      console.log(`    📄 Response: ${JSON.stringify(resourcesResponse.body, null, 2)}`);
    }
    
  } catch (error) {
    console.log(`    💥 Error testing ${name}: ${error.message}`);
  }
}

async function main() {
  // Test the URLs from the existing test files
  console.log('🎯 Testing URLs from existing test configuration...');
  
  // From cloudflare-workers-tests.js
  await testDeployment('https://vectorstore.jezweb.com/mcp', 'Cloudflare Workers (from tests)');
  
  // Test the user-mentioned URL
  await testDeployment('https://openai-assistants-mcp.jezweb.ai', 'User-mentioned URL');
  
  // Test with API key path (using dummy key for structure test)
  await testDeployment('https://openai-assistants-mcp.jezweb.ai/mcp/test-key', 'User URL with API key path');
  
  // Test the vectorstore URL with API key path
  await testDeployment('https://vectorstore.jezweb.com/mcp/test-key', 'Vectorstore URL with API key path');
  
  console.log('\n📊 Analysis:');
  console.log('Expected counts based on our definitions:');
  console.log('  🔧 Tools: 22');
  console.log('  📚 Resources: 13');
  console.log('\nReported issue:');
  console.log('  🔧 Tools: 10 (missing 12)');
  console.log('  📚 Resources: 7 (missing 6)');
  
  console.log('\n🔍 Possible Issues:');
  console.log('1. Wrong URL being used by the user');
  console.log('2. API key required in URL path');
  console.log('3. Different deployment serving different tool/resource counts');
  console.log('4. Version mismatch between deployments');
}

main().catch(console.error);