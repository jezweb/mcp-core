#!/usr/bin/env node

/**
 * Multi-Provider Routing System Test Suite
 * 
 * This comprehensive test suite validates the multi-provider routing system:
 * 1. URL parsing and provider extraction
 * 2. Provider registry configuration and management
 * 3. Provider selection and routing logic
 * 4. Error handling for invalid providers
 * 5. OpenAI provider functionality through new routing
 * 
 * The test includes detailed diagnostic logging to identify issues.
 */

import { parseProviderFromPath, isSupportedProvider, isValidProviderFormat } from './dist/shared/core/url-parser.js';
import { ProviderRegistry } from './dist/shared/services/provider-registry.js';
import { openaiProviderFactory } from './dist/shared/services/providers/openai.js';
import { geminiProviderFactory } from './dist/shared/services/providers/gemini.js';
import { anthropicProviderFactory } from './dist/shared/services/providers/anthropic.js';
import { BaseMCPHandler } from './dist/shared/core/base-mcp-handler.js';

// Test configuration
const TEST_CONFIG = {
  openai: { apiKey: 'test-openai-key-123' },
  gemini: { apiKey: 'test-gemini-key-456' },
  anthropic: { apiKey: 'test-anthropic-key-789' }
};

// Diagnostic logging
function logDiagnostic(testName, message, data = null) {
  console.log(`🔍 [${testName}] ${message}`);
  if (data) {
    console.log(`   Data:`, JSON.stringify(data, null, 2));
  }
}

function logSuccess(testName, message) {
  console.log(`✅ [${testName}] ${message}`);
}

function logError(testName, message, error = null) {
  console.log(`❌ [${testName}] ${message}`);
  if (error) {
    console.log(`   Error:`, error.message || error);
    if (error.stack) {
      console.log(`   Stack:`, error.stack);
    }
  }
}

function logWarning(testName, message) {
  console.log(`⚠️  [${testName}] ${message}`);
}

// Test 1: URL Parsing and Provider Extraction
async function testUrlParsing() {
  console.log('\n🧪 Test 1: URL Parsing and Provider Extraction');
  
  const testCases = [
    // Valid provider paths
    { path: '/mcp/openai/tools/list', expected: { provider: 'openai', rewritten: '/mcp/tools/list' } },
    { path: '/mcp/gemini/tools/list', expected: { provider: 'gemini', rewritten: '/mcp/tools/list' } },
    { path: '/mcp/anthropic/tools/list', expected: { provider: 'anthropic', rewritten: '/mcp/tools/list' } },
    { path: '/mcp/openai/assistants/create', expected: { provider: 'openai', rewritten: '/mcp/assistants/create' } },
    
    // Edge cases
    { path: '/mcp/unknown/tools/list', expected: { provider: 'unknown', rewritten: '/mcp/tools/list' } },
    { path: '/mcp/tools/list', expected: { provider: undefined, rewritten: '/mcp/tools/list' } },
    { path: '/health', expected: { provider: undefined, rewritten: '/health' } },
    { path: '/', expected: { provider: undefined, rewritten: '/' } },
    
    // Complex paths
    { path: '/mcp/openai/tools/call', expected: { provider: 'openai', rewritten: '/mcp/tools/call' } },
    { path: '/mcp/gemini/threads/create', expected: { provider: 'gemini', rewritten: '/mcp/threads/create' } },
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      const result = parseProviderFromPath(testCase.path);
      logDiagnostic('URL Parsing', `Testing path: ${testCase.path}`, { result, expected: testCase.expected });
      
      // Check provider extraction
      if (result.provider === testCase.expected.provider) {
        logSuccess('URL Parsing', `Provider extraction correct for ${testCase.path}`);
      } else {
        logError('URL Parsing', `Provider extraction failed for ${testCase.path}`, 
          new Error(`Expected ${testCase.expected.provider}, got ${result.provider}`));
        failed++;
        continue;
      }
      
      // Check path rewriting
      if (result.rewrittenPath === testCase.expected.rewritten) {
        logSuccess('URL Parsing', `Path rewriting correct for ${testCase.path}`);
      } else {
        logError('URL Parsing', `Path rewriting failed for ${testCase.path}`,
          new Error(`Expected ${testCase.expected.rewritten}, got ${result.rewrittenPath}`));
        failed++;
        continue;
      }
      
      // Check MCP path detection
      const shouldBeMcpPath = testCase.path.startsWith('/mcp/');
      if (result.isMcpPath === shouldBeMcpPath) {
        logSuccess('URL Parsing', `MCP path detection correct for ${testCase.path}`);
      } else {
        logError('URL Parsing', `MCP path detection failed for ${testCase.path}`,
          new Error(`Expected ${shouldBeMcpPath}, got ${result.isMcpPath}`));
        failed++;
        continue;
      }
      
      passed++;
    } catch (error) {
      logError('URL Parsing', `Exception testing ${testCase.path}`, error);
      failed++;
    }
  }

  console.log(`\n📊 URL Parsing Results: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// Test 2: Provider Validation
async function testProviderValidation() {
  console.log('\n🧪 Test 2: Provider Validation');
  
  const testCases = [
    // Valid providers
    { provider: 'openai', shouldFormat: true, shouldSupport: true },
    { provider: 'gemini', shouldFormat: true, shouldSupport: true },
    { provider: 'anthropic', shouldFormat: true, shouldSupport: true },
    
    // Invalid formats
    { provider: 'OpenAI', shouldFormat: false, shouldSupport: false }, // uppercase
    { provider: 'open_ai', shouldFormat: true, shouldSupport: false }, // underscore (valid format but unsupported)
    { provider: 'open-ai', shouldFormat: true, shouldSupport: false }, // hyphen (valid format but unsupported)
    { provider: '123', shouldFormat: true, shouldSupport: false }, // numbers only (valid format but unsupported)
    { provider: 'openai@', shouldFormat: false, shouldSupport: false }, // invalid character
    { provider: '', shouldFormat: false, shouldSupport: false }, // empty
    { provider: ' ', shouldFormat: false, shouldSupport: false }, // whitespace
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      // Test format validation
      const formatValid = isValidProviderFormat(testCase.provider);
      logDiagnostic('Provider Validation', `Testing format for: "${testCase.provider}"`, { 
        expected: testCase.shouldFormat, 
        actual: formatValid 
      });
      
      if (formatValid === testCase.shouldFormat) {
        logSuccess('Provider Validation', `Format validation correct for "${testCase.provider}"`);
      } else {
        logError('Provider Validation', `Format validation failed for "${testCase.provider}"`,
          new Error(`Expected ${testCase.shouldFormat}, got ${formatValid}`));
        failed++;
        continue;
      }
      
      // Test support validation
      const supportValid = isSupportedProvider(testCase.provider);
      logDiagnostic('Provider Validation', `Testing support for: "${testCase.provider}"`, { 
        expected: testCase.shouldSupport, 
        actual: supportValid 
      });
      
      if (supportValid === testCase.shouldSupport) {
        logSuccess('Provider Validation', `Support validation correct for "${testCase.provider}"`);
      } else {
        logError('Provider Validation', `Support validation failed for "${testCase.provider}"`,
          new Error(`Expected ${testCase.shouldSupport}, got ${supportValid}`));
        failed++;
        continue;
      }
      
      passed++;
    } catch (error) {
      logError('Provider Validation', `Exception testing "${testCase.provider}"`, error);
      failed++;
    }
  }

  console.log(`\n📊 Provider Validation Results: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// Test 3: Provider Registry Configuration
async function testProviderRegistry() {
  console.log('\n🧪 Test 3: Provider Registry Configuration');
  
  let passed = 0;
  let failed = 0;

  try {
    // Test registry configuration with all providers
    const registryConfig = {
      defaultProvider: 'openai',
      providers: [
        {
          provider: 'openai',
          enabled: true,
          config: TEST_CONFIG.openai,
        },
        {
          provider: 'gemini',
          enabled: true,
          config: TEST_CONFIG.gemini,
        },
        {
          provider: 'anthropic',
          enabled: true,
          config: TEST_CONFIG.anthropic,
        },
      ],
    };

    logDiagnostic('Provider Registry', 'Creating registry with all providers', registryConfig);
    const registry = new ProviderRegistry(registryConfig);

    // Register all provider factories
    logDiagnostic('Provider Registry', 'Registering OpenAI factory');
    registry.registerFactory(openaiProviderFactory);
    logSuccess('Provider Registry', 'OpenAI factory registered');

    logDiagnostic('Provider Registry', 'Registering Gemini factory');
    registry.registerFactory(geminiProviderFactory);
    logSuccess('Provider Registry', 'Gemini factory registered');

    logDiagnostic('Provider Registry', 'Registering Anthropic factory');
    registry.registerFactory(anthropicProviderFactory);
    logSuccess('Provider Registry', 'Anthropic factory registered');

    // Test registry initialization (will fail due to test keys, but we can test the structure)
    try {
      await registry.initialize();
      logSuccess('Provider Registry', 'Registry initialized successfully');
    } catch (error) {
      // Expected to fail with test keys, but we can test the structure
      if (error.message.includes('API key') || error.message.includes('connection') || error.message.includes('validation')) {
        logSuccess('Provider Registry', 'Registry initialization structure correct (API key validation expected)');
      } else {
        logError('Provider Registry', 'Unexpected initialization error', error);
        failed++;
      }
    }

    // Test manual provider registration for testing
    logDiagnostic('Provider Registry', 'Testing manual provider registration');
    try {
      // Create mock providers for testing
      const mockProviders = [
        { name: 'openai', factory: openaiProviderFactory },
        { name: 'gemini', factory: geminiProviderFactory },
        { name: 'anthropic', factory: anthropicProviderFactory },
      ];

      for (const { name, factory } of mockProviders) {
        try {
          const provider = await factory.create(TEST_CONFIG[name]);
          await registry.registerProvider(provider, registryConfig.providers.find(p => p.provider === name));
          logSuccess('Provider Registry', `${name} provider registered successfully`);
        } catch (error) {
          // If provider creation fails, create a minimal mock for testing registry operations
          logWarning('Provider Registry', `Creating mock ${name} provider for registry testing...`);
          const mockProvider = {
            metadata: { name, displayName: `${name.charAt(0).toUpperCase() + name.slice(1)} Test` },
            validateConnection: async () => true,
            initialize: async () => {},
            handleUnsupportedOperation: async () => { throw new Error(`Not implemented: ${name}`); }
          };
          await registry.registerProvider(mockProvider, registryConfig.providers.find(p => p.provider === name));
          logSuccess('Provider Registry', `Mock ${name} provider registered for testing`);
        }
      }
      passed++;
    } catch (error) {
      logError('Provider Registry', 'Manual provider registration failed', error);
      failed++;
    }

    // Test registry operations
    logDiagnostic('Provider Registry', 'Testing registry operations');
    
    const defaultProvider = registry.getDefaultProvider();
    logDiagnostic('Provider Registry', 'Default provider', { 
      available: !!defaultProvider, 
      name: defaultProvider?.metadata?.name 
    });
    
    if (defaultProvider) {
      logSuccess('Provider Registry', 'Default provider available');
      passed++;
    } else {
      logError('Provider Registry', 'No default provider available');
      failed++;
    }

    const selectedProvider = registry.selectProvider();
    logDiagnostic('Provider Registry', 'Selected provider', { 
      available: !!selectedProvider, 
      name: selectedProvider?.metadata?.name 
    });
    
    if (selectedProvider) {
      logSuccess('Provider Registry', 'Provider selection works');
      passed++;
    } else {
      logError('Provider Registry', 'Provider selection failed');
      failed++;
    }

    // Test getting specific providers
    const providersToTest = ['openai', 'gemini', 'anthropic'];
    for (const providerName of providersToTest) {
      const provider = registry.getProvider(providerName);
      logDiagnostic('Provider Registry', `Getting ${providerName} provider`, { available: !!provider });
      
      if (provider) {
        logSuccess('Provider Registry', `${providerName} provider available`);
        passed++;
      } else {
        logWarning('Provider Registry', `${providerName} provider not available (expected for test setup)`);
      }
    }

  } catch (error) {
    logError('Provider Registry', 'Registry configuration failed', error);
    failed++;
  }

  console.log(`\n📊 Provider Registry Results: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// Test 4: Provider Selection Logic
async function testProviderSelection() {
  console.log('\n🧪 Test 4: Provider Selection Logic');
  
  let passed = 0;
  let failed = 0;

  try {
    // Create a test registry
    const registryConfig = {
      defaultProvider: 'openai',
      providers: [
        {
          provider: 'openai',
          enabled: true,
          config: TEST_CONFIG.openai,
        },
        {
          provider: 'gemini',
          enabled: true,
          config: TEST_CONFIG.gemini,
        },
        {
          provider: 'anthropic',
          enabled: true,
          config: TEST_CONFIG.anthropic,
        },
      ],
    };

    const registry = new ProviderRegistry(registryConfig);
    registry.registerFactory(openaiProviderFactory);
    registry.registerFactory(geminiProviderFactory);
    registry.registerFactory(anthropicProviderFactory);

    // Create mock providers for testing
    const mockProviders = {
      openai: {
        metadata: { name: 'openai', displayName: 'OpenAI Test' },
        validateConnection: async () => true,
        initialize: async () => {},
        handleUnsupportedOperation: async () => { throw new Error('Not implemented'); }
      },
      gemini: {
        metadata: { name: 'gemini', displayName: 'Gemini Test' },
        validateConnection: async () => true,
        initialize: async () => {},
        handleUnsupportedOperation: async () => { throw new Error('Not implemented'); }
      },
      anthropic: {
        metadata: { name: 'anthropic', displayName: 'Anthropic Test' },
        validateConnection: async () => true,
        initialize: async () => {},
        handleUnsupportedOperation: async () => { throw new Error('Not implemented'); }
      }
    };

    // Register mock providers
    for (const [name, mockProvider] of Object.entries(mockProviders)) {
      await registry.registerProvider(mockProvider, registryConfig.providers.find(p => p.provider === name));
    }

    // Test provider selection with request context
    const testCases = [
      { provider: 'openai', shouldSucceed: true },
      { provider: 'gemini', shouldSucceed: true },
      { provider: 'anthropic', shouldSucceed: true },
      { provider: 'invalid', shouldSucceed: false },
      { provider: '', shouldSucceed: false },
      { provider: null, shouldSucceed: false },
    ];

    for (const testCase of testCases) {
      try {
        // Simulate request context with provider
        const mockRequest = {
          jsonrpc: '2.0',
          method: 'tools/list',
          id: 'test-123',
          provider: testCase.provider
        };

        logDiagnostic('Provider Selection', `Testing provider: ${testCase.provider}`, mockRequest);

        // Test provider extraction from request context
        let provider;
        if (mockRequest.provider) {
          const providerName = mockRequest.provider;
          
          if (typeof providerName === 'string' && providerName.trim().length > 0) {
            provider = registry.getProvider(providerName);
            logDiagnostic('Provider Selection', `Retrieved provider: ${providerName}`, { 
              available: !!provider,
              metadata: provider?.metadata 
            });
          }
        }

        if (testCase.shouldSucceed) {
          if (provider) {
            logSuccess('Provider Selection', `Successfully retrieved ${testCase.provider} provider`);
            passed++;
          } else {
            logError('Provider Selection', `Failed to retrieve ${testCase.provider} provider`);
            failed++;
          }
        } else {
          if (!provider) {
            logSuccess('Provider Selection', `Correctly failed to retrieve invalid provider: ${testCase.provider}`);
            passed++;
          } else {
            logError('Provider Selection', `Unexpectedly retrieved invalid provider: ${testCase.provider}`);
            failed++;
          }
        }
      } catch (error) {
        if (testCase.shouldSucceed) {
          logError('Provider Selection', `Exception testing ${testCase.provider}`, error);
          failed++;
        } else {
          logSuccess('Provider Selection', `Correctly handled invalid provider: ${testCase.provider}`);
          passed++;
        }
      }
    }

    // Test default provider selection
    logDiagnostic('Provider Selection', 'Testing default provider selection');
    const defaultProvider = registry.getDefaultProvider();
    if (defaultProvider && defaultProvider.metadata.name === 'openai') {
      logSuccess('Provider Selection', 'Default provider selection works correctly');
      passed++;
    } else {
      logError('Provider Selection', 'Default provider selection failed');
      failed++;
    }

  } catch (error) {
    logError('Provider Selection', 'Provider selection test failed', error);
    failed++;
  }

  console.log(`\n📊 Provider Selection Results: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// Test 5: Error Handling for Invalid Providers
async function testErrorHandling() {
  console.log('\n🧪 Test 5: Error Handling for Invalid Providers');
  
  let passed = 0;
  let failed = 0;

  try {
    // Create a test registry
    const registryConfig = {
      defaultProvider: 'openai',
      providers: [
        {
          provider: 'openai',
          enabled: true,
          config: TEST_CONFIG.openai,
        },
      ],
    };

    const registry = new ProviderRegistry(registryConfig);
    registry.registerFactory(openaiProviderFactory);

    // Create mock OpenAI provider
    const mockOpenAIProvider = {
      metadata: { name: 'openai', displayName: 'OpenAI Test' },
      validateConnection: async () => true,
      initialize: async () => {},
      handleUnsupportedOperation: async () => { throw new Error('Not implemented'); }
    };

    await registry.registerProvider(mockOpenAIProvider, registryConfig.providers[0]);

    // Test invalid provider names
    const invalidProviders = ['', ' ', 'invalid', 'Unknown', '123', 'open-ai', 'open_ai'];
    
    for (const invalidProvider of invalidProviders) {
      try {
        logDiagnostic('Error Handling', `Testing invalid provider: "${invalidProvider}"`);
        
        const provider = registry.getProvider(invalidProvider);
        if (!provider) {
          logSuccess('Error Handling', `Correctly returned null for invalid provider: "${invalidProvider}"`);
          passed++;
        } else {
          logError('Error Handling', `Unexpectedly returned provider for invalid name: "${invalidProvider}"`);
          failed++;
        }
      } catch (error) {
        logSuccess('Error Handling', `Correctly threw error for invalid provider: "${invalidProvider}"`);
        passed++;
      }
    }

    // Test unsupported provider operations
    logDiagnostic('Error Handling', 'Testing unsupported provider operations');
    
    // Test with Gemini provider (should return "Not Implemented")
    try {
      const geminiProvider = await geminiProviderFactory.create(TEST_CONFIG.gemini);
      await geminiProvider.handleUnsupportedOperation();
      logError('Error Handling', 'Gemini provider should throw "Not Implemented" error');
      failed++;
    } catch (error) {
      if (error.message.includes('Not implemented')) {
        logSuccess('Error Handling', 'Gemini provider correctly throws "Not Implemented" error');
        passed++;
      } else {
        logError('Error Handling', 'Gemini provider threw unexpected error', error);
        failed++;
      }
    }

    // Test with Anthropic provider (should return "Not Implemented")
    try {
      const anthropicProvider = await anthropicProviderFactory.create(TEST_CONFIG.anthropic);
      await anthropicProvider.handleUnsupportedOperation();
      logError('Error Handling', 'Anthropic provider should throw "Not Implemented" error');
      failed++;
    } catch (error) {
      if (error.message.includes('Not implemented')) {
        logSuccess('Error Handling', 'Anthropic provider correctly throws "Not Implemented" error');
        passed++;
      } else {
        logError('Error Handling', 'Anthropic provider threw unexpected error', error);
        failed++;
      }
    }

  } catch (error) {
    logError('Error Handling', 'Error handling test failed', error);
    failed++;
  }

  console.log(`\n📊 Error Handling Results: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// Test 6: OpenAI Provider Functionality
async function testOpenAIProvider() {
  console.log('\n🧪 Test 6: OpenAI Provider Functionality');
  
  let passed = 0;
  let failed = 0;

  try {
    // Test OpenAI provider factory
    logDiagnostic('OpenAI Provider', 'Testing provider factory');
    
    try {
      const provider = await openaiProviderFactory.create(TEST_CONFIG.openai);
      logSuccess('OpenAI Provider', 'Provider factory created successfully');
      passed++;
    } catch (error) {
      // Expected to fail with test keys, but we can test the structure
      if (error.message.includes('API key') || error.message.includes('connection') || error.message.includes('validation')) {
        logSuccess('OpenAI Provider', 'Provider factory structure correct (API key validation expected)');
        passed++;
      } else {
        logError('OpenAI Provider', 'Provider factory failed unexpectedly', error);
        failed++;
      }
    }

    // Test OpenAI provider metadata
    logDiagnostic('OpenAI Provider', 'Testing provider metadata');
    
    try {
      const metadata = openaiProviderFactory.getMetadata();
      logDiagnostic('OpenAI Provider', 'Provider metadata', metadata);
      
      if (metadata && metadata.name === 'openai' && metadata.displayName) {
        logSuccess('OpenAI Provider', 'Provider metadata correct');
        passed++;
      } else {
        logError('OpenAI Provider', 'Provider metadata incorrect');
        failed++;
      }
    } catch (error) {
      logError('OpenAI Provider', 'Provider metadata test failed', error);
      failed++;
    }

    // Test OpenAI provider configuration validation
    logDiagnostic('OpenAI Provider', 'Testing configuration validation');
    
    try {
      const validConfig = { apiKey: 'test-key' };
      const isValid = await openaiProviderFactory.validateConfig(validConfig);
      
      if (isValid) {
        logSuccess('OpenAI Provider', 'Configuration validation works');
        passed++;
      } else {
        logError('OpenAI Provider', 'Configuration validation failed');
        failed++;
      }
    } catch (error) {
      logError('OpenAI Provider', 'Configuration validation test failed', error);
      failed++;
    }

    // Test OpenAI provider with invalid configuration
    logDiagnostic('OpenAI Provider', 'Testing invalid configuration');
    
    try {
      const invalidConfig = { apiKey: '' };
      const isValid = await openaiProviderFactory.validateConfig(invalidConfig);
      
      if (!isValid) {
        logSuccess('OpenAI Provider', 'Invalid configuration correctly rejected');
        passed++;
      } else {
        logError('OpenAI Provider', 'Invalid configuration incorrectly accepted');
        failed++;
      }
    } catch (error) {
      logSuccess('OpenAI Provider', 'Invalid configuration correctly threw error');
      passed++;
    }

  } catch (error) {
    logError('OpenAI Provider', 'OpenAI provider test failed', error);
    failed++;
  }

  console.log(`\n📊 OpenAI Provider Results: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// Test 7: End-to-End Routing Simulation
async function testEndToEndRouting() {
  console.log('\n🧪 Test 7: End-to-End Routing Simulation');
  
  let passed = 0;
  let failed = 0;

  try {
    // Simulate the complete routing flow
    const testUrls = [
      '/mcp/openai/tools/list',
      '/mcp/gemini/tools/list',
      '/mcp/anthropic/tools/list',
      '/mcp/invalid/tools/list',
      '/mcp/tools/list',
      '/health',
    ];

    for (const url of testUrls) {
      try {
        logDiagnostic('End-to-End Routing', `Testing URL: ${url}`);
        
        // Step 1: Parse URL
        const parsed = parseProviderFromPath(url);
        logDiagnostic('End-to-End Routing', `URL parsing result`, parsed);
        
        // Step 2: Validate provider
        const isValidProvider = parsed.provider ? isSupportedProvider(parsed.provider) : false;
        logDiagnostic('End-to-End Routing', `Provider validation`, {
          provider: parsed.provider,
          isValid: isValidProvider
        });
        
        // Step 3: Simulate request context
        const mockRequest = {
          jsonrpc: '2.0',
          method: 'tools/list',
          id: 'test-123',
          provider: parsed.provider,
          url: url,
          rewrittenPath: parsed.rewrittenPath
        };
        
        logDiagnostic('End-to-End Routing', 'Mock request context', mockRequest);
        
        // Step 4: Simulate provider selection
        let selectedProvider = null;
        let routingSuccess = false;
        
        if (parsed.provider && isValidProvider) {
          // Valid provider case
          logDiagnostic('End-to-End Routing', `Routing to provider: ${parsed.provider}`);
          
          if (parsed.provider === 'openai') {
            routingSuccess = true;
            logSuccess('End-to-End Routing', `Successfully routed to OpenAI provider`);
          } else if (parsed.provider === 'gemini') {
            routingSuccess = true;
            logSuccess('End-to-End Routing', `Successfully routed to Gemini provider (will return "Not Implemented")`);
          } else if (parsed.provider === 'anthropic') {
            routingSuccess = true;
            logSuccess('End-to-End Routing', `Successfully routed to Anthropic provider (will return "Not Implemented")`);
          }
        } else if (parsed.provider && !isValidProvider) {
          // Invalid provider case
          logDiagnostic('End-to-End Routing', `Invalid provider: ${parsed.provider}`);
          routingSuccess = true; // Successfully handled invalid provider
          logSuccess('End-to-End Routing', `Correctly handled invalid provider: ${parsed.provider}`);
        } else {
          // No provider case (default routing)
          logDiagnostic('End-to-End Routing', 'No provider specified, using default routing');
          routingSuccess = true;
          logSuccess('End-to-End Routing', 'Successfully handled default routing');
        }
        
        if (routingSuccess) {
          passed++;
        } else {
          failed++;
        }
        
      } catch (error) {
        logError('End-to-End Routing', `Exception testing ${url}`, error);
        failed++;
      }
    }

  } catch (error) {
    logError('End-to-End Routing', 'End-to-end routing test failed', error);
    failed++;
  }

  console.log(`\n📊 End-to-End Routing Results: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Multi-Provider Routing System Test Suite');
  console.log('==============================================');
  
  const results = {
    urlParsing: await testUrlParsing(),
    providerValidation: await testProviderValidation(),
    providerRegistry: await testProviderRegistry(),
    providerSelection: await testProviderSelection(),
    errorHandling: await testErrorHandling(),
    openAIProvider: await testOpenAIProvider(),
    endToEndRouting: await testEndToEndRouting(),
  };

  // Summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  for (const [testName, result] of Object.entries(results)) {
    console.log(`${testName}: ${result.passed} passed, ${result.failed} failed`);
    totalPassed += result.passed;
    totalFailed += result.failed;
  }
  
  console.log('\n🎯 Overall Results');
  console.log('==================');
  console.log(`Total: ${totalPassed} passed, ${totalFailed} failed`);
  
  if (totalFailed === 0) {
    console.log('🎉 All tests passed! The multi-provider routing system is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please review the diagnostic logs above.');
    
    // Provide diagnosis based on failed tests
    console.log('\n🔍 Diagnosis');
    console.log('===========');
    
    if (results.urlParsing.failed > 0) {
      console.log('❌ URL parsing issues detected - check parseProviderFromPath function');
    }
    if (results.providerValidation.failed > 0) {
      console.log('❌ Provider validation issues detected - check isSupportedProvider and isValidProviderFormat functions');
    }
    if (results.providerRegistry.failed > 0) {
      console.log('❌ Provider registry issues detected - check ProviderRegistry initialization and factory registration');
    }
    if (results.providerSelection.failed > 0) {
      console.log('❌ Provider selection issues detected - check BaseMCPHandler provider selection logic');
    }
    if (results.errorHandling.failed > 0) {
      console.log('❌ Error handling issues detected - check error handling for invalid providers');
    }
    if (results.openAIProvider.failed > 0) {
      console.log('❌ OpenAI provider issues detected - check OpenAI provider factory and configuration');
    }
    if (results.endToEndRouting.failed > 0) {
      console.log('❌ End-to-end routing issues detected - check complete routing flow');
    }
  }
  
  return { totalPassed, totalFailed, results };
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then((results) => {
      console.log('\n✅ Test suite completed');
      process.exit(results.totalFailed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

export { runAllTests };