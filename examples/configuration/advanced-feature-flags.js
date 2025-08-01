/**
 * Advanced Feature Flags Example
 * 
 * This example demonstrates advanced feature flag usage including rules,
 * variants, targeting, and dynamic evaluation.
 */

import { ConfigurationSystem } from '../../shared/config/index.js';

async function advancedFeatureFlagsExample() {
  console.log('🎯 Advanced Feature Flags Example\n');

  // Initialize configuration system
  const configSystem = new ConfigurationSystem();
  await configSystem.initialize();
  const featureFlags = configSystem.getFeatureFlags();

  // 1. Basic Feature Flags
  console.log('1. Registering basic feature flags...');
  featureFlags.registerFlags([
    {
      name: 'beta-ui',
      enabled: false,
      description: 'Enable beta user interface'
    },
    {
      name: 'advanced-analytics',
      enabled: true,
      description: 'Enable advanced analytics features'
    }
  ]);

  console.log('🏁 Beta UI enabled:', featureFlags.isEnabled('beta-ui'));
  console.log('🏁 Advanced analytics enabled:', featureFlags.isEnabled('advanced-analytics'));
  console.log('');

  // 2. Feature Flags with Rules
  console.log('2. Registering feature flags with conditional rules...');
  featureFlags.registerFlags([
    {
      name: 'premium-features',
      enabled: false,
      description: 'Premium features for paid users',
      rules: [
        {
          conditions: [
            { field: 'userTier', operator: 'equals', value: 'premium' },
            { field: 'environment', operator: 'equals', value: 'production' }
          ],
          enabled: true
        },
        {
          conditions: [
            { field: 'userTier', operator: 'equals', value: 'enterprise' }
          ],
          enabled: true
        }
      ]
    },
    {
      name: 'debug-mode',
      enabled: false,
      description: 'Enable debug mode',
      rules: [
        {
          conditions: [
            { field: 'environment', operator: 'equals', value: 'development' }
          ],
          enabled: true
        },
        {
          conditions: [
            { field: 'userRole', operator: 'equals', value: 'admin' }
          ],
          enabled: true
        }
      ]
    }
  ]);

  // Test with different contexts
  const contexts = [
    { userTier: 'free', environment: 'production', userRole: 'user' },
    { userTier: 'premium', environment: 'production', userRole: 'user' },
    { userTier: 'enterprise', environment: 'production', userRole: 'user' },
    { userTier: 'free', environment: 'development', userRole: 'admin' }
  ];

  for (const context of contexts) {
    console.log(`📋 Context: ${JSON.stringify(context)}`);
    console.log(`  🏁 Premium features: ${featureFlags.isEnabled('premium-features', context)}`);
    console.log(`  🏁 Debug mode: ${featureFlags.isEnabled('debug-mode', context)}`);
  }
  console.log('');

  // 3. Feature Flag Variants
  console.log('3. Registering feature flags with variants...');
  featureFlags.registerFlags([
    {
      name: 'ui-theme',
      enabled: true,
      description: 'UI theme selection',
      variants: [
        { name: 'light', weight: 40, config: { theme: 'light', colors: 'default' } },
        { name: 'dark', weight: 40, config: { theme: 'dark', colors: 'inverted' } },
        { name: 'auto', weight: 20, config: { theme: 'auto', colors: 'system' } }
      ]
    },
    {
      name: 'recommendation-algorithm',
      enabled: true,
      description: 'Recommendation algorithm variant',
      variants: [
        { name: 'collaborative', weight: 50, config: { algorithm: 'collaborative-filtering', params: { neighbors: 50 } } },
        { name: 'content-based', weight: 30, config: { algorithm: 'content-based', params: { features: 100 } } },
        { name: 'hybrid', weight: 20, config: { algorithm: 'hybrid', params: { weight: 0.7 } } }
      ]
    }
  ]);

  // Test variant selection
  for (let i = 0; i < 10; i++) {
    const themeVariant = featureFlags.getVariant('ui-theme');
    const themeConfig = featureFlags.getFeatureConfig('ui-theme');
    const algoVariant = featureFlags.getVariant('recommendation-algorithm');
    
    console.log(`🎨 Theme variant ${i + 1}: ${themeVariant} (${themeConfig?.theme})`);
    console.log(`🤖 Algorithm variant ${i + 1}: ${algoVariant}`);
  }
  console.log('');

  // 4. Dynamic Feature Flag Updates
  console.log('4. Demonstrating dynamic feature flag updates...');
  
  // Initial state
  console.log('📋 Initial beta-ui state:', featureFlags.isEnabled('beta-ui'));
  
  // Update flag
  featureFlags.updateFlag('beta-ui', { enabled: true });
  console.log('📋 After enabling beta-ui:', featureFlags.isEnabled('beta-ui'));
  
  // Update with new rules
  featureFlags.updateFlag('beta-ui', {
    enabled: false,
    rules: [
      {
        conditions: [
          { field: 'betaTester', operator: 'equals', value: true }
        ],
        enabled: true
      }
    ]
  });
  
  console.log('📋 Beta-ui for regular user:', featureFlags.isEnabled('beta-ui', { betaTester: false }));
  console.log('📋 Beta-ui for beta tester:', featureFlags.isEnabled('beta-ui', { betaTester: true }));
  console.log('');

  // 5. Feature Flag Performance Testing
  console.log('5. Testing feature flag evaluation performance...');
  
  // Register many flags for performance testing
  const performanceFlags = Array.from({ length: 100 }, (_, i) => ({
    name: `perf-flag-${i}`,
    enabled: i % 2 === 0,
    description: `Performance test flag ${i}`,
    rules: i % 10 === 0 ? [
      {
        conditions: [
          { field: 'testMode', operator: 'equals', value: true }
        ],
        enabled: !!(i % 4)
      }
    ] : undefined
  }));
  
  featureFlags.registerFlags(performanceFlags);
  
  // Performance test
  const iterations = 10000;
  const startTime = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    const flagIndex = i % 100;
    const context = { testMode: i % 3 === 0 };
    featureFlags.isEnabled(`perf-flag-${flagIndex}`, context);
  }
  
  const duration = Date.now() - startTime;
  const avgTime = duration / iterations;
  
  console.log(`⚡ Evaluated ${iterations} flags in ${duration}ms`);
  console.log(`⚡ Average evaluation time: ${avgTime.toFixed(3)}ms`);
  console.log('');

  // 6. Feature Flag Export and Import
  console.log('6. Demonstrating feature flag export and import...');
  
  // Export current flags
  const exportedFlags = featureFlags.exportFlags();
  console.log(`📦 Exported ${exportedFlags.length} feature flags`);
  
  // Clear flags and import
  featureFlags.clearFlags();
  console.log('🧹 Cleared all flags');
  console.log('📋 Beta-ui after clear:', featureFlags.isEnabled('beta-ui'));
  
  // Import flags back
  featureFlags.importFlags(exportedFlags, true);
  console.log('📥 Imported flags back');
  console.log('📋 Beta-ui after import:', featureFlags.isEnabled('beta-ui', { betaTester: true }));
  console.log('');

  // 7. Feature Flag Statistics
  console.log('7. Feature flag statistics...');
  const stats = featureFlags.getStatistics();
  console.log('📊 Total flags:', stats.totalFlags);
  console.log('📊 Enabled flags:', stats.enabledFlags);
  console.log('📊 Flags with rules:', stats.flagsWithRules);
  console.log('📊 Flags with variants:', stats.flagsWithVariants);
  console.log('📊 Total evaluations:', stats.totalEvaluations);
  console.log('📊 Average evaluation time:', stats.averageEvaluationTime?.toFixed(3), 'ms');
  console.log('');

  console.log('🎉 Advanced feature flags example completed successfully!');
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  advancedFeatureFlagsExample().catch(console.error);
}

export { advancedFeatureFlagsExample };