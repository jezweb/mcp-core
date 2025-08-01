"use strict";
/**
 * Configuration Hot Reloading System - Phase 2.4: Runtime Configuration
 *
 * File system watching and automatic configuration reloading with debouncing,
 * graceful error handling, and support for both local files and remote sources.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationHotReloadManager = void 0;
exports.getGlobalHotReloadManager = getGlobalHotReloadManager;
exports.setGlobalHotReloadManager = setGlobalHotReloadManager;
exports.startHotReload = startHotReload;
exports.stopHotReload = stopHotReload;
const validator_js_1 = require("./validator.js");
/**
 * File system watcher (mock implementation for cross-platform compatibility)
 */
class FileSystemWatcher {
    constructor() {
        this.watchers = new Map();
        this.callbacks = new Set();
        this.lastModified = new Map();
    }
    watch(paths, callback) {
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
                            const event = {
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
                }
                catch (error) {
                    // File might not exist or be accessible
                    console.debug(`File watch error for ${path}:`, error);
                }
            }, 1000); // Poll every second
            this.watchers.set(path, interval);
        }
    }
    unwatch(path) {
        if (path) {
            const watcher = this.watchers.get(path);
            if (watcher) {
                clearInterval(watcher);
                this.watchers.delete(path);
                this.lastModified.delete(path);
            }
        }
        else {
            // Unwatch all
            for (const [watchPath, watcher] of this.watchers) {
                clearInterval(watcher);
            }
            this.watchers.clear();
            this.lastModified.clear();
            this.callbacks.clear();
        }
    }
    async getFileStats(path) {
        // Mock implementation - in real code, use fs.stat
        try {
            // Simulate file stats
            return {
                size: Math.floor(Math.random() * 10000),
                mtime: new Date(),
            };
        }
        catch {
            return null;
        }
    }
    notifyCallbacks(event) {
        for (const callback of this.callbacks) {
            try {
                callback(event);
            }
            catch (error) {
                console.error('File watch callback error:', error);
            }
        }
    }
}
/**
 * Remote configuration poller
 */
class RemoteConfigurationPoller {
    constructor() {
        this.pollers = new Map();
        this.callbacks = new Set();
        this.lastConfigs = new Map();
    }
    startPolling(sources, callback) {
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
                }
                catch (error) {
                    console.error(`Remote config polling error for ${source.name}:`, error);
                }
            }, source.pollInterval);
            this.pollers.set(source.name, interval);
        }
    }
    stopPolling(sourceName) {
        if (sourceName) {
            const poller = this.pollers.get(sourceName);
            if (poller) {
                clearInterval(poller);
                this.pollers.delete(sourceName);
                this.lastConfigs.delete(sourceName);
            }
        }
        else {
            // Stop all polling
            for (const [name, poller] of this.pollers) {
                clearInterval(poller);
            }
            this.pollers.clear();
            this.lastConfigs.clear();
            this.callbacks.clear();
        }
    }
    async fetchRemoteConfig(source) {
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
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    notifyCallbacks(source, config) {
        for (const callback of this.callbacks) {
            try {
                callback(source, config);
            }
            catch (error) {
                console.error('Remote config callback error:', error);
            }
        }
    }
}
/**
 * Configuration Hot Reload Manager
 */
class ConfigurationHotReloadManager {
    constructor(runtimeManager, options = {}) {
        this.callbacks = new Set();
        this.debounceTimers = new Map();
        this.isEnabled = false;
        this.runtimeManager = runtimeManager;
        this.validator = new validator_js_1.ConfigurationValidator();
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
    start() {
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
    stop() {
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
    onHotReload(callback) {
        this.callbacks.add(callback);
    }
    /**
     * Remove hot reload callback
     */
    offHotReload(callback) {
        this.callbacks.delete(callback);
    }
    /**
     * Manually trigger configuration reload
     */
    async triggerReload(source = 'manual') {
        try {
            // Load configuration from all sources
            const newConfig = await this.loadConfigurationFromSources();
            if (newConfig) {
                await this.applyConfigurationUpdate(newConfig, source);
            }
        }
        catch (error) {
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
    getStatus() {
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
    updateOptions(options) {
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
    handleFileChange(event) {
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
            }
            catch (error) {
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
    handleRemoteConfigChange(source, config) {
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
            }
            catch (error) {
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
    async applyConfigurationUpdate(config, source) {
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
            }
            else {
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
        }
        catch (error) {
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
    async loadConfigurationFromFile(path) {
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
        }
        catch (error) {
            console.error(`Failed to load configuration from ${path}:`, error);
            return null;
        }
    }
    /**
     * Load configuration from all sources
     */
    async loadConfigurationFromSources() {
        try {
            // Mock loading from multiple sources
            const configs = [];
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
        }
        catch (error) {
            console.error('Failed to load configuration from sources:', error);
            return null;
        }
    }
    /**
     * Notify all callbacks
     */
    notifyCallbacks(event) {
        for (const callback of this.callbacks) {
            try {
                callback(event);
            }
            catch (error) {
                console.error('Hot reload callback error:', error);
            }
        }
    }
}
exports.ConfigurationHotReloadManager = ConfigurationHotReloadManager;
/**
 * Global hot reload manager instance
 */
let globalHotReloadManager = null;
/**
 * Get or create the global hot reload manager
 */
function getGlobalHotReloadManager(runtimeManager, options) {
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
function setGlobalHotReloadManager(manager) {
    globalHotReloadManager = manager;
}
/**
 * Convenience function to start hot reloading
 */
function startHotReload() {
    if (!globalHotReloadManager) {
        throw new Error('Hot reload manager not initialized');
    }
    globalHotReloadManager.start();
}
/**
 * Convenience function to stop hot reloading
 */
function stopHotReload() {
    if (!globalHotReloadManager) {
        throw new Error('Hot reload manager not initialized');
    }
    globalHotReloadManager.stop();
}
