"use strict";
/**
 * Runtime Configuration Manager - Phase 2.4: Runtime Configuration
 *
 * Dynamic configuration management system that handles runtime updates,
 * thread-safe operations, rollback capabilities, and integration with
 * the existing configuration system.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeConfigurationManager = void 0;
exports.getGlobalRuntimeManager = getGlobalRuntimeManager;
exports.setGlobalRuntimeManager = setGlobalRuntimeManager;
exports.updateRuntimeConfiguration = updateRuntimeConfiguration;
exports.getRuntimeConfiguration = getRuntimeConfiguration;
exports.rollbackRuntimeConfiguration = rollbackRuntimeConfiguration;
const validator_js_1 = require("./validator.js");
const defaults_js_1 = require("./defaults.js");
/**
 * Configuration lock for thread safety
 */
class ConfigurationLock {
    constructor() {
        this.locked = false;
        this.queue = [];
    }
    async acquire() {
        return new Promise((resolve) => {
            if (!this.locked) {
                this.locked = true;
                resolve();
            }
            else {
                this.queue.push(resolve);
            }
        });
    }
    release() {
        this.locked = false;
        const next = this.queue.shift();
        if (next) {
            this.locked = true;
            next();
        }
    }
    isLocked() {
        return this.locked;
    }
}
/**
 * Runtime Configuration Manager
 */
class RuntimeConfigurationManager {
    constructor(initialConfig) {
        this.snapshots = new Map();
        this.watchers = new Set();
        this.lock = new ConfigurationLock();
        this.maxSnapshots = 10;
        this.updateCounter = 0;
        this.currentConfig = { ...initialConfig };
        this.validator = new validator_js_1.ConfigurationValidator();
        // Create initial snapshot
        this.createSnapshot('initial', 'system');
    }
    /**
     * Get current configuration (thread-safe read)
     */
    getCurrentConfiguration() {
        return { ...this.currentConfig };
    }
    /**
     * Update configuration at runtime
     */
    async updateConfiguration(updates, options = {}) {
        const { validate = true, rollbackOnFailure = true, notifyWatchers = true, source = 'runtime', metadata = {}, } = options;
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
            const newConfig = (0, defaults_js_1.deepMerge)(this.currentConfig, updates);
            // Validate new configuration if requested
            let validation;
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
        }
        catch (error) {
            // Perform rollback if enabled and we have a snapshot
            let rollbackPerformed = false;
            if (rollbackOnFailure && this.snapshots.size > 0) {
                try {
                    const lastSnapshot = Array.from(this.snapshots.values()).pop();
                    if (lastSnapshot) {
                        this.currentConfig = { ...lastSnapshot.config };
                        rollbackPerformed = true;
                    }
                }
                catch (rollbackError) {
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
        }
        finally {
            this.lock.release();
        }
    }
    /**
     * Update a specific configuration path
     */
    async updateConfigurationPath(path, value, options = {}) {
        const updates = this.createNestedUpdate(path, value);
        return this.updateConfiguration(updates, options);
    }
    /**
     * Rollback to a specific snapshot
     */
    async rollbackToSnapshot(snapshotId) {
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
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error)),
                affectedPaths: [],
                timestamp: new Date().toISOString(),
            };
        }
        finally {
            this.lock.release();
        }
    }
    /**
     * Create a configuration snapshot
     */
    createSnapshot(id, source, metadata = {}) {
        const snapshot = {
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
    getSnapshots() {
        return Array.from(this.snapshots.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    /**
     * Get a specific snapshot
     */
    getSnapshot(id) {
        return this.snapshots.get(id);
    }
    /**
     * Delete a snapshot
     */
    deleteSnapshot(id) {
        return this.snapshots.delete(id);
    }
    /**
     * Watch for configuration changes
     */
    watchConfiguration(callback) {
        this.watchers.add(callback);
    }
    /**
     * Stop watching configuration changes
     */
    unwatchConfiguration(callback) {
        this.watchers.delete(callback);
    }
    /**
     * Clear all watchers
     */
    clearWatchers() {
        this.watchers.clear();
    }
    /**
     * Get configuration value by path
     */
    getConfigurationValue(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this.currentConfig);
    }
    /**
     * Check if configuration path exists
     */
    hasConfigurationPath(path) {
        return this.getConfigurationValue(path) !== undefined;
    }
    /**
     * Validate current configuration
     */
    async validateCurrentConfiguration() {
        return this.validator.validate(this.currentConfig);
    }
    /**
     * Get runtime statistics
     */
    getRuntimeStatistics() {
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
    exportState() {
        return {
            config: this.getCurrentConfiguration(),
            snapshots: this.getSnapshots(),
            statistics: this.getRuntimeStatistics(),
        };
    }
    /**
     * Import runtime state
     */
    async importState(state) {
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
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error)),
                affectedPaths: [],
                timestamp: new Date().toISOString(),
            };
        }
        finally {
            this.lock.release();
        }
    }
    /**
     * Reset to initial configuration
     */
    async reset() {
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
    async notifyWatchers(event) {
        const promises = Array.from(this.watchers).map(async (callback) => {
            try {
                await callback(event);
            }
            catch (error) {
                console.error('Configuration watcher callback error:', error);
            }
        });
        await Promise.allSettled(promises);
    }
    /**
     * Get paths affected by configuration updates
     */
    getAffectedPaths(updates) {
        const paths = [];
        const traverse = (obj, prefix = '') => {
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
    createNestedUpdate(path, value) {
        const keys = path.split('.');
        const result = {};
        let current = result;
        for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = {};
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        return result;
    }
}
exports.RuntimeConfigurationManager = RuntimeConfigurationManager;
/**
 * Global runtime configuration manager instance
 */
let globalRuntimeManager = null;
/**
 * Get or create the global runtime configuration manager
 */
function getGlobalRuntimeManager(initialConfig) {
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
function setGlobalRuntimeManager(manager) {
    globalRuntimeManager = manager;
}
/**
 * Convenience function to update configuration at runtime
 */
async function updateRuntimeConfiguration(updates, options) {
    if (!globalRuntimeManager) {
        throw new Error('Runtime configuration manager not initialized');
    }
    return globalRuntimeManager.updateConfiguration(updates, options);
}
/**
 * Convenience function to get current runtime configuration
 */
function getRuntimeConfiguration() {
    if (!globalRuntimeManager) {
        throw new Error('Runtime configuration manager not initialized');
    }
    return globalRuntimeManager.getCurrentConfiguration();
}
/**
 * Convenience function to rollback configuration
 */
async function rollbackRuntimeConfiguration(snapshotId) {
    if (!globalRuntimeManager) {
        throw new Error('Runtime configuration manager not initialized');
    }
    return globalRuntimeManager.rollbackToSnapshot(snapshotId);
}
