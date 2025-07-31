/**
 * Debug Handler System - Test the shared core handler system locally
 * 
 * This script will test the handler system that Cloudflare Workers uses
 * to identify why only 10 tools are being registered instead of 22.
 */

const { setupHandlerSystem, HANDLER_CATEGORIES, TOTAL_TOOL_COUNT } = require('./shared/core/index.js');
const { OpenAIService } = require('./shared/services/index.js');

console.log('🔍 DEBUGGING HANDLER SYSTEM');
console.log('='.repeat(60));

// Test with a dummy API key
const apiKey = 'sk-test-key-for-debugging';
const openaiService = new OpenAIService(apiKey);

const context = {
  openaiService,
  toolName: '',
  requestId: null
};

console.log('\n📊 EXPECTED HANDLER COUNTS:');
console.log('   Total expected tools:', TOTAL_TOOL_COUNT);
console.log('   Handler categories:');
Object.entries(HANDLER_CATEGORIES).forEach(([category, tools]) => {
  console.log(`      ${category}: ${tools.length} tools - ${tools.join(', ')}`);
});

console.log('\n🔧 TESTING HANDLER SYSTEM SETUP...');
try {
  const registry = setupHandlerSystem(context);
  
  console.log('\n📈 ACTUAL REGISTRY RESULTS:');
  const stats = registry.getStats();
  console.log('   Total registered handlers:', stats.totalHandlers);
  console.log('   Handlers by category:', stats.handlersByCategory);
  console.log('   Registered tools:', stats.registeredTools);
  
  console.log('\n🔍 DETAILED ANALYSIS:');
  if (stats.totalHandlers === TOTAL_TOOL_COUNT) {
    console.log('   ✅ Handler count matches expected (22)');
  } else {
    console.log(`   ❌ Handler count mismatch: Expected ${TOTAL_TOOL_COUNT}, Got ${stats.totalHandlers}`);
    
    // Find missing tools
    const expectedTools = Object.values(HANDLER_CATEGORIES).flat();
    const actualTools = stats.registeredTools;
    const missingTools = expectedTools.filter(tool => !actualTools.includes(tool));
    const extraTools = actualTools.filter(tool => !expectedTools.includes(tool));
    
    if (missingTools.length > 0) {
      console.log('   Missing tools:', missingTools);
    }
    if (extraTools.length > 0) {
      console.log('   Extra tools:', extraTools);
    }
  }
  
  console.log('\n🧪 TESTING INDIVIDUAL HANDLER CATEGORIES...');
  
  // Test each category
  const expectedCategories = Object.keys(HANDLER_CATEGORIES);
  const actualCategories = Object.keys(stats.handlersByCategory);
  
  for (const category of expectedCategories) {
    const expectedCount = HANDLER_CATEGORIES[category].length;
    const actualCount = stats.handlersByCategory[category] || 0;
    
    if (actualCount === expectedCount) {
      console.log(`   ✅ ${category}: ${actualCount}/${expectedCount} handlers`);
    } else {
      console.log(`   ❌ ${category}: ${actualCount}/${expectedCount} handlers - MISSING ${expectedCount - actualCount}`);
      
      // Show which specific tools are missing
      const expectedTools = HANDLER_CATEGORIES[category];
      const actualTools = stats.registeredTools.filter(tool => tool.startsWith(category.replace('runStep', 'run-step')));
      const missing = expectedTools.filter(tool => !actualTools.includes(tool));
      if (missing.length > 0) {
        console.log(`      Missing ${category} tools:`, missing);
      }
    }
  }
  
  console.log('\n🎯 PRODUCTION COMPARISON:');
  console.log('   Local handler system:', stats.totalHandlers, 'tools');
  console.log('   Production deployment: 10 tools');
  console.log('   Missing from production:', stats.totalHandlers - 10, 'tools');
  
  if (stats.totalHandlers === 22) {
    console.log('   ✅ Local handler system is working correctly');
    console.log('   🔍 Issue is in Cloudflare Workers deployment or build process');
  } else {
    console.log('   ❌ Local handler system has issues too');
  }
  
} catch (error) {
  console.error('\n❌ ERROR TESTING HANDLER SYSTEM:');
  console.error('   Error:', error.message);
  console.error('   Stack:', error.stack);
}

console.log('\n🏁 Handler System Debug Complete');