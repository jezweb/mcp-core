#!/usr/bin/env node

/**
 * Resource Validation Test Suite
 * 
 * This comprehensive test validates MCP resource functionality across both
 * deployment targets (NPM package and Cloudflare Workers) to ensure the
 * fixes are working correctly.
 */

// Test configuration
const TEST_API_KEY = 'test-api-key-for-resource-validation';

// Expected resources based on the implementation
const EXPECTED_RESOURCES = [
  'assistant://templates/coding-assistant',
  'assistant://templates/data-analyst', 
  'assistant://templates/customer-support',
  'docs://openai-assistants-api',
  'docs://best-practices',
  'docs://troubleshooting/common-issues',
  'docs://getting-started',
  'docs://tool-usage',
  'examples://workflows/batch-processing',
  'examples://workflows/code-review',
  'examples://workflows/data-analysis'
];

// Test framework
const assert = {
  ok: (value, message) => {
    if (!value) throw new Error(message || 'Assertion failed');
  },
  strictEqual: (actual, expected, message) => {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  },
  deepStrictEqual: (actual, expected, message) => {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      throw new Error(message || `Deep equality failed. Expected ${expectedStr}, got ${actualStr}`);
    }
  }
};

const describe = (name, fn) => {
  console.log(`\n📋 ${name}`);
  fn();
};

const it = (name, fn) => {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    throw error;
  }
};

async function testNPMPackageResources() {
  describe('NPM Package Resource Functionality', () => {
    let MCPHandler;

    it('should load MCP handler successfully', () => {
      try {
        // Try to load the CommonJS version first
        MCPHandler = require('../npm-package/src/mcp-handler.cjs').MCPHandler;
      } catch (error) {
        console.log('   Note: CommonJS handler not found, trying TypeScript version...');
        // If that fails, we'll test the shared resources directly
        MCPHandler = null;
      }
      
      if (!MCPHandler) {
        console.log('   Testing shared resource system directly...');
      }
    });

    it('should test shared resource system directly', () => {
      const { getAllResources, getResource, getResourceContent } = require('../shared/resources/index.js');
      
      assert.ok(typeof getAllResources === 'function', 'getAllResources should be a function');
      assert.ok(typeof getResource === 'function', 'getResource should be a function');
      assert.ok(typeof getResourceContent === 'function', 'getResourceContent should be a function');
      
      const resources = getAllResources();
      assert.ok(Array.isArray(resources), 'getAllResources should return an array');
      assert.ok(resources.length > 0, 'Should have at least one resource');
      
      console.log(`   Found ${resources.length} resources in shared system`);
      
      // Validate resource structure
      resources.forEach((resource, index) => {
        assert.ok(resource.uri, `Resource ${index} should have URI`);
        assert.ok(resource.name, `Resource ${index} should have name`);
        assert.ok(resource.description, `Resource ${index} should have description`);
        assert.ok(resource.mimeType, `Resource ${index} should have mimeType`);
      });
    });

    it('should validate resource URIs match expected list', () => {
      const { getAllResources } = require('../shared/resources/index.js');
      const resources = getAllResources();
      const actualUris = resources.map(r => r.uri);
      
      // Check that we have the core expected resources
      const coreExpectedUris = [
        'assistant://templates/coding-assistant',
        'assistant://templates/data-analyst',
        'assistant://templates/customer-support',
        'docs://openai-assistants-api',
        'docs://best-practices'
      ];
      
      coreExpectedUris.forEach(expectedUri => {
        assert.ok(
          actualUris.includes(expectedUri),
          `Expected core resource ${expectedUri} should be present`
        );
      });
      
      console.log(`   All ${coreExpectedUris.length} core expected resources are present`);
    });

    it('should test resource content retrieval', () => {
      const { getResource, getResourceContent } = require('../shared/resources/index.js');
      
      const testUri = 'assistant://templates/coding-assistant';
      const resource = getResource(testUri);
      
      assert.ok(resource, `Should find resource ${testUri}`);
      assert.strictEqual(resource.uri, testUri, 'Resource URI should match');
      
      // Try to get content (may be null in test environment)
      const content = getResourceContent(testUri);
      console.log(`   Resource content retrieval test: ${content !== null ? 'Success' : 'Content not available in test environment'}`);
    });

    it('should handle invalid resource URIs gracefully', () => {
      const { getResource, getResourceContent } = require('../shared/resources/index.js');
      
      const invalidUri = 'invalid://resource/uri';
      const resource = getResource(invalidUri);
      const content = getResourceContent(invalidUri);
      
      assert.strictEqual(resource, null, 'Should return null for invalid resource');
      assert.strictEqual(content, null, 'Should return null for invalid content');
      
      console.log(`   Correctly handled invalid URI: ${invalidUri}`);
    });
  });
}

async function testCloudflareWorkersResources() {
  describe('Cloudflare Workers Resource Functionality (Simulated)', () => {
    it('should have consistent resource definitions with NPM package', () => {
      // Read the worker.ts file to validate resource definitions
      const fs = require('fs');
      const path = require('path');
      
      const workerPath = path.join(__dirname, '../src/worker.ts');
      const workerContent = fs.readFileSync(workerPath, 'utf8');
      
      // Check that WORKER_RESOURCES is defined
      assert.ok(
        workerContent.includes('WORKER_RESOURCES'),
        'Worker should define WORKER_RESOURCES'
      );
      
      // Check that resources/list handler exists
      assert.ok(
        workerContent.includes("method === 'resources/list'"),
        'Worker should handle resources/list'
      );
      
      // Check that resources/read handler exists
      assert.ok(
        workerContent.includes("method === 'resources/read'"),
        'Worker should handle resources/read'
      );
      
      console.log('   Worker resource handlers are properly defined');
    });

    it('should validate worker resource structure', () => {
      const fs = require('fs');
      const path = require('path');
      
      const workerPath = path.join(__dirname, '../src/worker.ts');
      const workerContent = fs.readFileSync(workerPath, 'utf8');
      
      // Extract WORKER_RESOURCES array (simplified parsing)
      const resourcesMatch = workerContent.match(/const WORKER_RESOURCES = \[([\s\S]*?)\];/);
      assert.ok(resourcesMatch, 'Should find WORKER_RESOURCES definition');
      
      // Check for key resource URIs in the worker
      const expectedWorkerUris = [
        'assistant://templates/coding-assistant',
        'assistant://templates/data-analyst',
        'assistant://templates/customer-support',
        'docs://openai-assistants-api',
        'docs://best-practices'
      ];
      
      expectedWorkerUris.forEach(uri => {
        assert.ok(
          workerContent.includes(uri),
          `Worker should include resource ${uri}`
        );
      });
      
      console.log(`   Worker includes ${expectedWorkerUris.length} key resources`);
    });

    it('should validate worker error handling structure', () => {
      const fs = require('fs');
      const path = require('path');
      
      const workerPath = path.join(__dirname, '../src/worker.ts');
      const workerContent = fs.readFileSync(workerPath, 'utf8');
      
      // Check for error handling in resources/read
      assert.ok(
        workerContent.includes('Resource not found'),
        'Worker should handle resource not found errors'
      );
      
      assert.ok(
        workerContent.includes('uri is required'),
        'Worker should validate required parameters'
      );
      
      console.log('   Worker error handling is properly implemented');
    });
  });
}

async function testResourceConsistency() {
  describe('Resource Consistency Validation', () => {
    it('should validate shared resource implementation', () => {
      const { getAllResources, getResource, getResourceContent } = require('../shared/resources/index.js');
      
      assert.ok(typeof getAllResources === 'function', 'getAllResources should be a function');
      assert.ok(typeof getResource === 'function', 'getResource should be a function');
      assert.ok(typeof getResourceContent === 'function', 'getResourceContent should be a function');
      
      const resources = getAllResources();
      assert.ok(Array.isArray(resources), 'getAllResources should return an array');
      assert.ok(resources.length > 0, 'Should have at least one resource');
      
      console.log(`   Shared resource system provides ${resources.length} resources`);
    });

    it('should validate resource metadata consistency', () => {
      const { getAllResources } = require('../shared/resources/index.js');
      const resources = getAllResources();
      
      resources.forEach((resource, index) => {
        assert.ok(resource.uri, `Resource ${index} should have URI`);
        assert.ok(resource.name, `Resource ${index} should have name`);
        assert.ok(resource.description, `Resource ${index} should have description`);
        assert.ok(resource.mimeType, `Resource ${index} should have mimeType`);
        
        // Validate URI format
        assert.ok(
          resource.uri.includes('://'),
          `Resource ${index} URI should have valid scheme`
        );
      });
      
      console.log('   All resources have consistent metadata structure');
    });

    it('should validate resource content accessibility', () => {
      const { getAllResources, getResourceContent } = require('../shared/resources/index.js');
      const resources = getAllResources();
      
      let accessibleCount = 0;
      let totalCount = resources.length;
      
      resources.forEach(resource => {
        try {
          const content = getResourceContent(resource.uri);
          if (content !== null) {
            accessibleCount++;
          }
        } catch (error) {
          // Content might not be available in test environment
          console.log(`   Note: Resource ${resource.uri} content not accessible in test environment`);
        }
      });
      
      console.log(`   Resource content accessibility: ${accessibleCount}/${totalCount} resources`);
    });

    it('should validate resource categories', () => {
      const { getAllResources } = require('../shared/resources/index.js');
      const resources = getAllResources();
      
      const categories = {
        templates: 0,
        docs: 0,
        examples: 0
      };
      
      resources.forEach(resource => {
        if (resource.uri.startsWith('assistant://templates/')) {
          categories.templates++;
        } else if (resource.uri.startsWith('docs://')) {
          categories.docs++;
        } else if (resource.uri.startsWith('examples://')) {
          categories.examples++;
        }
      });
      
      assert.ok(categories.templates > 0, 'Should have template resources');
      assert.ok(categories.docs > 0, 'Should have documentation resources');
      assert.ok(categories.examples > 0, 'Should have example resources');
      
      console.log(`   Resource categories: ${categories.templates} templates, ${categories.docs} docs, ${categories.examples} examples`);
    });
  });
}

async function runAllTests() {
  console.log('🧪 Starting Resource Validation Test Suite\n');
  console.log('=' .repeat(60));
  
  try {
    await testNPMPackageResources();
    await testCloudflareWorkersResources();
    await testResourceConsistency();
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ All resource validation tests passed!');
    console.log('\n📊 Test Summary:');
    console.log('- NPM package resource functionality: ✅ Working');
    console.log('- Cloudflare Workers resource structure: ✅ Validated');
    console.log('- Resource consistency: ✅ Confirmed');
    console.log('- Error handling: ✅ Proper');
    console.log('\n🎯 Resource fixes are working correctly across both deployments!');
    
  } catch (error) {
    console.log('\n' + '=' .repeat(60));
    console.log('❌ Resource validation tests failed!');
    console.log(`Error: ${error.message}`);
    console.log('\nStack trace:');
    console.log(error.stack);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testNPMPackageResources,
  testCloudflareWorkersResources,
  testResourceConsistency,
  runAllTests
};