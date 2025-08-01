/**
 * Environment Management System Tests - Phase 2.3
 *
 * Comprehensive tests for environment detection, configuration loading,
 * deployment health checking, and pipeline integration.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { promises as fs } from 'fs';
import path from 'path';

// Mock environment variables
const originalEnv = process.env;

describe('Environment Management System', () => {
  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Environment Detection', () => {
    it('should detect development environment from NODE_ENV', async () => {
      process.env.NODE_ENV = 'development';
      
      const { EnvironmentManager } = await import('../../shared/config/environment-manager.js');
      const manager = new EnvironmentManager();
      
      const detection = manager.detectEnvironment();
      
      assert.strictEqual(detection.environment, 'development');
      assert.strictEqual(detection.source, 'NODE_ENV');
      assert(detection.confidence >= 0.9);
    });

    it('should detect production environment from ENVIRONMENT variable', async () => {
      process.env.ENVIRONMENT = 'production';
      
      const { EnvironmentManager } = await import('../../shared/config/environment-manager.js');
      const manager = new EnvironmentManager();
      
      const detection = manager.detectEnvironment();
      
      assert.strictEqual(detection.environment, 'production');
      assert.strictEqual(detection.source, 'ENVIRONMENT');
      assert(detection.confidence >= 0.9);
    });

    it('should detect Cloudflare Workers deployment', async () => {
      process.env.CF_PAGES = '1';
      
      const { EnvironmentManager } = await import('../../shared/config/environment-manager.js');
      const manager = new EnvironmentManager();
      
      const detection = manager.detectEnvironment();
      
      assert.strictEqual(detection.deployment, 'cloudflare');
      assert(detection.metadata.cloudflare);
    });

    it('should fallback to development with low confidence', async () => {
      // Clear all environment indicators
      delete process.env.NODE_ENV;
      delete process.env.ENVIRONMENT;
      delete process.env.CF_PAGES;
      
      const { EnvironmentManager } = await import('../../shared/config/environment-manager.js');
      const manager = new EnvironmentManager();
      
      const detection = manager.detectEnvironment();
      
      assert.strictEqual(detection.environment, 'development');
      assert.strictEqual(detection.deployment, 'local');
      assert(detection.confidence < 0.5);
    });
  });

  describe('Environment Configuration Loading', () => {
    it('should load development configuration', async () => {
      const { EnvironmentManager } = await import('../../shared/config/environment-manager.js');
      const manager = new EnvironmentManager();
      
      const config = await manager.loadEnvironmentConfig('development');
      
      assert.strictEqual(config.server.environment, 'development');
      assert.strictEqual(config.deployment.type, 'local');
      assert.strictEqual(config.deployment.transport, 'stdio');
      assert.strictEqual(config.deployment.debug, true);
    });

    it('should load production configuration', async () => {
      const { EnvironmentManager } = await import('../../shared/config/environment-manager.js');
      const manager = new EnvironmentManager();
      
      const config = await manager.loadEnvironmentConfig('production');
      
      assert.strictEqual(config.server.environment, 'production');
      assert.strictEqual(config.deployment.type, 'cloudflare');
      assert.strictEqual(config.deployment.transport, 'http');
      assert.strictEqual(config.deployment.debug, false);
    });

    it('should validate environment configuration', async () => {
      const { EnvironmentManager } = await import('../../shared/config/environment-manager.js');
      const manager = new EnvironmentManager();
      
      const config = await manager.loadEnvironmentConfig('development');
      const validation = await manager.validateEnvironmentConfig('development', config);
      
      assert.strictEqual(validation.isValid, true);
      assert.strictEqual(validation.errors.length, 0);
    });

    it('should detect invalid configuration', async () => {
      const { EnvironmentManager } = await import('../../shared/config/environment-manager.js');
      const manager = new EnvironmentManager();
      
      const invalidConfig = {
        server: {
          name: '', // Invalid: empty name
          environment: 'invalid-env', // Invalid: unsupported environment
        },
      };
      
      const validation = await manager.validateEnvironmentConfig('development', invalidConfig);
      
      assert.strictEqual(validation.isValid, false);
      assert(validation.errors.length > 0);
    });
  });

  describe('Deployment Health Checking', () => {
    it('should perform basic health check', async () => {
      const { DeploymentHealthChecker } = await import('../../shared/config/deployment-health.js');
      const checker = new DeploymentHealthChecker();
      
      const result = await checker.performHealthCheck();
      
      assert(result.status === 'healthy' || result.status === 'warning' || result.status === 'unhealthy');
      assert(typeof result.summary.total === 'number');
      assert(typeof result.summary.passed === 'number');
      assert(typeof result.summary.warnings === 'number');
      assert(typeof result.summary.failed === 'number');
      assert(Array.isArray(result.checks));
      assert(Array.isArray(result.recommendations));
    });

    it('should check environment detection confidence', async () => {
      process.env.NODE_ENV = 'production';
      
      const { DeploymentHealthChecker } = await import('../../shared/config/deployment-health.js');
      const checker = new DeploymentHealthChecker();
      
      const result = await checker.performHealthCheck();
      
      const envCheck = result.checks.find(c => c.name === 'Environment Detection Confidence');
      assert(envCheck);
      assert.strictEqual(envCheck.status, 'pass');
    });

    it('should validate configuration requirements', async () => {
      const { DeploymentHealthChecker } = await import('../../shared/config/deployment-health.js');
      const { EnvironmentManager } = await import('../../shared/config/environment-manager.js');
      
      const checker = new DeploymentHealthChecker();
      const envManager = new EnvironmentManager();
      const config = await envManager.loadEnvironmentConfig('production');
      
      const result = await checker.performHealthCheck(config, 'production');
      
      const configCheck = result.checks.find(c => c.name === 'Configuration Validation');
      assert(configCheck);
      assert.strictEqual(configCheck.status, 'pass');
    });

    it('should check Cloudflare Workers limits', async () => {
      const { DeploymentHealthChecker } = await import('../../shared/config/deployment-health.js');
      const { EnvironmentManager } = await import('../../shared/config/environment-manager.js');
      
      const checker = new DeploymentHealthChecker();
      const envManager = new EnvironmentManager();
      const config = await envManager.loadEnvironmentConfig('production');
      
      // Override to simulate Cloudflare deployment
      config.deployment.type = 'cloudflare';
      config.performance = {
        memory: { maxHeapSize: 64 * 1024 * 1024 }, // 64MB - within limit
        concurrency: { requestTimeout: 25000 }, // 25s - within limit
      };
      
      const result = await checker.performHealthCheck(config, 'production');
      
      const memoryCheck = result.checks.find(c => c.name === 'Cloudflare Workers Memory Limit');
      const timeoutCheck = result.checks.find(c => c.name === 'Cloudflare Workers Timeout Limit');
      
      if (memoryCheck) assert.strictEqual(memoryCheck.status, 'pass');
      if (timeoutCheck) assert.strictEqual(timeoutCheck.status, 'pass');
    });
  });

  describe('Deployment Pipeline Integration', () => {
    it('should create deployment pipeline with default configuration', async () => {
      const { createDeploymentPipeline } = await import('../../shared/config/deployment-pipeline.js');
      
      const pipeline = createDeploymentPipeline();
      
      assert(pipeline);
      assert(typeof pipeline.executePipeline === 'function');
    });

    it('should execute dry run deployment', async () => {
      const { createDeploymentPipeline } = await import('../../shared/config/deployment-pipeline.js');
      
      const pipeline = createDeploymentPipeline({
        environments: ['development'],
        stages: [{
          name: 'Test Stage',
          environment: 'development',
          deploymentType: 'local',
          preDeployment: [{
            name: 'Test Step',
            type: 'command',
            command: 'echo "test"',
          }],
          deploymentSteps: [{
            name: 'Deploy Step',
            type: 'command',
            command: 'echo "deploy"',
          }],
          postDeployment: [],
          rollbackSteps: [],
          healthChecks: [],
        }],
        rollback: { enabled: false, automatic: false, conditions: [], maxRollbacks: 0, preserveData: false },
        notifications: { enabled: false, channels: [], events: [] },
        validation: { preDeployment: false, postDeployment: false, configValidation: false, healthChecks: false, performanceTests: false },
      });
      
      const results = await pipeline.executePipeline(['development'], { dryRun: true });
      
      assert(Array.isArray(results));
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].environment, 'development');
      assert.strictEqual(results[0].success, true);
    });

    it('should handle deployment stage execution', async () => {
      const { DeploymentPipelineManager } = await import('../../shared/config/deployment-pipeline.js');
      
      const config = {
        environments: ['test'],
        stages: [{
          name: 'Test Stage',
          environment: 'test',
          deploymentType: 'local',
          preDeployment: [],
          deploymentSteps: [],
          postDeployment: [],
          rollbackSteps: [],
          healthChecks: [],
        }],
        rollback: { enabled: false, automatic: false, conditions: [], maxRollbacks: 0, preserveData: false },
        notifications: { enabled: false, channels: [], events: [] },
        validation: { preDeployment: false, postDeployment: false, configValidation: false, healthChecks: false, performanceTests: false },
      };
      
      const pipeline = new DeploymentPipelineManager(config);
      const stage = config.stages[0];
      
      const result = await pipeline.executeStage(stage, { dryRun: true });
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.stage, 'Test Stage');
      assert.strictEqual(result.environment, 'test');
      assert.strictEqual(result.deployment, 'local');
    });
  });

  describe('Integration Tests', () => {
    it('should integrate environment detection with configuration loading', async () => {
      process.env.NODE_ENV = 'staging';
      
      const { EnvironmentManager } = await import('../../shared/config/environment-manager.js');
      const manager = new EnvironmentManager();
      
      const detection = manager.detectEnvironment();
      const config = await manager.loadEnvironmentConfig(detection.environment);
      
      assert.strictEqual(detection.environment, 'staging');
      assert.strictEqual(config.server.environment, 'staging');
      assert.strictEqual(config.deployment.type, 'cloudflare');
    });

    it('should integrate health checking with environment configuration', async () => {
      const { EnvironmentManager } = await import('../../shared/config/environment-manager.js');
      const { DeploymentHealthChecker } = await import('../../shared/config/deployment-health.js');
      
      const envManager = new EnvironmentManager();
      const healthChecker = new DeploymentHealthChecker();
      
      const config = await envManager.loadEnvironmentConfig('development');
      const healthResult = await healthChecker.performHealthCheck(config, 'development');
      
      assert(healthResult.status === 'healthy' || healthResult.status === 'warning');
      assert(healthResult.checks.length > 0);
    });

    it('should integrate pipeline with environment management', async () => {
      const { createDeploymentPipeline } = await import('../../shared/config/deployment-pipeline.js');
      const { EnvironmentManager } = await import('../../shared/config/environment-manager.js');
      
      const envManager = new EnvironmentManager();
      const pipeline = createDeploymentPipeline();
      
      // Test that pipeline can access environment configurations
      const devConfig = await envManager.loadEnvironmentConfig('development');
      assert(devConfig);
      
      // Test dry run execution
      const results = await pipeline.executePipeline(['development'], { 
        dryRun: true,
        skipValidation: true,
        skipHealthChecks: true,
      });
      
      assert(Array.isArray(results));
      assert(results.length > 0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid environment names gracefully', async () => {
      const { EnvironmentManager } = await import('../../shared/config/environment-manager.js');
      const manager = new EnvironmentManager();
      
      try {
        await manager.loadEnvironmentConfig('invalid-environment');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert(error.message.includes('invalid-environment'));
      }
    });

    it('should handle missing configuration files gracefully', async () => {
      const { EnvironmentManager } = await import('../../shared/config/environment-manager.js');
      const manager = new EnvironmentManager();
      
      // Mock a non-existent environment
      try {
        await manager.loadEnvironmentConfig('nonexistent');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert(error.message.includes('nonexistent'));
      }
    });

    it('should handle health check failures gracefully', async () => {
      const { DeploymentHealthChecker } = await import('../../shared/config/deployment-health.js');
      const checker = new DeploymentHealthChecker();
      
      // Test with invalid configuration
      const invalidConfig = {
        server: { name: '' }, // Invalid
        deployment: { type: 'invalid' }, // Invalid
      };
      
      const result = await checker.performHealthCheck(invalidConfig);
      
      assert.strictEqual(result.status, 'unhealthy');
      assert(result.summary.failed > 0);
      assert(result.recommendations.length > 0);
    });
  });

  describe('Performance Tests', () => {
    it('should complete environment detection quickly', async () => {
      const { EnvironmentManager } = await import('../../shared/config/environment-manager.js');
      const manager = new EnvironmentManager();
      
      const start = Date.now();
      const detection = manager.detectEnvironment();
      const duration = Date.now() - start;
      
      assert(detection);
      assert(duration < 100); // Should complete in under 100ms
    });

    it('should load configuration efficiently', async () => {
      const { EnvironmentManager } = await import('../../shared/config/environment-manager.js');
      const manager = new EnvironmentManager();
      
      const start = Date.now();
      const config = await manager.loadEnvironmentConfig('development');
      const duration = Date.now() - start;
      
      assert(config);
      assert(duration < 1000); // Should complete in under 1 second
    });

    it('should perform health checks efficiently', async () => {
      const { DeploymentHealthChecker } = await import('../../shared/config/deployment-health.js');
      const checker = new DeploymentHealthChecker();
      
      const start = Date.now();
      const result = await checker.performHealthCheck();
      const duration = Date.now() - start;
      
      assert(result);
      assert(duration < 5000); // Should complete in under 5 seconds
    });
  });
});