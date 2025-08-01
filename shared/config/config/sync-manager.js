"use strict";
/**
 * Configuration Synchronization Manager - Phase 2.4: Runtime Configuration
 *
 * Multi-instance configuration synchronization with conflict resolution,
 * distributed updates, versioning, and pub/sub pattern implementation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationSyncManager = void 0;
exports.getGlobalSyncManager = getGlobalSyncManager;
exports.setGlobalSyncManager = setGlobalSyncManager;
exports.startSync = startSync;
exports.stopSync = stopSync;
const validator_js_1 = require("./validator.js");
/**
 * Mock Pub/Sub implementation
 */
class MockPubSubClient {
    constructor(instanceId) {
        this.subscribers = new Map();
        this.instanceId = instanceId;
    }
    subscribe(channel, callback) {
        if (!this.subscribers.has(channel)) {
            this.subscribers.set(channel, new Set());
        }
        this.subscribers.get(channel).add(callback);
    }
    unsubscribe(channel, callback) {
        const channelSubscribers = this.subscribers.get(channel);
        if (channelSubscribers) {
            channelSubscribers.delete(callback);
            if (channelSubscribers.size === 0) {
                this.subscribers.delete(channel);
            }
        }
    }
    async publish(channel, message) {
        // Mock implementation - in real system, use Redis, NATS, or similar
        const channelSubscribers = this.subscribers.get(channel);
        if (channelSubscribers) {
            for (const callback of channelSubscribers) {
                try {
                    await callback(message);
                }
                catch (error) {
                    console.error('PubSub callback error:', error);
                }
            }
        }
    }
    disconnect() {
        this.subscribers.clear();
    }
}
/**
 * Configuration version manager
 */
class ConfigurationVersionManager {
    constructor(instanceId) {
        this.versionHistory = [];
        this.maxHistorySize = 100;
        this.currentVersion = {
            version: 1,
            timestamp: new Date().toISOString(),
            instanceId,
            checksum: this.generateChecksum({}),
        };
    }
    getCurrentVersion() {
        return { ...this.currentVersion };
    }
    incrementVersion(config, metadata) {
        const newVersion = {
            version: this.currentVersion.version + 1,
            timestamp: new Date().toISOString(),
            instanceId: this.currentVersion.instanceId,
            checksum: this.generateChecksum(config),
            metadata,
        };
        // Add to history
        this.versionHistory.push(this.currentVersion);
        if (this.versionHistory.length > this.maxHistorySize) {
            this.versionHistory.shift();
        }
        this.currentVersion = newVersion;
        return { ...newVersion };
    }
    getVersionHistory() {
        return [...this.versionHistory];
    }
    compareVersions(v1, v2) {
        if (v1.version !== v2.version) {
            return v1.version - v2.version;
        }
        // If versions are equal, compare timestamps
        const t1 = new Date(v1.timestamp).getTime();
        const t2 = new Date(v2.timestamp).getTime();
        return t1 - t2;
    }
    isNewer(v1, v2) {
        return this.compareVersions(v1, v2) > 0;
    }
    generateChecksum(config) {
        // Simple checksum implementation - in production, use crypto.createHash
        const str = JSON.stringify(config);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }
}
/**
 * Configuration Synchronization Manager
 */
class ConfigurationSyncManager {
    constructor(instanceId, runtimeManager, options = {}) {
        this.peers = new Map();
        this.syncCallbacks = new Set();
        this.isEnabled = false;
        this.instanceId = instanceId;
        this.runtimeManager = runtimeManager;
        this.validator = new validator_js_1.ConfigurationValidator();
        this.versionManager = new ConfigurationVersionManager(instanceId);
        this.pubSubClient = new MockPubSubClient(instanceId);
        this.options = {
            mode: 'bidirectional',
            conflictResolution: 'last-write-wins',
            syncInterval: 30000, // 30 seconds
            timeout: 10000,
            retries: 3,
            retryDelay: 1000,
            enableVersioning: true,
            enableConflictLogging: true,
            batchSize: 10,
            compressionEnabled: false,
            ...options,
        };
        this.setupPubSubSubscriptions();
    }
    /**
     * Start synchronization
     */
    start() {
        if (this.isEnabled) {
            return;
        }
        this.isEnabled = true;
        // Start periodic sync if in pull or bidirectional mode
        if (this.options.mode === 'pull' || this.options.mode === 'bidirectional') {
            this.syncInterval = setInterval(() => {
                this.performSync().catch(error => {
                    console.error('Periodic sync error:', error);
                });
            }, this.options.syncInterval);
        }
        // Watch for local configuration changes
        this.runtimeManager.watchConfiguration((event) => {
            this.handleLocalConfigurationChange(event);
        });
        this.notifyCallbacks({
            type: 'sync-start',
            instanceId: this.instanceId,
            timestamp: new Date().toISOString(),
            version: this.versionManager.getCurrentVersion(),
        });
    }
    /**
     * Stop synchronization
     */
    stop() {
        if (!this.isEnabled) {
            return;
        }
        this.isEnabled = false;
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = undefined;
        }
        this.pubSubClient.disconnect();
    }
    /**
     * Add sync peer
     */
    addPeer(peer) {
        const fullPeer = {
            ...peer,
            lastSeen: new Date().toISOString(),
            status: 'offline',
        };
        this.peers.set(peer.id, fullPeer);
    }
    /**
     * Remove sync peer
     */
    removePeer(peerId) {
        return this.peers.delete(peerId);
    }
    /**
     * Get all peers
     */
    getPeers() {
        return Array.from(this.peers.values());
    }
    /**
     * Get peer by ID
     */
    getPeer(peerId) {
        return this.peers.get(peerId);
    }
    /**
     * Manually trigger synchronization
     */
    async performSync() {
        if (!this.isEnabled) {
            return;
        }
        try {
            const currentConfig = this.runtimeManager.getCurrentConfiguration();
            const currentVersion = this.versionManager.getCurrentVersion();
            // Discover and sync with peers
            for (const peer of this.peers.values()) {
                try {
                    await this.syncWithPeer(peer, currentConfig, currentVersion);
                }
                catch (error) {
                    console.error(`Sync error with peer ${peer.id}:`, error);
                    this.updatePeerStatus(peer.id, 'offline');
                }
            }
            this.notifyCallbacks({
                type: 'sync-complete',
                instanceId: this.instanceId,
                timestamp: new Date().toISOString(),
                version: currentVersion,
                config: currentConfig,
            });
        }
        catch (error) {
            this.notifyCallbacks({
                type: 'sync-error',
                instanceId: this.instanceId,
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error : new Error(String(error)),
            });
        }
    }
    /**
     * Push configuration to peers
     */
    async pushConfiguration(config) {
        const configToPush = config || this.runtimeManager.getCurrentConfiguration();
        const version = this.versionManager.incrementVersion(configToPush);
        const message = {
            type: 'config-update',
            instanceId: this.instanceId,
            timestamp: new Date().toISOString(),
            payload: configToPush,
            version,
        };
        await this.pubSubClient.publish('config-updates', message);
    }
    /**
     * Pull configuration from peers
     */
    async pullConfiguration() {
        // Request latest configuration from peers
        const message = {
            type: 'version-update',
            instanceId: this.instanceId,
            timestamp: new Date().toISOString(),
            payload: { requestLatest: true },
            version: this.versionManager.getCurrentVersion(),
        };
        await this.pubSubClient.publish('version-updates', message);
    }
    /**
     * Resolve configuration conflict
     */
    async resolveConflict(conflict, strategy) {
        const resolutionStrategy = strategy || this.options.conflictResolution;
        let resolvedValue;
        switch (resolutionStrategy) {
            case 'last-write-wins':
                resolvedValue = this.versionManager.isNewer(conflict.remoteVersion, conflict.localVersion)
                    ? conflict.remoteValue
                    : conflict.localValue;
                break;
            case 'first-write-wins':
                resolvedValue = this.versionManager.isNewer(conflict.localVersion, conflict.remoteVersion)
                    ? conflict.remoteValue
                    : conflict.localValue;
                break;
            case 'merge':
                resolvedValue = this.mergeValues(conflict.localValue, conflict.remoteValue);
                break;
            case 'version-based':
                resolvedValue = conflict.remoteVersion.version > conflict.localVersion.version
                    ? conflict.remoteValue
                    : conflict.localValue;
                break;
            case 'manual':
            default:
                // Return conflict for manual resolution
                return conflict;
        }
        const resolvedConflict = {
            ...conflict,
            resolution: this.versionManager.isNewer(conflict.remoteVersion, conflict.localVersion) ? 'remote' : 'local',
            resolvedValue,
        };
        this.notifyCallbacks({
            type: 'conflict-resolved',
            instanceId: this.instanceId,
            timestamp: new Date().toISOString(),
            conflict: resolvedConflict,
        });
        return resolvedValue;
    }
    /**
     * Get synchronization status
     */
    getSyncStatus() {
        const onlinePeers = Array.from(this.peers.values()).filter(p => p.status === 'online').length;
        return {
            enabled: this.isEnabled,
            mode: this.options.mode,
            currentVersion: this.versionManager.getCurrentVersion(),
            peerCount: this.peers.size,
            onlinePeers,
        };
    }
    /**
     * Add sync event callback
     */
    onSync(callback) {
        this.syncCallbacks.add(callback);
    }
    /**
     * Remove sync event callback
     */
    offSync(callback) {
        this.syncCallbacks.delete(callback);
    }
    /**
     * Update sync options
     */
    updateOptions(options) {
        const wasEnabled = this.isEnabled;
        if (wasEnabled) {
            this.stop();
        }
        this.options = { ...this.options, ...options };
        if (wasEnabled) {
            this.start();
        }
    }
    /**
     * Export sync state
     */
    exportState() {
        return {
            instanceId: this.instanceId,
            version: this.versionManager.getCurrentVersion(),
            peers: this.getPeers(),
            options: this.options,
            versionHistory: this.versionManager.getVersionHistory(),
        };
    }
    /**
     * Import sync state
     */
    async importState(state) {
        // Import peers
        if (state.peers) {
            this.peers.clear();
            for (const peer of state.peers) {
                this.peers.set(peer.id, peer);
            }
        }
        // Import options
        if (state.options) {
            this.updateOptions(state.options);
        }
    }
    /**
     * Setup pub/sub subscriptions
     */
    setupPubSubSubscriptions() {
        // Subscribe to configuration updates
        this.pubSubClient.subscribe('config-updates', async (message) => {
            if (message.instanceId !== this.instanceId) {
                await this.handleRemoteConfigurationUpdate(message);
            }
        });
        // Subscribe to version updates
        this.pubSubClient.subscribe('version-updates', async (message) => {
            if (message.instanceId !== this.instanceId) {
                await this.handleVersionUpdate(message);
            }
        });
        // Subscribe to peer discovery
        this.pubSubClient.subscribe('peer-discovery', async (message) => {
            if (message.instanceId !== this.instanceId) {
                await this.handlePeerDiscovery(message);
            }
        });
    }
    /**
     * Handle local configuration changes
     */
    async handleLocalConfigurationChange(event) {
        if (this.options.mode === 'push' || this.options.mode === 'bidirectional') {
            const config = this.runtimeManager.getCurrentConfiguration();
            await this.pushConfiguration(config);
        }
    }
    /**
     * Handle remote configuration updates
     */
    async handleRemoteConfigurationUpdate(message) {
        try {
            const remoteConfig = message.payload;
            const remoteVersion = message.version;
            const currentVersion = this.versionManager.getCurrentVersion();
            // Check for conflicts
            const conflicts = this.detectConflicts(this.runtimeManager.getCurrentConfiguration(), remoteConfig, currentVersion, remoteVersion);
            if (conflicts.length > 0) {
                // Handle conflicts
                for (const conflict of conflicts) {
                    const resolvedValue = await this.resolveConflict(conflict);
                    if (resolvedValue !== conflict) {
                        // Apply resolved value
                        await this.runtimeManager.updateConfigurationPath(conflict.path, resolvedValue, { source: `sync:${message.instanceId}` });
                    }
                }
            }
            else {
                // No conflicts, apply update
                await this.runtimeManager.updateConfiguration(remoteConfig, {
                    source: `sync:${message.instanceId}`,
                    validate: true,
                });
            }
            // Update peer status
            this.updatePeerStatus(message.instanceId, 'online');
        }
        catch (error) {
            console.error('Error handling remote configuration update:', error);
        }
    }
    /**
     * Handle version updates
     */
    async handleVersionUpdate(message) {
        const payload = message.payload;
        if (payload.requestLatest && message.version) {
            // Peer is requesting latest configuration
            const currentConfig = this.runtimeManager.getCurrentConfiguration();
            const currentVersion = this.versionManager.getCurrentVersion();
            if (this.versionManager.isNewer(currentVersion, message.version)) {
                await this.pushConfiguration(currentConfig);
            }
        }
    }
    /**
     * Handle peer discovery
     */
    async handlePeerDiscovery(message) {
        const peerInfo = message.payload;
        if (!this.peers.has(message.instanceId)) {
            this.addPeer({
                id: message.instanceId,
                endpoint: peerInfo.endpoint || 'unknown',
                version: message.version || this.versionManager.getCurrentVersion(),
            });
        }
        this.updatePeerStatus(message.instanceId, 'online');
    }
    /**
     * Sync with a specific peer
     */
    async syncWithPeer(peer, currentConfig, currentVersion) {
        this.updatePeerStatus(peer.id, 'syncing');
        try {
            // Mock peer communication - in real implementation, use HTTP/gRPC/WebSocket
            await new Promise(resolve => setTimeout(resolve, 100));
            // Simulate successful sync
            this.updatePeerStatus(peer.id, 'online');
            peer.lastSeen = new Date().toISOString();
        }
        catch (error) {
            this.updatePeerStatus(peer.id, 'offline');
            throw error;
        }
    }
    /**
     * Update peer status
     */
    updatePeerStatus(peerId, status) {
        const peer = this.peers.get(peerId);
        if (peer) {
            peer.status = status;
            peer.lastSeen = new Date().toISOString();
        }
    }
    /**
     * Detect configuration conflicts
     */
    detectConflicts(localConfig, remoteConfig, localVersion, remoteVersion) {
        const conflicts = [];
        // Simple conflict detection - in production, use more sophisticated diff
        const localStr = JSON.stringify(localConfig);
        const remoteStr = JSON.stringify(remoteConfig);
        if (localStr !== remoteStr && localVersion.checksum !== remoteVersion.checksum) {
            conflicts.push({
                path: 'root',
                localValue: localConfig,
                remoteValue: remoteConfig,
                localVersion,
                remoteVersion,
            });
        }
        return conflicts;
    }
    /**
     * Merge two configuration values
     */
    mergeValues(localValue, remoteValue) {
        if (typeof localValue === 'object' && typeof remoteValue === 'object') {
            return { ...localValue, ...remoteValue };
        }
        // For non-objects, prefer remote value
        return remoteValue;
    }
    /**
     * Notify sync callbacks
     */
    notifyCallbacks(event) {
        for (const callback of this.syncCallbacks) {
            try {
                callback(event);
            }
            catch (error) {
                console.error('Sync callback error:', error);
            }
        }
    }
}
exports.ConfigurationSyncManager = ConfigurationSyncManager;
/**
 * Global sync manager instance
 */
let globalSyncManager = null;
/**
 * Get or create the global sync manager
 */
function getGlobalSyncManager(instanceId, runtimeManager, options) {
    if (!globalSyncManager) {
        if (!instanceId || !runtimeManager) {
            throw new Error('Instance ID and runtime manager required for first-time initialization');
        }
        globalSyncManager = new ConfigurationSyncManager(instanceId, runtimeManager, options);
    }
    return globalSyncManager;
}
/**
 * Set the global sync manager
 */
function setGlobalSyncManager(manager) {
    globalSyncManager = manager;
}
/**
 * Convenience function to start synchronization
 */
function startSync() {
    if (!globalSyncManager) {
        throw new Error('Sync manager not initialized');
    }
    globalSyncManager.start();
}
/**
 * Convenience function to stop synchronization
 */
function stopSync() {
    if (!globalSyncManager) {
        throw new Error('Sync manager not initialized');
    }
    globalSyncManager.stop();
}
