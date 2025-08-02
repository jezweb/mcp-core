/**
 * Configuration Examples Index - Jezweb MCP Core v3.0
 * 
 * This file provides easy access to all configuration examples and serves as
 * a reference for the unified provider-agnostic architecture patterns.
 */

import examples from './simple-config-examples.js';

// Re-export all examples for easy access
export const {
  cloudflare,
  npm,
  validation,
  testing
} = examples;

// Export default for convenience
export default examples;

/**
 * Quick Start Guide
 * 
 * Choose the appropriate example based on your deployment target:
 * 
 * 1. Cloudflare Workers:
 *    - Basic: examples.cloudflare.basic
 *    - Advanced: examples.cloudflare.advanced
 * 
 * 2. NPM Package:
 *    - Basic: examples.npm.basic
 *    - Advanced: examples.npm.advanced
 * 
 * 3. Configuration Validation:
 *    - Utilities: examples.validation
 *    - Testing: examples.testing
 */

/**
 * Example Usage:
 * 
 * ```javascript
 * import { cloudflare, npm, validation } from './examples/configuration/index.js';
 * 
 * // Get Cloudflare Workers example
 * const workerCode = cloudflare.basic.workerCode;
 * 
 * // Get NPM package example
 * const serverCode = npm.advanced.serverCode;
 * 
 * // Validate configuration
 * const config = validation.validateEnvironment();
 * ```
 */

// Helper functions for common tasks
export const helpers = {
  /**
   * Get the appropriate example based on deployment target
   */
  getExample(target, complexity = 'basic') {
    if (target === 'cloudflare' || target === 'workers') {
      return examples.cloudflare[complexity];
    } else if (target === 'npm' || target === 'node') {
      return examples.npm[complexity];
    } else {
      throw new Error(`Unknown target: ${target}. Use 'cloudflare' or 'npm'`);
    }
  },

  /**
   * Get environment variables template for a target
   */
  getEnvTemplate(target) {
    if (target === 'cloudflare' || target === 'workers') {
      return `# Cloudflare Workers Environment Variables
# Set via Cloudflare Dashboard or wrangler secret put

# Required
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional
SERVER_NAME=openai-assistants-mcp
SERVER_VERSION=3.0.1
DEBUG=false`;
    } else if (target === 'npm' || target === 'node') {
      return `# NPM Package Environment Variables
# Create .env file in your project root

# Required
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional
MCP_SERVER_NAME=jezweb-mcp-core
MCP_SERVER_VERSION=3.0.1
DEBUG=true
MCP_DEBUG=true
HTTP_PORT=3000`;
    } else {
      throw new Error(`Unknown target: ${target}. Use 'cloudflare' or 'npm'`);
    }
  },

  /**
   * Get package.json template for NPM projects
   */
  getPackageJsonTemplate() {
    return {
      name: "my-mcp-server",
      version: "1.0.0",
      type: "module",
      description: "MCP Server using Jezweb MCP Core",
      main: "server.js",
      scripts: {
        start: "node server.js",
        dev: "node --watch server.js",
        test: "node test.js"
      },
      dependencies: {
        "jezweb-mcp-core": "^3.0.0",
        "dotenv": "^16.0.0"
      },
      devDependencies: {
        "@types/node": "^20.0.0"
      },
      engines: {
        node: ">=18.0.0"
      }
    };
  },

  /**
   * Get wrangler.toml template for Cloudflare Workers
   */
  getWranglerTemplate() {
    return `name = "openai-assistants-mcp"
main = "src/worker.js"
compatibility_date = "2024-01-01"

# Production environment
[env.production]
name = "openai-assistants-mcp-prod"

[env.production.vars]
SERVER_NAME = "openai-assistants-mcp"
SERVER_VERSION = "3.0.1"
DEBUG = "false"

# Development environment
[env.development]
name = "openai-assistants-mcp-dev"

[env.development.vars]
SERVER_NAME = "openai-assistants-mcp-dev"
SERVER_VERSION = "3.0.1"
DEBUG = "true"

# Secrets (set via wrangler secret put)
# wrangler secret put OPENAI_API_KEY --env production
# wrangler secret put OPENAI_API_KEY --env development`;
  },

  /**
   * Validate configuration object
   */
  validateConfig(config) {
    const required = ['apiKey'];
    const missing = required.filter(key => !config[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }
    
    if (!config.apiKey.startsWith('sk-')) {
      throw new Error('OpenAI API key must start with "sk-"');
    }
    
    return true;
  },

  /**
   * Get deployment-specific initialization code
   */
  getInitCode(target, options = {}) {
    const { async = false, errorHandling = true } = options;
    
    if (target === 'cloudflare') {
      return async ? 
        `const handler = await CloudflareMCPHandler.create(env);` :
        `const handler = new CloudflareMCPHandler(env);`;
    } else if (target === 'npm') {
      return async ?
        `const handler = await MCPHandler.create(process.env.OPENAI_API_KEY);` :
        `const handler = new MCPHandler(process.env.OPENAI_API_KEY);`;
    }
    
    throw new Error(`Unknown target: ${target}`);
  }
};

// Configuration constants
export const CONFIG_CONSTANTS = {
  // Default values
  DEFAULTS: {
    SERVER_NAME: 'openai-assistants-mcp',
    SERVER_VERSION: '3.0.1',
    DEBUG: false,
    NPM_SERVER_NAME: 'jezweb-mcp-core'
  },
  
  // Environment variable names
  ENV_VARS: {
    // Required
    OPENAI_API_KEY: 'OPENAI_API_KEY',
    
    // Optional - Cloudflare
    SERVER_NAME: 'SERVER_NAME',
    SERVER_VERSION: 'SERVER_VERSION',
    DEBUG: 'DEBUG',
    
    // Optional - NPM
    MCP_SERVER_NAME: 'MCP_SERVER_NAME',
    MCP_SERVER_VERSION: 'MCP_SERVER_VERSION',
    MCP_DEBUG: 'MCP_DEBUG',
    HTTP_PORT: 'HTTP_PORT'
  },
  
  // Validation patterns
  VALIDATION: {
    API_KEY_PREFIX: 'sk-',
    MIN_API_KEY_LENGTH: 20,
    VERSION_PATTERN: /^\d+\.\d+\.\d+/
  }
};

// Architecture information
export const ARCHITECTURE_INFO = {
  version: '3.0.1',
  architecture: 'provider-agnostic',
  migrationStatus: 'completed',
  backwardCompatible: true,
  
  features: {
    unifiedCore: true,
    providerRegistry: true,
    dynamicToolRegistration: true,
    genericProviderInterface: true,
    mvpImplementation: true
  },
  
  deploymentTargets: [
    'cloudflare-workers',
    'npm-package'
  ],
  
  supportedProviders: [
    'openai' // MVP - more providers coming
  ],
  
  futureProviders: [
    'anthropic',
    'google',
    'custom'
  ]
};

console.log(`
🚀 Jezweb MCP Core Configuration Examples v${ARCHITECTURE_INFO.version}
📋 Architecture: ${ARCHITECTURE_INFO.architecture}
✅ Migration Status: ${ARCHITECTURE_INFO.migrationStatus}
🔄 Backward Compatible: ${ARCHITECTURE_INFO.backwardCompatible}

Available examples:
- Cloudflare Workers (basic & advanced)
- NPM Package (basic & advanced)  
- Configuration validation
- Testing utilities

Use: import examples from './examples/configuration/index.js'
`);