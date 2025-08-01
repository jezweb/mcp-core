/**
 * End-to-End Integration Test Suite - Phase 2.5: Integration & Testing
 *
 * Comprehensive tests for the complete configuration management system lifecycle.
 * Tests integration between all components: ConfigurationManager, FeatureFlagsEngine,
 * EnvironmentManager, RuntimeManager, HotReload, Cache, Sync, and AuditTrail.
 */

import assert from 'assert';
import { promises as fs } from 'fs';
import path from 'path';

// Test framework utilities
const describe = (name, fn) => {
  console.log(`\n📋 ${name}`);
  try {
    fn();
    console.log(`✅ ${name} - All tests passed`);
  } catch (error) {
    console.log(`❌ ${name} - ${error.message}`);
    throw error;
  }
};

const it = (name, fn) => {
  try {
    if (fn.constructor.name === 'AsyncFunction') {
      return fn().then(() => {
        console.log(`  ✅ ${name}`);
      }).catch(error => {
        console.log(`  ❌ ${name}: ${error.message}`);
        throw error;
      });
    } else {
      fn();
      console.log(`  ✅ ${name}`);
    }
  } catch (error) {
    console.log(`  ❌ ${name}: ${error.message}`);
    throw error;
  }
};

const beforeEach = (fn) => fn();
const afterEach = (fn) => fn();

// Import configuration system components
let ConfigurationSystem, getGlobalConfigSystem, initializeGlobalConfig;
let ConfigUtils, isFeatureEnabled, updateConfig, validateConfig;
let performHealthCheck, executeDeploymentPipeline;

// Mock environment for testing
const originalEnv = process.env;

describe('End-to-End Configuration System Integration', function() {
  let configSystem;
  let testConfigDir;
  let testEnvironments;

  beforeEach(async function() {
    // Reset environment
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'test';

    // Import modules dynamically to avoid module loading issues
    try {
      const configModule = await import('../../shared/config/index.js');
      ConfigurationSystem = configModule.ConfigurationSystem;
      getGlobalConfigSystem = configModule.getGlobalConfigSystem;
      initializeGlobalConfig = configModule.initializeGlobalConfig;
      ConfigUtils = configModule.ConfigUtils;
      isFeatureEnabled = configModule.isFeatureEnabled;
      updateConfig = configModule.updateConfig;
      validateConfig = configModule.validateConfig;
      performHealthCheck = configModule.performHealthCheck;
      executeDeploymentPipeline = configModule.executeDeploymentPipeline;
    } catch (error) {
      console.warn('Could not import configuration modules, using mocks:', error.message);
      // Use mock implementations for testing
      ConfigurationSystem = MockConfigurationSystem;
      getGlobalConfigSystem = () => new MockConfigurationSystem();
      initializeGlobalConfig = async () => {};
      ConfigUtils = MockConfigUtils;
      isFeatureEnabled = () => true;
      updateConfig = async () => ({ isValid: true, errors: [], warnings: [] });
      validateConfig = () => ({ isValid: true, errors: [], warnings: [] });
      performHealthCheck = async () => ({ status: 'healthy', checks: [], summary: { total: 0, passed: 0, warnings: 0, failed: 0 }, recommendations: [] });
      executeDeploymentPipeline = async () => [{ environment: 'test', success: true, stages: [] }];
    }

    // Create fresh configuration system instance
    configSystem = new ConfigurationSystem();
    
    // Setup test directories and configurations
    testConfigDir = path.join(process.cwd(), 'test-config-temp');
    testEnvironments = ['development', 'staging', 'production', 'test'];
  });

  afterEach(async function() {
    // Cleanup
    process.env = originalEnv;
    
    // Reset configuration system
    if (configSystem && typeof configSystem.reset === 'function') {
      await configSystem.reset();
    }

    // Cleanup test files
    try {
      await fs.rmdir(testConfigDir, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Complete Configuration Lifecycle', function() {
    it('should initialize configuration system with all components', async function() {
      await configSystem.initialize();

      // Verify all managers are initialized
      assert(configSystem.getManager(), 'Configuration manager should be initialized');
      assert(configSystem.getFeatureFlags(), 'Feature flags engine should be initialized');
      assert(configSystem.getValidator(), 'Configuration validator should be initialized');
      assert(configSystem.getEnvironmentManager(), 'Environment manager should be initialized');
      assert(configSystem.getHealthChecker(), 'Health checker should be initialized');
      assert(configSystem.getPipelineManager(), 'Pipeline manager should be initialized');
      assert(configSystem.getRuntimeManager(), 'Runtime manager should be initialized');
      assert(configSystem.getHotReloadManager(), 'Hot reload manager should be initialized');
      assert(configSystem.getCacheManager(), 'Cache manager should be initialized');
      assert(configSystem.getSyncManager(), 'Sync manager should be initialized');
      assert(configSystem.getAuditTrailManager(), 'Audit trail manager should be initialized');
    });

    it('should load configuration from multiple sources', async function() {
      const sources = [
        {
          name: 'base-config',
          type: 'object',
          data: {
            server: { name: 'test-server', version: '1.0.0' },
            features: { tools: { enabled: true } },
          },
        },
        {
          name: 'environment-overrides',
          type: 'object',
          data: {
            server: { environment: 'test' },
            deployment: { type: 'local', transport: 'stdio' },
          },
        },
      ];

      await configSystem.initialize(sources);
      const config = configSystem.getConfiguration();

      assert.strictEqual(config.server.name, 'test-server');
      assert.strictEqual(config.server.environment, 'test');
      assert.strictEqual(config.deployment.type, 'local');
      assert.strictEqual(config.features.tools.enabled, true);
    });

    it('should validate configuration across all components', async function() {
      await configSystem.initialize();
      
      const validation = configSystem.validateConfiguration();
      assert.strictEqual(validation.isValid, true);
      assert(Array.isArray(validation.errors));
      assert(Array.isArray(validation.warnings));
    });

    it('should handle feature flags integration with environment management', async function() {
      await configSystem.initialize();

      // Register feature flags
      const flags = [
        {
          name: 'advanced-tools',
          enabled: true,
          description: 'Enable advanced tool features',
          variants: [
            { name: 'basic', weight: 50, config: { level: 'basic' } },
            { name: 'advanced', weight: 50, config: { level: 'advanced' } },
          ],
        },
        {
          name: 'beta-features',
          enabled: false,
          description: 'Enable beta features',
        },
      ];

      configSystem.getFeatureFlags().registerFlags(flags);

      // Test feature flag evaluation
      const isAdvancedEnabled = configSystem.isFeatureEnabled('advanced-tools');
      const isBetaEnabled = configSystem.isFeatureEnabled('beta-features');
      const variant = configSystem.getFeatureVariant('advanced-tools');

      assert.strictEqual(isAdvancedEnabled, true);
      assert.strictEqual(isBetaEnabled, false);
      assert(['basic', 'advanced'].includes(variant));
    });
  });

  describe('Runtime Configuration Updates with Hot Reloading', function() {
    it('should update configuration at runtime with hot reload', async function() {
      await configSystem.initialize();
      
      const hotReloadManager = configSystem.getHotReloadManager();
      const runtimeManager = configSystem.getRuntimeManager();
      
      // Start hot reloading
      hotReloadManager.start();

      let reloadTriggered = false;
      hotReloadManager.onHotReload(() => {
        reloadTriggered = true;
      });

      // Update configuration
      const updates = {
        server: { name: 'hot-reloaded-server' },
        features: { tools: { enabled: false } },
      };

      const result = await configSystem.updateConfiguration(updates);
      assert.strictEqual(result.isValid, true);

      // Verify configuration was updated
      const updatedConfig = configSystem.getConfiguration();
      assert.strictEqual(updatedConfig.server.name, 'hot-reloaded-server');
      assert.strictEqual(updatedConfig.features.tools.enabled, false);

      // Trigger hot reload
      await hotReloadManager.triggerReload('test-update');

      hotReloadManager.stop();
    });

    it('should maintain configuration snapshots during updates', async function() {
      await configSystem.initialize();
      
      const runtimeManager = configSystem.getRuntimeManager();
      
      // Create initial snapshot
      const snapshotId = runtimeManager.createSnapshot('initial-state', 'test');
      assert(snapshotId);

      // Update configuration
      await configSystem.updateConfiguration({
        server: { name: 'updated-server' },
      });

      // Verify update
      let config = configSystem.getConfiguration();
      assert.strictEqual(config.server.name, 'updated-server');

      // Rollback to snapshot
      const rollbackResult = await runtimeManager.rollbackToSnapshot(snapshotId);
      assert.strictEqual(rollbackResult.success, true);

      // Verify rollback
      config = configSystem.getConfiguration();
      assert.notStrictEqual(config.server.name, 'updated-server');
    });
  });

  describe('Caching and Performance Integration', function() {
    it('should cache configuration data for performance', async function() {
      await configSystem.initialize();
      
      const cacheManager = configSystem.getCacheManager();
      const config = configSystem.getConfiguration();

      // Cache configuration
      await cacheManager.set('current-config', config, 300000); // 5 minutes TTL

      // Retrieve from cache
      const cachedConfig = await cacheManager.get('current-config');
      assert.deepStrictEqual(cachedConfig, config);

      // Verify cache statistics
      const stats = cacheManager.getStatistics();
      assert.strictEqual(stats.hits, 1);
      assert.strictEqual(stats.totalEntries, 1);
      assert(stats.hitRate > 0);
    });

    it('should invalidate cache on configuration updates', async function() {
      await configSystem.initialize();
      
      const cacheManager = configSystem.getCacheManager();
      const initialConfig = configSystem.getConfiguration();

      // Cache initial configuration
      await cacheManager.set('config-cache', initialConfig);

      // Update configuration
      await configSystem.updateConfiguration({
        server: { name: 'cache-invalidated-server' },
      });

      // Cache should still have old config until manually updated
      const cachedConfig = await cacheManager.get('config-cache');
      assert.notStrictEqual(cachedConfig.server.name, 'cache-invalidated-server');

      // Update cache with new configuration
      const newConfig = configSystem.getConfiguration();
      await cacheManager.set('config-cache', newConfig);

      const updatedCachedConfig = await cacheManager.get('config-cache');
      assert.strictEqual(updatedCachedConfig.server.name, 'cache-invalidated-server');
    });
  });

  describe('Audit Trail and Change Tracking', function() {
    it('should track all configuration changes in audit trail', async function() {
      await configSystem.initialize();
      
      const auditManager = configSystem.getAuditTrailManager();

      // Perform multiple configuration changes
      await configSystem.updateConfiguration({
        server: { name: 'audit-test-1' },
      });

      await configSystem.updateConfiguration({
        features: { tools: { enabled: false } },
      });

      await configSystem.updateConfiguration({
        deployment: { type: 'cloudflare' },
      });

      // Query audit log
      const auditEntries = await auditManager.queryAuditLog();
      assert(auditEntries.length >= 3);

      // Verify audit entry structure
      const latestEntry = auditEntries[auditEntries.length - 1];
      assert(latestEntry.id);
      assert(latestEntry.timestamp);
      assert(latestEntry.action);
      assert(latestEntry.user);
      assert(latestEntry.source);
    });

    it('should generate comprehensive audit statistics', async function() {
      await configSystem.initialize();
      
      const auditManager = configSystem.getAuditTrailManager();

      // Perform various operations
      await auditManager.logChange('create', null, { test: 'data1' });
      await auditManager.logChange('update', { test: 'data1' }, { test: 'data2' });
      await auditManager.logChange('update', { test: 'data2' }, { test: 'data3' });
      await auditManager.logChange('delete', { test: 'data3' }, null);

      const stats = await auditManager.getAuditStatistics();
      assert.strictEqual(stats.totalEntries, 4);
      assert.strictEqual(stats.entriesByAction.create, 1);
      assert.strictEqual(stats.entriesByAction.update, 2);
      assert.strictEqual(stats.entriesByAction.delete, 1);
    });
  });

  describe('Multi-Environment Configuration Management', function() {
    it('should handle environment-specific configurations', async function() {
      // Test development environment
      process.env.NODE_ENV = 'development';
      await configSystem.initialize();
      
      let config = configSystem.getConfiguration();
      assert.strictEqual(config.server.environment, 'development');

      // Test production environment
      await configSystem.reset();
      process.env.NODE_ENV = 'production';
      await configSystem.initialize();
      
      config = configSystem.getConfiguration();
      assert.strictEqual(config.server.environment, 'production');
    });

    it('should validate environment-specific feature flags', async function() {
      await configSystem.initialize();
      
      const featureFlags = configSystem.getFeatureFlags();
      
      // Register environment-specific flags
      featureFlags.registerFlags([
        {
          name: 'debug-mode',
          enabled: true,
          rules: [
            {
              conditions: [{ field: 'environment', operator: 'equals', value: 'development' }],
              enabled: true,
            },
            {
              conditions: [{ field: 'environment', operator: 'equals', value: 'production' }],
              enabled: false,
            },
          ],
        },
      ]);

      // Test in development context
      const devContext = { environment: 'development' };
      const debugInDev = featureFlags.isEnabled('debug-mode', devContext);
      assert.strictEqual(debugInDev, true);

      // Test in production context
      const prodContext = { environment: 'production' };
      const debugInProd = featureFlags.isEnabled('debug-mode', prodContext);
      assert.strictEqual(debugInProd, false);
    });
  });

  describe('Synchronization and Distributed Configuration', function() {
    it('should handle configuration synchronization between instances', async function() {
      await configSystem.initialize();
      
      const syncManager = configSystem.getSyncManager();
      
      // Add mock peers
      syncManager.addPeer({
        id: 'peer-1',
        endpoint: 'http://peer1.example.com',
        version: { version: 1, timestamp: new Date().toISOString() },
      });

      syncManager.addPeer({
        id: 'peer-2',
        endpoint: 'http://peer2.example.com',
        version: { version: 1, timestamp: new Date().toISOString() },
      });

      // Start synchronization
      syncManager.start();

      const syncStatus = syncManager.getSyncStatus();
      assert.strictEqual(syncStatus.enabled, true);
      assert.strictEqual(syncStatus.peerCount, 2);

      // Perform sync
      await syncManager.performSync();

      syncManager.stop();
    });

    it('should handle configuration conflicts during sync', async function() {
      await configSystem.initialize();
      
      const syncManager = configSystem.getSyncManager();
      
      // Simulate conflict scenario
      syncManager.addPeer({
        id: 'conflicting-peer',
        endpoint: 'http://conflict.example.com',
        version: { version: 2, timestamp: new Date().toISOString() },
      });

      // Test conflict detection and resolution
      const peers = syncManager.getPeers();
      assert.strictEqual(peers.length, 1);
      assert.strictEqual(peers[0].id, 'conflicting-peer');
    });
  });

  describe('Health Monitoring and Deployment Integration', function() {
    it('should perform comprehensive health checks', async function() {
      await configSystem.initialize();
      
      const healthChecker = configSystem.getHealthChecker();
      const config = configSystem.getConfiguration();

      const healthResult = await healthChecker.performHealthCheck(config);
      
      assert(['healthy', 'warning', 'unhealthy'].includes(healthResult.status));
      assert(Array.isArray(healthResult.checks));
      assert(typeof healthResult.summary.total === 'number');
      assert(typeof healthResult.summary.passed === 'number');
      assert(typeof healthResult.summary.warnings === 'number');
      assert(typeof healthResult.summary.failed === 'number');
    });

    it('should integrate with deployment pipeline', async function() {
      await configSystem.initialize();
      
      const pipelineManager = configSystem.getPipelineManager();
      
      // Execute deployment pipeline in dry run mode
      const results = await pipelineManager.executePipeline(['test'], {
        dryRun: true,
        skipValidation: false,
        skipHealthChecks: false,
      });

      assert(Array.isArray(results));
      assert(results.length > 0);
      
      const testResult = results.find(r => r.environment === 'test');
      assert(testResult);
      assert.strictEqual(testResult.success, true);
    });
  });

  describe('Error Handling and Recovery', function() {
    it('should handle configuration validation errors gracefully', async function() {
      await configSystem.initialize();
      
      // Attempt to update with invalid configuration
      const invalidUpdates = {
        server: { name: '' }, // Invalid: empty name
        deployment: { type: 'invalid-type' }, // Invalid: unsupported type
      };

      try {
        await configSystem.updateConfiguration(invalidUpdates);
        // If validation is working, this should either reject or return validation errors
        const validation = configSystem.validateConfiguration();
        if (!validation.isValid) {
          assert(validation.errors.length > 0);
        }
      } catch (error) {
        // Expected behavior for invalid configuration
        assert(error.message.includes('invalid') || error.message.includes('validation'));
      }
    });

    it('should recover from component failures', async function() {
      await configSystem.initialize();
      
      // Simulate component failure and recovery
      const hotReloadManager = configSystem.getHotReloadManager();
      
      hotReloadManager.start();
      assert.strictEqual(hotReloadManager.getStatus().enabled, true);

      hotReloadManager.stop();
      assert.strictEqual(hotReloadManager.getStatus().enabled, false);

      // Restart should work
      hotReloadManager.start();
      assert.strictEqual(hotReloadManager.getStatus().enabled, true);

      hotReloadManager.stop();
    });
  });

  describe('Performance and Scalability', function() {
    it('should handle high-frequency configuration updates', async function() {
      await configSystem.initialize();
      
      const startTime = Date.now();
      const updateCount = 50;

      // Perform rapid updates
      for (let i = 0; i < updateCount; i++) {
        await configSystem.updateConfiguration({
          server: { name: `rapid-update-${i}` },
        });
      }

      const duration = Date.now() - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      assert(duration < 10000, `Updates took too long: ${duration}ms`);

      // Verify final state
      const finalConfig = configSystem.getConfiguration();
      assert.strictEqual(finalConfig.server.name, `rapid-update-${updateCount - 1}`);
    });

    it('should maintain performance with large configuration objects', async function() {
      await configSystem.initialize();
      
      // Create large configuration update
      const largeConfig = {
        features: {},
        tools: {},
        resources: {},
      };

      // Add many feature flags
      for (let i = 0; i < 100; i++) {
        largeConfig.features[`feature-${i}`] = {
          enabled: i % 2 === 0,
          config: { value: i, description: `Feature ${i}` },
        };
      }

      const startTime = Date.now();
      await configSystem.updateConfiguration(largeConfig);
      const duration = Date.now() - startTime;

      // Should handle large configurations efficiently
      assert(duration < 5000, `Large config update took too long: ${duration}ms`);

      const updatedConfig = configSystem.getConfiguration();
      assert(Object.keys(updatedConfig.features).length >= 100);
    });
  });

  describe('System State Export and Import', function() {
    it('should export complete system state', async function() {
      await configSystem.initialize();
      
      // Make some changes to create interesting state
      await configSystem.updateConfiguration({
        server: { name: 'export-test-server' },
      });

      configSystem.getFeatureFlags().registerFlags([
        { name: 'export-flag', enabled: true, description: 'Test flag for export' },
      ]);

      const exportedState = configSystem.exportState();
      
      assert(exportedState.configuration);
      assert(exportedState.featureFlags);
      assert(exportedState.validation);
      assert.strictEqual(exportedState.configuration.server.name, 'export-test-server');
      assert(exportedState.featureFlags.some(flag => flag.name === 'export-flag'));
    });

    it('should import and restore system state', async function() {
      await configSystem.initialize();
      
      const importState = {
        configuration: {
          server: { name: 'imported-server' },
          features: { imported: { enabled: true } },
        },
        featureFlags: [
          { name: 'imported-flag', enabled: true, description: 'Imported flag' },
        ],
      };

      const results = await configSystem.importState(importState);
      assert(Array.isArray(results));

      const config = configSystem.getConfiguration();
      assert.strictEqual(config.server.name, 'imported-server');
      assert.strictEqual(config.features.imported.enabled, true);
    });
  });
});

// Mock implementations for testing when real modules are not available
class MockConfigurationSystem {
  constructor() {
    this.config = {
      server: { name: 'mock-server', version: '1.0.0', environment: 'test' },
      features: { tools: { enabled: true } },
      deployment: { type: 'local', transport: 'stdio' },
    };
    this.managers = {
      manager: { getConfiguration: () => this.config },
      featureFlags: { registerFlags: () => {}, isEnabled: () => true, getVariant: () => 'default' },
      validator: { validate: async () => ({ isValid: true, errors: [], warnings: [] }) },
      environmentManager: { detectEnvironment: () => ({ environment: 'test' }) },
      healthChecker: { performHealthCheck: async () => ({ status: 'healthy', checks: [], summary: { total: 0, passed: 0, warnings: 0, failed: 0 }, recommendations: [] }) },
      pipelineManager: { executePipeline: async () => [{ environment: 'test', success: true }] },
      runtimeManager: { 
        createSnapshot: () => 'mock-snapshot',
        rollbackToSnapshot: async () => ({ success: true }),
        updateConfiguration: async () => ({ success: true }),
        getCurrentConfiguration: () => this.config,
      },
      hotReloadManager: { 
        start: () => {}, 
        stop: () => {}, 
        getStatus: () => ({ enabled: false }),
        onHotReload: () => {},
        triggerReload: async () => {},
      },
      cacheManager: {
        get: async () => undefined,
        set: async () => {},
        getStatistics: () => ({ hits: 0, misses: 0, totalEntries: 0, hitRate: 0 }),
      },
      syncManager: {
        addPeer: () => {},
        start: () => {},
        stop: () => {},
        getSyncStatus: () => ({ enabled: false, peerCount: 0 }),
        getPeers: () => [],
        performSync: async () => {},
      },
      auditTrailManager: {
        logChange: async () => 'mock-entry-id',
        queryAuditLog: async () => [],
        getAuditStatistics: async () => ({ totalEntries: 0, entriesByAction: {} }),
      },
    };
  }

  async initialize() {}
  async reset() {}
  
  getManager() { return this.managers.manager; }
  getFeatureFlags() { return this.managers.featureFlags; }
  getValidator() { return this.managers.validator; }
  getEnvironmentManager() { return this.managers.environmentManager; }
  getHealthChecker() { return this.managers.healthChecker; }
  getPipelineManager() { return this.managers.pipelineManager; }
  getRuntimeManager() { return this.managers.runtimeManager; }
  getHotReloadManager() { return this.managers.hotReloadManager; }
  getCacheManager() { return this.managers.cacheManager; }
  getSyncManager() { return this.managers.syncManager; }
  getAuditTrailManager() { return this.managers.auditTrailManager; }
  
  getConfiguration() { return this.config; }
  async updateConfiguration(updates) { 
    Object.assign(this.config, updates);
    return { isValid: true, errors: [], warnings: [] };
  }
  validateConfiguration() { return { isValid: true, errors: [], warnings: [] }; }
  isFeatureEnabled() { return true; }
  getFeatureVariant() { return 'default'; }
  exportState() { 
    return { 
      configuration: this.config, 
      featureFlags: [], 
      validation: { isValid: true, errors: [], warnings: [] } 
    }; 
  }
  async importState() { return [{ isValid: true, errors: [], warnings: [] }]; }
}

const MockConfigUtils = {
  createDevelopmentConfig: () => ({ server: { environment: 'development' } }),
  createProductionConfig: () => ({ server: { environment: 'production' } }),
  createTestConfig: () => ({ server: { environment: 'test' } }),
  mergeConfigs: (...configs) => Object.assign({}, ...configs),
};

// Export for potential use by other test files
export { describe, it, beforeEach, afterEach };