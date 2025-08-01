/**
 * Configuration Type Definitions - Phase 2: Configuration Management
 * 
 * Comprehensive type definitions for the centralized configuration system.
 * These types provide full TypeScript support for configuration management
 * across all deployment targets.
 */

/**
 * Server identity configuration
 */
export interface ServerConfig {
  name: string;
  version: string;
  description?: string;
  environment: 'development' | 'staging' | 'production' | 'test';
}

/**
 * API configuration for external services
 */
export interface APIConfig {
  openai: {
    apiKey: string;
    baseUrl?: string;
    timeout?: number;
    retries?: number;
    maxTokens?: number;
    model?: string;
  };
}

/**
 * Feature flags configuration
 */
export interface FeatureFlags {
  tools: {
    enabled: boolean;
    listChanged: boolean;
    categories?: string[];
    rateLimit?: number;
    maxConcurrent?: number;
  };
  resources: {
    enabled: boolean;
    subscribe: boolean;
    listChanged: boolean;
    maxSize?: number;
    caching?: boolean;
  };
  prompts: {
    enabled: boolean;
    listChanged: boolean;
    caching?: boolean;
    maxTemplates?: number;
  };
  completions: {
    enabled: boolean;
    streaming?: boolean;
    maxLength?: number;
  };
  validation: {
    enabled: boolean;
    strict: boolean;
    schemas?: boolean;
    sanitization?: boolean;
  };
  monitoring: {
    enabled: boolean;
    metrics: boolean;
    logging: boolean;
    tracing?: boolean;
    analytics?: boolean;
  };
}

/**
 * Performance configuration
 */
export interface PerformanceConfig {
  pagination: {
    defaultLimit: number;
    maxLimit: number;
    allowUnlimited?: boolean;
  };
  caching: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
    strategy?: 'lru' | 'fifo' | 'lfu';
  };
  concurrency: {
    maxConcurrentRequests: number;
    requestTimeout: number;
    queueSize?: number;
  };
  memory: {
    maxHeapSize?: number;
    gcThreshold?: number;
    monitoring?: boolean;
  };
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  cors: {
    enabled: boolean;
    origins: string[];
    methods: string[];
    headers?: string[];
    credentials?: boolean;
  };
  rateLimit: {
    enabled: boolean;
    requests: number;
    window: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
  };
  validation: {
    strictMode: boolean;
    sanitizeInputs: boolean;
    maxInputSize?: number;
    allowedMimeTypes?: string[];
  };
  authentication: {
    required: boolean;
    methods?: string[];
    tokenExpiry?: number;
  };
}

/**
 * Deployment-specific configuration
 */
export interface DeploymentConfig {
  type: 'cloudflare' | 'npm' | 'local';
  transport: 'http' | 'stdio';
  debug: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  region?: string;
  timezone?: string;
}

/**
 * Runtime configuration
 */
export interface RuntimeConfig {
  hotReload: boolean;
  configRefreshInterval?: number;
  gracefulShutdown: boolean;
  healthCheck?: {
    enabled: boolean;
    interval: number;
    timeout: number;
  };
  metrics?: {
    enabled: boolean;
    interval: number;
    retention: number;
  };
}

/**
 * Main configuration interface
 */
export interface MCPServerConfig {
  server: ServerConfig;
  api: APIConfig;
  features: FeatureFlags;
  performance: PerformanceConfig;
  security: SecurityConfig;
  deployment: DeploymentConfig;
  runtime: RuntimeConfig;
}

/**
 * Configuration validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata?: {
    validatedAt: string;
    validator: string;
    schema: string;
  };
}

/**
 * Configuration validation error
 */
export interface ValidationError {
  path: string;
  message: string;
  value?: any;
  expected?: any;
  code: string;
}

/**
 * Configuration validation warning
 */
export interface ValidationWarning {
  path: string;
  message: string;
  value?: any;
  suggestion?: string;
  code: string;
}

/**
 * Feature flag definition
 */
export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
  variants?: FeatureFlagVariant[];
  rules?: FeatureFlagRule[];
  metadata?: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    tags?: string[];
  };
}

/**
 * Feature flag variant for A/B testing
 */
export interface FeatureFlagVariant {
  name: string;
  weight: number;
  config?: Record<string, any>;
  description?: string;
}

/**
 * Feature flag evaluation rule
 */
export interface FeatureFlagRule {
  condition: string;
  action: 'enable' | 'disable' | 'variant';
  value?: any;
  description?: string;
}

/**
 * Feature flag evaluation context
 */
export interface EvaluationContext {
  userId?: string;
  sessionId?: string;
  environment: string;
  deployment: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Configuration change event
 */
export interface ConfigurationChangeEvent {
  type: 'update' | 'reload' | 'validate';
  path?: string;
  oldValue?: any;
  newValue?: any;
  timestamp: string;
  source: string;
  metadata?: Record<string, any>;
}

/**
 * Configuration watcher callback
 */
export type ConfigChangeCallback = (event: ConfigurationChangeEvent) => void | Promise<void>;

/**
 * Environment-specific configuration
 */
export interface EnvironmentConfig extends Partial<MCPServerConfig> {
  name: string;
  description?: string;
  inherits?: string;
  overrides?: Partial<MCPServerConfig>;
}

/**
 * Configuration source definition
 */
export interface ConfigurationSource {
  name: string;
  type: 'file' | 'environment' | 'runtime' | 'default';
  priority: number;
  loader: ConfigurationLoader;
  watcher?: ConfigurationWatcher;
}

/**
 * Configuration loader interface
 */
export interface ConfigurationLoader {
  load(): Promise<Partial<MCPServerConfig>>;
  validate?(config: Partial<MCPServerConfig>): ValidationResult;
}

/**
 * Configuration watcher interface
 */
export interface ConfigurationWatcher {
  watch(callback: ConfigChangeCallback): void;
  unwatch(): void;
  isWatching(): boolean;
}

/**
 * Configuration manager options
 */
export interface ConfigurationManagerOptions {
  environment: string;
  sources?: ConfigurationSource[];
  validation?: {
    enabled: boolean;
    strict: boolean;
    schema?: string;
  };
  caching?: {
    enabled: boolean;
    ttl: number;
  };
  watching?: {
    enabled: boolean;
    debounce: number;
  };
}

/**
 * Configuration schema definition
 */
export interface ConfigurationSchema {
  $schema: string;
  type: 'object';
  properties: Record<string, any>;
  required: string[];
  additionalProperties: boolean;
}

/**
 * Configuration merge strategy
 */
export type ConfigMergeStrategy = 'replace' | 'merge' | 'deep-merge' | 'array-concat';

/**
 * Configuration merge options
 */
export interface ConfigMergeOptions {
  strategy: ConfigMergeStrategy;
  arrayHandling?: 'replace' | 'concat' | 'merge';
  nullHandling?: 'keep' | 'remove' | 'replace';
  undefinedHandling?: 'keep' | 'remove' | 'replace';
}

/**
 * Type guards for configuration validation
 */
export const isValidEnvironment = (env: string): env is ServerConfig['environment'] => {
  return ['development', 'staging', 'production', 'test'].includes(env);
};

export const isValidDeploymentType = (type: string): type is DeploymentConfig['type'] => {
  return ['cloudflare', 'npm', 'local'].includes(type);
};

export const isValidTransportType = (transport: string): transport is DeploymentConfig['transport'] => {
  return ['http', 'stdio'].includes(transport);
};

export const isValidLogLevel = (level: string): level is DeploymentConfig['logLevel'] => {
  return ['error', 'warn', 'info', 'debug', 'trace'].includes(level);
};

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG_VALUES = {
  server: {
    name: 'openai-assistants-mcp',
    version: '2.2.4',
    environment: 'development' as const,
  },
  api: {
    openai: {
      timeout: 30000,
      retries: 3,
      maxTokens: 4096,
      model: 'gpt-4',
    },
  },
  features: {
    tools: {
      enabled: true,
      listChanged: false,
      rateLimit: 100,
      maxConcurrent: 10,
    },
    resources: {
      enabled: true,
      subscribe: false,
      listChanged: false,
      maxSize: 1024 * 1024, // 1MB
      caching: true,
    },
    prompts: {
      enabled: true,
      listChanged: false,
      caching: true,
      maxTemplates: 100,
    },
    completions: {
      enabled: true,
      streaming: false,
      maxLength: 4096,
    },
    validation: {
      enabled: true,
      strict: false,
      schemas: true,
      sanitization: true,
    },
    monitoring: {
      enabled: true,
      metrics: true,
      logging: true,
      tracing: false,
      analytics: false,
    },
  },
  performance: {
    pagination: {
      defaultLimit: 20,
      maxLimit: 100,
      allowUnlimited: false,
    },
    caching: {
      enabled: true,
      ttl: 300000, // 5 minutes
      maxSize: 100,
      strategy: 'lru' as const,
    },
    concurrency: {
      maxConcurrentRequests: 50,
      requestTimeout: 30000,
      queueSize: 100,
    },
    memory: {
      monitoring: true,
    },
  },
  security: {
    cors: {
      enabled: true,
      origins: ['*'],
      methods: ['POST', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization'],
      credentials: false,
    },
    rateLimit: {
      enabled: true,
      requests: 100,
      window: 60000, // 1 minute
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
    validation: {
      strictMode: false,
      sanitizeInputs: true,
      maxInputSize: 1024 * 1024, // 1MB
    },
    authentication: {
      required: false,
    },
  },
  deployment: {
    type: 'local' as const,
    transport: 'stdio' as const,
    debug: false,
    logLevel: 'info' as const,
  },
  runtime: {
    hotReload: false,
    configRefreshInterval: 30000, // 30 seconds
    gracefulShutdown: true,
    healthCheck: {
      enabled: true,
      interval: 30000,
      timeout: 5000,
    },
    metrics: {
      enabled: true,
      interval: 60000,
      retention: 86400000, // 24 hours
    },
  },
} as const;

/**
 * Configuration path utilities
 */
export class ConfigPath {
  static get(config: MCPServerConfig, path: string): any {
    return path.split('.').reduce((obj: any, key: string) => obj?.[key], config as any);
  }

  static set(config: MCPServerConfig, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((obj: any, key: string) => obj[key] = obj[key] || {}, config as any);
    target[lastKey] = value;
  }

  static has(config: MCPServerConfig, path: string): boolean {
    return this.get(config, path) !== undefined;
  }

  static delete(config: MCPServerConfig, path: string): boolean {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((obj: any, key: string) => obj?.[key], config as any);
    if (target && lastKey in target) {
      delete target[lastKey];
      return true;
    }
    return false;
  }
}