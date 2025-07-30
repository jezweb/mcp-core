/**
 * Simple test to verify MCP Resources functionality
 */

import { mcpResources, getResourceContent } from '../../dist/shared/resources/index.js';

console.log('🧪 Testing MCP Resources Module...\n');

// Test 1: Verify resources are defined
console.log('📋 Available Resources:');
console.log(`✅ Found ${mcpResources.length} resources`);

mcpResources.forEach((resource, index) => {
  console.log(`  ${index + 1}. ${resource.name} (${resource.uri})`);
});

console.log('\n🔍 Testing Resource Content:');

// Test 2: Test assistant template
const codingAssistant = getResourceContent('assistant://templates/coding-assistant');
if (codingAssistant) {
  console.log('✅ Coding Assistant Template:');
  console.log(`  - MIME Type: ${codingAssistant.mimeType}`);
  console.log(`  - Content Length: ${codingAssistant.content.length} characters`);
  
  try {
    const parsed = JSON.parse(codingAssistant.content);
    console.log(`  - Model: ${parsed.model}`);
    console.log(`  - Tools: ${parsed.tools?.length || 0}`);
  } catch (e) {
    console.log('  - Content is not JSON');
  }
} else {
  console.log('❌ Coding Assistant Template not found');
}

// Test 3: Test workflow example
const workflow = getResourceContent('examples://workflows/create-and-run');
if (workflow) {
  console.log('\n✅ Create and Run Workflow:');
  console.log(`  - MIME Type: ${workflow.mimeType}`);
  console.log(`  - Content Length: ${workflow.content.length} characters`);
  console.log(`  - Contains steps: ${workflow.content.includes('Step 1:')}`);
} else {
  console.log('\n❌ Create and Run Workflow not found');
}

// Test 4: Test documentation
const apiDocs = getResourceContent('docs://openai-assistants-api');
if (apiDocs) {
  console.log('\n✅ API Documentation:');
  console.log(`  - MIME Type: ${apiDocs.mimeType}`);
  console.log(`  - Content Length: ${apiDocs.content.length} characters`);
  console.log(`  - Contains ID formats: ${apiDocs.content.includes('asst_')}`);
} else {
  console.log('\n❌ API Documentation not found');
}

// Test 5: Test invalid resource
const invalid = getResourceContent('invalid://resource/uri');
console.log(`\n✅ Invalid resource correctly returns null: ${invalid === null}`);

// Test 6: Verify all expected resources exist
const expectedResources = [
  'assistant://templates/coding-assistant',
  'assistant://templates/writing-assistant', 
  'assistant://templates/data-analyst',
  'assistant://templates/customer-support',
  'examples://workflows/create-and-run',
  'examples://workflows/batch-processing',
  'docs://openai-assistants-api',
  'docs://error-handling',
  'docs://best-practices'
];

console.log('\n🎯 Resource Coverage Check:');
const foundUris = mcpResources.map(r => r.uri);
const missingResources = expectedResources.filter(uri => !foundUris.includes(uri));
const extraResources = foundUris.filter(uri => !expectedResources.includes(uri));

console.log(`✅ Expected resources found: ${expectedResources.length - missingResources.length}/${expectedResources.length}`);
if (missingResources.length > 0) {
  console.log(`❌ Missing resources: ${missingResources.join(', ')}`);
}
if (extraResources.length > 0) {
  console.log(`ℹ️  Extra resources: ${extraResources.join(', ')}`);
}

console.log('\n✨ Resource module testing complete!');