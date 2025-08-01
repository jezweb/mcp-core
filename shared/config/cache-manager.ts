/**
 * Configuration Caching System - Phase 2.4: Runtime Configuration
 * 
 * Intelligent configuration caching with TTL, multi-level caching,
 * cache invalidation strategies, and performance metrics tracking.
 */

import {
  MCPServerConfig,
  ConfigurationChangeEvent,
  ConfigChangeCallback,
} from '../types/config-types.js';

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  metadata?: Record<string, any>;
}

/**
 * Cache statistics
 */
export interface CacheStatistics {
  hits: number;
  misses: number;
  hitRate: number;
  totalEntries: number;
  totalSize: number;
  averageAccessTime: number;
  evictions: number;
  lastEviction?: number;
}

/**
 * Cache invalidation strategy
 */
export type CacheInvalidationStrategy = 
  | 'manual'      // Manual invalidation only
  | 'ttl'         // Time-based expiration
  | 'lru'         // Least Recently Used
  | 'lfu'         // Least Frequently Used
  | 'event-driven'; // Invalidate on configuration changes

/**
 * Cache configuration options
 */
export interface CacheOptions {
  maxSize: number;
  defaultTtl: number;
  strategy: CacheInvalidationStrategy;
  enablePersistence: boolean;
  persistencePath?: string;
  enableMetrics: boolean;
  enableWarming: boolean;
  warmingKeys?: string[];
  compressionEnabled: boolean;
  maxMemoryUsage: number; // in bytes
}

/**
 * Cache warming configuration
 */
export interface CacheWarmingConfig {
  enabled: boolean;
  keys: string[];
  preloadData?: Record<string, any>;
  warmingStrategy: 'eager' | 'lazy' | 'scheduled';
  scheduleInterval?: number;
}

/**
 * LRU Cache implementation
 */
class LRUCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private maxSize: number;
  private stats: CacheStatistics;

  constructor(maxSize: number) {
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

  get(key: string): T | undefined {
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

  set(key: string, value: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
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

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.updateStats();
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.updateStats();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry ? !this.isExpired(entry) : false;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): CacheStatistics {
    return { ...this.stats };
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictLRU(): void {
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.cache.delete(firstKey);
      this.stats.evictions++;
      this.stats.lastEviction = Date.now();
    }
  }

  private calculateSize(value: any): number {
    // Simple size calculation - in production, use more sophisticated method
    return JSON.stringify(value).length * 2; // Rough estimate for UTF-16
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  private updateAverageAccessTime(accessTime: number): void {
    const totalAccesses = this.stats.hits + this.stats.misses;
    this.stats.averageAccessTime = 
      (this.stats.averageAccessTime * (totalAccesses - 1) + accessTime) / totalAccesses;
  }

  private updateStats(): void {
    this.stats.totalEntries = this.cache.size;
    this.stats.totalSize = Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.size, 0);
  }
}

/**
 * Persistent cache storage (mock implementation)
 */
class PersistentCacheStorage {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async save(data: Record<string, CacheEntry>): Promise<void> {
    try {
      // Mock persistence - in real implementation, use fs.writeFile
      console.debug(`Saving cache to ${this.filePath}`, Object.keys(data).length, 'entries');
      await new Promise(resolve => setTimeout(resolve, 10));
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  }

  async load(): Promise<Record<string, CacheEntry> | null> {
    try {
      // Mock loading - in real implementation, use fs.readFile
      console.debug(`Loading cache from ${this.filePath}`);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Return empty cache for mock
      return {};
    } catch (error) {
      console.error('Failed to load cache:', error);
      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      // Mock clearing - in real implementation, delete file
      console.debug(`Clearing cache file ${this.filePath}`);
      await new Promise(resolve => setTimeout(resolve, 5));
    } catch (error) {
      console.error('Failed to clear cache file:', error);
    }
  }
}

/**
 * Configuration Cache Manager
 */
export class ConfigurationCacheManager {
  private memoryCache: LRUCache<any>;
  private persistentStorage?: PersistentCacheStorage;
  private options: CacheOptions;
  private warmingConfig: CacheWarmingConfig;
  private invalidationCallbacks: Set<ConfigChangeCallback> = new Set();
  private compressionEnabled: boolean;

  constructor(options: Partial<CacheOptions> = {}) {
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
  async get<T = any>(key: string): Promise<T | undefined> {
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
  async set<T = any>(key: string, value: T, ttl?: number): Promise<void> {
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
  async delete(key: string): Promise<boolean> {
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
  async clear(): Promise<void> {
    this.memoryCache.clear();

    if (this.persistentStorage) {
      await this.persistentStorage.clear();
    }
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
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
  getStatistics(): CacheStatistics & {
    memoryUsage: number;
    persistentEnabled: boolean;
    warmingEnabled: boolean;
  } {
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
  async invalidate(strategy: 'all' | 'expired' | 'pattern', pattern?: string): Promise<number> {
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
          } as CacheEntry)) {
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
  async warmCache(config?: Partial<CacheWarmingConfig>): Promise<void> {
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
      } catch (error) {
        console.error(`Failed to warm cache for key ${key}:`, error);
      }
    }
  }

  /**
   * Watch for configuration changes to invalidate cache
   */
  watchConfigurationChanges(callback: ConfigChangeCallback): void {
    this.invalidationCallbacks.add(callback);
  }

  /**
   * Stop watching configuration changes
   */
  unwatchConfigurationChanges(callback: ConfigChangeCallback): void {
    this.invalidationCallbacks.delete(callback);
  }

  /**
   * Handle configuration change events
   */
  async handleConfigurationChange(event: ConfigurationChangeEvent): Promise<void> {
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
      } catch (error) {
        console.error('Cache invalidation callback error:', error);
      }
    }
  }

  /**
   * Update cache options
   */
  updateOptions(options: Partial<CacheOptions>): void {
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
  async exportState(): Promise<{
    entries: Record<string, CacheEntry>;
    statistics: CacheStatistics;
    options: CacheOptions;
  }> {
    const entries: Record<string, CacheEntry> = {};
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
  async importState(state: {
    entries: Record<string, CacheEntry>;
    options?: Partial<CacheOptions>;
  }): Promise<void> {
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
  private async loadPersistentCache(): Promise<void> {
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
    } catch (error) {
      console.error('Failed to load persistent cache:', error);
    }
  }

  /**
   * Persist cache to storage
   */
  private async persistToStorage(): Promise<void> {
    if (!this.persistentStorage) {
      return;
    }

    try {
      const entries: Record<string, CacheEntry> = {};
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
    } catch (error) {
      console.error('Failed to persist cache:', error);
    }
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Compress value if compression is enabled
   */
  private compress(value: any): any {
    if (!this.compressionEnabled) {
      return value;
    }

    // Mock compression - in real implementation, use compression library
    return value;
  }

  /**
   * Decompress value if compression is enabled
   */
  private decompress(value: any): any {
    if (!this.compressionEnabled) {
      return value;
    }

    // Mock decompression - in real implementation, use compression library
    return value;
  }

  /**
   * Calculate current memory usage
   */
  private calculateMemoryUsage(): number {
    const stats = this.memoryCache.getStats();
    return stats.totalSize;
  }

  /**
   * Get cache keys affected by configuration change
   */
  private getAffectedCacheKeys(event: ConfigurationChangeEvent): string[] {
    // Simple implementation - in production, use more sophisticated mapping
    const affectedKeys: string[] = [];
    
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

/**
 * Global cache manager instance
 */
let globalCacheManager: ConfigurationCacheManager | null = null;

/**
 * Get or create the global cache manager
 */
export function getGlobalCacheManager(options?: Partial<CacheOptions>): ConfigurationCacheManager {
  if (!globalCacheManager) {
    globalCacheManager = new ConfigurationCacheManager(options);
  }
  return globalCacheManager;
}

/**
 * Set the global cache manager
 */
export function setGlobalCacheManager(manager: ConfigurationCacheManager): void {
  globalCacheManager = manager;
}

/**
 * Convenience function to get cached configuration
 */
export async function getCachedConfig<T = any>(key: string): Promise<T | undefined> {
  if (!globalCacheManager) {
    throw new Error('Cache manager not initialized');
  }
  return globalCacheManager.get<T>(key);
}

/**
 * Convenience function to cache configuration
 */
export async function setCachedConfig<T = any>(key: string, value: T, ttl?: number): Promise<void> {
  if (!globalCacheManager) {
    throw new Error('Cache manager not initialized');
  }
  return globalCacheManager.set(key, value, ttl);
}