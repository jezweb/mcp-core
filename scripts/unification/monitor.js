#!/usr/bin/env node

/**
 * Continuous Monitoring Script for Phase 3.2 Unification
 * Monitors system health during unification process
 */

const fs = require('fs');
const path = require('path');

class UnificationMonitor {
  constructor() {
    this.startTime = Date.now();
    this.checkpoints = [];
    this.errors = [];
  }

  checkpoint(name, status = 'success', details = '') {
    const checkpoint = {
      name,
      status,
      details,
      timestamp: new Date().toISOString(),
      elapsed: Date.now() - this.startTime
    };
    
    this.checkpoints.push(checkpoint);
    console.log(`[${checkpoint.timestamp}] 📍 CHECKPOINT: ${name} - ${status.toUpperCase()}`);
    if (details) console.log(`   Details: ${details}`);
    
    // Save to file
    this.saveReport();
  }

  error(message, context = '') {
    const error = {
      message,
      context,
      timestamp: new Date().toISOString(),
      elapsed: Date.now() - this.startTime
    };
    
    this.errors.push(error);
    console.error(`[${error.timestamp}] ❌ ERROR: ${message}`);
    if (context) console.error(`   Context: ${context}`);
    
    this.saveReport();
  }

  saveReport() {
    const report = {
      startTime: new Date(this.startTime).toISOString(),
      currentTime: new Date().toISOString(),
      totalElapsed: Date.now() - this.startTime,
      checkpoints: this.checkpoints,
      errors: this.errors,
      summary: {
        totalCheckpoints: this.checkpoints.length,
        successfulCheckpoints: this.checkpoints.filter(c => c.status === 'success').length,
        failedCheckpoints: this.checkpoints.filter(c => c.status === 'failed').length,
        totalErrors: this.errors.length
      }
    };

    fs.writeFileSync('scripts/unification/monitor-report.json', JSON.stringify(report, null, 2));
  }

  generateSummary() {
    const duration = Date.now() - this.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    console.log('\n📊 UNIFICATION MONITORING SUMMARY');
    console.log('=====================================');
    console.log(`Duration: ${minutes}m ${seconds}s`);
    console.log(`Checkpoints: ${this.checkpoints.length}`);
    console.log(`Errors: ${this.errors.length}`);
    console.log(`Success Rate: ${((this.checkpoints.filter(c => c.status === 'success').length / this.checkpoints.length) * 100).toFixed(1)}%`);
    
    return {
      duration,
      checkpoints: this.checkpoints.length,
      errors: this.errors.length,
      successRate: (this.checkpoints.filter(c => c.status === 'success').length / this.checkpoints.length) * 100
    };
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UnificationMonitor;
}

// Global monitor instance
global.unificationMonitor = new UnificationMonitor();

console.log('🔄 Unification monitoring started...');
global.unificationMonitor.checkpoint('Monitoring System Initialized');
