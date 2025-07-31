#!/usr/bin/env node

/**
 * Completions Functionality Test
 * 
 * This test validates the MCP completions implementation according to the
 * MCP specification requirements:
 * 1. Capability declaration includes completions: {}
 * 2. completion/complete method is implemented
 * 3. Completions provide contextual suggestions for prompts and resources
 * 4. Maximum 100 items per response compliance
 * 5. Proper response format with values, total, and hasMore fields
 */

import { BaseMCPHandler } from './shared/core/base-mcp-handler.js';

class CompletionsTest {
  constructor() {
    this.handler = new BaseMCPHandler({
      apiKey: 'test-api-key',
      serverName: 'test-server',
      serverVersion: '1.0.0',
      debug: false,
      capabilities: {
        tools: { listChanged: false },
        resources: { subscribe: false, listChanged: false },
        prompts: { listChanged: false },
        completions: {},
      }
    });
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Starting Completions Functionality Tests...\n');

    try {
      await this.testCapabilityDeclaration();
      await this.testPromptCompletions();
      await this.testResourceCompletions();
      await this.testCompletionLimits();
      await this.testCompletionFiltering();
      await this.testErrorHandling();

      this.printResults();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  }

  /**
   * Test 1: Verify completions capability is declared
   */
  async testCapabilityDeclaration() {
    console.log('📋 Test 1: Capability Declaration');
    
    try {
      const response = await this.handler.handleRequest({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          clientInfo: { name: 'test-client', version: '1.0.0' }
        }
      });

      const capabilities = response.result?.capabilities;
      
      if (!capabilities) {
        throw new Error('No capabilities in initialize response');
      }

      if (!capabilities.hasOwnProperty('completions')) {
        throw new Error('Completions capability not declared');
      }

      this.addResult('✅ Completions capability declared', true);
      console.log('   ✅ Completions capability found in server capabilities\n');
    } catch (error) {
      this.addResult('❌ Completions capability declaration failed', false, error.message);
      console.log(`   ❌ Failed: ${error.message}\n`);
    }
  }

  /**
   * Test 2: Test prompt argument completions
   */
  async testPromptCompletions() {
    console.log('🎯 Test 2: Prompt Argument Completions');
    
    const testCases = [
      {
        name: 'Coding assistant specialization',
        ref: { type: 'ref/prompt', name: 'create-coding-assistant' },
        argument: { name: 'specialization', value: 'Python' },
        expectedContains: ['Python web development']
      },
      {
        name: 'Experience level completion',
        ref: { type: 'ref/prompt', name: 'create-coding-assistant' },
        argument: { name: 'experience_level', value: '' },
        expectedContains: ['beginner', 'intermediate', 'expert']
      },
      {
        name: 'Model name completion',
        ref: { type: 'ref/prompt', name: 'configure-assistant-run' },
        argument: { name: 'model', value: 'gpt' },
        expectedContains: ['gpt-4', 'gpt-3.5-turbo']
      }
    ];

    for (const testCase of testCases) {
      try {
        const response = await this.handler.handleRequest({
          jsonrpc: '2.0',
          id: 2,
          method: 'completion/complete',
          params: testCase
        });

        if (response.error) {
          throw new Error(`Completion request failed: ${response.error.message}`);
        }

        const completions = response.result?.completions;
        if (!completions || !Array.isArray(completions)) {
          throw new Error('Invalid completions response format');
        }

        const firstCompletion = completions[0];
        if (!firstCompletion || !Array.isArray(firstCompletion.values)) {
          throw new Error('Invalid completion item format');
        }

        // Check if expected values are present
        const hasExpected = testCase.expectedContains.some(expected =>
          firstCompletion.values.some(value => 
            value.toLowerCase().includes(expected.toLowerCase())
          )
        );

        if (!hasExpected) {
          throw new Error(`Expected completions not found. Got: ${firstCompletion.values.slice(0, 3).join(', ')}`);
        }

        this.addResult(`✅ ${testCase.name}`, true);
        console.log(`   ✅ ${testCase.name}: Found ${firstCompletion.values.length} completions`);
      } catch (error) {
        this.addResult(`❌ ${testCase.name}`, false, error.message);
        console.log(`   ❌ ${testCase.name}: ${error.message}`);
      }
    }
    console.log();
  }

  /**
   * Test 3: Test resource URI completions
   */
  async testResourceCompletions() {
    console.log('📁 Test 3: Resource URI Completions');
    
    try {
      const response = await this.handler.handleRequest({
        jsonrpc: '2.0',
        id: 3,
        method: 'completion/complete',
        params: {
          ref: { type: 'ref/resource', name: 'templates' },
          argument: { name: 'uri', value: 'assistant://' }
        }
      });

      if (response.error) {
        throw new Error(`Resource completion failed: ${response.error.message}`);
      }

      const completions = response.result?.completions;
      if (!completions || !Array.isArray(completions)) {
        throw new Error('Invalid completions response format');
      }

      const firstCompletion = completions[0];
      if (!firstCompletion || !Array.isArray(firstCompletion.values)) {
        throw new Error('Invalid completion item format');
      }

      // Check for resource URI patterns
      const hasResourceUris = firstCompletion.values.some(value => 
        value.startsWith('assistant://') || value.startsWith('workflow://')
      );

      if (!hasResourceUris) {
        throw new Error('No resource URI completions found');
      }

      this.addResult('✅ Resource URI completions', true);
      console.log(`   ✅ Resource URI completions: Found ${firstCompletion.values.length} completions`);
      console.log(`   📋 Sample URIs: ${firstCompletion.values.slice(0, 3).join(', ')}\n`);
    } catch (error) {
      this.addResult('❌ Resource URI completions', false, error.message);
      console.log(`   ❌ Resource URI completions: ${error.message}\n`);
    }
  }

  /**
   * Test 4: Test completion limits (max 100 items)
   */
  async testCompletionLimits() {
    console.log('📊 Test 4: Completion Limits (MCP Spec Compliance)');
    
    try {
      const response = await this.handler.handleRequest({
        jsonrpc: '2.0',
        id: 4,
        method: 'completion/complete',
        params: {
          ref: { type: 'ref/prompt', name: 'create-coding-assistant' },
          argument: { name: 'specialization', value: '' }
        }
      });

      if (response.error) {
        throw new Error(`Completion request failed: ${response.error.message}`);
      }

      const completions = response.result?.completions;
      const firstCompletion = completions[0];
      
      if (firstCompletion.values.length > 100) {
        throw new Error(`Too many completions: ${firstCompletion.values.length} (max 100)`);
      }

      // Check for proper metadata
      if (typeof firstCompletion.total !== 'number' && firstCompletion.total !== undefined) {
        throw new Error('Invalid total field type');
      }

      if (typeof firstCompletion.hasMore !== 'boolean' && firstCompletion.hasMore !== undefined) {
        throw new Error('Invalid hasMore field type');
      }

      this.addResult('✅ Completion limits compliant', true);
      console.log(`   ✅ Completion count: ${firstCompletion.values.length} (≤ 100)`);
      console.log(`   📊 Total available: ${firstCompletion.total || 'N/A'}`);
      console.log(`   🔄 Has more: ${firstCompletion.hasMore || false}\n`);
    } catch (error) {
      this.addResult('❌ Completion limits test', false, error.message);
      console.log(`   ❌ Completion limits: ${error.message}\n`);
    }
  }

  /**
   * Test 5: Test completion filtering
   */
  async testCompletionFiltering() {
    console.log('🔍 Test 5: Completion Filtering');
    
    try {
      // Test with partial input
      const response = await this.handler.handleRequest({
        jsonrpc: '2.0',
        id: 5,
        method: 'completion/complete',
        params: {
          ref: { type: 'ref/prompt', name: 'create-coding-assistant' },
          argument: { name: 'experience_level', value: 'beg' }
        }
      });

      if (response.error) {
        throw new Error(`Completion request failed: ${response.error.message}`);
      }

      const completions = response.result?.completions;
      const firstCompletion = completions[0];
      
      // Should filter to only items starting with 'beg'
      const allStartWithBeg = firstCompletion.values.every(value => 
        value.toLowerCase().startsWith('beg')
      );

      if (!allStartWithBeg) {
        throw new Error('Filtering not working correctly');
      }

      // Should include 'beginner'
      const hasBeginner = firstCompletion.values.includes('beginner');
      if (!hasBeginner) {
        throw new Error('Expected "beginner" in filtered results');
      }

      this.addResult('✅ Completion filtering', true);
      console.log(`   ✅ Filtering works: Found ${firstCompletion.values.length} matches for "beg"`);
      console.log(`   🎯 Results: ${firstCompletion.values.join(', ')}\n`);
    } catch (error) {
      this.addResult('❌ Completion filtering', false, error.message);
      console.log(`   ❌ Completion filtering: ${error.message}\n`);
    }
  }

  /**
   * Test 6: Test error handling
   */
  async testErrorHandling() {
    console.log('⚠️  Test 6: Error Handling');
    
    const errorTests = [
      {
        name: 'Invalid reference type',
        params: {
          ref: { type: 'ref/invalid', name: 'test' },
          argument: { name: 'test', value: '' }
        },
        expectedError: true
      },
      {
        name: 'Missing parameters',
        params: {
          ref: { type: 'ref/prompt', name: 'test' }
          // Missing argument parameter
        },
        expectedError: true
      }
    ];

    for (const test of errorTests) {
      try {
        const response = await this.handler.handleRequest({
          jsonrpc: '2.0',
          id: 6,
          method: 'completion/complete',
          params: test.params
        });

        if (test.expectedError && !response.error) {
          throw new Error('Expected error but got success');
        }

        if (!test.expectedError && response.error) {
          throw new Error(`Unexpected error: ${response.error.message}`);
        }

        this.addResult(`✅ ${test.name}`, true);
        console.log(`   ✅ ${test.name}: Handled correctly`);
      } catch (error) {
        this.addResult(`❌ ${test.name}`, false, error.message);
        console.log(`   ❌ ${test.name}: ${error.message}`);
      }
    }
    console.log();
  }

  addResult(description, success, details = null) {
    this.testResults.push({ description, success, details });
  }

  printResults() {
    console.log('📊 Test Results Summary');
    console.log('========================');
    
    const passed = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;
    
    this.testResults.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${result.description}`);
      if (!result.success && result.details) {
        console.log(`   Details: ${result.details}`);
      }
    });
    
    console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All completions functionality tests passed!');
      console.log('\n✨ MCP Completions Implementation Summary:');
      console.log('   • Completions capability declared ✅');
      console.log('   • completion/complete method implemented ✅');
      console.log('   • Prompt argument completions working ✅');
      console.log('   • Resource URI completions working ✅');
      console.log('   • 100-item limit compliance ✅');
      console.log('   • Completion filtering working ✅');
      console.log('   • Error handling implemented ✅');
      console.log('\n🚀 The MCP server now provides IDE-like autocompletion!');
    } else {
      console.log(`❌ ${total - passed} tests failed. Please review the implementation.`);
      process.exit(1);
    }
  }
}

// Run the tests
async function main() {
  const tester = new CompletionsTest();
  await tester.runAllTests();
}

main().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});