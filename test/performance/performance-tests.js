#!/usr/bin/env node

/**
 * Performance Tests for OpenAI Assistants MCP Server
 * Tests performance characteristics of both Cloudflare Workers and NPM package deployments
 */

import { TestTracker, TestDataGenerator, PerformanceTracker } from '../utils/test-helpers.js';

class PerformanceTester {
  constructor() {
    this.tracker = new TestTracker('Performance Tests');
    this.performanceTracker = new PerformanceTracker();
    this.cloudflareWorkerUrl = 'https://vectorstore.jezweb.com/mcp';
    this.npmPackagePath = './npm-package/universal-mcp-server.cjs';
    this.testApiKey = process.env.OPENAI_API_KEY || 'test-api-key-for-validation';
    
    // Performance thresholds (in milliseconds)
    this.thresholds = {
      initialize: 2000,
      toolsList: 1000,
      toolCall: 5000,
      concurrent: 10000
    };
  }

  async runAllTests() {
    this.tracker.log('🚀 Starting Performance Tests', 'start');

    try {
      // Test individual operation performance
      await this.testInitializePerformance();
      await this.testToolsListPerformance();
      await this.testToolCallPerformance();
      
      // Test concurrent operations
      await this.testConcurrentRequests();
      
      // Test load scenarios
      await this.testLoadScenarios();
      
      // Compare deployments
      await this.compareDeploymentPerformance();
      
      // Test memory usage (NPM package only)
      await this.testMemoryUsage();
      
      this.tracker.log('🎉 All performance tests completed!', 'success');
      return true;
    } catch (error) {
      this.tracker.log(`💥 Performance test suite failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testInitializePerformance() {
    await this.tracker.runTest('Initialize Performance', async () => {
      const iterations = 10;
      
      // Test Cloudflare Workers
      const cloudflareStats = await this.measureInitialize('cloudflare', iterations);
      this.tracker.log(`Cloudflare Workers initialize: ${cloudflareStats.avg.toFixed(2)}ms avg`, 'info');
      
      // Test NPM Package
      const npmStats = await this.measureInitialize('npm', iterations);
      this.tracker.log(`NPM Package initialize: ${npmStats.avg.toFixed(2)}ms avg`, 'info');
      
      // Validate performance thresholds
      if (cloudflareStats.avg > this.thresholds.initialize) {
        throw new Error(`Cloudflare Workers initialize too slow: ${cloudflareStats.avg.toFixed(2)}ms > ${this.thresholds.initialize}ms`);
      }
      
      if (npmStats.avg > this.thresholds.initialize) {
        throw new Error(`NPM Package initialize too slow: ${npmStats.avg.toFixed(2)}ms > ${this.thresholds.initialize}ms`);
      }
      
      this.tracker.log('✅ Initialize performance within acceptable limits', 'pass');
    });
  }

  async testToolsListPerformance() {
    await this.tracker.runTest('Tools List Performance', async () => {
      const iterations = 10;
      
      // Test Cloudflare Workers
      const cloudflareStats = await this.measureToolsList('cloudflare', iterations);
      this.tracker.log(`Cloudflare Workers tools/list: ${cloudflareStats.avg.toFixed(2)}ms avg`, 'info');
      
      // Test NPM Package
      const npmStats = await this.measureToolsList('npm', iterations);
      this.tracker.log(`NPM Package tools/list: ${npmStats.avg.toFixed(2)}ms avg`, 'info');
      
      // Validate performance thresholds
      if (cloudflareStats.avg > this.thresholds.toolsList) {
        throw new Error(`Cloudflare Workers tools/list too slow: ${cloudflareStats.avg.toFixed(2)}ms > ${this.thresholds.toolsList}ms`);
      }
      
      if (npmStats.avg > this.thresholds.toolsList) {
        throw new Error(`NPM Package tools/list too slow: ${npmStats.avg.toFixed(2)}ms > ${this.thresholds.toolsList}ms`);
      }
      
      this.tracker.log('✅ Tools list performance within acceptable limits', 'pass');
    });
  }

  async testToolCallPerformance() {
    await this.tracker.runTest('Tool Call Performance', async () => {
      const iterations = 5;
      const testTools = ['assistant-list', 'thread-create', 'message-create'];
      
      for (const tool of testTools) {
        // Test Cloudflare Workers
        const cloudflareStats = await this.measureToolCall(tool, 'cloudflare', iterations);
        this.tracker.log(`Cloudflare Workers ${tool}: ${cloudflareStats.avg.toFixed(2)}ms avg`, 'info');
        
        // Test NPM Package
        const npmStats = await this.measureToolCall(tool, 'npm', iterations);
        this.tracker.log(`NPM Package ${tool}: ${npmStats.avg.toFixed(2)}ms avg`, 'info');
        
        // Validate performance thresholds
        if (cloudflareStats.avg > this.thresholds.toolCall) {
          throw new Error(`Cloudflare Workers ${tool} too slow: ${cloudflareStats.avg.toFixed(2)}ms > ${this.thresholds.toolCall}ms`);
        }
        
        if (npmStats.avg > this.thresholds.toolCall) {
          throw new Error(`NPM Package ${tool} too slow: ${npmStats.avg.toFixed(2)}ms > ${this.thresholds.toolCall}ms`);
        }
      }
      
      this.tracker.log('✅ Tool call performance within acceptable limits', 'pass');
    });
  }

  async testConcurrentRequests() {
    await this.tracker.runTest('Concurrent Request Performance', async () => {
      const concurrency = 5;
      const tool = 'assistant-list';
      
      // Test Cloudflare Workers
      const cloudflareStats = await this.measureConcurrentRequests(tool, 'cloudflare', concurrency);
      this.tracker.log(`Cloudflare Workers concurrent (${concurrency}): ${cloudflareStats.avg.toFixed(2)}ms avg`, 'info');
      
      // Test NPM Package
      const npmStats = await this.measureConcurrentRequests(tool, 'npm', concurrency);
      this.tracker.log(`NPM Package concurrent (${concurrency}): ${npmStats.avg.toFixed(2)}ms avg`, 'info');
      
      // Validate performance thresholds
      if (cloudflareStats.avg > this.thresholds.concurrent) {
        throw new Error(`Cloudflare Workers concurrent requests too slow: ${cloudflareStats.avg.toFixed(2)}ms > ${this.thresholds.concurrent}ms`);
      }
      
      if (npmStats.avg > this.thresholds.concurrent) {
        throw new Error(`NPM Package concurrent requests too slow: ${npmStats.avg.toFixed(2)}ms > ${this.thresholds.concurrent}ms`);
      }
      
      this.tracker.log('✅ Concurrent request performance within acceptable limits', 'pass');
    });
  }

  async testLoadScenarios() {
    await this.tracker.runTest('Load Scenario Testing', async () => {
      const scenarios = [
        { name: 'Light Load', requests: 10, concurrency: 2 },
        { name: 'Medium Load', requests: 20, concurrency: 5 },
        { name: 'Heavy Load', requests: 50, concurrency: 10 }
      ];
      
      for (const scenario of scenarios) {
        this.tracker.log(`Testing ${scenario.name}: ${scenario.requests} requests, ${scenario.concurrency} concurrent`, 'info');
        
        // Test Cloudflare Workers
        const cloudflareStats = await this.measureLoadScenario('cloudflare', scenario);
        this.tracker.log(`Cloudflare Workers ${scenario.name}: ${cloudflareStats.totalTime.toFixed(2)}ms total, ${cloudflareStats.avgPerRequest.toFixed(2)}ms per request`, 'info');
        
        // Test NPM Package
        const npmStats = await this.measureLoadScenario('npm', scenario);
        this.tracker.log(`NPM Package ${scenario.name}: ${npmStats.totalTime.toFixed(2)}ms total, ${npmStats.avgPerRequest.toFixed(2)}ms per request`, 'info');
        
        // Validate that system can handle the load
        if (cloudflareStats.errors > scenario.requests * 0.1) {
          throw new Error(`Too many errors in Cloudflare Workers ${scenario.name}: ${cloudflareStats.errors}/${scenario.requests}`);
        }
        
        if (npmStats.errors > scenario.requests * 0.1) {
          throw new Error(`Too many errors in NPM Package ${scenario.name}: ${npmStats.errors}/${scenario.requests}`);
        }
      }
      
      this.tracker.log('✅ Load scenario testing completed successfully', 'pass');
    });
  }

  async compareDeploymentPerformance() {
    await this.tracker.runTest('Deployment Performance Comparison', async () => {
      const testCases = [
        { tool: 'assistant-list', data: { limit: 5 } },
        { tool: 'thread-create', data: TestDataGenerator.getValidThreadData() },
        { tool: 'message-create', data: { thread_id: 'test', ...TestDataGenerator.getValidMessageData() } }
      ];
      
      const results = {};
      
      for (const testCase of testCases) {
        const cloudflareStats = await this.measureToolCall(testCase.tool, 'cloudflare', 5);
        const npmStats = await this.measureToolCall(testCase.tool, 'npm', 5);
        
        results[testCase.tool] = {
          cloudflare: cloudflareStats,
          npm: npmStats,
          ratio: npmStats.avg / cloudflareStats.avg
        };
        
        this.tracker.log(`${testCase.tool}: CF=${cloudflareStats.avg.toFixed(2)}ms, NPM=${npmStats.avg.toFixed(2)}ms, Ratio=${results[testCase.tool].ratio.toFixed(2)}`, 'info');
      }
      
      // Calculate overall performance comparison
      const avgRatio = Object.values(results).reduce((sum, r) => sum + r.ratio, 0) / Object.keys(results).length;
      this.tracker.log(`Overall performance ratio (NPM/Cloudflare): ${avgRatio.toFixed(2)}`, 'info');
      
      // Both deployments should be reasonably close in performance
      if (avgRatio > 3.0 || avgRatio < 0.33) {
        this.tracker.log(`⚠️  Significant performance difference detected: ${avgRatio.toFixed(2)}`, 'warn');
      } else {
        this.tracker.log('✅ Performance parity between deployments', 'pass');
      }
    });
  }

  async testMemoryUsage() {
    await this.tracker.runTest('Memory Usage Testing', async () => {
      // This test is specific to NPM package as we can monitor process memory
      this.tracker.log('Testing NPM package memory usage...', 'info');
      
      const initialMemory = process.memoryUsage();
      this.tracker.log(`Initial memory: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`, 'info');
      
      // Perform multiple operations to test for memory leaks
      for (let i = 0; i < 20; i++) {
        await this.sendToolRequest('assistant-list', { limit: 5 }, 'npm');
      }
      
      const finalMemory = process.memoryUsage();
      this.tracker.log(`Final memory: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`, 'info');
      
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;
      
      this.tracker.log(`Memory increase: ${memoryIncreaseMB.toFixed(2)}MB`, 'info');
      
      // Memory increase should be reasonable (less than 50MB for this test)
      if (memoryIncreaseMB > 50) {
        throw new Error(`Excessive memory usage detected: ${memoryIncreaseMB.toFixed(2)}MB increase`);
      }
      
      this.tracker.log('✅ Memory usage within acceptable limits', 'pass');
    });
  }

  async measureInitialize(deployment, iterations) {
    const measurements = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      try {
        const request = {
          jsonrpc: '2.0',
          id: i,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            clientInfo: { name: 'test-client', version: '1.0.0' }
          }
        };
        
        await this.sendRequest(request, deployment);
        const duration = performance.now() - start;
        measurements.push(duration);
      } catch (error) {
        // For test scenarios, errors are acceptable
        const duration = performance.now() - start;
        measurements.push(duration);
      }
    }
    
    return this.calculateStats(measurements);
  }

  async measureToolsList(deployment, iterations) {
    const measurements = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      try {
        const request = {
          jsonrpc: '2.0',
          id: i,
          method: 'tools/list',
          params: {}
        };
        
        await this.sendRequest(request, deployment);
        const duration = performance.now() - start;
        measurements.push(duration);
      } catch (error) {
        const duration = performance.now() - start;
        measurements.push(duration);
      }
    }
    
    return this.calculateStats(measurements);
  }

  async measureToolCall(tool, deployment, iterations) {
    const measurements = [];
    const testData = this.getTestDataForTool(tool);
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      try {
        await this.sendToolRequest(tool, testData, deployment);
        const duration = performance.now() - start;
        measurements.push(duration);
      } catch (error) {
        const duration = performance.now() - start;
        measurements.push(duration);
      }
    }
    
    return this.calculateStats(measurements);
  }

  async measureConcurrentRequests(tool, deployment, concurrency) {
    const testData = this.getTestDataForTool(tool);
    const start = performance.now();
    
    const promises = Array.from({ length: concurrency }, () => 
      this.sendToolRequest(tool, testData, deployment).catch(() => {})
    );
    
    await Promise.all(promises);
    const totalDuration = performance.now() - start;
    
    return {
      avg: totalDuration,
      min: totalDuration,
      max: totalDuration,
      total: totalDuration
    };
  }

  async measureLoadScenario(deployment, scenario) {
    const start = performance.now();
    let completed = 0;
    let errors = 0;
    const measurements = [];
    
    // Create batches of concurrent requests
    const batches = Math.ceil(scenario.requests / scenario.concurrency);
    
    for (let batch = 0; batch < batches; batch++) {
      const batchSize = Math.min(scenario.concurrency, scenario.requests - (batch * scenario.concurrency));
      const batchStart = performance.now();
      
      const promises = Array.from({ length: batchSize }, async () => {
        try {
          await this.sendToolRequest('assistant-list', { limit: 5 }, deployment);
          completed++;
        } catch (error) {
          errors++;
        }
      });
      
      await Promise.all(promises);
      const batchDuration = performance.now() - batchStart;
      measurements.push(batchDuration);
    }
    
    const totalTime = performance.now() - start;
    
    return {
      totalTime,
      avgPerRequest: totalTime / scenario.requests,
      completed,
      errors,
      batches: measurements.length
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
            clientInfo: { name: 'test-client', version: '1.0.0' }
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

  getTestDataForTool(tool) {
    switch (tool) {
      case 'assistant-list':
        return { limit: 5 };
      case 'thread-create':
        return TestDataGenerator.getValidThreadData();
      case 'message-create':
        return { thread_id: 'test-thread-id', ...TestDataGenerator.getValidMessageData() };
      default:
        return {};
    }
  }

  calculateStats(measurements) {
    if (measurements.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }
    
    return {
      avg: measurements.reduce((a, b) => a + b, 0) / measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      count: measurements.length
    };
  }

  generateReport() {
    const report = this.tracker.generateReport();
    this.performanceTracker.generateReport();
    return report;
  }
}

// Run the tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new PerformanceTester();
  
  tester.runAllTests().then(success => {
    const report = tester.generateReport();
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Performance test runner failed:', error);
    process.exit(1);
  });
}

export { PerformanceTester };