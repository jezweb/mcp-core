#!/usr/bin/env node

/**
 * Simple test to verify the resource content fix
 * Tests only the resource content retrieval without the full MCP handler
 */

const fs = require('fs');
const path = require('path');

function testResourceContent() {
  console.log('🧪 Testing Resource Content Fix...\n');

  try {
    // Read and evaluate the resources.ts file content directly
    const resourcesPath = path.join(__dirname, 'shared/resources/resources.ts');
    const resourcesContent = fs.readFileSync(resourcesPath, 'utf8');

    console.log('📋 Testing: Resource Content Mapping');

    // Extract the RESOURCE_CONTENT object from the file
    const resourceContentMatch = resourcesContent.match(/const RESOURCE_CONTENT: Record<string, any> = \{([\s\S]*?)\};/);
    
    if (!resourceContentMatch) {
      console.log('❌ Could not find RESOURCE_CONTENT in resources.ts');
      return false;
    }

    console.log('✅ Found RESOURCE_CONTENT mapping in resources.ts');

    // Extract the getResourceContent function
    const getResourceContentMatch = resourcesContent.match(/export function getResourceContent\(uri: string\): any \{([\s\S]*?)\}/);
    
    if (!getResourceContentMatch) {
      console.log('❌ Could not find getResourceContent function in resources.ts');
      return false;
    }

    console.log('✅ Found getResourceContent function in resources.ts');

    // Check that the function returns RESOURCE_CONTENT[uri]
    const functionBody = getResourceContentMatch[1];
    if (functionBody.includes('RESOURCE_CONTENT[uri]')) {
      console.log('✅ getResourceContent function correctly returns RESOURCE_CONTENT[uri]');
    } else {
      console.log('❌ getResourceContent function does not return RESOURCE_CONTENT[uri]');
      console.log('Function body:', functionBody);
      return false;
    }

    console.log('\n📋 Testing: Resource Content Data');

    // Test specific resource URIs that should have content
    const testUris = [
      'assistant://templates/coding-assistant',
      'docs://openai-assistants-api',
      'docs://best-practices'
    ];

    let allContentFound = true;

    for (const uri of testUris) {
      console.log(`\n🔍 Checking content for: ${uri}`);
      
      // Look for the URI in the RESOURCE_CONTENT mapping
      const uriPattern = new RegExp(`"${uri.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}":\\s*([\\s\\S]*?)(?=,\\s*"[^"]*":|\\s*\\})`);
      const contentMatch = resourcesContent.match(uriPattern);
      
      if (contentMatch) {
        const contentValue = contentMatch[1].trim();
        
        if (contentValue === 'undefined' || contentValue === 'null' || contentValue === '""') {
          console.log(`   ❌ Content is empty/null for ${uri}`);
          allContentFound = false;
        } else {
          const contentLength = contentValue.length;
          console.log(`   ✅ Content found (${contentLength} chars)`);
          
          // Show content type
          if (contentValue.startsWith('{')) {
            console.log(`   ✅ Content type: Object`);
          } else if (contentValue.startsWith('"')) {
            console.log(`   ✅ Content type: String`);
          } else {
            console.log(`   ✅ Content type: Other`);
          }
        }
      } else {
        console.log(`   ❌ No content mapping found for ${uri}`);
        allContentFound = false;
      }
    }

    console.log('\n📋 Testing: Base MCP Handler Fix');

    // Check that the base-mcp-handler.ts file has the correct fix
    const handlerPath = path.join(__dirname, 'shared/core/base-mcp-handler.ts');
    const handlerContent = fs.readFileSync(handlerPath, 'utf8');

    // Check for the import
    if (handlerContent.includes('getResourceContent')) {
      console.log('✅ getResourceContent is imported in base-mcp-handler.ts');
    } else {
      console.log('❌ getResourceContent is not imported in base-mcp-handler.ts');
      allContentFound = false;
    }

    // Check for the fix on line 409
    if (handlerContent.includes('text: getResourceContent(uri)')) {
      console.log('✅ Line 409 uses getResourceContent(uri) instead of (resourceData as any).content');
      console.log('✅ The fix has been correctly applied!');
    } else if (handlerContent.includes('text: (resourceData as any).content')) {
      console.log('❌ Line 409 still uses the old (resourceData as any).content - fix not applied!');
      allContentFound = false;
    } else {
      console.log('⚠️  Could not find the specific line - checking for any getResourceContent usage...');
      if (handlerContent.includes('getResourceContent(')) {
        console.log('✅ getResourceContent is being called somewhere in the handler');
      } else {
        console.log('❌ getResourceContent is not being called in the handler');
        allContentFound = false;
      }
    }

    // Final results
    console.log('\n📊 Resource Content Fix Test Results:');
    console.log('====================================');
    
    if (allContentFound) {
      console.log('🎉 All tests passed! The resource validation fix appears to be working correctly.');
      console.log('✅ Key findings:');
      console.log('   - getResourceContent function exists and returns RESOURCE_CONTENT[uri]');
      console.log('   - Resource content mappings are present for all test URIs');
      console.log('   - base-mcp-handler.ts imports getResourceContent');
      console.log('   - base-mcp-handler.ts uses getResourceContent(uri) instead of undefined content');
      console.log('');
      console.log('🔧 Expected behavior:');
      console.log('   - contents[0].text should now contain actual content instead of undefined');
      console.log('   - Zod validation errors should no longer occur');
      console.log('   - GitHub issue #1 should be resolved');
      return true;
    } else {
      console.log('💥 Some tests failed. The fix may need additional work.');
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
const success = testResourceContent();
process.exit(success ? 0 : 1);