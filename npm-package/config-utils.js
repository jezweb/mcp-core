/**
 * Simple Configuration Utilities for NPM Package
 * 
 * This is a lightweight JavaScript version of configuration utilities
 * specifically for the npm package deployment. It provides the essential
 * configuration functions without the full TypeScript configuration system.
 */

/**
 * Initialize global configuration (simplified for npm package)
 */
export async function initializeGlobalConfig() {
  // For npm package, we use a simplified configuration approach
  // The full configuration system is available in the TypeScript shared modules
  // but for npm package deployment, we only need basic configuration
  return Promise.resolve();
}

/**
 * Configuration utilities for npm package
 */
export const ConfigUtils = {
  /**
   * Create a development configuration
   */
  createDevelopmentConfig() {
    return {
      server: {
        name: 'openai-assistants-mcp',
        version: '3.0.0',
        environment: 'development',
        description: 'Development configuration for npm package',
      },
      deployment: {
        type: 'local',
        transport: 'stdio',
        debug: true,
        logLevel: 'debug',
        region: 'auto',
        timezone: 'UTC',
      },
      runtime: {
        hotReload: true,
        configRefreshInterval: 5000,
        gracefulShutdown: true,
        healthCheck: {
          enabled: true,
          interval: 30000,
          timeout: 5000,
        },
        metrics: {
          enabled: true,
          interval: 60000,
          retention: 86400000,
        },
      },
    };
  },

  /**
   * Create a production configuration
   */
  createProductionConfig() {
    return {
      server: {
        name: 'openai-assistants-mcp',
        version: '3.0.0',
        environment: 'production',
        description: 'Production configuration for npm package',
      },
      deployment: {
        type: 'npm',
        transport: 'stdio',
        debug: false,
        logLevel: 'warn',
        region: 'auto',
        timezone: 'UTC',
      },
      runtime: {
        hotReload: false,
        configRefreshInterval: 300000,
        gracefulShutdown: true,
        healthCheck: {
          enabled: true,
          interval: 30000,
          timeout: 5000,
        },
        metrics: {
          enabled: true,
          interval: 60000,
          retention: 86400000,
        },
      },
    };
  },

  /**
   * Create a test configuration
   */
  createTestConfig() {
    return {
      server: {
        name: 'openai-assistants-mcp',
        version: '3.0.0',
        environment: 'test',
        description: 'Test configuration for npm package',
      },
      api: {
        openai: {
          apiKey: 'test-api-key',
          baseUrl: 'https://api.openai.com/v1',
          timeout: 5000,
          retries: 1,
          maxTokens: 4096,
          model: 'gpt-4',
        },
      },
      deployment: {
        type: 'local',
        transport: 'stdio',
        debug: true,
        logLevel: 'debug',
        region: 'auto',
        timezone: 'UTC',
      },
    };
  },

  /**
   * Merge multiple configurations
   */
  mergeConfigs(...configs) {
    return configs.reduce((merged, config) => {
      return this.deepMerge(merged, config);
    }, {});
  },

  /**
   * Deep merge utility
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  },
};