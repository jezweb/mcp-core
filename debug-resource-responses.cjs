#!/usr/bin/env node

/**
 * Debug script to examine actual MCP resource responses
 */

const { spawn } = require('child_process');
const { join } = require('path');

async function debugResourceResponses() {
  console.log('🔍 Debugging MCP Resource Responses...\n');

  try {
    const response = await sendMCPRequestSequence([
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: { resources: {} },
          clientInfo: { name: 'debug-client', version: '1.0.0' }
        }
      },
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'resources/list',
        params: {}
      },
      {
        jsonrpc: '2.0',
        id: 3,
        method: 'resources/read',
        params: { uri: 'assistant://templates/coding-assistant' }
      }
    ]);

    console.log('📋 All Responses:');
    response.forEach((resp, index) => {
      console.log(`\n--- Response ${index + 1} (ID: ${resp.id}) ---`);
      console.log(JSON.stringify(resp, null, 2));
    });

    // Analyze specific responses
    const initResponse = response.find(r => r.id === 1);
    const listResponse = response.find(r => r.id === 2);
    const readResponse = response.find(r => r.id === 3);

    console.log('\n🔍 Analysis:');
    
    if (initResponse) {
      console.log('✅ Initialize response received');
      if (initResponse.result?.capabilities?.resources) {
        console.log('✅ Resources capability advertised');
      } else {
        console.log('❌ Resources capability not advertised');
      }
    }

    if (listResponse) {
      console.log('✅ List response received');
      if (listResponse.result?.resources) {
        console.log(`✅ Resources array present with ${listResponse.result.resources.length} items`);
      } else if (listResponse.error) {
        console.log('❌ List response has error:', listResponse.error);
      } else {
        console.log('❌ List response missing resources array');
      }
    } else {
      console.log('❌ No list response received');
    }

    if (readResponse) {
      console.log('✅ Read response received');
      if (readResponse.result?.contents) {
        console.log(`✅ Contents array present with ${readResponse.result.contents.length} items`);
        if (readResponse.result.contents[0]) {
          const content = readResponse.result.contents[0];
          console.log('📄 Content structure:');
          console.log(`   - uri: ${content.uri}`);
          console.log(`   - mimeType: ${content.mimeType}`);
          console.log(`   - text type: ${typeof content.text}`);
          console.log(`   - text defined: ${content.text !== undefined}`);
          console.log(`   - text length: ${content.text ? (typeof content.text === 'string' ? content.text.length : JSON.stringify(content.text).length) : 'N/A'}`);
          
          if (content.text !== undefined) {
            console.log('🎉 SUCCESS: content.text is defined - fix is working!');
          } else {
            console.log('💥 FAILURE: content.text is undefined - fix not working!');
          }
        }
      } else if (readResponse.error) {
        console.log('❌ Read response has error:', readResponse.error);
      } else {
        console.log('❌ Read response missing contents array');
      }
    } else {
      console.log('❌ No read response received');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

async function sendMCPRequestSequence(requests) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, OPENAI_API_KEY: 'test-key-for-debugging' };
    
    const serverPath = join(__dirname, 'npm-package/universal-mcp-server.cjs');
    const child = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env
    });

    let responseData = '';
    let errorData = '';
    const responses = [];

    child.stdout.on('data', (data) => {
      responseData += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    child.on('close', (code) => {
      console.log(`\n🔧 Server exit code: ${code}`);
      if (errorData) {
        console.log('🔧 Server stderr:', errorData);
      }

      try {
        console.log('\n📤 Raw server output:');
        console.log(responseData);
        console.log('\n📥 Parsing responses...');
        
        const lines = responseData.trim().split('\n');
        for (const line of lines) {
          if (line.trim() && line.startsWith('{')) {
            try {
              const response = JSON.parse(line);
              if (response.id !== undefined) {
                responses.push(response);
              }
            } catch (parseError) {
              console.log('⚠️ Failed to parse line:', line);
              continue;
            }
          }
        }
        
        resolve(responses);
      } catch (error) {
        reject(new Error(`Failed to parse responses: ${error.message}`));
      }
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to start server: ${error.message}`));
    });

    // Send all requests
    for (const request of requests) {
      child.stdin.write(JSON.stringify(request) + '\n');
    }
    child.stdin.end();

    // Set timeout
    setTimeout(() => {
      child.kill();
      reject(new Error('Debug timeout'));
    }, 10000);
  });
}

debugResourceResponses().catch(error => {
  console.error('❌ Debug script failed:', error);
  process.exit(1);
});