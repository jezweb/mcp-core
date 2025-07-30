#!/bin/bash

# Development Environment Setup Script
# This script sets up the development environment for the OpenAI Assistants MCP Server

set -e

echo "🚀 Setting up OpenAI Assistants MCP Server development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Not in project root directory. Please run this script from the project root."
    exit 1
fi

# Check Node.js version
print_status "Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    print_error "Node.js version $REQUIRED_VERSION or higher is required. Current version: $NODE_VERSION"
    exit 1
fi
print_success "Node.js version $NODE_VERSION is compatible"

# Install dependencies
print_status "Installing root dependencies..."
npm ci

print_status "Installing NPM package dependencies..."
cd npm-package && npm ci && cd ..

# Install development tools
print_status "Installing development tools..."
npm install -g husky prettier eslint typescript wrangler

# Setup Husky hooks
print_status "Setting up Git hooks..."
npx husky install
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg

# Create .env template if it doesn't exist
if [ ! -f ".env.example" ]; then
    print_status "Creating .env.example template..."
    cat > .env.example << 'EOF'
# OpenAI API Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Cloudflare Configuration (for deployment)
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id

# Development Configuration
NODE_ENV=development
DEBUG=true

# Test Configuration
TEST_TIMEOUT=30000
EOF
    print_success "Created .env.example template"
fi

# Create local .env if it doesn't exist
if [ ! -f ".env" ]; then
    print_status "Creating local .env file..."
    cp .env.example .env
    print_warning "Please update .env with your actual API keys and configuration"
fi

# Setup ESLint configuration
if [ ! -f ".eslintrc.js" ]; then
    print_status "Creating ESLint configuration..."
    cat > .eslintrc.js << 'EOF'
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'security'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:security/recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'security/detect-object-injection': 'error',
    'no-console': 'warn',
  },
  env: {
    node: true,
    es2022: true,
  },
};
EOF
    print_success "Created ESLint configuration"
fi

# Setup Prettier configuration
if [ ! -f ".prettierrc" ]; then
    print_status "Creating Prettier configuration..."
    cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
EOF
    print_success "Created Prettier configuration"
fi

# Setup VS Code configuration
if [ ! -d ".vscode" ]; then
    print_status "Creating VS Code configuration..."
    mkdir -p .vscode
    
    cat > .vscode/settings.json << 'EOF'
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.wrangler": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.wrangler": true
  }
}
EOF

    cat > .vscode/extensions.json << 'EOF'
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json"
  ]
}
EOF

    cat > .vscode/launch.json << 'EOF'
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/test/run-all-tests.js",
      "args": ["--core-only"],
      "env": {
        "NODE_ENV": "test"
      },
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "name": "Debug Cloudflare Worker",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/wrangler",
      "args": ["dev"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
EOF
    print_success "Created VS Code configuration"
fi

# Run initial validation
print_status "Running initial validation..."

# TypeScript compilation check
if npm run type-check; then
    print_success "TypeScript compilation check passed"
else
    print_warning "TypeScript compilation check failed - please review the code"
fi

# Run core tests
if npm run test:core; then
    print_success "Core tests passed"
else
    print_warning "Core tests failed - please review the test results"
fi

# Create development scripts
print_status "Creating development scripts..."

cat > scripts/dev-test.sh << 'EOF'
#!/bin/bash
# Quick development test script

echo "🧪 Running development tests..."

# Run core tests only (fast)
npm run test:core

# Check TypeScript compilation
npm run type-check

echo "✅ Development tests completed"
EOF

cat > scripts/dev-format.sh << 'EOF'
#!/bin/bash
# Format all code files

echo "🎨 Formatting code..."

# Format TypeScript and JavaScript files
npx prettier --write "src/**/*.{ts,js,json}"
npx prettier --write "npm-package/src/**/*.{ts,js,json}"
npx prettier --write "test/**/*.{js,json}"
npx prettier --write "scripts/**/*.{js,json}"

# Fix ESLint issues
npx eslint --fix "src/**/*.ts" "npm-package/src/**/*.ts" || true

echo "✅ Code formatting completed"
EOF

cat > scripts/dev-clean.sh << 'EOF'
#!/bin/bash
# Clean development environment

echo "🧹 Cleaning development environment..."

# Remove node_modules
rm -rf node_modules
rm -rf npm-package/node_modules

# Remove build artifacts
rm -rf dist
rm -rf .wrangler
rm -rf coverage

# Remove logs
rm -rf logs
find . -name "*.log" -delete

# Reinstall dependencies
npm ci
cd npm-package && npm ci && cd ..

echo "✅ Development environment cleaned"
EOF

chmod +x scripts/dev-test.sh
chmod +x scripts/dev-format.sh
chmod +x scripts/dev-clean.sh

print_success "Created development scripts"

# Update package.json with new scripts
print_status "Adding development scripts to package.json..."

# Create a temporary script to update package.json
cat > update-package.js << 'EOF'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Add new development scripts
pkg.scripts = {
  ...pkg.scripts,
  "dev:setup": "bash scripts/dev-setup.sh",
  "dev:test": "bash scripts/dev-test.sh",
  "dev:format": "bash scripts/dev-format.sh",
  "dev:clean": "bash scripts/dev-clean.sh",
  "format": "prettier --write \"src/**/*.{ts,js,json}\" \"npm-package/src/**/*.{ts,js,json}\"",
  "lint": "eslint \"src/**/*.ts\" \"npm-package/src/**/*.ts\"",
  "lint:fix": "eslint --fix \"src/**/*.ts\" \"npm-package/src/**/*.ts\"",
  "prepare": "husky install"
};

// Add development dependencies if not present
pkg.devDependencies = {
  ...pkg.devDependencies,
  "husky": "^8.0.3",
  "prettier": "^3.0.0",
  "eslint": "^8.0.0",
  "@typescript-eslint/parser": "^6.0.0",
  "@typescript-eslint/eslint-plugin": "^6.0.0",
  "eslint-plugin-security": "^1.7.1"
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('✅ Updated package.json with development scripts');
EOF

node update-package.js
rm update-package.js

# Install new development dependencies
print_status "Installing additional development dependencies..."
npm install

# Final setup
print_status "Finalizing setup..."

# Initialize Husky
npx husky install

print_success "Development environment setup completed!"

echo ""
echo "📋 Next steps:"
echo "1. Update .env with your API keys and configuration"
echo "2. Run 'npm run dev:test' to verify everything works"
echo "3. Run 'npm run dev' to start the development server"
echo "4. Run 'npm run test' to run the full test suite"
echo ""
echo "🛠️  Available development commands:"
echo "  npm run dev:test     - Quick development tests"
echo "  npm run dev:format   - Format all code"
echo "  npm run dev:clean    - Clean and reset environment"
echo "  npm run format       - Format code with Prettier"
echo "  npm run lint         - Run ESLint"
echo "  npm run lint:fix     - Fix ESLint issues"
echo ""
echo "🎉 Happy coding!"