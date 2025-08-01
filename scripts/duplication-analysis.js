#!/usr/bin/env node

/**
 * Comprehensive Duplication Analysis Script
 * Analyzes all duplicate files and structures in the codebase
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DuplicationAnalyzer {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
    this.duplications = [];
    this.fileStats = new Map();
    this.results = {
      totalDuplicateFiles: 0,
      totalDuplicateLines: 0,
      totalDuplicateSize: 0,
      duplicateStructures: [],
      behavioralDifferences: [],
      riskAssessment: []
    };
  }

  /**
   * Calculate file hash for content comparison
   */
  calculateFileHash(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return crypto.createHash('md5').update(content).digest('hex');
    } catch (error) {
      return null;
    }
  }

  /**
   * Get file statistics
   */
  getFileStats(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const stats = fs.statSync(filePath);
      return {
        size: stats.size,
        lines: content.split('\n').length,
        content: content,
        hash: crypto.createHash('md5').update(content).digest('hex')
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Compare two files for differences
   */
  compareFiles(file1Path, file2Path) {
    const stats1 = this.getFileStats(file1Path);
    const stats2 = this.getFileStats(file2Path);

    if (!stats1 || !stats2) {
      return { identical: false, similarity: 0, differences: ['File read error'] };
    }

    const identical = stats1.hash === stats2.hash;
    
    if (identical) {
      return { identical: true, similarity: 100, differences: [] };
    }

    // Calculate similarity percentage
    const lines1 = stats1.content.split('\n');
    const lines2 = stats2.content.split('\n');
    const maxLines = Math.max(lines1.length, lines2.length);
    let matchingLines = 0;

    for (let i = 0; i < Math.min(lines1.length, lines2.length); i++) {
      if (lines1[i].trim() === lines2[i].trim()) {
        matchingLines++;
      }
    }

    const similarity = Math.round((matchingLines / maxLines) * 100);
    
    // Find key differences
    const differences = [];
    if (stats1.size !== stats2.size) {
      differences.push(`Size difference: ${stats1.size} vs ${stats2.size} bytes`);
    }
    if (stats1.lines !== stats2.lines) {
      differences.push(`Line count difference: ${stats1.lines} vs ${stats2.lines} lines`);
    }

    return { identical, similarity, differences, stats1, stats2 };
  }

  /**
   * Analyze shared directory duplication
   */
  analyzeSharedDuplication() {
    const rootShared = path.join(this.rootDir, 'shared');
    const npmShared = path.join(this.rootDir, 'npm-package', 'shared');

    console.log('🔍 Analyzing shared/ directory duplication...');

    const analysis = {
      type: 'Complete Directory Structure',
      location1: 'shared/',
      location2: 'npm-package/shared/',
      duplicateFiles: [],
      totalSize: 0,
      totalLines: 0,
      riskLevel: 'CRITICAL'
    };

    // Get all files in both shared directories
    const rootFiles = this.getAllFiles(rootShared);
    const npmFiles = this.getAllFiles(npmShared);

    // Compare each file
    for (const rootFile of rootFiles) {
      const relativePath = path.relative(rootShared, rootFile);
      const npmFile = path.join(npmShared, relativePath);

      if (fs.existsSync(npmFile)) {
        const comparison = this.compareFiles(rootFile, npmFile);
        
        analysis.duplicateFiles.push({
          path: relativePath,
          rootPath: rootFile,
          npmPath: npmFile,
          ...comparison
        });

        if (comparison.stats1) {
          analysis.totalSize += comparison.stats1.size;
          analysis.totalLines += comparison.stats1.lines;
        }
      }
    }

    return analysis;
  }

  /**
   * Analyze definitions directory duplication
   */
  analyzeDefinitionsDuplication() {
    const rootDefs = path.join(this.rootDir, 'definitions');
    const npmDefs = path.join(this.rootDir, 'npm-package', 'definitions');

    console.log('🔍 Analyzing definitions/ directory duplication...');

    const analysis = {
      type: 'Complete Directory Structure',
      location1: 'definitions/',
      location2: 'npm-package/definitions/',
      duplicateFiles: [],
      totalSize: 0,
      totalLines: 0,
      riskLevel: 'HIGH'
    };

    const rootFiles = this.getAllFiles(rootDefs);
    const npmFiles = this.getAllFiles(npmDefs);

    for (const rootFile of rootFiles) {
      const relativePath = path.relative(rootDefs, rootFile);
      const npmFile = path.join(npmDefs, relativePath);

      if (fs.existsSync(npmFile)) {
        const comparison = this.compareFiles(rootFile, npmFile);
        
        analysis.duplicateFiles.push({
          path: relativePath,
          rootPath: rootFile,
          npmPath: npmFile,
          ...comparison
        });

        if (comparison.stats1) {
          analysis.totalSize += comparison.stats1.size;
          analysis.totalLines += comparison.stats1.lines;
        }
      }
    }

    return analysis;
  }

  /**
   * Get all files recursively
   */
  getAllFiles(dirPath) {
    const files = [];
    
    if (!fs.existsSync(dirPath)) {
      return files;
    }

    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  /**
   * Analyze behavioral differences in key files
   */
  analyzeBehavioralDifferences() {
    console.log('🔍 Analyzing behavioral differences...');

    const keyFiles = [
      {
        name: 'OpenAI Service',
        root: 'shared/services/openai-service.ts',
        npm: 'npm-package/shared/services/openai-service.ts'
      },
      {
        name: 'Base MCP Handler',
        root: 'shared/core/base-mcp-handler.ts',
        npm: 'npm-package/shared/core/base-mcp-handler.ts'
      },
      {
        name: 'Tool Definitions',
        root: 'shared/core/tool-definitions.ts',
        npm: 'npm-package/shared/core/tool-definitions.ts'
      },
      {
        name: 'Types Index',
        root: 'shared/types/index.ts',
        npm: 'npm-package/shared/types/index.ts'
      }
    ];

    const differences = [];

    for (const fileSet of keyFiles) {
      const rootPath = path.join(this.rootDir, fileSet.root);
      const npmPath = path.join(this.rootDir, fileSet.npm);

      if (fs.existsSync(rootPath) && fs.existsSync(npmPath)) {
        const comparison = this.compareFiles(rootPath, npmPath);
        
        if (!comparison.identical) {
          differences.push({
            component: fileSet.name,
            similarity: comparison.similarity,
            differences: comparison.differences,
            riskLevel: comparison.similarity < 90 ? 'HIGH' : 'MEDIUM'
          });
        }
      }
    }

    return differences;
  }

  /**
   * Assess risks for each duplication area
   */
  assessRisks() {
    console.log('🔍 Assessing duplication risks...');

    return [
      {
        area: 'Shared Directory Structure',
        riskLevel: 'CRITICAL',
        impact: 'Complete dual maintenance required',
        likelihood: 'Guaranteed',
        consequences: [
          'Bug fixes must be applied twice',
          'Feature additions require dual implementation',
          'High chance of behavioral inconsistencies',
          'Maintenance overhead scales with every change'
        ]
      },
      {
        area: 'Definitions Directory Structure',
        riskLevel: 'HIGH',
        impact: 'Tool and resource definitions divergence',
        likelihood: 'High',
        consequences: [
          'Different tool behaviors between deployments',
          'Resource template inconsistencies',
          'Schema validation differences',
          'Build process complications'
        ]
      },
      {
        area: 'Build Scripts',
        riskLevel: 'MEDIUM',
        impact: 'Build process inconsistencies',
        likelihood: 'Medium',
        consequences: [
          'Different build outputs',
          'Deployment pipeline complications',
          'Version synchronization issues'
        ]
      }
    ];
  }

  /**
   * Generate priority ranking for unification
   */
  generatePriorityRanking() {
    return [
      {
        priority: 1,
        area: 'Shared Core Components',
        rationale: 'Critical business logic duplication',
        estimatedEffort: 'High',
        impact: 'Maximum'
      },
      {
        priority: 2,
        area: 'Type Definitions',
        rationale: 'Foundation for all other components',
        estimatedEffort: 'Medium',
        impact: 'High'
      },
      {
        priority: 3,
        area: 'Tool Definitions',
        rationale: 'User-facing functionality consistency',
        estimatedEffort: 'Medium',
        impact: 'High'
      },
      {
        priority: 4,
        area: 'Resource Templates',
        rationale: 'Content consistency across deployments',
        estimatedEffort: 'Low',
        impact: 'Medium'
      },
      {
        priority: 5,
        area: 'Build Scripts',
        rationale: 'Development workflow optimization',
        estimatedEffort: 'Low',
        impact: 'Low'
      }
    ];
  }

  /**
   * Run complete analysis
   */
  async analyze() {
    console.log('🚀 Starting comprehensive duplication analysis...\n');

    // Analyze shared directory duplication
    const sharedAnalysis = this.analyzeSharedDuplication();
    this.results.duplicateStructures.push(sharedAnalysis);

    // Analyze definitions directory duplication
    const definitionsAnalysis = this.analyzeDefinitionsDuplication();
    this.results.duplicateStructures.push(definitionsAnalysis);

    // Analyze behavioral differences
    this.results.behavioralDifferences = this.analyzeBehavioralDifferences();

    // Assess risks
    this.results.riskAssessment = this.assessRisks();

    // Generate priority ranking
    this.results.priorityRanking = this.generatePriorityRanking();

    // Calculate totals
    this.results.totalDuplicateFiles = this.results.duplicateStructures.reduce(
      (sum, struct) => sum + struct.duplicateFiles.length, 0
    );
    this.results.totalDuplicateLines = this.results.duplicateStructures.reduce(
      (sum, struct) => sum + struct.totalLines, 0
    );
    this.results.totalDuplicateSize = this.results.duplicateStructures.reduce(
      (sum, struct) => sum + struct.totalSize, 0
    );

    console.log('✅ Analysis complete!\n');
    return this.results;
  }

  /**
   * Generate detailed report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalDuplicateFiles: this.results.totalDuplicateFiles,
        totalDuplicateLines: this.results.totalDuplicateLines,
        totalDuplicateSize: Math.round(this.results.totalDuplicateSize / 1024) + ' KB',
        maintenanceOverhead: '100% (dual implementation required)'
      },
      duplicateStructures: this.results.duplicateStructures,
      behavioralDifferences: this.results.behavioralDifferences,
      riskAssessment: this.results.riskAssessment,
      priorityRanking: this.results.priorityRanking
    };

    return report;
  }
}

// Run analysis if called directly
if (require.main === module) {
  const analyzer = new DuplicationAnalyzer();
  
  analyzer.analyze().then(() => {
    const report = analyzer.generateReport();
    
    console.log('📊 DUPLICATION ANALYSIS SUMMARY');
    console.log('================================');
    console.log(`Total Duplicate Files: ${report.summary.totalDuplicateFiles}`);
    console.log(`Total Duplicate Lines: ${report.summary.totalDuplicateLines}`);
    console.log(`Total Duplicate Size: ${report.summary.totalDuplicateSize}`);
    console.log(`Maintenance Overhead: ${report.summary.maintenanceOverhead}`);
    console.log('\n✅ Full report will be generated in DUPLICATION-AUDIT-REPORT.md');
    
    // Save detailed results for report generation
    fs.writeFileSync(
      path.join(__dirname, 'duplication-analysis-results.json'),
      JSON.stringify(report, null, 2)
    );
  }).catch(console.error);
}

module.exports = DuplicationAnalyzer;