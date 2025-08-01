"use strict";
/**
 * Default Configuration - Phase 2: Configuration Management
 *
 * Default configuration values for all deployment environments.
 * These values serve as the baseline configuration that can be
 * overridden by environment-specific settings.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testOverrides = exports.productionOverrides = exports.stagingOverrides = exports.developmentOverrides = exports.defaultConfig = void 0;
exports.getEnvironmentOverrides = getEnvironmentOverrides;
exports.deepMerge = deepMerge;
exports.createConfigWithOverrides = createConfigWithOverrides;
/**
 * Default MCP Server configuration
 */
exports.defaultConfig = {
    server: {
        name: 'openai-assistants-mcp',
        version: '2.2.4',
        description: 'Enhanced Universal OpenAI Assistants MCP Server',
        environment: 'development',
    },
    api: {
        openai: {
            apiKey: '', // Must be provided via environment or configuration
            baseUrl: 'https://api.openai.com/v1',
            timeout: 30000, // 30 seconds
            retries: 3,
            maxTokens: 4096,
            model: 'gpt-4',
        },
    },
    features: {
        tools: {
            enabled: true,
            listChanged: false,
            categories: ['assistant', 'thread', 'message', 'run', 'run-step'],
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
            strategy: 'lru',
        },
        concurrency: {
            maxConcurrentRequests: 50,
            requestTimeout: 30000,
            queueSize: 100,
        },
        memory: {
            maxHeapSize: 512 * 1024 * 1024, // 512MB
            gcThreshold: 0.8,
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
            allowedMimeTypes: ['application/json', 'text/plain'],
        },
        authentication: {
            required: false,
            methods: ['bearer'],
            tokenExpiry: 3600000, // 1 hour
        },
    },
    deployment: {
        type: 'local',
        transport: 'stdio',
        debug: false,
        logLevel: 'info',
        region: 'auto',
        timezone: 'UTC',
    },
    runtime: {
        hotReload: false,
        configRefreshInterval: 30000, // 30 seconds
        gracefulShutdown: true,
        healthCheck: {
            enabled: true,
            interval: 30000, // 30 seconds
            timeout: 5000, // 5 seconds
        },
        metrics: {
            enabled: true,
            interval: 60000, // 1 minute
            retention: 86400000, // 24 hours
        },
    },
};
/**
 * Environment-specific configuration overrides
 * These are deep partial overrides that merge with the default configuration
 */
/**
 * Development environment overrides
 */
exports.developmentOverrides = {
    server: {
        environment: 'development',
    },
    deployment: {
        debug: true,
        logLevel: 'debug',
    },
    runtime: {
        hotReload: true,
        configRefreshInterval: 5000, // 5 seconds for faster development
    },
};
/**
 * Staging environment overrides
 */
exports.stagingOverrides = {
    server: {
        environment: 'staging',
    },
    deployment: {
        debug: false,
        logLevel: 'info',
    },
    runtime: {
        hotReload: false,
        configRefreshInterval: 60000, // 1 minute
    },
};
/**
 * Production environment overrides
 */
exports.productionOverrides = {
    server: {
        environment: 'production',
    },
    deployment: {
        debug: false,
        logLevel: 'warn',
    },
    runtime: {
        hotReload: false,
        configRefreshInterval: 300000, // 5 minutes
    },
};
/**
 * Test environment overrides
 */
exports.testOverrides = {
    server: {
        environment: 'test',
    },
    api: {
        openai: {
            apiKey: 'test-api-key',
            timeout: 5000, // Shorter timeout for tests
            retries: 1,
        },
    },
    deployment: {
        debug: true,
        logLevel: 'debug',
    },
    runtime: {
        hotReload: false,
        configRefreshInterval: 1000, // 1 second for tests
    },
};
/**
 * Get environment-specific overrides
 */
function getEnvironmentOverrides(environment) {
    switch (environment) {
        case 'development':
            return exports.developmentOverrides;
        case 'staging':
            return exports.stagingOverrides;
        case 'production':
            return exports.productionOverrides;
        case 'test':
            return exports.testOverrides;
        default:
            return {};
    }
}
/**
 * Deep merge utility for configuration objects
 */
function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
        if (source[key] !== undefined) {
            if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                result[key] = deepMerge(result[key] || {}, source[key]);
            }
            else {
                result[key] = source[key];
            }
        }
    }
    return result;
}
/**
 * Create configuration with environment overrides
 */
function createConfigWithOverrides(environment) {
    const overrides = getEnvironmentOverrides(environment);
    return deepMerge(exports.defaultConfig, overrides);
}
