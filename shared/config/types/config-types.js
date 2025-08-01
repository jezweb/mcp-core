"use strict";
/**
 * Configuration Type Definitions - Phase 2: Configuration Management
 *
 * Comprehensive type definitions for the centralized configuration system.
 * These types provide full TypeScript support for configuration management
 * across all deployment targets.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigPath = exports.DEFAULT_CONFIG_VALUES = exports.isValidLogLevel = exports.isValidTransportType = exports.isValidDeploymentType = exports.isValidEnvironment = void 0;
/**
 * Type guards for configuration validation
 */
const isValidEnvironment = (env) => {
    return ['development', 'staging', 'production', 'test'].includes(env);
};
exports.isValidEnvironment = isValidEnvironment;
const isValidDeploymentType = (type) => {
    return ['cloudflare', 'npm', 'local'].includes(type);
};
exports.isValidDeploymentType = isValidDeploymentType;
const isValidTransportType = (transport) => {
    return ['http', 'stdio'].includes(transport);
};
exports.isValidTransportType = isValidTransportType;
const isValidLogLevel = (level) => {
    return ['error', 'warn', 'info', 'debug', 'trace'].includes(level);
};
exports.isValidLogLevel = isValidLogLevel;
/**
 * Default configuration values
 */
exports.DEFAULT_CONFIG_VALUES = {
    server: {
        name: 'openai-assistants-mcp',
        version: '2.2.4',
        environment: 'development',
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
            strategy: 'lru',
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
        type: 'local',
        transport: 'stdio',
        debug: false,
        logLevel: 'info',
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
};
/**
 * Configuration path utilities
 */
class ConfigPath {
    static get(config, path) {
        return path.split('.').reduce((obj, key) => obj?.[key], config);
    }
    static set(config, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => obj[key] = obj[key] || {}, config);
        target[lastKey] = value;
    }
    static has(config, path) {
        return this.get(config, path) !== undefined;
    }
    static delete(config, path) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => obj?.[key], config);
        if (target && lastKey in target) {
            delete target[lastKey];
            return true;
        }
        return false;
    }
}
exports.ConfigPath = ConfigPath;
