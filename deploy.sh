#!/bin/bash

# OpenAI Assistants MCP Server - Comprehensive Deployment Script
# Automates version bumping, testing, GitHub, NPM, and Cloudflare Workers deployment
# Usage: ./deploy.sh [patch|minor|major] [--dry-run] [--skip-tests] [--force]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_PACKAGE_JSON="$SCRIPT_DIR/package.json"
NPM_PACKAGE_JSON="$SCRIPT_DIR/npm-package/package.json"
WRANGLER_TOML="$SCRIPT_DIR/wrangler.toml"
DEPLOYMENT_LOG="$SCRIPT_DIR/deployment.log"

# Default values
VERSION_TYPE="patch"
DRY_RUN=false
SKIP_TESTS=false
FORCE=false
CURRENT_BRANCH=""
ORIGINAL_VERSION=""
NEW_VERSION=""

# Utility functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$DEPLOYMENT_LOG"
    exit 1
}

info() {
    echo -e "${CYAN}ℹ️  $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

step() {
    echo -e "${PURPLE}🚀 $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            patch|minor|major)
                VERSION_TYPE="$1"
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                error "Unknown option: $1. Use --help for usage information."
                ;;
        esac
    done
}

# Show help
show_help() {
    cat << EOF
OpenAI Assistants MCP Server - Deployment Script

USAGE:
    ./deploy.sh [VERSION_TYPE] [OPTIONS]

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
    ./deploy.sh                    # Patch version bump with full deployment
    ./deploy.sh minor              # Minor version bump with full deployment
    ./deploy.sh major --dry-run    # Show what major version deployment would do
    ./deploy.sh patch --skip-tests # Deploy patch version without running tests

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

EOF
}

# Check prerequisites
check_prerequisites() {
    step "Checking prerequisites..."
    
    # Check if we're in the right directory
    if [[ ! -f "$ROOT_PACKAGE_JSON" ]] || [[ ! -f "$NPM_PACKAGE_JSON" ]] || [[ ! -f "$WRANGLER_TOML" ]]; then
        error "Not in the correct project directory. Missing required files."
    fi
    
    # Check required commands
    local required_commands=("git" "node" "npm" "wrangler" "jq")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error "Required command '$cmd' not found. Please install it first."
        fi
    done
    
    # Check if logged into npm
    if ! npm whoami &> /dev/null; then
        error "Not logged into NPM. Run 'npm login' first."
    fi
    
    # Check if wrangler is authenticated
    if ! wrangler whoami &> /dev/null; then
        error "Wrangler not authenticated. Run 'wrangler login' first."
    fi
    
    success "All prerequisites satisfied"
}

# Get current version
get_current_version() {
    ORIGINAL_VERSION=$(jq -r '.version' "$ROOT_PACKAGE_JSON")
    if [[ -z "$ORIGINAL_VERSION" ]] || [[ "$ORIGINAL_VERSION" == "null" ]]; then
        error "Could not read current version from $ROOT_PACKAGE_JSON"
    fi
    info "Current version: $ORIGINAL_VERSION"
}

# Calculate new version
calculate_new_version() {
    local major minor patch
    IFS='.' read -r major minor patch <<< "$ORIGINAL_VERSION"
    
    case $VERSION_TYPE in
        major)
            NEW_VERSION="$((major + 1)).0.0"
            ;;
        minor)
            NEW_VERSION="$major.$((minor + 1)).0"
            ;;
        patch)
            NEW_VERSION="$major.$minor.$((patch + 1))"
            ;;
    esac
    
    info "New version will be: $NEW_VERSION"
}

# Check git status
check_git_status() {
    step "Checking git status..."
    
    CURRENT_BRANCH=$(git branch --show-current)
    info "Current branch: $CURRENT_BRANCH"
    
    if [[ "$CURRENT_BRANCH" != "main" ]] && [[ "$CURRENT_BRANCH" != "master" ]]; then
        warning "Not on main/master branch. Current branch: $CURRENT_BRANCH"
        if [[ "$FORCE" != true ]]; then
            error "Use --force to deploy from non-main branch"
        fi
    fi
    
    if [[ -n $(git status --porcelain) ]]; then
        warning "Working directory is not clean"
        git status --short
        if [[ "$FORCE" != true ]]; then
            error "Commit or stash changes before deployment, or use --force"
        fi
    fi
    
    # Check if we're up to date with remote
    git fetch origin "$CURRENT_BRANCH" 2>/dev/null || true
    local local_commit=$(git rev-parse HEAD)
    local remote_commit=$(git rev-parse "origin/$CURRENT_BRANCH" 2>/dev/null || echo "")
    
    if [[ -n "$remote_commit" ]] && [[ "$local_commit" != "$remote_commit" ]]; then
        warning "Local branch is not up to date with remote"
        if [[ "$FORCE" != true ]]; then
            error "Pull latest changes first, or use --force"
        fi
    fi
    
    success "Git status check completed"
}

# Run tests
run_tests() {
    if [[ "$SKIP_TESTS" == true ]]; then
        warning "Skipping tests as requested"
        return
    fi
    
    step "Running comprehensive test suite..."
    
    # Run main test suite
    info "Running main test suite..."
    if ! npm test; then
        error "Main tests failed"
    fi
    
    # Run type checking
    info "Running TypeScript type checking..."
    if ! npm run type-check; then
        error "TypeScript type checking failed"
    fi
    
    # Run definitions validation
    info "Validating definitions..."
    if ! npm run definitions:validate; then
        error "Definitions validation failed"
    fi
    
    # Test npm package
    info "Testing NPM package..."
    cd npm-package
    if ! npm test; then
        error "NPM package tests failed"
    fi
    cd ..
    
    success "All tests passed"
}

# Update versions
update_versions() {
    step "Updating version numbers..."
    
    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] Would update version from $ORIGINAL_VERSION to $NEW_VERSION"
        return
    fi
    
    # Update root package.json
    info "Updating root package.json..."
    jq ".version = \"$NEW_VERSION\"" "$ROOT_PACKAGE_JSON" > "$ROOT_PACKAGE_JSON.tmp" && mv "$ROOT_PACKAGE_JSON.tmp" "$ROOT_PACKAGE_JSON"
    
    # Update npm-package/package.json
    info "Updating npm-package/package.json..."
    jq ".version = \"$NEW_VERSION\"" "$NPM_PACKAGE_JSON" > "$NPM_PACKAGE_JSON.tmp" && mv "$NPM_PACKAGE_JSON.tmp" "$NPM_PACKAGE_JSON"
    
    # Verify versions were updated
    local root_version=$(jq -r '.version' "$ROOT_PACKAGE_JSON")
    local npm_version=$(jq -r '.version' "$NPM_PACKAGE_JSON")
    
    if [[ "$root_version" != "$NEW_VERSION" ]] || [[ "$npm_version" != "$NEW_VERSION" ]]; then
        error "Version update failed. Root: $root_version, NPM: $npm_version"
    fi
    
    success "Version updated to $NEW_VERSION"
}

# Commit and tag
commit_and_tag() {
    step "Committing changes and creating tag..."
    
    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] Would commit changes and create tag v$NEW_VERSION"
        return
    fi
    
    # Add changed files
    git add "$ROOT_PACKAGE_JSON" "$NPM_PACKAGE_JSON"
    
    # Create commit
    local commit_message="chore: bump version to $NEW_VERSION

- Updated root package.json to $NEW_VERSION
- Updated npm-package/package.json to $NEW_VERSION
- Automated deployment via deploy.sh"
    
    git commit -m "$commit_message"
    
    # Create tag
    git tag -a "v$NEW_VERSION" -m "Release version $NEW_VERSION"
    
    success "Changes committed and tagged"
}

# Push to GitHub
push_to_github() {
    step "Pushing to GitHub..."
    
    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] Would push commits and tags to GitHub"
        return
    fi
    
    # Push commits
    git push origin "$CURRENT_BRANCH"
    
    # Push tags
    git push origin "v$NEW_VERSION"
    
    success "Pushed to GitHub"
}

# Publish to NPM
publish_to_npm() {
    step "Publishing to NPM..."
    
    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] Would publish to NPM registry"
        return
    fi
    
    cd npm-package
    
    # Run npm publish
    if ! npm publish; then
        error "NPM publish failed"
    fi
    
    cd ..
    
    success "Published to NPM registry"
}

# Deploy to Cloudflare Workers
deploy_to_cloudflare() {
    step "Deploying to Cloudflare Workers..."
    
    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] Would deploy to Cloudflare Workers"
        return
    fi
    
    # Deploy to production
    if ! wrangler deploy --env production; then
        error "Cloudflare Workers deployment failed"
    fi
    
    success "Deployed to Cloudflare Workers"
}

# Validate deployments
validate_deployments() {
    step "Validating deployments..."
    
    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] Would validate all deployments"
        return
    fi
    
    # Check NPM package
    info "Validating NPM package..."
    local npm_info=$(npm view openai-assistants-mcp version 2>/dev/null || echo "")
    if [[ "$npm_info" == "$NEW_VERSION" ]]; then
        success "NPM package validation successful"
    else
        warning "NPM package validation failed. Expected: $NEW_VERSION, Got: $npm_info"
    fi
    
    # Check Cloudflare Workers (basic connectivity test)
    info "Validating Cloudflare Workers deployment..."
    if wrangler tail --env production --format=pretty --once &>/dev/null; then
        success "Cloudflare Workers validation successful"
    else
        warning "Cloudflare Workers validation failed or timed out"
    fi
    
    # Check GitHub tag
    info "Validating GitHub tag..."
    if git ls-remote --tags origin | grep -q "v$NEW_VERSION"; then
        success "GitHub tag validation successful"
    else
        warning "GitHub tag validation failed"
    fi
}

# Cleanup on error
cleanup_on_error() {
    if [[ "$DRY_RUN" == true ]]; then
        return
    fi
    
    error "Deployment failed. Cleaning up..."
    
    # Reset version changes if they were made
    if [[ -n "$ORIGINAL_VERSION" ]] && [[ -n "$NEW_VERSION" ]]; then
        warning "Reverting version changes..."
        jq ".version = \"$ORIGINAL_VERSION\"" "$ROOT_PACKAGE_JSON" > "$ROOT_PACKAGE_JSON.tmp" && mv "$ROOT_PACKAGE_JSON.tmp" "$ROOT_PACKAGE_JSON"
        jq ".version = \"$ORIGINAL_VERSION\"" "$NPM_PACKAGE_JSON" > "$NPM_PACKAGE_JSON.tmp" && mv "$NPM_PACKAGE_JSON.tmp" "$NPM_PACKAGE_JSON"
    fi
    
    # Remove tag if it was created
    if git tag -l | grep -q "v$NEW_VERSION"; then
        warning "Removing tag v$NEW_VERSION..."
        git tag -d "v$NEW_VERSION" 2>/dev/null || true
    fi
    
    # Reset commit if it was made
    if git log --oneline -1 | grep -q "chore: bump version to $NEW_VERSION"; then
        warning "Resetting last commit..."
        git reset --hard HEAD~1 2>/dev/null || true
    fi
}

# Main deployment function
main() {
    # Initialize log
    echo "=== OpenAI Assistants MCP Deployment Started at $(date) ===" > "$DEPLOYMENT_LOG"
    
    log "Starting deployment process..."
    log "Arguments: $*"
    
    # Set up error handling
    trap cleanup_on_error ERR
    
    # Parse arguments
    parse_args "$@"
    
    if [[ "$DRY_RUN" == true ]]; then
        warning "DRY RUN MODE - No changes will be made"
    fi
    
    # Run deployment steps
    check_prerequisites
    get_current_version
    calculate_new_version
    check_git_status
    run_tests
    update_versions
    commit_and_tag
    push_to_github
    publish_to_npm
    deploy_to_cloudflare
    validate_deployments
    
    # Success summary
    echo
    success "🎉 Deployment completed successfully!"
    echo
    info "Summary:"
    info "  Version: $ORIGINAL_VERSION → $NEW_VERSION"
    info "  GitHub: ✅ Committed and tagged"
    info "  NPM: ✅ Published"
    info "  Cloudflare Workers: ✅ Deployed"
    echo
    info "Next steps:"
    info "  • Monitor deployment logs"
    info "  • Test the deployed services"
    info "  • Update documentation if needed"
    echo
    
    log "Deployment completed successfully at $(date)"
}

# Run main function with all arguments
main "$@"