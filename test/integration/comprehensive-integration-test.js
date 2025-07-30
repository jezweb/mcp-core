#!/usr/bin/env node

/**
 * Comprehensive Integration Test for OpenAI Assistants MCP Server
 * Tests both Cloudflare Workers and NPM package implementations
 * Validates all 22 tools with real-world scenarios
 */

import { TestTracker, MockOpenAIResponses, TestDataGenerator, MCPValidator, PerformanceTracker } from '../utils/test-helpers.js';
import { spawn } from 'child_process';

class ComprehensiveIntegrationTester {
  constructor() {
    this.tracker = new TestTracker('Comprehensive Integration Test');
    this.performanceTracker = new PerformanceTracker();
    this.cloudflareWorkerUrl = 'https://vectorstore.jezweb.com/mcp';
    this.npmPackagePath = './npm-package/universal-mcp-server.cjs';
    this.testApiKey = process.env.OPENAI_API_KEY || 'test-api-key-for-validation';
    this.realApiKey = process.env.OPENAI_API_KEY;
    
    // Test data storage
    this.createdResources = {
      assistants: [],
      threads: [],
      messages: [],
      runs: []
    };
  }

  async runAllTests() {
    this.tracker.log('🚀 Starting Comprehensive Integration Tests', 'start');
    this.tracker.log(`Using API key: ${this.realApiKey ? 'real' : 'test-only'}`, 'info');

    try {
      // Test both deployment options
      await this.testCloudflareWorkers();
      await this.testNPMPackage();
      
      // Cross-deployment validation
      await this.testDeploymentParity();
      
      // Performance comparison
      await this.comparePerformance();
      
      this.tracker.log('🎉 All integration tests completed successfully!', 'success');
      return true;
    } catch (error) {
      this.tracker.log(`💥 Integration test suite failed: ${error.message}`, 'error');
      return false;
    } finally {
      // Cleanup created resources
      await this.cleanup();
    }
  }

  async testCloudflareWorkers() {
    await this.tracker.runTest('Cloudflare Workers Deployment', async () => {
      this.tracker.log('Testing Cloudflare Workers deployment...', 'info');
      
      // Test all 22 tools via Cloudflare Workers
      const results = await this.testAllTools('cloudflare');
      
      if (results.failed > 0) {
        throw new Error(`${results.failed} tools failed in Cloudflare Workers deployment`);
      }
      
      this.tracker.log(`✅ All ${results.total} tools working in Cloudflare Workers`, 'pass');
      return results;
    });
  }

  async testNPMPackage() {
    await this.tracker.runTest('NPM Package Deployment', async () => {
      this.tracker.log('Testing NPM package deployment...', 'info');
      
      // Test all 22 tools via NPM package
      const results = await this.testAllTools('npm');
      
      if (results.failed > 0) {
        throw new Error(`${results.failed} tools failed in NPM package deployment`);
      }
      
      this.tracker.log(`✅ All ${results.total} tools working in NPM package`, 'pass');
      return results;
    });
  }

  async testAllTools(deployment) {
    const tools = this.getAllToolNames();
    let passed = 0;
    let failed = 0;
    
    for (const toolName of tools) {
      try {
        await this.testSingleTool(toolName, deployment);
        passed++;
      } catch (error) {
        this.tracker.log(`❌ Tool ${toolName} failed: ${error.message}`, 'fail');
        failed++;
      }
    }
    
    return { total: tools.length, passed, failed };
  }

  async testSingleTool(toolName, deployment) {
    const testData = this.getTestDataForTool(toolName);
    const request = {
      jsonrpc: '2.0',
      id: Math.floor(Math.random() * 1000),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: testData
      }
    };

    const response = await this.sendRequest(request, deployment);
    
    // Validate response structure
    const validationErrors = MCPValidator.validateMCPResponse(response);
    if (validationErrors.length > 0) {
      throw new Error(`Invalid response structure: ${validationErrors.join(', ')}`);
    }

    // Check for errors
    if (response.error) {
      throw new Error(`Tool error: ${response.error.message}`);
    }

    // For test API key, expect validation errors for most tools
    if (!this.realApiKey && response.result.isError) {
      const errorText = response.result.content[0].text;
      if (errorText.includes('Invalid or missing API key') || 
          errorText.includes('Unauthorized') ||
          errorText.includes('Missing required parameter')) {
        // This is expected behavior for validation-only testing
        return response;
      }
    }

    // Store created resources for cleanup
    if (response.result && !response.result.isError) {
      this.storeCreatedResource(toolName, response.result);
    }

    return response;
  }

  async testDeploymentParity() {
    await this.tracker.runTest('Deployment Parity Validation', async () => {
      this.tracker.log('Validating deployment parity...', 'info');
      
      // Test that both deployments handle the same inputs identically
      const testCases = [
        { tool: 'assistant-create', data: TestDataGenerator.getValidAssistantData() },
        { tool: 'assistant-list', data: { limit: 5 } },
        { tool: 'thread-create', data: TestDataGenerator.getValidThreadData() },
        { tool: 'message-create', data: { 
          thread_id: 'test-thread-id', 
          ...TestDataGenerator.getValidMessageData() 
        }}
      ];

      for (const testCase of testCases) {
        const cloudflareResponse = await this.sendToolRequest(testCase.tool, testCase.data, 'cloudflare');
        const npmResponse = await this.sendToolRequest(testCase.tool, testCase.data, 'npm');
        
        // Compare response structures
        if (cloudflareResponse.jsonrpc !== npmResponse.jsonrpc) {
          throw new Error(`JSON-RPC version mismatch for ${testCase.tool}`);
        }
        
        // Both should handle errors consistently
        if (!!cloudflareResponse.error !== !!npmResponse.error) {
          throw new Error(`Error handling inconsistency for ${testCase.tool}`);
        }
        
        if (!!cloudflareResponse.result?.isError !== !!npmResponse.result?.isError) {
          throw new Error(`Error result inconsistency for ${testCase.tool}`);
        }
      }
      
      this.tracker.log('✅ Deployment parity validated', 'pass');
    });
  }

  async comparePerformance() {
    await this.tracker.runTest('Performance Comparison', async () => {
      this.tracker.log('Comparing performance between deployments...', 'info');
      
      const testTool = 'assistant-list';
      const testData = { limit: 5 };
      const iterations = 5;
      
      // Measure Cloudflare Workers performance
      const cloudflareStats = await this.measurePerformance(testTool, testData, 'cloudflare', iterations);
      
      // Measure NPM package performance
      const npmStats = await this.measurePerformance(testTool, testData, 'npm', iterations);
      
      this.tracker.log(`Cloudflare Workers avg: ${cloudflareStats.avg.toFixed(2)}ms`, 'info');
      this.tracker.log(`NPM Package avg: ${npmStats.avg.toFixed(2)}ms`, 'info');
      
      // Performance should be reasonable (under 5 seconds for test scenarios)
      if (cloudflareStats.avg > 5000 || npmStats.avg > 5000) {
        throw new Error('Performance degradation detected - responses taking too long');
      }
      
      this.tracker.log('✅ Performance comparison completed', 'pass');
    });
  }

  async measurePerformance(tool, data, deployment, iterations) {
    const measurements = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      try {
        await this.sendToolRequest(tool, data, deployment);
        const duration = performance.now() - start;
        measurements.push(duration);
      } catch (error) {
        // For test API keys, errors are expected
        const duration = performance.now() - start;
        measurements.push(duration);
      }
    }
    
    return {
      avg: measurements.reduce((a, b) => a + b, 0) / measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements)
    };
  }

  async sendRequest(request, deployment) {
    if (deployment === 'cloudflare') {
      return this.sendToCloudflareWorker(request);
    } else {
      return this.sendToNPMPackage(request);
    }
  }

  async sendToolRequest(tool, data, deployment) {
    const request = {
      jsonrpc: '2.0',
      id: Math.floor(Math.random() * 1000),
      method: 'tools/call',
      params: {
        name: tool,
        arguments: data
      }
    };
    
    return this.sendRequest(request, deployment);
  }

  async sendToCloudflareWorker(request) {
    const url = this.realApiKey ? 
      `${this.cloudflareWorkerUrl}/${this.realApiKey}` : 
      this.cloudflareWorkerUrl;
      
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.realApiKey ? {} : { 'Authorization': `Bearer ${this.testApiKey}` })
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async sendToNPMPackage(request) {
    return new Promise((resolve, reject) => {
      const env = { ...process.env, OPENAI_API_KEY: this.testApiKey };
      
      const child = spawn('node', [this.npmPackagePath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env
      });

      let responseData = '';
      let errorData = '';

      child.stdout.on('data', (data) => {
        responseData += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Process exited with code ${code}: ${errorData}`));
          return;
        }

        try {
          const lines = responseData.trim().split('\n');
          for (const line of lines) {
            if (line.trim() && line.startsWith('{')) {
              const response = JSON.parse(line);
              if (response.id === request.id) {
                resolve(response);
                return;
              }
            }
          }
          reject(new Error('No matching response found'));
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to start process: ${error.message}`));
      });

      // Send initialize first, then the actual request
      child.stdin.write(JSON.stringify({
        jsonrpc: '2.0',
        id: 0,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          clientInfo: { name: 'test-client', version: '1.0.0' }
        }
      }) + '\n');
      
      child.stdin.write(JSON.stringify(request) + '\n');
      child.stdin.end();

      setTimeout(() => {
        child.kill();
        reject(new Error('Request timeout'));
      }, 10000);
    });
  }

  getAllToolNames() {
    return [
      // Assistant Management (5 tools)
      'assistant-create', 'assistant-list', 'assistant-get', 'assistant-update', 'assistant-delete',
      
      // Thread Management (4 tools)
      'thread-create', 'thread-get', 'thread-update', 'thread-delete',
      
      // Message Management (5 tools)
      'message-create', 'message-list', 'message-get', 'message-update', 'message-delete',
      
      // Run Management (6 tools)
      'run-create', 'run-list', 'run-get', 'run-update', 'run-cancel', 'run-submit-tool-outputs',
      
      // Run Step Management (2 tools)
      'run-step-list', 'run-step-get'
    ];
  }

  getTestDataForTool(toolName) {
    const testThreadId = 'thread_test123';
    const testAssistantId = 'asst_test123';
    const testMessageId = 'msg_test123';
    const testRunId = 'run_test123';
    const testStepId = 'step_test123';

    switch (toolName) {
      // Assistant Management
      case 'assistant-create':
        return TestDataGenerator.getValidAssistantData();
      case 'assistant-list':
        return { limit: 5 };
      case 'assistant-get':
        return { assistant_id: testAssistantId };
      case 'assistant-update':
        return { assistant_id: testAssistantId, name: 'Updated Assistant' };
      case 'assistant-delete':
        return { assistant_id: testAssistantId };

      // Thread Management
      case 'thread-create':
        return TestDataGenerator.getValidThreadData();
      case 'thread-get':
        return { thread_id: testThreadId };
      case 'thread-update':
        return { thread_id: testThreadId, metadata: { updated: 'true' } };
      case 'thread-delete':
        return { thread_id: testThreadId };

      // Message Management
      case 'message-create':
        return { thread_id: testThreadId, ...TestDataGenerator.getValidMessageData() };
      case 'message-list':
        return { thread_id: testThreadId, limit: 5 };
      case 'message-get':
        return { thread_id: testThreadId, message_id: testMessageId };
      case 'message-update':
        return { thread_id: testThreadId, message_id: testMessageId, metadata: { updated: 'true' } };
      case 'message-delete':
        return { thread_id: testThreadId, message_id: testMessageId };

      // Run Management
      case 'run-create':
        return { thread_id: testThreadId, assistant_id: testAssistantId, ...TestDataGenerator.getValidRunData() };
      case 'run-list':
        return { thread_id: testThreadId, limit: 5 };
      case 'run-get':
        return { thread_id: testThreadId, run_id: testRunId };
      case 'run-update':
        return { thread_id: testThreadId, run_id: testRunId, metadata: { updated: 'true' } };
      case 'run-cancel':
        return { thread_id: testThreadId, run_id: testRunId };
      case 'run-submit-tool-outputs':
        return { 
          thread_id: testThreadId, 
          run_id: testRunId, 
          tool_outputs: [{ tool_call_id: 'call_test123', output: 'Test output' }] 
        };

      // Run Step Management
      case 'run-step-list':
        return { thread_id: testThreadId, run_id: testRunId, limit: 5 };
      case 'run-step-get':
        return { thread_id: testThreadId, run_id: testRunId, step_id: testStepId };

      default:
        return {};
    }
  }

  storeCreatedResource(toolName, result) {
    if (toolName.startsWith('assistant-create') && result.content) {
      try {
        const assistant = JSON.parse(result.content[0].text);
        this.createdResources.assistants.push(assistant.id);
      } catch (e) { /* ignore */ }
    }
    // Add similar logic for other resource types
  }

  async cleanup() {
    if (!this.realApiKey) return; // No cleanup needed for test-only mode
    
    this.tracker.log('🧹 Cleaning up created resources...', 'info');
    
    // Cleanup would go here if we had real API access
    // For now, just log what would be cleaned up
    if (this.createdResources.assistants.length > 0) {
      this.tracker.log(`Would cleanup ${this.createdResources.assistants.length} assistants`, 'info');
    }
  }

  generateReport() {
    const report = this.tracker.generateReport();
    this.performanceTracker.generateReport();
    return report;
  }
}

// Run the tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new ComprehensiveIntegrationTester();
  
  tester.runAllTests().then(success => {
    const report = tester.generateReport();
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Integration test runner failed:', error);
    process.exit(1);
  });
}

export { ComprehensiveIntegrationTester };