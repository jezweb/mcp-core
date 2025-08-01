/**
 * Comparison Engine
 * 
 * Advanced comparison engine for validating behavioral consistency
 * between original duplicated components and unified components.
 * Provides deep comparison capabilities for API responses, performance,
 * and behavioral patterns.
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { performance } = require('perf_hooks');

class ComparisonEngine {
    constructor(options = {}) {
        this.options = {
            tolerance: options.tolerance || 0.001, // Performance tolerance
            deepCompare: options.deepCompare !== false,
            ignoreFields: options.ignoreFields || ['timestamp', 'requestId'],
            snapshotPath: options.snapshotPath || 'test/unification/fixtures/snapshots',
            ...options
        };

        this.comparisons = [];
        this.snapshots = new Map();
    }

    /**
     * Compare two API responses for behavioral consistency
     */
    async compareApiResponses(beforeResponse, afterResponse, context = {}) {
        const comparison = {
            id: this.generateComparisonId(),
            type: 'api_response',
            context,
            timestamp: new Date().toISOString(),
            before: this.sanitizeResponse(beforeResponse),
            after: this.sanitizeResponse(afterResponse),
            differences: [],
            similarity: 0,
            passed: false
        };

        try {
            // Structure comparison
            const structureDiff = this.compareStructure(comparison.before, comparison.after);
            if (structureDiff.length > 0) {
                comparison.differences.push({
                    type: 'structure',
                    differences: structureDiff
                });
            }

            // Content comparison
            const contentDiff = this.compareContent(comparison.before, comparison.after);
            if (contentDiff.length > 0) {
                comparison.differences.push({
                    type: 'content',
                    differences: contentDiff
                });
            }

            // Type comparison
            const typeDiff = this.compareTypes(comparison.before, comparison.after);
            if (typeDiff.length > 0) {
                comparison.differences.push({
                    type: 'types',
                    differences: typeDiff
                });
            }

            // Calculate similarity score
            comparison.similarity = this.calculateSimilarity(comparison.before, comparison.after);
            comparison.passed = comparison.similarity >= 0.95 && comparison.differences.length === 0;

        } catch (error) {
            comparison.error = {
                message: error.message,
                stack: error.stack
            };
        }

        this.comparisons.push(comparison);
        return comparison;
    }

    /**
     * Compare performance metrics
     */
    async comparePerformance(beforeMetrics, afterMetrics, context = {}) {
        const comparison = {
            id: this.generateComparisonId(),
            type: 'performance',
            context,
            timestamp: new Date().toISOString(),
            before: beforeMetrics,
            after: afterMetrics,
            differences: [],
            regressions: [],
            improvements: [],
            passed: false
        };

        try {
            // Response time comparison
            if (beforeMetrics.responseTime && afterMetrics.responseTime) {
                const timeDiff = afterMetrics.responseTime - beforeMetrics.responseTime;
                const percentChange = (timeDiff / beforeMetrics.responseTime) * 100;

                if (Math.abs(percentChange) > this.options.tolerance * 100) {
                    const change = {
                        metric: 'responseTime',
                        before: beforeMetrics.responseTime,
                        after: afterMetrics.responseTime,
                        difference: timeDiff,
                        percentChange: percentChange.toFixed(2) + '%'
                    };

                    if (timeDiff > 0) {
                        comparison.regressions.push(change);
                    } else {
                        comparison.improvements.push(change);
                    }
                }
            }

            // Memory usage comparison
            if (beforeMetrics.memoryUsage && afterMetrics.memoryUsage) {
                const memoryDiff = afterMetrics.memoryUsage - beforeMetrics.memoryUsage;
                const percentChange = (memoryDiff / beforeMetrics.memoryUsage) * 100;

                if (Math.abs(percentChange) > this.options.tolerance * 100) {
                    const change = {
                        metric: 'memoryUsage',
                        before: beforeMetrics.memoryUsage,
                        after: afterMetrics.memoryUsage,
                        difference: memoryDiff,
                        percentChange: percentChange.toFixed(2) + '%'
                    };

                    if (memoryDiff > 0) {
                        comparison.regressions.push(change);
                    } else {
                        comparison.improvements.push(change);
                    }
                }
            }

            // CPU usage comparison
            if (beforeMetrics.cpuUsage && afterMetrics.cpuUsage) {
                const cpuDiff = afterMetrics.cpuUsage - beforeMetrics.cpuUsage;
                const percentChange = (cpuDiff / beforeMetrics.cpuUsage) * 100;

                if (Math.abs(percentChange) > this.options.tolerance * 100) {
                    const change = {
                        metric: 'cpuUsage',
                        before: beforeMetrics.cpuUsage,
                        after: afterMetrics.cpuUsage,
                        difference: cpuDiff,
                        percentChange: percentChange.toFixed(2) + '%'
                    };

                    if (cpuDiff > 0) {
                        comparison.regressions.push(change);
                    } else {
                        comparison.improvements.push(change);
                    }
                }
            }

            // Determine if performance comparison passed
            comparison.passed = comparison.regressions.length === 0;

        } catch (error) {
            comparison.error = {
                message: error.message,
                stack: error.stack
            };
        }

        this.comparisons.push(comparison);
        return comparison;
    }

    /**
     * Compare behavioral patterns
     */
    async compareBehavior(beforeBehavior, afterBehavior, context = {}) {
        const comparison = {
            id: this.generateComparisonId(),
            type: 'behavior',
            context,
            timestamp: new Date().toISOString(),
            before: beforeBehavior,
            after: afterBehavior,
            differences: [],
            patterns: {
                consistent: [],
                inconsistent: []
            },
            passed: false
        };

        try {
            // Error handling patterns
            if (beforeBehavior.errorHandling && afterBehavior.errorHandling) {
                const errorComparison = this.compareErrorHandling(
                    beforeBehavior.errorHandling,
                    afterBehavior.errorHandling
                );
                
                if (errorComparison.consistent) {
                    comparison.patterns.consistent.push('errorHandling');
                } else {
                    comparison.patterns.inconsistent.push('errorHandling');
                    comparison.differences.push({
                        type: 'errorHandling',
                        details: errorComparison.differences
                    });
                }
            }

            // Response patterns
            if (beforeBehavior.responsePatterns && afterBehavior.responsePatterns) {
                const responseComparison = this.compareResponsePatterns(
                    beforeBehavior.responsePatterns,
                    afterBehavior.responsePatterns
                );
                
                if (responseComparison.consistent) {
                    comparison.patterns.consistent.push('responsePatterns');
                } else {
                    comparison.patterns.inconsistent.push('responsePatterns');
                    comparison.differences.push({
                        type: 'responsePatterns',
                        details: responseComparison.differences
                    });
                }
            }

            // State management patterns
            if (beforeBehavior.stateManagement && afterBehavior.stateManagement) {
                const stateComparison = this.compareStateManagement(
                    beforeBehavior.stateManagement,
                    afterBehavior.stateManagement
                );
                
                if (stateComparison.consistent) {
                    comparison.patterns.consistent.push('stateManagement');
                } else {
                    comparison.patterns.inconsistent.push('stateManagement');
                    comparison.differences.push({
                        type: 'stateManagement',
                        details: stateComparison.differences
                    });
                }
            }

            comparison.passed = comparison.patterns.inconsistent.length === 0;

        } catch (error) {
            comparison.error = {
                message: error.message,
                stack: error.stack
            };
        }

        this.comparisons.push(comparison);
        return comparison;
    }

    /**
     * Create snapshot for future comparison
     */
    async createSnapshot(data, snapshotName, metadata = {}) {
        const snapshot = {
            name: snapshotName,
            timestamp: new Date().toISOString(),
            metadata,
            data: this.sanitizeResponse(data),
            hash: this.generateHash(data)
        };

        this.snapshots.set(snapshotName, snapshot);

        // Save to file
        await fs.mkdir(this.options.snapshotPath, { recursive: true });
        const snapshotPath = path.join(this.options.snapshotPath, `${snapshotName}.json`);
        await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2));

        return snapshot;
    }

    /**
     * Compare against existing snapshot
     */
    async compareWithSnapshot(data, snapshotName, context = {}) {
        let snapshot;
        
        try {
            // Try to load from memory first
            snapshot = this.snapshots.get(snapshotName);
            
            // If not in memory, load from file
            if (!snapshot) {
                const snapshotPath = path.join(this.options.snapshotPath, `${snapshotName}.json`);
                const snapshotContent = await fs.readFile(snapshotPath, 'utf8');
                snapshot = JSON.parse(snapshotContent);
                this.snapshots.set(snapshotName, snapshot);
            }
        } catch (error) {
            throw new Error(`Snapshot '${snapshotName}' not found: ${error.message}`);
        }

        return this.compareApiResponses(snapshot.data, data, {
            ...context,
            snapshotName,
            snapshotTimestamp: snapshot.timestamp
        });
    }

    /**
     * Generate comparison report
     */
    async generateComparisonReport() {
        const report = {
            summary: {
                totalComparisons: this.comparisons.length,
                passed: this.comparisons.filter(c => c.passed).length,
                failed: this.comparisons.filter(c => !c.passed).length,
                byType: {}
            },
            comparisons: this.comparisons,
            snapshots: Array.from(this.snapshots.values()),
            timestamp: new Date().toISOString()
        };

        // Group by type
        for (const comparison of this.comparisons) {
            if (!report.summary.byType[comparison.type]) {
                report.summary.byType[comparison.type] = { total: 0, passed: 0, failed: 0 };
            }
            report.summary.byType[comparison.type].total++;
            if (comparison.passed) {
                report.summary.byType[comparison.type].passed++;
            } else {
                report.summary.byType[comparison.type].failed++;
            }
        }

        return report;
    }

    // Private helper methods

    sanitizeResponse(response) {
        if (!response || typeof response !== 'object') {
            return response;
        }

        const sanitized = JSON.parse(JSON.stringify(response));
        
        // Remove ignored fields
        for (const field of this.options.ignoreFields) {
            this.removeField(sanitized, field);
        }

        return sanitized;
    }

    removeField(obj, fieldName) {
        if (Array.isArray(obj)) {
            obj.forEach(item => this.removeField(item, fieldName));
        } else if (obj && typeof obj === 'object') {
            delete obj[fieldName];
            Object.values(obj).forEach(value => this.removeField(value, fieldName));
        }
    }

    compareStructure(obj1, obj2) {
        const differences = [];
        const keys1 = Object.keys(obj1 || {});
        const keys2 = Object.keys(obj2 || {});

        // Check for missing keys
        for (const key of keys1) {
            if (!keys2.includes(key)) {
                differences.push({ type: 'missing_key', key, in: 'after' });
            }
        }

        for (const key of keys2) {
            if (!keys1.includes(key)) {
                differences.push({ type: 'extra_key', key, in: 'after' });
            }
        }

        return differences;
    }

    compareContent(obj1, obj2) {
        const differences = [];
        
        if (JSON.stringify(obj1) !== JSON.stringify(obj2)) {
            differences.push({
                type: 'content_mismatch',
                before: obj1,
                after: obj2
            });
        }

        return differences;
    }

    compareTypes(obj1, obj2) {
        const differences = [];
        
        if (typeof obj1 !== typeof obj2) {
            differences.push({
                type: 'type_mismatch',
                before: typeof obj1,
                after: typeof obj2
            });
        }

        return differences;
    }

    calculateSimilarity(obj1, obj2) {
        const str1 = JSON.stringify(obj1);
        const str2 = JSON.stringify(obj2);
        
        if (str1 === str2) return 1.0;
        
        // Simple similarity calculation based on string comparison
        const maxLength = Math.max(str1.length, str2.length);
        const minLength = Math.min(str1.length, str2.length);
        
        let matches = 0;
        for (let i = 0; i < minLength; i++) {
            if (str1[i] === str2[i]) matches++;
        }
        
        return matches / maxLength;
    }

    compareErrorHandling(before, after) {
        return {
            consistent: JSON.stringify(before) === JSON.stringify(after),
            differences: JSON.stringify(before) !== JSON.stringify(after) ? [{ before, after }] : []
        };
    }

    compareResponsePatterns(before, after) {
        return {
            consistent: JSON.stringify(before) === JSON.stringify(after),
            differences: JSON.stringify(before) !== JSON.stringify(after) ? [{ before, after }] : []
        };
    }

    compareStateManagement(before, after) {
        return {
            consistent: JSON.stringify(before) === JSON.stringify(after),
            differences: JSON.stringify(before) !== JSON.stringify(after) ? [{ before, after }] : []
        };
    }

    generateComparisonId() {
        return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateHash(data) {
        return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    }
}

module.exports = ComparisonEngine;