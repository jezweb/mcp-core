/**
 * Environment Manager - Phase 2.3: Environment Management
 * 
 * Manages environment-specific configurations, deployment detection,
 * and environment validation for the MCP server across all deployment targets.
 */

import { MCPServerConfig, ValidationResult } from '../types/config-types.js';
import { deepMerge } from './defaults.js';
import { ConfigurationValidator } from './validator.js';
import { RuntimeConfigurationManager } from './runtime-manager.js';

/**
 * Environment detection result
 */
export interface EnvironmentDetectionResult {
  environment: string;
  deployment: string;
  confidence: number;
  source: string;
  metadata?: Record<string, any>;
}

/**
 * Environment validation result
 */
export interface EnvironmentValidationResult extends ValidationResult {
  environment: string;
  deployment: string;
  configurationPath?: string;
  recommendations?: string[];
}

/**
 * Environment-specific configuration loader
 */
export class EnvironmentManager {
  private validator: ConfigurationValidator;
  private configCache: Map<string, MCPServerConfig> = new Map();
  private detectionCache: EnvironmentDetectionResult | null = null;
  private runtimeManager?: RuntimeConfigurationManager;

  constructor(runtimeManager?: RuntimeConfigurationManager) {
    this.validator = new ConfigurationValidator();
    this.runtimeManager = runtimeManager;
  }

  /**
   * Detect the current environment and deployment type
   */
  detectEnvironment(): EnvironmentDetectionResult {
    if (this.detectionCache) {
      return this.detectionCache;
    }

    const detectionResults: EnvironmentDetectionResult[] = [];

    // Check for explicit environment variables
    if (process.env.NODE_ENV) {
      detectionResults.push({
        environment: process.env.NODE_ENV,
        deployment: this.detectDeploymentType(),
        confidence: 0.9,
        source: 'NODE_ENV',
        metadata: { value: process.env.NODE_ENV },
      });
    }

    if (process.env.ENVIRONMENT) {
      detectionResults.push({
        environment: process.env.ENVIRONMENT,
        deployment: this.detectDeploymentType(),
        confidence: 0.85,
        source: 'ENVIRONMENT',
        metadata: { value: process.env.ENVIRONMENT },
      });
    }

    // Check for Cloudflare Workers environment
    if (typeof globalThis.caches !== 'undefined' || process.env.CF_PAGES) {
      detectionResults.push({
        environment: 'production',
        deployment: 'cloudflare',
        confidence: 0.95,
        source: 'cloudflare-detection',
        metadata: { 
          cfPages: !!process.env.CF_PAGES,
          caches: typeof globalThis.caches !== 'undefined',
        },
      });
    }

    // Check for development indicators
    if (process.env.DEBUG === 'true' || process.argv.includes('--debug')) {
      detectionResults.push({
        environment: 'development',
        deployment: 'local',
        confidence: 0.8,
        source: 'debug-flags',
        metadata: { 
          debug: process.env.DEBUG,
          argv: process.argv.includes('--debug'),
        },
      });
    }

    // Check for test environment indicators
    if (process.env.npm_lifecycle_event?.includes('test') || 
        process.argv.some(arg => arg.includes('test'))) {
      detectionResults.push({
        environment: 'test',
        deployment: 'local',
        confidence: 0.9,
        source: 'test-detection',
        metadata: { 
          npmScript: process.env.npm_lifecycle_event,
          testArgs: process.argv.filter(arg => arg.includes('test')),
        },
      });
    }

    // Check for CI/CD environment
    if (process.env.CI || process.env.GITHUB_ACTIONS || process.env.GITLAB_CI) {
      detectionResults.push({
        environment: 'test',
        deployment: 'ci',
        confidence: 0.85,
        source: 'ci-detection',
        metadata: { 
          ci: process.env.CI,
          github: process.env.GITHUB_ACTIONS,
          gitlab: process.env.GITLAB_CI,
        },
      });
    }

    // Default fallback
    if (detectionResults.length === 0) {
      detectionResults.push({
        environment: 'development',
        deployment: 'local',
        confidence: 0.5,
        source: 'default-fallback',
        metadata: { reason: 'No environment indicators found' },
      });
    }

    // Select the result with highest confidence
    const result = detectionResults.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    this.detectionCache = result;
    return result;
  }

  /**
   * Detect deployment type based on environment indicators
   */
  private detectDeploymentType(): string {
    // Cloudflare Workers
    if (typeof globalThis.caches !== 'undefined' || process.env.CF_PAGES) {
      return 'cloudflare';
    }

    // NPM package (stdio transport)
    if (process.stdin && process.stdout && !process.env.HTTP_PORT) {
      return 'npm';
    }

    // HTTP server
    if (process.env.HTTP_PORT || process.env.PORT) {
      return 'http';
    }

    // Default to local
    return 'local';
  }

  /**
   * Load environment-specific configuration
   */
  async loadEnvironmentConfig(environment?: string): Promise<MCPServerConfig> {
    const detectedEnv = environment || this.detectEnvironment().environment;
    
    // Check cache first
    if (this.configCache.has(detectedEnv)) {
      return this.configCache.get(detectedEnv)!;
    }

    try {
      // Try to load environment-specific configuration file
      const configPath = `./environments/${detectedEnv}.json`;
      const config = await this.loadConfigurationFile(configPath);
      
      // Cache the loaded configuration
      this.configCache.set(detectedEnv, config);
      
      // Update runtime manager if available
      if (this.runtimeManager) {
        await this.runtimeManager.updateConfiguration(config, {
          source: `environment:${detectedEnv}`,
          validate: true,
          rollbackOnFailure: true,
        });
      }
      
      return config;
    } catch (error) {
      console.warn(`Failed to load environment config for ${detectedEnv}:`, error);
      
      // Fallback to development configuration
      if (detectedEnv !== 'development') {
        return this.loadEnvironmentConfig('development');
      }
      
      // If even development config fails, throw error
      throw new Error(`Failed to load any environment configuration: ${error}`);
    }
  }

  /**
   * Load configuration from file (placeholder for actual file loading)
   */
  private async loadConfigurationFile(path: string): Promise<MCPServerConfig> {
    // In a real implementation, this would load from the file system
    // For now, we'll return the appropriate configuration based on the path
    
    if (path.includes('development.json')) {
      return this.getDevelopmentConfig();
    } else if (path.includes('production.json')) {
      return this.getProductionConfig();
    } else if (path.includes('staging.json')) {
      return this.getStagingConfig();
    } else if (path.includes('test.json')) {
      return this.getTestConfig();
    }
    
    throw new Error(`Unknown configuration file: ${path}`);
  }

  /**
   * Validate environment configuration
   */
  async validateEnvironmentConfig(
    environment: string, 
    config?: MCPServerConfig
  ): Promise<EnvironmentValidationResult> {
    const configToValidate = config || await this.loadEnvironmentConfig(environment);
    const detection = this.detectEnvironment();
    
    // Basic validation using the configuration validator
    const baseValidation = await this.validator.validate(configToValidate);
    
    // Environment-specific validation
    const environmentValidation = this.validateEnvironmentSpecificRules(
      environment, 
      configToValidate, 
      detection
    );
    
    return {
      ...baseValidation,
      environment,
      deployment: detection.deployment,
      configurationPath: `environments/${environment}.json`,
      recommendations: this.generateEnvironmentRecommendations(
        environment, 
        configToValidate, 
        detection
      ),
    };
  }

  /**
   * Validate environment-specific rules
   */
  private validateEnvironmentSpecificRules(
    environment: string,
    config: MCPServerConfig,
    detection: EnvironmentDetectionResult
  ): ValidationResult {
    const errors: Array<{ code: string; path: string; message: string; severity: 'error' | 'warning' }> = [];
    const warnings: Array<{ code: string; path: string; message: string; severity: 'error' | 'warning' }> = [];

    // Production-specific validations
    if (environment === 'production') {
      if (config.deployment?.debug === true) {
        errors.push({
          code: 'PROD_DEBUG_ENABLED',
          path: 'deployment.debug',
          message: 'Debug mode should be disabled in production',
          severity: 'error',
        });
      }

      if (config.deployment?.logLevel === 'debug') {
        warnings.push({
          code: 'PROD_DEBUG_LOGGING',
          path: 'deployment.logLevel',
          message: 'Debug log level not recommended for production',
          severity: 'warning',
        });
      }

      if (config.security?.cors?.origins?.includes('*')) {
        errors.push({
          code: 'PROD_WILDCARD_CORS',
          path: 'security.cors.origins',
          message: 'Wildcard CORS origins not allowed in production',
          severity: 'error',
        });
      }
    }

    // Development-specific validations
    if (environment === 'development') {
      if (config.performance?.concurrency?.maxConcurrentRequests &&
          config.performance.concurrency.maxConcurrentRequests > 20) {
        warnings.push({
          code: 'DEV_HIGH_CONCURRENCY',
          path: 'performance.concurrency.maxConcurrentRequests',
          message: 'High concurrency limit may impact development performance',
          severity: 'warning',
        });
      }
    }

    // Test-specific validations
    if (environment === 'test') {
      if (config.api?.openai?.timeout && config.api.openai.timeout > 10000) {
        warnings.push({
          code: 'TEST_LONG_TIMEOUT',
          path: 'api.openai.timeout',
          message: 'Long timeouts may slow down test execution',
          severity: 'warning',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate environment-specific recommendations
   */
  private generateEnvironmentRecommendations(
    environment: string,
    config: MCPServerConfig,
    detection: EnvironmentDetectionResult
  ): string[] {
    const recommendations: string[] = [];

    // Environment mismatch recommendations
    if (detection.confidence < 0.8) {
      recommendations.push(
        `Environment detection confidence is low (${Math.round(detection.confidence * 100)}%). ` +
        'Consider setting NODE_ENV or ENVIRONMENT explicitly.'
      );
    }

    // Performance recommendations
    if (environment === 'production' && config.features?.monitoring?.enabled === false) {
      recommendations.push('Enable monitoring in production for better observability.');
    }

    if (environment === 'development' && config.runtime?.hotReload === false) {
      recommendations.push('Enable hot reload in development for better developer experience.');
    }

    // Security recommendations
    if (environment !== 'development' && config.security?.authentication?.required === false) {
      recommendations.push('Consider enabling authentication for non-development environments.');
    }

    return recommendations;
  }

  /**
   * Get all available environments
   */
  getAvailableEnvironments(): string[] {
    return ['development', 'staging', 'production', 'test'];
  }

  /**
   * Clear configuration cache
   */
  clearCache(): void {
    this.configCache.clear();
    this.detectionCache = null;
  }

  /**
   * Merge environment config with overrides
   */
  mergeWithOverrides(
    baseConfig: MCPServerConfig,
    overrides: Partial<MCPServerConfig>
  ): MCPServerConfig {
    const mergedConfig = deepMerge(baseConfig, overrides);
    
    // Update runtime manager if available
    if (this.runtimeManager) {
      this.runtimeManager.updateConfiguration(mergedConfig, {
        source: 'environment-merge',
        validate: false, // Skip validation as this is just a merge operation
        notifyWatchers: false,
      }).catch(error => {
        console.warn('Failed to update runtime manager with merged config:', error);
      });
    }
    
    return mergedConfig;
  }

  /**
   * Set runtime configuration manager
   */
  setRuntimeManager(runtimeManager: RuntimeConfigurationManager): void {
    this.runtimeManager = runtimeManager;
  }

  /**
   * Get runtime configuration manager
   */
  getRuntimeManager(): RuntimeConfigurationManager | undefined {
    return this.runtimeManager;
  }

  /**
   * Apply environment configuration at runtime
   */
  async applyEnvironmentConfigAtRuntime(environment: string): Promise<void> {
    if (!this.runtimeManager) {
      throw new Error('Runtime manager not available for runtime configuration updates');
    }

    const config = await this.loadEnvironmentConfig(environment);
    await this.runtimeManager.updateConfiguration(config, {
      source: `runtime-environment:${environment}`,
      validate: true,
      rollbackOnFailure: true,
    });
  }

  /**
   * Switch environment at runtime
   */
  async switchEnvironmentAtRuntime(newEnvironment: string): Promise<{
    success: boolean;
    oldEnvironment: string;
    newEnvironment: string;
    error?: Error;
  }> {
    const currentDetection = this.detectEnvironment();
    const oldEnvironment = currentDetection.environment;

    try {
      // Clear detection cache to force re-detection
      this.detectionCache = null;
      
      // Load new environment configuration
      await this.applyEnvironmentConfigAtRuntime(newEnvironment);
      
      return {
        success: true,
        oldEnvironment,
        newEnvironment,
      };
    } catch (error) {
      return {
        success: false,
        oldEnvironment,
        newEnvironment,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  // Configuration getters (these would normally load from files)
  private getDevelopmentConfig(): MCPServerConfig {
    return {
      server: {
        name: 'openai-assistants-mcp',
        version: '2.2.4',
        description: 'Development OpenAI Assistants MCP Server',
        environment: 'development',
      },
      api: {
        openai: {
          apiKey: '',
          baseUrl: 'https://api.openai.com/v1',
          timeout: 30000,
          retries: 3,
          maxTokens: 4096,
          model: 'gpt-4',
        },
      },
      features: {
        tools: { enabled: true, listChanged: true, categories: [], rateLimit: 50, maxConcurrent: 5 },
        resources: { enabled: true, subscribe: true, listChanged: true, maxSize: 2097152, caching: true },
        prompts: { enabled: true, listChanged: true, caching: true, maxTemplates: 50 },
        completions: { enabled: true, streaming: true, maxLength: 8192 },
        validation: { enabled: true, strict: false, schemas: true, sanitization: true },
        monitoring: { enabled: true, metrics: true, logging: true, tracing: true, analytics: true },
      },
      performance: {
        pagination: { defaultLimit: 10, maxLimit: 50, allowUnlimited: true },
        caching: { enabled: true, ttl: 60000, maxSize: 50, strategy: 'lru' },
        concurrency: { maxConcurrentRequests: 10, requestTimeout: 30000, queueSize: 50 },
        memory: { maxHeapSize: 268435456, gcThreshold: 0.7, monitoring: true },
      },
      security: {
        cors: { enabled: true, origins: ['*'], methods: ['POST', 'OPTIONS'], headers: ['Content-Type', 'Authorization'], credentials: false },
        rateLimit: { enabled: false, requests: 1000, window: 60000, skipSuccessfulRequests: true, skipFailedRequests: false },
        validation: { strictMode: false, sanitizeInputs: true, maxInputSize: 2097152, allowedMimeTypes: ['application/json', 'text/plain'] },
        authentication: { required: false, methods: ['bearer'], tokenExpiry: 7200000 },
      },
      deployment: {
        type: 'local',
        transport: 'stdio',
        debug: true,
        logLevel: 'debug',
        region: 'local',
        timezone: 'UTC',
      },
      runtime: {
        hotReload: true,
        configRefreshInterval: 5000,
        gracefulShutdown: true,
        healthCheck: { enabled: true, interval: 15000, timeout: 3000 },
        metrics: { enabled: true, interval: 30000, retention: 3600000 },
      },
    } as MCPServerConfig;
  }

  private getProductionConfig(): MCPServerConfig {
    return {
      server: {
        name: 'openai-assistants-mcp',
        version: '2.2.4',
        description: 'Production OpenAI Assistants MCP Server',
        environment: 'production',
      },
      api: {
        openai: {
          apiKey: '',
          baseUrl: 'https://api.openai.com/v1',
          timeout: 30000,
          retries: 3,
          maxTokens: 4096,
          model: 'gpt-4',
        },
      },
      features: {
        tools: { enabled: true, listChanged: false, categories: [], rateLimit: 100, maxConcurrent: 20 },
        resources: { enabled: true, subscribe: false, listChanged: false, maxSize: 1048576, caching: true },
        prompts: { enabled: true, listChanged: false, caching: true, maxTemplates: 100 },
        completions: { enabled: true, streaming: false, maxLength: 4096 },
        validation: { enabled: true, strict: true, schemas: true, sanitization: true },
        monitoring: { enabled: true, metrics: true, logging: true, tracing: false, analytics: true },
      },
      performance: {
        pagination: { defaultLimit: 20, maxLimit: 100, allowUnlimited: false },
        caching: { enabled: true, ttl: 300000, maxSize: 200, strategy: 'lru' },
        concurrency: { maxConcurrentRequests: 100, requestTimeout: 30000, queueSize: 200 },
        memory: { maxHeapSize: 536870912, gcThreshold: 0.8, monitoring: true },
      },
      security: {
        cors: { enabled: true, origins: ['https://api.openai.com'], methods: ['POST', 'OPTIONS'], headers: ['Content-Type', 'Authorization'], credentials: false },
        rateLimit: { enabled: true, requests: 100, window: 60000, skipSuccessfulRequests: false, skipFailedRequests: false },
        validation: { strictMode: true, sanitizeInputs: true, maxInputSize: 1048576, allowedMimeTypes: ['application/json'] },
        authentication: { required: true, methods: ['bearer'], tokenExpiry: 3600000 },
      },
      deployment: {
        type: 'cloudflare',
        transport: 'http',
        debug: false,
        logLevel: 'warn',
        region: 'auto',
        timezone: 'UTC',
      },
      runtime: {
        hotReload: false,
        configRefreshInterval: 300000,
        gracefulShutdown: true,
        healthCheck: { enabled: true, interval: 30000, timeout: 5000 },
        metrics: { enabled: true, interval: 60000, retention: 86400000 },
      },
    } as MCPServerConfig;
  }

  private getStagingConfig(): MCPServerConfig {
    const prodConfig = this.getProductionConfig();
    return {
      ...prodConfig,
      server: {
        ...prodConfig.server,
        description: 'Staging OpenAI Assistants MCP Server',
        environment: 'staging',
      },
      deployment: {
        ...prodConfig.deployment,
        logLevel: 'info',
      },
      runtime: {
        ...prodConfig.runtime,
        configRefreshInterval: 120000,
        metrics: {
          ...prodConfig.runtime.metrics,
          retention: 43200000,
        },
      },
    } as MCPServerConfig;
  }

  private getTestConfig(): MCPServerConfig {
    return {
      server: {
        name: 'openai-assistants-mcp',
        version: '2.2.4',
        description: 'Test OpenAI Assistants MCP Server',
        environment: 'test',
      },
      api: {
        openai: {
          apiKey: 'test-api-key-placeholder',
          baseUrl: 'https://api.openai.com/v1',
          timeout: 5000,
          retries: 1,
          maxTokens: 1024,
          model: 'gpt-3.5-turbo',
        },
      },
      features: {
        tools: { enabled: true, listChanged: true, categories: [], rateLimit: 10, maxConcurrent: 3 },
        resources: { enabled: true, subscribe: false, listChanged: true, maxSize: 524288, caching: false },
        prompts: { enabled: true, listChanged: true, caching: false, maxTemplates: 10 },
        completions: { enabled: true, streaming: false, maxLength: 1024 },
        validation: { enabled: true, strict: true, schemas: true, sanitization: true },
        monitoring: { enabled: false, metrics: false, logging: false, tracing: false, analytics: false },
      },
      performance: {
        pagination: { defaultLimit: 5, maxLimit: 10, allowUnlimited: false },
        caching: { enabled: false, ttl: 10000, maxSize: 10, strategy: 'lru' },
        concurrency: { maxConcurrentRequests: 5, requestTimeout: 5000, queueSize: 10 },
        memory: { maxHeapSize: 134217728, gcThreshold: 0.6, monitoring: false },
      },
      security: {
        cors: { enabled: true, origins: ['*'], methods: ['POST', 'OPTIONS'], headers: ['Content-Type', 'Authorization'], credentials: false },
        rateLimit: { enabled: false, requests: 1000, window: 60000, skipSuccessfulRequests: true, skipFailedRequests: true },
        validation: { strictMode: false, sanitizeInputs: true, maxInputSize: 524288, allowedMimeTypes: ['application/json', 'text/plain'] },
        authentication: { required: false, methods: ['bearer'], tokenExpiry: 3600000 },
      },
      deployment: {
        type: 'local',
        transport: 'stdio',
        debug: true,
        logLevel: 'debug',
        region: 'test',
        timezone: 'UTC',
      },
      runtime: {
        hotReload: false,
        configRefreshInterval: 1000,
        gracefulShutdown: false,
        healthCheck: { enabled: false, interval: 5000, timeout: 1000 },
        metrics: { enabled: false, interval: 10000, retention: 60000 },
      },
    } as MCPServerConfig;
  }
}

/**
 * Global environment manager instance
 */
let globalEnvironmentManager: EnvironmentManager | null = null;

/**
 * Get or create the global environment manager
 */
export function getGlobalEnvironmentManager(): EnvironmentManager {
  if (!globalEnvironmentManager) {
    globalEnvironmentManager = new EnvironmentManager();
  }
  return globalEnvironmentManager;
}

/**
 * Set the global environment manager
 */
export function setGlobalEnvironmentManager(manager: EnvironmentManager): void {
  globalEnvironmentManager = manager;
}

/**
 * Convenience function to detect current environment
 */
export function detectCurrentEnvironment(): EnvironmentDetectionResult {
  return getGlobalEnvironmentManager().detectEnvironment();
}

/**
 * Convenience function to load environment configuration
 */
export async function loadEnvironmentConfiguration(environment?: string): Promise<MCPServerConfig> {
  return getGlobalEnvironmentManager().loadEnvironmentConfig(environment);
}

/**
 * Convenience function to validate environment configuration
 */
export async function validateEnvironmentConfiguration(
  environment: string,
  config?: MCPServerConfig
): Promise<EnvironmentValidationResult> {
  return getGlobalEnvironmentManager().validateEnvironmentConfig(environment, config);
}