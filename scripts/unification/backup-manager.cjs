#!/usr/bin/env node

/**
 * Backup Manager
 * 
 * Comprehensive backup management system for the unification process.
 * Handles full backups, incremental backups, and backup validation.
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { performance } = require('perf_hooks');

class BackupManager {
    constructor(options = {}) {
        this.options = {
            backupRoot: options.backupRoot || path.join(__dirname, 'backup'),
            projectRoot: options.projectRoot || path.join(__dirname, '../..'),
            compressionLevel: options.compressionLevel || 6,
            validateBackups: options.validateBackups !== false,
            maxBackups: options.maxBackups || 10,
            verbose: options.verbose || false,
            ...options
        };

        this.backupMetadata = {
            version: '1.0.0',
            created: new Date().toISOString(),
            backups: []
        };
    }

    /**
     * Create a complete full backup of the project
     */
    async createFullBackup(backupName = null) {
        const startTime = performance.now();
        backupName = backupName || `full-backup-${Date.now()}`;
        
        this.log(`🔄 Creating full backup: ${backupName}`);

        try {
            // Ensure backup directories exist
            await this.ensureBackupDirectories();

            // Create backup paths
            const backupPath = path.join(this.options.backupRoot, 'pre-unification', backupName);
            const metadataPath = path.join(this.options.backupRoot, 'metadata', `${backupName}.json`);

            await fs.mkdir(backupPath, { recursive: true });
            await fs.mkdir(path.dirname(metadataPath), { recursive: true });

            // Collect backup metadata
            const metadata = await this.collectBackupMetadata(backupName, 'full');

            // Copy project files
            await this.copyProjectFiles(backupPath);

            // Create Git backup
            await this.createGitBackup(backupPath);

            // Backup dependencies
            await this.backupDependencies(backupPath);

            // Create file manifest
            const manifest = await this.createFileManifest(backupPath);
            metadata.manifest = manifest;

            // Calculate backup size and checksums
            metadata.size = await this.calculateBackupSize(backupPath);
            metadata.checksums = await this.calculateChecksums(backupPath);

            // Save metadata
            await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

            // Update backup registry
            await this.updateBackupRegistry(metadata);

            const duration = performance.now() - startTime;
            this.log(`✅ Full backup created successfully in ${duration.toFixed(2)}ms`);
            this.log(`   Backup path: ${backupPath}`);
            this.log(`   Backup size: ${this.formatBytes(metadata.size)}`);
            this.log(`   Files backed up: ${manifest.fileCount}`);

            return {
                success: true,
                backupName,
                backupPath,
                metadata,
                duration
            };

        } catch (error) {
            this.log(`❌ Full backup failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create an incremental backup (checkpoint)
     */
    async createIncrementalBackup(checkpointName, baseBackup = null) {
        const startTime = performance.now();
        
        this.log(`🔄 Creating incremental backup: ${checkpointName}`);

        try {
            // Ensure backup directories exist
            await this.ensureBackupDirectories();

            // Create backup paths
            const backupPath = path.join(this.options.backupRoot, 'checkpoints', checkpointName);
            const metadataPath = path.join(this.options.backupRoot, 'metadata', `${checkpointName}.json`);

            await fs.mkdir(backupPath, { recursive: true });
            await fs.mkdir(path.dirname(metadataPath), { recursive: true });

            // Collect backup metadata
            const metadata = await this.collectBackupMetadata(checkpointName, 'incremental');
            metadata.baseBackup = baseBackup;

            // Get changed files since base backup
            const changedFiles = await this.getChangedFiles(baseBackup);
            
            // Copy only changed files
            await this.copyChangedFiles(backupPath, changedFiles);

            // Create incremental manifest
            const manifest = await this.createIncrementalManifest(backupPath, changedFiles);
            metadata.manifest = manifest;

            // Calculate backup size and checksums
            metadata.size = await this.calculateBackupSize(backupPath);
            metadata.checksums = await this.calculateChecksums(backupPath);

            // Save metadata
            await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

            // Update backup registry
            await this.updateBackupRegistry(metadata);

            const duration = performance.now() - startTime;
            this.log(`✅ Incremental backup created successfully in ${duration.toFixed(2)}ms`);
            this.log(`   Backup path: ${backupPath}`);
            this.log(`   Changed files: ${changedFiles.length}`);

            return {
                success: true,
                backupName: checkpointName,
                backupPath,
                metadata,
                changedFiles,
                duration
            };

        } catch (error) {
            this.log(`❌ Incremental backup failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validate backup integrity
     */
    async validateBackup(backupName) {
        this.log(`🔍 Validating backup: ${backupName}`);

        try {
            // Load backup metadata
            const metadataPath = path.join(this.options.backupRoot, 'metadata', `${backupName}.json`);
            const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));

            // Validate backup path exists
            const backupPath = metadata.type === 'full' 
                ? path.join(this.options.backupRoot, 'pre-unification', backupName)
                : path.join(this.options.backupRoot, 'checkpoints', backupName);

            await fs.access(backupPath);

            // Validate file checksums
            const currentChecksums = await this.calculateChecksums(backupPath);
            const checksumValidation = this.validateChecksums(metadata.checksums, currentChecksums);

            // Validate file manifest
            const currentManifest = await this.createFileManifest(backupPath);
            const manifestValidation = this.validateManifest(metadata.manifest, currentManifest);

            // Validate backup size
            const currentSize = await this.calculateBackupSize(backupPath);
            const sizeValidation = Math.abs(currentSize - metadata.size) < 1024; // Allow 1KB difference

            const isValid = checksumValidation.valid && manifestValidation.valid && sizeValidation;

            this.log(`${isValid ? '✅' : '❌'} Backup validation ${isValid ? 'passed' : 'failed'}`);
            
            if (!isValid) {
                this.log(`   Checksum validation: ${checksumValidation.valid ? 'PASS' : 'FAIL'}`);
                this.log(`   Manifest validation: ${manifestValidation.valid ? 'PASS' : 'FAIL'}`);
                this.log(`   Size validation: ${sizeValidation ? 'PASS' : 'FAIL'}`);
            }

            return {
                valid: isValid,
                backupName,
                checksumValidation,
                manifestValidation,
                sizeValidation,
                metadata
            };

        } catch (error) {
            this.log(`❌ Backup validation failed: ${error.message}`);
            return {
                valid: false,
                error: error.message
            };
        }
    }

    /**
     * List all available backups
     */
    async listBackups() {
        try {
            const registryPath = path.join(this.options.backupRoot, 'backup-registry.json');
            
            try {
                const registry = JSON.parse(await fs.readFile(registryPath, 'utf8'));
                return registry.backups.sort((a, b) => new Date(b.created) - new Date(a.created));
            } catch (error) {
                // Registry doesn't exist, scan directories
                return await this.scanBackupDirectories();
            }

        } catch (error) {
            this.log(`❌ Failed to list backups: ${error.message}`);
            return [];
        }
    }

    /**
     * Clean up old backups based on retention policy
     */
    async cleanupBackups() {
        this.log('🧹 Cleaning up old backups...');

        try {
            const backups = await this.listBackups();
            const backupsToDelete = backups.slice(this.options.maxBackups);

            for (const backup of backupsToDelete) {
                await this.deleteBackup(backup.name);
            }

            this.log(`✅ Cleaned up ${backupsToDelete.length} old backups`);
            return { deleted: backupsToDelete.length };

        } catch (error) {
            this.log(`❌ Backup cleanup failed: ${error.message}`);
            throw error;
        }
    }

    // Private helper methods

    async ensureBackupDirectories() {
        const dirs = [
            path.join(this.options.backupRoot, 'pre-unification'),
            path.join(this.options.backupRoot, 'checkpoints'),
            path.join(this.options.backupRoot, 'metadata')
        ];

        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    async collectBackupMetadata(name, type) {
        return {
            name,
            type,
            created: new Date().toISOString(),
            projectRoot: this.options.projectRoot,
            gitCommit: await this.getCurrentGitCommit(),
            gitBranch: await this.getCurrentGitBranch(),
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch
        };
    }

    async copyProjectFiles(backupPath) {
        const excludePatterns = [
            'node_modules',
            '.git',
            'dist',
            'build',
            '*.log',
            '.DS_Store',
            'backup',
            'reports'
        ];

        // Use rsync for efficient copying with exclusions
        const excludeArgs = excludePatterns.map(pattern => `--exclude=${pattern}`).join(' ');
        const command = `rsync -av ${excludeArgs} ${this.options.projectRoot}/ ${backupPath}/`;
        
        execSync(command, { stdio: this.options.verbose ? 'inherit' : 'pipe' });
    }

    async createGitBackup(backupPath) {
        try {
            const gitBackupPath = path.join(backupPath, '.git-backup');
            await fs.mkdir(gitBackupPath, { recursive: true });

            // Create git bundle
            const bundlePath = path.join(gitBackupPath, 'repository.bundle');
            execSync(`git bundle create ${bundlePath} --all`, { 
                cwd: this.options.projectRoot,
                stdio: this.options.verbose ? 'inherit' : 'pipe'
            });

            // Save git status and log
            const gitStatus = execSync('git status --porcelain', { 
                cwd: this.options.projectRoot,
                encoding: 'utf8'
            });
            
            const gitLog = execSync('git log --oneline -10', { 
                cwd: this.options.projectRoot,
                encoding: 'utf8'
            });

            await fs.writeFile(path.join(gitBackupPath, 'status.txt'), gitStatus);
            await fs.writeFile(path.join(gitBackupPath, 'log.txt'), gitLog);

        } catch (error) {
            this.log(`⚠️  Git backup failed: ${error.message}`);
        }
    }

    async backupDependencies(backupPath) {
        const depBackupPath = path.join(backupPath, '.dependencies-backup');
        await fs.mkdir(depBackupPath, { recursive: true });

        // Copy package files
        const packageFiles = ['package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
        
        for (const file of packageFiles) {
            const srcPath = path.join(this.options.projectRoot, file);
            const destPath = path.join(depBackupPath, file);
            
            try {
                await fs.copyFile(srcPath, destPath);
            } catch (error) {
                // File doesn't exist, skip
            }
        }
    }

    async createFileManifest(backupPath) {
        const manifest = {
            fileCount: 0,
            totalSize: 0,
            files: []
        };

        const walkDir = async (dir, relativePath = '') => {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relPath = path.join(relativePath, entry.name);
                
                if (entry.isDirectory()) {
                    await walkDir(fullPath, relPath);
                } else {
                    const stats = await fs.stat(fullPath);
                    manifest.files.push({
                        path: relPath,
                        size: stats.size,
                        modified: stats.mtime.toISOString()
                    });
                    manifest.fileCount++;
                    manifest.totalSize += stats.size;
                }
            }
        };

        await walkDir(backupPath);
        return manifest;
    }

    async calculateBackupSize(backupPath) {
        let totalSize = 0;
        
        const walkDir = async (dir) => {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory()) {
                    await walkDir(fullPath);
                } else {
                    const stats = await fs.stat(fullPath);
                    totalSize += stats.size;
                }
            }
        };

        await walkDir(backupPath);
        return totalSize;
    }

    async calculateChecksums(backupPath) {
        const checksums = {};
        
        const walkDir = async (dir, relativePath = '') => {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relPath = path.join(relativePath, entry.name);
                
                if (entry.isDirectory()) {
                    await walkDir(fullPath, relPath);
                } else {
                    const content = await fs.readFile(fullPath);
                    const hash = crypto.createHash('sha256').update(content).digest('hex');
                    checksums[relPath] = hash;
                }
            }
        };

        await walkDir(backupPath);
        return checksums;
    }

    async updateBackupRegistry(metadata) {
        const registryPath = path.join(this.options.backupRoot, 'backup-registry.json');
        
        let registry;
        try {
            registry = JSON.parse(await fs.readFile(registryPath, 'utf8'));
        } catch (error) {
            registry = { version: '1.0.0', backups: [] };
        }

        registry.backups.push(metadata);
        registry.lastUpdated = new Date().toISOString();

        await fs.writeFile(registryPath, JSON.stringify(registry, null, 2));
    }

    async getCurrentGitCommit() {
        try {
            return execSync('git rev-parse HEAD', { 
                cwd: this.options.projectRoot,
                encoding: 'utf8'
            }).trim();
        } catch (error) {
            return 'unknown';
        }
    }

    async getCurrentGitBranch() {
        try {
            return execSync('git branch --show-current', { 
                cwd: this.options.projectRoot,
                encoding: 'utf8'
            }).trim();
        } catch (error) {
            return 'unknown';
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    validateChecksums(original, current) {
        const originalKeys = Object.keys(original);
        const currentKeys = Object.keys(current);
        
        const missing = originalKeys.filter(key => !currentKeys.includes(key));
        const extra = currentKeys.filter(key => !originalKeys.includes(key));
        const modified = originalKeys.filter(key => 
            currentKeys.includes(key) && original[key] !== current[key]
        );

        return {
            valid: missing.length === 0 && extra.length === 0 && modified.length === 0,
            missing,
            extra,
            modified
        };
    }

    validateManifest(original, current) {
        return {
            valid: original.fileCount === current.fileCount && 
                   Math.abs(original.totalSize - current.totalSize) < 1024
        };
    }

    async scanBackupDirectories() {
        const backups = [];
        
        try {
            // Scan pre-unification backups
            const fullBackupDir = path.join(this.options.backupRoot, 'pre-unification');
            try {
                const fullBackups = await fs.readdir(fullBackupDir);
                for (const backup of fullBackups) {
                    backups.push({
                        name: backup,
                        type: 'full',
                        created: 'unknown',
                        path: path.join(fullBackupDir, backup)
                    });
                }
            } catch (error) {
                // Directory doesn't exist
            }

            // Scan checkpoint backups
            const checkpointDir = path.join(this.options.backupRoot, 'checkpoints');
            try {
                const checkpointBackups = await fs.readdir(checkpointDir);
                for (const backup of checkpointBackups) {
                    backups.push({
                        name: backup,
                        type: 'incremental',
                        created: 'unknown',
                        path: path.join(checkpointDir, backup)
                    });
                }
            } catch (error) {
                // Directory doesn't exist
            }

        } catch (error) {
            this.log(`⚠️  Error scanning backup directories: ${error.message}`);
        }

        return backups;
    }

    async getChangedFiles(baseBackup) {
        // For now, return empty array - in real implementation, this would
        // compare current state with base backup to find changed files
        return [];
    }

    async copyChangedFiles(backupPath, changedFiles) {
        // Copy only the changed files to the backup path
        for (const file of changedFiles) {
            const srcPath = path.join(this.options.projectRoot, file);
            const destPath = path.join(backupPath, file);
            
            try {
                await fs.mkdir(path.dirname(destPath), { recursive: true });
                await fs.copyFile(srcPath, destPath);
            } catch (error) {
                this.log(`⚠️  Failed to copy ${file}: ${error.message}`);
            }
        }
    }

    async createIncrementalManifest(backupPath, changedFiles) {
        return {
            type: 'incremental',
            fileCount: changedFiles.length,
            changedFiles,
            totalSize: await this.calculateBackupSize(backupPath)
        };
    }

    async deleteBackup(backupName) {
        try {
            // Try to find and delete the backup
            const backups = await this.listBackups();
            const backup = backups.find(b => b.name === backupName);
            
            if (backup) {
                const backupPath = backup.type === 'full'
                    ? path.join(this.options.backupRoot, 'pre-unification', backupName)
                    : path.join(this.options.backupRoot, 'checkpoints', backupName);
                
                await fs.rm(backupPath, { recursive: true, force: true });
                
                // Remove metadata
                const metadataPath = path.join(this.options.backupRoot, 'metadata', `${backupName}.json`);
                try {
                    await fs.unlink(metadataPath);
                } catch (error) {
                    // Metadata file doesn't exist
                }
                
                this.log(`✅ Deleted backup: ${backupName}`);
            }
        } catch (error) {
            this.log(`❌ Failed to delete backup ${backupName}: ${error.message}`);
        }
    }

    log(message) {
        if (this.options.verbose || process.env.NODE_ENV !== 'test') {
            console.log(message);
        }
    }
}

// CLI execution
if (require.main === module) {
    const args = process.argv.slice(2);
    const backupManager = new BackupManager({ verbose: true });

    async function main() {
        try {
            if (args.includes('--create-full-backup')) {
                const backupName = args.find(arg => arg.startsWith('--name='))?.split('=')[1];
                await backupManager.createFullBackup(backupName);
            } else if (args.includes('--create-checkpoint')) {
                const checkpointName = args.find(arg => arg.startsWith('--name='))?.split('=')[1];
                if (!checkpointName) {
                    throw new Error('Checkpoint name is required. Use --name=checkpoint-name');
                }
                await backupManager.createIncrementalBackup(checkpointName);
            } else if (args.includes('--validate')) {
                const backupName = args.find(arg => arg.startsWith('--backup='))?.split('=')[1];
                if (!backupName) {
                    throw new Error('Backup name is required. Use --backup=backup-name');
                }
                await backupManager.validateBackup(backupName);
            } else if (args.includes('--list')) {
                const backups = await backupManager.listBackups();
                console.log('\n📋 Available Backups:');
                backups.forEach(backup => {
                    console.log(`   ${backup.name} (${backup.type}) - ${backup.created}`);
                });
            } else if (args.includes('--cleanup')) {
                await backupManager.cleanupBackups();
            } else {
                console.log(`
Usage: node backup-manager.cjs [options]

Options:
  --create-full-backup     Create a complete backup
  --create-checkpoint      Create an incremental checkpoint
  --validate               Validate a backup
  --list                   List all backups
  --cleanup                Clean up old backups
  --name=<name>           Specify backup/checkpoint name
  --backup=<name>         Specify backup to validate

Examples:
  node backup-manager.cjs --create-full-backup --name=pre-unification
  node backup-manager.cjs --create-checkpoint --name=phase-3-1-complete
  node backup-manager.cjs --validate --backup=pre-unification
  node backup-manager.cjs --list
  node backup-manager.cjs --cleanup
                `);
            }
        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    }

    main();
}

module.exports = BackupManager;