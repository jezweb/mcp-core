"use strict";
/**
 * Deployment Health Checker - Phase 2.3: Environment Management
 *
 * Validates deployment readiness, environment health, and configuration
 * compatibility across different deployment targets.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentHealthChecker = void 0;
exports.getGlobalHealthChecker = getGlobalHealthChecker;
exports.performDeploymentHealthCheck = performDeploymentHealthCheck;
const environment_manager_js_1 = require("./environment-manager.js");
/**
 * Deployment readiness checker
 */
class DeploymentHealthChecker {
    constructor() {
        this.environmentManager = new environment_manager_js_1.EnvironmentManager();
    }
    /**
     * Perform comprehensive health check
     */
    async performHealthCheck(config, environment) {
        const detection = this.environmentManager.detectEnvironment();
        const targetEnv = environment || detection.environment;
        const targetConfig = config || await this.environmentManager.loadEnvironmentConfig(targetEnv);
        const checks = [];
        // Environment detection checks
        checks.push(...await this.checkEnvironmentDetection(detection));
        // Configuration validation checks
        checks.push(...await this.checkConfiguration(targetConfig, targetEnv));
        // Deployment-specific checks
        checks.push(...await this.checkDeploymentReadiness(targetConfig, detection));
        // Security checks
        checks.push(...await this.checkSecurity(targetConfig, targetEnv));
        // Performance checks
        checks.push(...await this.checkPerformance(targetConfig, targetEnv));
        // API connectivity checks
        checks.push(...await this.checkApiConnectivity(targetConfig));
        // Calculate summary
        const summary = {
            total: checks.length,
            passed: checks.filter(c => c.status === 'pass').length,
            warnings: checks.filter(c => c.status === 'warn').length,
            failed: checks.filter(c => c.status === 'fail').length,
        };
        // Determine overall status
        const status = summary.failed > 0 ? 'unhealthy' :
            summary.warnings > 0 ? 'warning' : 'healthy';
        // Generate recommendations
        const recommendations = this.generateRecommendations(checks, targetConfig, targetEnv);
        return {
            status,
            checks,
            summary,
            recommendations,
        };
    }
    /**
     * Check environment detection
     */
    async checkEnvironmentDetection(detection) {
        const checks = [];
        // Environment detection confidence
        checks.push({
            name: 'Environment Detection Confidence',
            category: 'environment',
            status: detection.confidence >= 0.8 ? 'pass' : detection.confidence >= 0.6 ? 'warn' : 'fail',
            message: `Environment detected as '${detection.environment}' with ${Math.round(detection.confidence * 100)}% confidence`,
            details: {
                environment: detection.environment,
                deployment: detection.deployment,
                confidence: detection.confidence,
                source: detection.source,
                metadata: detection.metadata,
            },
            recommendation: detection.confidence < 0.8 ?
                'Set NODE_ENV or ENVIRONMENT variable explicitly for better detection' : undefined,
        });
        // Deployment type consistency
        const expectedDeployment = this.getExpectedDeploymentType(detection.environment);
        checks.push({
            name: 'Deployment Type Consistency',
            category: 'deployment',
            status: detection.deployment === expectedDeployment ? 'pass' : 'warn',
            message: `Deployment type '${detection.deployment}' ${detection.deployment === expectedDeployment ? 'matches' : 'differs from'} expected '${expectedDeployment}'`,
            details: {
                detected: detection.deployment,
                expected: expectedDeployment,
            },
            recommendation: detection.deployment !== expectedDeployment ?
                `Consider using '${expectedDeployment}' deployment for '${detection.environment}' environment` : undefined,
        });
        return checks;
    }
    /**
     * Check configuration validity
     */
    async checkConfiguration(config, environment) {
        const checks = [];
        // Basic configuration validation
        const validation = await this.environmentManager.validateEnvironmentConfig(environment, config);
        checks.push({
            name: 'Configuration Validation',
            category: 'configuration',
            status: validation.isValid ? 'pass' : 'fail',
            message: validation.isValid ?
                'Configuration is valid' :
                `Configuration has ${validation.errors.length} errors`,
            details: {
                errors: validation.errors,
                warnings: validation.warnings,
            },
            recommendation: !validation.isValid ?
                'Fix configuration errors before deployment' : undefined,
        });
        // Required fields check
        const requiredFields = this.getRequiredFields(environment);
        const missingFields = requiredFields.filter(field => !this.hasConfigValue(config, field));
        checks.push({
            name: 'Required Configuration Fields',
            category: 'configuration',
            status: missingFields.length === 0 ? 'pass' : 'fail',
            message: missingFields.length === 0 ?
                'All required fields are present' :
                `Missing required fields: ${missingFields.join(', ')}`,
            details: {
                required: requiredFields,
                missing: missingFields,
            },
            recommendation: missingFields.length > 0 ?
                'Provide values for all required configuration fields' : undefined,
        });
        return checks;
    }
    /**
     * Check deployment readiness
     */
    async checkDeploymentReadiness(config, detection) {
        const checks = [];
        // Transport compatibility
        const expectedTransport = this.getExpectedTransport(detection.deployment);
        checks.push({
            name: 'Transport Compatibility',
            category: 'deployment',
            status: config.deployment?.transport === expectedTransport ? 'pass' : 'warn',
            message: `Transport '${config.deployment?.transport}' ${config.deployment?.transport === expectedTransport ? 'matches' : 'differs from'} expected '${expectedTransport}'`,
            details: {
                configured: config.deployment?.transport,
                expected: expectedTransport,
                deployment: detection.deployment,
            },
            recommendation: config.deployment?.transport !== expectedTransport ?
                `Consider using '${expectedTransport}' transport for '${detection.deployment}' deployment` : undefined,
        });
        // Resource limits
        if (detection.deployment === 'cloudflare') {
            checks.push(...this.checkCloudflareWorkerLimits(config));
        }
        return checks;
    }
    /**
     * Check security configuration
     */
    async checkSecurity(config, environment) {
        const checks = [];
        // CORS configuration
        const corsOrigins = config.security?.cors?.origins || [];
        const hasWildcard = corsOrigins.includes('*');
        checks.push({
            name: 'CORS Security',
            category: 'security',
            status: environment === 'production' && hasWildcard ? 'fail' :
                hasWildcard ? 'warn' : 'pass',
            message: hasWildcard ?
                `Wildcard CORS origins detected (${environment === 'production' ? 'not allowed' : 'not recommended'} in ${environment})` :
                'CORS origins properly configured',
            details: {
                origins: corsOrigins,
                hasWildcard,
                environment,
            },
            recommendation: environment === 'production' && hasWildcard ?
                'Remove wildcard CORS origins in production' :
                hasWildcard ? 'Consider restricting CORS origins for better security' : undefined,
        });
        // Authentication configuration
        const authRequired = config.security?.authentication?.required;
        checks.push({
            name: 'Authentication Configuration',
            category: 'security',
            status: environment === 'production' && !authRequired ? 'warn' : 'pass',
            message: authRequired ?
                'Authentication is enabled' :
                `Authentication is disabled (${environment === 'production' ? 'not recommended' : 'acceptable'} in ${environment})`,
            details: {
                required: authRequired,
                environment,
            },
            recommendation: environment === 'production' && !authRequired ?
                'Consider enabling authentication in production' : undefined,
        });
        return checks;
    }
    /**
     * Check performance configuration
     */
    async checkPerformance(config, environment) {
        const checks = [];
        // Concurrency limits
        const maxConcurrent = config.performance?.concurrency?.maxConcurrentRequests || 0;
        const recommendedLimits = this.getRecommendedConcurrencyLimits(environment);
        checks.push({
            name: 'Concurrency Configuration',
            category: 'performance',
            status: maxConcurrent >= recommendedLimits.min && maxConcurrent <= recommendedLimits.max ? 'pass' : 'warn',
            message: `Concurrency limit: ${maxConcurrent} (recommended: ${recommendedLimits.min}-${recommendedLimits.max} for ${environment})`,
            details: {
                configured: maxConcurrent,
                recommended: recommendedLimits,
                environment,
            },
            recommendation: maxConcurrent < recommendedLimits.min || maxConcurrent > recommendedLimits.max ?
                `Adjust concurrency limit to ${recommendedLimits.min}-${recommendedLimits.max} for optimal performance in ${environment}` : undefined,
        });
        // Caching configuration
        const cachingEnabled = config.performance?.caching?.enabled;
        checks.push({
            name: 'Caching Configuration',
            category: 'performance',
            status: environment === 'production' && !cachingEnabled ? 'warn' : 'pass',
            message: cachingEnabled ?
                'Caching is enabled' :
                `Caching is disabled (${environment === 'production' ? 'not recommended' : 'acceptable'} in ${environment})`,
            details: {
                enabled: cachingEnabled,
                environment,
            },
            recommendation: environment === 'production' && !cachingEnabled ?
                'Enable caching in production for better performance' : undefined,
        });
        return checks;
    }
    /**
     * Check API connectivity
     */
    async checkApiConnectivity(config) {
        const checks = [];
        // OpenAI API key presence
        const hasApiKey = !!config.api?.openai?.apiKey && config.api.openai.apiKey !== 'test-api-key-placeholder';
        checks.push({
            name: 'OpenAI API Key',
            category: 'configuration',
            status: hasApiKey ? 'pass' : 'warn',
            message: hasApiKey ?
                'OpenAI API key is configured' :
                'OpenAI API key is missing or using placeholder',
            details: {
                hasKey: hasApiKey,
                isPlaceholder: config.api?.openai?.apiKey === 'test-api-key-placeholder',
            },
            recommendation: !hasApiKey ?
                'Set OPENAI_API_KEY environment variable or configure API key' : undefined,
        });
        // API endpoint configuration
        const baseUrl = config.api?.openai?.baseUrl;
        const isValidUrl = baseUrl && (baseUrl.startsWith('http://') || baseUrl.startsWith('https://'));
        checks.push({
            name: 'API Endpoint Configuration',
            category: 'configuration',
            status: isValidUrl ? 'pass' : 'fail',
            message: isValidUrl ?
                `API endpoint configured: ${baseUrl}` :
                'Invalid or missing API endpoint',
            details: {
                baseUrl,
                isValid: isValidUrl,
            },
            recommendation: !isValidUrl ?
                'Configure valid OpenAI API base URL' : undefined,
        });
        return checks;
    }
    /**
     * Check Cloudflare Workers specific limits
     */
    checkCloudflareWorkerLimits(config) {
        const checks = [];
        // Memory limit check
        const maxHeapSize = config.performance?.memory?.maxHeapSize || 0;
        const cfMemoryLimit = 128 * 1024 * 1024; // 128MB limit for Cloudflare Workers
        checks.push({
            name: 'Cloudflare Workers Memory Limit',
            category: 'deployment',
            status: maxHeapSize <= cfMemoryLimit ? 'pass' : 'fail',
            message: `Memory limit: ${Math.round(maxHeapSize / 1024 / 1024)}MB (Cloudflare limit: 128MB)`,
            details: {
                configured: maxHeapSize,
                limit: cfMemoryLimit,
                withinLimit: maxHeapSize <= cfMemoryLimit,
            },
            recommendation: maxHeapSize > cfMemoryLimit ?
                'Reduce memory limit to 128MB or less for Cloudflare Workers compatibility' : undefined,
        });
        // Request timeout check
        const requestTimeout = config.performance?.concurrency?.requestTimeout || 0;
        const cfTimeoutLimit = 30000; // 30 seconds for Cloudflare Workers
        checks.push({
            name: 'Cloudflare Workers Timeout Limit',
            category: 'deployment',
            status: requestTimeout <= cfTimeoutLimit ? 'pass' : 'warn',
            message: `Request timeout: ${requestTimeout}ms (Cloudflare limit: 30000ms)`,
            details: {
                configured: requestTimeout,
                limit: cfTimeoutLimit,
                withinLimit: requestTimeout <= cfTimeoutLimit,
            },
            recommendation: requestTimeout > cfTimeoutLimit ?
                'Reduce request timeout to 30 seconds or less for Cloudflare Workers' : undefined,
        });
        return checks;
    }
    /**
     * Generate recommendations based on health check results
     */
    generateRecommendations(checks, config, environment) {
        const recommendations = [];
        // Collect recommendations from failed and warning checks
        checks.forEach(check => {
            if (check.recommendation && (check.status === 'fail' || check.status === 'warn')) {
                recommendations.push(check.recommendation);
            }
        });
        // Add general recommendations based on environment
        if (environment === 'production') {
            recommendations.push('Ensure all security configurations are properly set for production', 'Monitor performance metrics and adjust limits as needed', 'Set up proper logging and monitoring for production deployment');
        }
        if (environment === 'development') {
            recommendations.push('Enable debug logging and hot reload for better development experience', 'Consider using lower resource limits to match production constraints');
        }
        // Remove duplicates
        return [...new Set(recommendations)];
    }
    /**
     * Helper methods
     */
    getExpectedDeploymentType(environment) {
        switch (environment) {
            case 'production':
                return 'cloudflare';
            case 'staging':
                return 'cloudflare';
            case 'development':
                return 'local';
            case 'test':
                return 'local';
            default:
                return 'local';
        }
    }
    getExpectedTransport(deployment) {
        switch (deployment) {
            case 'cloudflare':
                return 'http';
            case 'npm':
                return 'stdio';
            case 'local':
                return 'stdio';
            default:
                return 'stdio';
        }
    }
    getRequiredFields(environment) {
        const baseFields = [
            'server.name',
            'server.version',
            'server.environment',
            'deployment.type',
            'deployment.transport',
        ];
        if (environment === 'production') {
            baseFields.push('api.openai.apiKey', 'security.cors.origins', 'performance.concurrency.maxConcurrentRequests');
        }
        return baseFields;
    }
    hasConfigValue(config, path) {
        const keys = path.split('.');
        let current = config;
        for (const key of keys) {
            if (current == null || typeof current !== 'object' || !(key in current)) {
                return false;
            }
            current = current[key];
        }
        return current != null && current !== '';
    }
    getRecommendedConcurrencyLimits(environment) {
        switch (environment) {
            case 'production':
                return { min: 50, max: 200 };
            case 'staging':
                return { min: 25, max: 100 };
            case 'development':
                return { min: 5, max: 20 };
            case 'test':
                return { min: 1, max: 10 };
            default:
                return { min: 5, max: 50 };
        }
    }
}
exports.DeploymentHealthChecker = DeploymentHealthChecker;
/**
 * Global deployment health checker instance
 */
let globalHealthChecker = null;
/**
 * Get or create the global health checker
 */
function getGlobalHealthChecker() {
    if (!globalHealthChecker) {
        globalHealthChecker = new DeploymentHealthChecker();
    }
    return globalHealthChecker;
}
/**
 * Convenience function to perform health check
 */
async function performDeploymentHealthCheck(config, environment) {
    return getGlobalHealthChecker().performHealthCheck(config, environment);
}
