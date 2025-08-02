# Simple Configuration Guide - Jezweb MCP Core

## Overview

Jezweb MCP Core uses a simplified, environment-first configuration approach that prioritizes ease of use while maintaining flexibility. This guide covers the configuration patterns for both deployment options.

## Core Configuration Principles

### 1. **Environment-First**
- Primary configuration through environment variables
- Sensible defaults that work out-of-the-box
- No complex configuration files required

### 2. **Backward Compatibility**
- Existing OpenAI API key patterns continue to work
- Transparent migration to provider system
- No breaking changes for existing users

### 3. **Deployment-Agnostic**
- Same configuration patterns across Cloudflare Workers and NPM package
- Consistent environment variable names
- Unified provider system

## Configuration Structure

### SimpleMCPHandlerConfig

The core configuration interface used across all deployments:

```typescript
interface SimpleMCPHandlerConfig {
  /** OpenAI API key (for backward compatibility) */
  apiKey?: string;
  /** Server name for identification */
  serverName?: string;
  /** Server version */
  serverVersion?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom capabilities */
  capabilities?: {
    tools?: { listChanged?: boolean };
    resources?: { subscribe?: boolean; listChanged?: boolean };
    prompts?: { listChanged?: boolean };
    completions?: {};
  };
}
```

### ProviderRegistryConfig

The provider system configuration (MVP implementation):

```typescript
interface ProviderRegistryConfig {
  /** Default provider name to use */
  defaultProvider?: string;
  /** Provider configurations */
  providers: LLMProviderConfig[];
}
```

## Environment Variables

### Required Configuration

```bash
# OpenAI API Key (Required)
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Optional Configuration

```bash
# Server Configuration
SERVER_NAME=openai-assistants-mcp          # Default server name
SERVER_VERSION=3.0.1                       # Server version
MCP_SERVER_NAME=jezweb-mcp-core            # Alternative server name (NPM)
MCP_SERVER_VERSION=3.0.1                   # Alternative version (NPM)

# Debug Configuration
DEBUG=true                                  # Enable debug logging
MCP_DEBUG=true                             # Alternative debug flag (NPM)
```

## Deployment-Specific Configuration

### Cloudflare Workers

#### Environment Setup

Set environment variables in your Cloudflare Workers dashboard or `wrangler.toml`:

```toml
# wrangler.toml
[env.production.vars]
SERVER_NAME = "openai-assistants-mcp"
SERVER_VERSION = "3.0.1"
DEBUG = "false"

# Secrets (set via wrangler secret put)
# OPENAI_API_KEY = "sk-your-key-here"
```

#### Handler Initialization

```typescript
// src/worker.ts
import { CloudflareMCPHandler } from './mcp-handler.js';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handler automatically reads configuration from env
    const handler = new CloudflareMCPHandler(env);
    
    // Process MCP request
    const mcpRequest = await request.json();
    const response = await handler.handleMCPRequest(mcpRequest);
    
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
```

#### Async Initialization (Recommended)

For better error handling and proper async initialization:

```typescript
// Use static factory method for proper async initialization
const handler = await CloudflareMCPHandler.create(env);
const response = await handler.handleMCPRequest(mcpRequest);
```

### NPM Package

#### Environment Setup

Create a `.env` file in your project root:

```bash
# .env
OPENAI_API_KEY=sk-your-openai-api-key-here
MCP_SERVER_NAME=jezweb-mcp-core
MCP_SERVER_VERSION=3.0.1
DEBUG=true
```

#### Handler Initialization

```typescript
// Basic initialization
import { MCPHandler } from 'jezweb-mcp-core';

const handler = new MCPHandler(process.env.OPENAI_API_KEY!);

// Process MCP request
const response = await handler.handleRequest(mcpRequest);
```

#### Async Initialization (Recommended)

```typescript
// Proper async initialization
const handler = await MCPHandler.create(process.env.OPENAI_API_KEY!);
const response = await handler.handleRequest(mcpRequest);
```

## Provider System Configuration

### Current Implementation (MVP)

The provider system is currently implemented with MVP functionality:

```typescript
// Automatic provider registry configuration
const registryConfig: ProviderRegistryConfig = {
  defaultProvider: 'openai',
  providers: [
    {
      provider: 'openai',
      enabled: true,
      config: { apiKey: env.OPENAI_API_KEY },
    },
  ],
};
```

### Future Multi-Provider Configuration

When additional providers are implemented, configuration will expand to:

```bash
# Multiple Provider Support (Future)
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
GOOGLE_API_KEY=your-google-key

# Provider Selection
DEFAULT_PROVIDER=openai                     # Default provider to use
ENABLE_HEALTH_CHECKS=true                  # Enable provider health monitoring
HEALTH_CHECK_INTERVAL=60000                # Health check interval (ms)
```

## Configuration Examples

### Basic Setup (Cloudflare Workers)

```typescript
// Minimal configuration - uses all defaults
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Only OPENAI_API_KEY is required
    const handler = new CloudflareMCPHandler(env);
    
    const mcpRequest = await request.json();
    const response = await handler.handleMCPRequest(mcpRequest);
    
    return new Response(JSON.stringify(response));
  },
};
```

### Debug Configuration (NPM Package)

```typescript
// Debug-enabled configuration
import { MCPHandler } from 'jezweb-mcp-core';

// Set debug environment variable
process.env.DEBUG = 'true';

const handler = new MCPHandler(process.env.OPENAI_API_KEY!);

// Debug information will be logged to console
const response = await handler.handleRequest(mcpRequest);
console.log('Handler stats:', handler.getStats());
```

### Production Configuration (Cloudflare Workers)

```toml
# wrangler.toml - Production settings
[env.production]
name = "openai-assistants-mcp-prod"

[env.production.vars]
SERVER_NAME = "openai-assistants-mcp"
SERVER_VERSION = "3.0.1"
DEBUG = "false"

# Use wrangler secret put for sensitive data
# wrangler secret put OPENAI_API_KEY --env production
```

## Configuration Validation

### Automatic Validation

Both deployment adapters include automatic configuration validation:

```typescript
// Cloudflare Workers
constructor(env: Env) {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required but not configured in Cloudflare Secrets');
  }
  // ... rest of initialization
}

// NPM Package
constructor(apiKey: string) {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('API key is required and cannot be empty');
  }
  // ... rest of initialization
}
```

### Health Check Methods

```typescript
// Cloudflare Workers
const handler = new CloudflareMCPHandler(env);
const health = handler.getHealthStatus();
console.log('Health:', health);

// NPM Package
const handler = new MCPHandler(apiKey);
const isInitialized = handler.isInitialized();
const stats = handler.getStats();
console.log('Initialized:', isInitialized, 'Stats:', stats);
```

## Migration from Previous Versions

### From v2.x to v3.x

No configuration changes required - the new provider system is fully backward compatible:

```typescript
// v2.x configuration (still works)
const handler = new MCPHandler(process.env.OPENAI_API_KEY!);

// v3.x configuration (same interface)
const handler = new MCPHandler(process.env.OPENAI_API_KEY!);
// Now uses provider system internally
```

### Environment Variable Migration

Old environment variables continue to work:

```bash
# Old pattern (still supported)
OPENAI_API_KEY=sk-your-key

# New pattern (same result)
OPENAI_API_KEY=sk-your-key
DEFAULT_PROVIDER=openai  # Optional, defaults to openai
```

## Troubleshooting

### Common Configuration Issues

1. **Missing API Key**
   ```
   Error: OPENAI_API_KEY is required but not configured
   ```
   **Solution**: Set the `OPENAI_API_KEY` environment variable

2. **Invalid API Key Format**
   ```
   Error: API key is required and cannot be empty
   ```
   **Solution**: Ensure API key starts with `sk-` and is not empty

3. **Provider Initialization Failed**
   ```
   Error: Failed to initialize provider registry
   ```
   **Solution**: Use async initialization pattern with `.create()` method

### Debug Configuration

Enable debug logging to troubleshoot configuration issues:

```bash
# Enable debug logging
DEBUG=true
MCP_DEBUG=true

# Check handler initialization
```

```typescript
// Check configuration in code
const handler = new MCPHandler(apiKey);
console.log('Config:', handler.getConfig());
console.log('Stats:', handler.getStats());
console.log('Initialized:', handler.isInitialized());
```

## Best Practices

### 1. **Use Environment Variables**
- Store sensitive data (API keys) in environment variables
- Use deployment-specific configuration management
- Never commit API keys to version control

### 2. **Enable Debug in Development**
```bash
DEBUG=true  # Development
DEBUG=false # Production
```

### 3. **Use Async Initialization**
```typescript
// Preferred pattern
const handler = await MCPHandler.create(apiKey);

// Instead of
const handler = new MCPHandler(apiKey);
```

### 4. **Validate Configuration**
```typescript
// Check handler status after initialization
if (!handler.isInitialized()) {
  throw new Error('Handler failed to initialize');
}
```

### 5. **Monitor Health**
```typescript
// Regular health checks in production
const health = handler.getHealthStatus();
if (health.status !== 'healthy') {
  console.warn('Handler unhealthy:', health);
}
```

This configuration system provides a solid foundation that's simple to use while being extensible for future enhancements.