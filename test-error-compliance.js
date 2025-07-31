#!/usr/bin/env node

/**
 * JSON-RPC 2.0 Error Code Compliance Test
 * 
 * This test verifies that our error handling updates are working correctly
 * and that we're now using standard JSON-RPC 2.0 error codes with enhanced
 * information in the error.data field.
 */

import { ErrorCodes, LegacyErrorCodes, createEnhancedError, formatOpenAIError, createStandardErrorResponse } from './shared/types/index.js';

console.log('🧪 Testing JSON-RPC 2.0 Error Code Compliance\n');

// Test 1: Verify error code mappings
console.log('1. Testing Error Code Mappings:');
console.log(`   UNAUTHORIZED: ${ErrorCodes.UNAUTHORIZED} (was ${LegacyErrorCodes.UNAUTHORIZED})`);
console.log(`   FORBIDDEN: ${ErrorCodes.FORBIDDEN} (was ${LegacyErrorCodes.FORBIDDEN})`);
console.log(`   NOT_FOUND: ${ErrorCodes.NOT_FOUND} (was ${LegacyErrorCodes.NOT_FOUND})`);
console.log(`   RATE_LIMITED: ${ErrorCodes.RATE_LIMITED} (was ${LegacyErrorCodes.RATE_LIMITED})`);

// Verify mappings are correct
const expectedMappings = {
  [LegacyErrorCodes.UNAUTHORIZED]: -32603,  // Internal Error
  [LegacyErrorCodes.FORBIDDEN]: -32603,     // Internal Error
  [LegacyErrorCodes.NOT_FOUND]: -32602,     // Invalid Params
  [LegacyErrorCodes.RATE_LIMITED]: -32602,  // Invalid Params
};

let mappingsPassed = true;
for (const [legacy, expected] of Object.entries(expectedMappings)) {
  const actual = ErrorCodes[Object.keys(LegacyErrorCodes).find(key => LegacyErrorCodes[key] == legacy)];
  if (actual !== expected) {
    console.log(`   ❌ FAIL: Expected ${expected}, got ${actual} for legacy code ${legacy}`);
    mappingsPassed = false;
  }
}

if (mappingsPassed) {
  console.log('   ✅ PASS: All error codes mapped to standard JSON-RPC codes\n');
} else {
  console.log('   ❌ FAIL: Error code mappings incorrect\n');
}

// Test 2: Enhanced error creation
console.log('2. Testing Enhanced Error Creation:');
try {
  const authError = createEnhancedError(
    LegacyErrorCodes.UNAUTHORIZED,
    'Authentication failed',
    { apiKeyLength: 0 }
  );
  
  console.log(`   Error code: ${authError.code} (should be ${ErrorCodes.UNAUTHORIZED})`);
  console.log(`   Error message: ${authError.message}`);
  console.log(`   Error data:`, authError.data);
  
  if (authError.code === ErrorCodes.UNAUTHORIZED && authError.data.originalCode === LegacyErrorCodes.UNAUTHORIZED) {
    console.log('   ✅ PASS: Enhanced error creation working correctly\n');
  } else {
    console.log('   ❌ FAIL: Enhanced error creation not working correctly\n');
  }
} catch (error) {
  console.log(`   ❌ FAIL: Enhanced error creation threw: ${error.message}\n`);
}

// Test 3: OpenAI error formatting
console.log('3. Testing OpenAI Error Formatting:');
try {
  const openaiError = formatOpenAIError(
    401,
    { error: { message: 'Invalid API key' } },
    'POST /assistants'
  );
  
  console.log(`   HTTP 401 mapped to code: ${openaiError.code}`);
  console.log(`   Error message: ${openaiError.message}`);
  console.log(`   Error data:`, openaiError.data);
  
  if (openaiError.code === ErrorCodes.UNAUTHORIZED && openaiError.data.originalCode === LegacyErrorCodes.UNAUTHORIZED) {
    console.log('   ✅ PASS: OpenAI error formatting working correctly\n');
  } else {
    console.log('   ❌ FAIL: OpenAI error formatting not working correctly\n');
  }
} catch (error) {
  console.log(`   ❌ FAIL: OpenAI error formatting threw: ${error.message}\n`);
}

// Test 4: Standard error response creation
console.log('4. Testing Standard Error Response Creation:');
try {
  const response = createStandardErrorResponse(
    'test-123',
    ErrorCodes.INVALID_PARAMS,
    'Invalid parameter value',
    {
      parameter: 'model',
      expected: 'string',
      received: 'number'
    }
  );
  
  console.log('   Response structure:');
  console.log(`   - jsonrpc: ${response.jsonrpc}`);
  console.log(`   - id: ${response.id}`);
  console.log(`   - error.code: ${response.error.code}`);
  console.log(`   - error.message: ${response.error.message}`);
  console.log(`   - error.data:`, response.error.data);
  
  if (response.jsonrpc === '2.0' && response.error && response.error.code === ErrorCodes.INVALID_PARAMS) {
    console.log('   ✅ PASS: Standard error response creation working correctly\n');
  } else {
    console.log('   ❌ FAIL: Standard error response creation not working correctly\n');
  }
} catch (error) {
  console.log(`   ❌ FAIL: Standard error response creation threw: ${error.message}\n`);
}

// Test 5: JSON-RPC 2.0 compliance verification
console.log('5. Testing JSON-RPC 2.0 Compliance:');
const testCodes = [
  ErrorCodes.PARSE_ERROR,
  ErrorCodes.INVALID_REQUEST,
  ErrorCodes.METHOD_NOT_FOUND,
  ErrorCodes.INVALID_PARAMS,
  ErrorCodes.INTERNAL_ERROR
];

const standardCodes = [-32700, -32600, -32601, -32602, -32603];
let compliancePassed = true;

for (let i = 0; i < testCodes.length; i++) {
  if (testCodes[i] !== standardCodes[i]) {
    console.log(`   ❌ FAIL: ${Object.keys(ErrorCodes)[i]} should be ${standardCodes[i]}, got ${testCodes[i]}`);
    compliancePassed = false;
  }
}

if (compliancePassed) {
  console.log('   ✅ PASS: All standard JSON-RPC 2.0 error codes are correct\n');
} else {
  console.log('   ❌ FAIL: Some standard JSON-RPC 2.0 error codes are incorrect\n');
}

console.log('🎉 JSON-RPC 2.0 Error Code Compliance Test Complete!');