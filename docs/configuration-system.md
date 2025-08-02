# Simple Configuration Guide

## Overview

Jezweb MCP Core uses a simple, environment-first configuration approach that eliminates complex setup while providing powerful multi-provider support. The system automatically detects your deployment environment and applies appropriate defaults.

## Configuration Principles

- **Environment-First**: Configuration comes from environment variables
- **Zero Setup**: Works out of the box with minimal configuration
- **Auto-Detection**: Automatically detects deployment environment
- **Sensible Defaults**: Provides reasonable defaults for all settings
- **Multi-Provider**: Supports multiple LLM providers simultaneously

## Basic Configuration

### Required Configuration

You only need to provide API keys for the LLM providers you want to use:

```bash
# At least one provider is required
export OPENAI_API_KEY="your-openai-key-here"
export ANTHROPIC_API_KEY="your-anthropic-key-here"
export GOOGLE_API_KEY="your-google-key-here"
```

### Optional Configuration

```bash
# Provider selection
export JEZWEB_DEFAULT_PROVIDER="openai"  # Default: "openai"

# Logging
export JEZWEB_LOG_LEVEL="info"          # Default: "info"
```

## Deployment-Specific Configuration

### Cloudflare Workers

Use Wrangler secrets for API keys and `wrangler.toml` for non-sensitive configuration:

```bash
# Set API keys as secrets
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY
```

```toml
# wrangler.toml
name = "my-mcp-server"
main = "src/worker.ts"
compatibility_date = "2024-01-01"

[vars]
JEZWEB_LOG_LEVEL = "info"
JEZWEB_DEFAULT_PROVIDER = "openai"
```

### NPM Package

Use environment variables or `.env` files:

```bash
# Environment variables
export OPENAI_API_KEY="your-key-here"
export ANTHROPIC_API_KEY="your-key-here"
```

Or create a `.env` file:

```bash
# .env
OPENAI_API_KEY=your-key-here
ANTHROPIC_API_KEY=your-key-here
JEZWEB_LOG_LEVEL=info
JEZWEB_DEFAULT_PROVIDER=openai
```

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API key | - | For OpenAI support |
| `ANTHROPIC_API_KEY` | Anthropic API key | - | For Claude support |
| `GOOGLE_API_KEY` | Google API key | - | For Gemini support |
| `JEZWEB_DEFAULT_PROVIDER` | Preferred provider | `"openai"` | No |
| `JEZWEB_LOG_LEVEL` | Logging level | `"info"` | No |

## Provider Selection

The system automatically selects providers based on:

1. **Available API Keys**: Only providers with valid API keys are considered
2. **Default Provider**: Uses `JEZWEB_DEFAULT_PROVIDER` if available
3. **Automatic Fallback**: Falls back to other available providers if needed
4. **Capability Matching**: Selects providers that support required features

## Environment Detection

The system automatically detects your deployment environment:

- **Cloudflare Workers**: Detected via Cloudflare-specific environment variables
- **NPM Package**: Detected when running as a local Node.js process
- **Development**: Detected via `NODE_ENV=development`
- **Production**: Default for Cloudflare Workers deployments

## Configuration Loading

Configuration is loaded in this priority order:

1. **Environment Variables** (highest priority)
2. **`.env` file** (NPM package only)
3. **Default Values** (lowest priority)

## Troubleshooting

### Common Issues

#### "No available providers" Error
- Ensure at least one API key is set
- Check that API keys are valid and properly formatted
- Verify environment variables are accessible

#### Provider Not Working
- Verify the API key format (OpenAI keys start with `sk-`)
- Check API key permissions and quotas
- Enable debug logging: `JEZWEB_LOG_LEVEL=debug`

#### Configuration Not Loading
- Check environment variable names (case-sensitive)
- Verify `.env` file location and format
- Ensure no syntax errors in `.env` file

### Debug Mode

Enable detailed logging to troubleshoot configuration issues:

```bash
export JEZWEB_LOG_LEVEL="debug"
```

This will show:
- Configuration loading process
- Provider initialization
- Available providers and their status
- Environment detection results

## Migration from Complex Configuration

If you're migrating from a previous version with complex configuration:

### Before (Complex)
```json
{
  "server": { "name": "my-server" },
  "api": { "openai": { "apiKey": "..." } },
  "deployment": { "type": "cloudflare" },
  "features": { "advanced": { "enabled": true } }
}
```

### After (Simple)
```bash
export OPENAI_API_KEY="your-key-here"
```

The new system automatically handles:
- Server naming
- Deployment type detection
- Feature availability based on providers
- Environment-specific optimizations

## Best Practices

1. **Use Secrets**: Store API keys in secure secret management systems
2. **Environment Separation**: Use different API keys for different environments
3. **Minimal Configuration**: Only configure what you need to change from defaults
4. **Debug Logging**: Use debug mode for troubleshooting, info/warn for production
5. **Provider Redundancy**: Configure multiple providers for fallback support

## Examples

### Single Provider Setup
```bash
export OPENAI_API_KEY="sk-your-openai-key-here"
```

### Multi-Provider Setup
```bash
export OPENAI_API_KEY="sk-your-openai-key-here"
export ANTHROPIC_API_KEY="sk-ant-your-anthropic-key-here"
export JEZWEB_DEFAULT_PROVIDER="openai"
```

### Development Setup
```bash
# .env file
OPENAI_API_KEY=sk-your-dev-key-here
JEZWEB_LOG_LEVEL=debug
JEZWEB_DEFAULT_PROVIDER=openai
```

### Production Setup (Cloudflare)
```bash
# Set via wrangler secrets
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY
```

```toml
# wrangler.toml
[vars]
JEZWEB_LOG_LEVEL = "warn"
JEZWEB_DEFAULT_PROVIDER = "openai"
```

This simple configuration approach eliminates complexity while providing all the power and flexibility needed for production deployments.