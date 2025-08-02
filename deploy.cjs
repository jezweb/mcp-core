#!/usr/bin/env node

/**
 * OpenAI Assistants MCP Server - Comprehensive Deployment Script (Node.js)
 * Automates version bumping, testing, GitHub, NPM, and Cloudflare Workers deployment
 * Usage: node deploy.js [patch|minor|major] [--dry-run] [--skip-tests] [--force]
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { promisify } = require('util');

// Colors for output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    purple: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

// Configuration
const config = {
    scriptDir: __dirname,
    rootPackageJson: path.join(__dirname, 'package.json'),
    npmPackageJson: path.join(__dirname, 'npm-package', 'package.json'),
    wranglerToml: path.join(__dirname, 'wrangler.toml'),
    deploymentLog: path.join(__dirname, 'deployment.log')
};

// State
let state = {
    versionType: 'patch',
    dryRun: false,
    skipTests: false,
    force: false,
    currentBranch: '',
    originalVersion: '',
    newVersion: '',
    logStream: null
};

// Utility functions
function log(message) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const logMessage = `${colors.blue}[${timestamp}]${colors.reset} ${message}`;
    console.log(logMessage);
    if (state.logStream) {
        state.logStream.write(`[${timestamp}] ${message.replace(/\x1b\[[0-9;]*m/g, '')}\n`);
    }
}

function success(message) {
    const logMessage = `${colors.green}✅ ${message}${colors.reset}`;
    console.log(logMessage);
    if (state.logStream) {
        state.logStream.write(`✅ ${message}\n`);
    }
}

function warning(message) {
    const logMessage = `${colors.yellow}⚠️  ${message}${colors.reset}`;
    console.log(logMessage);
    if (state.logStream) {
        state.logStream.write(`⚠️  ${message}\n`);
    }
}

function error(message) {
    const logMessage = `${colors.red}❌ ${message}${colors.reset}`;
    console.error(logMessage);
    if (state.logStream) {
        state.logStream.write(`❌ ${message}\n`);
    }
    process.exit(1);
}

function info(message) {
    const logMessage = `${colors.cyan}ℹ️  ${message}${colors.reset}`;
    console.log(logMessage);
    if (state.logStream) {
        state.logStream.write(`ℹ️  ${message}\n`);
    }
}

function step(message) {
    const logMessage = `${colors.purple}🚀 ${message}${colors.reset}`;
    console.log(logMessage);
    if (state.logStream) {
        state.logStream.write(`🚀 ${message}\n`);
    }
}

// Execute command with error handling
function execCommand(command, options = {}) {
    try {
        return execSync(command, { 
            encoding: 'utf8', 
            stdio: options.silent ? 'pipe' : 'inherit',
            ...options 
        });
    } catch (err) {
        if (!options.ignoreError) {
            error(`Command failed: ${command}\n${err.message}`);
        }
        return null;
    }
}

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    
    for (const arg of args) {
        switch (arg) {
            case 'patch':
            case 'minor':
            case 'major':
                state.versionType = arg;
                break;
            case '--dry-run':
                state.dryRun = true;
                break;
            case '--skip-tests':
                state.skipTests = true;
                break;
            case '--force':
                state.force = true;
                break;
            case '-h':
            case '--help':
                showHelp();
                process.exit(0);
                break;
            default:
                error(`Unknown option: ${arg}. Use --help for usage information.`);
        }
    }
}

// Show help
function showHelp() {
    console.log(`
OpenAI Assistants MCP Server - Deployment Script (Node.js)

USAGE:
    node deploy.js [VERSION_TYPE] [OPTIONS]

VERSION_TYPE:
    patch       Increment patch version (default)
    minor       Increment minor version
    major       Increment major version

OPTIONS:
    --dry-run   Show what would be done without making changes
    --skip-tests Skip running tests (not recommended)
    --force     Force deployment even if working directory is dirty
    -h, --help  Show this help message

EXAMPLES:
    node deploy.js                    # Patch version bump with full deployment
    node deploy.js minor              # Minor version bump with full deployment
    node deploy.js major --dry-run    # Show what major version deployment would do
    node deploy.js patch --skip-tests # Deploy patch version without running tests

DEPLOYMENT PROCESS:
    1. Validate environment and prerequisites
    2. Check working directory status
    3. Run comprehensive test suite
    4. Bump version in both package.json files
    5. Commit and tag changes
    6. Push to GitHub
    7. Publish to NPM registry
    8. Deploy to Cloudflare Workers
    9. Validate all deployments
`);
}

// Check prerequisites
function checkPrerequisites() {
    step('Checking prerequisites...');
    
    // Check if we're in the right directory
    const requiredFiles = [config.rootPackageJson, config.npmPackageJson, config.wranglerToml];
    for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
            error(`Not in the correct project directory. Missing required file: ${file}`);
        }
    }
    
    // Check required commands
    const requiredCommands = ['git', 'node', 'npm', 'wrangler'];
    for (const cmd of requiredCommands) {
        if (!execCommand(`which ${cmd}`, { silent: true, ignoreError: true })) {
            error(`Required command '${cmd}' not found. Please install it first.`);
        }
    }
    
    // Check if logged into npm
    if (!execCommand('npm whoami', { silent: true, ignoreError: true })) {
        error('Not logged into NPM. Run \'npm login\' first.');
    }
    
    // Check if wrangler is authenticated
    if (!execCommand('wrangler whoami', { silent: true, ignoreError: true })) {
        error('Wrangler not authenticated. Run \'wrangler login\' first.');
    }
    
    success('All prerequisites satisfied');
}

// Get current version
function getCurrentVersion() {
    try {
        const packageJson = JSON.parse(fs.readFileSync(config.rootPackageJson, 'utf8'));
        state.originalVersion = packageJson.version;
        if (!state.originalVersion) {
            error('Could not read current version from package.json');
        }
        info(`Current version: ${state.originalVersion}`);
    } catch (err) {
        error(`Failed to read package.json: ${err.message}`);
    }
}

// Calculate new version
function calculateNewVersion() {
    const [major, minor, patch] = state.originalVersion.split('.').map(Number);
    
    switch (state.versionType) {
        case 'major':
            state.newVersion = `${major + 1}.0.0`;
            break;
        case 'minor':
            state.newVersion = `${major}.${minor + 1}.0`;
            break;
        case 'patch':
            state.newVersion = `${major}.${minor}.${patch + 1}`;
            break;
    }
    
    info(`New version will be: ${state.newVersion}`);
}

// Check git status
function checkGitStatus() {
    step('Checking git status...');
    
    // Get current branch
    state.currentBranch = execCommand('git branch --show-current', { silent: true }).trim();
    info(`Current branch: ${state.currentBranch}`);
    
    if (state.currentBranch !== 'main' && state.currentBranch !== 'master') {
        warning(`Not on main/master branch. Current branch: ${state.currentBranch}`);
        if (!state.force) {
            error('Use --force to deploy from non-main branch');
        }
    }
    
    // Check working directory status
    const gitStatus = execCommand('git status --porcelain', { silent: true });
    if (gitStatus && gitStatus.trim()) {
        warning('Working directory is not clean');
        console.log(execCommand('git status --short'));
        if (!state.force) {
            error('Commit or stash changes before deployment, or use --force');
        }
    }
    
    // Check if we're up to date with remote
    execCommand(`git fetch origin ${state.currentBranch}`, { silent: true, ignoreError: true });
    const localCommit = execCommand('git rev-parse HEAD', { silent: true }).trim();
    const remoteCommit = execCommand(`git rev-parse origin/${state.currentBranch}`, { silent: true, ignoreError: true });
    
    if (remoteCommit && localCommit !== remoteCommit.trim()) {
        warning('Local branch is not up to date with remote');
        if (!state.force) {
            error('Pull latest changes first, or use --force');
        }
    }
    
    success('Git status check completed');
}

// Run tests
async function runTests() {
    if (state.skipTests) {
        warning('Skipping tests as requested');
        return;
    }
    
    step('Running comprehensive test suite...');
    
    // Run main test suite
    info('Running main test suite...');
    execCommand('npm test');
    
    // Run type checking
    info('Running TypeScript type checking...');
    execCommand('npm run type-check');
    
    // Run definitions validation
    info('Validating definitions...');
    execCommand('npm run definitions:validate');
    
    // Test npm package
    info('Testing NPM package...');
    process.chdir('npm-package');
    execCommand('npm test');
    process.chdir('..');
    
    success('All tests passed');
}

// Update versions
function updateVersions() {
    step('Updating version numbers...');
    
    if (state.dryRun) {
        info(`[DRY RUN] Would update version from ${state.originalVersion} to ${state.newVersion}`);
        return;
    }
    
    // Update root package.json
    info('Updating root package.json...');
    const rootPackage = JSON.parse(fs.readFileSync(config.rootPackageJson, 'utf8'));
    rootPackage.version = state.newVersion;
    fs.writeFileSync(config.rootPackageJson, JSON.stringify(rootPackage, null, 2) + '\n');
    
    // Update npm-package/package.json
    info('Updating npm-package/package.json...');
    const npmPackage = JSON.parse(fs.readFileSync(config.npmPackageJson, 'utf8'));
    npmPackage.version = state.newVersion;
    fs.writeFileSync(config.npmPackageJson, JSON.stringify(npmPackage, null, 2) + '\n');
    
    // Verify versions were updated
    const rootVersion = JSON.parse(fs.readFileSync(config.rootPackageJson, 'utf8')).version;
    const npmVersion = JSON.parse(fs.readFileSync(config.npmPackageJson, 'utf8')).version;
    
    if (rootVersion !== state.newVersion || npmVersion !== state.newVersion) {
        error(`Version update failed. Root: ${rootVersion}, NPM: ${npmVersion}`);
    }
    
    success(`Version updated to ${state.newVersion}`);
}

// Commit and tag
function commitAndTag() {
    step('Committing changes and creating tag...');
    
    if (state.dryRun) {
        info(`[DRY RUN] Would commit changes and create tag v${state.newVersion}`);
        return;
    }
    
    // Add changed files
    execCommand(`git add ${config.rootPackageJson} ${config.npmPackageJson}`);
    
    // Create commit
    const commitMessage = `chore: bump version to ${state.newVersion}

- Updated root package.json to ${state.newVersion}
- Updated npm-package/package.json to ${state.newVersion}
- Automated deployment via deploy.js`;
    
    execCommand(`git commit -m "${commitMessage}"`);
    
    // Create tag
    execCommand(`git tag -a "v${state.newVersion}" -m "Release version ${state.newVersion}"`);
    
    success('Changes committed and tagged');
}

// Push to GitHub
function pushToGitHub() {
    step('Pushing to GitHub...');
    
    if (state.dryRun) {
        info('[DRY RUN] Would push commits and tags to GitHub');
        return;
    }
    
    // Push commits
    execCommand(`git push origin ${state.currentBranch}`);
    
    // Push tags
    execCommand(`git push origin v${state.newVersion}`);
    
    success('Pushed to GitHub');
}

// Publish to NPM
function publishToNpm() {
    step('Publishing to NPM...');
    
    if (state.dryRun) {
        info('[DRY RUN] Would publish to NPM registry');
        return;
    }
    
    process.chdir('npm-package');
    execCommand('npm publish');
    process.chdir('..');
    
    success('Published to NPM registry');
}

// Deploy to Cloudflare Workers
function deployToCloudflare() {
    step('Deploying to Cloudflare Workers...');
    
    if (state.dryRun) {
        info('[DRY RUN] Would deploy to Cloudflare Workers');
        return;
    }
    
    execCommand('wrangler deploy --env production');
    
    success('Deployed to Cloudflare Workers');
}

// Validate deployments
async function validateDeployments() {
    step('Validating deployments...');
    
    if (state.dryRun) {
        info('[DRY RUN] Would validate all deployments');
        return;
    }
    
    // Check NPM package
    info('Validating NPM package...');
    const npmInfo = execCommand('npm view openai-assistants-mcp version', { silent: true, ignoreError: true });
    if (npmInfo && npmInfo.trim() === state.newVersion) {
        success('NPM package validation successful');
    } else {
        warning(`NPM package validation failed. Expected: ${state.newVersion}, Got: ${npmInfo ? npmInfo.trim() : 'unknown'}`);
    }
    
    // Check Cloudflare Workers (basic connectivity test)
    info('Validating Cloudflare Workers deployment...');
    const cfValidation = execCommand('wrangler tail --env production --format=pretty --once', { 
        silent: true, 
        ignoreError: true,
        timeout: 10000
    });
    if (cfValidation !== null) {
        success('Cloudflare Workers validation successful');
    } else {
        warning('Cloudflare Workers validation failed or timed out');
    }
    
    // Check GitHub tag
    info('Validating GitHub tag...');
    const tagCheck = execCommand(`git ls-remote --tags origin | grep v${state.newVersion}`, { 
        silent: true, 
        ignoreError: true 
    });
    if (tagCheck) {
        success('GitHub tag validation successful');
    } else {
        warning('GitHub tag validation failed');
    }
}

// Cleanup on error
function cleanupOnError() {
    if (state.dryRun) {
        return;
    }
    
    error('Deployment failed. Cleaning up...');
    
    // Reset version changes if they were made
    if (state.originalVersion && state.newVersion) {
        warning('Reverting version changes...');
        try {
            const rootPackage = JSON.parse(fs.readFileSync(config.rootPackageJson, 'utf8'));
            rootPackage.version = state.originalVersion;
            fs.writeFileSync(config.rootPackageJson, JSON.stringify(rootPackage, null, 2) + '\n');
            
            const npmPackage = JSON.parse(fs.readFileSync(config.npmPackageJson, 'utf8'));
            npmPackage.version = state.originalVersion;
            fs.writeFileSync(config.npmPackageJson, JSON.stringify(npmPackage, null, 2) + '\n');
        } catch (err) {
            warning(`Failed to revert version changes: ${err.message}`);
        }
    }
    
    // Remove tag if it was created
    const tagExists = execCommand(`git tag -l | grep v${state.newVersion}`, { silent: true, ignoreError: true });
    if (tagExists) {
        warning(`Removing tag v${state.newVersion}...`);
        execCommand(`git tag -d v${state.newVersion}`, { ignoreError: true });
    }
    
    // Reset commit if it was made
    const lastCommit = execCommand('git log --oneline -1', { silent: true, ignoreError: true });
    if (lastCommit && lastCommit.includes(`chore: bump version to ${state.newVersion}`)) {
        warning('Resetting last commit...');
        execCommand('git reset --hard HEAD~1', { ignoreError: true });
    }
}

// Main deployment function
async function main() {
    try {
        // Initialize log
        state.logStream = fs.createWriteStream(config.deploymentLog, { flags: 'w' });
        state.logStream.write(`=== OpenAI Assistants MCP Deployment Started at ${new Date().toISOString()} ===\n`);
        
        log('Starting deployment process...');
        log(`Arguments: ${process.argv.slice(2).join(' ')}`);
        
        // Parse arguments
        parseArgs();
        
        if (state.dryRun) {
            warning('DRY RUN MODE - No changes will be made');
        }
        
        // Run deployment steps
        checkPrerequisites();
        getCurrentVersion();
        calculateNewVersion();
        checkGitStatus();
        await runTests();
        updateVersions();
        commitAndTag();
        pushToGitHub();
        publishToNpm();
        deployToCloudflare();
        await validateDeployments();
        
        // Success summary
        console.log();
        success('🎉 Deployment completed successfully!');
        console.log();
        info('Summary:');
        info(`  Version: ${state.originalVersion} → ${state.newVersion}`);
        info('  GitHub: ✅ Committed and tagged');
        info('  NPM: ✅ Published');
        info('  Cloudflare Workers: ✅ Deployed');
        console.log();
        info('Next steps:');
        info('  • Monitor deployment logs');
        info('  • Test the deployed services');
        info('  • Update documentation if needed');
        console.log();
        
        log(`Deployment completed successfully at ${new Date().toISOString()}`);
        
        if (state.logStream) {
            state.logStream.end();
        }
        
    } catch (err) {
        cleanupOnError();
        if (state.logStream) {
            state.logStream.end();
        }
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    error(`Uncaught exception: ${err.message}`);
    cleanupOnError();
});

process.on('unhandledRejection', (reason, promise) => {
    error(`Unhandled rejection at: ${promise}, reason: ${reason}`);
    cleanupOnError();
});

// Run main function
if (require.main === module) {
    main().catch((err) => {
        error(`Deployment failed: ${err.message}`);
        cleanupOnError();
    });
}

module.exports = {
    main,
    checkPrerequisites,
    getCurrentVersion,
    calculateNewVersion,
    checkGitStatus,
    runTests,
    updateVersions,
    commitAndTag,
    pushToGitHub,
    publishToNpm,
    deployToCloudflare,
    validateDeployments
};