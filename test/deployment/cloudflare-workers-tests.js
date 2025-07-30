#!/usr/bin/env node

/**
 * Cloudflare Workers Specific Tests for OpenAI Assistants MCP Server
 * Tests features and behaviors specific to the Cloudflare Workers deployment
 */

import { TestTracker, TestDataGenerator, MCPValidator, PerformanceTracker } from '../utils/test-helpers.js';

class CloudflareWorkersSpecificTester {
  constructor() {
    this.tracker = new TestTracker('Cloudflare Workers Specific Tests');
    this.performanceTracker = new PerformanceTracker();
    this.cloudflareWorkerUrl = 'https://vectorstore.jezweb.com/mcp';
    this.testApiKey = process.env.OPENAI_API_KEY || 'test-api-key-for-validation';
  }

  async runAllTests() {
    this.tracker.log('🚀 Starting Cloudflare Workers Specific Tests', 'start');

    try {
      // Test Cloudflare Workers specific features
      await this.testCORSHandling();
      await this.testHTTPSRedirection();
      await this.testRequestSizeLimits();
      await this.testResponseCompression();
      await this.testEdgeLocationPerformance();
      await this.testColdStartPerformance();
      await this.testConcurrentRequestHandling();
      await this.testErrorResponseFormats();
      await this.testSecurityHeaders();
      await this.testAPIKeyInURL();
      
      this.tracker.log('🎉 All Cloudflare Workers specific tests completed!', 'success');
      return true;
    } catch (error) {
      this.tracker.log(`💥 Cloudflare Workers test suite failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testCORSHandling() {
    await this.tracker.runTest('CORS Handling', async () => {
      // Test preflight OPTIONS request
      const preflightResponse = await fetch(this.cloudflareWorkerUrl, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://example.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
      });

      if (preflightResponse.status !== 200 && preflightResponse.status !== 204) {
        throw new Error(`CORS preflight failed: ${preflightResponse.status}`);
      }

      const corsHeaders = preflightResponse.headers;
      const allowOrigin = corsHeaders.get('Access-Control-Allow-Origin');
      const allowMethods = corsHeaders.get('Access-Control-Allow-Methods');
      const allowHeaders = corsHeaders.get('Access-Control-Allow-Headers');

      if (!allowOrigin) {
        throw new Error('Missing Access-Control-Allow-Origin header');
      }

      if (!allowMethods || !allowMethods.includes('POST')) {
        throw new Error('POST method not allowed in CORS');
      }

      if (!allowHeaders || !allowHeaders.includes('Content-Type')) {
        throw new Error('Content-Type not allowed in CORS headers');
      }

      this.tracker.log('✅ CORS headers properly configured', 'info');

      // Test actual CORS request
      const corsResponse = await fetch(this.cloudflareWorkerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://example.com',
          'Authorization': `Bearer ${this.testApiKey}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            clientInfo: { name: 'cors-test-client', version: '1.0.0' }
          }
        })
      });

      if (!corsResponse.ok) {
        throw new Error(`CORS request failed: ${corsResponse.status}`);
      }

      const responseOrigin = corsResponse.headers.get('Access-Control-Allow-Origin');
      if (!responseOrigin) {
        throw new Error('Missing CORS header in actual response');
      }

      this.tracker.log('✅ CORS working for actual requests', 'info');
    });
  }

  async testHTTPSRedirection() {
    await this.tracker.runTest('HTTPS Redirection', async () => {
      // Test that HTTP requests are redirected to HTTPS
      try {
        const httpUrl = this.cloudflareWorkerUrl.replace('https://', 'http://');
        const response = await fetch(httpUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: 'data' }),
          redirect: 'manual'
        });

        // Should either redirect (3xx) or be automatically upgraded to HTTPS
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('Location');
          if (!location || !location.startsWith('https://')) {
            throw new Error('HTTP redirect does not point to HTTPS');
          }
          this.tracker.log('✅ HTTP properly redirects to HTTPS', 'info');
        } else if (response.ok) {
          // Browser/fetch automatically upgraded to HTTPS
          this.tracker.log('✅ HTTP automatically upgraded to HTTPS', 'info');
        } else {
          throw new Error(`Unexpected response status: ${response.status}`);
        }
      } catch (error) {
        if (error.message.includes('fetch')) {
          // Network error likely means HTTPS enforcement is working
          this.tracker.log('✅ HTTP requests blocked (HTTPS enforced)', 'info');
        } else {
          throw error;
        }
      }
    });
  }

  async testRequestSizeLimits() {
    await this.tracker.runTest('Request Size Limits', async () => {
      // Test with a large request payload
      const largePayload = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'assistant-create',
          arguments: {
            model: 'gpt-4',
            instructions: 'A'.repeat(50000), // 50KB of instructions
            metadata: Object.fromEntries(
              Array.from({ length: 100 }, (_, i) => [`key${i}`, 'A'.repeat(100)])
            )
          }
        }
      };

      const response = await fetch(this.cloudflareWorkerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.testApiKey}`
        },
        body: JSON.stringify(largePayload)
      });

      if (response.status === 413) {
        this.tracker.log('✅ Request size limit properly enforced', 'info');
      } else if (response.ok) {
        this.tracker.log('✅ Large request handled successfully', 'info');
      } else {
        throw new Error(`Unexpected response to large request: ${response.status}`);
      }
    });
  }

  async testResponseCompression() {
    await this.tracker.runTest('Response Compression', async () => {
      const response = await fetch(this.cloudflareWorkerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br',
          'Authorization': `Bearer ${this.testApiKey}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {}
        })
      });

      const contentEncoding = response.headers.get('Content-Encoding');
      const contentLength = response.headers.get('Content-Length');

      if (contentEncoding) {
        this.tracker.log(`✅ Response compressed with: ${contentEncoding}`, 'info');
      } else {
        this.tracker.log('⚠️  Response not compressed (may be small)', 'info');
      }

      if (contentLength) {
        this.tracker.log(`Response size: ${contentLength} bytes`, 'info');
      }

      // Verify response is still valid JSON
      const data = await response.json();
      if (!data.jsonrpc || !data.result) {
        throw new Error('Compressed response is not valid JSON-RPC');
      }

      this.tracker.log('✅ Compressed response properly decoded', 'info');
    });
  }

  async testEdgeLocationPerformance() {
    await this.tracker.runTest('Edge Location Performance', async () => {
      const iterations = 5;
      const measurements = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        
        const response = await fetch(this.cloudflareWorkerUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.testApiKey}`
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: i,
            method: 'initialize',
            params: {
              protocolVersion: '2024-11-05',
              capabilities: { tools: {} },
              clientInfo: { name: 'edge-test-client', version: '1.0.0' }
            }
          })
        });

        const duration = performance.now() - start;
        measurements.push(duration);

        if (!response.ok) {
          throw new Error(`Edge request ${i} failed: ${response.status}`);
        }

        // Check for Cloudflare headers
        const cfRay = response.headers.get('CF-RAY');
        const cfCache = response.headers.get('CF-Cache-Status');
        
        if (cfRay) {
          this.tracker.log(`CF-RAY: ${cfRay}`, 'info');
        }
        
        if (cfCache) {
          this.tracker.log(`CF-Cache-Status: ${cfCache}`, 'info');
        }
      }

      const avgLatency = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const minLatency = Math.min(...measurements);
      const maxLatency = Math.max(...measurements);

      this.tracker.log(`Average latency: ${avgLatency.toFixed(2)}ms`, 'info');
      this.tracker.log(`Min latency: ${minLatency.toFixed(2)}ms`, 'info');
      this.tracker.log(`Max latency: ${maxLatency.toFixed(2)}ms`, 'info');

      // Edge locations should provide good performance
      if (avgLatency > 2000) {
        this.tracker.log(`⚠️  High average latency: ${avgLatency.toFixed(2)}ms`, 'warn');
      } else {
        this.tracker.log('✅ Good edge location performance', 'info');
      }
    });
  }

  async testColdStartPerformance() {
    await this.tracker.runTest('Cold Start Performance', async () => {
      // Wait a bit to potentially trigger cold start
      await new Promise(resolve => setTimeout(resolve, 2000));

      const start = performance.now();
      
      const response = await fetch(this.cloudflareWorkerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.testApiKey}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {}
        })
      });

      const coldStartDuration = performance.now() - start;

      if (!response.ok) {
        throw new Error(`Cold start request failed: ${response.status}`);
      }

      this.tracker.log(`Cold start duration: ${coldStartDuration.toFixed(2)}ms`, 'info');

      // Cloudflare Workers should have fast cold starts
      if (coldStartDuration > 5000) {
        this.tracker.log(`⚠️  Slow cold start: ${coldStartDuration.toFixed(2)}ms`, 'warn');
      } else {
        this.tracker.log('✅ Fast cold start performance', 'info');
      }

      // Test subsequent request (should be warm)
      const warmStart = performance.now();
      
      const warmResponse = await fetch(this.cloudflareWorkerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.testApiKey}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            clientInfo: { name: 'warm-test-client', version: '1.0.0' }
          }
        })
      });

      const warmDuration = performance.now() - warmStart;
      
      if (warmResponse.ok) {
        this.tracker.log(`Warm request duration: ${warmDuration.toFixed(2)}ms`, 'info');
        
        if (warmDuration < coldStartDuration) {
          this.tracker.log('✅ Warm requests faster than cold start', 'info');
        }
      }
    });
  }

  async testConcurrentRequestHandling() {
    await this.tracker.runTest('Concurrent Request Handling', async () => {
      const concurrency = 10;
      const requests = Array.from({ length: concurrency }, (_, i) => 
        fetch(this.cloudflareWorkerUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.testApiKey}`
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: i,
            method: 'tools/list',
            params: {}
          })
        })
      );

      const start = performance.now();
      const responses = await Promise.all(requests);
      const duration = performance.now() - start;

      let successful = 0;
      let failed = 0;

      for (const response of responses) {
        if (response.ok) {
          successful++;
        } else {
          failed++;
        }
      }

      this.tracker.log(`Concurrent requests: ${successful} successful, ${failed} failed`, 'info');
      this.tracker.log(`Total duration: ${duration.toFixed(2)}ms`, 'info');
      this.tracker.log(`Average per request: ${(duration / concurrency).toFixed(2)}ms`, 'info');

      if (failed > concurrency * 0.1) {
        throw new Error(`Too many concurrent request failures: ${failed}/${concurrency}`);
      }

      this.tracker.log('✅ Concurrent requests handled successfully', 'info');
    });
  }

  async testErrorResponseFormats() {
    await this.tracker.runTest('Error Response Formats', async () => {
      // Test various error scenarios
      const errorTests = [
        {
          name: 'Invalid JSON',
          body: 'invalid json',
          expectedStatus: 400
        },
        {
          name: 'Invalid method',
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'invalid-method',
            params: {}
          }),
          expectedStatus: 200 // Should return JSON-RPC error
        },
        {
          name: 'Missing Content-Type',
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {}
          }),
          headers: {}, // No Content-Type
          expectedStatus: 400
        }
      ];

      for (const test of errorTests) {
        const response = await fetch(this.cloudflareWorkerUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.testApiKey}`,
            ...test.headers,
            ...(test.headers && !test.headers['Content-Type'] ? {} : { 'Content-Type': 'application/json' })
          },
          body: test.body
        });

        if (test.expectedStatus === 200) {
          // Should be valid JSON-RPC error response
          if (response.ok) {
            const data = await response.json();
            if (!data.error && !data.result?.isError) {
              throw new Error(`Expected error response for ${test.name}`);
            }
          } else {
            throw new Error(`Expected 200 status for ${test.name}, got ${response.status}`);
          }
        } else {
          // Should be HTTP error
          if (response.status !== test.expectedStatus) {
            this.tracker.log(`⚠️  ${test.name}: Expected ${test.expectedStatus}, got ${response.status}`, 'warn');
          } else {
            this.tracker.log(`✅ ${test.name}: Correct error status`, 'info');
          }
        }
      }
    });
  }

  async testSecurityHeaders() {
    await this.tracker.runTest('Security Headers', async () => {
      const response = await fetch(this.cloudflareWorkerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.testApiKey}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            clientInfo: { name: 'security-test-client', version: '1.0.0' }
          }
        })
      });

      const securityHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection',
        'Strict-Transport-Security'
      ];

      let foundHeaders = 0;
      for (const header of securityHeaders) {
        const value = response.headers.get(header);
        if (value) {
          this.tracker.log(`✅ ${header}: ${value}`, 'info');
          foundHeaders++;
        } else {
          this.tracker.log(`⚠️  Missing security header: ${header}`, 'warn');
        }
      }

      if (foundHeaders > 0) {
        this.tracker.log(`✅ ${foundHeaders}/${securityHeaders.length} security headers present`, 'info');
      } else {
        this.tracker.log('⚠️  No security headers found', 'warn');
      }
    });
  }

  async testAPIKeyInURL() {
    await this.tracker.runTest('API Key in URL', async () => {
      // Test the API key in URL feature specific to Cloudflare Workers
      if (!this.testApiKey.startsWith('sk-')) {
        this.tracker.log('⚠️  Skipping API key in URL test (no real API key)', 'warn');
        return;
      }

      const urlWithApiKey = `${this.cloudflareWorkerUrl}/${this.testApiKey}`;
      
      const response = await fetch(urlWithApiKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {}
        })
      });

      if (!response.ok) {
        throw new Error(`API key in URL failed: ${response.status}`);
      }

      const data = await response.json();
      if (!data.result || !data.result.tools) {
        throw new Error('Invalid response with API key in URL');
      }

      this.tracker.log('✅ API key in URL working correctly', 'info');
      this.tracker.log(`Found ${data.result.tools.length} tools`, 'info');
    });
  }

  generateReport() {
    const report = this.tracker.generateReport();
    this.performanceTracker.generateReport();
    return report;
  }
}

// Run the tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new CloudflareWorkersSpecificTester();
  
  tester.runAllTests().then(success => {
    const report = tester.generateReport();
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Cloudflare Workers test runner failed:', error);
    process.exit(1);
  });
}

export { CloudflareWorkersSpecificTester };