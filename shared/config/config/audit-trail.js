"use strict";
/**
 * Configuration Audit Trail - Phase 2.4: Runtime Configuration
 *
 * Complete history tracking of all configuration changes with attribution,
 * diff visualization, audit log persistence, and compliance capabilities.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationAuditTrailManager = void 0;
exports.getGlobalAuditTrailManager = getGlobalAuditTrailManager;
exports.setGlobalAuditTrailManager = setGlobalAuditTrailManager;
exports.logConfigurationChange = logConfigurationChange;
exports.queryAuditLog = queryAuditLog;
/**
 * Configuration diff calculator
 */
class ConfigurationDiffCalculator {
    /**
     * Calculate diff between two configurations
     */
    calculateDiff(oldConfig, newConfig, path = '') {
        const diffs = [];
        // Handle null/undefined cases
        if (oldConfig === null || oldConfig === undefined) {
            if (newConfig !== null && newConfig !== undefined) {
                diffs.push({
                    type: 'added',
                    path,
                    newValue: newConfig,
                });
            }
            return diffs;
        }
        if (newConfig === null || newConfig === undefined) {
            diffs.push({
                type: 'removed',
                path,
                oldValue: oldConfig,
            });
            return diffs;
        }
        // Handle primitive values
        if (typeof oldConfig !== 'object' || typeof newConfig !== 'object') {
            if (oldConfig !== newConfig) {
                diffs.push({
                    type: 'modified',
                    path,
                    oldValue: oldConfig,
                    newValue: newConfig,
                });
            }
            return diffs;
        }
        // Handle arrays
        if (Array.isArray(oldConfig) || Array.isArray(newConfig)) {
            if (JSON.stringify(oldConfig) !== JSON.stringify(newConfig)) {
                diffs.push({
                    type: 'modified',
                    path,
                    oldValue: oldConfig,
                    newValue: newConfig,
                });
            }
            return diffs;
        }
        // Handle objects
        const allKeys = new Set([
            ...Object.keys(oldConfig),
            ...Object.keys(newConfig),
        ]);
        for (const key of allKeys) {
            const currentPath = path ? `${path}.${key}` : key;
            const oldValue = oldConfig[key];
            const newValue = newConfig[key];
            if (!(key in oldConfig)) {
                diffs.push({
                    type: 'added',
                    path: currentPath,
                    newValue,
                });
            }
            else if (!(key in newConfig)) {
                diffs.push({
                    type: 'removed',
                    path: currentPath,
                    oldValue,
                });
            }
            else {
                const childDiffs = this.calculateDiff(oldValue, newValue, currentPath);
                diffs.push(...childDiffs);
            }
        }
        return diffs;
    }
    /**
     * Generate human-readable diff summary
     */
    generateDiffSummary(diffs) {
        if (diffs.length === 0) {
            return 'No changes detected';
        }
        const summary = [];
        const grouped = this.groupDiffsByType(diffs);
        if (grouped.added.length > 0) {
            summary.push(`Added ${grouped.added.length} properties: ${grouped.added.map(d => d.path).join(', ')}`);
        }
        if (grouped.removed.length > 0) {
            summary.push(`Removed ${grouped.removed.length} properties: ${grouped.removed.map(d => d.path).join(', ')}`);
        }
        if (grouped.modified.length > 0) {
            summary.push(`Modified ${grouped.modified.length} properties: ${grouped.modified.map(d => d.path).join(', ')}`);
        }
        return summary.join('; ');
    }
    /**
     * Group diffs by type
     */
    groupDiffsByType(diffs) {
        return {
            added: diffs.filter(d => d.type === 'added'),
            removed: diffs.filter(d => d.type === 'removed'),
            modified: diffs.filter(d => d.type === 'modified'),
        };
    }
}
/**
 * Audit log storage (mock implementation)
 */
class AuditLogStorage {
    constructor(maxEntries = 10000) {
        this.entries = [];
        this.maxEntries = maxEntries;
    }
    async store(entry) {
        this.entries.push(entry);
        // Maintain max entries limit
        if (this.entries.length > this.maxEntries) {
            this.entries.shift();
        }
        // Mock persistence - in real implementation, use database
        console.debug('Storing audit entry:', entry.id);
    }
    async query(options = {}) {
        let results = [...this.entries];
        // Apply filters
        if (options.startDate) {
            const startTime = new Date(options.startDate).getTime();
            results = results.filter(entry => new Date(entry.timestamp).getTime() >= startTime);
        }
        if (options.endDate) {
            const endTime = new Date(options.endDate).getTime();
            results = results.filter(entry => new Date(entry.timestamp).getTime() <= endTime);
        }
        if (options.userId) {
            results = results.filter(entry => entry.user.id === options.userId);
        }
        if (options.action) {
            results = results.filter(entry => entry.action === options.action);
        }
        if (options.path) {
            results = results.filter(entry => entry.path?.includes(options.path));
        }
        if (options.source) {
            results = results.filter(entry => entry.source === options.source);
        }
        // Apply sorting
        const sortBy = options.sortBy || 'timestamp';
        const sortOrder = options.sortOrder || 'desc';
        results.sort((a, b) => {
            let aValue, bValue;
            switch (sortBy) {
                case 'timestamp':
                    aValue = new Date(a.timestamp).getTime();
                    bValue = new Date(b.timestamp).getTime();
                    break;
                case 'user':
                    aValue = a.user.name || a.user.id;
                    bValue = b.user.name || b.user.id;
                    break;
                case 'action':
                    aValue = a.action;
                    bValue = b.action;
                    break;
                default:
                    aValue = a.timestamp;
                    bValue = b.timestamp;
            }
            if (sortOrder === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            }
            else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });
        // Apply pagination
        const offset = options.offset || 0;
        const limit = options.limit || results.length;
        return results.slice(offset, offset + limit);
    }
    async getById(id) {
        return this.entries.find(entry => entry.id === id);
    }
    async delete(id) {
        const index = this.entries.findIndex(entry => entry.id === id);
        if (index >= 0) {
            this.entries.splice(index, 1);
            return true;
        }
        return false;
    }
    async clear() {
        this.entries = [];
    }
    async getStatistics() {
        const stats = {
            totalEntries: this.entries.length,
            entriesByAction: {},
            entriesByUser: {},
            entriesBySource: {},
            dateRange: {
                earliest: '',
                latest: '',
            },
            topUsers: [],
            topPaths: [],
        };
        if (this.entries.length === 0) {
            return stats;
        }
        // Calculate statistics
        const userCounts = {};
        const pathCounts = {};
        const timestamps = this.entries.map(e => new Date(e.timestamp).getTime());
        for (const entry of this.entries) {
            // Count by action
            stats.entriesByAction[entry.action] = (stats.entriesByAction[entry.action] || 0) + 1;
            // Count by user
            const userId = entry.user.id;
            stats.entriesByUser[userId] = (stats.entriesByUser[userId] || 0) + 1;
            userCounts[userId] = (userCounts[userId] || 0) + 1;
            // Count by source
            stats.entriesBySource[entry.source] = (stats.entriesBySource[entry.source] || 0) + 1;
            // Count by path
            if (entry.path) {
                pathCounts[entry.path] = (pathCounts[entry.path] || 0) + 1;
            }
        }
        // Date range
        stats.dateRange.earliest = new Date(Math.min(...timestamps)).toISOString();
        stats.dateRange.latest = new Date(Math.max(...timestamps)).toISOString();
        // Top users
        stats.topUsers = Object.entries(userCounts)
            .map(([userId, count]) => ({ userId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        // Top paths
        stats.topPaths = Object.entries(pathCounts)
            .map(([path, count]) => ({ path, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        return stats;
    }
}
/**
 * Configuration Audit Trail Manager
 */
class ConfigurationAuditTrailManager {
    constructor(currentUser, options = {}) {
        this.callbacks = new Set();
        this.currentUser = currentUser;
        this.sessionId = this.generateSessionId();
        this.storage = new AuditLogStorage(options.maxEntries);
        this.diffCalculator = new ConfigurationDiffCalculator();
        this.retentionPolicy = {
            enabled: false,
            maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
            maxEntries: 100000,
            archiveOldEntries: false,
            compressionEnabled: false,
            ...options.retentionPolicy,
        };
        // Start retention policy enforcement if enabled
        if (this.retentionPolicy.enabled) {
            this.startRetentionPolicyEnforcement();
        }
    }
    /**
     * Log configuration change
     */
    async logChange(action, oldConfig, newConfig, options = {}) {
        const entryId = this.generateEntryId();
        const timestamp = new Date().toISOString();
        // Calculate diff if both configs provided
        let diff;
        if (oldConfig && newConfig) {
            diff = this.diffCalculator.calculateDiff(oldConfig, newConfig);
        }
        const entry = {
            id: entryId,
            timestamp,
            action,
            path: options.path,
            oldValue: oldConfig,
            newValue: newConfig,
            diff: diff && diff.length > 0 ? diff[0] : undefined, // Store first diff for simplicity
            user: options.user || this.currentUser,
            source: options.source || 'unknown',
            reason: options.reason,
            metadata: options.metadata,
            validation: options.validation,
            rollbackId: options.rollbackId,
            sessionId: this.sessionId,
            ipAddress: options.ipAddress,
            userAgent: options.userAgent,
        };
        await this.storage.store(entry);
        this.notifyCallbacks(entry);
        return entryId;
    }
    /**
     * Log configuration update
     */
    async logUpdate(oldConfig, newConfig, options = {}) {
        return this.logChange('update', oldConfig, newConfig, options);
    }
    /**
     * Log configuration rollback
     */
    async logRollback(currentConfig, rolledBackConfig, rollbackId, options = {}) {
        return this.logChange('rollback', currentConfig, rolledBackConfig, {
            ...options,
            rollbackId,
        });
    }
    /**
     * Query audit log
     */
    async queryAuditLog(options = {}) {
        return this.storage.query(options);
    }
    /**
     * Get audit entry by ID
     */
    async getAuditEntry(id) {
        return this.storage.getById(id);
    }
    /**
     * Get audit statistics
     */
    async getAuditStatistics() {
        return this.storage.getStatistics();
    }
    /**
     * Export audit log
     */
    async exportAuditLog(options) {
        const entries = await this.storage.query(options.filters);
        switch (options.format) {
            case 'json':
                return this.exportAsJSON(entries, options);
            case 'csv':
                return this.exportAsCSV(entries, options);
            case 'xml':
                return this.exportAsXML(entries, options);
            default:
                throw new Error(`Unsupported export format: ${options.format}`);
        }
    }
    /**
     * Generate diff visualization
     */
    generateDiffVisualization(entry) {
        if (!entry.oldValue || !entry.newValue) {
            return 'No diff available';
        }
        const diffs = this.diffCalculator.calculateDiff(entry.oldValue, entry.newValue);
        return this.diffCalculator.generateDiffSummary(diffs);
    }
    /**
     * Search audit log
     */
    async searchAuditLog(searchTerm, options = {}) {
        const allEntries = await this.storage.query(options);
        return allEntries.filter(entry => {
            const searchableText = [
                entry.user.name,
                entry.user.email,
                entry.source,
                entry.reason,
                entry.path,
                JSON.stringify(entry.metadata),
            ].join(' ').toLowerCase();
            return searchableText.includes(searchTerm.toLowerCase());
        });
    }
    /**
     * Add audit callback
     */
    onAuditEntry(callback) {
        this.callbacks.add(callback);
    }
    /**
     * Remove audit callback
     */
    offAuditEntry(callback) {
        this.callbacks.delete(callback);
    }
    /**
     * Update current user
     */
    updateCurrentUser(user) {
        this.currentUser = user;
    }
    /**
     * Clear audit log
     */
    async clearAuditLog() {
        await this.storage.clear();
    }
    /**
     * Delete audit entry
     */
    async deleteAuditEntry(id) {
        return this.storage.delete(id);
    }
    /**
     * Update retention policy
     */
    updateRetentionPolicy(policy) {
        this.retentionPolicy = { ...this.retentionPolicy, ...policy };
    }
    /**
     * Enforce retention policy manually
     */
    async enforceRetentionPolicy() {
        if (!this.retentionPolicy.enabled) {
            return { deletedEntries: 0, archivedEntries: 0 };
        }
        const allEntries = await this.storage.query();
        const now = Date.now();
        const cutoffTime = now - this.retentionPolicy.maxAge;
        let deletedEntries = 0;
        let archivedEntries = 0;
        for (const entry of allEntries) {
            const entryTime = new Date(entry.timestamp).getTime();
            if (entryTime < cutoffTime) {
                if (this.retentionPolicy.archiveOldEntries) {
                    // Mock archiving - in real implementation, move to archive storage
                    archivedEntries++;
                }
                await this.storage.delete(entry.id);
                deletedEntries++;
            }
        }
        return { deletedEntries, archivedEntries };
    }
    /**
     * Export as JSON
     */
    exportAsJSON(entries, options) {
        const exportData = entries.map(entry => {
            const exported = {
                id: entry.id,
                timestamp: entry.timestamp,
                action: entry.action,
                user: entry.user,
                source: entry.source,
            };
            if (entry.path)
                exported.path = entry.path;
            if (entry.reason)
                exported.reason = entry.reason;
            if (options.includeMetadata && entry.metadata)
                exported.metadata = entry.metadata;
            if (options.includeDiffs && entry.diff)
                exported.diff = entry.diff;
            return exported;
        });
        return JSON.stringify(exportData, null, 2);
    }
    /**
     * Export as CSV
     */
    exportAsCSV(entries, options) {
        const headers = ['ID', 'Timestamp', 'Action', 'User', 'Source', 'Path', 'Reason'];
        const rows = entries.map(entry => [
            entry.id,
            entry.timestamp,
            entry.action,
            entry.user.name || entry.user.id,
            entry.source,
            entry.path || '',
            entry.reason || '',
        ]);
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    /**
     * Export as XML
     */
    exportAsXML(entries, options) {
        const xmlEntries = entries.map(entry => `
      <entry>
        <id>${entry.id}</id>
        <timestamp>${entry.timestamp}</timestamp>
        <action>${entry.action}</action>
        <user>${entry.user.name || entry.user.id}</user>
        <source>${entry.source}</source>
        ${entry.path ? `<path>${entry.path}</path>` : ''}
        ${entry.reason ? `<reason>${entry.reason}</reason>` : ''}
      </entry>
    `).join('');
        return `<?xml version="1.0" encoding="UTF-8"?>
    <audit-log>
      ${xmlEntries}
    </audit-log>`;
    }
    /**
     * Generate unique entry ID
     */
    generateEntryId() {
        return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Generate session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Start retention policy enforcement
     */
    startRetentionPolicyEnforcement() {
        // Run retention policy every hour
        setInterval(async () => {
            try {
                await this.enforceRetentionPolicy();
            }
            catch (error) {
                console.error('Retention policy enforcement error:', error);
            }
        }, 60 * 60 * 1000);
    }
    /**
     * Notify callbacks
     */
    notifyCallbacks(entry) {
        for (const callback of this.callbacks) {
            try {
                callback(entry);
            }
            catch (error) {
                console.error('Audit callback error:', error);
            }
        }
    }
}
exports.ConfigurationAuditTrailManager = ConfigurationAuditTrailManager;
/**
 * Global audit trail manager instance
 */
let globalAuditTrailManager = null;
/**
 * Get or create the global audit trail manager
 */
function getGlobalAuditTrailManager(currentUser, options) {
    if (!globalAuditTrailManager) {
        if (!currentUser) {
            throw new Error('Current user required for first-time initialization');
        }
        globalAuditTrailManager = new ConfigurationAuditTrailManager(currentUser, options);
    }
    return globalAuditTrailManager;
}
/**
 * Set the global audit trail manager
 */
function setGlobalAuditTrailManager(manager) {
    globalAuditTrailManager = manager;
}
/**
 * Convenience function to log configuration change
 */
async function logConfigurationChange(action, oldConfig, newConfig, options) {
    if (!globalAuditTrailManager) {
        throw new Error('Audit trail manager not initialized');
    }
    return globalAuditTrailManager.logChange(action, oldConfig, newConfig, options);
}
/**
 * Convenience function to query audit log
 */
async function queryAuditLog(options) {
    if (!globalAuditTrailManager) {
        throw new Error('Audit trail manager not initialized');
    }
    return globalAuditTrailManager.queryAuditLog(options);
}
