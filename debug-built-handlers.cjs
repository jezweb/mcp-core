/**
 * Debug Built Handlers - Test the compiled JavaScript handlers
 * 
 * This script tests the built JavaScript files to see if all 22 tools
 * are being registered correctly in the compiled output.
 */

async function testBuiltHandlers() {
  console.log('🔍 DEBUGGING BUILT HANDLER SYSTEM');
  console.log('='.repeat(60));

  try {
    // Import the built JavaScript modules
    const { setupHandlerSystem, HANDLER_CATEGORIES, TOTAL_TOOL_COUNT } = await import('./dist/shared/core/index.js');
    const { OpenAIService } = await import('./dist/shared/services/index.js');

    console.log('\n📊 EXPECTED HANDLER COUNTS (from built JS):');
    console.log('   Total expected tools:', TOTAL_TOOL_COUNT);
    console.log('   Handler categories:');
    Object.entries(HANDLER_CATEGORIES).forEach(([category, tools]) => {
      console.log(`      ${category}: ${tools.length} tools - ${tools.join(', ')}`);
    });

    console.log('\n🔧 TESTING BUILT HANDLER SYSTEM SETUP...');
    
    // Test with a dummy API key
    const apiKey = 'sk-test-key-for-debugging';
    const openaiService = new OpenAIService(apiKey);

    const context = {
      openaiService,
      toolName: '',
      requestId: null
    };

    const registry = setupHandlerSystem(context);
    
    console.log('\n📈 ACTUAL REGISTRY RESULTS (from built JS):');
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
    
    for (const category of expectedCategories) {
      const expectedCount = HANDLER_CATEGORIES[category].length;
      const actualCount = stats.handlersByCategory[category] || 0;
      
      if (actualCount === expectedCount) {
        console.log(`   ✅ ${category}: ${actualCount}/${expectedCount} handlers`);
      } else {
        console.log(`   ❌ ${category}: ${actualCount}/${expectedCount} handlers - MISSING ${expectedCount - actualCount}`);
        
        // Show which specific tools are missing
        const expectedTools = HANDLER_CATEGORIES[category];
        const actualTools = stats.registeredTools.filter(tool => {
          if (category === 'runStep') {
            return tool.startsWith('run-step');
          }
          return tool.startsWith(category.replace('runStep', 'run-step'));
        });
        const missing = expectedTools.filter(tool => !actualTools.includes(tool));
        if (missing.length > 0) {
          console.log(`      Missing ${category} tools:`, missing);
        }
      }
    }
    
    console.log('\n🎯 PRODUCTION COMPARISON:');
    console.log('   Built handler system:', stats.totalHandlers, 'tools');
    console.log('   Production deployment: 10 tools');
    console.log('   Missing from production:', stats.totalHandlers - 10, 'tools');
    
    if (stats.totalHandlers === 22) {
      console.log('   ✅ Built handler system is working correctly');
      console.log('   🔍 Issue is likely in Cloudflare Workers deployment process');
    } else {
      console.log('   ❌ Built handler system has issues');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR TESTING BUILT HANDLER SYSTEM:');
    console.error('   Error:', error.message);
    console.error('   Stack:', error.stack);
  }

  console.log('\n🏁 Built Handler System Debug Complete');
}

// Run the test
testBuiltHandlers().catch(console.error);