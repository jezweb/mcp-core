#!/usr/bin/env node

/**
 * Dependency Mapping Analysis Tool (CommonJS Version)
 * 
 * This comprehensive tool analyzes import/export relationships across the duplicated
 * codebase to identify dependencies, circular references, and potential unification issues.
 */

const fs = require('fs');
const path = require('path');

class DependencyMapper {
  constructor(rootDir) {
    this.rootDir = rootDir || path.resolve(__dirname, '..');
    this.results = {
      timestamp: new Date().toISOString(),
      files: new Map(),
      circularDependencies: [],
      externalDependencies: new Map(),
      summary: {
        totalFiles: 0,
        totalImports: 0,
        totalExports: 0,
        circularDependencies: 0,
        externalDependencies: 0,
        duplicatedFiles: 0,
        avgDependenciesPerFile: 0,
        mostConnectedFiles: [],
        unificationComplexity: 0
      }
    };
    this.fileExtensions = ['.ts', '.js', '.tsx', '.jsx', '.mts', '.cts'];
  }

  /**
   * Run complete dependency analysis
   */
  async analyze() {
    console.log('🔍 Starting comprehensive dependency analysis...');
    
    // Step 1: Discover all TypeScript/JavaScript files
    const allFiles = this.discoverFiles();
    console.log(`📁 Found ${allFiles.length} files to analyze`);
    
    // Step 2: Parse each file for imports/exports
    for (const filePath of allFiles) {
      await this.analyzeFile(filePath);
    }
    
    // Step 3: Resolve dependencies
    this.resolveDependencies();
    
    // Step 4: Detect circular dependencies
    this.detectCircularDependencies();
    
    // Step 5: Analyze external dependencies
    this.analyzeExternalDependencies();
    
    // Step 6: Calculate summary statistics
    this.calculateSummary();
    
    console.log('✅ Dependency analysis complete!');
    return this.results;
  }

  /**
   * Discover all relevant files in the project
   */
  discoverFiles() {
    const files = [];
    
    const scanDirectory = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip node_modules and other irrelevant directories
          if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
            scanDirectory(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (this.fileExtensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };
    
    scanDirectory(this.rootDir);
    return files;
  }

  /**
   * Analyze a single file for imports and exports
   */
  async analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(this.rootDir, filePath);
      const stats = fs.statSync(filePath);
      
      const fileInfo = {
        filePath: relativePath,
        absolutePath: filePath,
        size: stats.size,
        lines: content.split('\n').length,
        imports: this.parseImports(content),
        exports: this.parseExports(content),
        dependencies: [],
        dependents: [],
        externalDependencies: [],
        isDuplicated: this.isDuplicatedFile(relativePath),
        duplicatePath: this.getDuplicatePath(relativePath)
      };
      
      this.results.files.set(relativePath, fileInfo);
    } catch (error) {
      console.warn(`⚠️ Failed to analyze file ${filePath}:`, error.message);
    }
  }

  /**
   * Parse import statements from file content
   */
  parseImports(content) {
    const imports = [];
    const lines = content.split('\n');
    
    // Regex patterns for different import types
    const importPatterns = [
      // import { named } from 'module'
      /^import\s*(?:(type)\s+)?\{\s*([^}]+)\s*\}\s*from\s*['"`]([^'"`]+)['"`]/,
      // import defaultName from 'module'
      /^import\s*(?:(type)\s+)?(\w+)\s*from\s*['"`]([^'"`]+)['"`]/,
      // import * as namespace from 'module'
      /^import\s*(?:(type)\s+)?\*\s*as\s+(\w+)\s*from\s*['"`]([^'"`]+)['"`]/,
      // import 'module' (side effect)
      /^import\s*['"`]([^'"`]+)['"`]/,
      // Mixed imports: import defaultName, { named } from 'module'
      /^import\s*(?:(type)\s+)?(\w+),\s*\{\s*([^}]+)\s*\}\s*from\s*['"`]([^'"`]+)['"`]/
    ];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine.startsWith('import')) return;
      
      for (const pattern of importPatterns) {
        const match = trimmedLine.match(pattern);
        if (match) {
          const importStmt = {
            from: '',
            named: [],
            typeOnly: false,
            line: index + 1,
            raw: trimmedLine
          };
          
          // Handle different import patterns
          if (pattern === importPatterns[0]) { // Named imports
            importStmt.typeOnly = !!match[1];
            importStmt.named = match[2].split(',').map(s => s.trim());
            importStmt.from = match[3];
          } else if (pattern === importPatterns[1]) { // Default import
            importStmt.typeOnly = !!match[1];
            importStmt.default = match[2];
            importStmt.from = match[3];
          } else if (pattern === importPatterns[2]) { // Namespace import
            importStmt.typeOnly = !!match[1];
            importStmt.namespace = match[2];
            importStmt.from = match[3];
          } else if (pattern === importPatterns[3]) { // Side effect import
            importStmt.from = match[1];
          } else if (pattern === importPatterns[4]) { // Mixed import
            importStmt.typeOnly = !!match[1];
            importStmt.default = match[2];
            importStmt.named = match[3].split(',').map(s => s.trim());
            importStmt.from = match[4];
          }
          
          imports.push(importStmt);
          break;
        }
      }
    });
    
    return imports;
  }

  /**
   * Parse export statements from file content
   */
  parseExports(content) {
    const exports = [];
    const lines = content.split('\n');
    
    // Regex patterns for different export types
    const exportPatterns = [
      // export { named } from 'module'
      /^export\s*(?:(type)\s+)?\{\s*([^}]+)\s*\}\s*from\s*['"`]([^'"`]+)['"`]/,
      // export { named }
      /^export\s*(?:(type)\s+)?\{\s*([^}]+)\s*\}/,
      // export default
      /^export\s+default\s+/,
      // export * from 'module'
      /^export\s*\*\s*from\s*['"`]([^'"`]+)['"`]/,
      // export const/let/var/function/class
      /^export\s+(?:(type)\s+)?(const|let|var|function|class|interface|enum)\s+(\w+)/
    ];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine.startsWith('export')) return;
      
      for (const pattern of exportPatterns) {
        const match = trimmedLine.match(pattern);
        if (match) {
          const exportStmt = {
            named: [],
            typeOnly: false,
            line: index + 1,
            raw: trimmedLine
          };
          
          // Handle different export patterns
          if (pattern === exportPatterns[0]) { // Named exports from module
            exportStmt.typeOnly = !!match[1];
            exportStmt.named = match[2].split(',').map(s => s.trim());
            exportStmt.from = match[3];
          } else if (pattern === exportPatterns[1]) { // Named exports
            exportStmt.typeOnly = !!match[1];
            exportStmt.named = match[2].split(',').map(s => s.trim());
          } else if (pattern === exportPatterns[2]) { // Default export
            exportStmt.default = 'default';
          } else if (pattern === exportPatterns[3]) { // Export all from module
            exportStmt.all = true;
            exportStmt.from = match[1];
          } else if (pattern === exportPatterns[4]) { // Export declaration
            exportStmt.typeOnly = !!match[1];
            exportStmt.named = [match[3]];
          }
          
          exports.push(exportStmt);
          break;
        }
      }
    });
    
    return exports;
  }

  /**
   * Check if a file is duplicated
   */
  isDuplicatedFile(relativePath) {
    // Check if file exists in both shared/ and npm-package/shared/
    if (relativePath.startsWith('shared/')) {
      const npmPath = path.join('npm-package', relativePath);
      return fs.existsSync(path.join(this.rootDir, npmPath));
    }
    
    // Check if file exists in both definitions/ and npm-package/definitions/
    if (relativePath.startsWith('definitions/')) {
      const npmPath = path.join('npm-package', relativePath);
      return fs.existsSync(path.join(this.rootDir, npmPath));
    }
    
    return false;
  }

  /**
   * Get the duplicate path for a file
   */
  getDuplicatePath(relativePath) {
    if (relativePath.startsWith('shared/')) {
      return path.join('npm-package', relativePath);
    }
    
    if (relativePath.startsWith('definitions/')) {
      return path.join('npm-package', relativePath);
    }
    
    if (relativePath.startsWith('npm-package/shared/')) {
      return relativePath.replace('npm-package/', '');
    }
    
    if (relativePath.startsWith('npm-package/definitions/')) {
      return relativePath.replace('npm-package/', '');
    }
    
    return undefined;
  }

  /**
   * Resolve dependencies between files
   */
  resolveDependencies() {
    console.log('🔗 Resolving file dependencies...');
    
    for (const [filePath, fileInfo] of this.results.files) {
      for (const importStmt of fileInfo.imports) {
        const resolvedPath = this.resolveImportPath(filePath, importStmt.from);
        
        if (resolvedPath) {
          // Internal dependency
          fileInfo.dependencies.push(resolvedPath);
          
          // Add this file as a dependent of the imported file
          const importedFile = this.results.files.get(resolvedPath);
          if (importedFile) {
            importedFile.dependents.push(filePath);
          }
        } else if (!importStmt.from.startsWith('.')) {
          // External dependency
          fileInfo.externalDependencies.push(importStmt.from);
        }
      }
    }
  }

  /**
   * Resolve import path to actual file path
   */
  resolveImportPath(fromFile, importPath) {
    if (!importPath.startsWith('.')) {
      return null; // External dependency
    }
    
    const fromDir = path.dirname(fromFile);
    const resolvedPath = path.resolve(fromDir, importPath);
    const relativePath = path.relative(this.rootDir, resolvedPath);
    
    // Try different extensions
    for (const ext of this.fileExtensions) {
      const pathWithExt = relativePath + ext;
      if (this.results.files.has(pathWithExt)) {
        return pathWithExt;
      }
      
      // Try index files
      const indexPath = path.join(relativePath, 'index' + ext);
      if (this.results.files.has(indexPath)) {
        return indexPath;
      }
    }
    
    return null;
  }

  /**
   * Detect circular dependencies
   */
  detectCircularDependencies() {
    console.log('🔄 Detecting circular dependencies...');
    
    const visited = new Set();
    const recursionStack = new Set();
    const cycles = [];
    
    const dfs = (file, path) => {
      if (recursionStack.has(file)) {
        // Found a cycle
        const cycleStart = path.indexOf(file);
        const cycle = path.slice(cycleStart).concat([file]);
        
        cycles.push({
          files: cycle,
          length: cycle.length - 1,
          severity: this.calculateCycleSeverity(cycle),
          description: `Circular dependency: ${cycle.join(' → ')}`
        });
        return;
      }
      
      if (visited.has(file)) {
        return;
      }
      
      visited.add(file);
      recursionStack.add(file);
      
      const fileInfo = this.results.files.get(file);
      if (fileInfo) {
        for (const dependency of fileInfo.dependencies) {
          dfs(dependency, [...path, file]);
        }
      }
      
      recursionStack.delete(file);
    };
    
    for (const filePath of this.results.files.keys()) {
      if (!visited.has(filePath)) {
        dfs(filePath, []);
      }
    }
    
    this.results.circularDependencies = cycles;
  }

  /**
   * Calculate severity of a circular dependency
   */
  calculateCycleSeverity(cycle) {
    const length = cycle.length - 1;
    const hasDuplicates = cycle.some(file => this.results.files.get(file)?.isDuplicated);
    
    if (length <= 2 && !hasDuplicates) return 'low';
    if (length <= 3 && !hasDuplicates) return 'medium';
    if (length > 3 || hasDuplicates) return 'high';
    if (length > 5 && hasDuplicates) return 'critical';
    
    return 'medium';
  }

  /**
   * Analyze external dependencies
   */
  analyzeExternalDependencies() {
    console.log('📦 Analyzing external dependencies...');
    
    const externalDeps = new Map();
    
    for (const [filePath, fileInfo] of this.results.files) {
      for (const extDep of fileInfo.externalDependencies) {
        const packageName = extDep.split('/')[0];
        
        if (!externalDeps.has(packageName)) {
          externalDeps.set(packageName, {
            packageName,
            usedBy: [],
            importPatterns: [],
            frequency: 0,
            isDuplicated: false
          });
        }
        
        const depInfo = externalDeps.get(packageName);
        depInfo.usedBy.push(filePath);
        depInfo.frequency++;
        
        if (!depInfo.importPatterns.includes(extDep)) {
          depInfo.importPatterns.push(extDep);
        }
        
        // Check if this dependency is used in both deployment targets
        const isDuplicatedUsage = depInfo.usedBy.some(file => file.startsWith('shared/')) &&
                                 depInfo.usedBy.some(file => file.startsWith('npm-package/shared/'));
        depInfo.isDuplicated = isDuplicatedUsage;
      }
    }
    
    this.results.externalDependencies = externalDeps;
  }

  /**
   * Calculate summary statistics
   */
  calculateSummary() {
    console.log('📈 Calculating summary statistics...');
    
    const totalFiles = this.results.files.size;
    const totalImports = Array.from(this.results.files.values())
      .reduce((sum, file) => sum + file.imports.length, 0);
    const totalExports = Array.from(this.results.files.values())
      .reduce((sum, file) => sum + file.exports.length, 0);
    const duplicatedFiles = Array.from(this.results.files.values())
      .filter(file => file.isDuplicated).length;
    
    // Calculate most connected files
    const connectionCounts = Array.from(this.results.files.entries())
      .map(([filePath, fileInfo]) => ({
        file: filePath,
        connections: fileInfo.dependencies.length + fileInfo.dependents.length
      }))
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 10);
    
    // Calculate unification complexity score
    const complexityFactors = {
      circularDependencies: this.results.circularDependencies.length * 10,
      duplicatedFiles: duplicatedFiles * 5,
      externalDependencies: this.results.externalDependencies.size * 2,
      avgConnections: totalFiles > 0 ? (totalImports + totalExports) / totalFiles : 0
    };
    
    const unificationComplexity = Object.values(complexityFactors)
      .reduce((sum, factor) => sum + factor, 0);
    
    this.results.summary = {
      totalFiles,
      totalImports,
      totalExports,
      circularDependencies: this.results.circularDependencies.length,
      externalDependencies: this.results.externalDependencies.size,
      duplicatedFiles,
      avgDependenciesPerFile: totalFiles > 0 ? totalImports / totalFiles : 0,
      mostConnectedFiles: connectionCounts,
      unificationComplexity: Math.round(unificationComplexity)
    };
  }

  /**
   * Export analysis results to JSON file
   */
  async exportResults(outputPath) {
    const output = outputPath || path.join(this.rootDir, 'dependency-analysis-results.json');
    
    // Convert Map objects to plain objects for JSON serialization
    const exportData = {
      ...this.results,
      files: Object.fromEntries(this.results.files),
      externalDependencies: Object.fromEntries(this.results.externalDependencies)
    };
    
    fs.writeFileSync(output, JSON.stringify(exportData, null, 2));
    console.log(`📄 Results exported to: ${output}`);
  }

  /**
   * Generate a human-readable report
   */
  generateReport() {
    const { summary } = this.results;
    
    let report = `# Dependency Analysis Report\n\n`;
    report += `**Generated:** ${this.results.timestamp}\n\n`;
    
    report += `## Summary Statistics\n\n`;
    report += `- **Total Files:** ${summary.totalFiles}\n`;
    report += `- **Total Imports:** ${summary.totalImports}\n`;
    report += `- **Total Exports:** ${summary.totalExports}\n`;
    report += `- **Circular Dependencies:** ${summary.circularDependencies}\n`;
    report += `- **External Dependencies:** ${summary.externalDependencies}\n`;
    report += `- **Duplicated Files:** ${summary.duplicatedFiles}\n`;
    report += `- **Avg Dependencies/File:** ${summary.avgDependenciesPerFile.toFixed(2)}\n`;
    report += `- **Unification Complexity:** ${summary.unificationComplexity}\n\n`;
    
    if (this.results.circularDependencies.length > 0) {
      report += `## Circular Dependencies\n\n`;
      for (const cycle of this.results.circularDependencies) {
        report += `### ${cycle.severity.toUpperCase()} - Length ${cycle.length}\n`;
        report += `${cycle.description}\n\n`;
      }
    }
    
    report += `## Most Connected Files\n\n`;
    for (const file of summary.mostConnectedFiles.slice(0, 5)) {
      report += `- **${file.file}**: ${file.connections} connections\n`;
    }
    
    report += `\n## External Dependencies\n\n`;
    const sortedExternalDeps = Array.from(this.results.externalDependencies.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
    
    for (const dep of sortedExternalDeps) {
      report += `- **${dep.packageName}**: Used ${dep.frequency} times`;
      if (dep.isDuplicated) {
        report += ` (DUPLICATED)`;
      }
      report += `\n`;
    }
    
    return report;
  }
}

/**
 * CLI interface for running dependency analysis
 */
async function runDependencyAnalysis(rootDir) {
  const mapper = new DependencyMapper(rootDir);
  const results = await mapper.analyze();
  
  // Export results
  await mapper.exportResults();
  
  // Generate and save report
  const report = mapper.generateReport();
  const reportPath = path.join(mapper.rootDir, 'DEPENDENCY-ANALYSIS-REPORT.md');
  fs.writeFileSync(reportPath, report);
  
  console.log(`📊 Analysis complete! Report saved to: ${reportPath}`);
  return results;
}

// Run analysis if called directly
if (require.main === module) {
  runDependencyAnalysis().catch(console.error);
}

module.exports = { DependencyMapper, runDependencyAnalysis };