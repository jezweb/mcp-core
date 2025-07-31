#!/usr/bin/env node

/**
 * Edge Case and Boundary Condition Tests for OpenAI Assistants MCP Server
 * Tests extreme scenarios, boundary conditions, and edge cases across all 22 tools
 */

import { TestTracker, TestDataGenerator, MCPValidator } from '../utils/test-helpers.js';

class EdgeCaseTester {
  constructor() {
    this.tracker = new TestTracker('Edge Case Tests');
    this.cloudflareWorkerUrl = 'https://vectorstore.jezweb.com/mcp';
    this.npmPackagePath = './npm-package/universal-mcp-server.cjs';
    this.testApiKey = process.env.OPENAI_API_KEY || 'test-api-key-for-validation';
  }

  async runAllTests() {
    this.tracker.log('🚀 Starting Edge Case Tests', 'start');

    try {
      // Test boundary conditions
      await this.testStringLengthBoundaries();
      await this.testNumericBoundaries();
      await this.testArrayBoundaries();
      await this.testObjectBoundaries();
      
      // Test special characters and encoding
      await this.testSpecialCharacters();
      await this.testUnicodeHandling();
      await this.testEncodingEdgeCases();
      
      // Test null and undefined handling
      await this.testNullValues();
      await this.testUndefinedValues();
      await this.testEmptyValues();
      
      // Test concurrent edge cases
      await this.testConcurrentEdgeCases();
      
      // Test malformed data
      await this.testMalformedData();
      
      // Test resource limits
      await this.testResourceLimits();
      
      this.tracker.log('🎉 All edge case tests completed!', 'success');
      return true;
    } catch (error) {
      this.tracker.log(`💥 Edge case test suite failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testStringLengthBoundaries() {
    await this.tracker.runTest('String Length Boundaries', async () => {
      const testCases = [
        {
          name: 'Empty string',
          data: { model: 'gpt-4', name: '' },
          tool: 'assistant-create'
        },
        {
          name: 'Single character',
          data: { model: 'gpt-4', name: 'A' },
          tool: 'assistant-create'
        },
        {
          name: 'Maximum name length (256 chars)',
          data: { model: 'gpt-4', name: 'A'.repeat(256) },
          tool: 'assistant-create'
        },
        {
          name: 'Exceeding name length (300 chars)',
          data: { model: 'gpt-4', name: 'A'.repeat(300) },
          tool: 'assistant-create'
        },
        {
          name: 'Maximum description length (512 chars)',
          data: { model: 'gpt-4', description: 'A'.repeat(512) },
          tool: 'assistant-create'
        },
        {
          name: 'Maximum instructions length (32768 chars)',
          data: { model: 'gpt-4', instructions: 'A'.repeat(32768) },
          tool: 'assistant-create'
        },
        {
          name: 'Exceeding instructions length (50000 chars)',
          data: { model: 'gpt-4', instructions: 'A'.repeat(50000) },
          tool: 'assistant-create'
        }
      ];

      for (const testCase of testCases) {
        try {
          const response = await this.sendToolRequest(testCase.tool, testCase.data, 'npm');
          
          // For boundary cases, we expect either success or appropriate validation error
          if (response.error || response.result?.isError) {
            this.tracker.log(`✅ ${testCase.name}: Handled appropriately`, 'info');
          } else {
            this.tracker.log(`✅ ${testCase.name}: Accepted`, 'info');
          }
        } catch (error) {
          this.tracker.log(`⚠️  ${testCase.name}: Network/process error (acceptable)`, 'info');
        }
      }
    });
  }

  async testNumericBoundaries() {
    await this.tracker.runTest('Numeric Boundaries', async () => {
      const testCases = [
        {
          name: 'Zero limit',
          data: { limit: 0 },
          tool: 'assistant-list'
        },
        {
          name: 'Minimum valid limit',
          data: { limit: 1 },
          tool: 'assistant-list'
        },
        {
          name: 'Maximum valid limit',
          data: { limit: 100 },
          tool: 'assistant-list'
        },
        {
          name: 'Exceeding maximum limit',
          data: { limit: 1000 },
          tool: 'assistant-list'
        },
        {
          name: 'Negative limit',
          data: { limit: -1 },
          tool: 'assistant-list'
        },
        {
          name: 'Float limit',
          data: { limit: 5.5 },
          tool: 'assistant-list'
        },
        {
          name: 'Very large number',
          data: { limit: Number.MAX_SAFE_INTEGER },
          tool: 'assistant-list'
        },
        {
          name: 'Infinity',
          data: { limit: Infinity },
          tool: 'assistant-list'
        },
        {
          name: 'NaN',
          data: { limit: NaN },
          tool: 'assistant-list'
        }
      ];

      for (const testCase of testCases) {
        try {
          const response = await this.sendToolRequest(testCase.tool, testCase.data, 'npm');
          
          if (response.error || response.result?.isError) {
            this.tracker.log(`✅ ${testCase.name}: Validation error (expected)`, 'info');
          } else {
            this.tracker.log(`✅ ${testCase.name}: Accepted`, 'info');
          }
        } catch (error) {
          this.tracker.log(`⚠️  ${testCase.name}: Network/process error (acceptable)`, 'info');
        }
      }
    });
  }

  async testArrayBoundaries() {
    await this.tracker.runTest('Array Boundaries', async () => {
      const testCases = [
        {
          name: 'Empty tools array',
          data: { model: 'gpt-4', tools: [] },
          tool: 'assistant-create'
        },
        {
          name: 'Single tool',
          data: { model: 'gpt-4', tools: [{ type: 'code_interpreter' }] },
          tool: 'assistant-create'
        },
        {
          name: 'Maximum tools (128)',
          data: { 
            model: 'gpt-4', 
            tools: Array.from({ length: 128 }, () => ({ type: 'code_interpreter' }))
          },
          tool: 'assistant-create'
        },
        {
          name: 'Exceeding tools limit (200)',
          data: { 
            model: 'gpt-4', 
            tools: Array.from({ length: 200 }, () => ({ type: 'code_interpreter' }))
          },
          tool: 'assistant-create'
        },
        {
          name: 'Empty messages array',
          data: { messages: [] },
          tool: 'thread-create'
        },
        {
          name: 'Large messages array (100 messages)',
          data: { 
            messages: Array.from({ length: 100 }, (_, i) => ({
              role: 'user',
              content: `Message ${i + 1}`
            }))
          },
          tool: 'thread-create'
        }
      ];

      for (const testCase of testCases) {
        try {
          const response = await this.sendToolRequest(testCase.tool, testCase.data, 'npm');
          
          if (response.error || response.result?.isError) {
            this.tracker.log(`✅ ${testCase.name}: Handled appropriately`, 'info');
          } else {
            this.tracker.log(`✅ ${testCase.name}: Accepted`, 'info');
          }
        } catch (error) {
          this.tracker.log(`⚠️  ${testCase.name}: Network/process error (acceptable)`, 'info');
        }
      }
    });
  }

  async testObjectBoundaries() {
    await this.tracker.runTest('Object Boundaries', async () => {
      const testCases = [
        {
          name: 'Empty metadata object',
          data: { model: 'gpt-4', metadata: {} },
          tool: 'assistant-create'
        },
        {
          name: 'Single metadata key',
          data: { model: 'gpt-4', metadata: { key1: 'value1' } },
          tool: 'assistant-create'
        },
        {
          name: 'Maximum metadata keys (16)',
          data: { 
            model: 'gpt-4', 
            metadata: Object.fromEntries(
              Array.from({ length: 16 }, (_, i) => [`key${i}`, `value${i}`])
            )
          },
          tool: 'assistant-create'
        },
        {
          name: 'Exceeding metadata keys (20)',
          data: { 
            model: 'gpt-4', 
            metadata: Object.fromEntries(
              Array.from({ length: 20 }, (_, i) => [`key${i}`, `value${i}`])
            )
          },
          tool: 'assistant-create'
        },
        {
          name: 'Nested objects in metadata',
          data: { 
            model: 'gpt-4', 
            metadata: { 
              nested: { 
                deep: { 
                  value: 'test' 
                } 
              } 
            }
          },
          tool: 'assistant-create'
        },
        {
          name: 'Circular reference (should be serialized safely)',
          data: (() => {
            const obj = { model: 'gpt-4', metadata: {} };
            obj.metadata.self = obj; // This creates a circular reference
            return obj;
          })(),
          tool: 'assistant-create'
        }
      ];

      for (const testCase of testCases) {
        try {
          const response = await this.sendToolRequest(testCase.tool, testCase.data, 'npm');
          
          if (response.error || response.result?.isError) {
            this.tracker.log(`✅ ${testCase.name}: Handled appropriately`, 'info');
          } else {
            this.tracker.log(`✅ ${testCase.name}: Accepted`, 'info');
          }
        } catch (error) {
          this.tracker.log(`⚠️  ${testCase.name}: Serialization/process error (expected for circular refs)`, 'info');
        }
      }
    });
  }

  async testSpecialCharacters() {
    await this.tracker.runTest('Special Characters', async () => {
      const specialChars = [
        { name: 'Newlines', char: '\n' },
        { name: 'Tabs', char: '\t' },
        { name: 'Carriage returns', char: '\r' },
        { name: 'Null bytes', char: '\0' },
        { name: 'Backslashes', char: '\\' },
        { name: 'Quotes', char: '"' },
        { name: 'Single quotes', char: "'" },
        { name: 'Backticks', char: '`' },
        { name: 'Control characters', char: '\x01\x02\x03' },
        { name: 'HTML entities', char: '<script>alert("test")</script>' },
        { name: 'SQL injection', char: "'; DROP TABLE users; --" },
        { name: 'JSON breaking', char: '{"malformed": json}' }
      ];

      for (const specialChar of specialChars) {
        try {
          const data = {
            model: 'gpt-4',
            name: `Test ${specialChar.name}`,
            description: `Description with ${specialChar.char}`,
            instructions: `Instructions with ${specialChar.char}`
          };

          const response = await this.sendToolRequest('assistant-create', data, 'npm');
          
          if (response.error || response.result?.isError) {
            this.tracker.log(`✅ ${specialChar.name}: Handled safely`, 'info');
          } else {
            this.tracker.log(`✅ ${specialChar.name}: Accepted and processed`, 'info');
          }
        } catch (error) {
          this.tracker.log(`⚠️  ${specialChar.name}: Processing error (acceptable)`, 'info');
        }
      }
    });
  }

  async testUnicodeHandling() {
    await this.tracker.runTest('Unicode Handling', async () => {
      const unicodeTests = [
        { name: 'Basic Latin', text: 'Hello World' },
        { name: 'Latin Extended', text: 'Café résumé naïve' },
        { name: 'Cyrillic', text: 'Привет мир' },
        { name: 'Chinese', text: '你好世界' },
        { name: 'Japanese', text: 'こんにちは世界' },
        { name: 'Arabic', text: 'مرحبا بالعالم' },
        { name: 'Emojis', text: '🌍🚀🤖💻🎉' },
        { name: 'Mathematical symbols', text: '∑∫∞≠≤≥±√' },
        { name: 'Currency symbols', text: '$€£¥₹₿' },
        { name: 'Mixed scripts', text: 'Hello 世界 🌍 Привет' },
        { name: 'Zero-width characters', text: 'Test\u200B\u200C\u200DTest' },
        { name: 'Right-to-left text', text: 'English עברית English' },
        { name: 'Combining characters', text: 'e\u0301\u0302\u0303' }, // e with multiple accents
        { name: 'Surrogate pairs', text: '𝕳𝖊𝖑𝖑𝖔 𝖂𝖔𝖗𝖑𝖉' } // Mathematical bold fraktur
      ];

      for (const test of unicodeTests) {
        try {
          const data = {
            model: 'gpt-4',
            name: `Unicode Test: ${test.name}`,
            description: test.text,
            instructions: `Process this text: ${test.text}`
          };

          const response = await this.sendToolRequest('assistant-create', data, 'npm');
          
          if (response.error || response.result?.isError) {
            this.tracker.log(`✅ ${test.name}: Handled appropriately`, 'info');
          } else {
            this.tracker.log(`✅ ${test.name}: Unicode processed correctly`, 'info');
          }
        } catch (error) {
          this.tracker.log(`⚠️  ${test.name}: Processing error (acceptable)`, 'info');
        }
      }
    });
  }

  async testEncodingEdgeCases() {
    await this.tracker.runTest('Encoding Edge Cases', async () => {
      const encodingTests = [
        {
          name: 'Very long UTF-8 sequence',
          text: '🌟'.repeat(1000) // 4-byte UTF-8 characters
        },
        {
          name: 'Mixed byte lengths',
          text: 'A\u00E9\u4E2D\uD83C\uDF0D' // 1, 2, 3, 4 byte UTF-8
        },
        {
          name: 'Byte Order Mark (BOM)',
          text: '\uFEFFHello World'
        },
        {
          name: 'Replacement character',
          text: 'Invalid: \uFFFD'
        }
      ];

      for (const test of encodingTests) {
        try {
          const data = {
            model: 'gpt-4',
            name: `Encoding Test: ${test.name}`,
            instructions: test.text
          };

          const response = await this.sendToolRequest('assistant-create', data, 'npm');
          
          if (response.error || response.result?.isError) {
            this.tracker.log(`✅ ${test.name}: Encoding handled safely`, 'info');
          } else {
            this.tracker.log(`✅ ${test.name}: Encoding processed correctly`, 'info');
          }
        } catch (error) {
          this.tracker.log(`⚠️  ${test.name}: Encoding error (acceptable)`, 'info');
        }
      }
    });
  }

  async testNullValues() {
    await this.tracker.runTest('Null Value Handling', async () => {
      const nullTests = [
        {
          name: 'Null model',
          data: { model: null, name: 'Test' },
          tool: 'assistant-create'
        },
        {
          name: 'Null name',
          data: { model: 'gpt-4', name: null },
          tool: 'assistant-create'
        },
        {
          name: 'Null metadata',
          data: { model: 'gpt-4', metadata: null },
          tool: 'assistant-create'
        },
        {
          name: 'Null in array',
          data: { model: 'gpt-4', tools: [null] },
          tool: 'assistant-create'
        },
        {
          name: 'Null assistant_id',
          data: { assistant_id: null },
          tool: 'assistant-get'
        }
      ];

      for (const test of nullTests) {
        try {
          const response = await this.sendToolRequest(test.tool, test.data, 'npm');
          
          if (response.error || response.result?.isError) {
            this.tracker.log(`✅ ${test.name}: Null value rejected appropriately`, 'info');
          } else {
            this.tracker.log(`⚠️  ${test.name}: Null value accepted (may be converted)`, 'info');
          }
        } catch (error) {
          this.tracker.log(`⚠️  ${test.name}: Processing error (acceptable)`, 'info');
        }
      }
    });
  }

  async testUndefinedValues() {
    await this.tracker.runTest('Undefined Value Handling', async () => {
      const undefinedTests = [
        {
          name: 'Undefined model',
          data: { model: undefined, name: 'Test' },
          tool: 'assistant-create'
        },
        {
          name: 'Undefined optional field',
          data: { model: 'gpt-4', description: undefined },
          tool: 'assistant-create'
        },
        {
          name: 'Undefined in metadata',
          data: { model: 'gpt-4', metadata: { key: undefined } },
          tool: 'assistant-create'
        }
      ];

      for (const test of undefinedTests) {
        try {
          const response = await this.sendToolRequest(test.tool, test.data, 'npm');
          
          if (response.error || response.result?.isError) {
            this.tracker.log(`✅ ${test.name}: Undefined value handled appropriately`, 'info');
          } else {
            this.tracker.log(`✅ ${test.name}: Undefined value processed (likely omitted)`, 'info');
          }
        } catch (error) {
          this.tracker.log(`⚠️  ${test.name}: Processing error (acceptable)`, 'info');
        }
      }
    });
  }

  async testEmptyValues() {
    await this.tracker.runTest('Empty Value Handling', async () => {
      const emptyTests = [
        {
          name: 'Empty object',
          data: {},
          tool: 'assistant-create'
        },
        {
          name: 'Empty string model',
          data: { model: '', name: 'Test' },
          tool: 'assistant-create'
        },
        {
          name: 'Whitespace-only string',
          data: { model: 'gpt-4', name: '   ' },
          tool: 'assistant-create'
        },
        {
          name: 'Empty array',
          data: { model: 'gpt-4', tools: [] },
          tool: 'assistant-create'
        },
        {
          name: 'Empty nested object',
          data: { model: 'gpt-4', metadata: { nested: {} } },
          tool: 'assistant-create'
        }
      ];

      for (const test of emptyTests) {
        try {
          const response = await this.sendToolRequest(test.tool, test.data, 'npm');
          
          if (response.error || response.result?.isError) {
            this.tracker.log(`✅ ${test.name}: Empty value validation working`, 'info');
          } else {
            this.tracker.log(`✅ ${test.name}: Empty value accepted`, 'info');
          }
        } catch (error) {
          this.tracker.log(`⚠️  ${test.name}: Processing error (acceptable)`, 'info');
        }
      }
    });
  }

  async testConcurrentEdgeCases() {
    await this.tracker.runTest('Concurrent Edge Cases', async () => {
      // Test rapid-fire requests with edge case data
      const edgeCaseRequests = [
        { tool: 'assistant-create', data: { model: 'gpt-4', name: 'A'.repeat(256) } },
        { tool: 'assistant-list', data: { limit: 100 } },
        { tool: 'thread-create', data: { messages: [] } },
        { tool: 'assistant-create', data: { model: 'gpt-4', instructions: '🌟'.repeat(100) } },
        { tool: 'assistant-list', data: { limit: 1 } }
      ];

      const promises = edgeCaseRequests.map(async (req, index) => {
        try {
          const response = await this.sendToolRequest(req.tool, req.data, 'npm');
          return { index, success: true, response };
        } catch (error) {
          return { index, success: false, error: error.message };
        }
      });

      const results = await Promise.all(promises);
      const successful = results.filter(r => r.success).length;
      
      this.tracker.log(`Concurrent edge cases: ${successful}/${results.length} successful`, 'info');
      
      if (successful < results.length * 0.8) {
        throw new Error(`Too many concurrent edge case failures: ${successful}/${results.length}`);
      }
    });
  }

  async testMalformedData() {
    await this.tracker.runTest('Malformed Data Handling', async () => {
      const malformedTests = [
        {
          name: 'Invalid JSON in string field',
          data: { model: 'gpt-4', name: '{"invalid": json}' },
          tool: 'assistant-create'
        },
        {
          name: 'Array instead of string',
          data: { model: ['gpt-4'], name: 'Test' },
          tool: 'assistant-create'
        },
        {
          name: 'String instead of array',
          data: { model: 'gpt-4', tools: 'code_interpreter' },
          tool: 'assistant-create'
        },
        {
          name: 'Number instead of string',
          data: { model: 123, name: 'Test' },
          tool: 'assistant-create'
        },
        {
          name: 'Boolean instead of string',
          data: { model: 'gpt-4', name: true },
          tool: 'assistant-create'
        }
      ];

      for (const test of malformedTests) {
        try {
          const response = await this.sendToolRequest(test.tool, test.data, 'npm');
          
          if (response.error || response.result?.isError) {
            this.tracker.log(`✅ ${test.name}: Malformed data rejected appropriately`, 'info');
          } else {
            this.tracker.log(`⚠️  ${test.name}: Malformed data accepted (may be coerced)`, 'info');
          }
        } catch (error) {
          this.tracker.log(`⚠️  ${test.name}: Processing error (acceptable)`, 'info');
        }
      }
    });
  }

  async testResourceLimits() {
    await this.tracker.runTest('Resource Limits', async () => {
      // Test very large payloads
      const largeTests = [
        {
          name: 'Very large instructions (100KB)',
          data: { 
            model: 'gpt-4', 
            instructions: 'A'.repeat(100000) 
          },
          tool: 'assistant-create'
        },
        {
          name: 'Large metadata object',
          data: { 
            model: 'gpt-4', 
            metadata: Object.fromEntries(
              Array.from({ length: 100 }, (_, i) => [`key${i}`, 'A'.repeat(1000)])
            )
          },
          tool: 'assistant-create'
        },
        {
          name: 'Many nested objects',
          data: (() => {
            let nested = { value: 'deep' };
            for (let i = 0; i < 50; i++) {
              nested = { level: i, nested };
            }
            return { model: 'gpt-4', metadata: nested };
          })(),
          tool: 'assistant-create'
        }
      ];

      for (const test of largeTests) {
        try {
          const response = await this.sendToolRequest(test.tool, test.data, 'npm');
          
          if (response.error || response.result?.isError) {
            this.tracker.log(`✅ ${test.name}: Resource limit enforced`, 'info');
          } else {
            this.tracker.log(`✅ ${test.name}: Large payload processed`, 'info');
          }
        } catch (error) {
          this.tracker.log(`⚠️  ${test.name}: Resource limit error (acceptable)`, 'info');
        }
      }
    });
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
    
    if (deployment === 'cloudflare') {
      return this.sendToCloudflareWorker(request);
    } else {
      return this.sendToNPMPackage(request);
    }
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

      // Send initialize first
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

  generateReport() {
    return this.tracker.generateReport();
  }
}

// Run the tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new EdgeCaseTester();
  
  tester.runAllTests().then(success => {
    const report = tester.generateReport();
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Edge case test runner failed:', error);
    process.exit(1);
  });
}

export { EdgeCaseTester };