/**
 * Basic Configuration Setup Example
 * 
 * This example demonstrates the basic setup and usage of the configuration system.
 */

import { ConfigurationSystem, getConfig, isFeatureEnabled } from '../../shared/config/index.js';

async function basicSetupExample() {
  console.log('🚀 Basic Configuration Setup Example\n');

  // 1. Initialize the configuration system
  console.log('1. Initializing configuration system...');
  const configSystem = new ConfigurationSystem();
  await configSystem.initialize();
  console.log('✅ Configuration system initialized\n');

  // 2. Get current configuration
  console.log('2. Getting current configuration...');
  const config = getConfig();
  console.log('📋 Server name:', config.server.name);
  console.log('📋 Environment:', config.server.environment);
  console.log('📋 Deployment type:', config.deployment.type);
  console.log('📋 Transport:', config.deployment.transport);
  console.log('');

  // 3. Check feature flags
  console.log('3. Checking feature flags...');
  const toolsEnabled = isFeatureEnabled('tools');
  const resourcesEnabled = isFeatureEnabled('resources');
  console.log('🏁 Tools enabled:', toolsEnabled);
  console.log('🏁 Resources enabled:', resourcesEnabled);
  console.log('');

  // 4. Update configuration
  console.log('4. Updating configuration...');
  await configSystem.updateConfiguration({
    server: {
      name: 'basic-example-server',
      description: 'Configuration system basic example'
    },
    features: {
      exampleFeature: { enabled: true }
    }
  });
  
  const updatedConfig = getConfig();
  console.log('✅ Configuration updated');
  console.log('📋 New server name:', updatedConfig.server.name);
  console.log('📋 New description:', updatedConfig.server.description);
  console.log('');

  // 5. Validate configuration
  console.log('5. Validating configuration...');
  const validation = configSystem.validateConfiguration();
  console.log('✅ Configuration valid:', validation.isValid);
  if (validation.errors.length > 0) {
    console.log('❌ Errors:', validation.errors);
  }
  if (validation.warnings.length > 0) {
    console.log('⚠️ Warnings:', validation.warnings);
  }
  console.log('');

  // 6. Export system state
  console.log('6. Exporting system state...');
  const state = configSystem.exportState();
  console.log('📦 Exported state keys:', Object.keys(state));
  console.log('📦 Configuration keys:', Object.keys(state.configuration));
  console.log('📦 Feature flags count:', state.featureFlags.length);
  console.log('');

  console.log('🎉 Basic setup example completed successfully!');
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  basicSetupExample().catch(console.error);
}

export { basicSetupExample };