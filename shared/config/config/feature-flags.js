"use strict";
/**
 * Feature Flags Engine - Phase 2: Configuration Management
 *
 * Dynamic feature flag management system with support for A/B testing,
 * conditional rules, and runtime flag evaluation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlagsEngine = void 0;
exports.getGlobalFeatureFlags = getGlobalFeatureFlags;
exports.setGlobalFeatureFlags = setGlobalFeatureFlags;
/**
 * Feature flag rule evaluator
 */
class RuleEvaluator {
    /**
     * Evaluate a rule against the given context
     */
    evaluate(rule, context) {
        try {
            // Simple condition evaluation - in a real implementation,
            // this would use a more sophisticated expression evaluator
            return this.evaluateCondition(rule.condition, context);
        }
        catch (error) {
            console.warn(`Failed to evaluate rule condition: ${rule.condition}`, error);
            return false;
        }
    }
    /**
     * Evaluate a condition string against context
     */
    evaluateCondition(condition, context) {
        // Simple condition evaluation - supports basic comparisons
        // In a production system, you'd want a more robust expression evaluator
        // Environment checks
        if (condition.includes('environment')) {
            const envMatch = condition.match(/environment\s*===?\s*['"]([^'"]+)['"]/);
            if (envMatch) {
                return context.environment === envMatch[1];
            }
        }
        // Deployment checks
        if (condition.includes('deployment')) {
            const deployMatch = condition.match(/deployment\s*===?\s*['"]([^'"]+)['"]/);
            if (deployMatch) {
                return context.deployment === deployMatch[1];
            }
        }
        // User ID checks (for A/B testing)
        if (condition.includes('userId')) {
            const userMatch = condition.match(/userId\s*===?\s*['"]([^'"]+)['"]/);
            if (userMatch && context.userId) {
                return context.userId === userMatch[1];
            }
        }
        // Percentage-based rollout
        if (condition.includes('percentage')) {
            const percentMatch = condition.match(/percentage\s*<\s*(\d+)/);
            if (percentMatch) {
                const threshold = parseInt(percentMatch[1]);
                const hash = this.hashString(context.userId || context.sessionId || 'default');
                return (hash % 100) < threshold;
            }
        }
        // Default to false for unknown conditions
        return false;
    }
    /**
     * Simple hash function for percentage-based rollouts
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
}
/**
 * Feature flags engine
 */
class FeatureFlagsEngine {
    constructor() {
        this.flags = new Map();
        this.ruleEvaluator = new RuleEvaluator();
        this.usageStats = new Map();
        this.changeCallbacks = new Set();
        this.runtimeUpdateEnabled = true;
    }
    /**
     * Register a feature flag
     */
    registerFlag(flag) {
        const existingFlag = this.flags.get(flag.name);
        this.flags.set(flag.name, flag);
        // Initialize usage stats
        if (!this.usageStats.has(flag.name)) {
            this.usageStats.set(flag.name, {
                enabled: 0,
                disabled: 0,
                variants: {}
            });
        }
        // Notify change callbacks if runtime updates are enabled
        if (this.runtimeUpdateEnabled) {
            const changeType = existingFlag ? 'update' : 'create';
            this.notifyFlagChange(changeType, flag.name, existingFlag, flag);
        }
    }
    /**
     * Update an existing feature flag
     */
    updateFlag(name, updates) {
        const existingFlag = this.flags.get(name);
        if (!existingFlag) {
            return false;
        }
        const oldFlag = { ...existingFlag };
        const updatedFlag = {
            ...existingFlag,
            ...updates,
            metadata: {
                createdAt: existingFlag.metadata?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: existingFlag.metadata?.createdBy || 'system',
                ...existingFlag.metadata,
                ...updates.metadata,
            },
        };
        this.flags.set(name, updatedFlag);
        // Notify change callbacks if runtime updates are enabled
        if (this.runtimeUpdateEnabled) {
            this.notifyFlagChange('update', name, oldFlag, updatedFlag);
        }
        return true;
    }
    /**
     * Remove a feature flag
     */
    removeFlag(name) {
        const existingFlag = this.flags.get(name);
        const removed = this.flags.delete(name);
        if (removed) {
            this.usageStats.delete(name);
            // Notify change callbacks if runtime updates are enabled
            if (this.runtimeUpdateEnabled && existingFlag) {
                this.notifyFlagChange('delete', name, existingFlag, undefined);
            }
        }
        return removed;
    }
    /**
     * Get a feature flag by name
     */
    getFlag(name) {
        return this.flags.get(name);
    }
    /**
     * Get all registered flags
     */
    getAllFlags() {
        return Array.from(this.flags.values());
    }
    /**
     * Evaluate a feature flag
     */
    evaluate(flagName, context) {
        const result = this.evaluateDetailed(flagName, context);
        return result.enabled;
    }
    /**
     * Evaluate a feature flag with detailed result
     */
    evaluateDetailed(flagName, context) {
        const flag = this.flags.get(flagName);
        if (!flag) {
            this.trackUsage(flagName, false);
            return {
                enabled: false,
                reason: 'Flag not found',
            };
        }
        // Check if flag is globally disabled
        if (!flag.enabled) {
            this.trackUsage(flagName, false);
            return {
                enabled: false,
                reason: 'Flag globally disabled',
            };
        }
        // Evaluate rules if present
        if (flag.rules && flag.rules.length > 0) {
            for (const rule of flag.rules) {
                if (this.ruleEvaluator.evaluate(rule, context)) {
                    const enabled = rule.action === 'enable';
                    this.trackUsage(flagName, enabled, rule.value);
                    return {
                        enabled,
                        variant: rule.action === 'variant' ? rule.value : undefined,
                        reason: `Rule matched: ${rule.condition}`,
                        metadata: { rule: rule.condition },
                    };
                }
            }
        }
        // Default to enabled if no rules match
        this.trackUsage(flagName, true);
        return {
            enabled: true,
            reason: 'Default enabled (no rules matched)',
        };
    }
    /**
     * Get variant for A/B testing
     */
    getVariant(flagName, context) {
        const flag = this.flags.get(flagName);
        if (!flag || !flag.enabled || !flag.variants || flag.variants.length === 0) {
            return undefined;
        }
        // Check rules first for variant assignment
        if (flag.rules) {
            for (const rule of flag.rules) {
                if (rule.action === 'variant' && this.ruleEvaluator.evaluate(rule, context)) {
                    this.trackVariantUsage(flagName, rule.value);
                    return rule.value;
                }
            }
        }
        // Use weighted random selection for variants
        const hash = this.hashContext(context);
        const normalizedHash = hash / 0xffffffff; // Normalize to 0-1
        let cumulativeWeight = 0;
        for (const variant of flag.variants) {
            cumulativeWeight += variant.weight;
            if (normalizedHash <= cumulativeWeight) {
                this.trackVariantUsage(flagName, variant.name);
                return variant.name;
            }
        }
        // Fallback to first variant
        const fallbackVariant = flag.variants[0]?.name;
        if (fallbackVariant) {
            this.trackVariantUsage(flagName, fallbackVariant);
        }
        return fallbackVariant;
    }
    /**
     * Check if a feature is enabled (alias for evaluate)
     */
    isEnabled(flagName, context) {
        return this.evaluate(flagName, context);
    }
    /**
     * Get feature configuration with variant support
     */
    getFeatureConfig(flagName, context) {
        const flag = this.flags.get(flagName);
        if (!flag || !this.evaluate(flagName, context)) {
            return undefined;
        }
        const variant = this.getVariant(flagName, context);
        if (variant) {
            const variantConfig = flag.variants?.find(v => v.name === variant);
            return variantConfig?.config;
        }
        return true; // Default config for enabled flags without variants
    }
    /**
     * Track flag usage for analytics
     */
    trackUsage(flagName, enabled, variant) {
        let stats = this.usageStats.get(flagName);
        if (!stats) {
            stats = { enabled: 0, disabled: 0, variants: {} };
            this.usageStats.set(flagName, stats);
        }
        if (enabled) {
            stats.enabled++;
        }
        else {
            stats.disabled++;
        }
        if (variant) {
            stats.variants[variant] = (stats.variants[variant] || 0) + 1;
        }
    }
    /**
     * Track variant usage
     */
    trackVariantUsage(flagName, variant) {
        this.trackUsage(flagName, true, variant);
    }
    /**
     * Get usage statistics for a flag
     */
    getUsageStats(flagName) {
        return this.usageStats.get(flagName);
    }
    /**
     * Get usage statistics for all flags
     */
    getAllUsageStats() {
        const stats = {};
        for (const [flagName, flagStats] of this.usageStats) {
            stats[flagName] = { ...flagStats };
        }
        return stats;
    }
    /**
     * Reset usage statistics
     */
    resetUsageStats(flagName) {
        if (flagName) {
            this.usageStats.delete(flagName);
        }
        else {
            this.usageStats.clear();
        }
    }
    /**
     * Bulk register multiple flags
     */
    registerFlags(flags) {
        for (const flag of flags) {
            this.registerFlag(flag);
        }
    }
    /**
     * Export flags configuration
     */
    exportFlags() {
        return this.getAllFlags();
    }
    /**
     * Import flags configuration
     */
    importFlags(flags, replace = false) {
        if (replace) {
            this.flags.clear();
            this.usageStats.clear();
        }
        this.registerFlags(flags);
    }
    /**
     * Enable runtime flag updates
     */
    enableRuntimeUpdates() {
        this.runtimeUpdateEnabled = true;
    }
    /**
     * Disable runtime flag updates
     */
    disableRuntimeUpdates() {
        this.runtimeUpdateEnabled = false;
    }
    /**
     * Check if runtime updates are enabled
     */
    isRuntimeUpdatesEnabled() {
        return this.runtimeUpdateEnabled;
    }
    /**
     * Watch for feature flag changes
     */
    watchFlagChanges(callback) {
        this.changeCallbacks.add(callback);
    }
    /**
     * Stop watching feature flag changes
     */
    unwatchFlagChanges(callback) {
        this.changeCallbacks.delete(callback);
    }
    /**
     * Clear all change watchers
     */
    clearChangeWatchers() {
        this.changeCallbacks.clear();
    }
    /**
     * Update flag at runtime
     */
    async updateFlagAtRuntime(name, updates, options = {}) {
        try {
            const existingFlag = this.flags.get(name);
            if (!existingFlag) {
                return {
                    success: false,
                    error: new Error(`Feature flag '${name}' not found`),
                };
            }
            // Validate updates if requested
            if (options.validate) {
                const validationResult = this.validateFlagUpdates(existingFlag, updates);
                if (!validationResult.isValid) {
                    return {
                        success: false,
                        error: new Error(`Flag validation failed: ${validationResult.errors.join(', ')}`),
                    };
                }
            }
            // Apply updates
            const success = this.updateFlag(name, updates);
            const newFlag = this.flags.get(name);
            return {
                success,
                oldFlag: existingFlag,
                newFlag,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    }
    /**
     * Toggle flag at runtime
     */
    async toggleFlagAtRuntime(name, options = {}) {
        try {
            const existingFlag = this.flags.get(name);
            if (!existingFlag) {
                return {
                    success: false,
                    enabled: false,
                    error: new Error(`Feature flag '${name}' not found`),
                };
            }
            const newEnabledState = !existingFlag.enabled;
            const success = this.updateFlag(name, { enabled: newEnabledState });
            return {
                success,
                enabled: newEnabledState,
            };
        }
        catch (error) {
            return {
                success: false,
                enabled: false,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    }
    /**
     * Bulk update flags at runtime
     */
    async bulkUpdateFlagsAtRuntime(updates, options = {}) {
        const results = {};
        let totalUpdated = 0;
        let totalFailed = 0;
        for (const [flagName, flagUpdates] of Object.entries(updates)) {
            try {
                const result = await this.updateFlagAtRuntime(flagName, flagUpdates, options);
                results[flagName] = { success: result.success, error: result.error };
                if (result.success) {
                    totalUpdated++;
                }
                else {
                    totalFailed++;
                    if (!options.continueOnError) {
                        break;
                    }
                }
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                results[flagName] = { success: false, error: err };
                totalFailed++;
                if (!options.continueOnError) {
                    break;
                }
            }
        }
        return {
            success: totalFailed === 0,
            results,
            totalUpdated,
            totalFailed,
        };
    }
    /**
     * Get runtime flag statistics
     */
    getRuntimeStatistics() {
        const flags = Array.from(this.flags.values());
        return {
            totalFlags: flags.length,
            enabledFlags: flags.filter(f => f.enabled).length,
            disabledFlags: flags.filter(f => !f.enabled).length,
            flagsWithRules: flags.filter(f => f.rules && f.rules.length > 0).length,
            flagsWithVariants: flags.filter(f => f.variants && f.variants.length > 0).length,
            runtimeUpdatesEnabled: this.runtimeUpdateEnabled,
            changeWatchers: this.changeCallbacks.size,
        };
    }
    /**
     * Validate flag updates
     */
    validateFlagUpdates(existingFlag, updates) {
        const errors = [];
        // Validate flag name (if being updated)
        if (updates.name && updates.name !== existingFlag.name) {
            if (this.flags.has(updates.name)) {
                errors.push(`Flag name '${updates.name}' already exists`);
            }
        }
        // Validate variants (if being updated)
        if (updates.variants) {
            const totalWeight = updates.variants.reduce((sum, variant) => sum + variant.weight, 0);
            if (Math.abs(totalWeight - 1.0) > 0.001) {
                errors.push(`Variant weights must sum to 1.0, got ${totalWeight}`);
            }
        }
        // Validate rules (if being updated)
        if (updates.rules) {
            for (const rule of updates.rules) {
                if (!rule.condition || !rule.action) {
                    errors.push('Rules must have both condition and action');
                }
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    /**
     * Notify flag change callbacks
     */
    async notifyFlagChange(type, flagName, oldFlag, newFlag) {
        const event = {
            type: 'update', // Always use 'update' as the event type for flag changes
            path: `features.flags.${flagName}`,
            oldValue: oldFlag,
            newValue: newFlag,
            timestamp: new Date().toISOString(),
            source: 'feature-flags-engine',
            metadata: {
                flagName,
                changeType: type,
            },
        };
        const promises = Array.from(this.changeCallbacks).map(async (callback) => {
            try {
                await callback(event);
            }
            catch (error) {
                console.error('Feature flag change callback error:', error);
            }
        });
        await Promise.allSettled(promises);
    }
    /**
     * Hash context for consistent variant assignment
     */
    hashContext(context) {
        const key = context.userId || context.sessionId || `${context.environment}-${context.deployment}`;
        return this.hashString(key);
    }
    /**
     * Simple hash function
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    /**
     * Create a simple feature flag
     */
    static createSimpleFlag(name, enabled, description) {
        return {
            name,
            enabled,
            description,
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'system',
            },
        };
    }
    /**
     * Create an A/B test flag
     */
    static createABTestFlag(name, enabled, variants, description) {
        return {
            name,
            enabled,
            description,
            variants: variants.map(v => ({
                name: v.name,
                weight: v.weight,
                config: v.config,
            })),
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'system',
                tags: ['ab-test'],
            },
        };
    }
    /**
     * Create a percentage rollout flag
     */
    static createRolloutFlag(name, enabled, percentage, description) {
        return {
            name,
            enabled,
            description,
            rules: [
                {
                    condition: `percentage < ${percentage}`,
                    action: 'enable',
                    description: `Enable for ${percentage}% of users`,
                },
            ],
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'system',
                tags: ['rollout'],
            },
        };
    }
    /**
     * Create an environment-specific flag
     */
    static createEnvironmentFlag(name, enabled, environments, description) {
        return {
            name,
            enabled,
            description,
            rules: environments.map(env => ({
                condition: `environment === "${env}"`,
                action: 'enable',
                description: `Enable in ${env} environment`,
            })),
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'system',
                tags: ['environment-specific'],
            },
        };
    }
}
exports.FeatureFlagsEngine = FeatureFlagsEngine;
/**
 * Global feature flags engine instance
 */
let globalFeatureFlags = null;
/**
 * Get or create the global feature flags engine
 */
function getGlobalFeatureFlags() {
    if (!globalFeatureFlags) {
        globalFeatureFlags = new FeatureFlagsEngine();
    }
    return globalFeatureFlags;
}
/**
 * Set the global feature flags engine
 */
function setGlobalFeatureFlags(engine) {
    globalFeatureFlags = engine;
}
