"use strict";
/**
 * Configuration Schema - Phase 2: Configuration Management
 *
 * JSON Schema definitions for configuration validation and documentation.
 * Provides comprehensive validation rules for all configuration options.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCHEMA_METADATA = exports.SchemaUtils = exports.environmentConfigSchema = exports.featureFlagSchema = exports.mcpServerConfigSchema = void 0;
/**
 * Server configuration schema
 */
const serverSchema = {
    type: 'object',
    properties: {
        name: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            pattern: '^[a-zA-Z0-9-_]+$',
            description: 'Server name identifier'
        },
        version: {
            type: 'string',
            pattern: '^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9-]+)?$',
            description: 'Semantic version string'
        },
        description: {
            type: 'string',
            maxLength: 500,
            description: 'Optional server description'
        },
        environment: {
            type: 'string',
            enum: ['development', 'staging', 'production', 'test'],
            description: 'Deployment environment'
        }
    },
    required: ['name', 'version', 'environment'],
    additionalProperties: false
};
/**
 * API configuration schema
 */
const apiSchema = {
    type: 'object',
    properties: {
        openai: {
            type: 'object',
            properties: {
                apiKey: {
                    type: 'string',
                    minLength: 1,
                    description: 'OpenAI API key'
                },
                baseUrl: {
                    type: 'string',
                    format: 'uri',
                    description: 'Custom OpenAI API base URL'
                },
                timeout: {
                    type: 'number',
                    minimum: 1000,
                    maximum: 300000,
                    description: 'Request timeout in milliseconds'
                },
                retries: {
                    type: 'number',
                    minimum: 0,
                    maximum: 10,
                    description: 'Number of retry attempts'
                },
                maxTokens: {
                    type: 'number',
                    minimum: 1,
                    maximum: 32768,
                    description: 'Maximum tokens per request'
                },
                model: {
                    type: 'string',
                    description: 'Default OpenAI model to use'
                }
            },
            required: ['apiKey'],
            additionalProperties: false
        }
    },
    required: ['openai'],
    additionalProperties: false
};
/**
 * Feature flags schema
 */
const featureFlagsSchema = {
    type: 'object',
    properties: {
        tools: {
            type: 'object',
            properties: {
                enabled: { type: 'boolean' },
                listChanged: { type: 'boolean' },
                categories: {
                    type: 'array',
                    items: { type: 'string' }
                },
                rateLimit: {
                    type: 'number',
                    minimum: 1
                },
                maxConcurrent: {
                    type: 'number',
                    minimum: 1
                }
            },
            required: ['enabled', 'listChanged'],
            additionalProperties: false
        },
        resources: {
            type: 'object',
            properties: {
                enabled: { type: 'boolean' },
                subscribe: { type: 'boolean' },
                listChanged: { type: 'boolean' },
                maxSize: {
                    type: 'number',
                    minimum: 1024
                },
                caching: { type: 'boolean' }
            },
            required: ['enabled', 'subscribe', 'listChanged'],
            additionalProperties: false
        },
        prompts: {
            type: 'object',
            properties: {
                enabled: { type: 'boolean' },
                listChanged: { type: 'boolean' },
                caching: { type: 'boolean' },
                maxTemplates: {
                    type: 'number',
                    minimum: 1
                }
            },
            required: ['enabled', 'listChanged'],
            additionalProperties: false
        },
        completions: {
            type: 'object',
            properties: {
                enabled: { type: 'boolean' },
                streaming: { type: 'boolean' },
                maxLength: {
                    type: 'number',
                    minimum: 1
                }
            },
            required: ['enabled'],
            additionalProperties: false
        },
        validation: {
            type: 'object',
            properties: {
                enabled: { type: 'boolean' },
                strict: { type: 'boolean' },
                schemas: { type: 'boolean' },
                sanitization: { type: 'boolean' }
            },
            required: ['enabled', 'strict'],
            additionalProperties: false
        },
        monitoring: {
            type: 'object',
            properties: {
                enabled: { type: 'boolean' },
                metrics: { type: 'boolean' },
                logging: { type: 'boolean' },
                tracing: { type: 'boolean' },
                analytics: { type: 'boolean' }
            },
            required: ['enabled', 'metrics', 'logging'],
            additionalProperties: false
        }
    },
    required: ['tools', 'resources', 'prompts', 'completions', 'validation', 'monitoring'],
    additionalProperties: false
};
/**
 * Performance configuration schema
 */
const performanceSchema = {
    type: 'object',
    properties: {
        pagination: {
            type: 'object',
            properties: {
                defaultLimit: {
                    type: 'number',
                    minimum: 1,
                    maximum: 1000
                },
                maxLimit: {
                    type: 'number',
                    minimum: 1,
                    maximum: 10000
                },
                allowUnlimited: { type: 'boolean' }
            },
            required: ['defaultLimit', 'maxLimit'],
            additionalProperties: false
        },
        caching: {
            type: 'object',
            properties: {
                enabled: { type: 'boolean' },
                ttl: {
                    type: 'number',
                    minimum: 1000
                },
                maxSize: {
                    type: 'number',
                    minimum: 1
                },
                strategy: {
                    type: 'string',
                    enum: ['lru', 'fifo', 'lfu']
                }
            },
            required: ['enabled', 'ttl', 'maxSize'],
            additionalProperties: false
        },
        concurrency: {
            type: 'object',
            properties: {
                maxConcurrentRequests: {
                    type: 'number',
                    minimum: 1
                },
                requestTimeout: {
                    type: 'number',
                    minimum: 1000
                },
                queueSize: {
                    type: 'number',
                    minimum: 1
                }
            },
            required: ['maxConcurrentRequests', 'requestTimeout'],
            additionalProperties: false
        },
        memory: {
            type: 'object',
            properties: {
                maxHeapSize: {
                    type: 'number',
                    minimum: 1024 * 1024 // 1MB minimum
                },
                gcThreshold: {
                    type: 'number',
                    minimum: 0.1,
                    maximum: 1.0
                },
                monitoring: { type: 'boolean' }
            },
            additionalProperties: false
        }
    },
    required: ['pagination', 'caching', 'concurrency'],
    additionalProperties: false
};
/**
 * Security configuration schema
 */
const securitySchema = {
    type: 'object',
    properties: {
        cors: {
            type: 'object',
            properties: {
                enabled: { type: 'boolean' },
                origins: {
                    type: 'array',
                    items: { type: 'string' }
                },
                methods: {
                    type: 'array',
                    items: { type: 'string' }
                },
                headers: {
                    type: 'array',
                    items: { type: 'string' }
                },
                credentials: { type: 'boolean' }
            },
            required: ['enabled', 'origins', 'methods'],
            additionalProperties: false
        },
        rateLimit: {
            type: 'object',
            properties: {
                enabled: { type: 'boolean' },
                requests: {
                    type: 'number',
                    minimum: 1
                },
                window: {
                    type: 'number',
                    minimum: 1000
                },
                skipSuccessfulRequests: { type: 'boolean' },
                skipFailedRequests: { type: 'boolean' }
            },
            required: ['enabled', 'requests', 'window'],
            additionalProperties: false
        },
        validation: {
            type: 'object',
            properties: {
                strictMode: { type: 'boolean' },
                sanitizeInputs: { type: 'boolean' },
                maxInputSize: {
                    type: 'number',
                    minimum: 1024
                },
                allowedMimeTypes: {
                    type: 'array',
                    items: { type: 'string' }
                }
            },
            required: ['strictMode', 'sanitizeInputs'],
            additionalProperties: false
        },
        authentication: {
            type: 'object',
            properties: {
                required: { type: 'boolean' },
                methods: {
                    type: 'array',
                    items: { type: 'string' }
                },
                tokenExpiry: {
                    type: 'number',
                    minimum: 60000 // 1 minute minimum
                }
            },
            required: ['required'],
            additionalProperties: false
        }
    },
    required: ['cors', 'rateLimit', 'validation', 'authentication'],
    additionalProperties: false
};
/**
 * Deployment configuration schema
 */
const deploymentSchema = {
    type: 'object',
    properties: {
        type: {
            type: 'string',
            enum: ['cloudflare', 'npm', 'local']
        },
        transport: {
            type: 'string',
            enum: ['http', 'stdio']
        },
        debug: { type: 'boolean' },
        logLevel: {
            type: 'string',
            enum: ['error', 'warn', 'info', 'debug', 'trace']
        },
        region: { type: 'string' },
        timezone: { type: 'string' }
    },
    required: ['type', 'transport', 'debug', 'logLevel'],
    additionalProperties: false
};
/**
 * Runtime configuration schema
 */
const runtimeSchema = {
    type: 'object',
    properties: {
        hotReload: { type: 'boolean' },
        configRefreshInterval: {
            type: 'number',
            minimum: 1000
        },
        gracefulShutdown: { type: 'boolean' },
        healthCheck: {
            type: 'object',
            properties: {
                enabled: { type: 'boolean' },
                interval: {
                    type: 'number',
                    minimum: 1000
                },
                timeout: {
                    type: 'number',
                    minimum: 1000
                }
            },
            required: ['enabled', 'interval', 'timeout'],
            additionalProperties: false
        },
        metrics: {
            type: 'object',
            properties: {
                enabled: { type: 'boolean' },
                interval: {
                    type: 'number',
                    minimum: 1000
                },
                retention: {
                    type: 'number',
                    minimum: 60000
                }
            },
            required: ['enabled', 'interval', 'retention'],
            additionalProperties: false
        }
    },
    required: ['hotReload', 'gracefulShutdown'],
    additionalProperties: false
};
/**
 * Main MCP Server configuration schema
 */
exports.mcpServerConfigSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: {
        server: serverSchema,
        api: apiSchema,
        features: featureFlagsSchema,
        performance: performanceSchema,
        security: securitySchema,
        deployment: deploymentSchema,
        runtime: runtimeSchema
    },
    required: ['server', 'api', 'features', 'performance', 'security', 'deployment', 'runtime'],
    additionalProperties: false
};
/**
 * Feature flag schema
 */
exports.featureFlagSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: {
        name: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            pattern: '^[a-zA-Z0-9-_.]+$'
        },
        enabled: { type: 'boolean' },
        description: {
            type: 'string',
            maxLength: 500
        },
        variants: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    weight: {
                        type: 'number',
                        minimum: 0,
                        maximum: 1
                    },
                    config: { type: 'object' },
                    description: { type: 'string' }
                },
                required: ['name', 'weight'],
                additionalProperties: false
            }
        },
        rules: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    condition: { type: 'string' },
                    action: {
                        type: 'string',
                        enum: ['enable', 'disable', 'variant']
                    },
                    value: {},
                    description: { type: 'string' }
                },
                required: ['condition', 'action'],
                additionalProperties: false
            }
        },
        metadata: {
            type: 'object',
            properties: {
                createdAt: {
                    type: 'string',
                    format: 'date-time'
                },
                updatedAt: {
                    type: 'string',
                    format: 'date-time'
                },
                createdBy: { type: 'string' },
                tags: {
                    type: 'array',
                    items: { type: 'string' }
                }
            },
            additionalProperties: false
        }
    },
    required: ['name', 'enabled'],
    additionalProperties: false
};
/**
 * Environment configuration schema
 */
exports.environmentConfigSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: {
        name: {
            type: 'string',
            minLength: 1,
            maxLength: 50
        },
        description: {
            type: 'string',
            maxLength: 500
        },
        inherits: {
            type: 'string',
            description: 'Parent environment to inherit from'
        },
        overrides: {
            ...exports.mcpServerConfigSchema,
            description: 'Configuration overrides for this environment'
        },
        // Include all properties from main config schema as optional
        server: { ...serverSchema, required: [] },
        api: { ...apiSchema, required: [] },
        features: { ...featureFlagsSchema, required: [] },
        performance: { ...performanceSchema, required: [] },
        security: { ...securitySchema, required: [] },
        deployment: { ...deploymentSchema, required: [] },
        runtime: { ...runtimeSchema, required: [] }
    },
    required: ['name'],
    additionalProperties: false
};
/**
 * Schema validation utilities
 */
class SchemaUtils {
    /**
     * Get schema for a specific configuration section
     */
    static getSchemaForPath(path) {
        const schemas = {
            'server': serverSchema,
            'api': apiSchema,
            'features': featureFlagsSchema,
            'performance': performanceSchema,
            'security': securitySchema,
            'deployment': deploymentSchema,
            'runtime': runtimeSchema
        };
        return schemas[path.split('.')[0]];
    }
    /**
     * Get all available schema paths
     */
    static getAvailablePaths() {
        return [
            'server',
            'api',
            'features',
            'performance',
            'security',
            'deployment',
            'runtime'
        ];
    }
    /**
     * Validate schema completeness
     */
    static validateSchemaCompleteness() {
        const requiredPaths = this.getAvailablePaths();
        const missing = [];
        for (const path of requiredPaths) {
            if (!this.getSchemaForPath(path)) {
                missing.push(path);
            }
        }
        return {
            isComplete: missing.length === 0,
            missing
        };
    }
}
exports.SchemaUtils = SchemaUtils;
/**
 * Schema metadata
 */
exports.SCHEMA_METADATA = {
    version: '1.0.0',
    description: 'MCP Server Configuration Schema',
    author: 'OpenAI Assistants MCP Server Team',
    created: '2025-01-31',
    updated: '2025-01-31',
    compatibility: {
        jsonSchema: 'draft-07',
        typescript: '5.0+',
        node: '18.0+'
    }
};
