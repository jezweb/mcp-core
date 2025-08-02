# Quick Start Guide - NPM Package Deployment

## Overview

Use Jezweb MCP Core as an NPM package for direct stdio transport, local execution, and full control over your environment.

## Prerequisites

- Node.js 18+ installed
- LLM provider API key (OpenAI, Anthropic, etc.)
- MCP client (Claude Desktop, Roo, etc.)

## Step 1: Get Your API Keys

### OpenAI (Recommended)
1. Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `sk-`)

### Anthropic Claude (Optional)
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an API key
3. Copy the key

### Google Gemini (Optional)
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Copy the key

## Step 2: Install and Test

### Option A: Use with npx (Recommended)

No installation required - always uses the latest version:

```bash
# Test the package
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  OPENAI_API_KEY=your-key-here npx jezweb-mcp-core@latest
```

### Option B: Global Installation

Install once, use anywhere:

```bash
# Install globally
npm install -g jezweb-mcp-core@latest

# Test the installation
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  OPENAI_API_KEY=your-key-here jezweb-mcp-core
```

### Option C: Local Project Installation

Install in your project:

```bash
# Install locally
npm install jezweb-mcp-core@latest

# Test with npx
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  OPENAI_API_KEY=your-key-here npx jezweb-mcp-core
```

## Step 3: Configure Your MCP Client

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

#### Single Provider (OpenAI)
```json
{
  "mcpServers": {
    "jezweb-mcp-core": {
      "command": "npx",
      "args": ["jezweb-mcp-core@latest"],
      "env": {
        "OPENAI_API_KEY": "your-openai-api-key-here"
      }
    }
  }
}
```

#### Multi-Provider Setup
```json
{
  "mcpServers": {
    "jezweb-mcp-core": {
      "command": "npx",
      "args": ["jezweb-mcp-core@latest"],
      "env": {
        "OPENAI_API_KEY": "your-openai-api-key-here",
        "ANTHROPIC_API_KEY": "your-anthropic-api-key-here",
        "GOOGLE_API_KEY": "your-google-api-key-here"
      }
    }
  }
}
```

### Roo Configuration

Add to your Roo configuration file:

```json
{
  "mcpServers": {
    "jezweb-mcp-core": {
      "command": "npx",
      "args": ["jezweb-mcp-core@latest"],
      "env": {
        "OPENAI_API_KEY": "your-openai-api-key-here",
        "ANTHROPIC_API_KEY": "your-anthropic-api-key-here"
      },
      "alwaysAllow": [
        "assistant-create",
        "assistant-list",
        "assistant-get",
        "assistant-update",
        "assistant-delete",
        "thread-create",
        "thread-get",
        "thread-update",
        "thread-delete",
        "message-create",
        "message-list",
        "message-get",
        "message-update",
        "message-delete",
        "run-create",
        "run-list",
        "run-get",
        "run-update",
        "run-cancel",
        "run-submit-tool-outputs",
        "run-step-list",
        "run-step-get"
      ]
    }
  }
}
```

## Step 4: Environment Configuration

### Using Environment Variables

Set environment variables in your shell:

```bash
# Required - at least one provider
export OPENAI_API_KEY="your-openai-key-here"
export ANTHROPIC_API_KEY="your-anthropic-key-here"

# Optional configuration
export JEZWEB_LOG_LEVEL="info"
export JEZWEB_DEFAULT_PROVIDER="openai"
```

### Using .env File (Local Development)

Create a `.env` file in your project directory:

```bash
# .env file
OPENAI_API_KEY=your-openai-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here
JEZWEB_LOG_LEVEL=info
JEZWEB_DEFAULT_PROVIDER=openai
```

The system will automatically load the `.env` file using the built-in dotenv support.

### Configuration Priority

The system loads configuration in this order (highest to lowest priority):

1. **Environment variables** (highest priority)
2. **`.env` file** in current directory
3. **Default configuration** (lowest priority)

## Step 5: Test Your Setup

### Manual Testing

Test the package directly:

```bash
# List available tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  OPENAI_API_KEY=your-key npx jezweb-mcp-core@latest
```

### Create Your First Assistant

```bash
# Create an assistant
echo '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "assistant-create",
    "arguments": {
      "name": "My First Assistant",
      "instructions": "You are a helpful assistant.",
      "model": "gpt-4"
    }
  }
}' | OPENAI_API_KEY=your-key npx jezweb-mcp-core@latest
```

### Test Multi-Provider Support

```bash
# The system will automatically select the best available provider
echo '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "assistant-create",
    "arguments": {
      "name": "Multi-Provider Assistant",
      "instructions": "You are a helpful assistant.",
      "model": "gpt-4"
    }
  }
}' | OPENAI_API_KEY=your-openai-key ANTHROPIC_API_KEY=your-anthropic-key npx jezweb-mcp-core@latest
```

## Step 6: Start Using in Your MCP Client

Once configured, you can use natural language commands:

```
"Create an assistant named 'Code Helper' with instructions to help with programming tasks"
"List my assistants"
"Create a new conversation thread"
"Start a run with assistant asst_abc123 on thread thread_def456"
```

## Advanced Configuration

### Provider Selection

The system automatically selects the best available provider based on:
- Available API keys
- Provider capabilities
- Current provider health

You can influence provider selection with:

```bash
# Set preferred default provider
export JEZWEB_DEFAULT_PROVIDER="openai"  # or "anthropic", "google"

# Enable debug logging to see provider selection
export JEZWEB_LOG_LEVEL="debug"
```

### Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | Required for OpenAI |
| `ANTHROPIC_API_KEY` | Anthropic API key | Required for Claude |
| `GOOGLE_API_KEY` | Google API key | Required for Gemini |
| `JEZWEB_DEFAULT_PROVIDER` | Preferred provider | `"openai"` |
| `JEZWEB_LOG_LEVEL` | Logging level | `"info"` |

## Troubleshooting

### Common Issues

#### "Command not found" Error
```bash
# Solution: Install Node.js 18+ or use full path
node --version  # Should be 18+
npm --version   # Should be recent
```

#### "Invalid API key" Error
```bash
# Check your API key
echo $OPENAI_API_KEY  # Should show your key
# Verify key format (OpenAI keys start with 'sk-')
```

#### "No available providers" Error
```bash
# Ensure at least one API key is set
export OPENAI_API_KEY="your-key-here"
# Or check your .env file
cat .env
```

#### "Permission denied" Error
```bash
# Fix npm permissions or use npx
npx jezweb-mcp-core@latest  # Recommended approach
```

### Debug Information

Run with debug mode to see detailed information:

```bash
JEZWEB_DEBUG=true JEZWEB_LOG_LEVEL=debug \
  OPENAI_API_KEY=your-key npx jezweb-mcp-core@latest
```

This will show:
- Configuration loading process
- Provider initialization
- Available providers and their status
- Request/response details

### Testing Different Providers

Test each provider individually:

```bash
# Test OpenAI only
OPENAI_API_KEY=your-key npx jezweb-mcp-core@latest

# Test Anthropic only
ANTHROPIC_API_KEY=your-key npx jezweb-mcp-core@latest

# Test both (system will select automatically)
OPENAI_API_KEY=your-openai-key \
ANTHROPIC_API_KEY=your-anthropic-key \
npx jezweb-mcp-core@latest
```

## Benefits of NPM Package Deployment

### Performance
- **Direct stdio**: Fastest possible communication
- **Local execution**: No network latency
- **Process communication**: Direct IPC with MCP client

### Control
- **Full control**: Complete control over execution environment
- **Custom configuration**: Extensive configuration options
- **Local debugging**: Easy to debug and troubleshoot

### Privacy
- **Local execution**: All processing happens locally
- **No proxy**: Direct communication with LLM providers
- **Offline capable**: Works without internet (after initial setup)

### Flexibility
- **Version control**: Pin to specific versions
- **Custom builds**: Modify and build custom versions
- **Development**: Perfect for development and testing

## Next Steps

1. **Explore Multi-Provider**: Try different LLM providers
2. **Configure Selection**: Experiment with provider selection strategies
3. **Monitor Performance**: Check provider health and performance
4. **Scale Usage**: The package handles concurrent requests efficiently

## Migration from OpenAI Assistants MCP

The migration is seamless:

```bash
# Old package
npx openai-assistants-mcp@latest

# New package (same functionality + multi-provider support)
npx jezweb-mcp-core@latest
```

All existing configuration and usage patterns continue to work!

The NPM package deployment provides the fastest performance and maximum control for local development and production use.