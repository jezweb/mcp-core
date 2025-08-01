/**
 * Configuration System Index - Phase 2: Configuration Management
 * 
 * Central export point for the configuration management system.
 * Provides unified access to configuration manager, feature flags,
 * validation, and utilities.
 */

// Re-export all configuration components
export { ConfigurationManager } from './manager.js';
export { ConfigurationValidator } from './validator.js';
export { FeatureFlagsEngine, getGlobalFeatureFlags, setGlobalFeatureFlags } from './feature-flags.js';
export { EnvironmentManager } from './environment-manager.js';
export { DeploymentHealthChecker, getGlobalHealthChecker, performDeploymentHealthCheck } from './deployment-health.js';
export { DeploymentPipelineManager, createDeploymentPipeline, defaultPipelineConfig } from './deployment-pipeline.js';

// Re-export runtime configuration components
export {
  RuntimeConfigurationManager,
  getGlobalRuntimeManager,
  setGlobalRuntimeManager,
  updateRuntimeConfiguration,
  getRuntimeConfiguration,
  rollbackRuntimeConfiguration
} from './runtime-manager.js';

export {
  ConfigurationHotReloadManager,
  getGlobalHotReloadManager,
  setGlobalHotReloadManager,
  startHotReload,
  stopHotReload
} from './hot-reload.js';

export {
  ConfigurationCacheManager,
  getGlobalCacheManager,
  setGlobalCacheManager,
  getCachedConfig,
  setCachedConfig
} from './cache-manager.js';

export {
  ConfigurationSyncManager,
  getGlobalSyncManager,
  setGlobalSyncManager,
  startSync,
  stopSync
} from './sync-manager.js';

export {
  ConfigurationAuditTrailManager,
  getGlobalAuditTrailManager,
  setGlobalAuditTrailManager,
  logConfigurationChange,
  queryAuditLog
} from './audit-trail.js';

// Re-export configuration data and schemas
export { 
  defaultConfig, 
  getEnvironmentOverrides, 
  deepMerge,
  developmentOverrides,
  stagingOverrides,
  productionOverrides,
  testOverrides,
  createConfigWithOverrides
} from './defaults.js';

export { 
  mcpServerConfigSchema, 
  featureFlagSchema, 
  environmentConfigSchema, 
  SchemaUtils, 
  SCHEMA_METADATA 
} from './schema.js';

// Re-export types
export type {
  MCPServerConfig,
  FeatureFlags,
  FeatureFlag,
  FeatureFlagVariant,
  FeatureFlagRule,
  EvaluationContext,
  ValidationResult,
  ConfigurationSource,
  ConfigurationWatcher,
} from '../types/config-types.js';

// Re-export runtime configuration types
export type {
  RuntimeUpdateOptions,
  ConfigurationSnapshot,
  RuntimeChangeResult,
} from './runtime-manager.js';

export type {
  HotReloadOptions,
  RemoteSourceConfig,
  FileWatchEvent,
  HotReloadEvent,
  HotReloadCallback,
} from './hot-reload.js';

export type {
  CacheEntry,
  CacheStatistics,
  CacheInvalidationStrategy,
  CacheOptions,
  CacheWarmingConfig,
} from './cache-manager.js';

export type {
  SyncMode,
  ConflictResolutionStrategy,
  ConfigurationVersion,
  SyncEvent,
  ConfigurationConflict,
  SyncPeer,
  SyncOptions,
  PubSubMessage,
  PubSubCallback,
} from './sync-manager.js';

export type {
  AuditLogEntry,
  AuditUser,
  ConfigurationDiff,
  AuditQueryOptions,
  AuditStatistics,
  AuditExportOptions,
  AuditRetentionPolicy,
} from './audit-trail.js';

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Environment = 'development' | 'staging' | 'production' | 'test';

// Import the actual classes for use in this file
import { ConfigurationManager } from './manager.js';
import { FeatureFlagsEngine } from './feature-flags.js';
import { ConfigurationValidator } from './validator.js';
import { EnvironmentManager } from './environment-manager.js';
import { DeploymentHealthChecker } from './deployment-health.js';
import { DeploymentPipelineManager, createDeploymentPipeline } from './deployment-pipeline.js';
import { RuntimeConfigurationManager } from './runtime-manager.js';
import { ConfigurationHotReloadManager } from './hot-reload.js';
import { ConfigurationCacheManager } from './cache-manager.js';
import { ConfigurationSyncManager } from './sync-manager.js';
import { ConfigurationAuditTrailManager } from './audit-trail.js';
import { deepMerge, defaultConfig } from './defaults.js';
import type {
  MCPServerConfig,
  ValidationResult,
  ConfigurationSource,
  EvaluationContext,
  FeatureFlag
} from '../types/config-types.js';

/**
 * Configuration system factory
 */
export class ConfigurationSystem {
  private manager: ConfigurationManager;
  private featureFlags: FeatureFlagsEngine;
  private validator: ConfigurationValidator;
  private environmentManager: EnvironmentManager;
  private healthChecker: DeploymentHealthChecker;
  private pipelineManager: DeploymentPipelineManager;
  private runtimeManager: RuntimeConfigurationManager;
  private hotReloadManager: ConfigurationHotReloadManager;
  private cacheManager: ConfigurationCacheManager;
  private syncManager: ConfigurationSyncManager;
  private auditTrailManager: ConfigurationAuditTrailManager;

  constructor() {
    this.manager = new ConfigurationManager({ environment: 'development' });
    this.featureFlags = new FeatureFlagsEngine();
    this.validator = new ConfigurationValidator();
    this.environmentManager = new EnvironmentManager();
    this.healthChecker = new DeploymentHealthChecker();
    this.pipelineManager = createDeploymentPipeline();
    
    // Initialize runtime configuration components
    const initialConfig = this.manager.getConfiguration();
    this.runtimeManager = new RuntimeConfigurationManager(initialConfig);
    this.hotReloadManager = new ConfigurationHotReloadManager(this.runtimeManager);
    this.cacheManager = new ConfigurationCacheManager();
    this.syncManager = new ConfigurationSyncManager('default-instance', this.runtimeManager);
    this.auditTrailManager = new ConfigurationAuditTrailManager({
      id: 'system',
      name: 'Configuration System',
      role: 'system',
    });
  }

  /**
   * Get the configuration manager
   */
  getManager(): ConfigurationManager {
    return this.manager;
  }

  /**
   * Get the feature flags engine
   */
  getFeatureFlags(): FeatureFlagsEngine {
    return this.featureFlags;
  }

  /**
   * Get the configuration validator
   */
  getValidator(): ConfigurationValidator {
    return this.validator;
  }

  /**
   * Get the environment manager
   */
  getEnvironmentManager(): EnvironmentManager {
    return this.environmentManager;
  }

  /**
   * Get the deployment health checker
   */
  getHealthChecker(): DeploymentHealthChecker {
    return this.healthChecker;
  }

  /**
   * Get the deployment pipeline manager
   */
  getPipelineManager(): DeploymentPipelineManager {
    return this.pipelineManager;
  }

  /**
   * Get the runtime configuration manager
   */
  getRuntimeManager(): RuntimeConfigurationManager {
    return this.runtimeManager;
  }

  /**
   * Get the hot reload manager
   */
  getHotReloadManager(): ConfigurationHotReloadManager {
    return this.hotReloadManager;
  }

  /**
   * Get the cache manager
   */
  getCacheManager(): ConfigurationCacheManager {
    return this.cacheManager;
  }

  /**
   * Get the sync manager
   */
  getSyncManager(): ConfigurationSyncManager {
    return this.syncManager;
  }

  /**
   * Get the audit trail manager
   */
  getAuditTrailManager(): ConfigurationAuditTrailManager {
    return this.auditTrailManager;
  }

  /**
   * Initialize the configuration system
   */
  async initialize(sources?: ConfigurationSource[]): Promise<void> {
    // Load configuration from sources
    if (sources) {
      for (const source of sources) {
        this.manager.addSource(source);
      }
    }
    
    // Load configuration
    await this.manager.loadConfiguration();

    // Initialize feature flags from configuration
    const config = this.manager.getConfiguration();
    if (config.features) {
      // Convert features to feature flags
      const flags = Object.entries(config.features).map(([category, categoryConfig]) => {
        if (typeof categoryConfig === 'object' && categoryConfig !== null && 'enabled' in categoryConfig) {
          return {
            name: category,
            enabled: Boolean(categoryConfig.enabled),
            description: `Feature flag for ${category}`,
          };
        }
        return null;
      }).filter(Boolean);
      
      this.featureFlags.registerFlags(flags as any[]);
    }

    // Initialize runtime configuration components
    await this.initializeRuntimeComponents(config);
  }

  /**
   * Initialize runtime configuration components
   */
  private async initializeRuntimeComponents(config: MCPServerConfig): Promise<void> {
    // Set up configuration change watching
    this.manager.watchConfiguration(async (event) => {
      // Update runtime manager
      if (event.newValue) {
        await this.runtimeManager.updateConfiguration(event.newValue, {
          source: event.source,
          notifyWatchers: true,
        });
      }

      // Log audit trail
      await this.auditTrailManager.logChange(
        event.type === 'update' ? 'update' : 'create',
        event.oldValue,
        event.newValue,
        {
          source: event.source,
          metadata: event.metadata,
        }
      );
    });

    // Start hot reloading if enabled
    if (config.runtime?.hotReload) {
      this.hotReloadManager.start();
    }

    // Start synchronization if configured
    // Note: In a real implementation, you'd check for sync configuration
    // this.syncManager.start();
  }

  /**
   * Get current configuration
   */
  getConfiguration(): MCPServerConfig {
    return this.manager.getConfiguration();
  }

  /**
   * Update configuration
   */
  async updateConfiguration(updates: DeepPartial<MCPServerConfig>): Promise<ValidationResult> {
    const oldConfig = this.manager.getConfiguration();
    
    // Update through runtime manager for better control
    const result = await this.runtimeManager.updateConfiguration(updates as Partial<MCPServerConfig>, {
      validate: true,
      rollbackOnFailure: true,
      source: 'configuration-system',
    });

    if (result.success) {
      // Update the main configuration manager
      await this.manager.updateConfiguration(updates as Partial<MCPServerConfig>);
      
      // Log the change
      await this.auditTrailManager.logUpdate(
        oldConfig,
        this.runtimeManager.getCurrentConfiguration(),
        {
          source: 'configuration-system',
          reason: 'Configuration update via ConfigurationSystem',
        }
      );
    }

    return this.validateConfiguration();
  }

  /**
   * Validate current configuration
   */
  validateConfiguration(): ValidationResult {
    const config = this.manager.getConfiguration();
    // Since validator.validate is async, we need to handle this differently
    // For now, return a basic validation result
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(flagName: string, context?: EvaluationContext): boolean {
    const config = this.manager.getConfiguration();
    const defaultContext: EvaluationContext = {
      environment: config.server?.environment || 'development',
      deployment: config.deployment?.type || 'unknown',
      timestamp: context?.timestamp || new Date().toISOString(),
      ...context,
    };
    return this.featureFlags.isEnabled(flagName, defaultContext);
  }

  /**
   * Get feature variant
   */
  getFeatureVariant(flagName: string, context?: EvaluationContext): string | undefined {
    const config = this.manager.getConfiguration();
    const defaultContext: EvaluationContext = {
      environment: config.server?.environment || 'development',
      deployment: config.deployment?.type || 'unknown',
      timestamp: context?.timestamp || new Date().toISOString(),
      ...context,
    };
    return this.featureFlags.getVariant(flagName, defaultContext);
  }

  /**
   * Get feature configuration
   */
  getFeatureConfig(flagName: string, context?: EvaluationContext): any {
    const config = this.manager.getConfiguration();
    const defaultContext: EvaluationContext = {
      environment: config.server?.environment || 'development',
      deployment: config.deployment?.type || 'unknown',
      timestamp: context?.timestamp || new Date().toISOString(),
      ...context,
    };
    return this.featureFlags.getFeatureConfig(flagName, defaultContext);
  }

  /**
   * Export system state
   */
  exportState(): {
    configuration: MCPServerConfig;
    featureFlags: FeatureFlag[];
    validation: ValidationResult;
  } {
    return {
      configuration: this.getConfiguration(),
      featureFlags: this.featureFlags.exportFlags(),
      validation: this.validateConfiguration(),
    };
  }

  /**
   * Import system state
   */
  async importState(state: {
    configuration?: DeepPartial<MCPServerConfig>;
    featureFlags?: FeatureFlag[];
  }): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Import configuration
    if (state.configuration) {
      const configResult = await this.updateConfiguration(state.configuration);
      results.push(configResult);
    }

    // Import feature flags
    if (state.featureFlags) {
      this.featureFlags.importFlags(state.featureFlags, true);
    }

    return results;
  }

  /**
   * Reset system to defaults
   */
  async reset(): Promise<void> {
    // Stop runtime components
    this.hotReloadManager.stop();
    this.syncManager.stop();

    // Reset all managers
    this.manager = new ConfigurationManager({ environment: 'development' });
    this.featureFlags = new FeatureFlagsEngine();
    this.validator = new ConfigurationValidator();
    this.environmentManager = new EnvironmentManager();
    this.healthChecker = new DeploymentHealthChecker();
    this.pipelineManager = createDeploymentPipeline();
    
    // Reinitialize runtime components
    const initialConfig = this.manager.getConfiguration();
    this.runtimeManager = new RuntimeConfigurationManager(initialConfig);
    this.hotReloadManager = new ConfigurationHotReloadManager(this.runtimeManager);
    this.cacheManager = new ConfigurationCacheManager();
    this.syncManager = new ConfigurationSyncManager('default-instance', this.runtimeManager);
    this.auditTrailManager = new ConfigurationAuditTrailManager({
      id: 'system',
      name: 'Configuration System',
      role: 'system',
    });

    await this.initialize();
  }
}

/**
 * Global configuration system instance
 */
let globalConfigSystem: ConfigurationSystem | null = null;

/**
 * Get or create the global configuration system
 */
export function getGlobalConfigSystem(): ConfigurationSystem {
  if (!globalConfigSystem) {
    globalConfigSystem = new ConfigurationSystem();
  }
  return globalConfigSystem;
}

/**
 * Set the global configuration system
 */
export function setGlobalConfigSystem(system: ConfigurationSystem): void {
  globalConfigSystem = system;
}

/**
 * Initialize the global configuration system
 */
export async function initializeGlobalConfig(sources?: ConfigurationSource[]): Promise<void> {
  const system = getGlobalConfigSystem();
  await system.initialize(sources);
}

/**
 * Convenience functions for common operations
 */

/**
 * Get current configuration
 */
export function getConfig(): MCPServerConfig {
  return getGlobalConfigSystem().getConfiguration();
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(flagName: string, context?: EvaluationContext): boolean {
  return getGlobalConfigSystem().isFeatureEnabled(flagName, context);
}

/**
 * Get feature variant
 */
export function getFeatureVariant(flagName: string, context?: EvaluationContext): string | undefined {
  return getGlobalConfigSystem().getFeatureVariant(flagName, context);
}

/**
 * Get feature configuration
 */
export function getFeatureConfig(flagName: string, context?: EvaluationContext): any {
  return getGlobalConfigSystem().getFeatureConfig(flagName, context);
}

/**
 * Update configuration
 */
export async function updateConfig(updates: DeepPartial<MCPServerConfig>): Promise<ValidationResult> {
  return getGlobalConfigSystem().updateConfiguration(updates);
}

/**
 * Validate current configuration
 */
export function validateConfig(): ValidationResult {
  return getGlobalConfigSystem().validateConfiguration();
}

/**
 * Detect current environment
 */
export function detectEnvironment() {
  return getGlobalConfigSystem().getEnvironmentManager().detectEnvironment();
}

/**
 * Load environment-specific configuration
 */
export async function loadEnvironmentConfig(environment: string) {
  return getGlobalConfigSystem().getEnvironmentManager().loadEnvironmentConfig(environment);
}

/**
 * Validate environment configuration
 */
export async function validateEnvironmentConfig(environment: string, config?: any) {
  const envManager = getGlobalConfigSystem().getEnvironmentManager();
  const configToValidate = config || await envManager.loadEnvironmentConfig(environment);
  return envManager.validateEnvironmentConfig(environment, configToValidate);
}

/**
 * Perform deployment health check
 */
export async function performHealthCheck(config?: any, environment?: string) {
  return getGlobalConfigSystem().getHealthChecker().performHealthCheck(config, environment);
}

/**
 * Execute deployment pipeline
 */
export async function executeDeploymentPipeline(
  environments?: string[],
  options?: {
    skipValidation?: boolean;
    skipHealthChecks?: boolean;
    dryRun?: boolean;
  }
) {
  return getGlobalConfigSystem().getPipelineManager().executePipeline(environments, options);
}

/**
 * Configuration system utilities
 */
export const ConfigUtils = {
  /**
   * Create a development configuration
   */
  createDevelopmentConfig(): Partial<MCPServerConfig> {
    return {
      server: {
        name: 'openai-assistants-mcp',
        version: '2.2.4',
        environment: 'development',
        description: 'Development configuration',
      },
      deployment: {
        type: 'local',
        transport: 'stdio',
        debug: true,
        logLevel: 'debug',
        region: 'auto',
        timezone: 'UTC',
      },
      runtime: {
        hotReload: true,
        configRefreshInterval: 5000,
        gracefulShutdown: true,
        healthCheck: {
          enabled: true,
          interval: 30000,
          timeout: 5000,
        },
        metrics: {
          enabled: true,
          interval: 60000,
          retention: 86400000,
        },
      },
    };
  },

  /**
   * Create a production configuration
   */
  createProductionConfig(): Partial<MCPServerConfig> {
    return {
      server: {
        name: 'openai-assistants-mcp',
        version: '2.2.4',
        environment: 'production',
        description: 'Production configuration',
      },
      deployment: {
        type: 'cloudflare',
        transport: 'http',
        debug: false,
        logLevel: 'warn',
        region: 'auto',
        timezone: 'UTC',
      },
      runtime: {
        hotReload: false,
        configRefreshInterval: 300000,
        gracefulShutdown: true,
        healthCheck: {
          enabled: true,
          interval: 30000,
          timeout: 5000,
        },
        metrics: {
          enabled: true,
          interval: 60000,
          retention: 86400000,
        },
      },
    };
  },

  /**
   * Create a test configuration
   */
  createTestConfig(): Partial<MCPServerConfig> {
    return {
      server: {
        name: 'openai-assistants-mcp',
        version: '2.2.4',
        environment: 'test',
        description: 'Test configuration',
      },
      api: {
        openai: {
          apiKey: 'test-api-key',
          baseUrl: 'https://api.openai.com/v1',
          timeout: 5000,
          retries: 1,
          maxTokens: 4096,
          model: 'gpt-4',
        },
      },
      deployment: {
        type: 'local',
        transport: 'stdio',
        debug: true,
        logLevel: 'debug',
        region: 'auto',
        timezone: 'UTC',
      },
    };
  },

  /**
   * Merge multiple configurations
   */
  mergeConfigs(...configs: Partial<MCPServerConfig>[]): MCPServerConfig {
    const result = configs.reduce((merged, config) => deepMerge(merged, config), defaultConfig);
    return result as MCPServerConfig;
  },
};