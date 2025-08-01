/**
 * Configuration System Examples Index
 * 
 * This file provides easy access to all configuration system examples
 * and demonstrates the comprehensive capabilities of the OpenAI Assistants
 * MCP Server configuration management system.
 */

// Import all examples
import { basicSetupExample } from './basic-setup.js';
import { advancedFeatureFlagsExample } from './advanced-feature-flags.js';
import { runtimeUpdatesExample } from './runtime-updates.js';
import { multiEnvironmentExample } from './multi-environment.js';
import { customSourceExample } from './custom-source.js';

/**
 * Available Configuration Examples
 */
export const examples = {
  'basic-setup': {
    name: 'Basic Setup',
    description: 'Fundamental configuration system setup and basic operations',
    function: basicSetupExample,
    difficulty: 'beginner',
    topics: ['initialization', 'basic-config', 'validation']
  },
  
  'advanced-feature-flags': {
    name: 'Advanced Feature Flags',
    description: 'Complex feature flag scenarios with rules, variants, and targeting',
    function: advancedFeatureFlagsExample,
    difficulty: 'intermediate',
    topics: ['feature-flags', 'rules', 'variants', 'targeting', 'analytics']
  },
  
  'runtime-updates': {
    name: 'Runtime Updates',
    description: 'Hot reloading, real-time updates, and configuration synchronization',
    function: runtimeUpdatesExample,
    difficulty: 'intermediate',
    topics: ['hot-reload', 'real-time', 'synchronization', 'caching']
  },
  
  'multi-environment': {
    name: 'Multi-Environment Deployment',
    description: 'Configuration management across development, staging, and production',
    function: multiEnvironmentExample,
    difficulty: 'advanced',
    topics: ['environments', 'deployment', 'pipeline', 'validation']
  },
  
  'custom-source': {
    name: 'Custom Configuration Sources',
    description: 'Creating and integrating custom configuration sources (API, Database, YAML)',
    function: customSourceExample,
    difficulty: 'advanced',
    topics: ['custom-sources', 'api', 'database', 'yaml', 'fallback']
  }
};

/**
 * Run a specific example by name
 */
export async function runExample(exampleName) {
  const example = examples[exampleName];
  
  if (!example) {
    console.error(`❌ Example '${exampleName}' not found`);
    console.log('Available examples:', Object.keys(examples).join(', '));
    return false;
  }
  
  console.log(`🚀 Running example: ${example.name}`);
  console.log(`📝 Description: ${example.description}`);
  console.log(`📊 Difficulty: ${example.difficulty}`);
  console.log(`🏷️ Topics: ${example.topics.join(', ')}`);
  console.log('─'.repeat(60));
  
  try {
    await example.function();
    console.log('─'.repeat(60));
    console.log(`✅ Example '${example.name}' completed successfully!`);
    return true;
  } catch (error) {
    console.log('─'.repeat(60));
    console.error(`❌ Example '${example.name}' failed:`, error.message);
    return false;
  }
}

/**
 * Run all examples in sequence
 */
export async function runAllExamples() {
  console.log('🎯 Running all configuration system examples...\n');
  
  const results = {};
  let totalSuccess = 0;
  
  for (const [name, example] of Object.entries(examples)) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📚 EXAMPLE ${Object.keys(results).length + 1}/${Object.keys(examples).length}: ${example.name.toUpperCase()}`);
    console.log(`${'='.repeat(80)}`);
    
    const success = await runExample(name);
    results[name] = success;
    
    if (success) {
      totalSuccess++;
    }
    
    // Add delay between examples
    if (Object.keys(results).length < Object.keys(examples).length) {
      console.log('\n⏳ Waiting 2 seconds before next example...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 EXAMPLES SUMMARY');
  console.log(`${'='.repeat(80)}`);
  
  for (const [name, success] of Object.entries(results)) {
    const status = success ? '✅ PASSED' : '❌ FAILED';
    const example = examples[name];
    console.log(`${status} ${example.name} (${example.difficulty})`);
  }
  
  console.log(`\n🎯 Total: ${totalSuccess}/${Object.keys(examples).length} examples passed`);
  
  if (totalSuccess === Object.keys(examples).length) {
    console.log('🎉 All examples completed successfully!');
  } else {
    console.log('⚠️ Some examples failed. Check the logs above for details.');
  }
  
  return results;
}

/**
 * List all available examples
 */
export function listExamples() {
  console.log('📚 Available Configuration System Examples:\n');
  
  for (const [name, example] of Object.entries(examples)) {
    console.log(`🔹 ${name}`);
    console.log(`   Name: ${example.name}`);
    console.log(`   Description: ${example.description}`);
    console.log(`   Difficulty: ${example.difficulty}`);
    console.log(`   Topics: ${example.topics.join(', ')}`);
    console.log('');
  }
  
  console.log('Usage:');
  console.log('  import { runExample } from "./examples/configuration/index.js";');
  console.log('  await runExample("basic-setup");');
  console.log('');
  console.log('Or run all examples:');
  console.log('  import { runAllExamples } from "./examples/configuration/index.js";');
  console.log('  await runAllExamples();');
}

/**
 * Get examples by difficulty level
 */
export function getExamplesByDifficulty(difficulty) {
  return Object.entries(examples)
    .filter(([_, example]) => example.difficulty === difficulty)
    .reduce((acc, [name, example]) => {
      acc[name] = example;
      return acc;
    }, {});
}

/**
 * Get examples by topic
 */
export function getExamplesByTopic(topic) {
  return Object.entries(examples)
    .filter(([_, example]) => example.topics.includes(topic))
    .reduce((acc, [name, example]) => {
      acc[name] = example;
      return acc;
    }, {});
}

/**
 * Interactive example runner
 */
export async function interactiveRunner() {
  console.log('🎮 Interactive Configuration Examples Runner\n');
  
  listExamples();
  
  // In a real implementation, this would use readline or similar
  // For now, we'll just run all examples
  console.log('🚀 Running all examples in interactive mode...\n');
  
  return await runAllExamples();
}

// CLI support
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const argument = process.argv[3];
  
  switch (command) {
    case 'list':
      listExamples();
      break;
      
    case 'run':
      if (argument) {
        runExample(argument).catch(console.error);
      } else {
        console.error('❌ Please specify an example name');
        listExamples();
      }
      break;
      
    case 'all':
      runAllExamples().catch(console.error);
      break;
      
    case 'difficulty':
      if (argument) {
        const filtered = getExamplesByDifficulty(argument);
        console.log(`📊 Examples with difficulty '${argument}':`);
        for (const [name, example] of Object.entries(filtered)) {
          console.log(`  - ${name}: ${example.name}`);
        }
      } else {
        console.error('❌ Please specify a difficulty level (beginner, intermediate, advanced)');
      }
      break;
      
    case 'topic':
      if (argument) {
        const filtered = getExamplesByTopic(argument);
        console.log(`🏷️ Examples with topic '${argument}':`);
        for (const [name, example] of Object.entries(filtered)) {
          console.log(`  - ${name}: ${example.name}`);
        }
      } else {
        console.error('❌ Please specify a topic');
      }
      break;
      
    case 'interactive':
      interactiveRunner().catch(console.error);
      break;
      
    default:
      console.log('📚 Configuration System Examples');
      console.log('');
      console.log('Usage:');
      console.log('  node index.js list                    # List all examples');
      console.log('  node index.js run <example-name>      # Run specific example');
      console.log('  node index.js all                     # Run all examples');
      console.log('  node index.js difficulty <level>      # Filter by difficulty');
      console.log('  node index.js topic <topic>           # Filter by topic');
      console.log('  node index.js interactive             # Interactive runner');
      console.log('');
      listExamples();
  }
}

// Export everything
export {
  basicSetupExample,
  advancedFeatureFlagsExample,
  runtimeUpdatesExample,
  multiEnvironmentExample,
  customSourceExample
};