"use strict";
/**
 * Configuration Manager - Phase 2: Configuration Management
 *
 * Centralized configuration management system that handles loading,
 * validation, merging, and runtime updates of configuration across
 * all deployment environments.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationManager = void 0;
exports.createConfigurationManager = createConfigurationManager;
exports.getGlobalConfigManager = getGlobalConfigManager;
exports.setGlobalConfigManager = setGlobalConfigManager;
const defaults_js_1 = require("./defaults.js");
const validator_js_1 = require("./validator.js");
const feature_flags_js_1 = require("./feature-flags.js");
/**
 * Environment variable configuration loader
 */
class EnvironmentLoader {
    async load() {
        const config = {};
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
                environment: process.env.NODE_ENV || 'development',
                description: 'OpenAI Assistants MCP Server',
            };
        }
        // Load deployment configuration from environment
        if (process.env.DEBUG || process.env.LOG_LEVEL || process.env.DEPLOYMENT_TYPE) {
            config.deployment = {
                type: process.env.DEPLOYMENT_TYPE || 'local',
                transport: process.env.TRANSPORT_TYPE || 'stdio',
                debug: process.env.DEBUG === 'true',
                logLevel: process.env.LOG_LEVEL || 'info',
                region: 'auto',
                timezone: 'UTC',
            };
        }
        // Load feature flags from environment
        const features = {};
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
class FileLoader {
    constructor(filePath) {
        this.filePath = filePath;
    }
    async load() {
        try {
            // In a real implementation, this would read from the file system
            // For now, return empty config as file loading is optional
            return {};
        }
        catch (error) {
            console.warn(`Failed to load configuration from ${this.filePath}:`, error);
            return {};
        }
    }
}
/**
 * Runtime configuration loader for dynamic updates
 */
class RuntimeLoader {
    constructor() {
        this.runtimeConfig = {};
    }
    async load() {
        return this.runtimeConfig;
    }
    updateConfig(updates) {
        this.runtimeConfig = (0, defaults_js_1.deepMerge)(this.runtimeConfig, updates);
    }
    clearConfig() {
        this.runtimeConfig = {};
    }
}
/**
 * Configuration change watcher
 */
class ConfigurationChangeWatcher {
    constructor() {
        this.callbacks = [];
        this.watching = false;
    }
    watch(callback) {
        this.callbacks.push(callback);
        this.watching = true;
    }
    unwatch() {
        this.callbacks = [];
        this.watching = false;
    }
    isWatching() {
        return this.watching;
    }
    async notifyChange(event) {
        for (const callback of this.callbacks) {
            try {
                await callback(event);
            }
            catch (error) {
                console.error('Configuration change callback error:', error);
            }
        }
    }
}
/**
 * Main Configuration Manager class
 */
class ConfigurationManager {
    constructor(options) {
        this.options = {
            validation: { enabled: true, strict: false },
            caching: { enabled: true, ttl: 300000 },
            watching: { enabled: true, debounce: 1000 },
            ...options,
        };
        this.validator = new validator_js_1.ConfigurationValidator();
        this.featureFlags = new feature_flags_js_1.FeatureFlagsEngine();
        this.watcher = new ConfigurationChangeWatcher();
        this.runtimeLoader = new RuntimeLoader();
        // Initialize default sources
        this.sources = this.createDefaultSources();
        // Start with default configuration
        this.config = { ...defaults_js_1.defaultConfig };
    }
    /**
     * Load and merge configuration from all sources
     */
    async loadConfiguration() {
        try {
            // Start with default configuration
            let mergedConfig = { ...defaults_js_1.defaultConfig };
            // Apply environment-specific overrides
            const envOverrides = (0, defaults_js_1.getEnvironmentOverrides)(this.options.environment);
            if (envOverrides && Object.keys(envOverrides).length > 0) {
                mergedConfig = (0, defaults_js_1.deepMerge)(mergedConfig, envOverrides);
            }
            // Load and merge from all sources in priority order
            const sortedSources = this.sources.sort((a, b) => a.priority - b.priority);
            for (const source of sortedSources) {
                try {
                    const sourceConfig = await source.loader.load();
                    if (sourceConfig && Object.keys(sourceConfig).length > 0) {
                        mergedConfig = (0, defaults_js_1.deepMerge)(mergedConfig, sourceConfig);
                    }
                }
                catch (error) {
                    console.warn(`Failed to load configuration from source ${source.name}:`, error);
                }
            }
            // Validate the merged configuration
            if (this.options.validation?.enabled) {
                const validation = await this.validator.validate(mergedConfig);
                if (!validation.isValid) {
                    if (this.options.validation.strict) {
                        throw new Error(`Configuration validation failed: ${validation.errors.map((e) => e.message).join(', ')}`);
                    }
                    else {
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
        }
        catch (error) {
            console.error('Failed to load configuration:', error);
            throw error;
        }
    }
    /**
     * Get current configuration
     */
    getConfiguration() {
        return { ...this.config };
    }
    /**
     * Get configuration value by path
     */
    get(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this.config);
    }
    /**
     * Update configuration at runtime
     */
    async updateConfiguration(updates) {
        try {
            // Validate updates if validation is enabled
            if (this.options.validation?.enabled) {
                const testConfig = (0, defaults_js_1.deepMerge)(this.config, updates);
                const validation = await this.validator.validate(testConfig);
                if (!validation.isValid && this.options.validation.strict) {
                    throw new Error(`Configuration update validation failed: ${validation.errors.map((e) => e.message).join(', ')}`);
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
        }
        catch (error) {
            console.error('Failed to update configuration:', error);
            throw error;
        }
    }
    /**
     * Watch for configuration changes
     */
    watchConfiguration(callback) {
        if (this.options.watching?.enabled) {
            this.watcher.watch(callback);
        }
    }
    /**
     * Stop watching configuration changes
     */
    unwatchConfiguration() {
        this.watcher.unwatch();
    }
    /**
     * Check if a feature is enabled
     */
    isFeatureEnabled(feature) {
        return this.featureFlags.evaluate(feature, this.createEvaluationContext());
    }
    /**
     * Get feature configuration
     */
    getFeatureConfig(feature) {
        return this.get(`features.${feature}`);
    }
    /**
     * Validate current configuration
     */
    async validateConfiguration() {
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
    createDefaultSources() {
        return [
            {
                name: 'default',
                type: 'default',
                priority: 1,
                loader: {
                    load: async () => defaults_js_1.defaultConfig,
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
    createEvaluationContext() {
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
    addSource(source) {
        this.sources.push(source);
        this.sources.sort((a, b) => a.priority - b.priority);
    }
    /**
     * Remove a configuration source
     */
    removeSource(name) {
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
    getSources() {
        return [...this.sources];
    }
    /**
     * Reload configuration from all sources
     */
    async reload() {
        return this.loadConfiguration();
    }
    /**
     * Reset configuration to defaults
     */
    async reset() {
        this.runtimeLoader.clearConfig();
        return this.loadConfiguration();
    }
}
exports.ConfigurationManager = ConfigurationManager;
/**
 * Create a configuration manager with default options
 */
function createConfigurationManager(environment, options = {}) {
    return new ConfigurationManager({
        environment,
        ...options,
    });
}
/**
 * Global configuration manager instance
 */
let globalConfigManager = null;
/**
 * Get or create the global configuration manager
 */
function getGlobalConfigManager(environment) {
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
function setGlobalConfigManager(manager) {
    globalConfigManager = manager;
}
