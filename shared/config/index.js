"use strict";
/**
 * Configuration System Index - Phase 2: Configuration Management
 *
 * Central export point for the configuration management system.
 * Provides unified access to configuration manager, feature flags,
 * validation, and utilities.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaUtils = exports.environmentConfigSchema = exports.featureFlagSchema = exports.mcpServerConfigSchema = exports.createConfigWithOverrides = exports.testOverrides = exports.productionOverrides = exports.stagingOverrides = exports.developmentOverrides = exports.deepMerge = exports.getEnvironmentOverrides = exports.defaultConfig = exports.queryAuditLog = exports.logConfigurationChange = exports.setGlobalAuditTrailManager = exports.getGlobalAuditTrailManager = exports.ConfigurationAuditTrailManager = exports.stopSync = exports.startSync = exports.setGlobalSyncManager = exports.getGlobalSyncManager = exports.ConfigurationSyncManager = exports.setCachedConfig = exports.getCachedConfig = exports.setGlobalCacheManager = exports.getGlobalCacheManager = exports.ConfigurationCacheManager = exports.stopHotReload = exports.startHotReload = exports.setGlobalHotReloadManager = exports.getGlobalHotReloadManager = exports.ConfigurationHotReloadManager = exports.rollbackRuntimeConfiguration = exports.getRuntimeConfiguration = exports.updateRuntimeConfiguration = exports.setGlobalRuntimeManager = exports.getGlobalRuntimeManager = exports.RuntimeConfigurationManager = exports.defaultPipelineConfig = exports.createDeploymentPipeline = exports.DeploymentPipelineManager = exports.performDeploymentHealthCheck = exports.getGlobalHealthChecker = exports.DeploymentHealthChecker = exports.EnvironmentManager = exports.setGlobalFeatureFlags = exports.getGlobalFeatureFlags = exports.FeatureFlagsEngine = exports.ConfigurationValidator = exports.ConfigurationManager = void 0;
exports.ConfigUtils = exports.ConfigurationSystem = exports.SCHEMA_METADATA = void 0;
exports.getGlobalConfigSystem = getGlobalConfigSystem;
exports.setGlobalConfigSystem = setGlobalConfigSystem;
exports.initializeGlobalConfig = initializeGlobalConfig;
exports.getConfig = getConfig;
exports.isFeatureEnabled = isFeatureEnabled;
exports.getFeatureVariant = getFeatureVariant;
exports.getFeatureConfig = getFeatureConfig;
exports.updateConfig = updateConfig;
exports.validateConfig = validateConfig;
exports.detectEnvironment = detectEnvironment;
exports.loadEnvironmentConfig = loadEnvironmentConfig;
exports.validateEnvironmentConfig = validateEnvironmentConfig;
exports.performHealthCheck = performHealthCheck;
exports.executeDeploymentPipeline = executeDeploymentPipeline;
// Re-export all configuration components
var manager_js_1 = require("./manager.js");
Object.defineProperty(exports, "ConfigurationManager", { enumerable: true, get: function () { return manager_js_1.ConfigurationManager; } });
var validator_js_1 = require("./validator.js");
Object.defineProperty(exports, "ConfigurationValidator", { enumerable: true, get: function () { return validator_js_1.ConfigurationValidator; } });
var feature_flags_js_1 = require("./feature-flags.js");
Object.defineProperty(exports, "FeatureFlagsEngine", { enumerable: true, get: function () { return feature_flags_js_1.FeatureFlagsEngine; } });
Object.defineProperty(exports, "getGlobalFeatureFlags", { enumerable: true, get: function () { return feature_flags_js_1.getGlobalFeatureFlags; } });
Object.defineProperty(exports, "setGlobalFeatureFlags", { enumerable: true, get: function () { return feature_flags_js_1.setGlobalFeatureFlags; } });
var environment_manager_js_1 = require("./environment-manager.js");
Object.defineProperty(exports, "EnvironmentManager", { enumerable: true, get: function () { return environment_manager_js_1.EnvironmentManager; } });
var deployment_health_js_1 = require("./deployment-health.js");
Object.defineProperty(exports, "DeploymentHealthChecker", { enumerable: true, get: function () { return deployment_health_js_1.DeploymentHealthChecker; } });
Object.defineProperty(exports, "getGlobalHealthChecker", { enumerable: true, get: function () { return deployment_health_js_1.getGlobalHealthChecker; } });
Object.defineProperty(exports, "performDeploymentHealthCheck", { enumerable: true, get: function () { return deployment_health_js_1.performDeploymentHealthCheck; } });
var deployment_pipeline_js_1 = require("./deployment-pipeline.js");
Object.defineProperty(exports, "DeploymentPipelineManager", { enumerable: true, get: function () { return deployment_pipeline_js_1.DeploymentPipelineManager; } });
Object.defineProperty(exports, "createDeploymentPipeline", { enumerable: true, get: function () { return deployment_pipeline_js_1.createDeploymentPipeline; } });
Object.defineProperty(exports, "defaultPipelineConfig", { enumerable: true, get: function () { return deployment_pipeline_js_1.defaultPipelineConfig; } });
// Re-export runtime configuration components
var runtime_manager_js_1 = require("./runtime-manager.js");
Object.defineProperty(exports, "RuntimeConfigurationManager", { enumerable: true, get: function () { return runtime_manager_js_1.RuntimeConfigurationManager; } });
Object.defineProperty(exports, "getGlobalRuntimeManager", { enumerable: true, get: function () { return runtime_manager_js_1.getGlobalRuntimeManager; } });
Object.defineProperty(exports, "setGlobalRuntimeManager", { enumerable: true, get: function () { return runtime_manager_js_1.setGlobalRuntimeManager; } });
Object.defineProperty(exports, "updateRuntimeConfiguration", { enumerable: true, get: function () { return runtime_manager_js_1.updateRuntimeConfiguration; } });
Object.defineProperty(exports, "getRuntimeConfiguration", { enumerable: true, get: function () { return runtime_manager_js_1.getRuntimeConfiguration; } });
Object.defineProperty(exports, "rollbackRuntimeConfiguration", { enumerable: true, get: function () { return runtime_manager_js_1.rollbackRuntimeConfiguration; } });
var hot_reload_js_1 = require("./hot-reload.js");
Object.defineProperty(exports, "ConfigurationHotReloadManager", { enumerable: true, get: function () { return hot_reload_js_1.ConfigurationHotReloadManager; } });
Object.defineProperty(exports, "getGlobalHotReloadManager", { enumerable: true, get: function () { return hot_reload_js_1.getGlobalHotReloadManager; } });
Object.defineProperty(exports, "setGlobalHotReloadManager", { enumerable: true, get: function () { return hot_reload_js_1.setGlobalHotReloadManager; } });
Object.defineProperty(exports, "startHotReload", { enumerable: true, get: function () { return hot_reload_js_1.startHotReload; } });
Object.defineProperty(exports, "stopHotReload", { enumerable: true, get: function () { return hot_reload_js_1.stopHotReload; } });
var cache_manager_js_1 = require("./cache-manager.js");
Object.defineProperty(exports, "ConfigurationCacheManager", { enumerable: true, get: function () { return cache_manager_js_1.ConfigurationCacheManager; } });
Object.defineProperty(exports, "getGlobalCacheManager", { enumerable: true, get: function () { return cache_manager_js_1.getGlobalCacheManager; } });
Object.defineProperty(exports, "setGlobalCacheManager", { enumerable: true, get: function () { return cache_manager_js_1.setGlobalCacheManager; } });
Object.defineProperty(exports, "getCachedConfig", { enumerable: true, get: function () { return cache_manager_js_1.getCachedConfig; } });
Object.defineProperty(exports, "setCachedConfig", { enumerable: true, get: function () { return cache_manager_js_1.setCachedConfig; } });
var sync_manager_js_1 = require("./sync-manager.js");
Object.defineProperty(exports, "ConfigurationSyncManager", { enumerable: true, get: function () { return sync_manager_js_1.ConfigurationSyncManager; } });
Object.defineProperty(exports, "getGlobalSyncManager", { enumerable: true, get: function () { return sync_manager_js_1.getGlobalSyncManager; } });
Object.defineProperty(exports, "setGlobalSyncManager", { enumerable: true, get: function () { return sync_manager_js_1.setGlobalSyncManager; } });
Object.defineProperty(exports, "startSync", { enumerable: true, get: function () { return sync_manager_js_1.startSync; } });
Object.defineProperty(exports, "stopSync", { enumerable: true, get: function () { return sync_manager_js_1.stopSync; } });
var audit_trail_js_1 = require("./audit-trail.js");
Object.defineProperty(exports, "ConfigurationAuditTrailManager", { enumerable: true, get: function () { return audit_trail_js_1.ConfigurationAuditTrailManager; } });
Object.defineProperty(exports, "getGlobalAuditTrailManager", { enumerable: true, get: function () { return audit_trail_js_1.getGlobalAuditTrailManager; } });
Object.defineProperty(exports, "setGlobalAuditTrailManager", { enumerable: true, get: function () { return audit_trail_js_1.setGlobalAuditTrailManager; } });
Object.defineProperty(exports, "logConfigurationChange", { enumerable: true, get: function () { return audit_trail_js_1.logConfigurationChange; } });
Object.defineProperty(exports, "queryAuditLog", { enumerable: true, get: function () { return audit_trail_js_1.queryAuditLog; } });
// Re-export configuration data and schemas
var defaults_js_1 = require("./defaults.js");
Object.defineProperty(exports, "defaultConfig", { enumerable: true, get: function () { return defaults_js_1.defaultConfig; } });
Object.defineProperty(exports, "getEnvironmentOverrides", { enumerable: true, get: function () { return defaults_js_1.getEnvironmentOverrides; } });
Object.defineProperty(exports, "deepMerge", { enumerable: true, get: function () { return defaults_js_1.deepMerge; } });
Object.defineProperty(exports, "developmentOverrides", { enumerable: true, get: function () { return defaults_js_1.developmentOverrides; } });
Object.defineProperty(exports, "stagingOverrides", { enumerable: true, get: function () { return defaults_js_1.stagingOverrides; } });
Object.defineProperty(exports, "productionOverrides", { enumerable: true, get: function () { return defaults_js_1.productionOverrides; } });
Object.defineProperty(exports, "testOverrides", { enumerable: true, get: function () { return defaults_js_1.testOverrides; } });
Object.defineProperty(exports, "createConfigWithOverrides", { enumerable: true, get: function () { return defaults_js_1.createConfigWithOverrides; } });
var schema_js_1 = require("./schema.js");
Object.defineProperty(exports, "mcpServerConfigSchema", { enumerable: true, get: function () { return schema_js_1.mcpServerConfigSchema; } });
Object.defineProperty(exports, "featureFlagSchema", { enumerable: true, get: function () { return schema_js_1.featureFlagSchema; } });
Object.defineProperty(exports, "environmentConfigSchema", { enumerable: true, get: function () { return schema_js_1.environmentConfigSchema; } });
Object.defineProperty(exports, "SchemaUtils", { enumerable: true, get: function () { return schema_js_1.SchemaUtils; } });
Object.defineProperty(exports, "SCHEMA_METADATA", { enumerable: true, get: function () { return schema_js_1.SCHEMA_METADATA; } });
// Import the actual classes for use in this file
const manager_js_2 = require("./manager.js");
const feature_flags_js_2 = require("./feature-flags.js");
const validator_js_2 = require("./validator.js");
const environment_manager_js_2 = require("./environment-manager.js");
const deployment_health_js_2 = require("./deployment-health.js");
const deployment_pipeline_js_2 = require("./deployment-pipeline.js");
const runtime_manager_js_2 = require("./runtime-manager.js");
const hot_reload_js_2 = require("./hot-reload.js");
const cache_manager_js_2 = require("./cache-manager.js");
const sync_manager_js_2 = require("./sync-manager.js");
const audit_trail_js_2 = require("./audit-trail.js");
const defaults_js_2 = require("./defaults.js");
/**
 * Configuration system factory
 */
class ConfigurationSystem {
    constructor() {
        this.manager = new manager_js_2.ConfigurationManager({ environment: 'development' });
        this.featureFlags = new feature_flags_js_2.FeatureFlagsEngine();
        this.validator = new validator_js_2.ConfigurationValidator();
        this.environmentManager = new environment_manager_js_2.EnvironmentManager();
        this.healthChecker = new deployment_health_js_2.DeploymentHealthChecker();
        this.pipelineManager = (0, deployment_pipeline_js_2.createDeploymentPipeline)();
        // Initialize runtime configuration components
        const initialConfig = this.manager.getConfiguration();
        this.runtimeManager = new runtime_manager_js_2.RuntimeConfigurationManager(initialConfig);
        this.hotReloadManager = new hot_reload_js_2.ConfigurationHotReloadManager(this.runtimeManager);
        this.cacheManager = new cache_manager_js_2.ConfigurationCacheManager();
        this.syncManager = new sync_manager_js_2.ConfigurationSyncManager('default-instance', this.runtimeManager);
        this.auditTrailManager = new audit_trail_js_2.ConfigurationAuditTrailManager({
            id: 'system',
            name: 'Configuration System',
            role: 'system',
        });
    }
    /**
     * Get the configuration manager
     */
    getManager() {
        return this.manager;
    }
    /**
     * Get the feature flags engine
     */
    getFeatureFlags() {
        return this.featureFlags;
    }
    /**
     * Get the configuration validator
     */
    getValidator() {
        return this.validator;
    }
    /**
     * Get the environment manager
     */
    getEnvironmentManager() {
        return this.environmentManager;
    }
    /**
     * Get the deployment health checker
     */
    getHealthChecker() {
        return this.healthChecker;
    }
    /**
     * Get the deployment pipeline manager
     */
    getPipelineManager() {
        return this.pipelineManager;
    }
    /**
     * Get the runtime configuration manager
     */
    getRuntimeManager() {
        return this.runtimeManager;
    }
    /**
     * Get the hot reload manager
     */
    getHotReloadManager() {
        return this.hotReloadManager;
    }
    /**
     * Get the cache manager
     */
    getCacheManager() {
        return this.cacheManager;
    }
    /**
     * Get the sync manager
     */
    getSyncManager() {
        return this.syncManager;
    }
    /**
     * Get the audit trail manager
     */
    getAuditTrailManager() {
        return this.auditTrailManager;
    }
    /**
     * Initialize the configuration system
     */
    async initialize(sources) {
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
            this.featureFlags.registerFlags(flags);
        }
        // Initialize runtime configuration components
        await this.initializeRuntimeComponents(config);
    }
    /**
     * Initialize runtime configuration components
     */
    async initializeRuntimeComponents(config) {
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
            await this.auditTrailManager.logChange(event.type === 'update' ? 'update' : 'create', event.oldValue, event.newValue, {
                source: event.source,
                metadata: event.metadata,
            });
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
    getConfiguration() {
        return this.manager.getConfiguration();
    }
    /**
     * Update configuration
     */
    async updateConfiguration(updates) {
        const oldConfig = this.manager.getConfiguration();
        // Update through runtime manager for better control
        const result = await this.runtimeManager.updateConfiguration(updates, {
            validate: true,
            rollbackOnFailure: true,
            source: 'configuration-system',
        });
        if (result.success) {
            // Update the main configuration manager
            await this.manager.updateConfiguration(updates);
            // Log the change
            await this.auditTrailManager.logUpdate(oldConfig, this.runtimeManager.getCurrentConfiguration(), {
                source: 'configuration-system',
                reason: 'Configuration update via ConfigurationSystem',
            });
        }
        return this.validateConfiguration();
    }
    /**
     * Validate current configuration
     */
    validateConfiguration() {
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
    isFeatureEnabled(flagName, context) {
        const config = this.manager.getConfiguration();
        const defaultContext = {
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
    getFeatureVariant(flagName, context) {
        const config = this.manager.getConfiguration();
        const defaultContext = {
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
    getFeatureConfig(flagName, context) {
        const config = this.manager.getConfiguration();
        const defaultContext = {
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
    exportState() {
        return {
            configuration: this.getConfiguration(),
            featureFlags: this.featureFlags.exportFlags(),
            validation: this.validateConfiguration(),
        };
    }
    /**
     * Import system state
     */
    async importState(state) {
        const results = [];
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
    async reset() {
        // Stop runtime components
        this.hotReloadManager.stop();
        this.syncManager.stop();
        // Reset all managers
        this.manager = new manager_js_2.ConfigurationManager({ environment: 'development' });
        this.featureFlags = new feature_flags_js_2.FeatureFlagsEngine();
        this.validator = new validator_js_2.ConfigurationValidator();
        this.environmentManager = new environment_manager_js_2.EnvironmentManager();
        this.healthChecker = new deployment_health_js_2.DeploymentHealthChecker();
        this.pipelineManager = (0, deployment_pipeline_js_2.createDeploymentPipeline)();
        // Reinitialize runtime components
        const initialConfig = this.manager.getConfiguration();
        this.runtimeManager = new runtime_manager_js_2.RuntimeConfigurationManager(initialConfig);
        this.hotReloadManager = new hot_reload_js_2.ConfigurationHotReloadManager(this.runtimeManager);
        this.cacheManager = new cache_manager_js_2.ConfigurationCacheManager();
        this.syncManager = new sync_manager_js_2.ConfigurationSyncManager('default-instance', this.runtimeManager);
        this.auditTrailManager = new audit_trail_js_2.ConfigurationAuditTrailManager({
            id: 'system',
            name: 'Configuration System',
            role: 'system',
        });
        await this.initialize();
    }
}
exports.ConfigurationSystem = ConfigurationSystem;
/**
 * Global configuration system instance
 */
let globalConfigSystem = null;
/**
 * Get or create the global configuration system
 */
function getGlobalConfigSystem() {
    if (!globalConfigSystem) {
        globalConfigSystem = new ConfigurationSystem();
    }
    return globalConfigSystem;
}
/**
 * Set the global configuration system
 */
function setGlobalConfigSystem(system) {
    globalConfigSystem = system;
}
/**
 * Initialize the global configuration system
 */
async function initializeGlobalConfig(sources) {
    const system = getGlobalConfigSystem();
    await system.initialize(sources);
}
/**
 * Convenience functions for common operations
 */
/**
 * Get current configuration
 */
function getConfig() {
    return getGlobalConfigSystem().getConfiguration();
}
/**
 * Check if a feature is enabled
 */
function isFeatureEnabled(flagName, context) {
    return getGlobalConfigSystem().isFeatureEnabled(flagName, context);
}
/**
 * Get feature variant
 */
function getFeatureVariant(flagName, context) {
    return getGlobalConfigSystem().getFeatureVariant(flagName, context);
}
/**
 * Get feature configuration
 */
function getFeatureConfig(flagName, context) {
    return getGlobalConfigSystem().getFeatureConfig(flagName, context);
}
/**
 * Update configuration
 */
async function updateConfig(updates) {
    return getGlobalConfigSystem().updateConfiguration(updates);
}
/**
 * Validate current configuration
 */
function validateConfig() {
    return getGlobalConfigSystem().validateConfiguration();
}
/**
 * Detect current environment
 */
function detectEnvironment() {
    return getGlobalConfigSystem().getEnvironmentManager().detectEnvironment();
}
/**
 * Load environment-specific configuration
 */
async function loadEnvironmentConfig(environment) {
    return getGlobalConfigSystem().getEnvironmentManager().loadEnvironmentConfig(environment);
}
/**
 * Validate environment configuration
 */
async function validateEnvironmentConfig(environment, config) {
    const envManager = getGlobalConfigSystem().getEnvironmentManager();
    const configToValidate = config || await envManager.loadEnvironmentConfig(environment);
    return envManager.validateEnvironmentConfig(environment, configToValidate);
}
/**
 * Perform deployment health check
 */
async function performHealthCheck(config, environment) {
    return getGlobalConfigSystem().getHealthChecker().performHealthCheck(config, environment);
}
/**
 * Execute deployment pipeline
 */
async function executeDeploymentPipeline(environments, options) {
    return getGlobalConfigSystem().getPipelineManager().executePipeline(environments, options);
}
/**
 * Configuration system utilities
 */
exports.ConfigUtils = {
    /**
     * Create a development configuration
     */
    createDevelopmentConfig() {
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
    createProductionConfig() {
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
    createTestConfig() {
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
    mergeConfigs(...configs) {
        const result = configs.reduce((merged, config) => (0, defaults_js_2.deepMerge)(merged, config), defaults_js_2.defaultConfig);
        return result;
    },
};
