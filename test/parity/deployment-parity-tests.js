#!/usr/bin/env node

/**
 * Deployment Parity Validation Tests for OpenAI Assistants MCP Server
 * Ensures both Cloudflare Workers and NPM package implementations behave identically
 */

import { TestTracker, TestDataGenerator, MCPValidator, PerformanceTracker } from '../utils/test-helpers.js';

class DeploymentParityTester {
  constructor() {
    this.tracker = new TestTracker('Deployment Parity Tests');
    this.performanceTracker = new PerformanceTracker();
    this.cloudflareWorkerUrl = 'https://vectorstore.jezweb.com/mcp';
    this.npmPackagePath = './npm-package/universal-mcp-server.cjs';
    this.testApiKey = process.env.OPENAI_API_KEY || 'test-api-key-for-validation';
    this.parityResults = [];
  }

  async runAllTests() {
    this.tracker.log('🚀 Starting Deployment Parity Validation Tests', 'start');

    try {
      // Test core protocol parity
      await this.testInitializeParity();
      await this.testToolsListParity();
      
      // Test all 22 tools for parity
      await this.testAllToolsParity();
      
      // Test error handling parity
      await this.testErrorHandlingParity();
      
      // Test performance parity
      await this.testPerformanceParity();
      
      // Test response format parity
      await this.testResponseFormatParity();
      
      // Test edge case parity
      await this.testEdgeCaseParity();
      
      // Generate parity report
      this.generateParityReport();
      
      this.tracker.log('🎉 All deployment parity tests completed!', 'success');
      return true;
    } catch (error) {
      this.tracker.log(`💥 Deployment parity test suite failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testInitializeParity() {
    await this.tracker.runTest('Initialize Parity', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          clientInfo: { name: 'parity-test-client', version: '1.0.0' }
        }
      };

      const [cloudflareResponse, npmResponse] = await Promise.all([
        this.sendToCloudflareWorker(request),
        this.sendToNPMPackage(request)
      ]);

      this.validateParity('initialize', request, cloudflareResponse, npmResponse);
    });
  }

  async testToolsListParity() {
    await this.tracker.runTest('Tools List Parity', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {}
      };

      const [cloudflareResponse, npmResponse] = await Promise.all([
        this.sendToCloudflareWorker(request),
        this.sendToNPMPackage(request)
      ]);

      this.validateParity('tools/list', request, cloudflareResponse, npmResponse);

      // Specifically validate tool definitions are identical
      if (cloudflareResponse.result?.tools && npmResponse.result?.tools) {
        const cfTools = cloudflareResponse.result.tools;
        const npmTools = npmResponse.result.tools;

        if (cfTools.length !== npmTools.length) {
          throw new Error(`Tool count mismatch: Cloudflare ${cfTools.length}, NPM ${npmTools.length}`);
        }

        for (let i = 0; i < cfTools.length; i++) {
          const cfTool = cfTools[i];
          const npmTool = npmTools[i];

          if (cfTool.name !== npmTool.name) {
            throw new Error(`Tool name mismatch at index ${i}: ${cfTool.name} vs ${npmTool.name}`);
          }

          if (cfTool.description !== npmTool.description) {
            throw new Error(`Tool description mismatch for ${cfTool.name}`);
          }

          // Validate input schemas are equivalent
          const cfSchema = JSON.stringify(cfTool.inputSchema);
          const npmSchema = JSON.stringify(npmTool.inputSchema);
          
          if (cfSchema !== npmSchema) {
            throw new Error(`Input schema mismatch for ${cfTool.name}`);
          }
        }

        this.tracker.log(`✅ All ${cfTools.length} tools have identical definitions`, 'info');
      }
    });
  }

  async testAllToolsParity() {
    await this.tracker.runTest('All Tools Parity', async () => {
      const tools = this.getAllToolNames();
      let parityIssues = 0;

      for (const toolName of tools) {
        try {
          await this.testSingleToolParity(toolName);
        } catch (error) {
          this.tracker.log(`⚠️  Parity issue with ${toolName}: ${error.message}`, 'warn');
          parityIssues++;
        }
      }

      if (parityIssues > 0) {
        throw new Error(`${parityIssues} tools have parity issues`);
      }

      this.tracker.log(`✅ All ${tools.length} tools have deployment parity`, 'info');
    });
  }

  async testSingleToolParity(toolName) {
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

    const [cloudflareResponse, npmResponse] = await Promise.all([
      this.sendToCloudflareWorker(request),
      this.sendToNPMPackage(request)
    ]);

    this.validateParity(toolName, request, cloudflareResponse, npmResponse);
  }

  async testErrorHandlingParity() {
    await this.tracker.runTest('Error Handling Parity', async () => {
      const errorScenarios = [
        {
          name: 'Invalid method',
          request: {
            jsonrpc: '2.0',
            id: 1,
            method: 'invalid-method',
            params: {}
          }
        },
        {
          name: 'Invalid tool',
          request: {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/call',
            params: {
              name: 'invalid-tool',
              arguments: {}
            }
          }
        },
        {
          name: 'Missing required parameter',
          request: {
            jsonrpc: '2.0',
            id: 3,
            method: 'tools/call',
            params: {
              name: 'assistant-create',
              arguments: { name: 'Test' } // Missing model
            }
          }
        }
      ];

      for (const scenario of errorScenarios) {
        const [cloudflareResponse, npmResponse] = await Promise.all([
          this.sendToCloudflareWorker(scenario.request),
          this.sendToNPMPackage(scenario.request)
        ]);

        this.validateErrorParity(scenario.name, scenario.request, cloudflareResponse, npmResponse);
      }
    });
  }

  async testPerformanceParity() {
    await this.tracker.runTest('Performance Parity', async () => {
      const testTool = 'assistant-list';
      const testData = { limit: 5 };
      const iterations = 5;

      const cloudflareTimings = [];
      const npmTimings = [];

      for (let i = 0; i < iterations; i++) {
        const request = {
          jsonrpc: '2.0',
          id: i,
          method: 'tools/call',
          params: {
            name: testTool,
            arguments: testData
          }
        };

        // Measure Cloudflare Workers
        const cfStart = performance.now();
        await this.sendToCloudflareWorker(request);
        const cfDuration = performance.now() - cfStart;
        cloudflareTimings.push(cfDuration);

        // Measure NPM Package
        const npmStart = performance.now();
        await this.sendToNPMPackage(request);
        const npmDuration = performance.now() - npmStart;
        npmTimings.push(npmDuration);
      }

      const cfAvg = cloudflareTimings.reduce((a, b) => a + b, 0) / cloudflareTimings.length;
      const npmAvg = npmTimings.reduce((a, b) => a + b, 0) / npmTimings.length;
      const ratio = npmAvg / cfAvg;

      this.tracker.log(`Cloudflare Workers avg: ${cfAvg.toFixed(2)}ms`, 'info');
      this.tracker.log(`NPM Package avg: ${npmAvg.toFixed(2)}ms`, 'info');
      this.tracker.log(`Performance ratio: ${ratio.toFixed(2)}`, 'info');

      // Performance should be within reasonable bounds (10x difference max)
      if (ratio > 10 || ratio < 0.1) {
        throw new Error(`Significant performance difference: ${ratio.toFixed(2)}x`);
      }

      this.tracker.log('✅ Performance parity within acceptable bounds', 'info');
    });
  }

  async testResponseFormatParity() {
    await this.tracker.runTest('Response Format Parity', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      };

      const [cloudflareResponse, npmResponse] = await Promise.all([
        this.sendToCloudflareWorker(request),
        this.sendToNPMPackage(request)
      ]);

      // Validate both responses have identical structure
      const cfKeys = Object.keys(cloudflareResponse).sort();
      const npmKeys = Object.keys(npmResponse).sort();

      if (JSON.stringify(cfKeys) !== JSON.stringify(npmKeys)) {
        throw new Error(`Response structure mismatch: ${cfKeys} vs ${npmKeys}`);
      }

      // Validate JSON-RPC compliance for both
      const cfErrors = MCPValidator.validateMCPResponse(cloudflareResponse);
      const npmErrors = MCPValidator.validateMCPResponse(npmResponse);

      if (cfErrors.length > 0) {
        throw new Error(`Cloudflare response validation errors: ${cfErrors.join(', ')}`);
      }

      if (npmErrors.length > 0) {
        throw new Error(`NPM response validation errors: ${npmErrors.join(', ')}`);
      }

      this.tracker.log('✅ Response formats are identical and compliant', 'info');
    });
  }

  async testEdgeCaseParity() {
    await this.tracker.runTest('Edge Case Parity', async () => {
      const edgeCases = [
        {
          name: 'Large payload',
          request: {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: {
              name: 'assistant-create',
              arguments: {
                model: 'gpt-4',
                instructions: 'A'.repeat(10000),
                metadata: Object.fromEntries(
                  Array.from({ length: 50 }, (_, i) => [`key${i}`, `value${i}`])
                )
              }
            }
          }
        },
        {
          name: 'Unicode content',
          request: {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/call',
            params: {
              name: 'assistant-create',
              arguments: {
                model: 'gpt-4',
                name: '测试助手 🤖',
                description: 'Тестовый помощник with émojis 🌟',
                instructions: 'あなたは役に立つアシスタントです。'
              }
            }
          }
        },
        {
          name: 'Special characters',
          request: {
            jsonrpc: '2.0',
            id: 3,
            method: 'tools/call',
            params: {
              name: 'assistant-create',
              arguments: {
                model: 'gpt-4',
                name: 'Test "quotes" and \'apostrophes\'',
                description: 'Description with\nnewlines\tand\ttabs',
                instructions: 'Instructions with <tags> and {braces}'
              }
            }
          }
        }
      ];

      for (const edgeCase of edgeCases) {
        const [cloudflareResponse, npmResponse] = await Promise.all([
          this.sendToCloudflareWorker(edgeCase.request),
          this.sendToNPMPackage(edgeCase.request)
        ]);

        this.validateParity(edgeCase.name, edgeCase.request, cloudflareResponse, npmResponse);
      }
    });
  }

  validateParity(testName, request, cloudflareResponse, npmResponse) {
    const parityResult = {
      testName,
      request,
      cloudflareResponse,
      npmResponse,
      issues: []
    };

    // Check JSON-RPC version
    if (cloudflareResponse.jsonrpc !== npmResponse.jsonrpc) {
      parityResult.issues.push(`JSON-RPC version mismatch: ${cloudflareResponse.jsonrpc} vs ${npmResponse.jsonrpc}`);
    }

    // Check ID
    if (cloudflareResponse.id !== npmResponse.id) {
      parityResult.issues.push(`ID mismatch: ${cloudflareResponse.id} vs ${npmResponse.id}`);
    }

    // Check error presence
    const cfHasError = !!cloudflareResponse.error;
    const npmHasError = !!npmResponse.error;

    if (cfHasError !== npmHasError) {
      parityResult.issues.push(`Error presence mismatch: CF=${cfHasError}, NPM=${npmHasError}`);
    }

    // Check result presence
    const cfHasResult = !!cloudflareResponse.result;
    const npmHasResult = !!npmResponse.result;

    if (cfHasResult !== npmHasResult) {
      parityResult.issues.push(`Result presence mismatch: CF=${cfHasResult}, NPM=${npmHasResult}`);
    }

    // Check isError flag in results
    if (cfHasResult && npmHasResult) {
      const cfIsError = !!cloudflareResponse.result.isError;
      const npmIsError = !!npmResponse.result.isError;

      if (cfIsError !== npmIsError) {
        parityResult.issues.push(`isError flag mismatch: CF=${cfIsError}, NPM=${npmIsError}`);
      }
    }

    this.parityResults.push(parityResult);

    if (parityResult.issues.length > 0) {
      throw new Error(`Parity issues for ${testName}: ${parityResult.issues.join(', ')}`);
    }

    this.tracker.log(`✅ ${testName}: Deployment parity confirmed`, 'info');
  }

  validateErrorParity(testName, request, cloudflareResponse, npmResponse) {
    // For error scenarios, we expect both to handle errors consistently
    const cfHasError = !!(cloudflareResponse.error || cloudflareResponse.result?.isError);
    const npmHasError = !!(npmResponse.error || npmResponse.result?.isError);

    if (!cfHasError || !npmHasError) {
      throw new Error(`Error handling parity issue for ${testName}: CF=${cfHasError}, NPM=${npmHasError}`);
    }

    this.tracker.log(`✅ ${testName}: Error handling parity confirmed`, 'info');
  }

  async sendToCloudflareWorker(request) {
    const url = this.testApiKey && this.testApiKey !== 'test-key' ? 
      `${this.cloudflareWorkerUrl}/${this.testApiKey}` : 
      this.cloudflareWorkerUrl;
      
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.testApiKey && this.testApiKey !== 'test-key' ? {} : { 'Authorization': `Bearer ${this.testApiKey}` })
      },
      body: JSON.stringify(request)
    });

    return response.json();
  }

  async sendToNPMPackage(request) {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      const env = { ...process.env, OPENAI_API_KEY: this.testApiKey };
      
      const child = spawn('node', [this.npmPackagePath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env
      });

      let responseData = '';

      child.stdout.on('data', (data) => {
        responseData += data.toString();
      });

      child.on('close', () => {
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
          reject(error);
        }
      });

      child.on('error', reject);

      // Send initialize first if needed
      if (request.method !== 'initialize') {
        child.stdin.write(JSON.stringify({
          jsonrpc: '2.0',
          id: 0,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            clientInfo: { name: 'parity-test-client', version: '1.0.0' }
          }
        }) + '\n');
      }
      
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
      case 'thread-create':
        return TestDataGenerator.getValidThreadData();
      case 'thread-get':
        return { thread_id: testThreadId };
      case 'thread-update':
        return { thread_id: testThreadId, metadata: { updated: 'true' } };
      case 'thread-delete':
        return { thread_id: testThreadId };
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
      case 'run-step-list':
        return { thread_id: testThreadId, run_id: testRunId, limit: 5 };
      case 'run-step-get':
        return { thread_id: testThreadId, run_id: testRunId, step_id: testStepId };
      default:
        return {};
    }
  }

  generateParityReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🔄 DEPLOYMENT PARITY REPORT');
    console.log('='.repeat(80));

    const totalTests = this.parityResults.length;
    const passedTests = this.parityResults.filter(r => r.issues.length === 0).length;
    const failedTests = this.parityResults.filter(r => r.issues.length > 0).length;

    console.log(`Total Parity Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Parity Rate: ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%`);

    if (failedTests > 0) {
      console.log('\n❌ PARITY ISSUES:');
      this.parityResults.filter(r => r.issues.length > 0).forEach(result => {
        console.log(`  ${result.testName}:`);
        result.issues.forEach(issue => {
          console.log(`    - ${issue}`);
        });
      });
    } else {
      console.log('\n✅ PERFECT DEPLOYMENT PARITY');
      console.log('Both Cloudflare Workers and NPM package implementations are identical');
    }

    console.log('='.repeat(80));
  }

  generateReport() {
    const report = this.tracker.generateReport();
    this.generateParityReport();
    return report;
  }
}

// Run the tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new DeploymentParityTester();
  
  tester.runAllTests().then(success => {
    const report = tester.generateReport();
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Deployment parity test runner failed:', error);
    process.exit(1);
  });
}

export { DeploymentParityTester };