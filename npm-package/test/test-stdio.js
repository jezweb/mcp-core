#!/usr/bin/env node

/**
 * Test script for OpenAI Assistants MCP Server stdio transport
 *
 * This script tests the MCP server by sending JSON-RPC messages via stdio
 * and verifying the responses.
 */

const { spawn } = require('child_process');
const { join } = require('path');

class MCPStdioTester {
  constructor() {
    this.testResults = [];
    this.currentTest = null;
  }

  async runTests() {
    console.log('🧪 Starting OpenAI Assistants MCP Server stdio tests...\n');

    // Test 1: Initialize connection
    await this.testInitialize();

    // Test 2: List tools (with initialization)
    await this.testListTools();

    // Test 3: Test invalid tool call (should handle gracefully)
    await this.testInvalidTool();

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
          capabilities: { tools: {} },
          clientInfo: { name: 'test-client', version: '1.0.0' }
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

  async testListTools() {
    this.currentTest = 'List Tools';
    console.log(`📋 Testing: ${this.currentTest}`);

    try {
      // Send both initialize and tools/list requests to the same server instance
      const response = await this.sendMCPRequestSequence([
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            clientInfo: { name: 'test-client', version: '1.0.0' }
          }
        },
        {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/list',
          params: {}
        }
      ]);

      // Get the tools/list response (should be the last response with id: 2)
      const toolsResponse = response.find(r => r.id === 2);
      
      if (toolsResponse && toolsResponse.result && toolsResponse.result.tools && Array.isArray(toolsResponse.result.tools)) {
        const toolCount = toolsResponse.result.tools.length;
        if (toolCount === 22) {
          this.addResult(true, `Found all 22 assistants tools`);
          
          // Check for specific tools
          const toolNames = toolsResponse.result.tools.map(t => t.name);
          const expectedTools = [
            'assistant-create',
            'assistant-list',
            'assistant-get',
            'assistant-update',
            'assistant-delete',
            'thread-create',
            'thread-get',
            'thread-update',
            'thread-delete',
            'message-create',
            'message-list',
            'message-get',
            'message-update',
            'message-delete',
            'run-create',
            'run-list',
            'run-get',
            'run-update',
            'run-cancel',
            'run-submit-tool-outputs',
            'run-step-list',
            'run-step-get'
          ];
          
          const missingTools = expectedTools.filter(tool => !toolNames.includes(tool));
          if (missingTools.length === 0) {
            this.addResult(true, 'All core assistants tools present');
          } else {
            this.addResult(false, `Missing tools: ${missingTools.join(', ')}`);
          }
        } else {
          this.addResult(false, `Expected 22 tools, found ${toolCount}`);
        }
      } else {
        this.addResult(false, 'Invalid tools list response');
      }
    } catch (error) {
      this.addResult(false, `Tools list failed: ${error.message}`);
    }
  }

  async testInvalidTool() {
    this.currentTest = 'Invalid Tool Call';
    console.log(`📋 Testing: ${this.currentTest}`);

    try {
      const response = await this.sendMCPRequest({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'invalid-tool-name',
          arguments: {}
        }
      });

      if (response.result && response.result.isError) {
        this.addResult(true, 'Invalid tool call handled gracefully');
      } else if (response.error) {
        this.addResult(true, 'Invalid tool call returned proper error');
      } else {
        this.addResult(false, 'Invalid tool call should return error');
      }
    } catch (error) {
      this.addResult(false, `Invalid tool test failed: ${error.message}`);
    }
  }

  async sendMCPRequest(request) {
    const responses = await this.sendMCPRequestSequence([request]);
    return responses[0];
  }

  async sendMCPRequestSequence(requests) {
    return new Promise((resolve, reject) => {
      // Set a dummy API key for testing (won't be used for these tests)
      const env = { ...process.env, OPENAI_API_KEY: 'test-key' };
      
      const serverPath = join(__dirname, '../universal-mcp-server.cjs');
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
                // Only collect responses with IDs (not notifications)
                if (response.id !== undefined) {
                  responses.push(response);
                }
              } catch (parseError) {
                // Skip lines that aren't valid JSON (like log messages)
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
      }, 5000);
    });
  }

  addResult(success, message) {
    this.testResults.push({
      test: this.currentTest,
      success,
      message
    });

    const icon = success ? '✅' : '❌';
    console.log(`   ${icon} ${message}\n`);
  }

  printResults() {
    console.log('📊 Test Results Summary:');
    console.log('========================\n');

    const passed = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;

    this.testResults.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.message}`);
    });

    console.log(`\n🎯 Results: ${passed}/${total} tests passed`);

    if (passed === total) {
      console.log('🎉 All tests passed! The MCP server is working correctly.');
      process.exit(0);
    } else {
      console.log('💥 Some tests failed. Please check the implementation.');
      process.exit(1);
    }
  }
}

// Run tests
const tester = new MCPStdioTester();
tester.runTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});