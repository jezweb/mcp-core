#!/usr/bin/env node

const https = require('https');
const http = require('http');

console.log('🔍 Debugging MCP Server Deployment Counts');
console.log('='.repeat(50));

// Test function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.request(url, {
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

async function testMCPServer(url, name) {
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
        console.log(`    📝 Tool names: ${toolsResponse.body.result.tools.map(t => t.name).join(', ')}`);
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
        console.log(`    📝 Resource URIs: ${resourcesResponse.body.result.resources.map(r => r.uri).join(', ')}`);
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
  // Test custom domain
  await testMCPServer('https://openai-assistants-mcp.jezweb.ai', 'Custom Domain (Cloudflare Workers)');
  
  // Test if there's a local NPM package server running
  console.log('\n🏠 Testing local NPM package...');
  try {
    const { spawn } = require('child_process');
    const path = require('path');
    
    // Try to run the NPM package locally to test it
    console.log('  📦 Starting local NPM package test...');
    
    // Test the universal server directly
    const universalServerPath = path.join(__dirname, 'npm-package', 'universal-mcp-server.cjs');
    console.log(`  📁 Testing: ${universalServerPath}`);
    
    // Load and test the server module
    try {
      delete require.cache[require.resolve('./npm-package/universal-mcp-server.cjs')];
      const server = require('./npm-package/universal-mcp-server.cjs');
      
      if (server && typeof server.handleRequest === 'function') {
        console.log('  ✅ NPM package server module loaded successfully');
        
        // Test tools/list
        const toolsResult = await server.handleRequest({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list'
        });
        
        const toolCount = toolsResult.result?.tools?.length || 0;
        console.log(`    🔧 NPM Package Tools: ${toolCount}`);
        
        // Test resources/list
        const resourcesResult = await server.handleRequest({
          jsonrpc: '2.0',
          id: 2,
          method: 'resources/list'
        });
        
        const resourceCount = resourcesResult.result?.resources?.length || 0;
        console.log(`    📚 NPM Package Resources: ${resourceCount}`);
        
      } else {
        console.log('  ❌ NPM package server module not properly exported');
      }
    } catch (npmError) {
      console.log(`  💥 Error testing NPM package: ${npmError.message}`);
    }
    
  } catch (error) {
    console.log(`  💥 Error setting up NPM test: ${error.message}`);
  }
  
  console.log('\n📊 Summary:');
  console.log('Expected counts:');
  console.log('  🔧 Tools: 22');
  console.log('  📚 Resources: 13');
  console.log('\nReported issue:');
  console.log('  🔧 Tools: 10 (missing 12)');
  console.log('  📚 Resources: 7 (missing 6)');
}

main().catch(console.error);