/**
 * Configuration Validator - Phase 2: Configuration Management
 * 
 * Provides comprehensive validation for configuration objects using
 * JSON Schema validation and custom business logic rules.
 */

import { 
  MCPServerConfig, 
  ValidationResult, 
  ValidationError, 
  ValidationWarning,
  isValidEnvironment,
  isValidDeploymentType,
  isValidTransportType,
  isValidLogLevel
} from '../types/config-types.js';
import { mcpServerConfigSchema } from './schema.js';

/**
 * Configuration validator class
 */
export class ConfigurationValidator {
  private schema: any;

  constructor() {
    this.schema = mcpServerConfigSchema;
  }

  /**
   * Validate a complete configuration object
   */
  async validate(config: MCPServerConfig): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Basic structure validation
      this.validateStructure(config, errors);

      // Server configuration validation
      this.validateServer(config.server, errors, warnings);

      // API configuration validation
      this.validateAPI(config.api, errors, warnings);

      // Feature flags validation
      this.validateFeatures(config.features, errors, warnings);

      // Performance configuration validation
      this.validatePerformance(config.performance, errors, warnings);

      // Security configuration validation
      this.validateSecurity(config.security, errors, warnings);

      // Deployment configuration validation
      this.validateDeployment(config.deployment, errors, warnings);

      // Runtime configuration validation
      this.validateRuntime(config.runtime, errors, warnings);

      // Cross-validation checks
      this.validateCrossReferences(config, errors, warnings);

    } catch (error) {
      errors.push({
        path: 'root',
        message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'VALIDATION_ERROR'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        validatedAt: new Date().toISOString(),
        validator: 'ConfigurationValidator',
        schema: 'mcpServerConfigSchema'
      }
    };
  }

  /**
   * Validate basic configuration structure
   */
  private validateStructure(config: any, errors: ValidationError[]): void {
    const requiredSections = ['server', 'api', 'features', 'performance', 'security', 'deployment', 'runtime'];
    
    for (const section of requiredSections) {
      if (!config[section]) {
        errors.push({
          path: section,
          message: `Required configuration section '${section}' is missing`,
          code: 'MISSING_SECTION'
        });
      }
    }
  }

  /**
   * Validate server configuration
   */
  private validateServer(server: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!server) return;

    // Required fields
    if (!server.name) {
      errors.push({
        path: 'server.name',
        message: 'Server name is required',
        code: 'MISSING_REQUIRED_FIELD'
      });
    }

    if (!server.version) {
      errors.push({
        path: 'server.version',
        message: 'Server version is required',
        code: 'MISSING_REQUIRED_FIELD'
      });
    }

    if (!server.environment) {
      errors.push({
        path: 'server.environment',
        message: 'Server environment is required',
        code: 'MISSING_REQUIRED_FIELD'
      });
    } else if (!isValidEnvironment(server.environment)) {
      errors.push({
        path: 'server.environment',
        message: `Invalid environment '${server.environment}'. Must be one of: development, staging, production, test`,
        value: server.environment,
        expected: ['development', 'staging', 'production', 'test'],
        code: 'INVALID_VALUE'
      });
    }

    // Version format validation
    if (server.version && !/^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?$/.test(server.version)) {
      warnings.push({
        path: 'server.version',
        message: 'Server version should follow semantic versioning format (e.g., 1.0.0)',
        value: server.version,
        suggestion: 'Use semantic versioning format: major.minor.patch',
        code: 'VERSION_FORMAT'
      });
    }
  }

  /**
   * Validate API configuration
   */
  private validateAPI(api: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!api?.openai) {
      errors.push({
        path: 'api.openai',
        message: 'OpenAI API configuration is required',
        code: 'MISSING_REQUIRED_SECTION'
      });
      return;
    }

    const openai = api.openai;

    // API key validation
    if (!openai.apiKey) {
      errors.push({
        path: 'api.openai.apiKey',
        message: 'OpenAI API key is required',
        code: 'MISSING_REQUIRED_FIELD'
      });
    } else if (openai.apiKey === 'test-api-key') {
      warnings.push({
        path: 'api.openai.apiKey',
        message: 'Using test API key - ensure this is intentional',
        code: 'TEST_API_KEY'
      });
    }

    // Timeout validation
    if (openai.timeout && (openai.timeout < 1000 || openai.timeout > 300000)) {
      warnings.push({
        path: 'api.openai.timeout',
        message: 'API timeout should be between 1000ms and 300000ms',
        value: openai.timeout,
        suggestion: 'Use a timeout between 1-300 seconds',
        code: 'TIMEOUT_RANGE'
      });
    }

    // Retries validation
    if (openai.retries && (openai.retries < 0 || openai.retries > 10)) {
      warnings.push({
        path: 'api.openai.retries',
        message: 'API retries should be between 0 and 10',
        value: openai.retries,
        suggestion: 'Use 0-10 retries',
        code: 'RETRIES_RANGE'
      });
    }
  }

  /**
   * Validate feature flags configuration
   */
  private validateFeatures(features: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!features) return;

    const requiredFeatures = ['tools', 'resources', 'prompts', 'completions', 'validation', 'monitoring'];
    
    for (const feature of requiredFeatures) {
      if (!features[feature]) {
        errors.push({
          path: `features.${feature}`,
          message: `Feature configuration '${feature}' is required`,
          code: 'MISSING_FEATURE_CONFIG'
        });
      } else if (typeof features[feature].enabled !== 'boolean') {
        errors.push({
          path: `features.${feature}.enabled`,
          message: `Feature '${feature}.enabled' must be a boolean`,
          value: features[feature].enabled,
          expected: 'boolean',
          code: 'INVALID_TYPE'
        });
      }
    }

    // Rate limit validation
    if (features.tools?.rateLimit && features.tools.rateLimit < 1) {
      warnings.push({
        path: 'features.tools.rateLimit',
        message: 'Tools rate limit should be at least 1',
        value: features.tools.rateLimit,
        suggestion: 'Use a positive rate limit',
        code: 'RATE_LIMIT_RANGE'
      });
    }
  }

  /**
   * Validate performance configuration
   */
  private validatePerformance(performance: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!performance) return;

    // Pagination validation
    if (performance.pagination) {
      const { defaultLimit, maxLimit } = performance.pagination;
      
      if (defaultLimit && maxLimit && defaultLimit > maxLimit) {
        errors.push({
          path: 'performance.pagination',
          message: 'Default limit cannot be greater than max limit',
          value: { defaultLimit, maxLimit },
          code: 'INVALID_PAGINATION_LIMITS'
        });
      }
    }

    // Concurrency validation
    if (performance.concurrency) {
      const { maxConcurrentRequests, requestTimeout } = performance.concurrency;
      
      if (maxConcurrentRequests && maxConcurrentRequests < 1) {
        warnings.push({
          path: 'performance.concurrency.maxConcurrentRequests',
          message: 'Max concurrent requests should be at least 1',
          value: maxConcurrentRequests,
          code: 'CONCURRENCY_RANGE'
        });
      }

      if (requestTimeout && requestTimeout < 1000) {
        warnings.push({
          path: 'performance.concurrency.requestTimeout',
          message: 'Request timeout should be at least 1000ms',
          value: requestTimeout,
          code: 'TIMEOUT_RANGE'
        });
      }
    }
  }

  /**
   * Validate security configuration
   */
  private validateSecurity(security: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!security) return;

    // CORS validation
    if (security.cors?.enabled && security.cors.origins?.includes('*')) {
      warnings.push({
        path: 'security.cors.origins',
        message: 'Using wildcard (*) in CORS origins may pose security risks',
        value: security.cors.origins,
        suggestion: 'Specify explicit origins for production',
        code: 'CORS_WILDCARD'
      });
    }

    // Rate limiting validation
    if (security.rateLimit?.enabled) {
      if (!security.rateLimit.requests || security.rateLimit.requests < 1) {
        errors.push({
          path: 'security.rateLimit.requests',
          message: 'Rate limit requests must be a positive number',
          value: security.rateLimit.requests,
          code: 'INVALID_RATE_LIMIT'
        });
      }

      if (!security.rateLimit.window || security.rateLimit.window < 1000) {
        errors.push({
          path: 'security.rateLimit.window',
          message: 'Rate limit window must be at least 1000ms',
          value: security.rateLimit.window,
          code: 'INVALID_RATE_LIMIT_WINDOW'
        });
      }
    }
  }

  /**
   * Validate deployment configuration
   */
  private validateDeployment(deployment: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!deployment) return;

    if (!isValidDeploymentType(deployment.type)) {
      errors.push({
        path: 'deployment.type',
        message: `Invalid deployment type '${deployment.type}'. Must be one of: cloudflare, npm, local`,
        value: deployment.type,
        expected: ['cloudflare', 'npm', 'local'],
        code: 'INVALID_DEPLOYMENT_TYPE'
      });
    }

    if (!isValidTransportType(deployment.transport)) {
      errors.push({
        path: 'deployment.transport',
        message: `Invalid transport type '${deployment.transport}'. Must be one of: http, stdio`,
        value: deployment.transport,
        expected: ['http', 'stdio'],
        code: 'INVALID_TRANSPORT_TYPE'
      });
    }

    if (!isValidLogLevel(deployment.logLevel)) {
      errors.push({
        path: 'deployment.logLevel',
        message: `Invalid log level '${deployment.logLevel}'. Must be one of: error, warn, info, debug, trace`,
        value: deployment.logLevel,
        expected: ['error', 'warn', 'info', 'debug', 'trace'],
        code: 'INVALID_LOG_LEVEL'
      });
    }
  }

  /**
   * Validate runtime configuration
   */
  private validateRuntime(runtime: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!runtime) return;

    // Health check validation
    if (runtime.healthCheck?.enabled) {
      if (runtime.healthCheck.interval < 1000) {
        warnings.push({
          path: 'runtime.healthCheck.interval',
          message: 'Health check interval should be at least 1000ms',
          value: runtime.healthCheck.interval,
          code: 'HEALTH_CHECK_INTERVAL'
        });
      }

      if (runtime.healthCheck.timeout < 1000) {
        warnings.push({
          path: 'runtime.healthCheck.timeout',
          message: 'Health check timeout should be at least 1000ms',
          value: runtime.healthCheck.timeout,
          code: 'HEALTH_CHECK_TIMEOUT'
        });
      }
    }

    // Config refresh interval validation
    if (runtime.configRefreshInterval && runtime.configRefreshInterval < 1000) {
      warnings.push({
        path: 'runtime.configRefreshInterval',
        message: 'Config refresh interval should be at least 1000ms',
        value: runtime.configRefreshInterval,
        code: 'CONFIG_REFRESH_INTERVAL'
      });
    }
  }

  /**
   * Validate cross-references and dependencies
   */
  private validateCrossReferences(config: MCPServerConfig, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Validate deployment type and transport compatibility
    if (config.deployment.type === 'cloudflare' && config.deployment.transport !== 'http') {
      errors.push({
        path: 'deployment',
        message: 'Cloudflare deployment requires HTTP transport',
        value: { type: config.deployment.type, transport: config.deployment.transport },
        code: 'INCOMPATIBLE_DEPLOYMENT_TRANSPORT'
      });
    }

    if (config.deployment.type === 'npm' && config.deployment.transport !== 'stdio') {
      warnings.push({
        path: 'deployment',
        message: 'NPM deployment typically uses stdio transport',
        value: { type: config.deployment.type, transport: config.deployment.transport },
        suggestion: 'Consider using stdio transport for NPM deployment',
        code: 'DEPLOYMENT_TRANSPORT_MISMATCH'
      });
    }

    // Validate environment-specific settings
    if (config.server.environment === 'production') {
      if (config.deployment.debug) {
        warnings.push({
          path: 'deployment.debug',
          message: 'Debug mode is enabled in production environment',
          suggestion: 'Disable debug mode for production',
          code: 'PRODUCTION_DEBUG_ENABLED'
        });
      }

      if (config.deployment.logLevel === 'debug' || config.deployment.logLevel === 'trace') {
        warnings.push({
          path: 'deployment.logLevel',
          message: 'Verbose logging enabled in production environment',
          suggestion: 'Use warn or error log level for production',
          code: 'PRODUCTION_VERBOSE_LOGGING'
        });
      }
    }

    // Validate feature dependencies
    if (config.features.monitoring.enabled && !config.features.monitoring.metrics) {
      warnings.push({
        path: 'features.monitoring',
        message: 'Monitoring is enabled but metrics collection is disabled',
        suggestion: 'Enable metrics collection for effective monitoring',
        code: 'MONITORING_WITHOUT_METRICS'
      });
    }
  }

  /**
   * Validate environment-specific configuration
   */
  async validateEnvironment(config: MCPServerConfig, environment: string): Promise<ValidationResult> {
    const result = await this.validate(config);

    // Add environment-specific validation rules
    if (environment === 'production') {
      // Production-specific validations
      if (config.api.openai.apiKey === 'test-api-key') {
        result.errors.push({
          path: 'api.openai.apiKey',
          message: 'Test API key cannot be used in production',
          code: 'PRODUCTION_TEST_API_KEY'
        });
      }

      if (!config.security.authentication.required) {
        result.warnings.push({
          path: 'security.authentication.required',
          message: 'Authentication is not required in production environment',
          suggestion: 'Enable authentication for production',
          code: 'PRODUCTION_NO_AUTH'
        });
      }
    }

    return result;
  }
}