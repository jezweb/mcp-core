#!/usr/bin/env node

/**
 * Debug Local Handler Registration
 * 
 * This script tests the local handler system to verify that all 22 tools
 * register correctly and identify any issues with the registration process.
 */

// Test the shared handler system locally
async function testLocalHandlerSystem() {
  console.log('🔍 Testing Local Handler Registration System');
  console.log('='.repeat(60));
  
  try {
    // Import the shared handler system
    const { setupHandlerSystem } = require('./shared/core/index.js');
    const { OpenAIService } = require('./shared/services/index.js');
    
    console.log('\n1. Creating OpenAI service with test key...');
    const openaiService = new OpenAIService('sk-test1234567890123456789012345678901234567890123456');
    
    console.log('2. Setting up handler context...');
    const context = {
      openaiService,
      toolName: '',
      requestId: null
    };
    
    console.log('3. Initializing handler system...');
    const registry = setupHandlerSystem(context);
    
    console.log('4. Getting registry statistics...');
    const stats = registry.getStats();
    
    console.log('\n📊 HANDLER REGISTRATION RESULTS:');
    console.log(`   Total handlers: ${stats.totalHandlers}`);
    console.log(`   Expected: 22`);
    console.log(`   Status: ${stats.totalHandlers === 22 ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    console.log('\n📋 HANDLERS BY CATEGORY:');
    Object.entries(stats.handlersByCategory).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} handlers`);
    });
    
    console.log('\n📝 ALL REGISTERED TOOLS:');
    const tools = stats.registeredTools;
    tools.forEach((tool, i) => {
      console.log(`   ${i + 1}. ${tool}`);
    });
    
    // Check for expected tools
    const expectedTools = [
      'assistant-create', 'assistant-list', 'assistant-get', 'assistant-update', 'assistant-delete',
      'thread-create', 'thread-get', 'thread-update', 'thread-delete',
      'message-create', 'message-list', 'message-get', 'message-update', 'message-delete',
      'run-create', 'run-list', 'run-get', 'run-update', 'run-cancel', 'run-submit-tool-outputs',
      'run-step-list', 'run-step-get'
    ];
    
    const missingTools = expectedTools.filter(tool => !tools.includes(tool));
    const extraTools = tools.filter(tool => !expectedTools.includes(tool));
    
    if (missingTools.length > 0) {
      console.log('\n❌ MISSING TOOLS:');
      missingTools.forEach(tool => console.log(`   - ${tool}`));
    }
    
    if (extraTools.length > 0) {
      console.log('\n⚠️  EXTRA TOOLS:');
      extraTools.forEach(tool => console.log(`   - ${tool}`));
    }
    
    if (missingTools.length === 0 && extraTools.length === 0) {
      console.log('\n✅ All expected tools are registered correctly!');
    }
    
    return { success: stats.totalHandlers === 22, stats };
    
  } catch (error) {
    console.error('\n❌ ERROR during local handler system test:', error);
    console.error('Stack trace:', error.stack);
    return { success: false, error: error.message };
  }
}

// Test the BaseMCPHandler
async function testBaseMCPHandler() {
  console.log('\n\n🧪 Testing BaseMCPHandler');
  console.log('='.repeat(60));
  
  try {
    const { BaseMCPHandler } = require('./shared/core/index.js');
    
    console.log('1. Creating BaseMCPHandler with debug enabled...');
    const config = {
      apiKey: 'sk-test1234567890123456789012345678901234567890123456',
      debug: true, // Enable debug logging
      serverName: 'test-server',
      serverVersion: '1.0.0'
    };
    
    const handler = new BaseMCPHandler(config);
    
    console.log('2. Getting registry stats from BaseMCPHandler...');
    const stats = handler.getRegistryStats();
    
    console.log('\n📊 BASE MCP HANDLER RESULTS:');
    console.log(`   Total handlers: ${stats.totalHandlers}`);
    console.log(`   Expected: 22`);
    console.log(`   Status: ${stats.totalHandlers === 22 ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    console.log('\n📋 HANDLERS BY CATEGORY:');
    Object.entries(stats.handlersByCategory).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} handlers`);
    });
    
    return { success: stats.totalHandlers === 22, stats };
    
  } catch (error) {
    console.error('\n❌ ERROR during BaseMCPHandler test:', error);
    console.error('Stack trace:', error.stack);
    return { success: false, error: error.message };
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Local Handler Registration Tests\n');
  
  const test1 = await testLocalHandlerSystem();
  const test2 = await testBaseMCPHandler();
  
  console.log('\n\n🏁 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Local Handler System: ${test1.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`BaseMCPHandler: ${test2.success ? '✅ PASS' : '❌ FAIL'}`);
  
  if (test1.success && test2.success) {
    console.log('\n🎉 All local tests passed! The issue is likely in the Cloudflare Worker deployment.');
  } else {
    console.log('\n💥 Local tests failed! The issue is in the handler registration system.');
  }
}

runAllTests().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});