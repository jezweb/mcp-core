/**
 * System Health Dashboard - Phase 2.5: Integration & Testing
 *
 * Real-time configuration system status monitoring and visualization.
 * Provides comprehensive health indicators, performance metrics,
 * configuration change history, and system integration status.
 */

import type {
  MCPServerConfig,
  ValidationResult,
  FeatureFlag,
} from '../types/config-types.js';

import type {
  RuntimeChangeResult,
  ConfigurationSnapshot,
} from './runtime-manager.js';

import type {
  CacheStatistics,
} from './cache-manager.js';

import type {
  AuditLogEntry,
  AuditStatistics,
} from './audit-trail.js';

import type {
  SyncEvent,
} from './sync-manager.js';

// Health Dashboard Types
export interface SystemHealthStatus {
  overall: HealthLevel;
  timestamp: string;
  uptime: number;
  components: ComponentHealthMap;
  metrics: SystemMetrics;
  alerts: HealthAlert[];
  recommendations: string[];
}

export interface ComponentHealthMap {
  configurationManager: ComponentHealth;
  environmentManager: ComponentHealth;
  featureFlagsEngine: ComponentHealth;
  runtimeManager: ComponentHealth;
  hotReloadManager: ComponentHealth;
  cacheManager: ComponentHealth;
  syncManager: ComponentHealth;
  auditTrailManager: ComponentHealth;
  deploymentHealth: ComponentHealth;
}

export interface ComponentHealth {
  status: HealthLevel;
  lastCheck: string;
  uptime: number;
  metrics: Record<string, number>;
  errors: string[];
  warnings: string[];
  performance: PerformanceMetrics;
}

export interface SystemMetrics {
  performance: PerformanceMetrics;
  configuration: ConfigurationMetrics;
  featureFlags: FeatureFlagMetrics;
  cache: CacheMetrics;
  audit: AuditMetrics;
  sync: SyncMetrics;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface ConfigurationMetrics {
  totalConfigurations: number;
  activeSnapshots: number;
  updateFrequency: number;
  validationSuccessRate: number;
  rollbackCount: number;
  lastUpdateTime: string;
}

export interface FeatureFlagMetrics {
  totalFlags: number;
  enabledFlags: number;
  evaluationsPerSecond: number;
  evaluationLatency: number;
  flagToggleFrequency: number;
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  totalEntries: number;
  memoryUsage: number;
  evictionRate: number;
  averageKeySize: number;
}

export interface AuditMetrics {
  totalEntries: number;
  entriesPerHour: number;
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{ user: string; count: number }>;
  retentionDays: number;
}

export interface SyncMetrics {
  activePeers: number;
  syncFrequency: number;
  conflictRate: number;
  lastSyncTime: string;
  dataTransferred: number;
}

export interface HealthAlert {
  id: string;
  level: HealthLevel;
  component: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  details?: Record<string, any>;
}

export interface DashboardConfig {
  refreshInterval: number;
  retentionPeriod: number;
  alertThresholds: AlertThresholds;
  enabledComponents: string[];
  visualizationOptions: VisualizationOptions;
}

export interface AlertThresholds {
  responseTime: number;
  errorRate: number;
  memoryUsage: number;
  cacheHitRate: number;
  syncLatency: number;
}

export interface VisualizationOptions {
  timeRange: string;
  chartType: 'line' | 'bar' | 'area';
  showPredictions: boolean;
  groupBy: string;
}

export type HealthLevel = 'healthy' | 'warning' | 'critical' | 'unknown';

// Health Dashboard Implementation
export class ConfigurationHealthDashboard {
  private config: DashboardConfig;
  private healthHistory: SystemHealthStatus[] = [];
  private alerts: HealthAlert[] = [];
  private startTime: number;
  private metricsCollectors: Map<string, MetricsCollector> = new Map();
  private subscribers: Set<HealthSubscriber> = new Set();

  constructor(config: Partial<DashboardConfig> = {}) {
    this.config = {
      refreshInterval: 30000, // 30 seconds
      retentionPeriod: 86400000, // 24 hours
      alertThresholds: {
        responseTime: 1000, // 1 second
        errorRate: 0.05, // 5%
        memoryUsage: 0.8, // 80%
        cacheHitRate: 0.9, // 90%
        syncLatency: 5000, // 5 seconds
      },
      enabledComponents: [
        'configurationManager',
        'environmentManager',
        'featureFlagsEngine',
        'runtimeManager',
        'hotReloadManager',
        'cacheManager',
        'syncManager',
        'auditTrailManager',
        'deploymentHealth',
      ],
      visualizationOptions: {
        timeRange: '1h',
        chartType: 'line',
        showPredictions: false,
        groupBy: 'component',
      },
      ...config,
    };

    this.startTime = Date.now();
    this.initializeMetricsCollectors();
  }

  /**
   * Initialize metrics collectors for each component
   */
  private initializeMetricsCollectors(): void {
    for (const component of this.config.enabledComponents) {
      this.metricsCollectors.set(component, new MetricsCollector(component));
    }
  }

  /**
   * Get current system health status
   */
  async getSystemHealth(): Promise<SystemHealthStatus> {
    const components = await this.collectComponentHealth();
    const metrics = await this.collectSystemMetrics();
    const alerts = this.getActiveAlerts();
    const recommendations = this.generateRecommendations(components, metrics);

    const overallHealth = this.calculateOverallHealth(components);

    const healthStatus: SystemHealthStatus = {
      overall: overallHealth,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      components,
      metrics,
      alerts,
      recommendations,
    };

    // Store in history
    this.addToHistory(healthStatus);

    // Check for new alerts
    await this.checkAlerts(healthStatus);

    // Notify subscribers
    this.notifySubscribers(healthStatus);

    return healthStatus;
  }

  /**
   * Collect health status for all components
   */
  private async collectComponentHealth(): Promise<ComponentHealthMap> {
    const components: Partial<ComponentHealthMap> = {};

    for (const componentName of this.config.enabledComponents) {
      const collector = this.metricsCollectors.get(componentName);
      if (collector) {
        components[componentName as keyof ComponentHealthMap] = await collector.getHealth();
      }
    }

    return components as ComponentHealthMap;
  }

  /**
   * Collect system-wide metrics
   */
  private async collectSystemMetrics(): Promise<SystemMetrics> {
    const performance = await this.collectPerformanceMetrics();
    const configuration = await this.collectConfigurationMetrics();
    const featureFlags = await this.collectFeatureFlagMetrics();
    const cache = await this.collectCacheMetrics();
    const audit = await this.collectAuditMetrics();
    const sync = await this.collectSyncMetrics();

    return {
      performance,
      configuration,
      featureFlags,
      cache,
      audit,
      sync,
    };
  }

  /**
   * Collect performance metrics
   */
  private async collectPerformanceMetrics(): Promise<PerformanceMetrics> {
    // In a real implementation, this would collect actual metrics
    return {
      averageResponseTime: 45,
      p95ResponseTime: 120,
      p99ResponseTime: 250,
      throughput: 150,
      errorRate: 0.02,
      memoryUsage: 0.65,
      cpuUsage: 0.35,
    };
  }

  /**
   * Collect configuration metrics
   */
  private async collectConfigurationMetrics(): Promise<ConfigurationMetrics> {
    return {
      totalConfigurations: 1,
      activeSnapshots: 3,
      updateFrequency: 0.5, // updates per minute
      validationSuccessRate: 0.98,
      rollbackCount: 0,
      lastUpdateTime: new Date().toISOString(),
    };
  }

  /**
   * Collect feature flag metrics
   */
  private async collectFeatureFlagMetrics(): Promise<FeatureFlagMetrics> {
    return {
      totalFlags: 25,
      enabledFlags: 18,
      evaluationsPerSecond: 450,
      evaluationLatency: 2.5,
      flagToggleFrequency: 0.1, // toggles per hour
    };
  }

  /**
   * Collect cache metrics
   */
  private async collectCacheMetrics(): Promise<CacheMetrics> {
    return {
      hitRate: 0.94,
      missRate: 0.06,
      totalEntries: 150,
      memoryUsage: 12.5, // MB
      evictionRate: 0.02,
      averageKeySize: 256, // bytes
    };
  }

  /**
   * Collect audit metrics
   */
  private async collectAuditMetrics(): Promise<AuditMetrics> {
    return {
      totalEntries: 1250,
      entriesPerHour: 15,
      topActions: [
        { action: 'update', count: 450 },
        { action: 'create', count: 320 },
        { action: 'delete', count: 180 },
      ],
      topUsers: [
        { user: 'system', count: 800 },
        { user: 'admin', count: 250 },
        { user: 'api', count: 200 },
      ],
      retentionDays: 30,
    };
  }

  /**
   * Collect sync metrics
   */
  private async collectSyncMetrics(): Promise<SyncMetrics> {
    return {
      activePeers: 2,
      syncFrequency: 0.2, // syncs per minute
      conflictRate: 0.01,
      lastSyncTime: new Date().toISOString(),
      dataTransferred: 2.5, // MB
    };
  }

  /**
   * Calculate overall system health
   */
  private calculateOverallHealth(components: ComponentHealthMap): HealthLevel {
    const healthLevels = Object.values(components).map(c => c.status);
    
    if (healthLevels.some(level => level === 'critical')) {
      return 'critical';
    }
    
    if (healthLevels.some(level => level === 'warning')) {
      return 'warning';
    }
    
    if (healthLevels.every(level => level === 'healthy')) {
      return 'healthy';
    }
    
    return 'unknown';
  }

  /**
   * Generate health recommendations
   */
  private generateRecommendations(
    components: ComponentHealthMap,
    metrics: SystemMetrics
  ): string[] {
    const recommendations: string[] = [];

    // Performance recommendations
    if (metrics.performance.averageResponseTime > this.config.alertThresholds.responseTime) {
      recommendations.push('Consider optimizing configuration loading performance');
    }

    if (metrics.performance.memoryUsage > this.config.alertThresholds.memoryUsage) {
      recommendations.push('Memory usage is high - consider cache cleanup or optimization');
    }

    // Cache recommendations
    if (metrics.cache.hitRate < this.config.alertThresholds.cacheHitRate) {
      recommendations.push('Cache hit rate is low - review caching strategy');
    }

    // Feature flag recommendations
    if (metrics.featureFlags.evaluationLatency > 10) {
      recommendations.push('Feature flag evaluation latency is high - optimize flag rules');
    }

    // Sync recommendations
    if (metrics.sync.conflictRate > 0.05) {
      recommendations.push('High sync conflict rate - review synchronization strategy');
    }

    return recommendations;
  }

  /**
   * Get active alerts
   */
  private getActiveAlerts(): HealthAlert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  /**
   * Check for new alerts based on current health status
   */
  private async checkAlerts(healthStatus: SystemHealthStatus): Promise<void> {
    const newAlerts: HealthAlert[] = [];

    // Check performance alerts
    if (healthStatus.metrics.performance.averageResponseTime > this.config.alertThresholds.responseTime) {
      newAlerts.push({
        id: `perf-response-time-${Date.now()}`,
        level: 'warning',
        component: 'performance',
        message: `Average response time (${healthStatus.metrics.performance.averageResponseTime}ms) exceeds threshold`,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        details: { threshold: this.config.alertThresholds.responseTime },
      });
    }

    // Check memory alerts
    if (healthStatus.metrics.performance.memoryUsage > this.config.alertThresholds.memoryUsage) {
      newAlerts.push({
        id: `memory-usage-${Date.now()}`,
        level: 'critical',
        component: 'performance',
        message: `Memory usage (${(healthStatus.metrics.performance.memoryUsage * 100).toFixed(1)}%) exceeds threshold`,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        details: { threshold: this.config.alertThresholds.memoryUsage },
      });
    }

    // Check cache alerts
    if (healthStatus.metrics.cache.hitRate < this.config.alertThresholds.cacheHitRate) {
      newAlerts.push({
        id: `cache-hit-rate-${Date.now()}`,
        level: 'warning',
        component: 'cache',
        message: `Cache hit rate (${(healthStatus.metrics.cache.hitRate * 100).toFixed(1)}%) below threshold`,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        details: { threshold: this.config.alertThresholds.cacheHitRate },
      });
    }

    // Add new alerts
    this.alerts.push(...newAlerts);

    // Clean up old alerts (older than retention period)
    const cutoffTime = Date.now() - this.config.retentionPeriod;
    this.alerts = this.alerts.filter(alert => 
      new Date(alert.timestamp).getTime() > cutoffTime
    );
  }

  /**
   * Add health status to history
   */
  private addToHistory(healthStatus: SystemHealthStatus): void {
    this.healthHistory.push(healthStatus);

    // Clean up old history entries
    const cutoffTime = Date.now() - this.config.retentionPeriod;
    this.healthHistory = this.healthHistory.filter(status => 
      new Date(status.timestamp).getTime() > cutoffTime
    );
  }

  /**
   * Get health history for visualization
   */
  getHealthHistory(timeRange?: string): SystemHealthStatus[] {
    if (!timeRange) {
      return [...this.healthHistory];
    }

    const now = Date.now();
    let cutoffTime = now;

    switch (timeRange) {
      case '1h':
        cutoffTime = now - 3600000;
        break;
      case '6h':
        cutoffTime = now - 21600000;
        break;
      case '24h':
        cutoffTime = now - 86400000;
        break;
      case '7d':
        cutoffTime = now - 604800000;
        break;
      default:
        return [...this.healthHistory];
    }

    return this.healthHistory.filter(status => 
      new Date(status.timestamp).getTime() > cutoffTime
    );
  }

  /**
   * Subscribe to health updates
   */
  subscribe(subscriber: HealthSubscriber): void {
    this.subscribers.add(subscriber);
  }

  /**
   * Unsubscribe from health updates
   */
  unsubscribe(subscriber: HealthSubscriber): void {
    this.subscribers.delete(subscriber);
  }

  /**
   * Notify subscribers of health updates
   */
  private notifySubscribers(healthStatus: SystemHealthStatus): void {
    for (const subscriber of this.subscribers) {
      try {
        subscriber.onHealthUpdate(healthStatus);
      } catch (error) {
        console.error('Error notifying health subscriber:', error);
      }
    }
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Get dashboard configuration
   */
  getConfig(): DashboardConfig {
    return { ...this.config };
  }

  /**
   * Update dashboard configuration
   */
  updateConfig(updates: Partial<DashboardConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Generate health report
   */
  generateHealthReport(): HealthReport {
    const currentHealth = this.healthHistory[this.healthHistory.length - 1];
    const history = this.getHealthHistory('24h');
    
    return {
      summary: {
        currentStatus: currentHealth?.overall || 'unknown',
        uptime: Date.now() - this.startTime,
        totalAlerts: this.alerts.length,
        acknowledgedAlerts: this.alerts.filter(a => a.acknowledged).length,
      },
      trends: this.calculateTrends(history),
      topIssues: this.getTopIssues(),
      recommendations: currentHealth?.recommendations || [],
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Calculate health trends
   */
  private calculateTrends(history: SystemHealthStatus[]): HealthTrends {
    if (history.length < 2) {
      return {
        responseTime: 'stable',
        memoryUsage: 'stable',
        errorRate: 'stable',
        cacheHitRate: 'stable',
      };
    }

    const recent = history.slice(-10);
    const older = history.slice(-20, -10);

    return {
      responseTime: this.calculateTrend(
        recent.map(h => h.metrics.performance.averageResponseTime),
        older.map(h => h.metrics.performance.averageResponseTime)
      ),
      memoryUsage: this.calculateTrend(
        recent.map(h => h.metrics.performance.memoryUsage),
        older.map(h => h.metrics.performance.memoryUsage)
      ),
      errorRate: this.calculateTrend(
        recent.map(h => h.metrics.performance.errorRate),
        older.map(h => h.metrics.performance.errorRate)
      ),
      cacheHitRate: this.calculateTrend(
        recent.map(h => h.metrics.cache.hitRate),
        older.map(h => h.metrics.cache.hitRate)
      ),
    };
  }

  /**
   * Calculate trend direction
   */
  private calculateTrend(recent: number[], older: number[]): TrendDirection {
    if (recent.length === 0 || older.length === 0) {
      return 'stable';
    }

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    const change = (recentAvg - olderAvg) / olderAvg;

    if (Math.abs(change) < 0.05) {
      return 'stable';
    }

    return change > 0 ? 'increasing' : 'decreasing';
  }

  /**
   * Get top issues from alerts
   */
  private getTopIssues(): Array<{ component: string; count: number; severity: HealthLevel }> {
    const issueMap = new Map<string, { count: number; severity: HealthLevel }>();

    for (const alert of this.alerts) {
      const existing = issueMap.get(alert.component);
      if (existing) {
        existing.count++;
        if (alert.level === 'critical' || (alert.level === 'warning' && existing.severity === 'healthy')) {
          existing.severity = alert.level;
        }
      } else {
        issueMap.set(alert.component, { count: 1, severity: alert.level });
      }
    }

    return Array.from(issueMap.entries())
      .map(([component, data]) => ({ component, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
}

// Metrics Collector for individual components
class MetricsCollector {
  private componentName: string;
  private startTime: number;
  private metrics: Map<string, number[]> = new Map();

  constructor(componentName: string) {
    this.componentName = componentName;
    this.startTime = Date.now();
  }

  async getHealth(): Promise<ComponentHealth> {
    // Mock implementation - in real system, this would collect actual metrics
    const mockMetrics = this.generateMockMetrics();
    
    return {
      status: this.determineHealthStatus(mockMetrics),
      lastCheck: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      metrics: mockMetrics,
      errors: [],
      warnings: [],
      performance: {
        averageResponseTime: mockMetrics.responseTime || 50,
        p95ResponseTime: (mockMetrics.responseTime || 50) * 2,
        p99ResponseTime: (mockMetrics.responseTime || 50) * 3,
        throughput: mockMetrics.throughput || 100,
        errorRate: mockMetrics.errorRate || 0.01,
        memoryUsage: mockMetrics.memoryUsage || 0.5,
        cpuUsage: mockMetrics.cpuUsage || 0.3,
      },
    };
  }

  private generateMockMetrics(): Record<string, number> {
    // Generate realistic mock metrics based on component type
    const baseMetrics = {
      responseTime: 30 + Math.random() * 40,
      throughput: 80 + Math.random() * 40,
      errorRate: Math.random() * 0.05,
      memoryUsage: 0.4 + Math.random() * 0.3,
      cpuUsage: 0.2 + Math.random() * 0.3,
    };

    // Component-specific adjustments
    switch (this.componentName) {
      case 'cacheManager':
        baseMetrics.responseTime *= 0.5; // Cache should be faster
        baseMetrics.throughput *= 2; // Higher throughput
        break;
      case 'syncManager':
        baseMetrics.responseTime *= 3; // Sync operations are slower
        baseMetrics.throughput *= 0.3; // Lower throughput
        break;
      case 'auditTrailManager':
        baseMetrics.responseTime *= 1.5; // Audit operations are moderately slow
        break;
    }

    return baseMetrics;
  }

  private determineHealthStatus(metrics: Record<string, number>): HealthLevel {
    if (metrics.errorRate > 0.1 || metrics.responseTime > 1000) {
      return 'critical';
    }
    
    if (metrics.errorRate > 0.05 || metrics.responseTime > 500 || metrics.memoryUsage > 0.8) {
      return 'warning';
    }
    
    return 'healthy';
  }
}

// Additional Types
export interface HealthSubscriber {
  onHealthUpdate(healthStatus: SystemHealthStatus): void;
}

export interface HealthReport {
  summary: {
    currentStatus: HealthLevel;
    uptime: number;
    totalAlerts: number;
    acknowledgedAlerts: number;
  };
  trends: HealthTrends;
  topIssues: Array<{ component: string; count: number; severity: HealthLevel }>;
  recommendations: string[];
  generatedAt: string;
}

export interface HealthTrends {
  responseTime: TrendDirection;
  memoryUsage: TrendDirection;
  errorRate: TrendDirection;
  cacheHitRate: TrendDirection;
}

export type TrendDirection = 'increasing' | 'decreasing' | 'stable';

// Global dashboard instance
let globalHealthDashboard: ConfigurationHealthDashboard | null = null;

/**
 * Get or create the global health dashboard
 */
export function getGlobalHealthDashboard(config?: Partial<DashboardConfig>): ConfigurationHealthDashboard {
  if (!globalHealthDashboard) {
    globalHealthDashboard = new ConfigurationHealthDashboard(config);
  }
  return globalHealthDashboard;
}

/**
 * Set the global health dashboard
 */
export function setGlobalHealthDashboard(dashboard: ConfigurationHealthDashboard): void {
  globalHealthDashboard = dashboard;
}

/**
 * Start health monitoring with automatic refresh
 */
export function startHealthMonitoring(config?: Partial<DashboardConfig>): ConfigurationHealthDashboard {
  const dashboard = getGlobalHealthDashboard(config);
  
  // Start periodic health checks
  const refreshInterval = dashboard.getConfig().refreshInterval;
  setInterval(async () => {
    try {
      await dashboard.getSystemHealth();
    } catch (error) {
      console.error('Health monitoring error:', error);
    }
  }, refreshInterval);
  
  return dashboard;
}

/**
 * Generate and export health dashboard HTML
 */
export function generateDashboardHTML(healthStatus: SystemHealthStatus): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configuration System Health Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .dashboard { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status-healthy { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-critical { color: #dc3545; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .component-list { list-style: none; padding: 0; }
        .component-item { padding: 10px; margin: 5px 0; border-radius: 4px; }
        .component-healthy { background: #d4edda; }
        .component-warning { background: #fff3cd; }
        .component-critical { background: #f8d7da; }
        .alerts { margin-top: 20px; }
        .alert { padding: 15px; margin: 10px 0; border-radius: 4px; }
        .alert-warning { background: #fff3cd; border-left: 4px solid #ffc107; }
        .alert-critical { background: #f8d7da; border-left: 4px solid #dc3545; }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>Configuration System Health Dashboard</h1>
            <p class="status-${healthStatus.overall}">
                Overall Status: <strong>${healthStatus.overall.toUpperCase()}</strong>
            </p>
            <p>Last Updated: ${new Date(healthStatus.timestamp).toLocaleString()}</p>
            <p>Uptime: ${Math.floor(healthStatus.uptime / 1000 / 60)} minutes</p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <h3>Performance</h3>
                <div class="metric-value">${healthStatus.metrics.performance.averageResponseTime.toFixed(0)}ms</div>
                <p>Average Response Time</p>
                <p>Throughput: ${healthStatus.metrics.performance.throughput.toFixed(0)} req/s</p>
                <p>Error Rate: ${(healthStatus.metrics.performance.errorRate * 100).toFixed(2)}%</p>
            </div>
            
            <div class="metric-card">
                <h3>Cache</h3>
                <div class="metric-value">${(healthStatus.metrics.cache.hitRate * 100).toFixed(1)}%</div>
                <p>Hit Rate</p>
                <p>Total Entries: ${healthStatus.metrics.cache.totalEntries}</p>
                <p>Memory Usage: ${healthStatus.metrics.cache.memoryUsage.toFixed(1)}MB</p>
            </div>
            
            <div class="metric-card">
                <h3>Feature Flags</h3>
                <div class="metric-value">${healthStatus.metrics.featureFlags.totalFlags}</div>
                <p>Total Flags</p>
                <p>Enabled: ${healthStatus.metrics.featureFlags.enabledFlags}</p>
                <p>Evaluations/sec: ${healthStatus.metrics.featureFlags.evaluationsPerSecond}</p>
            </div>
            
            <div class="metric-card">
                <h3>Configuration</h3>
                <div class="metric-value">${healthStatus.metrics.configuration.activeSnapshots}</div>
                <p>Active Snapshots</p>
                <p>Success Rate: ${(healthStatus.metrics.configuration.validationSuccessRate * 100).toFixed(1)}%</p>
                <p>Rollbacks: ${healthStatus.metrics.configuration.rollbackCount}</p>
            </div>
        </div>
        
        <div class="metric-card">
            <h3>Component Health</h3>
            <ul class="component-list">
                ${Object.entries(healthStatus.components).map(([name, health]) => `
                    <li class="component-item component-${health.status}">
                        <strong>${name}</strong>: ${health.status.toUpperCase()}
                        <small>(${health.performance.averageResponseTime.toFixed(0)}ms avg)</small>
                    </li>
                `).join('')}
            </ul>
        </div>
        
        ${healthStatus.alerts.length > 0 ? `
        <div class="alerts">
            <h3>Active Alerts</h3>
            ${healthStatus.alerts.map(alert => `
                <div class="alert alert-${alert.level}">
                    <strong>${alert.component}</strong>: ${alert.message}
                    <small>${new Date(alert.timestamp).toLocaleString()}</small>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        ${healthStatus.recommendations.length > 0 ? `
        <div class="metric-card">
            <h3>Recommendations</h3>
            <ul>
                ${healthStatus.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
    </div>
</body>
</html>
  `;
}