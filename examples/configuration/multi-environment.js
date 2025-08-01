/**
 * Multi-Environment Deployment Example
 * 
 * This example demonstrates configuration management across multiple environments,
 * deployment pipeline integration, and environment-specific optimizations.
 */

import { ConfigurationSystem, executeDeploymentPipeline } from '../../shared/config/index.js';

async function multiEnvironmentExample() {
  console.log('🌍 Multi-Environment Deployment Example\n');

  // Initialize configuration system
  const configSystem = new ConfigurationSystem();
  await configSystem.initialize();
  
  const environmentManager = configSystem.getEnvironmentManager();
  const healthChecker = configSystem.getHealthChecker();
  const pipelineManager = configSystem.getPipelineManager();

  // 1. Environment Detection
  console.log('1. Environment detection and configuration...');
  
  const detection = environmentManager.detectEnvironment();
  console.log('🔍 Detected environment:', detection.environment);
  console.log('🔍 Deployment type:', detection.deployment);
  console.log('🔍 Confidence level:', (detection.confidence * 100).toFixed(1) + '%');
  console.log('🔍 Metadata:', JSON.stringify(detection.metadata, null, 2));
  console.log('');

  // 2. Load Environment-Specific Configurations
  console.log('2. Loading environment-specific configurations...');
  
  const environments = ['development', 'staging', 'production', 'test'];
  const envConfigs = {};
  
  for (const env of environments) {
    try {
      const config = await environmentManager.loadEnvironmentConfig(env);
      envConfigs[env] = config;
      console.log(`✅ Loaded ${env} configuration`);
      console.log(`   Server environment: ${config.server.environment}`);
      console.log(`   Deployment type: ${config.deployment.type}`);
      console.log(`   Debug mode: ${config.deployment.debug}`);
      console.log(`   Hot reload: ${config.runtime?.hotReload}`);
    } catch (error) {
      console.log(`❌ Failed to load ${env} configuration:`, error.message);
    }
  }
  console.log('');

  // 3. Environment-Specific Feature Flags
  console.log('3. Setting up environment-specific feature flags...');
  
  const featureFlags = configSystem.getFeatureFlags();
  featureFlags.registerFlags([
    {
      name: 'debug-logging',
      enabled: false,
      description: 'Enable debug logging',
      rules: [
        {
          conditions: [
            { field: 'environment', operator: 'equals', value: 'development' }
          ],
          enabled: true
        },
        {
          conditions: [
            { field: 'environment', operator: 'equals', value: 'test' }
          ],
          enabled: true
        }
      ]
    },
    {
      name: 'performance-monitoring',
      enabled: false,
      description: 'Enable performance monitoring',
      rules: [
        {
          conditions: [
            { field: 'environment', operator: 'equals', value: 'staging' }
          ],
          enabled: true
        },
        {
          conditions: [
            { field: 'environment', operator: 'equals', value: 'production' }
          ],
          enabled: true
        }
      ]
    },
    {
      name: 'experimental-features',
      enabled: false,
      description: 'Enable experimental features',
      rules: [
        {
          conditions: [
            { field: 'environment', operator: 'equals', value: 'development' }
          ],
          enabled: true
        }
      ]
    }
  ]);

  // Test feature flags in different environments
  for (const env of environments) {
    const context = { environment: env };
    console.log(`🏁 ${env.toUpperCase()} environment flags:`);
    console.log(`   Debug logging: ${featureFlags.isEnabled('debug-logging', context)}`);
    console.log(`   Performance monitoring: ${featureFlags.isEnabled('performance-monitoring', context)}`);
    console.log(`   Experimental features: ${featureFlags.isEnabled('experimental-features', context)}`);
  }
  console.log('');

  // 4. Environment Validation
  console.log('4. Validating environment configurations...');
  
  for (const env of environments) {
    if (envConfigs[env]) {
      const validation = await environmentManager.validateEnvironmentConfig(env, envConfigs[env]);
      console.log(`📋 ${env} validation:`);
      console.log(`   Valid: ${validation.isValid}`);
      console.log(`   Errors: ${validation.errors.length}`);
      console.log(`   Warnings: ${validation.warnings.length}`);
      
      if (validation.errors.length > 0) {
        console.log(`   Error details: ${validation.errors.join(', ')}`);
      }
    }
  }
  console.log('');

  // 5. Health Checks per Environment
  console.log('5. Performing health checks for each environment...');
  
  for (const env of environments) {
    if (envConfigs[env]) {
      const healthResult = await healthChecker.performHealthCheck(envConfigs[env], env);
      console.log(`🏥 ${env} health check:`);
      console.log(`   Status: ${healthResult.status}`);
      console.log(`   Total checks: ${healthResult.summary.total}`);
      console.log(`   Passed: ${healthResult.summary.passed}`);
      console.log(`   Warnings: ${healthResult.summary.warnings}`);
      console.log(`   Failed: ${healthResult.summary.failed}`);
      
      if (healthResult.recommendations.length > 0) {
        console.log(`   Recommendations: ${healthResult.recommendations.slice(0, 2).join(', ')}`);
      }
    }
  }
  console.log('');

  // 6. Deployment Pipeline Simulation
  console.log('6. Simulating deployment pipeline...');
  
  // Dry run deployment pipeline
  const pipelineResults = await executeDeploymentPipeline(
    ['development', 'staging', 'production'],
    {
      dryRun: true,
      skipValidation: false,
      skipHealthChecks: false
    }
  );
  
  console.log('🚀 Pipeline execution results:');
  pipelineResults.forEach((result, index) => {
    console.log(`   ${index + 1}. ${result.environment}:`);
    console.log(`      Success: ${result.success}`);
    console.log(`      Duration: ${result.duration?.toFixed(0)}ms`);
    console.log(`      Stages: ${result.stages?.length || 0}`);
    
    if (result.errors && result.errors.length > 0) {
      console.log(`      Errors: ${result.errors.join(', ')}`);
    }
  });
  console.log('');

  // 7. Configuration Migration Between Environments
  console.log('7. Demonstrating configuration migration...');
  
  // Start with development configuration
  await configSystem.updateConfiguration(envConfigs.development);
  console.log('📋 Applied development configuration');
  console.log(`   Server name: ${configSystem.getConfiguration().server.name}`);
  console.log(`   Debug mode: ${configSystem.getConfiguration().deployment.debug}`);
  
  // Export state
  const devState = configSystem.exportState();
  console.log('📦 Exported development state');
  
  // Migrate to production with overrides
  const productionOverrides = {
    configuration: {
      ...devState.configuration,
      ...envConfigs.production,
      server: {
        ...devState.configuration.server,
        environment: 'production'
      }
    },
    featureFlags: devState.featureFlags
  };
  
  await configSystem.importState(productionOverrides);
  console.log('📥 Imported production configuration');
  console.log(`   Server name: ${configSystem.getConfiguration().server.name}`);
  console.log(`   Environment: ${configSystem.getConfiguration().server.environment}`);
  console.log(`   Debug mode: ${configSystem.getConfiguration().deployment.debug}`);
  console.log('');

  // 8. Environment-Specific Performance Optimization
  console.log('8. Environment-specific performance optimization...');
  
  const performanceConfigs = {
    development: {
      runtime: { configRefreshInterval: 5000 },
      performance: { memory: { maxHeapSize: 512 * 1024 * 1024 } }
    },
    staging: {
      runtime: { configRefreshInterval: 30000 },
      performance: { memory: { maxHeapSize: 256 * 1024 * 1024 } }
    },
    production: {
      runtime: { configRefreshInterval: 300000 },
      performance: { memory: { maxHeapSize: 128 * 1024 * 1024 } }
    }
  };
  
  for (const [env, perfConfig] of Object.entries(performanceConfigs)) {
    console.log(`⚡ ${env} performance settings:`);
    console.log(`   Config refresh: ${perfConfig.runtime.configRefreshInterval / 1000}s`);
    console.log(`   Max memory: ${perfConfig.performance.memory.maxHeapSize / 1024 / 1024}MB`);
  }
  console.log('');

  // 9. Environment Monitoring Setup
  console.log('9. Setting up environment monitoring...');
  
  const auditManager = configSystem.getAuditTrailManager();
  
  // Log environment-specific events
  for (const env of environments) {
    await auditManager.logChange('environment-setup', null, {
      environment: env,
      timestamp: new Date().toISOString(),
      configuration: envConfigs[env] ? 'loaded' : 'failed'
    }, {
      source: 'multi-environment-example',
      reason: `Environment ${env} configuration setup`
    });
  }
  
  // Query environment-related audit entries
  const envAuditEntries = await auditManager.queryAuditLog({
    limit: 10,
    source: 'multi-environment-example'
  });
  
  console.log(`📋 Created ${envAuditEntries.length} audit entries for environment setup`);
  console.log('');

  // 10. Environment Comparison
  console.log('10. Environment configuration comparison...');
  
  const comparisonFields = ['deployment.debug', 'runtime.hotReload', 'deployment.logLevel'];
  
  console.log('📊 Configuration comparison:');
  console.log('Field'.padEnd(20) + environments.map(e => e.padEnd(12)).join(''));
  console.log('-'.repeat(20 + environments.length * 12));
  
  for (const field of comparisonFields) {
    const values = environments.map(env => {
      const config = envConfigs[env];
      if (!config) return 'N/A';
      
      const fieldParts = field.split('.');
      let value = config;
      for (const part of fieldParts) {
        value = value?.[part];
      }
      return String(value || 'undefined');
    });
    
    console.log(field.padEnd(20) + values.map(v => v.padEnd(12)).join(''));
  }
  console.log('');

  // 11. Deployment Readiness Check
  console.log('11. Deployment readiness assessment...');
  
  const readinessResults = {};
  
  for (const env of environments) {
    if (envConfigs[env]) {
      const healthResult = await healthChecker.performHealthCheck(envConfigs[env], env);
      const validation = await environmentManager.validateEnvironmentConfig(env, envConfigs[env]);
      
      readinessResults[env] = {
        health: healthResult.status,
        validation: validation.isValid,
        ready: healthResult.status === 'healthy' && validation.isValid
      };
    }
  }
  
  console.log('🚦 Deployment readiness:');
  for (const [env, result] of Object.entries(readinessResults)) {
    const status = result.ready ? '✅ READY' : '❌ NOT READY';
    console.log(`   ${env}: ${status} (Health: ${result.health}, Valid: ${result.validation})`);
  }
  console.log('');

  console.log('🎉 Multi-environment deployment example completed successfully!');
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  multiEnvironmentExample().catch(console.error);
}

export { multiEnvironmentExample };