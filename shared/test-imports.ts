/**
 * Test Imports - Verification that shared libraries work correctly
 * 
 * This test file verifies that all shared library imports work correctly
 * and that the path mapping is functioning as expected.
 */

// Test importing from main shared index
import {
  MCPError,
  ErrorCodes,
  OpenAIService,
  validateModel,
  getAllResources,
  Assistant,
  Thread,
  Message,
  Run
} from './index.js';

// Test importing from specific modules
import type { ValidationResult } from './validation/index.js';
import { SUPPORTED_MODELS, ID_PATTERNS } from './validation/index.js';
import { getResourceContent } from './resources/index.js';
import type { Env } from './types/index.js';

// Test that we can use the imported items
function testSharedLibraries(): void {
  console.log('Testing shared library imports...');
  
  // Test error handling
  const error = new MCPError(ErrorCodes.INVALID_PARAMS, 'Test error');
  console.log('MCPError created:', error.message);
  
  // Test validation
  const modelValidation = validateModel('gpt-4');
  console.log('Model validation result:', modelValidation.isValid);
  
  // Test constants
  console.log('Supported models count:', SUPPORTED_MODELS.length);
  console.log('ID patterns available:', Object.keys(ID_PATTERNS));
  
  // Test resources
  const allResources = getAllResources();
  console.log('Available resources:', allResources.length);
  const templateContent = getResourceContent('assistant://templates/coding-assistant');
  console.log('Template content available:', !!templateContent);
  
  // Test service instantiation
  const service = new OpenAIService('test-key');
  console.log('OpenAI service created:', !!service);
  
  console.log('✅ All shared library imports working correctly!');
}

// Export test function
export { testSharedLibraries };

// Type tests to ensure all types are available
type TestTypes = {
  assistant: Assistant;
  thread: Thread;
  message: Message;
  run: Run;
  validation: ValidationResult;
  env: Env;
};

console.log('🎉 Shared library structure validation complete!');