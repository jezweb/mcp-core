"use strict";
/**
 * Configuration Caching System - Phase 2.4: Runtime Configuration
 *
 * Intelligent configuration caching with TTL, multi-level caching,
 * cache invalidation strategies, and performance metrics tracking.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationCacheManager = void 0;
exports.getGlobalCacheManager = getGlobalCacheManager;
exports.setGlobalCacheManager = setGlobalCacheManager;
exports.getCachedConfig = getCachedConfig;
exports.setCachedConfig = setCachedConfig;
/**
 * LRU Cache implementation
 */
class LRUCache {
    constructor(maxSize) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.stats = {
            hits: 0,
            misses: 0,
            hitRate: 0,
            totalEntries: 0,
            totalSize: 0,
            averageAccessTime: 0,
            evictions: 0,
        };
    }
    get(key) {
        const startTime = performance.now();
        const entry = this.cache.get(key);
        if (!entry) {
            this.stats.misses++;
            this.updateHitRate();
            return undefined;
        }
        // Check TTL
        if (this.isExpired(entry)) {
            this.cache.delete(key);
            this.stats.misses++;
            this.updateHitRate();
            return undefined;
        }
        // Update access metadata
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, entry);
        this.stats.hits++;
        this.updateHitRate();
        this.updateAverageAccessTime(performance.now() - startTime);
        return entry.value;
    }
    set(key, value, ttl) {
        const entry = {
            key,
            value,
            timestamp: Date.now(),
            ttl: ttl || 300000, // 5 minutes default
            accessCount: 0,
            lastAccessed: Date.now(),
            size: this.calculateSize(value),
            metadata: {},
        };
        // Remove existing entry if present
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        // Evict if necessary
        while (this.cache.size >= this.maxSize) {
            this.evictLRU();
        }
        this.cache.set(key, entry);
        this.updateStats();
    }
    delete(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.updateStats();
        }
        return deleted;
    }
    clear() {
        this.cache.clear();
        this.updateStats();
    }
    has(key) {
        const entry = this.cache.get(key);
        return entry ? !this.isExpired(entry) : false;
    }
    keys() {
        return Array.from(this.cache.keys());
    }
    size() {
        return this.cache.size;
    }
    getStats() {
        return { ...this.stats };
    }
    isExpired(entry) {
        return Date.now() - entry.timestamp > entry.ttl;
    }
    evictLRU() {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
            this.cache.delete(firstKey);
            this.stats.evictions++;
            this.stats.lastEviction = Date.now();
        }
    }
    calculateSize(value) {
        // Simple size calculation - in production, use more sophisticated method
        return JSON.stringify(value).length * 2; // Rough estimate for UTF-16
    }
    updateHitRate() {
        const total = this.stats.hits + this.stats.misses;
        this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
    }
    updateAverageAccessTime(accessTime) {
        const totalAccesses = this.stats.hits + this.stats.misses;
        this.stats.averageAccessTime =
            (this.stats.averageAccessTime * (totalAccesses - 1) + accessTime) / totalAccesses;
    }
    updateStats() {
        this.stats.totalEntries = this.cache.size;
        this.stats.totalSize = Array.from(this.cache.values())
            .reduce((total, entry) => total + entry.size, 0);
    }
}
/**
 * Persistent cache storage (mock implementation)
 */
class PersistentCacheStorage {
    constructor(filePath) {
        this.filePath = filePath;
    }
    async save(data) {
        try {
            // Mock persistence - in real implementation, use fs.writeFile
            console.debug(`Saving cache to ${this.filePath}`, Object.keys(data).length, 'entries');
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        catch (error) {
            console.error('Failed to save cache:', error);
        }
    }
    async load() {
        try {
            // Mock loading - in real implementation, use fs.readFile
            console.debug(`Loading cache from ${this.filePath}`);
            await new Promise(resolve => setTimeout(resolve, 10));
            // Return empty cache for mock
            return {};
        }
        catch (error) {
            console.error('Failed to load cache:', error);
            return null;
        }
    }
    async clear() {
        try {
            // Mock clearing - in real implementation, delete file
            console.debug(`Clearing cache file ${this.filePath}`);
            await new Promise(resolve => setTimeout(resolve, 5));
        }
        catch (error) {
            console.error('Failed to clear cache file:', error);
        }
    }
}
/**
 * Configuration Cache Manager
 */
class ConfigurationCacheManager {
    constructor(options = {}) {
        this.invalidationCallbacks = new Set();
        this.options = {
            maxSize: 1000,
            defaultTtl: 300000, // 5 minutes
            strategy: 'lru',
            enablePersistence: false,
            enableMetrics: true,
            enableWarming: false,
            compressionEnabled: false,
            maxMemoryUsage: 50 * 1024 * 1024, // 50MB
            ...options,
        };
        this.memoryCache = new LRUCache(this.options.maxSize);
        this.compressionEnabled = this.options.compressionEnabled;
        // Initialize persistent storage if enabled
        if (this.options.enablePersistence && this.options.persistencePath) {
            this.persistentStorage = new PersistentCacheStorage(this.options.persistencePath);
        }
        // Initialize cache warming
        this.warmingConfig = {
            enabled: this.options.enableWarming,
            keys: this.options.warmingKeys || [],
            warmingStrategy: 'lazy',
        };
        // Load persistent cache if available
        if (this.persistentStorage) {
            this.loadPersistentCache();
        }
    }
    /**
     * Get value from cache
     */
    async get(key) {
        // Try memory cache first
        let value = this.memoryCache.get(key);
        if (value !== undefined) {
            return this.decompress(value);
        }
        // Try persistent storage if enabled
        if (this.persistentStorage) {
            const persistentData = await this.persistentStorage.load();
            if (persistentData && persistentData[key]) {
                const entry = persistentData[key];
                // Check if still valid
                if (!this.isExpired(entry)) {
                    // Add back to memory cache
                    this.memoryCache.set(key, entry.value, entry.ttl);
                    return this.decompress(entry.value);
                }
            }
        }
        return undefined;
    }
    /**
     * Set value in cache
     */
    async set(key, value, ttl) {
        const compressedValue = this.compress(value);
        const effectiveTtl = ttl || this.options.defaultTtl;
        // Set in memory cache
        this.memoryCache.set(key, compressedValue, effectiveTtl);
        // Persist if enabled
        if (this.persistentStorage) {
            await this.persistToStorage();
        }
    }
    /**
     * Delete value from cache
     */
    async delete(key) {
        const memoryDeleted = this.memoryCache.delete(key);
        // Remove from persistent storage if enabled
        if (this.persistentStorage) {
            await this.persistToStorage();
        }
        return memoryDeleted;
    }
    /**
     * Clear entire cache
     */
    async clear() {
        this.memoryCache.clear();
        if (this.persistentStorage) {
            await this.persistentStorage.clear();
        }
    }
    /**
     * Check if key exists in cache
     */
    async has(key) {
        if (this.memoryCache.has(key)) {
            return true;
        }
        // Check persistent storage
        if (this.persistentStorage) {
            const persistentData = await this.persistentStorage.load();
            if (persistentData && persistentData[key]) {
                const entry = persistentData[key];
                return !this.isExpired(entry);
            }
        }
        return false;
    }
    /**
     * Get cache statistics
     */
    getStatistics() {
        const memoryStats = this.memoryCache.getStats();
        return {
            ...memoryStats,
            memoryUsage: this.calculateMemoryUsage(),
            persistentEnabled: !!this.persistentStorage,
            warmingEnabled: this.warmingConfig.enabled,
        };
    }
    /**
     * Invalidate cache entries based on strategy
     */
    async invalidate(strategy, pattern) {
        let invalidatedCount = 0;
        switch (strategy) {
            case 'all':
                await this.clear();
                invalidatedCount = this.memoryCache.size();
                break;
            case 'expired':
                const keys = this.memoryCache.keys();
                for (const key of keys) {
                    const entry = this.memoryCache.get(key);
                    if (entry && this.isExpired({
                        timestamp: Date.now() - this.options.defaultTtl - 1000,
                        ttl: this.options.defaultTtl
                    })) {
                        await this.delete(key);
                        invalidatedCount++;
                    }
                }
                break;
            case 'pattern':
                if (pattern) {
                    const regex = new RegExp(pattern);
                    const keys = this.memoryCache.keys();
                    for (const key of keys) {
                        if (regex.test(key)) {
                            await this.delete(key);
                            invalidatedCount++;
                        }
                    }
                }
                break;
        }
        return invalidatedCount;
    }
    /**
     * Warm cache with predefined keys
     */
    async warmCache(config) {
        const warmingConfig = { ...this.warmingConfig, ...config };
        if (!warmingConfig.enabled || !warmingConfig.keys.length) {
            return;
        }
        for (const key of warmingConfig.keys) {
            try {
                // Check if key already exists
                if (await this.has(key)) {
                    continue;
                }
                // Load warming data if available
                if (warmingConfig.preloadData && warmingConfig.preloadData[key]) {
                    await this.set(key, warmingConfig.preloadData[key]);
                }
            }
            catch (error) {
                console.error(`Failed to warm cache for key ${key}:`, error);
            }
        }
    }
    /**
     * Watch for configuration changes to invalidate cache
     */
    watchConfigurationChanges(callback) {
        this.invalidationCallbacks.add(callback);
    }
    /**
     * Stop watching configuration changes
     */
    unwatchConfigurationChanges(callback) {
        this.invalidationCallbacks.delete(callback);
    }
    /**
     * Handle configuration change events
     */
    async handleConfigurationChange(event) {
        if (this.options.strategy === 'event-driven') {
            // Invalidate related cache entries
            const affectedKeys = this.getAffectedCacheKeys(event);
            for (const key of affectedKeys) {
                await this.delete(key);
            }
        }
        // Notify callbacks
        for (const callback of this.invalidationCallbacks) {
            try {
                await callback(event);
            }
            catch (error) {
                console.error('Cache invalidation callback error:', error);
            }
        }
    }
    /**
     * Update cache options
     */
    updateOptions(options) {
        this.options = { ...this.options, ...options };
        // Recreate memory cache if max size changed
        if (options.maxSize && options.maxSize !== this.memoryCache.size()) {
            const oldCache = this.memoryCache;
            this.memoryCache = new LRUCache(options.maxSize);
            // Migrate existing entries
            const keys = oldCache.keys();
            for (const key of keys.slice(0, options.maxSize)) {
                const value = oldCache.get(key);
                if (value !== undefined) {
                    this.memoryCache.set(key, value);
                }
            }
        }
    }
    /**
     * Export cache state
     */
    async exportState() {
        const entries = {};
        const keys = this.memoryCache.keys();
        for (const key of keys) {
            const value = this.memoryCache.get(key);
            if (value !== undefined) {
                entries[key] = {
                    key,
                    value,
                    timestamp: Date.now(),
                    ttl: this.options.defaultTtl,
                    accessCount: 0,
                    lastAccessed: Date.now(),
                    size: JSON.stringify(value).length,
                };
            }
        }
        return {
            entries,
            statistics: this.getStatistics(),
            options: this.options,
        };
    }
    /**
     * Import cache state
     */
    async importState(state) {
        // Update options if provided
        if (state.options) {
            this.updateOptions(state.options);
        }
        // Clear existing cache
        await this.clear();
        // Import entries
        for (const [key, entry] of Object.entries(state.entries)) {
            if (!this.isExpired(entry)) {
                await this.set(key, entry.value, entry.ttl);
            }
        }
    }
    /**
     * Load persistent cache
     */
    async loadPersistentCache() {
        if (!this.persistentStorage) {
            return;
        }
        try {
            const data = await this.persistentStorage.load();
            if (data) {
                for (const [key, entry] of Object.entries(data)) {
                    if (!this.isExpired(entry)) {
                        this.memoryCache.set(key, entry.value, entry.ttl);
                    }
                }
            }
        }
        catch (error) {
            console.error('Failed to load persistent cache:', error);
        }
    }
    /**
     * Persist cache to storage
     */
    async persistToStorage() {
        if (!this.persistentStorage) {
            return;
        }
        try {
            const entries = {};
            const keys = this.memoryCache.keys();
            for (const key of keys) {
                const value = this.memoryCache.get(key);
                if (value !== undefined) {
                    entries[key] = {
                        key,
                        value,
                        timestamp: Date.now(),
                        ttl: this.options.defaultTtl,
                        accessCount: 0,
                        lastAccessed: Date.now(),
                        size: JSON.stringify(value).length,
                    };
                }
            }
            await this.persistentStorage.save(entries);
        }
        catch (error) {
            console.error('Failed to persist cache:', error);
        }
    }
    /**
     * Check if cache entry is expired
     */
    isExpired(entry) {
        return Date.now() - entry.timestamp > entry.ttl;
    }
    /**
     * Compress value if compression is enabled
     */
    compress(value) {
        if (!this.compressionEnabled) {
            return value;
        }
        // Mock compression - in real implementation, use compression library
        return value;
    }
    /**
     * Decompress value if compression is enabled
     */
    decompress(value) {
        if (!this.compressionEnabled) {
            return value;
        }
        // Mock decompression - in real implementation, use compression library
        return value;
    }
    /**
     * Calculate current memory usage
     */
    calculateMemoryUsage() {
        const stats = this.memoryCache.getStats();
        return stats.totalSize;
    }
    /**
     * Get cache keys affected by configuration change
     */
    getAffectedCacheKeys(event) {
        // Simple implementation - in production, use more sophisticated mapping
        const affectedKeys = [];
        if (event.path) {
            // Find keys that might be related to the changed path
            const keys = this.memoryCache.keys();
            for (const key of keys) {
                if (key.includes(event.path) || event.path.includes(key)) {
                    affectedKeys.push(key);
                }
            }
        }
        return affectedKeys;
    }
}
exports.ConfigurationCacheManager = ConfigurationCacheManager;
/**
 * Global cache manager instance
 */
let globalCacheManager = null;
/**
 * Get or create the global cache manager
 */
function getGlobalCacheManager(options) {
    if (!globalCacheManager) {
        globalCacheManager = new ConfigurationCacheManager(options);
    }
    return globalCacheManager;
}
/**
 * Set the global cache manager
 */
function setGlobalCacheManager(manager) {
    globalCacheManager = manager;
}
/**
 * Convenience function to get cached configuration
 */
async function getCachedConfig(key) {
    if (!globalCacheManager) {
        throw new Error('Cache manager not initialized');
    }
    return globalCacheManager.get(key);
}
/**
 * Convenience function to cache configuration
 */
async function setCachedConfig(key, value, ttl) {
    if (!globalCacheManager) {
        throw new Error('Cache manager not initialized');
    }
    return globalCacheManager.set(key, value, ttl);
}
