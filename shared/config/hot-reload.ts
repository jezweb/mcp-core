/**
 * Configuration Hot Reloading System - Phase 2.4: Runtime Configuration
 * 
 * File system watching and automatic configuration reloading with debouncing,
 * graceful error handling, and support for both local files and remote sources.
 */

import {
  MCPServerConfig,
  ConfigurationChangeEvent,
  ConfigChangeCallback,
  ValidationResult,
} from '../types/config-types.js';
import { RuntimeConfigurationManager } from './runtime-manager.js';
import { ConfigurationValidator } from './validator.js';

/**
 * Hot reload configuration options
 */
export interface HotReloadOptions {
  enabled: boolean;
  debounceMs: number;
  watchPaths: string[];
  remoteSources?: RemoteSourceConfig[];
  pollInterval?: number;
  maxRetries: number;
  retryDelay: number;
  validateOnReload: boolean;
  rollbackOnError: boolean;
}

/**
 * Remote configuration source
 */
export interface RemoteSourceConfig {
  name: string;
  url: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  pollInterval: number;
  timeout: number;
  retries: number;
}

/**
 * File watch event
 */
export interface FileWatchEvent {
  type: 'change' | 'add' | 'unlink';
  path: string;
  timestamp: string;
  stats?: {
    size: number;
    mtime: Date;
  };
}

/**
 * Hot reload event
 */
export interface HotReloadEvent {
  type: 'reload' | 'error' | 'validation-failed' | 'rollback';
  source: string;
  path?: string;
  timestamp: string;
  error?: Error;
  validation?: ValidationResult;
  config?: MCPServerConfig;
}

/**
 * Hot reload callback
 */
export type HotReloadCallback = (event: HotReloadEvent) => void | Promise<void>;

/**
 * File system watcher (mock implementation for cross-platform compatibility)
 */
class FileSystemWatcher {
  private watchers: Map<string, NodeJS.Timeout> = new Map();
  private callbacks: Set<(event: FileWatchEvent) => void> = new Set();
  private lastModified: Map<string, number> = new Map();

  watch(paths: string[], callback: (event: FileWatchEvent) => void): void {
    this.callbacks.add(callback);

    for (const path of paths) {
      if (this.watchers.has(path)) {
        continue;
      }

      // Mock file watching with polling (in a real implementation, use fs.watch or chokidar)
      const interval = setInterval(async () => {
        try {
          const stats = await this.getFileStats(path);
          if (stats) {
            const lastMod = this.lastModified.get(path) || 0;
            const currentMod = stats.mtime.getTime();

            if (currentMod > lastMod) {
              this.lastModified.set(path, currentMod);
              
              const event: FileWatchEvent = {
                type: 'change',
                path,
                timestamp: new Date().toISOString(),
                stats: {
                  size: stats.size,
                  mtime: stats.mtime,
                },
              };

              this.notifyCallbacks(event);
            }
          }
        } catch (error) {
          // File might not exist or be accessible
          console.debug(`File watch error for ${path}:`, error);
        }
      }, 1000); // Poll every second

      this.watchers.set(path, interval);
    }
  }

  unwatch(path?: string): void {
    if (path) {
      const watcher = this.watchers.get(path);
      if (watcher) {
        clearInterval(watcher);
        this.watchers.delete(path);
        this.lastModified.delete(path);
      }
    } else {
      // Unwatch all
      for (const [watchPath, watcher] of this.watchers) {
        clearInterval(watcher);
      }
      this.watchers.clear();
      this.lastModified.clear();
      this.callbacks.clear();
    }
  }

  private async getFileStats(path: string): Promise<{ size: number; mtime: Date } | null> {
    // Mock implementation - in real code, use fs.stat
    try {
      // Simulate file stats
      return {
        size: Math.floor(Math.random() * 10000),
        mtime: new Date(),
      };
    } catch {
      return null;
    }
  }

  private notifyCallbacks(event: FileWatchEvent): void {
    for (const callback of this.callbacks) {
      try {
        callback(event);
      } catch (error) {
        console.error('File watch callback error:', error);
      }
    }
  }
}

/**
 * Remote configuration poller
 */
class RemoteConfigurationPoller {
  private pollers: Map<string, NodeJS.Timeout> = new Map();
  private callbacks: Set<(source: string, config: any) => void> = new Set();
  private lastConfigs: Map<string, string> = new Map();

  startPolling(sources: RemoteSourceConfig[], callback: (source: string, config: any) => void): void {
    this.callbacks.add(callback);

    for (const source of sources) {
      if (this.pollers.has(source.name)) {
        continue;
      }

      const interval = setInterval(async () => {
        try {
          const config = await this.fetchRemoteConfig(source);
          if (config) {
            const configStr = JSON.stringify(config);
            const lastConfig = this.lastConfigs.get(source.name);

            if (configStr !== lastConfig) {
              this.lastConfigs.set(source.name, configStr);
              this.notifyCallbacks(source.name, config);
            }
          }
        } catch (error) {
          console.error(`Remote config polling error for ${source.name}:`, error);
        }
      }, source.pollInterval);

      this.pollers.set(source.name, interval);
    }
  }

  stopPolling(sourceName?: string): void {
    if (sourceName) {
      const poller = this.pollers.get(sourceName);
      if (poller) {
        clearInterval(poller);
        this.pollers.delete(sourceName);
        this.lastConfigs.delete(sourceName);
      }
    } else {
      // Stop all polling
      for (const [name, poller] of this.pollers) {
        clearInterval(poller);
      }
      this.pollers.clear();
      this.lastConfigs.clear();
      this.callbacks.clear();
    }
  }

  private async fetchRemoteConfig(source: RemoteSourceConfig): Promise<any> {
    // Mock implementation - in real code, use fetch or http client
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), source.timeout);

    try {
      // Simulate remote config fetch
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Return mock config
      return {
        timestamp: new Date().toISOString(),
        source: source.name,
        config: {
          // Mock configuration data
          features: {
            tools: { enabled: true },
          },
        },
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private notifyCallbacks(source: string, config: any): void {
    for (const callback of this.callbacks) {
      try {
        callback(source, config);
      } catch (error) {
        console.error('Remote config callback error:', error);
      }
    }
  }
}

/**
 * Configuration Hot Reload Manager
 */
export class ConfigurationHotReloadManager {
  private options: HotReloadOptions;
  private runtimeManager: RuntimeConfigurationManager;
  private validator: ConfigurationValidator;
  private fileWatcher: FileSystemWatcher;
  private remotePoller: RemoteConfigurationPoller;
  private callbacks: Set<HotReloadCallback> = new Set();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private isEnabled = false;

  constructor(
    runtimeManager: RuntimeConfigurationManager,
    options: Partial<HotReloadOptions> = {}
  ) {
    this.runtimeManager = runtimeManager;
    this.validator = new ConfigurationValidator();
    this.fileWatcher = new FileSystemWatcher();
    this.remotePoller = new RemoteConfigurationPoller();

    this.options = {
      enabled: true,
      debounceMs: 1000,
      watchPaths: ['./config', './environments'],
      maxRetries: 3,
      retryDelay: 1000,
      validateOnReload: true,
      rollbackOnError: true,
      ...options,
    };
  }

  /**
   * Start hot reloading
   */
  start(): void {
    if (!this.options.enabled || this.isEnabled) {
      return;
    }

    this.isEnabled = true;

    // Start file watching
    if (this.options.watchPaths.length > 0) {
      this.fileWatcher.watch(this.options.watchPaths, (event) => {
        this.handleFileChange(event);
      });
    }

    // Start remote polling
    if (this.options.remoteSources && this.options.remoteSources.length > 0) {
      this.remotePoller.startPolling(this.options.remoteSources, (source, config) => {
        this.handleRemoteConfigChange(source, config);
      });
    }

    this.notifyCallbacks({
      type: 'reload',
      source: 'hot-reload-manager',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Stop hot reloading
   */
  stop(): void {
    if (!this.isEnabled) {
      return;
    }

    this.isEnabled = false;

    // Stop file watching
    this.fileWatcher.unwatch();

    // Stop remote polling
    this.remotePoller.stopPolling();

    // Clear debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }

  /**
   * Add hot reload callback
   */
  onHotReload(callback: HotReloadCallback): void {
    this.callbacks.add(callback);
  }

  /**
   * Remove hot reload callback
   */
  offHotReload(callback: HotReloadCallback): void {
    this.callbacks.delete(callback);
  }

  /**
   * Manually trigger configuration reload
   */
  async triggerReload(source = 'manual'): Promise<void> {
    try {
      // Load configuration from all sources
      const newConfig = await this.loadConfigurationFromSources();
      
      if (newConfig) {
        await this.applyConfigurationUpdate(newConfig, source);
      }
    } catch (error) {
      this.notifyCallbacks({
        type: 'error',
        source,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  /**
   * Get hot reload status
   */
  getStatus(): {
    enabled: boolean;
    watchedPaths: string[];
    remoteSources: number;
    activeCallbacks: number;
  } {
    return {
      enabled: this.isEnabled,
      watchedPaths: this.options.watchPaths,
      remoteSources: this.options.remoteSources?.length || 0,
      activeCallbacks: this.callbacks.size,
    };
  }

  /**
   * Update hot reload options
   */
  updateOptions(options: Partial<HotReloadOptions>): void {
    const wasEnabled = this.isEnabled;
    
    if (wasEnabled) {
      this.stop();
    }

    this.options = { ...this.options, ...options };

    if (wasEnabled && this.options.enabled) {
      this.start();
    }
  }

  /**
   * Handle file system changes
   */
  private handleFileChange(event: FileWatchEvent): void {
    const key = `file:${event.path}`;
    
    // Clear existing debounce timer
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounce timer
    const timer = setTimeout(async () => {
      this.debounceTimers.delete(key);
      
      try {
        const config = await this.loadConfigurationFromFile(event.path);
        if (config) {
          await this.applyConfigurationUpdate(config, `file:${event.path}`);
        }
      } catch (error) {
        this.notifyCallbacks({
          type: 'error',
          source: `file:${event.path}`,
          path: event.path,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    }, this.options.debounceMs);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Handle remote configuration changes
   */
  private handleRemoteConfigChange(source: string, config: any): void {
    const key = `remote:${source}`;
    
    // Clear existing debounce timer
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounce timer
    const timer = setTimeout(async () => {
      this.debounceTimers.delete(key);
      
      try {
        await this.applyConfigurationUpdate(config.config, `remote:${source}`);
      } catch (error) {
        this.notifyCallbacks({
          type: 'error',
          source: `remote:${source}`,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    }, this.options.debounceMs);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Apply configuration update with validation and error handling
   */
  private async applyConfigurationUpdate(
    config: Partial<MCPServerConfig>,
    source: string
  ): Promise<void> {
    try {
      // Validate configuration if enabled
      if (this.options.validateOnReload) {
        const currentConfig = this.runtimeManager.getCurrentConfiguration();
        const mergedConfig = { ...currentConfig, ...config };
        const validation = await this.validator.validate(mergedConfig);

        if (!validation.isValid) {
          this.notifyCallbacks({
            type: 'validation-failed',
            source,
            timestamp: new Date().toISOString(),
            validation,
            config: mergedConfig,
          });

          if (this.options.rollbackOnError) {
            return; // Don't apply invalid configuration
          }
        }
      }

      // Apply configuration update
      const result = await this.runtimeManager.updateConfiguration(config, {
        validate: this.options.validateOnReload,
        rollbackOnFailure: this.options.rollbackOnError,
        source: `hot-reload:${source}`,
      });

      if (result.success) {
        this.notifyCallbacks({
          type: 'reload',
          source,
          timestamp: result.timestamp,
          config: this.runtimeManager.getCurrentConfiguration(),
        });
      } else {
        this.notifyCallbacks({
          type: 'error',
          source,
          timestamp: result.timestamp,
          error: result.error,
        });

        if (result.rollbackPerformed) {
          this.notifyCallbacks({
            type: 'rollback',
            source,
            timestamp: result.timestamp,
          });
        }
      }
    } catch (error) {
      this.notifyCallbacks({
        type: 'error',
        source,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  /**
   * Load configuration from file (mock implementation)
   */
  private async loadConfigurationFromFile(path: string): Promise<Partial<MCPServerConfig> | null> {
    try {
      // Mock file loading - in real implementation, use fs.readFile and JSON.parse/YAML.parse
      await new Promise(resolve => setTimeout(resolve, 50));
      
      return {
        runtime: {
          hotReload: true,
          configRefreshInterval: 5000,
          gracefulShutdown: true,
        },
      };
    } catch (error) {
      console.error(`Failed to load configuration from ${path}:`, error);
      return null;
    }
  }

  /**
   * Load configuration from all sources
   */
  private async loadConfigurationFromSources(): Promise<Partial<MCPServerConfig> | null> {
    try {
      // Mock loading from multiple sources
      const configs: Partial<MCPServerConfig>[] = [];

      // Load from files
      for (const path of this.options.watchPaths) {
        const config = await this.loadConfigurationFromFile(path);
        if (config) {
          configs.push(config);
        }
      }

      // Merge all configurations
      if (configs.length > 0) {
        return configs.reduce((merged, config) => ({ ...merged, ...config }), {});
      }

      return null;
    } catch (error) {
      console.error('Failed to load configuration from sources:', error);
      return null;
    }
  }

  /**
   * Notify all callbacks
   */
  private notifyCallbacks(event: HotReloadEvent): void {
    for (const callback of this.callbacks) {
      try {
        callback(event);
      } catch (error) {
        console.error('Hot reload callback error:', error);
      }
    }
  }
}

/**
 * Global hot reload manager instance
 */
let globalHotReloadManager: ConfigurationHotReloadManager | null = null;

/**
 * Get or create the global hot reload manager
 */
export function getGlobalHotReloadManager(
  runtimeManager?: RuntimeConfigurationManager,
  options?: Partial<HotReloadOptions>
): ConfigurationHotReloadManager {
  if (!globalHotReloadManager) {
    if (!runtimeManager) {
      throw new Error('Runtime manager required for first-time initialization');
    }
    globalHotReloadManager = new ConfigurationHotReloadManager(runtimeManager, options);
  }
  return globalHotReloadManager;
}

/**
 * Set the global hot reload manager
 */
export function setGlobalHotReloadManager(manager: ConfigurationHotReloadManager): void {
  globalHotReloadManager = manager;
}

/**
 * Convenience function to start hot reloading
 */
export function startHotReload(): void {
  if (!globalHotReloadManager) {
    throw new Error('Hot reload manager not initialized');
  }
  globalHotReloadManager.start();
}

/**
 * Convenience function to stop hot reloading
 */
export function stopHotReload(): void {
  if (!globalHotReloadManager) {
    throw new Error('Hot reload manager not initialized');
  }
  globalHotReloadManager.stop();
}