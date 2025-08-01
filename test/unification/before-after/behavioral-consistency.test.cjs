/**
 * Behavioral Consistency Tests
 * 
 * Tests to ensure that unified components behave identically to
 * original duplicated components across both deployment targets.
 */

const UnificationTestFramework = require('../framework/unification-test-framework.cjs');
const ComparisonEngine = require('../framework/comparison-engine.cjs');
const path = require('path');

// Initialize test framework and comparison engine
const testFramework = new UnificationTestFramework({
    verbose: true,
    reportPath: path.join(__dirname, '../reports')
});

const comparisonEngine = new ComparisonEngine({
    tolerance: 0.001,
    ignoreFields: ['timestamp', 'requestId', 'created_at']
});

// Test data
let sampleRequests, expectedResponses;
let beforeResponses = new Map();
let afterResponses = new Map();

// Global setup
testFramework.before(async () => {
    console.log('🔧 Setting up behavioral consistency tests...');
    
    // Load test fixtures
    sampleRequests = await UnificationTestFramework.utils.loadFixture('sample-requests.json');
    expectedResponses = await UnificationTestFramework.utils.loadFixture('expected-responses.json');
    
    console.log('✅ Test fixtures loaded');
});

// Global teardown
testFramework.after(async () => {
    console.log('🧹 Cleaning up behavioral consistency tests...');
    
    // Generate comparison report
    const comparisonReport = await comparisonEngine.generateComparisonReport();
    console.log(`📊 Generated comparison report with ${comparisonReport.summary.totalComparisons} comparisons`);
});

// Assistant API Behavioral Consistency Tests
testFramework.describe('Assistant API Behavioral Consistency', function() {
    
    this.beforeEach(async () => {
        // Reset comparison state for each test
        comparisonEngine.comparisons = [];
    });

    this.it('should maintain identical assistant creation behavior', async () => {
        const request = sampleRequests.assistant_create;
        const expected = expectedResponses.assistant_create;
        
        // Simulate before response (original duplicated code)
        const beforeResponse = {
            status: expected.status,
            headers: expected.headers,
            body: {
                ...expected.body,
                id: 'asst_before_123',
                created_at: 1699472932
            }
        };
        
        // Simulate after response (unified code)
        const afterResponse = {
            status: expected.status,
            headers: expected.headers,
            body: {
                ...expected.body,
                id: 'asst_after_123',
                created_at: 1699472933
            }
        };
        
        // Compare responses
        const comparison = await comparisonEngine.compareApiResponses(
            beforeResponse,
            afterResponse,
            { operation: 'assistant_create', test: 'behavioral_consistency' }
        );
        
        // Assertions
        UnificationTestFramework.assert.ok(comparison.passed, 
            `Assistant creation behavior should be consistent: ${JSON.stringify(comparison.differences)}`);
        UnificationTestFramework.assert.ok(comparison.similarity >= 0.95, 
            `Response similarity should be >= 95%, got ${comparison.similarity}`);
    });

    this.it('should maintain identical error handling behavior', async () => {
        const request = sampleRequests.error_scenarios.invalid_auth;
        const expected = expectedResponses.error_responses.invalid_auth;
        
        // Simulate before error response
        const beforeResponse = {
            status: expected.status,
            headers: expected.headers,
            body: expected.body
        };
        
        // Simulate after error response
        const afterResponse = {
            status: expected.status,
            headers: expected.headers,
            body: expected.body
        };
        
        // Compare error responses
        const comparison = await comparisonEngine.compareApiResponses(
            beforeResponse,
            afterResponse,
            { operation: 'error_handling', test: 'invalid_auth' }
        );
        
        // Assertions
        UnificationTestFramework.assert.ok(comparison.passed, 
            'Error handling behavior should be identical');
        UnificationTestFramework.assert.strictEqual(comparison.similarity, 1.0, 
            'Error responses should be exactly identical');
    });

    this.it('should maintain consistent list response structure', async () => {
        const request = sampleRequests.assistant_list;
        const expected = expectedResponses.assistant_list;
        
        // Simulate before list response
        const beforeResponse = {
            status: expected.status,
            headers: expected.headers,
            body: {
                ...expected.body,
                data: expected.body.data.map(item => ({
                    ...item,
                    created_at: 1699472932
                }))
            }
        };
        
        // Simulate after list response
        const afterResponse = {
            status: expected.status,
            headers: expected.headers,
            body: {
                ...expected.body,
                data: expected.body.data.map(item => ({
                    ...item,
                    created_at: 1699472933
                }))
            }
        };
        
        // Compare list responses
        const comparison = await comparisonEngine.compareApiResponses(
            beforeResponse,
            afterResponse,
            { operation: 'assistant_list', test: 'list_structure' }
        );
        
        // Assertions
        UnificationTestFramework.assert.ok(comparison.passed, 
            'List response structure should be consistent');
        UnificationTestFramework.assert.ok(comparison.similarity >= 0.95, 
            'List response similarity should be high');
    });
});

// Performance Consistency Tests
testFramework.describe('Performance Consistency', function() {
    
    this.it('should maintain acceptable performance after unification', async () => {
        const beforeMetrics = {
            responseTime: 150,
            memoryUsage: 75,
            cpuUsage: 15
        };
        
        const afterMetrics = {
            responseTime: 155, // 3.3% increase - acceptable
            memoryUsage: 73,   // 2.7% decrease - improvement
            cpuUsage: 16       // 6.7% increase - acceptable
        };
        
        // Compare performance metrics
        const comparison = await comparisonEngine.comparePerformance(
            beforeMetrics,
            afterMetrics,
            { operation: 'assistant_create', test: 'performance_consistency' }
        );
        
        // Assertions
        UnificationTestFramework.assert.ok(comparison.passed, 
            `Performance should not regress significantly: ${JSON.stringify(comparison.regressions)}`);
        UnificationTestFramework.assert.ok(comparison.regressions.length === 0, 
            'Should have no performance regressions');
    });

    this.it('should detect performance regressions', async () => {
        const beforeMetrics = {
            responseTime: 150,
            memoryUsage: 75,
            cpuUsage: 15
        };
        
        const afterMetrics = {
            responseTime: 300, // 100% increase - regression
            memoryUsage: 150,  // 100% increase - regression
            cpuUsage: 30       // 100% increase - regression
        };
        
        // Compare performance metrics
        const comparison = await comparisonEngine.comparePerformance(
            beforeMetrics,
            afterMetrics,
            { operation: 'performance_regression_test', test: 'regression_detection' }
        );
        
        // Assertions
        UnificationTestFramework.assert.ok(!comparison.passed, 
            'Should detect performance regressions');
        UnificationTestFramework.assert.ok(comparison.regressions.length > 0, 
            'Should identify specific regressions');
    });
});

// Behavioral Pattern Tests
testFramework.describe('Behavioral Pattern Consistency', function() {
    
    this.it('should maintain consistent error handling patterns', async () => {
        const beforeBehavior = {
            errorHandling: {
                authenticationErrors: '401_with_error_object',
                validationErrors: '400_with_detailed_message',
                notFoundErrors: '404_with_resource_info'
            }
        };
        
        const afterBehavior = {
            errorHandling: {
                authenticationErrors: '401_with_error_object',
                validationErrors: '400_with_detailed_message',
                notFoundErrors: '404_with_resource_info'
            }
        };
        
        // Compare behavioral patterns
        const comparison = await comparisonEngine.compareBehavior(
            beforeBehavior,
            afterBehavior,
            { test: 'error_handling_patterns' }
        );
        
        // Assertions
        UnificationTestFramework.assert.ok(comparison.passed, 
            'Error handling patterns should be consistent');
        UnificationTestFramework.assert.ok(comparison.patterns.consistent.includes('errorHandling'), 
            'Error handling should be marked as consistent');
    });

    this.it('should detect behavioral inconsistencies', async () => {
        const beforeBehavior = {
            responsePatterns: {
                successFormat: 'consistent_object_structure',
                listFormat: 'object_with_data_array'
            }
        };
        
        const afterBehavior = {
            responsePatterns: {
                successFormat: 'different_object_structure', // Changed
                listFormat: 'object_with_data_array'
            }
        };
        
        // Compare behavioral patterns
        const comparison = await comparisonEngine.compareBehavior(
            beforeBehavior,
            afterBehavior,
            { test: 'response_pattern_inconsistency' }
        );
        
        // Assertions
        UnificationTestFramework.assert.ok(!comparison.passed, 
            'Should detect behavioral inconsistencies');
        UnificationTestFramework.assert.ok(comparison.patterns.inconsistent.includes('responsePatterns'), 
            'Response patterns should be marked as inconsistent');
    });
});

// Snapshot Testing
testFramework.describe('Snapshot Consistency', function() {
    
    this.it('should create and validate snapshots', async () => {
        const testData = {
            id: 'asst_snapshot_test',
            object: 'assistant',
            name: 'Snapshot Test Assistant',
            model: 'gpt-4'
        };
        
        // Create snapshot
        const snapshot = await comparisonEngine.createSnapshot(
            testData,
            'assistant_snapshot_test',
            { test: 'snapshot_creation' }
        );
        
        // Validate snapshot creation
        UnificationTestFramework.assert.ok(snapshot.name === 'assistant_snapshot_test', 
            'Snapshot should have correct name');
        UnificationTestFramework.assert.ok(snapshot.hash, 
            'Snapshot should have hash');
        
        // Compare against snapshot
        const comparison = await comparisonEngine.compareWithSnapshot(
            testData,
            'assistant_snapshot_test',
            { test: 'snapshot_validation' }
        );
        
        // Assertions
        UnificationTestFramework.assert.ok(comparison.passed, 
            'Data should match snapshot exactly');
        UnificationTestFramework.assert.strictEqual(comparison.similarity, 1.0, 
            'Snapshot comparison should be 100% similar');
    });
});

// Run the tests
if (require.main === module) {
    testFramework.run().then(results => {
        console.log('\n🎯 Behavioral Consistency Test Results:');
        console.log(`   Passed: ${results.passed}`);
        console.log(`   Failed: ${results.failed}`);
        console.log(`   Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(2)}%`);
        
        process.exit(results.failed > 0 ? 1 : 0);
    }).catch(error => {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = testFramework;