#!/usr/bin/env node

const https = require('https');

console.log('🔍 Testing Production Deployment Counts');
console.log('='.repeat(50));

// Test key for production endpoint
const TEST_KEY = 'test-key';
const BASE_URL = `https://openai-assistants-mcp.jezweb.ai/mcp/${TEST_KEY}`;

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    console.log(`\n📡 Testing: ${url}`);
    
    https.get(url, (res) => {
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
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function testProduction() {
  try {
    // Test tools/list
    console.log('\n1. Testing tools/list endpoint...');
    const toolsResponse = await makeRequest('/tools/list');
    console.log(`   Status: ${toolsResponse.status}`);
    
    if (toolsResponse.data && toolsResponse.data.tools) {
      console.log(`   ✅ Tools found: ${toolsResponse.data.tools.length}`);
      console.log(`   Tool names: ${toolsResponse.data.tools.map(t => t.name).slice(0, 5).join(', ')}${toolsResponse.data.tools.length > 5 ? '...' : ''}`);
    } else {
      console.log(`   ❌ No tools array found in response`);
      console.log(`   Response: ${JSON.stringify(toolsResponse.data, null, 2).substring(0, 500)}...`);
    }

    // Test resources/list
    console.log('\n2. Testing resources/list endpoint...');
    const resourcesResponse = await makeRequest('/resources/list');
    console.log(`   Status: ${resourcesResponse.status}`);
    
    if (resourcesResponse.data && resourcesResponse.data.resources) {
      console.log(`   ✅ Resources found: ${resourcesResponse.data.resources.length}`);
      console.log(`   Resource URIs: ${resourcesResponse.data.resources.map(r => r.uri).slice(0, 5).join(', ')}${resourcesResponse.data.resources.length > 5 ? '...' : ''}`);
    } else {
      console.log(`   ❌ No resources array found in response`);
      console.log(`   Response: ${JSON.stringify(resourcesResponse.data, null, 2).substring(0, 500)}...`);
    }

    // Test a specific resource
    console.log('\n3. Testing specific resource access...');
    const specificResourceResponse = await makeRequest('/resources/read?uri=assistant://templates/coding-assistant');
    console.log(`   Status: ${specificResourceResponse.status}`);
    
    if (specificResourceResponse.data) {
      console.log(`   ✅ Resource content loaded: ${specificResourceResponse.data.contents ? 'Yes' : 'No'}`);
      if (specificResourceResponse.data.contents && specificResourceResponse.data.contents[0]) {
        console.log(`   Content type: ${specificResourceResponse.data.contents[0].mimeType}`);
        console.log(`   Content length: ${specificResourceResponse.data.contents[0].text ? specificResourceResponse.data.contents[0].text.length : 'N/A'} chars`);
      }
    } else {
      console.log(`   ❌ No resource content found`);
    }

    // Summary
    console.log('\n📊 PRODUCTION DEPLOYMENT SUMMARY');
    console.log('='.repeat(50));
    console.log(`Tools count: ${toolsResponse.data?.tools?.length || 'ERROR'} (Expected: 22)`);
    console.log(`Resources count: ${resourcesResponse.data?.resources?.length || 'ERROR'} (Expected: 13)`);
    
    const toolsMatch = toolsResponse.data?.tools?.length === 22;
    const resourcesMatch = resourcesResponse.data?.resources?.length === 13;
    
    if (toolsMatch && resourcesMatch) {
      console.log('✅ Production counts match expected values!');
    } else {
      console.log('❌ Production counts DO NOT match expected values!');
      console.log(`   Tools: ${toolsMatch ? '✅' : '❌'} (${toolsResponse.data?.tools?.length || 'ERROR'}/22)`);
      console.log(`   Resources: ${resourcesMatch ? '✅' : '❌'} (resourcesResponse.data?.resources?.length || 'ERROR'}/13)`);
    }

  } catch (error) {
    console.error('❌ Error testing production:', error.message);
  }
}

testProduction();