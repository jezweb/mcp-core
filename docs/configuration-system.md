# Configuration System Documentation

## Overview

The OpenAI Assistants MCP Server Configuration Management System provides a comprehensive, enterprise-grade solution for managing configuration across different environments and deployment scenarios. This system was implemented in Phase 2 of the project and includes advanced features like feature flags, hot reloading, caching, synchronization, and audit trails.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Core Components](#core-components)
- [Getting Started](#getting-started)
- [Configuration Structure](#configuration-structure)
- [Environment Management](#environment-management)
- [Feature Flags](#feature-flags)
- [Runtime Configuration](#runtime-configuration)
- [Deployment Integration](#deployment-integration)
- [Performance Optimization](#performance-optimization)
- [Monitoring and Health Checks](#monitoring-and-health-checks)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Migration Guide](#migration-guide)

## Architecture Overview

The configuration system follows a modular architecture with the following key principles:

- **Separation of Concerns**: Each component has a specific responsibility
- **Environment Awareness**: Automatic detection and configuration for different environments
- **Performance Optimization**: Caching, lazy loading, and efficient updates
- **Reliability**: Validation, rollback capabilities, and health monitoring
- **Extensibility**: Plugin architecture and customizable components

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                Configuration System                         │
├─────────────────────────────────────────────────────────────┤
│  ConfigurationManager  │  EnvironmentManager  │  Validator  │
├─────────────────────────────────────────────────────────────┤
│  FeatureFlagsEngine    │  RuntimeManager      │  HotReload  │
├─────────────────────────────────────────────────────────────┤
│  CacheManager          │  SyncManager         │  AuditTrail │
├─────────────────────────────────────────────────────────────┤
│  DeploymentHealth      │  PipelineManager     │  Dashboard  │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### ConfigurationManager

The central component responsible for loading, validating, and managing configuration data.

```typescript
import { ConfigurationManager } from './shared/config/manager.js';

const manager = new ConfigurationManager({
  environment: 'production',
  sources: [
    { name: 'env-vars', type: 'environment' },
    { name: 'config-file', type: 'file', path: './config.json' }
  ]
});

await manager.loadConfiguration();
const config = manager.getConfiguration();
```

### EnvironmentManager

Handles environment detection and environment-specific configuration loading.

```typescript
import { EnvironmentManager } from './shared/config/environment-manager.js';

const envManager = new EnvironmentManager();
const detection = envManager.detectEnvironment();
const envConfig = await envManager.loadEnvironmentConfig(detection.environment);
```

### FeatureFlagsEngine

Provides dynamic feature flag evaluation with support for rules, variants, and targeting.

```typescript
import { FeatureFlagsEngine } from './shared/config/feature-flags.js';

const featureFlags = new FeatureFlagsEngine();
featureFlags.registerFlags([
  {
    name: 'advanced-tools',
    enabled: true,
    rules: [
      {
        conditions: [{ field: 'environment', operator: 'equals', value: 'production' }],
        enabled: true
      }
    ]
  }
]);

const isEnabled = featureFlags.isEnabled('advanced-tools', { environment: 'production' });
```

## Getting Started

### Installation

The configuration system is included with the OpenAI Assistants MCP Server. No additional installation is required.

### Basic Setup

1. **Initialize the Configuration System**:

```typescript
import { ConfigurationSystem, initializeGlobalConfig } from './shared/config/index.js';

// Initialize with default settings
await initializeGlobalConfig();

// Or create a custom instance
const configSystem = new ConfigurationSystem();
await configSystem.initialize();
```

2. **Access Configuration**:

```typescript
import { getConfig, isFeatureEnabled } from './shared/config/index.js';

const config = getConfig();
const hasAdvancedFeatures = isFeatureEnabled('advanced-tools');
```

3. **Update Configuration at Runtime**:

```typescript
import { updateConfig } from './shared/config/index.js';

await updateConfig({
  server: { name: 'updated-server' },
  features: { newFeature: { enabled: true } }
});
```

### Environment Variables

The system automatically detects and uses the following environment variables:

- `NODE_ENV`: Environment type (development, staging, production, test)
- `ENVIRONMENT`: Alternative environment specification
- `CF_PAGES`: Cloudflare Pages deployment detection
- `MCP_SERVER_NAME`: Override server name
- `DEBUG`: Enable debug logging

## Configuration Structure

### Base Configuration Schema

```typescript
interface MCPServerConfig {
  server: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production' | 'test';
    description?: string;
  };
  
  api: {
    openai: {
      apiKey: string;
      baseUrl?: string;
      timeout?: number;
      retries?: number;
      maxTokens?: number;
      model?: string;
    };
  };
  
  deployment: {
    type: 'local' | 'cloudflare' | 'npm';
    transport: 'stdio' | 'http';
    debug: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    region?: string;
    timezone?: string;
  };
  
  features: Record<string, {
    enabled: boolean;
    config?: any;
  }>;
  
  runtime: {
    hotReload: boolean;
    configRefreshInterval: number;
    gracefulShutdown: boolean;
    healthCheck: {
      enabled: boolean;
      interval: number;
      timeout: number;
    };
    metrics: {
      enabled: boolean;
      interval: number;
      retention: number;
    };
  };
  
  performance: {
    memory: {
      maxHeapSize: number;
    };
    concurrency: {
      requestTimeout: number;
      maxConcurrentRequests?: number;
    };
  };
}
```

### Configuration Sources

The system supports multiple configuration sources with priority ordering:

1. **Environment Variables** (highest priority)
2. **Command Line Arguments**
3. **Configuration Files** (JSON, YAML)
4. **Remote Configuration**
5. **Default Values** (lowest priority)

```typescript
const sources = [
  { name: 'env', type: 'environment' },
  { name: 'cli', type: 'arguments' },
  { name: 'file', type: 'file', path: './config.json' },
  { name: 'remote', type: 'http', url: 'https://config.example.com/config' }
];

await configSystem.initialize(sources);
```

## Environment Management

### Automatic Environment Detection

The system automatically detects the deployment environment based on:

- Environment variables (`NODE_ENV`, `ENVIRONMENT`)
- Platform indicators (Cloudflare Workers, NPM package)
- File system structure
- Network configuration

```typescript
const detection = environmentManager.detectEnvironment();
console.log(detection);
// {
//   environment: 'production',
//   deployment: 'cloudflare',
//   confidence: 0.95,
//   metadata: { cloudflare: { pages: true } }
// }
```

### Environment-Specific Configuration

Each environment has its own configuration file:

- `shared/config/environments/development.json`
- `shared/config/environments/staging.json`
- `shared/config/environments/production.json`
- `shared/config/environments/test.json`

Example production configuration:

```json
{
  "server": {
    "environment": "production"
  },
  "deployment": {
    "type": "cloudflare",
    "transport": "http",
    "debug": false,
    "logLevel": "warn"
  },
  "runtime": {
    "hotReload": false,
    "configRefreshInterval": 300000
  },
  "performance": {
    "memory": {
      "maxHeapSize": 67108864
    },
    "concurrency": {
      "requestTimeout": 30000
    }
  }
}
```

### Environment Validation

```typescript
const validation = await environmentManager.validateEnvironmentConfig('production', config);
if (!validation.isValid) {
  console.error('Configuration validation failed:', validation.errors);
}
```

## Feature Flags

### Basic Feature Flags

```typescript
// Register feature flags
featureFlags.registerFlags([
  {
    name: 'beta-features',
    enabled: false,
    description: 'Enable beta features'
  },
  {
    name: 'advanced-analytics',
    enabled: true,
    description: 'Enable advanced analytics'
  }
]);

// Check if feature is enabled
if (featureFlags.isEnabled('beta-features')) {
  // Enable beta functionality
}
```

### Advanced Feature Flags with Rules

```typescript
featureFlags.registerFlags([
  {
    name: 'premium-features',
    enabled: false,
    rules: [
      {
        conditions: [
          { field: 'environment', operator: 'equals', value: 'production' },
          { field: 'userTier', operator: 'equals', value: 'premium' }
        ],
        enabled: true
      }
    ]
  }
]);

// Evaluate with context
const context = { environment: 'production', userTier: 'premium' };
const hasAccess = featureFlags.isEnabled('premium-features', context);
```

### Feature Flag Variants

```typescript
featureFlags.registerFlags([
  {
    name: 'ui-theme',
    enabled: true,
    variants: [
      { name: 'light', weight: 50, config: { theme: 'light' } },
      { name: 'dark', weight: 50, config: { theme: 'dark' } }
    ]
  }
]);

const variant = featureFlags.getVariant('ui-theme');
const config = featureFlags.getFeatureConfig('ui-theme');
```

## Runtime Configuration

### Hot Reloading

Enable automatic configuration reloading when files change:

```typescript
import { startHotReload, stopHotReload } from './shared/config/index.js';

// Start hot reloading
startHotReload({
  watchPaths: ['./config/', './environments/'],
  debounceMs: 1000
});

// Stop hot reloading
stopHotReload();
```

### Configuration Snapshots

Create and manage configuration snapshots for rollback:

```typescript
const runtimeManager = configSystem.getRuntimeManager();

// Create snapshot
const snapshotId = runtimeManager.createSnapshot('before-update', 'user-action');

// Update configuration
await runtimeManager.updateConfiguration({
  server: { name: 'new-name' }
});

// Rollback if needed
await runtimeManager.rollbackToSnapshot(snapshotId);
```

### Configuration Caching

Optimize performance with intelligent caching:

```typescript
import { getCachedConfig, setCachedConfig } from './shared/config/index.js';

// Cache configuration
await setCachedConfig('user-config', userConfig, 300000); // 5 minutes TTL

// Retrieve from cache
const cachedConfig = await getCachedConfig('user-config');
```

## Deployment Integration

### Cloudflare Workers

The system automatically optimizes for Cloudflare Workers:

- Memory usage optimization (< 128MB)
- Request timeout management (< 30s)
- Edge caching integration
- Environment variable handling

```typescript
// Cloudflare-specific configuration
{
  "deployment": {
    "type": "cloudflare",
    "transport": "http"
  },
  "performance": {
    "memory": {
      "maxHeapSize": 67108864  // 64MB
    },
    "concurrency": {
      "requestTimeout": 25000  // 25 seconds
    }
  }
}
```

### NPM Package

For local development and NPM package deployment:

```typescript
// NPM package configuration
{
  "deployment": {
    "type": "local",
    "transport": "stdio",
    "debug": true
  },
  "runtime": {
    "hotReload": true,
    "configRefreshInterval": 5000
  }
}
```

### Deployment Pipeline

Automate configuration deployment across environments:

```typescript
import { executeDeploymentPipeline } from './shared/config/index.js';

const results = await executeDeploymentPipeline(
  ['development', 'staging', 'production'],
  {
    skipValidation: false,
    skipHealthChecks: false,
    dryRun: false
  }
);
```

## Performance Optimization

### Benchmarks

The configuration system meets the following performance requirements:

- **Configuration Loading**: < 100ms for typical configurations
- **Runtime Updates**: < 50ms for feature flag changes
- **Cache Hit Ratio**: > 90% for repeated configuration access
- **Memory Usage**: < 50MB additional overhead for full system
- **Concurrent Access**: Support 100+ simultaneous configuration reads

### Optimization Strategies

1. **Lazy Loading**: Load configuration components only when needed
2. **Caching**: Intelligent caching with TTL and invalidation
3. **Batching**: Batch multiple configuration updates
4. **Compression**: Compress large configuration objects
5. **Indexing**: Index frequently accessed configuration paths

```typescript
// Performance-optimized configuration loading
const config = await configManager.loadConfiguration({
  lazy: true,
  cache: true,
  compress: true,
  batchSize: 10
});
```

## Monitoring and Health Checks

### Health Dashboard

Monitor system health in real-time:

```typescript
import { startHealthMonitoring, getGlobalHealthDashboard } from './shared/config/health-dashboard.js';

// Start monitoring
const dashboard = startHealthMonitoring({
  refreshInterval: 30000,
  alertThresholds: {
    responseTime: 1000,
    errorRate: 0.05,
    memoryUsage: 0.8
  }
});

// Get current health status
const health = await dashboard.getSystemHealth();
console.log(`System status: ${health.overall}`);
```

### Health Checks

Automated health checks validate:

- Configuration validity
- Component availability
- Performance metrics
- Resource usage
- Deployment constraints

```typescript
import { performHealthCheck } from './shared/config/index.js';

const healthResult = await performHealthCheck();
if (healthResult.status !== 'healthy') {
  console.warn('Health issues detected:', healthResult.recommendations);
}
```

### Audit Trail

Track all configuration changes:

```typescript
import { queryAuditLog } from './shared/config/index.js';

// Query recent changes
const recentChanges = await queryAuditLog({
  limit: 10,
  action: 'update'
});

// Get audit statistics
const stats = await auditTrailManager.getAuditStatistics();
```

## API Reference

### Core Functions

```typescript
// Configuration access
getConfig(): MCPServerConfig
updateConfig(updates: Partial<MCPServerConfig>): Promise<ValidationResult>
validateConfig(): ValidationResult

// Feature flags
isFeatureEnabled(flagName: string, context?: EvaluationContext): boolean
getFeatureVariant(flagName: string, context?: EvaluationContext): string | undefined
getFeatureConfig(flagName: string, context?: EvaluationContext): any

// Environment management
detectEnvironment(): EnvironmentDetection
loadEnvironmentConfig(environment: string): Promise<MCPServerConfig>
validateEnvironmentConfig(environment: string, config?: any): Promise<ValidationResult>

// Health monitoring
performHealthCheck(config?: any, environment?: string): Promise<HealthCheckResult>
executeDeploymentPipeline(environments?: string[], options?: PipelineOptions): Promise<PipelineResult[]>
```

### Configuration System Class

```typescript
class ConfigurationSystem {
  constructor()
  
  // Initialization
  async initialize(sources?: ConfigurationSource[]): Promise<void>
  async reset(): Promise<void>
  
  // Component access
  getManager(): ConfigurationManager
  getFeatureFlags(): FeatureFlagsEngine
  getValidator(): ConfigurationValidator
  getEnvironmentManager(): EnvironmentManager
  getHealthChecker(): DeploymentHealthChecker
  getPipelineManager(): DeploymentPipelineManager
  getRuntimeManager(): RuntimeConfigurationManager
  getHotReloadManager(): ConfigurationHotReloadManager
  getCacheManager(): ConfigurationCacheManager
  getSyncManager(): ConfigurationSyncManager
  getAuditTrailManager(): ConfigurationAuditTrailManager
  
  // Configuration operations
  getConfiguration(): MCPServerConfig
  async updateConfiguration(updates: DeepPartial<MCPServerConfig>): Promise<ValidationResult>
  validateConfiguration(): ValidationResult
  
  // Feature flags
  isFeatureEnabled(flagName: string, context?: EvaluationContext): boolean
  getFeatureVariant(flagName: string, context?: EvaluationContext): string | undefined
  getFeatureConfig(flagName: string, context?: EvaluationContext): any
  
  // State management
  exportState(): ConfigurationState
  async importState(state: Partial<ConfigurationState>): Promise<ValidationResult[]>
}
```

## Best Practices

### Configuration Organization

1. **Use Environment-Specific Files**: Separate configuration by environment
2. **Hierarchical Structure**: Organize configuration in logical groups
3. **Validation**: Always validate configuration before use
4. **Documentation**: Document all configuration options
5. **Versioning**: Version configuration changes

### Security

1. **Sensitive Data**: Use environment variables for secrets
2. **Validation**: Validate all configuration inputs
3. **Access Control**: Limit configuration access by role
4. **Audit Trail**: Log all configuration changes
5. **Encryption**: Encrypt sensitive configuration data

### Performance

1. **Caching**: Cache frequently accessed configuration
2. **Lazy Loading**: Load configuration on demand
3. **Batching**: Batch configuration updates
4. **Monitoring**: Monitor configuration performance
5. **Optimization**: Regularly review and optimize

### Deployment

1. **Gradual Rollout**: Deploy configuration changes gradually
2. **Health Checks**: Validate deployment health
3. **Rollback Plan**: Always have a rollback strategy
4. **Testing**: Test configuration in staging first
5. **Monitoring**: Monitor post-deployment metrics

## Troubleshooting

### Common Issues

#### Configuration Not Loading

**Problem**: Configuration fails to load or returns default values.

**Solutions**:
1. Check file paths and permissions
2. Validate JSON/YAML syntax
3. Verify environment variables
4. Check network connectivity for remote sources

```typescript
// Debug configuration loading
const manager = new ConfigurationManager({ debug: true });
await manager.loadConfiguration();
```

#### Feature Flags Not Working

**Problem**: Feature flags return unexpected values.

**Solutions**:
1. Verify flag registration
2. Check evaluation context
3. Validate rule conditions
4. Review flag priority

```typescript
// Debug feature flag evaluation
const result = featureFlags.evaluateFlag('flag-name', context, { debug: true });
console.log('Evaluation result:', result);
```

#### Performance Issues

**Problem**: Configuration operations are slow.

**Solutions**:
1. Enable caching
2. Optimize configuration size
3. Use lazy loading
4. Check network latency

```typescript
// Performance monitoring
const startTime = performance.now();
const config = await getConfig();
const duration = performance.now() - startTime;
console.log(`Configuration loading took ${duration}ms`);
```

#### Memory Usage

**Problem**: High memory usage from configuration system.

**Solutions**:
1. Enable compression
2. Reduce cache size
3. Clean up unused snapshots
4. Optimize configuration structure

```typescript
// Monitor memory usage
const memoryUsage = process.memoryUsage();
console.log('Memory usage:', memoryUsage);
```

### Debugging Tools

#### Configuration Inspector

```typescript
import { ConfigurationSystem } from './shared/config/index.js';

const system = new ConfigurationSystem();
const state = system.exportState();
console.log('Current configuration state:', JSON.stringify(state, null, 2));
```

#### Health Dashboard

Access the health dashboard at `/health` (when running in HTTP mode) or generate a report:

```typescript
const dashboard = getGlobalHealthDashboard();
const report = dashboard.generateHealthReport();
console.log('Health report:', report);
```

#### Audit Log Analysis

```typescript
const auditManager = system.getAuditTrailManager();
const recentChanges = await auditManager.queryAuditLog({
  limit: 50,
  startDate: new Date(Date.now() - 86400000) // Last 24 hours
});
```

## Migration Guide

### From Version 1.x to 2.x

The configuration system was introduced in version 2.0. To migrate:

1. **Update Imports**:
```typescript
// Old
import config from './config.json';

// New
import { getConfig } from './shared/config/index.js';
const config = getConfig();
```

2. **Environment Variables**:
```bash
# Old
export SERVER_NAME="my-server"

# New (still supported)
export MCP_SERVER_NAME="my-server"
```

3. **Configuration Structure**:
```typescript
// Old format
{
  "name": "server",
  "tools": ["assistant-create", "assistant-list"]
}

// New format (auto-converted)
{
  "server": { "name": "server" },
  "features": {
    "assistants": { "enabled": true }
  }
}
```

### Legacy Configuration Support

The system automatically converts legacy configuration formats:

```typescript
// Legacy v1 format is automatically converted
const legacyConfig = {
  name: 'my-server',
  tools: { enabled: true, list: ['assistant-create'] }
};

// Automatically becomes:
const modernConfig = {
  server: { name: 'my-server' },
  features: { tools: { enabled: true } }
};
```

## Examples

See the `examples/configuration/` directory for complete examples:

- [Basic Setup](../examples/configuration/basic-setup.js)
- [Advanced Feature Flags](../examples/configuration/advanced-feature-flags.js)
- [Runtime Updates](../examples/configuration/runtime-updates.js)
- [Multi-Environment Deployment](../examples/configuration/multi-environment.js)
- [Custom Configuration Source](../examples/configuration/custom-source.js)

## Support

For additional support:

1. Check the [troubleshooting section](#troubleshooting)
2. Review the [API reference](#api-reference)
3. Examine the [examples](../examples/configuration/)
4. Check the health dashboard for system status
5. Review audit logs for configuration changes

## Contributing

To contribute to the configuration system:

1. Follow the existing code patterns
2. Add comprehensive tests
3. Update documentation
4. Ensure backward compatibility
5. Test across all supported environments