# OpenAI Assistants MCP Server - Deployment Guide

This guide covers the comprehensive deployment automation scripts for the OpenAI Assistants MCP Server project.

## Overview

The deployment scripts automate the entire release process across three platforms:
- **GitHub**: Version tagging and source code management
- **NPM**: Package publishing for stdio transport
- **Cloudflare Workers**: Serverless deployment for HTTP transport

## Available Scripts

### 1. Shell Script (`deploy.sh`)
- **Best for**: Unix/Linux/macOS environments
- **Requirements**: Bash shell, standard Unix tools
- **Usage**: `./deploy.sh [options]`

### 2. Node.js Script (`deploy.js`)
- **Best for**: Cross-platform compatibility
- **Requirements**: Node.js 18+
- **Usage**: `node deploy.js [options]` or `./deploy.js [options]`

Both scripts provide identical functionality with the same command-line interface.

## Prerequisites

Before running the deployment scripts, ensure you have:

### Required Tools
- **Git**: For version control operations
- **Node.js**: Version 18 or higher
- **NPM**: For package management and publishing
- **Wrangler CLI**: For Cloudflare Workers deployment
- **jq**: JSON processor (for shell script only)

### Authentication Setup
1. **NPM Authentication**:
   ```bash
   npm login
   ```

2. **Cloudflare Authentication**:
   ```bash
   wrangler login
   ```

3. **Git Configuration**:
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

## Usage

### Basic Usage

```bash
# Patch version bump (3.0.1 → 3.0.2)
./deploy.sh

# Minor version bump (3.0.1 → 3.1.0)
./deploy.sh minor

# Major version bump (3.0.1 → 4.0.0)
./deploy.sh major
```

### Advanced Options

```bash
# Dry run - see what would happen without making changes
./deploy.sh minor --dry-run

# Skip tests (not recommended for production)
./deploy.sh patch --skip-tests

# Force deployment from non-main branch or dirty working directory
./deploy.sh minor --force

# Combine options
./deploy.sh major --dry-run --skip-tests
```

### Node.js Script Usage

```bash
# Same commands work with Node.js script
node deploy.js minor
./deploy.js major --dry-run
```

## Deployment Process

The scripts follow this comprehensive deployment workflow:

### 1. Prerequisites Check ✅
- Validates required tools are installed
- Checks authentication status for NPM and Wrangler
- Verifies project structure and required files

### 2. Environment Validation 🔍
- Checks Git working directory status
- Validates current branch (warns if not main/master)
- Ensures local branch is up-to-date with remote

### 3. Test Suite Execution 🧪
- Runs comprehensive test suite (`npm test`)
- Performs TypeScript type checking
- Validates definitions and schemas
- Tests NPM package functionality

### 4. Version Management 📝
- Calculates new version based on semver rules
- Updates both `package.json` files simultaneously:
  - Root `package.json` (Cloudflare Workers)
  - `npm-package/package.json` (NPM package)

### 5. Git Operations 📦
- Commits version changes with descriptive message
- Creates annotated Git tag (`v{version}`)
- Pushes commits and tags to GitHub

### 6. NPM Publishing 📤
- Publishes package to NPM registry
- Uses `npm-package/` directory as package root

### 7. Cloudflare Workers Deployment 🚀
- Deploys to production environment
- Uses Wrangler configuration from `wrangler.toml`

### 8. Deployment Validation ✅
- Verifies NPM package is available
- Checks Cloudflare Workers deployment status
- Validates GitHub tag creation

## Error Handling & Recovery

### Automatic Cleanup
If deployment fails at any stage, the scripts automatically:
- Revert version changes in `package.json` files
- Remove created Git tags
- Reset Git commits
- Provide clear error messages

### Manual Recovery
If you need to manually recover from a failed deployment:

```bash
# Reset version changes
git checkout -- package.json npm-package/package.json

# Remove local tag
git tag -d v{version}

# Reset last commit (if needed)
git reset --hard HEAD~1

# Remove remote tag (if pushed)
git push origin :refs/tags/v{version}
```

## Configuration Files

### Package.json Files
The scripts manage two `package.json` files:
- **Root**: `/package.json` - Cloudflare Workers configuration
- **NPM Package**: `/npm-package/package.json` - NPM package configuration

Both files must have matching versions for successful deployment.

### Wrangler Configuration
Deployment uses settings from `wrangler.toml`:
- Production environment: `[env.production]`
- Account ID and project settings
- Environment variables and secrets

## Logging & Monitoring

### Deployment Logs
- All operations are logged to `deployment.log`
- Includes timestamps and detailed status information
- Preserved across deployment runs

### Status Indicators
The scripts provide clear visual feedback:
- 🚀 **Step indicators**: Major deployment phases
- ✅ **Success markers**: Completed operations
- ⚠️ **Warnings**: Non-critical issues
- ❌ **Errors**: Critical failures requiring attention
- ℹ️ **Information**: Status updates and details

## Best Practices

### Pre-Deployment Checklist
- [ ] All changes committed and pushed
- [ ] Tests passing locally
- [ ] Documentation updated
- [ ] Breaking changes documented
- [ ] Version bump type selected appropriately

### Version Bump Guidelines
- **Patch** (`x.y.Z`): Bug fixes, minor improvements
- **Minor** (`x.Y.0`): New features, backward compatible
- **Major** (`X.0.0`): Breaking changes, major updates

### Safety Recommendations
- Always run with `--dry-run` first for major versions
- Deploy from `main`/`master` branch only
- Ensure clean working directory
- Test deployments in staging environment first
- Monitor deployment logs and validation results

## Troubleshooting

### Common Issues

#### Authentication Errors
```bash
# Re-authenticate with NPM
npm logout && npm login

# Re-authenticate with Cloudflare
wrangler logout && wrangler login
```

#### Git Issues
```bash
# Ensure you're on the correct branch
git checkout main
git pull origin main

# Clean working directory
git stash  # or commit changes
```

#### Test Failures
```bash
# Run tests individually to identify issues
npm test
npm run type-check
npm run definitions:validate
```

#### Wrangler Deployment Issues
```bash
# Check Wrangler configuration
wrangler whoami
wrangler dev  # Test locally first
```

### Getting Help
- Check `deployment.log` for detailed error information
- Use `--dry-run` to preview changes without executing
- Run individual npm scripts to isolate issues
- Verify all prerequisites are properly installed

## Examples

### Standard Release Workflow
```bash
# 1. Prepare release
git checkout main
git pull origin main
npm test

# 2. Preview deployment
./deploy.sh minor --dry-run

# 3. Execute deployment
./deploy.sh minor

# 4. Verify deployment
# Check NPM: https://www.npmjs.com/package/openai-assistants-mcp
# Check Cloudflare: wrangler tail --env production
# Check GitHub: git tag -l
```

### Emergency Hotfix
```bash
# Quick patch deployment with minimal checks
./deploy.sh patch --skip-tests --force
```

### Major Version Release
```bash
# Comprehensive major version with full validation
./deploy.sh major  # Never skip tests for major versions
```

## Integration with CI/CD

The deployment scripts can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
name: Deploy
on:
  workflow_dispatch:
    inputs:
      version_type:
        description: 'Version bump type'
        required: true
        default: 'patch'
        type: choice
        options:
        - patch
        - minor
        - major

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g wrangler
      - run: ./deploy.sh ${{ github.event.inputs.version_type }}
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## Support

For issues with the deployment scripts:
1. Check this documentation
2. Review `deployment.log` for detailed error information
3. Test individual components (npm scripts, wrangler commands)
4. Open an issue on the GitHub repository

---

**Note**: These deployment scripts are designed for the OpenAI Assistants MCP Server project's specific architecture with dual deployment targets (NPM + Cloudflare Workers). Modify as needed for other projects.