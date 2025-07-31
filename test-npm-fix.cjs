// Simple test to verify NPM package fix
const { MCPHandler } = require('./npm-package/src/mcp-handler.cjs');

console.log('🧪 Testing NPM Package Fix');
console.log('='.repeat(40));

async function testNPMPackage() {
  try {
    // Test 1: Handler creation
    console.log('\n1. Creating handler...');
    const handler = new MCPHandler('test-api-key');
    console.log('   ✅ Handler created successfully');
    
    // Test 2: Check handler stats
    const stats = handler.getStats();
    console.log('   ✅ Total handlers:', stats.totalHandlers);
    console.log('   ✅ By category:', stats.handlersByCategory);
    
    // Test 3: Test tools/list
    console.log('\n2. Testing tools/list...');
    const toolsRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };
    
    const toolsResponse = await handler.handleRequest(toolsRequest);
    const toolsCount = toolsResponse.result?.tools?.length || 0;
    console.log('   ✅ Tools returned:', toolsCount);
    
    // Test 4: Test resources/list
    console.log('\n3. Testing resources/list...');
    const resourcesRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'resources/list',
      params: {}
    };
    
    const resourcesResponse = await handler.handleRequest(resourcesRequest);
    const resourcesCount = resourcesResponse.result?.resources?.length || 0;
    console.log('   ✅ Resources returned:', resourcesCount);
    
    // Results
    console.log('\n📊 RESULTS:');
    console.log('   Handlers: Expected=22, Actual=' + stats.totalHandlers);
    console.log('   Tools: Expected=22, Actual=' + toolsCount);
    console.log('   Resources: Expected=13, Actual=' + resourcesCount);
    
    const handlersMatch = stats.totalHandlers === 22;
    const toolsMatch = toolsCount === 22;
    const resourcesMatch = resourcesCount === 13;
    
    console.log('\n🎯 SUCCESS INDICATORS:');
    console.log('   ✅ Handlers match:', handlersMatch ? 'YES' : 'NO');
    console.log('   ✅ Tools match:', toolsMatch ? 'YES' : 'NO');
    console.log('   ✅ Resources match:', resourcesMatch ? 'YES' : 'NO');
    
    if (handlersMatch && toolsMatch && resourcesMatch) {
      console.log('\n🎉 ALL TESTS PASSED! NPM package fix is working correctly.');
      return true;
    } else {
      console.log('\n❌ Some tests failed. Fix needs more work.');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return false;
  }
}

testNPMPackage().then(success => {
  process.exit(success ? 0 : 1);
});