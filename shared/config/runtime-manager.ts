/**
 * Runtime Configuration Manager - Phase 2.4: Runtime Configuration
 * 
 * Dynamic configuration management system that handles runtime updates,
 * thread-safe operations, rollback capabilities, and integration with
 * the existing configuration system.
 */

import {
  MCPServerConfig,
  ConfigurationChangeEvent,
  ConfigChangeCallback,
  ValidationResult,
  EvaluationContext,
} from '../types/config-types.js';
import { ConfigurationValidator } from './validator.js';
import { deepMerge } from './defaults.js';

/**
 * Runtime configuration update options
 */
export interface RuntimeUpdateOptions {
  validate?: boolean;
  rollbackOnFailure?: boolean;
  notifyWatchers?: boolean;
  source?: string;
  metadata?: Record<string, any>;
}

/**
 * Configuration snapshot for rollback
 */
export interface ConfigurationSnapshot {
  id: string;
  timestamp: string;
  config: MCPServerConfig;
  source: string;
  metadata?: Record<string, any>;
}

/**
 * Runtime configuration change result
 */
export interface RuntimeChangeResult {
  success: boolean;
  snapshotId?: string;
  validation?: ValidationResult;
  error?: Error;
  rollbackPerformed?: boolean;
  affectedPaths: string[];
  timestamp: string;
}

/**
 * Configuration lock for thread safety
 */
class ConfigurationLock {
  private locked = false;
  private queue: Array<() => void> = [];

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release(): void {
    this.locked = false;
    const next = this.queue.shift();
    if (next) {
      this.locked = true;
      next();
    }
  }

  isLocked(): boolean {
    return this.locked;
  }
}

/**
 * Runtime Configuration Manager
 */
export class RuntimeConfigurationManager {
  private currentConfig: MCPServerConfig;
  private validator: ConfigurationValidator;
  private snapshots: Map<string, ConfigurationSnapshot> = new Map();
  private watchers: Set<ConfigChangeCallback> = new Set();
  private lock: ConfigurationLock = new ConfigurationLock();
  private maxSnapshots: number = 10;
  private updateCounter = 0;

  constructor(initialConfig: MCPServerConfig) {
    this.currentConfig = { ...initialConfig };
    this.validator = new ConfigurationValidator();
    
    // Create initial snapshot
    this.createSnapshot('initial', 'system');
  }

  /**
   * Get current configuration (thread-safe read)
   */
  getCurrentConfiguration(): MCPServerConfig {
    return { ...this.currentConfig };
  }

  /**
   * Update configuration at runtime
   */
  async updateConfiguration(
    updates: Partial<MCPServerConfig>,
    options: RuntimeUpdateOptions = {}
  ): Promise<RuntimeChangeResult> {
    const {
      validate = true,
      rollbackOnFailure = true,
      notifyWatchers = true,
      source = 'runtime',
      metadata = {},
    } = options;

    await this.lock.acquire();
    
    try {
      const startTime = new Date().toISOString();
      const oldConfig = { ...this.currentConfig };
      const affectedPaths = this.getAffectedPaths(updates);
      
      // Create pre-update snapshot for rollback
      const snapshotId = rollbackOnFailure ? 
        this.createSnapshot(`pre-update-${this.updateCounter++}`, source, metadata) : 
        undefined;

      // Merge updates with current configuration
      const newConfig = deepMerge(this.currentConfig, updates) as MCPServerConfig;

      // Validate new configuration if requested
      let validation: ValidationResult | undefined;
      if (validate) {
        validation = await this.validator.validate(newConfig);
        
        if (!validation.isValid && rollbackOnFailure) {
          return {
            success: false,
            snapshotId,
            validation,
            error: new Error(`Configuration validation failed: ${validation.errors.map(e => e.message).join(', ')}`),
            rollbackPerformed: false,
            affectedPaths,
            timestamp: startTime,
          };
        }
      }

      // Apply configuration update
      this.currentConfig = newConfig;

      // Notify watchers if requested
      if (notifyWatchers) {
        await this.notifyWatchers({
          type: 'update',
          oldValue: oldConfig,
          newValue: this.currentConfig,
          timestamp: startTime,
          source,
          metadata: {
            ...metadata,
            affectedPaths,
            snapshotId,
          },
        });
      }

      return {
        success: true,
        snapshotId,
        validation,
        affectedPaths,
        timestamp: startTime,
      };

    } catch (error) {
      // Perform rollback if enabled and we have a snapshot
      let rollbackPerformed = false;
      if (rollbackOnFailure && this.snapshots.size > 0) {
        try {
          const lastSnapshot = Array.from(this.snapshots.values()).pop();
          if (lastSnapshot) {
            this.currentConfig = { ...lastSnapshot.config };
            rollbackPerformed = true;
          }
        } catch (rollbackError) {
          console.error('Failed to perform rollback:', rollbackError);
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        rollbackPerformed,
        affectedPaths: this.getAffectedPaths(updates),
        timestamp: new Date().toISOString(),
      };
    } finally {
      this.lock.release();
    }
  }

  /**
   * Update a specific configuration path
   */
  async updateConfigurationPath(
    path: string,
    value: any,
    options: RuntimeUpdateOptions = {}
  ): Promise<RuntimeChangeResult> {
    const updates = this.createNestedUpdate(path, value);
    return this.updateConfiguration(updates, options);
  }

  /**
   * Rollback to a specific snapshot
   */
  async rollbackToSnapshot(snapshotId: string): Promise<RuntimeChangeResult> {
    await this.lock.acquire();
    
    try {
      const snapshot = this.snapshots.get(snapshotId);
      if (!snapshot) {
        throw new Error(`Snapshot ${snapshotId} not found`);
      }

      const oldConfig = { ...this.currentConfig };
      this.currentConfig = { ...snapshot.config };

      // Notify watchers
      await this.notifyWatchers({
        type: 'update',
        oldValue: oldConfig,
        newValue: this.currentConfig,
        timestamp: new Date().toISOString(),
        source: 'rollback',
        metadata: {
          snapshotId,
          rollback: true,
        },
      });

      return {
        success: true,
        snapshotId,
        affectedPaths: ['*'], // All paths potentially affected by rollback
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        affectedPaths: [],
        timestamp: new Date().toISOString(),
      };
    } finally {
      this.lock.release();
    }
  }

  /**
   * Create a configuration snapshot
   */
  createSnapshot(
    id: string,
    source: string,
    metadata: Record<string, any> = {}
  ): string {
    const snapshot: ConfigurationSnapshot = {
      id,
      timestamp: new Date().toISOString(),
      config: { ...this.currentConfig },
      source,
      metadata,
    };

    this.snapshots.set(id, snapshot);

    // Maintain maximum number of snapshots
    if (this.snapshots.size > this.maxSnapshots) {
      const oldestId = Array.from(this.snapshots.keys())[0];
      this.snapshots.delete(oldestId);
    }

    return id;
  }

  /**
   * Get all available snapshots
   */
  getSnapshots(): ConfigurationSnapshot[] {
    return Array.from(this.snapshots.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get a specific snapshot
   */
  getSnapshot(id: string): ConfigurationSnapshot | undefined {
    return this.snapshots.get(id);
  }

  /**
   * Delete a snapshot
   */
  deleteSnapshot(id: string): boolean {
    return this.snapshots.delete(id);
  }

  /**
   * Watch for configuration changes
   */
  watchConfiguration(callback: ConfigChangeCallback): void {
    this.watchers.add(callback);
  }

  /**
   * Stop watching configuration changes
   */
  unwatchConfiguration(callback: ConfigChangeCallback): void {
    this.watchers.delete(callback);
  }

  /**
   * Clear all watchers
   */
  clearWatchers(): void {
    this.watchers.clear();
  }

  /**
   * Get configuration value by path
   */
  getConfigurationValue<T = any>(path: string): T | undefined {
    return path.split('.').reduce((obj: any, key: string) => obj?.[key], this.currentConfig);
  }

  /**
   * Check if configuration path exists
   */
  hasConfigurationPath(path: string): boolean {
    return this.getConfigurationValue(path) !== undefined;
  }

  /**
   * Validate current configuration
   */
  async validateCurrentConfiguration(): Promise<ValidationResult> {
    return this.validator.validate(this.currentConfig);
  }

  /**
   * Get runtime statistics
   */
  getRuntimeStatistics(): {
    totalUpdates: number;
    snapshotCount: number;
    watcherCount: number;
    isLocked: boolean;
    lastUpdateTime?: string;
  } {
    const snapshots = this.getSnapshots();
    return {
      totalUpdates: this.updateCounter,
      snapshotCount: this.snapshots.size,
      watcherCount: this.watchers.size,
      isLocked: this.lock.isLocked(),
      lastUpdateTime: snapshots[0]?.timestamp,
    };
  }

  /**
   * Export runtime state
   */
  exportState(): {
    config: MCPServerConfig;
    snapshots: ConfigurationSnapshot[];
    statistics: {
      totalUpdates: number;
      snapshotCount: number;
      watcherCount: number;
      isLocked: boolean;
      lastUpdateTime?: string;
    };
  } {
    return {
      config: this.getCurrentConfiguration(),
      snapshots: this.getSnapshots(),
      statistics: this.getRuntimeStatistics(),
    };
  }

  /**
   * Import runtime state
   */
  async importState(state: {
    config?: MCPServerConfig;
    snapshots?: ConfigurationSnapshot[];
  }): Promise<RuntimeChangeResult> {
    await this.lock.acquire();
    
    try {
      const oldConfig = { ...this.currentConfig };
      
      // Import configuration if provided
      if (state.config) {
        this.currentConfig = { ...state.config };
      }

      // Import snapshots if provided
      if (state.snapshots) {
        this.snapshots.clear();
        for (const snapshot of state.snapshots) {
          this.snapshots.set(snapshot.id, snapshot);
        }
      }

      // Notify watchers
      await this.notifyWatchers({
        type: 'update',
        oldValue: oldConfig,
        newValue: this.currentConfig,
        timestamp: new Date().toISOString(),
        source: 'import',
        metadata: {
          importedSnapshots: state.snapshots?.length || 0,
        },
      });

      return {
        success: true,
        affectedPaths: ['*'],
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        affectedPaths: [],
        timestamp: new Date().toISOString(),
      };
    } finally {
      this.lock.release();
    }
  }

  /**
   * Reset to initial configuration
   */
  async reset(): Promise<RuntimeChangeResult> {
    const initialSnapshot = Array.from(this.snapshots.values())
      .find(s => s.source === 'system');
    
    if (initialSnapshot) {
      return this.rollbackToSnapshot(initialSnapshot.id);
    }

    return {
      success: false,
      error: new Error('No initial snapshot found'),
      affectedPaths: [],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Notify all watchers of configuration changes
   */
  private async notifyWatchers(event: ConfigurationChangeEvent): Promise<void> {
    const promises = Array.from(this.watchers).map(async (callback) => {
      try {
        await callback(event);
      } catch (error) {
        console.error('Configuration watcher callback error:', error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Get paths affected by configuration updates
   */
  private getAffectedPaths(updates: Partial<MCPServerConfig>): string[] {
    const paths: string[] = [];
    
    const traverse = (obj: any, prefix = ''): void => {
      for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        paths.push(path);
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          traverse(value, path);
        }
      }
    };

    traverse(updates);
    return paths;
  }

  /**
   * Create nested update object from path and value
   */
  private createNestedUpdate(path: string, value: any): Partial<MCPServerConfig> {
    const keys = path.split('.');
    const result: any = {};
    
    let current = result;
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    return result;
  }
}

/**
 * Global runtime configuration manager instance
 */
let globalRuntimeManager: RuntimeConfigurationManager | null = null;

/**
 * Get or create the global runtime configuration manager
 */
export function getGlobalRuntimeManager(initialConfig?: MCPServerConfig): RuntimeConfigurationManager {
  if (!globalRuntimeManager) {
    if (!initialConfig) {
      throw new Error('Initial configuration required for first-time initialization');
    }
    globalRuntimeManager = new RuntimeConfigurationManager(initialConfig);
  }
  return globalRuntimeManager;
}

/**
 * Set the global runtime configuration manager
 */
export function setGlobalRuntimeManager(manager: RuntimeConfigurationManager): void {
  globalRuntimeManager = manager;
}

/**
 * Convenience function to update configuration at runtime
 */
export async function updateRuntimeConfiguration(
  updates: Partial<MCPServerConfig>,
  options?: RuntimeUpdateOptions
): Promise<RuntimeChangeResult> {
  if (!globalRuntimeManager) {
    throw new Error('Runtime configuration manager not initialized');
  }
  return globalRuntimeManager.updateConfiguration(updates, options);
}

/**
 * Convenience function to get current runtime configuration
 */
export function getRuntimeConfiguration(): MCPServerConfig {
  if (!globalRuntimeManager) {
    throw new Error('Runtime configuration manager not initialized');
  }
  return globalRuntimeManager.getCurrentConfiguration();
}

/**
 * Convenience function to rollback configuration
 */
export async function rollbackRuntimeConfiguration(snapshotId: string): Promise<RuntimeChangeResult> {
  if (!globalRuntimeManager) {
    throw new Error('Runtime configuration manager not initialized');
  }
  return globalRuntimeManager.rollbackToSnapshot(snapshotId);
}