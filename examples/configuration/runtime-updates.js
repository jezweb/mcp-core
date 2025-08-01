/**
 * Runtime Configuration Updates Example
 * 
 * This example demonstrates runtime configuration updates, hot reloading,
 * snapshots, rollbacks, and real-time configuration management.
 */

import { ConfigurationSystem } from '../../shared/config/index.js';

async function runtimeUpdatesExample() {
  console.log('🔄 Runtime Configuration Updates Example\n');

  // Initialize configuration system
  const configSystem = new ConfigurationSystem();
  await configSystem.initialize();
  
  const runtimeManager = configSystem.getRuntimeManager();
  const hotReloadManager = configSystem.getHotReloadManager();
  const auditTrailManager = configSystem.getAuditTrailManager();

  // 1. Basic Runtime Updates
  console.log('1. Demonstrating basic runtime updates...');
  
  const initialConfig = runtimeManager.getCurrentConfiguration();
  console.log('📋 Initial server name:', initialConfig.server.name);
  
  // Update configuration at runtime
  const updateResult = await runtimeManager.updateConfiguration({
    server: {
      name: 'runtime-updated-server',
      description: 'Updated via runtime manager'
    },
    features: {
      runtimeFeature: { enabled: true }
    }
  }, {
    source: 'runtime-example',
    notifyWatchers: true
  });
  
  console.log('✅ Update successful:', updateResult.success);
  console.log('📋 Affected paths:', updateResult.affectedPaths);
  
  const updatedConfig = runtimeManager.getCurrentConfiguration();
  console.log('📋 New server name:', updatedConfig.server.name);
  console.log('📋 New description:', updatedConfig.server.description);
  console.log('');

  // 2. Configuration Snapshots
  console.log('2. Working with configuration snapshots...');
  
  // Create snapshot before making changes
  const snapshotId = runtimeManager.createSnapshot('before-experiment', 'runtime-example', {
    reason: 'Before experimental changes',
    user: 'example-user'
  });
  console.log('📸 Created snapshot:', snapshotId);
  
  // Make experimental changes
  await runtimeManager.updateConfiguration({
    server: { name: 'experimental-server' },
    features: {
      experimentalFeature: { enabled: true },
      betaFeature: { enabled: false }
    }
  });
  
  console.log('🧪 Applied experimental changes');
  console.log('📋 Experimental server name:', runtimeManager.getCurrentConfiguration().server.name);
  
  // Rollback to snapshot
  const rollbackResult = await runtimeManager.rollbackToSnapshot(snapshotId);
  console.log('⏪ Rollback successful:', rollbackResult.success);
  console.log('📋 Restored server name:', runtimeManager.getCurrentConfiguration().server.name);
  console.log('');

  // 3. Hot Reloading
  console.log('3. Demonstrating hot reloading...');
  
  let reloadCount = 0;
  const reloadCallback = (event) => {
    reloadCount++;
    console.log(`🔥 Hot reload triggered #${reloadCount}:`, event.source);
  };
  
  // Start hot reloading
  hotReloadManager.start();
  hotReloadManager.onHotReload(reloadCallback);
  
  console.log('🔥 Hot reload status:', hotReloadManager.getStatus().enabled);
  
  // Simulate configuration changes that trigger hot reload
  await runtimeManager.updateConfiguration({
    server: { name: 'hot-reload-test-1' }
  });
  await hotReloadManager.triggerReload('manual-test-1');
  
  await runtimeManager.updateConfiguration({
    server: { name: 'hot-reload-test-2' }
  });
  await hotReloadManager.triggerReload('manual-test-2');
  
  console.log('🔥 Total hot reloads triggered:', reloadCount);
  
  // Stop hot reloading
  hotReloadManager.stop();
  console.log('🔥 Hot reload stopped');
  console.log('');

  // 4. Configuration Watchers
  console.log('4. Setting up configuration watchers...');
  
  let watcherCallCount = 0;
  const configWatcher = (change) => {
    watcherCallCount++;
    console.log(`👁️ Configuration change detected #${watcherCallCount}:`);
    console.log(`   Type: ${change.type}`);
    console.log(`   Source: ${change.source}`);
    console.log(`   Affected paths: ${change.affectedPaths?.join(', ') || 'unknown'}`);
  };
  
  runtimeManager.watchConfiguration(configWatcher);
  
  // Make changes that trigger watchers
  await runtimeManager.updateConfiguration({
    server: { name: 'watcher-test-1' }
  }, { source: 'watcher-example' });
  
  await runtimeManager.updateConfiguration({
    features: { watcherFeature: { enabled: true } }
  }, { source: 'watcher-example' });
  
  console.log('👁️ Total watcher calls:', watcherCallCount);
  
  // Remove watcher
  runtimeManager.unwatchConfiguration(configWatcher);
  console.log('👁️ Watcher removed');
  console.log('');

  // 5. Batch Updates
  console.log('5. Demonstrating batch updates...');
  
  const batchUpdates = [
    {
      server: { name: 'batch-server-1' },
      features: { batchFeature1: { enabled: true } }
    },
    {
      server: { name: 'batch-server-2' },
      features: { batchFeature2: { enabled: true } }
    },
    {
      server: { name: 'batch-server-final' },
      features: { 
        batchFeature1: { enabled: false },
        batchFeature2: { enabled: false },
        finalFeature: { enabled: true }
      }
    }
  ];
  
  console.log('📦 Applying batch updates...');
  for (let i = 0; i < batchUpdates.length; i++) {
    await runtimeManager.updateConfiguration(batchUpdates[i], {
      source: `batch-update-${i + 1}`,
      batchId: 'example-batch'
    });
    console.log(`   ✅ Batch update ${i + 1} applied`);
  }
  
  const finalConfig = runtimeManager.getCurrentConfiguration();
  console.log('📋 Final server name:', finalConfig.server.name);
  console.log('📋 Final feature enabled:', finalConfig.features.finalFeature?.enabled);
  console.log('');

  // 6. Runtime Statistics
  console.log('6. Runtime configuration statistics...');
  
  const stats = runtimeManager.getRuntimeStatistics();
  console.log('📊 Total updates:', stats.totalUpdates);
  console.log('📊 Snapshot count:', stats.snapshotCount);
  console.log('📊 Watcher count:', stats.watcherCount);
  console.log('📊 Is locked:', stats.isLocked);
  console.log('📊 Last update time:', stats.lastUpdateTime);
  console.log('📊 Average update time:', stats.averageUpdateTime?.toFixed(2), 'ms');
  console.log('');

  // 7. Audit Trail Integration
  console.log('7. Reviewing audit trail...');
  
  const auditEntries = await auditTrailManager.queryAuditLog({
    limit: 5,
    source: 'runtime-example'
  });
  
  console.log(`📋 Found ${auditEntries.length} audit entries from this example:`);
  auditEntries.forEach((entry, index) => {
    console.log(`   ${index + 1}. ${entry.action} at ${new Date(entry.timestamp).toLocaleTimeString()}`);
    console.log(`      Source: ${entry.source}`);
    console.log(`      Reason: ${entry.reason || 'Not specified'}`);
  });
  console.log('');

  // 8. Configuration Validation During Updates
  console.log('8. Testing configuration validation during updates...');
  
  try {
    // Attempt invalid update
    await runtimeManager.updateConfiguration({
      server: { name: '' }, // Invalid: empty name
      invalidField: 'should-not-exist'
    }, {
      validate: true,
      rollbackOnFailure: true
    });
  } catch (error) {
    console.log('❌ Invalid update rejected:', error.message);
  }
  
  // Valid update
  const validResult = await runtimeManager.updateConfiguration({
    server: { name: 'validation-test-server' }
  }, {
    validate: true,
    rollbackOnFailure: true
  });
  
  console.log('✅ Valid update accepted:', validResult.success);
  console.log('');

  // 9. Performance Testing
  console.log('9. Runtime update performance testing...');
  
  const performanceUpdates = 50;
  const startTime = Date.now();
  
  for (let i = 0; i < performanceUpdates; i++) {
    await runtimeManager.updateConfiguration({
      server: { name: `perf-test-${i}` },
      timestamp: Date.now()
    }, {
      source: 'performance-test',
      skipValidation: true // Skip validation for performance
    });
  }
  
  const duration = Date.now() - startTime;
  const avgUpdateTime = duration / performanceUpdates;
  
  console.log(`⚡ Completed ${performanceUpdates} updates in ${duration}ms`);
  console.log(`⚡ Average update time: ${avgUpdateTime.toFixed(2)}ms`);
  console.log('');

  // 10. Cleanup
  console.log('10. Cleaning up...');
  
  // Clear old snapshots
  const clearedSnapshots = runtimeManager.clearOldSnapshots(Date.now() - 60000); // Clear snapshots older than 1 minute
  console.log('🧹 Cleared old snapshots:', clearedSnapshots);
  
  // Final statistics
  const finalStats = runtimeManager.getRuntimeStatistics();
  console.log('📊 Final total updates:', finalStats.totalUpdates);
  console.log('📊 Final snapshot count:', finalStats.snapshotCount);
  console.log('');

  console.log('🎉 Runtime updates example completed successfully!');
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  runtimeUpdatesExample().catch(console.error);
}

export { runtimeUpdatesExample };