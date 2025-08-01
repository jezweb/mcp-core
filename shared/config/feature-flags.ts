/**
 * Feature Flags Engine - Phase 2: Configuration Management
 * 
 * Dynamic feature flag management system with support for A/B testing,
 * conditional rules, and runtime flag evaluation.
 */

import {
  FeatureFlag,
  FeatureFlagVariant,
  FeatureFlagRule,
  EvaluationContext,
  ConfigurationChangeEvent,
  ConfigChangeCallback,
} from '../types/config-types.js';

/**
 * Feature flag evaluation result
 */
interface EvaluationResult {
  enabled: boolean;
  variant?: string;
  reason: string;
  metadata?: Record<string, any>;
}

/**
 * Feature flag rule evaluator
 */
class RuleEvaluator {
  /**
   * Evaluate a rule against the given context
   */
  evaluate(rule: FeatureFlagRule, context: EvaluationContext): boolean {
    try {
      // Simple condition evaluation - in a real implementation,
      // this would use a more sophisticated expression evaluator
      return this.evaluateCondition(rule.condition, context);
    } catch (error) {
      console.warn(`Failed to evaluate rule condition: ${rule.condition}`, error);
      return false;
    }
  }

  /**
   * Evaluate a condition string against context
   */
  private evaluateCondition(condition: string, context: EvaluationContext): boolean {
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
  private hashString(str: string): number {
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
export class FeatureFlagsEngine {
  private flags: Map<string, FeatureFlag> = new Map();
  private ruleEvaluator: RuleEvaluator = new RuleEvaluator();
  private usageStats: Map<string, { enabled: number; disabled: number; variants: Record<string, number> }> = new Map();
  private changeCallbacks: Set<ConfigChangeCallback> = new Set();
  private runtimeUpdateEnabled = true;

  /**
   * Register a feature flag
   */
  registerFlag(flag: FeatureFlag): void {
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
  updateFlag(name: string, updates: Partial<FeatureFlag>): boolean {
    const existingFlag = this.flags.get(name);
    if (!existingFlag) {
      return false;
    }

    const oldFlag = { ...existingFlag };
    const updatedFlag: FeatureFlag = {
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
  removeFlag(name: string): boolean {
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
  getFlag(name: string): FeatureFlag | undefined {
    return this.flags.get(name);
  }

  /**
   * Get all registered flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Evaluate a feature flag
   */
  evaluate(flagName: string, context: EvaluationContext): boolean {
    const result = this.evaluateDetailed(flagName, context);
    return result.enabled;
  }

  /**
   * Evaluate a feature flag with detailed result
   */
  evaluateDetailed(flagName: string, context: EvaluationContext): EvaluationResult {
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
  getVariant(flagName: string, context: EvaluationContext): string | undefined {
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
  isEnabled(flagName: string, context: EvaluationContext): boolean {
    return this.evaluate(flagName, context);
  }

  /**
   * Get feature configuration with variant support
   */
  getFeatureConfig(flagName: string, context: EvaluationContext): any {
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
  trackUsage(flagName: string, enabled: boolean, variant?: string): void {
    let stats = this.usageStats.get(flagName);
    if (!stats) {
      stats = { enabled: 0, disabled: 0, variants: {} };
      this.usageStats.set(flagName, stats);
    }

    if (enabled) {
      stats.enabled++;
    } else {
      stats.disabled++;
    }

    if (variant) {
      stats.variants[variant] = (stats.variants[variant] || 0) + 1;
    }
  }

  /**
   * Track variant usage
   */
  private trackVariantUsage(flagName: string, variant: string): void {
    this.trackUsage(flagName, true, variant);
  }

  /**
   * Get usage statistics for a flag
   */
  getUsageStats(flagName: string): { enabled: number; disabled: number; variants: Record<string, number> } | undefined {
    return this.usageStats.get(flagName);
  }

  /**
   * Get usage statistics for all flags
   */
  getAllUsageStats(): Record<string, { enabled: number; disabled: number; variants: Record<string, number> }> {
    const stats: Record<string, any> = {};
    for (const [flagName, flagStats] of this.usageStats) {
      stats[flagName] = { ...flagStats };
    }
    return stats;
  }

  /**
   * Reset usage statistics
   */
  resetUsageStats(flagName?: string): void {
    if (flagName) {
      this.usageStats.delete(flagName);
    } else {
      this.usageStats.clear();
    }
  }

  /**
   * Bulk register multiple flags
   */
  registerFlags(flags: FeatureFlag[]): void {
    for (const flag of flags) {
      this.registerFlag(flag);
    }
  }

  /**
   * Export flags configuration
   */
  exportFlags(): FeatureFlag[] {
    return this.getAllFlags();
  }

  /**
   * Import flags configuration
   */
  importFlags(flags: FeatureFlag[], replace = false): void {
    if (replace) {
      this.flags.clear();
      this.usageStats.clear();
    }
    
    this.registerFlags(flags);
  }

  /**
   * Enable runtime flag updates
   */
  enableRuntimeUpdates(): void {
    this.runtimeUpdateEnabled = true;
  }

  /**
   * Disable runtime flag updates
   */
  disableRuntimeUpdates(): void {
    this.runtimeUpdateEnabled = false;
  }

  /**
   * Check if runtime updates are enabled
   */
  isRuntimeUpdatesEnabled(): boolean {
    return this.runtimeUpdateEnabled;
  }

  /**
   * Watch for feature flag changes
   */
  watchFlagChanges(callback: ConfigChangeCallback): void {
    this.changeCallbacks.add(callback);
  }

  /**
   * Stop watching feature flag changes
   */
  unwatchFlagChanges(callback: ConfigChangeCallback): void {
    this.changeCallbacks.delete(callback);
  }

  /**
   * Clear all change watchers
   */
  clearChangeWatchers(): void {
    this.changeCallbacks.clear();
  }

  /**
   * Update flag at runtime
   */
  async updateFlagAtRuntime(
    name: string,
    updates: Partial<FeatureFlag>,
    options: {
      validate?: boolean;
      source?: string;
      reason?: string;
    } = {}
  ): Promise<{
    success: boolean;
    error?: Error;
    oldFlag?: FeatureFlag;
    newFlag?: FeatureFlag;
  }> {
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Toggle flag at runtime
   */
  async toggleFlagAtRuntime(
    name: string,
    options: {
      source?: string;
      reason?: string;
    } = {}
  ): Promise<{
    success: boolean;
    enabled: boolean;
    error?: Error;
  }> {
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
    } catch (error) {
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
  async bulkUpdateFlagsAtRuntime(
    updates: Record<string, Partial<FeatureFlag>>,
    options: {
      validate?: boolean;
      source?: string;
      reason?: string;
      continueOnError?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    results: Record<string, { success: boolean; error?: Error }>;
    totalUpdated: number;
    totalFailed: number;
  }> {
    const results: Record<string, { success: boolean; error?: Error }> = {};
    let totalUpdated = 0;
    let totalFailed = 0;

    for (const [flagName, flagUpdates] of Object.entries(updates)) {
      try {
        const result = await this.updateFlagAtRuntime(flagName, flagUpdates, options);
        results[flagName] = { success: result.success, error: result.error };
        
        if (result.success) {
          totalUpdated++;
        } else {
          totalFailed++;
          if (!options.continueOnError) {
            break;
          }
        }
      } catch (error) {
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
  getRuntimeStatistics(): {
    totalFlags: number;
    enabledFlags: number;
    disabledFlags: number;
    flagsWithRules: number;
    flagsWithVariants: number;
    runtimeUpdatesEnabled: boolean;
    changeWatchers: number;
  } {
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
  private validateFlagUpdates(
    existingFlag: FeatureFlag,
    updates: Partial<FeatureFlag>
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

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
  private async notifyFlagChange(
    type: 'create' | 'update' | 'delete',
    flagName: string,
    oldFlag?: FeatureFlag,
    newFlag?: FeatureFlag
  ): Promise<void> {
    const event: ConfigurationChangeEvent = {
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
      } catch (error) {
        console.error('Feature flag change callback error:', error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Hash context for consistent variant assignment
   */
  private hashContext(context: EvaluationContext): number {
    const key = context.userId || context.sessionId || `${context.environment}-${context.deployment}`;
    return this.hashString(key);
  }

  /**
   * Simple hash function
   */
  private hashString(str: string): number {
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
  static createSimpleFlag(name: string, enabled: boolean, description?: string): FeatureFlag {
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
  static createABTestFlag(
    name: string,
    enabled: boolean,
    variants: { name: string; weight: number; config?: any }[],
    description?: string
  ): FeatureFlag {
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
  static createRolloutFlag(
    name: string,
    enabled: boolean,
    percentage: number,
    description?: string
  ): FeatureFlag {
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
  static createEnvironmentFlag(
    name: string,
    enabled: boolean,
    environments: string[],
    description?: string
  ): FeatureFlag {
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

/**
 * Global feature flags engine instance
 */
let globalFeatureFlags: FeatureFlagsEngine | null = null;

/**
 * Get or create the global feature flags engine
 */
export function getGlobalFeatureFlags(): FeatureFlagsEngine {
  if (!globalFeatureFlags) {
    globalFeatureFlags = new FeatureFlagsEngine();
  }
  return globalFeatureFlags;
}

/**
 * Set the global feature flags engine
 */
export function setGlobalFeatureFlags(engine: FeatureFlagsEngine): void {
  globalFeatureFlags = engine;
}