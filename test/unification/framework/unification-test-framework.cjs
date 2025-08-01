/**
 * Unification Test Framework
 * 
 * Core testing framework for validating codebase unification process.
 * Provides comprehensive testing capabilities for before/after comparison,
 * regression detection, and performance benchmarking.
 */

const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');

class UnificationTestFramework {
    constructor(options = {}) {
        this.options = {
            testMode: process.env.UNIFICATION_TEST_MODE || 'comparison',
            target: process.env.UNIFICATION_TARGET || 'both',
            phase: process.env.UNIFICATION_PHASE || 'preparation',
            checkpoint: process.env.UNIFICATION_CHECKPOINT || null,
            verbose: options.verbose || false,
            reportPath: options.reportPath || 'test/unification/reports',
            ...options
        };

        this.testResults = {
            passed: 0,
            failed: 0,
            skipped: 0,
            errors: [],
            warnings: [],
            performance: {},
            startTime: null,
            endTime: null
        };

        this.testSuites = new Map();
        this.beforeHooks = [];
        this.afterHooks = [];
        this.beforeEachHooks = [];
        this.afterEachHooks = [];
    }

    /**
     * Register a test suite
     */
    describe(name, testFunction) {
        const suite = {
            name,
            tests: [],
            beforeHooks: [],
            afterHooks: [],
            beforeEachHooks: [],
            afterEachHooks: []
        };

        this.testSuites.set(name, suite);

        // Create suite context
        const suiteContext = {
            it: (testName, testFn) => this.it(suite, testName, testFn),
            before: (hookFn) => suite.beforeHooks.push(hookFn),
            after: (hookFn) => suite.afterHooks.push(hookFn),
            beforeEach: (hookFn) => suite.beforeEachHooks.push(hookFn),
            afterEach: (hookFn) => suite.afterEachHooks.push(hookFn)
        };

        // Execute test function to register tests
        testFunction.call(suiteContext, suiteContext);
        return suite;
    }

    /**
     * Register a test case
     */
    it(suite, name, testFunction) {
        const test = {
            name,
            function: testFunction,
            suite: suite.name,
            status: 'pending',
            error: null,
            duration: 0,
            performance: {}
        };

        suite.tests.push(test);
        return test;
    }

    /**
     * Global before hook
     */
    before(hookFunction) {
        this.beforeHooks.push(hookFunction);
    }

    /**
     * Global after hook
     */
    after(hookFunction) {
        this.afterHooks.push(hookFunction);
    }

    /**
     * Global beforeEach hook
     */
    beforeEach(hookFunction) {
        this.beforeEachHooks.push(hookFunction);
    }

    /**
     * Global afterEach hook
     */
    afterEach(hookFunction) {
        this.afterEachHooks.push(hookFunction);
    }

    /**
     * Run all registered test suites
     */
    async run() {
        this.testResults.startTime = performance.now();
        
        try {
            this.log('🚀 Starting Unification Test Framework');
            this.log(`📋 Test Mode: ${this.options.testMode}`);
            this.log(`🎯 Target: ${this.options.target}`);
            this.log(`📍 Phase: ${this.options.phase}`);
            this.log('');

            // Run global before hooks
            await this.runHooks(this.beforeHooks, 'Global Before');

            // Run each test suite
            for (const [suiteName, suite] of this.testSuites) {
                await this.runTestSuite(suite);
            }

            // Run global after hooks
            await this.runHooks(this.afterHooks, 'Global After');

        } catch (error) {
            this.testResults.errors.push({
                type: 'framework',
                message: error.message,
                stack: error.stack
            });
        }

        this.testResults.endTime = performance.now();
        await this.generateReport();
        return this.testResults;
    }

    /**
     * Run a specific test suite
     */
    async runTestSuite(suite) {
        this.log(`\n📋 Running Test Suite: ${suite.name}`);

        try {
            // Run suite before hooks
            await this.runHooks(suite.beforeHooks, `${suite.name} Before`);

            // Run each test in the suite
            for (const test of suite.tests) {
                await this.runTest(test, suite);
            }

            // Run suite after hooks
            await this.runHooks(suite.afterHooks, `${suite.name} After`);

        } catch (error) {
            this.testResults.errors.push({
                type: 'suite',
                suite: suite.name,
                message: error.message,
                stack: error.stack
            });
        }
    }

    /**
     * Run a specific test
     */
    async runTest(test, suite) {
        const startTime = performance.now();

        try {
            // Run beforeEach hooks
            await this.runHooks([...this.beforeEachHooks, ...suite.beforeEachHooks], 'BeforeEach');

            // Run the test
            await test.function();

            // Test passed
            test.status = 'passed';
            this.testResults.passed++;
            this.log(`  ✅ ${test.name}`);

            // Run afterEach hooks
            await this.runHooks([...suite.afterEachHooks, ...this.afterEachHooks], 'AfterEach');

        } catch (error) {
            // Test failed
            test.status = 'failed';
            test.error = {
                message: error.message,
                stack: error.stack
            };
            this.testResults.failed++;
            this.testResults.errors.push({
                type: 'test',
                suite: suite.name,
                test: test.name,
                message: error.message,
                stack: error.stack
            });
            this.log(`  ❌ ${test.name}: ${error.message}`);
        }

        test.duration = performance.now() - startTime;
    }

    /**
     * Run hooks
     */
    async runHooks(hooks, context) {
        for (const hook of hooks) {
            try {
                await hook();
            } catch (error) {
                this.testResults.errors.push({
                    type: 'hook',
                    context,
                    message: error.message,
                    stack: error.stack
                });
                throw error;
            }
        }
    }

    /**
     * Assertion helpers
     */
    static get assert() {
        return {
            strictEqual: (actual, expected, message) => {
                if (actual !== expected) {
                    throw new Error(message || `Expected ${expected}, got ${actual}`);
                }
            },

            deepStrictEqual: (actual, expected, message) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(message || 'Deep equality assertion failed');
                }
            },

            ok: (value, message) => {
                if (!value) {
                    throw new Error(message || 'Expected truthy value');
                }
            },

            throws: async (fn, expectedError, message) => {
                try {
                    await fn();
                    throw new Error(message || 'Expected function to throw');
                } catch (error) {
                    if (expectedError && !error.message.includes(expectedError)) {
                        throw new Error(message || `Expected error containing "${expectedError}", got "${error.message}"`);
                    }
                }
            },

            performance: (actualMs, maxMs, message) => {
                if (actualMs > maxMs) {
                    throw new Error(message || `Performance assertion failed: ${actualMs}ms > ${maxMs}ms`);
                }
            }
        };
    }

    /**
     * Utility methods for unification testing
     */
    static get utils() {
        return {
            loadFixture: async (fixtureName) => {
                const fixturePath = path.join(__dirname, '../fixtures', fixtureName);
                const content = await fs.readFile(fixturePath, 'utf8');
                return JSON.parse(content);
            },

            compareFiles: async (file1Path, file2Path) => {
                const [content1, content2] = await Promise.all([
                    fs.readFile(file1Path, 'utf8'),
                    fs.readFile(file2Path, 'utf8')
                ]);
                return content1 === content2;
            },

            measurePerformance: async (fn) => {
                const start = performance.now();
                const result = await fn();
                const duration = performance.now() - start;
                return { result, duration };
            },

            createSnapshot: async (data, snapshotName) => {
                const snapshotPath = path.join(__dirname, '../fixtures/snapshots', `${snapshotName}.json`);
                await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
                await fs.writeFile(snapshotPath, JSON.stringify(data, null, 2));
                return snapshotPath;
            },

            loadSnapshot: async (snapshotName) => {
                const snapshotPath = path.join(__dirname, '../fixtures/snapshots', `${snapshotName}.json`);
                const content = await fs.readFile(snapshotPath, 'utf8');
                return JSON.parse(content);
            }
        };
    }

    /**
     * Generate test report
     */
    async generateReport() {
        const totalTests = this.testResults.passed + this.testResults.failed + this.testResults.skipped;
        const duration = this.testResults.endTime - this.testResults.startTime;
        const successRate = totalTests > 0 ? (this.testResults.passed / totalTests * 100).toFixed(2) : 0;

        const report = {
            summary: {
                totalTests,
                passed: this.testResults.passed,
                failed: this.testResults.failed,
                skipped: this.testResults.skipped,
                successRate: `${successRate}%`,
                duration: `${duration.toFixed(2)}ms`,
                timestamp: new Date().toISOString()
            },
            configuration: this.options,
            errors: this.testResults.errors,
            warnings: this.testResults.warnings,
            performance: this.testResults.performance
        };

        // Save report
        await fs.mkdir(this.options.reportPath, { recursive: true });
        const reportPath = path.join(this.options.reportPath, `unification-test-report-${Date.now()}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        // Log summary
        this.log('\n📊 Test Summary:');
        this.log(`   Total Tests: ${totalTests}`);
        this.log(`   Passed: ${this.testResults.passed} ✅`);
        this.log(`   Failed: ${this.testResults.failed} ❌`);
        this.log(`   Skipped: ${this.testResults.skipped} ⏭️`);
        this.log(`   Success Rate: ${successRate}%`);
        this.log(`   Duration: ${duration.toFixed(2)}ms`);
        this.log(`   Report: ${reportPath}`);

        return report;
    }

    /**
     * Logging utility
     */
    log(message) {
        if (this.options.verbose || process.env.NODE_ENV !== 'test') {
            console.log(message);
        }
    }
}

module.exports = UnificationTestFramework;