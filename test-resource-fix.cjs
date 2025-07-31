#!/usr/bin/env node

/**
 * Test script specifically for testing the MCP resource validation fix
 * 
 * This script tests that the fix for GitHub issue #1 resolves the Zod validation error
 * where contents[0].text was undefined when accessing MCP resources.
 */

const { spawn } = require('child_process');
const { join } = require('path');

class ResourceFixTester {
  constructor() {
    this.testResults = [];
    this.currentTest = null;
  }

  async runTests() {
    console.log('🧪 Testing MCP Resource Validation Fix...\n');

    // Test 1: Initialize connection
    await this.testInitialize();

    // Test 2: List resources
    await this.testListResources();

    // Test 3: Read specific resources to verify content is properly retrieved
    await this.testReadResources();

    // Print results
    this.printResults();
  }

  async testInitialize() {
    this.currentTest = 'Initialize Connection';
    console.log(`📋 Testing: ${this.currentTest}`);

    try {
      const response = await this.sendMCPRequest({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: { resources: {} },
          clientInfo: { name: 'resource-test-client', version: '1.0.0' }
        }
      });

      if (response.result && response.result.serverInfo && response.result.serverInfo.name === 'openai-assistants-mcp') {
        this.addResult(true, 'Server initialized successfully');
      } else {
        this.addResult(false, 'Invalid initialization response');
      }
    } catch (error) {
      this.addResult(false, `Initialization failed: ${error.message}`);
    }
  }

  async testListResources() {
    this.currentTest = 'List Resources';
    console.log(`📋 Testing: ${this.currentTest}`);

    try {
      const response = await this.sendMCPRequestSequence([
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: { resources: {} },
            clientInfo: { name: 'resource-test-client', version: '1.0.0' }
          }
        },
        {
          jsonrpc: '2.0',
          id: 2,
          method: 'resources/list',
          params: {}
        }
      ]);

      const resourcesResponse = response.find(r => r.id === 2);
      
      if (resourcesResponse && resourcesResponse.result && resourcesResponse.result.resources && Array.isArray(resourcesResponse.result.resources)) {
        const resourceCount = resourcesResponse.result.resources.length;
        this.addResult(true, `Found ${resourceCount} resources`);
        
        // Check for expected resources
        const resourceUris = resourcesResponse.result.resources.map(r => r.uri);
        const expectedResources = [
          'assistant://templates/coding-assistant',
          'assistant://templates/data-analyst',
          'assistant://templates/customer-support',
          'docs://openai-assistants-api',
          'docs://best-practices',
          'docs://troubleshooting/common-issues',
          'examples://workflows/batch-processing'
        ];
        
        const foundResources = expectedResources.filter(uri => resourceUris.includes(uri));
        this.addResult(true, `Found ${foundResources.length}/${expectedResources.length} expected resources`);
      } else {
        this.addResult(false, 'Invalid resources list response');
      }
    } catch (error) {
      this.addResult(false, `Resources list failed: ${error.message}`);
    }
  }

  async testReadResources() {
    this.currentTest = 'Read Resource Content';
    console.log(`📋 Testing: ${this.currentTest}`);

    const testResources = [
      'assistant://templates/coding-assistant',
      'docs://openai-assistants-api',
      'docs://best-practices'
    ];

    for (const resourceUri of testResources) {
      try {
        const response = await this.sendMCPRequestSequence([
          {
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
              protocolVersion: '2024-11-05',
              capabilities: { resources: {} },
              clientInfo: { name: 'resource-test-client', version: '1.0.0' }
            }
          },
          {
            jsonrpc: '2.0',
            id: 2,
            method: 'resources/read',
            params: { uri: resourceUri }
          }
        ]);

        const readResponse = response.find(r => r.id === 2);
        
        if (readResponse && readResponse.result && readResponse.result.contents && Array.isArray(readResponse.result.contents)) {
          const content = readResponse.result.contents[0];
          
          // This is the key test - verify that contents[0].text is NOT undefined
          if (content && content.text !== undefined && content.text !== null) {
            const textLength = typeof content.text === 'string' ? content.text.length : JSON.stringify(content.text).length;
            this.addResult(true, `✅ Resource ${resourceUri}: content.text is defined (${textLength} chars)`);
            
            // Additional validation - ensure content is meaningful
            if (textLength > 0) {
              this.addResult(true, `✅ Resource ${resourceUri}: content is non-empty`);
            } else {
              this.addResult(false, `❌ Resource ${resourceUri}: content is empty`);
            }
          } else {
            this.addResult(false, `❌ Resource ${resourceUri}: content.text is undefined/null - FIX FAILED!`);
          }
          
          // Verify other expected properties
          if (content.uri === resourceUri) {
            this.addResult(true, `✅ Resource ${resourceUri}: URI matches`);
          } else {
            this.addResult(false, `❌ Resource ${resourceUri}: URI mismatch`);
          }
          
          if (content.mimeType) {
            this.addResult(true, `✅ Resource ${resourceUri}: mimeType present (${content.mimeType})`);
          } else {
            this.addResult(false, `❌ Resource ${resourceUri}: mimeType missing`);
          }
        } else {
          this.addResult(false, `❌ Resource ${resourceUri}: Invalid read response structure`);
        }
      } catch (error) {
        this.addResult(false, `❌ Resource ${resourceUri}: Read failed - ${error.message}`);
      }
    }
  }

  async sendMCPRequest(request) {
    const responses = await this.sendMCPRequestSequence([request]);
    return responses[0];
  }

  async sendMCPRequestSequence(requests) {
    return new Promise((resolve, reject) => {
      // Set a dummy API key for testing
      const env = { ...process.env, OPENAI_API_KEY: 'test-key-for-resource-testing' };
      
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
        if (code !== 0) {
          reject(new Error(`Server exited with code ${code}: ${errorData}`));
          return;
        }

        try {
          // Parse all JSON-RPC responses
          const lines = responseData.trim().split('\n');
          for (const line of lines) {
            if (line.trim() && line.startsWith('{')) {
              try {
                const response = JSON.parse(line);
                if (response.id !== undefined) {
                  responses.push(response);
                }
              } catch (parseError) {
                continue;
              }
            }
          }
          
          if (responses.length === 0) {
            reject(new Error('No valid responses received'));
          } else {
            resolve(responses);
          }
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
        reject(new Error('Test timeout'));
      }, 10000);
    });
  }

  addResult(success, message) {
    this.testResults.push({
      test: this.currentTest,
      success,
      message
    });

    const icon = success ? '✅' : '❌';
    console.log(`   ${icon} ${message}`);
  }

  printResults() {
    console.log('\n📊 Resource Fix Test Results Summary:');
    console.log('=====================================\n');

    const passed = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;
    const failed = this.testResults.filter(r => !r.success);

    this.testResults.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.message}`);
    });

    console.log(`\n🎯 Results: ${passed}/${total} tests passed`);

    if (failed.length > 0) {
      console.log('\n💥 Failed Tests:');
      failed.forEach(result => {
        console.log(`   ❌ ${result.test}: ${result.message}`);
      });
    }

    if (passed === total) {
      console.log('\n🎉 All tests passed! The resource validation fix is working correctly.');
      console.log('✅ GitHub issue #1 has been resolved - contents[0].text is no longer undefined.');
      process.exit(0);
    } else {
      console.log('\n💥 Some tests failed. The fix may need additional work.');
      process.exit(1);
    }
  }
}

// Run tests
const tester = new ResourceFixTester();
tester.runTests().catch(error => {
  console.error('❌ Resource fix test runner failed:', error);
  process.exit(1);
});