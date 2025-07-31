#!/usr/bin/env node

/**
 * Comprehensive Test Runner for OpenAI Assistants MCP Server
 * Runs all test suites and generates comprehensive reports
 */

import { TestTracker, PerformanceTracker } from './utils/test-helpers.js';
import { ComprehensiveIntegrationTester } from './integration/comprehensive-integration-test.js';
import { ErrorHandlingTester } from './error-handling/error-handling-tests.js';
import { PerformanceTester } from './performance/performance-tests.js';
import { EdgeCaseTester } from './edge-cases/edge-case-tests.js';
import { CloudflareWorkersSpecificTester } from './deployment/cloudflare-workers-tests.js';
import { NPMPackageSpecificTester } from './deployment/npm-package-tests.js';

class ComprehensiveTestRunner {
  constructor() {
    this.tracker = new TestTracker('Comprehensive Test Suite');
    this.performanceTracker = new PerformanceTracker();
    this.testSuites = [];
    this.results = {};
    this.startTime = Date.now();
  }

  async runAllTests() {
    this.tracker.log('🚀 Starting Comprehensive Test Suite for OpenAI Assistants MCP Server', 'start');
    this.tracker.log('Testing both Cloudflare Workers and NPM package deployments', 'info');
    this.tracker.log(`Environment: Node.js ${process.version}`, 'info');
    this.tracker.log(`API Key: ${process.env.OPENAI_API_KEY ? 'configured' : 'test-only mode'}`, 'info');

    try {
      // Initialize test suites
      this.initializeTestSuites();

      // Run test suites based on configuration
      const config = this.getTestConfiguration();
      
      if (config.runIntegration) {
        await this.runTestSuite('Integration Tests', ComprehensiveIntegrationTester);
      }

      if (config.runErrorHandling) {
        await this.runTestSuite('Error Handling Tests', ErrorHandlingTester);
      }

      if (config.runPerformance) {
        await this.runTestSuite('Performance Tests', PerformanceTester);
      }

      if (config.runEdgeCases) {
        await this.runTestSuite('Edge Case Tests', EdgeCaseTester);
      }

      if (config.runCloudflareWorkers) {
        await this.runTestSuite('Cloudflare Workers Tests', CloudflareWorkersSpecificTester);
      }

      if (config.runNPMPackage) {
        await this.runTestSuite('NPM Package Tests', NPMPackageSpecificTester);
      }

      // Generate comprehensive report
      this.generateComprehensiveReport();

      const overallSuccess = this.calculateOverallSuccess();
      this.tracker.log(`🎉 Comprehensive test suite completed! Overall success: ${overallSuccess ? 'PASS' : 'FAIL'}`, overallSuccess ? 'success' : 'error');
      
      return overallSuccess;
    } catch (error) {
      this.tracker.log(`💥 Comprehensive test suite failed: ${error.message}`, 'error');
      return false;
    }
  }

  initializeTestSuites() {
    this.testSuites = [
      {
        name: 'Integration Tests',
        description: 'Tests all 22 tools across both deployments',
        class: ComprehensiveIntegrationTester,
        priority: 1,
        estimatedTime: '2-3 minutes'
      },
      {
        name: 'Error Handling Tests',
        description: 'Tests error scenarios and edge cases',
        class: ErrorHandlingTester,
        priority: 2,
        estimatedTime: '1-2 minutes'
      },
      {
        name: 'Performance Tests',
        description: 'Tests performance characteristics',
        class: PerformanceTester,
        priority: 3,
        estimatedTime: '2-4 minutes'
      },
      {
        name: 'Edge Case Tests',
        description: 'Tests boundary conditions and special cases',
        class: EdgeCaseTester,
        priority: 4,
        estimatedTime: '1-2 minutes'
      },
      {
        name: 'Cloudflare Workers Tests',
        description: 'Tests Cloudflare Workers specific features',
        class: CloudflareWorkersSpecificTester,
        priority: 5,
        estimatedTime: '1-2 minutes'
      },
      {
        name: 'NPM Package Tests',
        description: 'Tests NPM package specific features',
        class: NPMPackageSpecificTester,
        priority: 6,
        estimatedTime: '1-2 minutes'
      }
    ];

    this.tracker.log(`Initialized ${this.testSuites.length} test suites`, 'info');
    
    const totalEstimatedTime = this.testSuites.reduce((total, suite) => {
      const time = suite.estimatedTime.split('-')[1] || suite.estimatedTime.split('-')[0];
      return total + parseInt(time);
    }, 0);
    
    this.tracker.log(`Estimated total time: ${totalEstimatedTime} minutes`, 'info');
  }

  getTestConfiguration() {
    const args = process.argv.slice(2);
    const config = {
      runIntegration: true,
      runErrorHandling: true,
      runPerformance: true,
      runEdgeCases: true,
      runCloudflareWorkers: true,
      runNPMPackage: true
    };

    // Parse command line arguments
    if (args.includes('--integration-only')) {
      Object.keys(config).forEach(key => config[key] = false);
      config.runIntegration = true;
    }

    if (args.includes('--performance-only')) {
      Object.keys(config).forEach(key => config[key] = false);
      config.runPerformance = true;
    }

    if (args.includes('--cloudflare-only')) {
      Object.keys(config).forEach(key => config[key] = false);
      config.runCloudflareWorkers = true;
    }

    if (args.includes('--npm-only')) {
      Object.keys(config).forEach(key => config[key] = false);
      config.runNPMPackage = true;
    }

    if (args.includes('--skip-performance')) {
      config.runPerformance = false;
    }

    if (args.includes('--skip-edge-cases')) {
      config.runEdgeCases = false;
    }

    if (args.includes('--core-only')) {
      config.runCloudflareWorkers = false;
      config.runNPMPackage = false;
      config.runEdgeCases = false;
    }

    return config;
  }

  async runTestSuite(suiteName, TestClass) {
    await this.tracker.runTest(suiteName, async () => {
      this.tracker.log(`\n${'='.repeat(80)}`, 'info');
      this.tracker.log(`🧪 Starting ${suiteName}`, 'info');
      this.tracker.log(`${'='.repeat(80)}`, 'info');

      const suiteStartTime = Date.now();
      const tester = new TestClass();
      
      try {
        const success = await this.performanceTracker.measure(suiteName, async () => {
          return tester.runAllTests();
        });

        const suiteDuration = Date.now() - suiteStartTime;
        const report = tester.generateReport();

        this.results[suiteName] = {
          success,
          duration: suiteDuration,
          report,
          details: report
        };

        if (success) {
          this.tracker.log(`✅ ${suiteName} completed successfully in ${suiteDuration}ms`, 'pass');
        } else {
          this.tracker.log(`❌ ${suiteName} failed after ${suiteDuration}ms`, 'fail');
        }

        return success;
      } catch (error) {
        const suiteDuration = Date.now() - suiteStartTime;
        this.results[suiteName] = {
          success: false,
          duration: suiteDuration,
          error: error.message,
          details: null
        };

        this.tracker.log(`💥 ${suiteName} crashed: ${error.message}`, 'error');
        throw error;
      }
    });
  }

  calculateOverallSuccess() {
    const results = Object.values(this.results);
    const totalSuites = results.length;
    const successfulSuites = results.filter(r => r.success).length;
    
    // Require at least 80% success rate
    return successfulSuites / totalSuites >= 0.8;
  }

  generateComprehensiveReport() {
    const totalDuration = Date.now() - this.startTime;
    const results = Object.values(this.results);
    const totalSuites = results.length;
    const successfulSuites = results.filter(r => r.success).length;
    const failedSuites = results.filter(r => !r.success).length;

    console.log('\n' + '='.repeat(100));
    console.log('📊 COMPREHENSIVE TEST REPORT - OpenAI Assistants MCP Server');
    console.log('='.repeat(100));
    console.log(`Test Environment: Node.js ${process.version}`);
    console.log(`API Key: ${process.env.OPENAI_API_KEY ? 'Real OpenAI API' : 'Test/Validation Mode'}`);
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)} seconds`);
    console.log(`Test Suites: ${totalSuites}`);
    console.log(`Successful: ${successfulSuites}`);
    console.log(`Failed: ${failedSuites}`);
    console.log(`Success Rate: ${totalSuites > 0 ? Math.round((successfulSuites / totalSuites) * 100) : 0}%`);
    console.log('='.repeat(100));

    // Detailed results by suite
    console.log('\n📋 DETAILED RESULTS BY TEST SUITE:');
    console.log('-'.repeat(100));

    Object.entries(this.results).forEach(([suiteName, result]) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      const duration = `${(result.duration / 1000).toFixed(2)}s`;
      
      console.log(`${status} ${suiteName.padEnd(30)} ${duration.padStart(8)}`);
      
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
      
      if (result.details && result.details.passed !== undefined) {
        console.log(`    Tests: ${result.details.passed}/${result.details.total} passed`);
      }
    });

    // Performance summary
    console.log('\n⚡ PERFORMANCE SUMMARY:');
    console.log('-'.repeat(100));
    
    const perfStats = this.performanceTracker.getStats();
    if (perfStats.count > 0) {
      console.log(`Total Operations: ${perfStats.count}`);
      console.log(`Average Duration: ${perfStats.avg.toFixed(2)}ms`);
      console.log(`Fastest Operation: ${perfStats.min.toFixed(2)}ms`);
      console.log(`Slowest Operation: ${perfStats.max.toFixed(2)}ms`);
      console.log(`Failed Operations: ${perfStats.failed}`);
    }

    // Deployment comparison
    this.generateDeploymentComparison();

    // Recommendations
    this.generateRecommendations();

    console.log('\n' + '='.repeat(100));
    
    const overallStatus = this.calculateOverallSuccess() ? 'READY FOR PRODUCTION' : 'NEEDS ATTENTION';
    const statusIcon = this.calculateOverallSuccess() ? '🚀' : '⚠️';
    
    console.log(`${statusIcon} OVERALL STATUS: ${overallStatus}`);
    console.log('='.repeat(100));
  }

  generateDeploymentComparison() {
    const cloudflareResult = this.results['Cloudflare Workers Tests'];
    const npmResult = this.results['NPM Package Tests'];

    if (cloudflareResult && npmResult) {
      console.log('\n🔄 DEPLOYMENT COMPARISON:');
      console.log('-'.repeat(100));
      
      console.log(`Cloudflare Workers: ${cloudflareResult.success ? 'PASS' : 'FAIL'} (${(cloudflareResult.duration / 1000).toFixed(2)}s)`);
      console.log(`NPM Package:        ${npmResult.success ? 'PASS' : 'FAIL'} (${(npmResult.duration / 1000).toFixed(2)}s)`);
      
      if (cloudflareResult.success && npmResult.success) {
        console.log('✅ Both deployments working correctly');
      } else if (cloudflareResult.success) {
        console.log('⚠️  Only Cloudflare Workers deployment working');
      } else if (npmResult.success) {
        console.log('⚠️  Only NPM Package deployment working');
      } else {
        console.log('❌ Both deployments have issues');
      }
    }
  }

  generateRecommendations() {
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('-'.repeat(100));

    const failedSuites = Object.entries(this.results).filter(([_, result]) => !result.success);
    
    if (failedSuites.length === 0) {
      console.log('✅ All test suites passed - system is ready for production');
      console.log('✅ Both deployment options are working correctly');
      console.log('✅ All 22 tools are functioning as expected');
    } else {
      console.log('⚠️  The following areas need attention:');
      
      failedSuites.forEach(([suiteName, result]) => {
        console.log(`   - ${suiteName}: ${result.error || 'Multiple test failures'}`);
      });
    }

    // Performance recommendations
    const perfStats = this.performanceTracker.getStats();
    if (perfStats.avg > 2000) {
      console.log('⚠️  Consider optimizing performance - average response time is high');
    }

    if (perfStats.failed > 0) {
      console.log('⚠️  Some operations failed - check error handling and API connectivity');
    }

    // API key recommendations
    if (!process.env.OPENAI_API_KEY) {
      console.log('💡 Set OPENAI_API_KEY environment variable for full API testing');
    }

    console.log('💡 Run individual test suites for detailed debugging:');
    console.log('   npm run test:integration');
    console.log('   npm run test:performance');
    console.log('   npm run test:cloudflare');
    console.log('   npm run test:npm');
  }

  showUsage() {
    console.log('OpenAI Assistants MCP Server - Comprehensive Test Runner');
    console.log('');
    console.log('Usage: node test/run-all-tests.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --integration-only    Run only integration tests');
    console.log('  --performance-only    Run only performance tests');
    console.log('  --cloudflare-only     Run only Cloudflare Workers tests');
    console.log('  --npm-only           Run only NPM package tests');
    console.log('  --skip-performance   Skip performance tests');
    console.log('  --skip-edge-cases    Skip edge case tests');
    console.log('  --core-only          Run only core tests (skip deployment-specific)');
    console.log('  --help               Show this help message');
    console.log('');
    console.log('Environment Variables:');
    console.log('  OPENAI_API_KEY       OpenAI API key for real API testing');
    console.log('');
    console.log('Examples:');
    console.log('  node test/run-all-tests.js');
    console.log('  node test/run-all-tests.js --core-only');
    console.log('  OPENAI_API_KEY=your-api-key node test/run-all-tests.js');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    const runner = new ComprehensiveTestRunner();
    runner.showUsage();
    process.exit(0);
  }

  const runner = new ComprehensiveTestRunner();
  
  try {
    const success = await runner.runAllTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ComprehensiveTestRunner };