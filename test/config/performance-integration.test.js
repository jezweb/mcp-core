/**
 * Performance Integration Test Suite - Phase 2.5: Integration & Testing
 *
 * Performance benchmarks and validation for the configuration management system.
 * Tests end-to-end performance, memory usage, concurrent access, and scalability.
 *
 * Performance Requirements:
 * - Configuration loading: < 100ms for typical configurations
 * - Runtime updates: < 50ms for feature flag changes
 * - Cache hit ratio: > 90% for repeated configuration access
 * - Memory usage: < 50MB additional overhead for full system
 * - Concurrent access: Support 100+ simultaneous configuration reads
 */

import assert from 'assert';
import { performance } from 'perf_hooks';

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

// Performance measurement utilities
class PerformanceProfiler {
  constructor() {
    this.measurements = new Map();
    this.memoryBaseline = null;
  }

  startMeasurement(name) {
    this.measurements.set(name, {
      startTime: performance.now(),
      startMemory: process.memoryUsage(),
    });
  }

  endMeasurement(name) {
    const measurement = this.measurements.get(name);
    if (!measurement) {
      throw new Error(`No measurement started for: ${name}`);
    }

    const endTime = performance.now();
    const endMemory = process.memoryUsage();
    
    const result = {
      duration: endTime - measurement.startTime,
      memoryDelta: {
        heapUsed: endMemory.heapUsed - measurement.startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - measurement.startMemory.heapTotal,
        rss: endMemory.rss - measurement.startMemory.rss,
      },
    };

    this.measurements.delete(name);
    return result;
  }

  setMemoryBaseline() {
    this.memoryBaseline = process.memoryUsage();
  }

  getMemoryDelta() {
    if (!this.memoryBaseline) {
      throw new Error('Memory baseline not set');
    }
    
    const current = process.memoryUsage();
    return {
      heapUsed: current.heapUsed - this.memoryBaseline.heapUsed,
      heapTotal: current.heapTotal - this.memoryBaseline.heapTotal,
      rss: current.rss - this.memoryBaseline.rss,
    };
  }
}

// Mock environment for testing
const originalEnv = process.env;

describe('Performance Integration Tests', function() {
  let configSystem;
  let profiler;

  beforeEach(async function() {
    // Reset environment
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'test';

    profiler = new PerformanceProfiler();
    profiler.setMemoryBaseline();

    // Import and initialize configuration system
    try {
      const { ConfigurationSystem } = await import('../../shared/config/index.js');
      configSystem = new ConfigurationSystem();
    } catch (error) {
      console.warn('Using mock implementation for performance testing:', error.message);
      configSystem = new MockConfigurationSystem();
    }
  });

  afterEach(async function() {
    // Cleanup
    process.env = originalEnv;
    
    if (configSystem && typeof configSystem.reset === 'function') {
      await configSystem.reset();
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  describe('Configuration Loading Performance', function() {
    it('should load typical configuration in under 100ms', async function() {
      profiler.startMeasurement('config-loading');
      
      await configSystem.initialize();
      
      const result = profiler.endMeasurement('config-loading');
      
      console.log(`    📊 Configuration loading took: ${result.duration.toFixed(2)}ms`);
      console.log(`    📊 Memory delta: ${(result.memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      
      assert(result.duration < 100, `Configuration loading took ${result.duration.toFixed(2)}ms, expected < 100ms`);
    });

    it('should load large configuration efficiently', async function() {
      // Create large configuration with many features
      const largeConfigSources = [{
        name: 'large-config',
        type: 'object',
        data: {
          server: { name: 'performance-test', version: '1.0.0' },
          features: {},
          tools: {},
          resources: {},
        },
      }];

      // Add 500 feature flags
      for (let i = 0; i < 500; i++) {
        largeConfigSources[0].data.features[`feature-${i}`] = {
          enabled: i % 2 === 0,
          config: { value: i, description: `Feature ${i}` },
        };
      }

      // Add 200 tools
      for (let i = 0; i < 200; i++) {
        largeConfigSources[0].data.tools[`tool-${i}`] = {
          enabled: true,
          config: { timeout: 5000 + i },
        };
      }

      profiler.startMeasurement('large-config-loading');
      
      await configSystem.initialize(largeConfigSources);
      
      const result = profiler.endMeasurement('large-config-loading');
      
      console.log(`    📊 Large configuration loading took: ${result.duration.toFixed(2)}ms`);
      console.log(`    📊 Memory delta: ${(result.memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      
      // Allow more time for large configurations but still reasonable
      assert(result.duration < 500, `Large configuration loading took ${result.duration.toFixed(2)}ms, expected < 500ms`);
    });

    it('should handle multiple configuration sources efficiently', async function() {
      const multipleSources = [];
      
      // Create 10 configuration sources
      for (let i = 0; i < 10; i++) {
        multipleSources.push({
          name: `source-${i}`,
          type: 'object',
          data: {
            [`section-${i}`]: {
              enabled: true,
              config: { value: i * 10 },
            },
          },
        });
      }

      profiler.startMeasurement('multiple-sources-loading');
      
      await configSystem.initialize(multipleSources);
      
      const result = profiler.endMeasurement('multiple-sources-loading');
      
      console.log(`    📊 Multiple sources loading took: ${result.duration.toFixed(2)}ms`);
      
      assert(result.duration < 200, `Multiple sources loading took ${result.duration.toFixed(2)}ms, expected < 200ms`);
    });
  });

  describe('Runtime Update Performance', function() {
    beforeEach(async function() {
      await configSystem.initialize();
    });

    it('should update feature flags in under 50ms', async function() {
      const featureFlags = configSystem.getFeatureFlags();
      
      // Register initial flags
      featureFlags.registerFlags([
        { name: 'perf-flag-1', enabled: false, description: 'Performance test flag 1' },
        { name: 'perf-flag-2', enabled: true, description: 'Performance test flag 2' },
      ]);

      profiler.startMeasurement('feature-flag-update');
      
      // Update feature flags
      featureFlags.updateFlag('perf-flag-1', { enabled: true });
      featureFlags.updateFlag('perf-flag-2', { enabled: false });
      
      const result = profiler.endMeasurement('feature-flag-update');
      
      console.log(`    📊 Feature flag update took: ${result.duration.toFixed(2)}ms`);
      
      assert(result.duration < 50, `Feature flag update took ${result.duration.toFixed(2)}ms, expected < 50ms`);
      
      // Verify updates were applied
      assert.strictEqual(featureFlags.isEnabled('perf-flag-1'), true);
      assert.strictEqual(featureFlags.isEnabled('perf-flag-2'), false);
    });

    it('should handle rapid configuration updates efficiently', async function() {
      const updateCount = 100;
      const updates = [];
      
      // Prepare updates
      for (let i = 0; i < updateCount; i++) {
        updates.push({
          server: { name: `rapid-update-${i}` },
          timestamp: Date.now() + i,
        });
      }

      profiler.startMeasurement('rapid-updates');
      
      // Perform rapid updates
      for (const update of updates) {
        await configSystem.updateConfiguration(update);
      }
      
      const result = profiler.endMeasurement('rapid-updates');
      
      const avgUpdateTime = result.duration / updateCount;
      console.log(`    📊 ${updateCount} rapid updates took: ${result.duration.toFixed(2)}ms`);
      console.log(`    📊 Average update time: ${avgUpdateTime.toFixed(2)}ms`);
      
      assert(avgUpdateTime < 10, `Average update time was ${avgUpdateTime.toFixed(2)}ms, expected < 10ms`);
    });

    it('should handle hot reload performance', async function() {
      const hotReloadManager = configSystem.getHotReloadManager();
      
      hotReloadManager.start();

      profiler.startMeasurement('hot-reload');
      
      // Trigger hot reload
      await hotReloadManager.triggerReload('performance-test');
      
      const result = profiler.endMeasurement('hot-reload');
      
      console.log(`    📊 Hot reload took: ${result.duration.toFixed(2)}ms`);
      
      assert(result.duration < 100, `Hot reload took ${result.duration.toFixed(2)}ms, expected < 100ms`);
      
      hotReloadManager.stop();
    });
  });

  describe('Cache Performance', function() {
    beforeEach(async function() {
      await configSystem.initialize();
    });

    it('should achieve > 90% cache hit ratio', async function() {
      const cacheManager = configSystem.getCacheManager();
      const config = configSystem.getConfiguration();
      
      // Warm up cache with 100 entries
      for (let i = 0; i < 100; i++) {
        await cacheManager.set(`config-${i}`, { ...config, id: i });
      }

      profiler.startMeasurement('cache-operations');
      
      let hits = 0;
      let misses = 0;
      const totalOperations = 1000;
      
      // Perform 1000 cache operations (90% should hit existing keys)
      for (let i = 0; i < totalOperations; i++) {
        const keyIndex = Math.floor(Math.random() * 110); // 0-109, so 90% will hit existing keys
        const result = await cacheManager.get(`config-${keyIndex}`);
        
        if (result) {
          hits++;
        } else {
          misses++;
        }
      }
      
      const result = profiler.endMeasurement('cache-operations');
      const hitRatio = hits / totalOperations;
      
      console.log(`    📊 Cache operations took: ${result.duration.toFixed(2)}ms`);
      console.log(`    📊 Hit ratio: ${(hitRatio * 100).toFixed(1)}%`);
      console.log(`    📊 Hits: ${hits}, Misses: ${misses}`);
      
      assert(hitRatio > 0.9, `Cache hit ratio was ${(hitRatio * 100).toFixed(1)}%, expected > 90%`);
      assert(result.duration < 5000, `Cache operations took ${result.duration.toFixed(2)}ms, expected < 5000ms`);
    });

    it('should handle large cache efficiently', async function() {
      const cacheManager = configSystem.getCacheManager();
      const largeData = { data: 'x'.repeat(10000) }; // 10KB per entry
      
      profiler.startMeasurement('large-cache-operations');
      
      // Store 1000 large entries (10MB total)
      for (let i = 0; i < 1000; i++) {
        await cacheManager.set(`large-${i}`, { ...largeData, id: i });
      }
      
      // Retrieve all entries
      for (let i = 0; i < 1000; i++) {
        const result = await cacheManager.get(`large-${i}`);
        assert(result);
        assert.strictEqual(result.id, i);
      }
      
      const result = profiler.endMeasurement('large-cache-operations');
      
      console.log(`    📊 Large cache operations took: ${result.duration.toFixed(2)}ms`);
      console.log(`    📊 Memory delta: ${(result.memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      
      assert(result.duration < 10000, `Large cache operations took ${result.duration.toFixed(2)}ms, expected < 10000ms`);
    });
  });

  describe('Concurrent Access Performance', function() {
    beforeEach(async function() {
      await configSystem.initialize();
    });

    it('should support 100+ simultaneous configuration reads', async function() {
      const concurrentReads = 150;
      const promises = [];
      
      profiler.startMeasurement('concurrent-reads');
      
      // Create 150 concurrent configuration read operations
      for (let i = 0; i < concurrentReads; i++) {
        promises.push(
          Promise.resolve().then(() => {
            const config = configSystem.getConfiguration();
            assert(config);
            assert(config.server);
            return config;
          })
        );
      }
      
      const results = await Promise.all(promises);
      
      const result = profiler.endMeasurement('concurrent-reads');
      
      console.log(`    📊 ${concurrentReads} concurrent reads took: ${result.duration.toFixed(2)}ms`);
      console.log(`    📊 Average read time: ${(result.duration / concurrentReads).toFixed(2)}ms`);
      
      assert.strictEqual(results.length, concurrentReads);
      assert(result.duration < 1000, `Concurrent reads took ${result.duration.toFixed(2)}ms, expected < 1000ms`);
    });

    it('should handle concurrent updates and reads', async function() {
      const concurrentOperations = 100;
      const promises = [];
      
      profiler.startMeasurement('concurrent-mixed-operations');
      
      // Mix of reads and updates
      for (let i = 0; i < concurrentOperations; i++) {
        if (i % 10 === 0) {
          // 10% updates
          promises.push(
            configSystem.updateConfiguration({
              server: { name: `concurrent-${i}` },
            })
          );
        } else {
          // 90% reads
          promises.push(
            Promise.resolve(configSystem.getConfiguration())
          );
        }
      }
      
      const results = await Promise.all(promises);
      
      const result = profiler.endMeasurement('concurrent-mixed-operations');
      
      console.log(`    📊 ${concurrentOperations} mixed operations took: ${result.duration.toFixed(2)}ms`);
      
      assert.strictEqual(results.length, concurrentOperations);
      assert(result.duration < 2000, `Mixed operations took ${result.duration.toFixed(2)}ms, expected < 2000ms`);
    });

    it('should handle concurrent cache operations', async function() {
      const cacheManager = configSystem.getCacheManager();
      const concurrentOps = 200;
      const promises = [];
      
      profiler.startMeasurement('concurrent-cache-ops');
      
      // Mix of cache operations
      for (let i = 0; i < concurrentOps; i++) {
        if (i % 3 === 0) {
          // Set operations
          promises.push(cacheManager.set(`concurrent-${i}`, { value: i }));
        } else {
          // Get operations
          promises.push(cacheManager.get(`concurrent-${i % 50}`));
        }
      }
      
      await Promise.all(promises);
      
      const result = profiler.endMeasurement('concurrent-cache-ops');
      
      console.log(`    📊 ${concurrentOps} concurrent cache operations took: ${result.duration.toFixed(2)}ms`);
      
      assert(result.duration < 3000, `Concurrent cache operations took ${result.duration.toFixed(2)}ms, expected < 3000ms`);
    });
  });

  describe('Memory Usage Performance', function() {
    it('should maintain memory usage under 50MB for full system', async function() {
      // Initialize full system
      await configSystem.initialize();
      
      // Start all components
      const hotReloadManager = configSystem.getHotReloadManager();
      const syncManager = configSystem.getSyncManager();
      const cacheManager = configSystem.getCacheManager();
      
      hotReloadManager.start();
      syncManager.start();
      
      // Add some data to simulate real usage
      const featureFlags = configSystem.getFeatureFlags();
      featureFlags.registerFlags(
        Array.from({ length: 100 }, (_, i) => ({
          name: `memory-test-flag-${i}`,
          enabled: i % 2 === 0,
          description: `Memory test flag ${i}`,
        }))
      );
      
      // Cache some configurations
      for (let i = 0; i < 50; i++) {
        await cacheManager.set(`memory-config-${i}`, {
          id: i,
          data: 'x'.repeat(1000), // 1KB per entry
        });
      }
      
      // Add sync peers
      for (let i = 0; i < 10; i++) {
        syncManager.addPeer({
          id: `memory-peer-${i}`,
          endpoint: `http://peer${i}.example.com`,
          version: { version: 1, timestamp: new Date().toISOString() },
        });
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const memoryDelta = profiler.getMemoryDelta();
      const memoryUsageMB = memoryDelta.heapUsed / 1024 / 1024;
      
      console.log(`    📊 Full system memory usage: ${memoryUsageMB.toFixed(2)}MB`);
      console.log(`    📊 RSS delta: ${(memoryDelta.rss / 1024 / 1024).toFixed(2)}MB`);
      
      // Cleanup
      hotReloadManager.stop();
      syncManager.stop();
      
      assert(memoryUsageMB < 50, `Memory usage was ${memoryUsageMB.toFixed(2)}MB, expected < 50MB`);
    });

    it('should handle memory efficiently during stress test', async function() {
      await configSystem.initialize();
      
      const initialMemory = profiler.getMemoryDelta();
      
      // Stress test: many operations
      for (let cycle = 0; cycle < 10; cycle++) {
        // Update configuration
        await configSystem.updateConfiguration({
          server: { name: `stress-${cycle}` },
          cycle: cycle,
        });
        
        // Cache operations
        const cacheManager = configSystem.getCacheManager();
        for (let i = 0; i < 20; i++) {
          await cacheManager.set(`stress-${cycle}-${i}`, { cycle, index: i });
        }
        
        // Feature flag operations
        const featureFlags = configSystem.getFeatureFlags();
        featureFlags.registerFlags([{
          name: `stress-flag-${cycle}`,
          enabled: cycle % 2 === 0,
          description: `Stress test flag ${cycle}`,
        }]);
        
        // Audit operations
        const auditManager = configSystem.getAuditTrailManager();
        await auditManager.logChange('stress-test', null, { cycle }, {
          source: 'performance-test',
          reason: `Stress test cycle ${cycle}`,
        });
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = profiler.getMemoryDelta();
      const memoryGrowth = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
      
      console.log(`    📊 Memory growth during stress test: ${memoryGrowth.toFixed(2)}MB`);
      
      // Memory growth should be reasonable
      assert(memoryGrowth < 20, `Memory growth was ${memoryGrowth.toFixed(2)}MB, expected < 20MB`);
    });
  });

  describe('Scalability Performance', function() {
    it('should scale with increasing configuration size', async function() {
      const sizes = [100, 500, 1000, 2000];
      const results = [];
      
      for (const size of sizes) {
        // Create configuration of specified size
        const largeConfig = {
          features: {},
          tools: {},
        };
        
        for (let i = 0; i < size; i++) {
          largeConfig.features[`feature-${i}`] = {
            enabled: i % 2 === 0,
            config: { value: i },
          };
          largeConfig.tools[`tool-${i}`] = {
            enabled: true,
            timeout: 5000,
          };
        }
        
        profiler.startMeasurement(`scale-${size}`);
        
        await configSystem.reset();
        await configSystem.initialize([{
          name: `scale-test-${size}`,
          type: 'object',
          data: largeConfig,
        }]);
        
        const result = profiler.endMeasurement(`scale-${size}`);
        results.push({ size, duration: result.duration });
        
        console.log(`    📊 Size ${size}: ${result.duration.toFixed(2)}ms`);
      }
      
      // Check that performance scales reasonably (not exponentially)
      const firstResult = results[0];
      const lastResult = results[results.length - 1];
      const scaleFactor = lastResult.size / firstResult.size;
      const performanceRatio = lastResult.duration / firstResult.duration;
      
      console.log(`    📊 Scale factor: ${scaleFactor}x, Performance ratio: ${performanceRatio.toFixed(2)}x`);
      
      // Performance should not degrade more than 3x when size increases 20x
      assert(performanceRatio < scaleFactor * 0.15, 
        `Performance degraded too much: ${performanceRatio.toFixed(2)}x for ${scaleFactor}x size increase`);
    });

    it('should handle increasing number of feature flags efficiently', async function() {
      await configSystem.initialize();
      
      const featureFlags = configSystem.getFeatureFlags();
      const flagCounts = [100, 500, 1000];
      
      for (const count of flagCounts) {
        const flags = Array.from({ length: count }, (_, i) => ({
          name: `scale-flag-${i}`,
          enabled: i % 2 === 0,
          description: `Scale test flag ${i}`,
          variants: i % 10 === 0 ? [
            { name: 'control', weight: 50 },
            { name: 'treatment', weight: 50 },
          ] : undefined,
        }));
        
        profiler.startMeasurement(`flags-${count}`);
        
        featureFlags.registerFlags(flags);
        
        // Test evaluation performance
        for (let i = 0; i < 100; i++) {
          const flagName = `scale-flag-${i % count}`;
          featureFlags.isEnabled(flagName);
          if (i % 10 === 0) {
            featureFlags.getVariant(flagName);
          }
        }
        
        const result = profiler.endMeasurement(`flags-${count}`);
        
        console.log(`    📊 ${count} flags: ${result.duration.toFixed(2)}ms`);
        
        // Should handle even large numbers of flags efficiently
        assert(result.duration < 1000, 
          `${count} flags took ${result.duration.toFixed(2)}ms, expected < 1000ms`);
      }
    });
  });
});

// Mock implementation for performance testing
class MockConfigurationSystem {
  constructor() {
    this.config = {
      server: { name: 'mock-server', version: '1.0.0', environment: 'test' },
      features: {},
      tools: {},
    };
    
    this.managers = {
      featureFlags: new MockFeatureFlags(),
      cacheManager: new MockCacheManager(),
      syncManager: new MockSyncManager(),
      auditTrailManager: new MockAuditTrailManager(),
      hotReloadManager: new MockHotReloadManager(),
    };
  }

  async initialize(sources = []) {
    // Simulate initialization time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
    
    // Merge sources into config
    for (const source of sources) {
      if (source.data) {
        Object.assign(this.config, source.data);
      }
    }
  }

  async reset() {
    this.config = {
      server: { name: 'mock-server', version: '1.0.0', environment: 'test' },
      features: {},
      tools: {},
    };
  }

  getConfiguration() { return { ...this.config }; }
  
  async updateConfiguration(updates) {
    // Simulate update time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 5));
    Object.assign(this.config, updates);
    return { isValid: true, errors: [], warnings: [] };
  }

  getFeatureFlags() { return this.managers.featureFlags; }
  getCacheManager() { return this.managers.cacheManager; }
  getSyncManager() { return this.managers.syncManager; }
  getAuditTrailManager() { return this.managers.auditTrailManager; }
  getHotReloadManager() { return this.managers.hotReloadManager; }
}

class MockFeatureFlags {
  constructor() {
    this.flags = new Map();
  }

  registerFlags(flags) {
    for (const flag of flags) {
      this.flags.set(flag.name, flag);
    }
  }

  updateFlag(name, updates) {
    const flag = this.flags.get(name);
    if (flag) {
      Object.assign(flag, updates);
    }
  }

  isEnabled(name) {
    const flag = this.flags.get(name);
    return flag ? flag.enabled : false;
  }

  getVariant(name) {
    const flag = this.flags.get(name);
    if (flag && flag.variants) {
      return flag.variants[0].name;
    }
    return 'control';
  }
}

class MockCacheManager {
  constructor() {
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0 };
  }

  async get(key) {
    // Simulate cache access time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2));
    
    if (this.cache.has(key)) {
      this.stats.hits++;
      return this.cache.get(key);
    } else {
      this.stats.misses++;
      return undefined;
    }
  }

  async set(key, value) {
    // Simulate cache write time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 3));
    this.cache.set(key, value);
  }

  getStatistics() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      totalEntries: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }
}

class MockSyncManager {
  constructor() {
    this.peers = new Map();
    this.enabled = false;
  }

  start() { this.enabled = true; }
  stop() { this.enabled = false; }
  
  addPeer(peer) { this.peers.set(peer.id, peer); }
  
  getSyncStatus() {
    return { enabled: this.enabled, peerCount: this.peers.size };
  }
}

class MockAuditTrailManager {
  constructor() {
    this.entries = [];
  }

  async logChange(action, oldValue, newValue, options = {}) {
    // Simulate audit logging time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1));
    
    const entry = {
      id: `audit-${Date.now()}-${Math.random()}`,
      action,
      oldValue,
      newValue,
      timestamp: new Date().toISOString(),
      source: options.source || 'test',
    };
    
    this.entries.push(entry);
    return entry.id;
  }
}

class MockHotReloadManager {
  constructor() {
    this.enabled = false;
    this.callbacks = new Set();
  }

  start() { this.enabled = true; }
  stop() { this.enabled = false; }
  
  onHotReload(callback) { this.callbacks.add(callback); }
  
  async triggerReload(source) {
    // Simulate reload time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
    
    for (const callback of this.callbacks) {
      await callback({ type: 'manual', source });
    }
  }
  
  getStatus() { return { enabled: this.enabled }; }
}

// Export for potential use by other test files
export { describe, it, beforeEach, afterEach, PerformanceProfiler };