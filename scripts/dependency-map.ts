/**
 * Dependency Mapping Analysis Tool
 * 
 * This comprehensive tool analyzes import/export relationships across the duplicated
 * codebase to identify dependencies, circular references, and potential unification issues.
 * 
 * Key Features:
 * - Import/export relationship mapping
 * - Circular dependency detection
 * - External dependency analysis
 * - Dependency visualization data generation
 * - Unification impact assessment
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Represents a single import statement
 */
export interface ImportStatement {
  /** The module being imported from */
  from: string;
  /** Named imports */
  named: string[];
  /** Default import name */
  default?: string;
  /** Namespace import name */
  namespace?: string;
  /** Type-only import */
  typeOnly: boolean;
  /** Line number in source file */
  line: number;
  /** Raw import statement */
  raw: string;
}

/**
 * Represents a single export statement
 */
export interface ExportStatement {
  /** Named exports */
  named: string[];
  /** Default export */
  default?: string;
  /** Re-exports from another module */
  from?: string;
  /** Export all from another module */
  all?: boolean;
  /** Type-only export */
  typeOnly: boolean;
  /** Line number in source file */
  line: number;
  /** Raw export statement */
  raw: string;
}

/**
 * Represents a file's dependency information
 */
export interface FileDependencyInfo {
  /** File path relative to project root */
  filePath: string;
  /** Absolute file path */
  absolutePath: string;
  /** File size in bytes */
  size: number;
  /** Number of lines */
  lines: number;
  /** All import statements */
  imports: ImportStatement[];
  /** All export statements */
  exports: ExportStatement[];
  /** Direct dependencies (resolved file paths) */
  dependencies: string[];
  /** Files that depend on this file */
  dependents: string[];
  /** External dependencies (npm packages) */
  externalDependencies: string[];
  /** Whether this file is duplicated */
  isDuplicated: boolean;
  /** Path to duplicate file if exists */
  duplicatePath?: string;
}

/**
 * Represents a circular dependency chain
 */
export interface CircularDependency {
  /** Files involved in the circular dependency */
  files: string[];
  /** Length of the circular chain */
  length: number;
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Description of the circular dependency */
  description: string;
}

/**
 * External dependency usage information
 */
export interface ExternalDependencyUsage {
  /** Package name */
  packageName: string;
  /** Version if available */
  version?: string;
  /** Files that use this dependency */
  usedBy: string[];
  /** Import patterns used */
  importPatterns: string[];
  /** Usage frequency */
  frequency: number;
  /** Whether it's duplicated across deployments */
  isDuplicated: boolean;
}

/**
 * Complete dependency analysis results
 */
export interface DependencyAnalysisResult {
  /** Timestamp of analysis */
  timestamp: string;
  /** All analyzed files */
  files: Map<string, FileDependencyInfo>;
  /** Detected circular dependencies */
  circularDependencies: CircularDependency[];
  /** External dependency usage */
  externalDependencies: Map<string, ExternalDependencyUsage>;
  /** Dependency graph visualization data */
  visualizationData: DependencyVisualizationData;
  /** Summary statistics */
  summary: DependencyAnalysisSummary;
}

/**
 * Visualization data for dependency graphs
 */
export interface DependencyVisualizationData {
  /** Nodes in the dependency graph */
  nodes: Array<{
    id: string;
    label: string;
    type: 'file' | 'external' | 'duplicate';
    size: number;
    group: string;
  }>;
  /** Edges in the dependency graph */
  edges: Array<{
    from: string;
    to: string;
    type: 'import' | 'export' | 'circular';
    weight: number;
  }>;
  /** Clusters for grouping related files */
  clusters: Array<{
    id: string;
    label: string;
    files: string[];
    type: 'shared' | 'definitions' | 'external';
  }>;
}

/**
 * Summary statistics for dependency analysis
 */
export interface DependencyAnalysisSummary {
  /** Total files analyzed */
  totalFiles: number;
  /** Total import statements */
  totalImports: number;
  /** Total export statements */
  totalExports: number;
  /** Number of circular dependencies */
  circularDependencies: number;
  /** Number of external dependencies */
  externalDependencies: number;
  /** Number of duplicated files */
  duplicatedFiles: number;
  /** Average dependencies per file */
  avgDependenciesPerFile: number;
  /** Most connected files */
  mostConnectedFiles: Array<{ file: string; connections: number }>;
  /** Unification complexity score */
  unificationComplexity: number;
}

/**
 * Main dependency mapping analyzer class
 */
export class DependencyMapper {
  private rootDir: string;
  private results: DependencyAnalysisResult;
  private fileExtensions = ['.ts', '.js', '.tsx', '.jsx', '.mts', '.cts'];
  
  constructor(rootDir?: string) {
    this.rootDir = rootDir || path.resolve(__dirname, '../..');
    this.results = {
      timestamp: new Date().toISOString(),
      files: new Map(),
      circularDependencies: [],
      externalDependencies: new Map(),
      visualizationData: { nodes: [], edges: [], clusters: [] },
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
  }

  /**
   * Run complete dependency analysis
   */
  async analyze(): Promise<DependencyAnalysisResult> {
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
    
    // Step 6: Generate visualization data
    this.generateVisualizationData();
    
    // Step 7: Calculate summary statistics
    this.calculateSummary();
    
    console.log('✅ Dependency analysis complete!');
    return this.results;
  }

  /**
   * Discover all relevant files in the project
   */
  private discoverFiles(): string[] {
    const files: string[] = [];
    
    const scanDirectory = (dir: string): void => {
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
  private async analyzeFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(this.rootDir, filePath);
      const stats = fs.statSync(filePath);
      
      const fileInfo: FileDependencyInfo = {
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
      console.warn(`⚠️ Failed to analyze file ${filePath}:`, error);
    }
  }

  /**
   * Parse import statements from file content
   */
  private parseImports(content: string): ImportStatement[] {
    const imports: ImportStatement[] = [];
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
          const importStmt: ImportStatement = {
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
  private parseExports(content: string): ExportStatement[] {
    const exports: ExportStatement[] = [];
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
          const exportStmt: ExportStatement = {
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
  private isDuplicatedFile(relativePath: string): boolean {
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
  private getDuplicatePath(relativePath: string): string | undefined {
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
  private resolveDependencies(): void {
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
  private resolveImportPath(fromFile: string, importPath: string): string | null {
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
  private detectCircularDependencies(): void {
    console.log('🔄 Detecting circular dependencies...');
    
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: CircularDependency[] = [];
    
    const dfs = (file: string, path: string[]): void => {
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
  private calculateCycleSeverity(cycle: string[]): 'low' | 'medium' | 'high' | 'critical' {
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
  private analyzeExternalDependencies(): void {
    console.log('📦 Analyzing external dependencies...');
    
    const externalDeps = new Map<string, ExternalDependencyUsage>();
    
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
        
        const depInfo = externalDeps.get(packageName)!;
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
   * Generate visualization data for dependency graphs
   */
  private generateVisualizationData(): void {
    console.log('📊 Generating visualization data...');
    
    const nodes: DependencyVisualizationData['nodes'] = [];
    const edges: DependencyVisualizationData['edges'] = [];
    const clusters: DependencyVisualizationData['clusters'] = [];
    
    // Create nodes for each file
    for (const [filePath, fileInfo] of this.results.files) {
      nodes.push({
        id: filePath,
        label: path.basename(filePath),
        type: fileInfo.isDuplicated ? 'duplicate' : 'file',
        size: fileInfo.dependencies.length + fileInfo.dependents.length,
        group: this.getFileGroup(filePath)
      });
    }
    
    // Create edges for dependencies
    for (const [filePath, fileInfo] of this.results.files) {
      for (const dependency of fileInfo.dependencies) {
        edges.push({
          from: filePath,
          to: dependency,
          type: 'import',
          weight: 1
        });
      }
    }
    
    // Add circular dependency edges
    for (const cycle of this.results.circularDependencies) {
      for (let i = 0; i < cycle.files.length - 1; i++) {
        edges.push({
          from: cycle.files[i],
          to: cycle.files[i + 1],
          type: 'circular',
          weight: 2
        });
      }
    }
    
    // Create clusters
    clusters.push({
      id: 'shared',
      label: 'Shared Components',
      files: Array.from(this.results.files.keys()).filter(f => f.startsWith('shared/')),
      type: 'shared'
    });
    
    clusters.push({
      id: 'definitions',
      label: 'Definitions',
      files: Array.from(this.results.files.keys()).filter(f => f.startsWith('definitions/')),
      type: 'definitions'
    });
    
    this.results.visualizationData = { nodes, edges, clusters };
  }

  /**
   * Get the group/category for a file
   */
  private getFileGroup(filePath: string): string {
    if (filePath.startsWith('shared/core/')) return 'core';
    if (filePath.startsWith('shared/types/')) return 'types';
    if (filePath.startsWith('shared/services/')) return 'services';
    if (filePath.startsWith('shared/handlers/')) return 'handlers';
    if (filePath.startsWith('definitions/')) return 'definitions';
    if (filePath.startsWith('npm-package/')) return 'npm-package';
    return 'other';
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(): void {
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
  async exportResults(outputPath?: string): Promise<void> {
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
  generateReport(): string {
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
    
    return report;
  }
}

/**
 * CLI interface for running dependency analysis
 */
export async function runDependencyAnalysis(rootDir?: string): Promise<DependencyAnalysisResult> {
  const mapper = new DependencyMapper(rootDir);
  const results = await mapper.analyze();
  
  // Export results
  await mapper.exportResults();
  
  // Generate and save report
  const report = mapper.generateReport();
  const reportPath = path.join(mapper['rootDir'], 'DEPENDENCY-ANALYSIS-REPORT.md');
  fs.writeFileSync(reportPath, report);
  
  console.log(`📊 Analysis complete! Report saved to: ${reportPath}`);
  return results;
}

// Run analysis if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDependencyAnalysis().catch(console.error);
}