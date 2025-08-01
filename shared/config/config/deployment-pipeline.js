"use strict";
/**
 * Deployment Pipeline Integration - Phase 2.3: Environment Management
 *
 * Provides deployment pipeline integration for automated environment
 * configuration deployment, validation, and rollback capabilities.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultPipelineConfig = exports.DeploymentPipelineManager = void 0;
exports.createDeploymentPipeline = createDeploymentPipeline;
const environment_manager_js_1 = require("./environment-manager.js");
const deployment_health_js_1 = require("./deployment-health.js");
/**
 * Deployment pipeline manager
 */
class DeploymentPipelineManager {
    constructor(config) {
        this.environmentManager = new environment_manager_js_1.EnvironmentManager();
        this.healthChecker = new deployment_health_js_1.DeploymentHealthChecker();
        this.config = config;
    }
    /**
     * Execute deployment pipeline
     */
    async executePipeline(targetEnvironments, options = {}) {
        const environments = targetEnvironments || this.config.environments;
        const results = [];
        for (const environment of environments) {
            const stage = this.config.stages.find(s => s.environment === environment);
            if (!stage) {
                throw new Error(`No deployment stage found for environment: ${environment}`);
            }
            const result = await this.executeStage(stage, options);
            results.push(result);
            // Stop pipeline on failure unless configured otherwise
            if (!result.success && !options.dryRun) {
                await this.handleDeploymentFailure(result, stage);
                break;
            }
        }
        return results;
    }
    /**
     * Execute single deployment stage
     */
    async executeStage(stage, options = {}) {
        const startTime = new Date();
        const steps = [];
        let success = true;
        let error;
        let healthCheck;
        let rollback;
        try {
            // Send deployment start notification
            await this.sendNotification('deployment-start', {
                stage: stage.name,
                environment: stage.environment,
                deployment: stage.deploymentType,
            });
            // Pre-deployment validation
            if (!options.skipValidation && this.config.validation.preDeployment) {
                const validationResult = await this.executeValidation(stage, 'pre-deployment');
                steps.push(validationResult);
                if (!validationResult.success) {
                    success = false;
                    error = validationResult.error;
                }
            }
            // Pre-deployment steps
            if (success) {
                for (const step of stage.preDeployment) {
                    const stepResult = await this.executeStep(step, stage, options.dryRun);
                    steps.push(stepResult);
                    if (!stepResult.success && !step.continueOnFailure) {
                        success = false;
                        error = stepResult.error;
                        break;
                    }
                }
            }
            // Deployment steps
            if (success) {
                for (const step of stage.deploymentSteps) {
                    const stepResult = await this.executeStep(step, stage, options.dryRun);
                    steps.push(stepResult);
                    if (!stepResult.success && !step.continueOnFailure) {
                        success = false;
                        error = stepResult.error;
                        break;
                    }
                }
            }
            // Post-deployment steps
            if (success) {
                for (const step of stage.postDeployment) {
                    const stepResult = await this.executeStep(step, stage, options.dryRun);
                    steps.push(stepResult);
                    if (!stepResult.success && !step.continueOnFailure) {
                        success = false;
                        error = stepResult.error;
                        break;
                    }
                }
            }
            // Health checks
            if (success && !options.skipHealthChecks) {
                healthCheck = await this.executeHealthChecks(stage);
                if (healthCheck.status === 'unhealthy') {
                    success = false;
                    error = new Error(`Health checks failed: ${healthCheck.summary.failed} failures`);
                }
            }
            // Post-deployment validation
            if (success && !options.skipValidation && this.config.validation.postDeployment) {
                const validationResult = await this.executeValidation(stage, 'post-deployment');
                steps.push(validationResult);
                if (!validationResult.success) {
                    success = false;
                    error = validationResult.error;
                }
            }
        }
        catch (err) {
            success = false;
            error = err instanceof Error ? err : new Error(String(err));
        }
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        // Handle rollback if deployment failed
        if (!success && this.config.rollback.enabled && !options.dryRun) {
            rollback = await this.executeRollback(stage, error);
        }
        const result = {
            success,
            stage: stage.name,
            environment: stage.environment,
            deployment: stage.deploymentType,
            startTime,
            endTime,
            duration,
            steps,
            healthCheck,
            error,
            rollback,
        };
        // Send deployment result notification
        await this.sendNotification(success ? 'deployment-success' : 'deployment-failure', result);
        return result;
    }
    /**
     * Execute deployment step
     */
    async executeStep(step, stage, dryRun) {
        const startTime = new Date();
        let success = true;
        let output;
        let error;
        try {
            if (dryRun) {
                output = `[DRY RUN] Would execute: ${step.name}`;
            }
            else {
                switch (step.type) {
                    case 'command':
                        output = await this.executeCommand(step, stage);
                        break;
                    case 'validation':
                        output = await this.executeStepValidation(step, stage);
                        break;
                    case 'health-check':
                        output = await this.executeStepHealthCheck(step, stage);
                        break;
                    case 'config-update':
                        output = await this.executeConfigUpdate(step, stage);
                        break;
                    case 'notification':
                        output = await this.executeNotificationStep(step, stage);
                        break;
                    default:
                        throw new Error(`Unknown step type: ${step.type}`);
                }
            }
        }
        catch (err) {
            success = false;
            error = err instanceof Error ? err : new Error(String(err));
        }
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        return {
            name: step.name,
            type: step.type,
            success,
            startTime,
            endTime,
            duration,
            output,
            error,
        };
    }
    /**
     * Execute command step
     */
    async executeCommand(step, stage) {
        if (!step.command) {
            throw new Error('Command step requires command property');
        }
        // This would integrate with actual command execution
        // For now, return a placeholder
        return `Executed command: ${step.command}`;
    }
    /**
     * Execute validation step
     */
    async executeStepValidation(step, stage) {
        const config = await this.environmentManager.loadEnvironmentConfig(stage.environment);
        const validation = await this.environmentManager.validateEnvironmentConfig(stage.environment, config);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        return `Validation passed: ${validation.warnings.length} warnings`;
    }
    /**
     * Execute health check step
     */
    async executeStepHealthCheck(step, stage) {
        const config = await this.environmentManager.loadEnvironmentConfig(stage.environment);
        const healthCheck = await this.healthChecker.performHealthCheck(config, stage.environment);
        if (healthCheck.status === 'unhealthy') {
            throw new Error(`Health check failed: ${healthCheck.summary.failed} failures`);
        }
        return `Health check ${healthCheck.status}: ${healthCheck.summary.passed}/${healthCheck.summary.total} passed`;
    }
    /**
     * Execute config update step
     */
    async executeConfigUpdate(step, stage) {
        // This would update configuration in the target environment
        return `Configuration updated for ${stage.environment}`;
    }
    /**
     * Execute notification step
     */
    async executeNotificationStep(step, stage) {
        // This would send notifications
        return `Notification sent for ${step.name}`;
    }
    /**
     * Execute validation
     */
    async executeValidation(stage, phase) {
        const startTime = new Date();
        let success = true;
        let error;
        try {
            const config = await this.environmentManager.loadEnvironmentConfig(stage.environment);
            const validation = await this.environmentManager.validateEnvironmentConfig(stage.environment, config);
            if (!validation.isValid) {
                success = false;
                error = new Error(`${phase} validation failed: ${validation.errors.join(', ')}`);
            }
        }
        catch (err) {
            success = false;
            error = err instanceof Error ? err : new Error(String(err));
        }
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        return {
            name: `${phase} validation`,
            type: 'validation',
            success,
            startTime,
            endTime,
            duration,
            output: success ? 'Validation passed' : undefined,
            error,
        };
    }
    /**
     * Execute health checks
     */
    async executeHealthChecks(stage) {
        const config = await this.environmentManager.loadEnvironmentConfig(stage.environment);
        return this.healthChecker.performHealthCheck(config, stage.environment);
    }
    /**
     * Execute rollback
     */
    async executeRollback(stage, deploymentError) {
        const steps = [];
        let success = true;
        let error;
        try {
            for (const step of stage.rollbackSteps) {
                const stepResult = await this.executeStep(step, stage);
                steps.push(stepResult);
                if (!stepResult.success) {
                    success = false;
                    error = stepResult.error;
                    break;
                }
            }
        }
        catch (err) {
            success = false;
            error = err instanceof Error ? err : new Error(String(err));
        }
        const result = {
            triggered: true,
            reason: deploymentError?.message || 'Deployment failure',
            success,
            steps,
            error,
        };
        // Send rollback notification
        await this.sendNotification('rollback', result);
        return result;
    }
    /**
     * Handle deployment failure
     */
    async handleDeploymentFailure(result, stage) {
        // Log failure details
        console.error(`Deployment failed for ${stage.environment}:`, result.error?.message);
        // Check rollback conditions
        if (this.config.rollback.enabled && this.shouldTriggerRollback(result)) {
            if (!result.rollback) {
                result.rollback = await this.executeRollback(stage, result.error);
            }
        }
    }
    /**
     * Check if rollback should be triggered
     */
    shouldTriggerRollback(result) {
        if (!this.config.rollback.automatic) {
            return false;
        }
        return this.config.rollback.conditions.some(condition => {
            switch (condition.type) {
                case 'health-check-failure':
                    return result.healthCheck?.status === 'unhealthy';
                case 'error-rate':
                    return result.steps.filter(s => !s.success).length / result.steps.length >= (condition.threshold || 0.5);
                case 'timeout':
                    return result.duration > (condition.duration || 300000); // 5 minutes default
                default:
                    return false;
            }
        });
    }
    /**
     * Send notification
     */
    async sendNotification(event, data) {
        if (!this.config.notifications.enabled) {
            return;
        }
        const eventConfig = this.config.notifications.events.find(e => e.type === event);
        if (!eventConfig) {
            return;
        }
        // This would integrate with actual notification systems
        console.log(`[NOTIFICATION] ${event}:`, data);
    }
}
exports.DeploymentPipelineManager = DeploymentPipelineManager;
/**
 * Default deployment pipeline configuration
 */
exports.defaultPipelineConfig = {
    environments: ['development', 'staging', 'production'],
    stages: [
        {
            name: 'Development Deployment',
            environment: 'development',
            deploymentType: 'local',
            preDeployment: [
                {
                    name: 'Install Dependencies',
                    type: 'command',
                    command: 'npm install',
                    timeout: 60000,
                },
                {
                    name: 'Build Project',
                    type: 'command',
                    command: 'npm run build',
                    timeout: 120000,
                },
            ],
            deploymentSteps: [
                {
                    name: 'Start Development Server',
                    type: 'command',
                    command: 'npm run dev',
                    timeout: 30000,
                },
            ],
            postDeployment: [
                {
                    name: 'Run Tests',
                    type: 'command',
                    command: 'npm test',
                    timeout: 180000,
                    continueOnFailure: true,
                },
            ],
            rollbackSteps: [
                {
                    name: 'Stop Development Server',
                    type: 'command',
                    command: 'pkill -f "npm run dev"',
                },
            ],
            healthChecks: [
                {
                    name: 'Server Health',
                    type: 'http',
                    endpoint: 'http://localhost:3000/health',
                    timeout: 5000,
                    retries: 3,
                    expectedStatus: 200,
                },
            ],
        },
        {
            name: 'Staging Deployment',
            environment: 'staging',
            deploymentType: 'cloudflare',
            preDeployment: [
                {
                    name: 'Build for Production',
                    type: 'command',
                    command: 'npm run build:staging',
                    timeout: 120000,
                },
                {
                    name: 'Run Tests',
                    type: 'command',
                    command: 'npm run test:staging',
                    timeout: 300000,
                },
            ],
            deploymentSteps: [
                {
                    name: 'Deploy to Cloudflare Workers',
                    type: 'command',
                    command: 'wrangler deploy --env staging',
                    timeout: 180000,
                },
            ],
            postDeployment: [
                {
                    name: 'Smoke Tests',
                    type: 'command',
                    command: 'npm run test:smoke:staging',
                    timeout: 120000,
                },
            ],
            rollbackSteps: [
                {
                    name: 'Rollback Cloudflare Deployment',
                    type: 'command',
                    command: 'wrangler rollback --env staging',
                },
            ],
            healthChecks: [
                {
                    name: 'Staging Health',
                    type: 'http',
                    endpoint: 'https://staging.example.com/health',
                    timeout: 10000,
                    retries: 5,
                    expectedStatus: 200,
                },
            ],
        },
        {
            name: 'Production Deployment',
            environment: 'production',
            deploymentType: 'cloudflare',
            preDeployment: [
                {
                    name: 'Build for Production',
                    type: 'command',
                    command: 'npm run build:production',
                    timeout: 120000,
                },
                {
                    name: 'Run Full Test Suite',
                    type: 'command',
                    command: 'npm run test:production',
                    timeout: 600000,
                },
                {
                    name: 'Security Scan',
                    type: 'command',
                    command: 'npm audit --audit-level high',
                    timeout: 60000,
                },
            ],
            deploymentSteps: [
                {
                    name: 'Deploy to Cloudflare Workers',
                    type: 'command',
                    command: 'wrangler deploy --env production',
                    timeout: 300000,
                },
            ],
            postDeployment: [
                {
                    name: 'Production Smoke Tests',
                    type: 'command',
                    command: 'npm run test:smoke:production',
                    timeout: 180000,
                },
                {
                    name: 'Performance Tests',
                    type: 'command',
                    command: 'npm run test:performance',
                    timeout: 300000,
                    continueOnFailure: true,
                },
            ],
            rollbackSteps: [
                {
                    name: 'Rollback Cloudflare Deployment',
                    type: 'command',
                    command: 'wrangler rollback --env production',
                },
                {
                    name: 'Notify Operations Team',
                    type: 'notification',
                },
            ],
            healthChecks: [
                {
                    name: 'Production Health',
                    type: 'http',
                    endpoint: 'https://api.example.com/health',
                    timeout: 15000,
                    retries: 5,
                    expectedStatus: 200,
                },
            ],
        },
    ],
    rollback: {
        enabled: true,
        automatic: true,
        conditions: [
            {
                type: 'health-check-failure',
            },
            {
                type: 'error-rate',
                threshold: 0.3,
            },
            {
                type: 'timeout',
                duration: 600000, // 10 minutes
            },
        ],
        maxRollbacks: 3,
        preserveData: true,
    },
    notifications: {
        enabled: true,
        channels: [
            {
                type: 'console',
                config: {},
            },
        ],
        events: [
            {
                type: 'deployment-start',
                channels: ['console'],
            },
            {
                type: 'deployment-success',
                channels: ['console'],
            },
            {
                type: 'deployment-failure',
                channels: ['console'],
            },
            {
                type: 'rollback',
                channels: ['console'],
            },
        ],
    },
    validation: {
        preDeployment: true,
        postDeployment: true,
        configValidation: true,
        healthChecks: true,
        performanceTests: false,
    },
};
/**
 * Create deployment pipeline manager with default configuration
 */
function createDeploymentPipeline(config) {
    const mergedConfig = {
        ...exports.defaultPipelineConfig,
        ...config,
    };
    return new DeploymentPipelineManager(mergedConfig);
}
