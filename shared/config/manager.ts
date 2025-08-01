/**
 * Configuration Manager - Phase 2: Configuration Management
 * 
 * Centralized configuration management system that handles loading,
 * validation, merging, and runtime updates of configuration across
 * all deployment environments.
 */

import {
  MCPServerConfig,
  ConfigurationManagerOptions,
  ConfigurationSource,
  ConfigurationLoader,
  ConfigurationWatcher,
  ConfigChangeCallback,
  ValidationResult,
  EvaluationContext,
  ConfigurationChangeEvent,
} from '../types/config-types.js';
import { defaultConfig, deepMerge, getEnvironmentOverrides } from './defaults.js';
import { ConfigurationValidator } from './validator.js';
import { FeatureFlagsEngine } from './feature-flags.js';

/**
 * Environment variable configuration loader
 */
class EnvironmentLoader implements ConfigurationLoader {
  async load(): Promise<Partial<MCPServerConfig>> {
    const config: Partial<MCPServerConfig> = {};

    // Load API configuration from environment
    if (process.env.OPENAI_API_KEY) {
      config.api = {
        openai: {
          apiKey: process.env.OPENAI_API_KEY,
          ...(process.env.OPENAI_BASE_URL && { baseUrl: process.env.OPENAI_BASE_URL }),
          ...(process.env.OPENAI_TIMEOUT && { timeout: parseInt(process.env.OPENAI_TIMEOUT) }),
          ...(process.env.OPENAI_MAX_TOKENS && { maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) }),
          ...(process.env.OPENAI_MODEL && { model: process.env.OPENAI_MODEL }),
        },
      };
    }

    // Load server configuration from environment
    if (process.env.SERVER_NAME || process.env.SERVER_VERSION || process.env.NODE_ENV) {
      config.server = {
        name: process.env.SERVER_NAME || 'openai-assistants-mcp',
        version: process.env.SERVER_VERSION || '2.2.4',
        environment: (process.env.NODE_ENV as any) || 'development',
        description: 'OpenAI Assistants MCP Server',
      };
    }

    // Load deployment configuration from environment
    if (process.env.DEBUG || process.env.LOG_LEVEL || process.env.DEPLOYMENT_TYPE) {
      config.deployment = {
        type: (process.env.DEPLOYMENT_TYPE as any) || 'local',
        transport: (process.env.TRANSPORT_TYPE as any) || 'stdio',
        debug: process.env.DEBUG === 'true',
        logLevel: (process.env.LOG_LEVEL as any) || 'info',
        region: 'auto',
        timezone: 'UTC',
      };
    }

    // Load feature flags from environment
    const features: any = {};
    if (process.env.FEATURES_TOOLS_ENABLED !== undefined) {
      features.tools = { enabled: process.env.FEATURES_TOOLS_ENABLED === 'true' };
    }
    if (process.env.FEATURES_RESOURCES_ENABLED !== undefined) {
      features.resources = { enabled: process.env.FEATURES_RESOURCES_ENABLED === 'true' };
    }
    if (process.env.FEATURES_MONITORING_ENABLED !== undefined) {
      features.monitoring = { enabled: process.env.FEATURES_MONITORING_ENABLED === 'true' };
    }
    if (Object.keys(features).length > 0) {
      config.features = features;
    }

    return config;
  }
}

/**
 * File-based configuration loader
 */
class FileLoader implements ConfigurationLoader {
  constructor(private filePath: string) {}

  async load(): Promise<Partial<MCPServerConfig>> {
    try {
      // In a real implementation, this would read from the file system
      // For now, return empty config as file loading is optional
      return {};
    } catch (error) {
      console.warn(`Failed to load configuration from ${this.filePath}:`, error);
      return {};
    }
  }
}

/**
 * Runtime configuration loader for dynamic updates
 */
class RuntimeLoader implements ConfigurationLoader {
  private runtimeConfig: Partial<MCPServerConfig> = {};

  async load(): Promise<Partial<MCPServerConfig>> {
    return this.runtimeConfig;
  }

  updateConfig(updates: Partial<MCPServerConfig>): void {
    this.runtimeConfig = deepMerge(this.runtimeConfig, updates);
  }

  clearConfig(): void {
    this.runtimeConfig = {};
  }
}

/**
 * Configuration change watcher
 */
class ConfigurationChangeWatcher implements ConfigurationWatcher {
  private callbacks: ConfigChangeCallback[] = [];
  private watching = false;

  watch(callback: ConfigChangeCallback): void {
    this.callbacks.push(callback);
    this.watching = true;
  }

  unwatch(): void {
    this.callbacks = [];
    this.watching = false;
  }

  isWatching(): boolean {
    return this.watching;
  }

  async notifyChange(event: ConfigurationChangeEvent): Promise<void> {
    for (const callback of this.callbacks) {
      try {
        await callback(event);
      } catch (error) {
        console.error('Configuration change callback error:', error);
      }
    }
  }
}

/**
 * Main Configuration Manager class
 */
export class ConfigurationManager {
  private config: MCPServerConfig;
  private validator: ConfigurationValidator;
  private featureFlags: FeatureFlagsEngine;
  private sources: ConfigurationSource[];
  private watcher: ConfigurationChangeWatcher;
  private runtimeLoader: RuntimeLoader;
  private options: ConfigurationManagerOptions;

  constructor(options: ConfigurationManagerOptions) {
    this.options = {
      validation: { enabled: true, strict: false },
      caching: { enabled: true, ttl: 300000 },
      watching: { enabled: true, debounce: 1000 },
      ...options,
    };

    this.validator = new ConfigurationValidator();
    this.featureFlags = new FeatureFlagsEngine();
    this.watcher = new ConfigurationChangeWatcher();
    this.runtimeLoader = new RuntimeLoader();

    // Initialize default sources
    this.sources = this.createDefaultSources();

    // Start with default configuration
    this.config = { ...defaultConfig };
  }

  /**
   * Load and merge configuration from all sources
   */
  async loadConfiguration(): Promise<MCPServerConfig> {
    try {
      // Start with default configuration
      let mergedConfig = { ...defaultConfig };

      // Apply environment-specific overrides
      const envOverrides = getEnvironmentOverrides(this.options.environment);
      if (envOverrides && Object.keys(envOverrides).length > 0) {
        mergedConfig = deepMerge(mergedConfig, envOverrides);
      }

      // Load and merge from all sources in priority order
      const sortedSources = this.sources.sort((a, b) => a.priority - b.priority);
      
      for (const source of sortedSources) {
        try {
          const sourceConfig = await source.loader.load();
          if (sourceConfig && Object.keys(sourceConfig).length > 0) {
            mergedConfig = deepMerge(mergedConfig, sourceConfig);
          }
        } catch (error) {
          console.warn(`Failed to load configuration from source ${source.name}:`, error);
        }
      }

      // Validate the merged configuration
      if (this.options.validation?.enabled) {
        const validation = await this.validator.validate(mergedConfig);
        if (!validation.isValid) {
          if (this.options.validation.strict) {
            throw new Error(`Configuration validation failed: ${validation.errors.map((e: any) => e.message).join(', ')}`);
          } else {
            console.warn('Configuration validation warnings:', validation.errors);
          }
        }
      }

      // Update internal configuration
      this.config = mergedConfig;

      // Notify watchers of configuration change
      if (this.options.watching?.enabled) {
        await this.watcher.notifyChange({
          type: 'reload',
          timestamp: new Date().toISOString(),
          source: 'ConfigurationManager',
          newValue: this.config,
        });
      }

      return this.config;
    } catch (error) {
      console.error('Failed to load configuration:', error);
      throw error;
    }
  }

  /**
   * Get current configuration
   */
  getConfiguration(): MCPServerConfig {
    return { ...this.config };
  }

  /**
   * Get configuration value by path
   */
  get<T = any>(path: string): T | undefined {
    return path.split('.').reduce((obj: any, key: string) => obj?.[key], this.config);
  }

  /**
   * Update configuration at runtime
   */
  async updateConfiguration(updates: Partial<MCPServerConfig>): Promise<void> {
    try {
      // Validate updates if validation is enabled
      if (this.options.validation?.enabled) {
        const testConfig = deepMerge(this.config, updates);
        const validation = await this.validator.validate(testConfig);
        
        if (!validation.isValid && this.options.validation.strict) {
          throw new Error(`Configuration update validation failed: ${validation.errors.map((e: any) => e.message).join(', ')}`);
        }
      }

      // Update runtime loader
      this.runtimeLoader.updateConfig(updates);

      // Reload configuration to apply changes
      const oldConfig = { ...this.config };
      await this.loadConfiguration();

      // Notify watchers of configuration change
      if (this.options.watching?.enabled) {
        await this.watcher.notifyChange({
          type: 'update',
          timestamp: new Date().toISOString(),
          source: 'runtime',
          oldValue: oldConfig,
          newValue: this.config,
        });
      }
    } catch (error) {
      console.error('Failed to update configuration:', error);
      throw error;
    }
  }

  /**
   * Watch for configuration changes
   */
  watchConfiguration(callback: ConfigChangeCallback): void {
    if (this.options.watching?.enabled) {
      this.watcher.watch(callback);
    }
  }

  /**
   * Stop watching configuration changes
   */
  unwatchConfiguration(): void {
    this.watcher.unwatch();
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(feature: string): boolean {
    return this.featureFlags.evaluate(feature, this.createEvaluationContext());
  }

  /**
   * Get feature configuration
   */
  getFeatureConfig<T = any>(feature: string): T | undefined {
    return this.get(`features.${feature}`);
  }

  /**
   * Validate current configuration
   */
  async validateConfiguration(): Promise<ValidationResult> {
    return this.validator.validate(this.config);
  }

  /**
   * Get configuration metadata
   */
  getMetadata() {
    return {
      environment: this.options.environment,
      loadedAt: new Date().toISOString(),
      sources: this.sources.map(s => ({ name: s.name, type: s.type, priority: s.priority })),
      validation: this.options.validation,
      watching: this.options.watching?.enabled && this.watcher.isWatching(),
    };
  }

  /**
   * Create default configuration sources
   */
  private createDefaultSources(): ConfigurationSource[] {
    return [
      {
        name: 'default',
        type: 'default',
        priority: 1,
        loader: {
          load: async () => defaultConfig,
        },
      },
      {
        name: 'environment',
        type: 'environment',
        priority: 2,
        loader: new EnvironmentLoader(),
      },
      {
        name: 'runtime',
        type: 'runtime',
        priority: 3,
        loader: this.runtimeLoader,
      },
    ];
  }

  /**
   * Create evaluation context for feature flags
   */
  private createEvaluationContext(): EvaluationContext {
    return {
      environment: this.config.server.environment,
      deployment: this.config.deployment.type,
      timestamp: new Date().toISOString(),
      metadata: {
        serverName: this.config.server.name,
        serverVersion: this.config.server.version,
      },
    };
  }

  /**
   * Add a custom configuration source
   */
  addSource(source: ConfigurationSource): void {
    this.sources.push(source);
    this.sources.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Remove a configuration source
   */
  removeSource(name: string): boolean {
    const index = this.sources.findIndex(s => s.name === name);
    if (index >= 0) {
      this.sources.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get all configuration sources
   */
  getSources(): ConfigurationSource[] {
    return [...this.sources];
  }

  /**
   * Reload configuration from all sources
   */
  async reload(): Promise<MCPServerConfig> {
    return this.loadConfiguration();
  }

  /**
   * Reset configuration to defaults
   */
  async reset(): Promise<MCPServerConfig> {
    this.runtimeLoader.clearConfig();
    return this.loadConfiguration();
  }
}

/**
 * Create a configuration manager with default options
 */
export function createConfigurationManager(environment: string, options: Partial<ConfigurationManagerOptions> = {}): ConfigurationManager {
  return new ConfigurationManager({
    environment,
    ...options,
  });
}

/**
 * Global configuration manager instance
 */
let globalConfigManager: ConfigurationManager | null = null;

/**
 * Get or create the global configuration manager
 */
export function getGlobalConfigManager(environment?: string): ConfigurationManager {
  if (!globalConfigManager) {
    if (!environment) {
      environment = process.env.NODE_ENV || 'development';
    }
    globalConfigManager = createConfigurationManager(environment);
  }
  return globalConfigManager;
}

/**
 * Set the global configuration manager
 */
export function setGlobalConfigManager(manager: ConfigurationManager): void {
  globalConfigManager = manager;
}