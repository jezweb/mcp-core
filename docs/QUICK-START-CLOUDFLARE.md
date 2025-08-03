# Quick Start Guide - Cloudflare Workers Deployment

## Overview

Deploy Jezweb MCP Core to Cloudflare Workers for zero-setup, global edge distribution with sub-100ms response times.

## Prerequisites

- Cloudflare account
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

## Step 2: Use the Deployed Service

The service is already deployed and ready to use at:
```
https://jezweb-mcp-core.jezweb.ai/mcp/{your-api-key}
```

### Option A: Direct URL Usage (Simple)

Replace `{your-api-key}` with your actual API key:
```
https://openai-assistants-mcp.jezweb.ai/mcp/sk-your-openai-key-here
```

### Option B: Use with MCP Proxy (Recommended)

1. Install MCP proxy:
```bash
npm install -g mcp-proxy
```

2. Configure your MCP client to use the proxy.

## Step 3: Configure Your MCP Client

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "jezweb-mcp-core": {
      "command": "npx",
      "args": [
        "mcp-proxy",
        "https://jezweb-mcp-core.jezweb.ai/mcp/YOUR_API_KEY_HERE"
      ]
    }
  }
}
```

**Replace `YOUR_API_KEY_HERE` with your actual OpenAI API key.**

### Roo Configuration

Add to your Roo configuration:

```json
{
  "mcpServers": {
    "jezweb-mcp-core": {
      "command": "npx",
      "args": [
        "mcp-proxy",
        "https://jezweb-mcp-core.jezweb.ai/mcp/YOUR_API_KEY_HERE"
      ]
    }
  }
}
```

## Step 4: Test the Connection

### Manual Testing with curl

Test that the service is working:

```bash
# List available tools
curl -X POST "https://jezweb-mcp-core.jezweb.ai/mcp/YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

You should see a list of 22 available tools.

### Create Your First Assistant

```bash
curl -X POST "https://jezweb-mcp-core.jezweb.ai/mcp/YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

## Step 5: Start Using in Your MCP Client

Once configured, you can use natural language commands in your MCP client:

```
"Create an assistant named 'Code Helper' with instructions to help with programming tasks"
"List my assistants"
"Create a new conversation thread"
"Add a message to thread thread_abc123"
```

## Advanced Configuration

### Multi-Provider Support

The Cloudflare Workers deployment supports multiple providers automatically. The system will use the available API keys to determine which providers are available.

### Custom Deployment

For advanced use cases, you can deploy your own instance:

1. Clone the repository:
```bash
git clone https://github.com/jezweb/jezweb-mcp-core.git
cd jezweb-mcp-core
```

2. Install dependencies:
```bash
npm install
```

3. Configure your API keys using Cloudflare secrets:
```bash
# Required - at least one provider
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY

# Optional - additional providers
wrangler secret put GOOGLE_API_KEY
```

4. Configure non-sensitive settings in `wrangler.toml`:
```toml
name = "my-mcp-server"
main = "src/worker.ts"
compatibility_date = "2024-01-01"

[vars]
JEZWEB_LOG_LEVEL = "info"
JEZWEB_DEFAULT_PROVIDER = "openai"
```

5. Deploy to your Cloudflare account:
```bash
wrangler deploy
```

## Troubleshooting

### Common Issues

#### "Invalid API key" Error
- Verify your API key is correct
- Ensure the key starts with `sk-` for OpenAI
- Check that your OpenAI account has Assistants API access

#### "Connection timeout" Error
- Check your internet connection
- Try again in a few moments (temporary service issue)
- Verify the URL is correct

#### "Tool not found" Error
- Ensure you're using the correct tool names
- Check the tools list with the `tools/list` method
- Verify your MCP client is properly configured

### Getting Help

1. **Check Service Status**: Verify the service is operational
2. **Test with curl**: Use the manual testing commands above
3. **Review Configuration**: Double-check your MCP client configuration
4. **Check API Key**: Verify your API key is valid and has proper permissions

## Benefits of Cloudflare Workers Deployment

### Performance
- **Sub-100ms Response Times**: Global edge distribution
- **Zero Cold Start**: Always warm and ready
- **Automatic Scaling**: Handles any load automatically

### Reliability
- **99.9% Uptime**: Cloudflare's global network
- **Automatic Failover**: Built-in redundancy
- **DDoS Protection**: Enterprise-grade security

### Simplicity
- **Zero Setup**: No local installation required
- **No Maintenance**: Fully managed service
- **Automatic Updates**: Always running the latest version

### Global Availability
- **200+ Locations**: Cloudflare's global edge network
- **Low Latency**: Served from the nearest location
- **High Availability**: Multiple redundant servers

## Next Steps

1. **Explore Tools**: Try different assistant management tools
2. **Create Workflows**: Build complex assistant workflows
3. **Monitor Usage**: Check your OpenAI usage dashboard
4. **Scale Up**: The service automatically scales with your needs

## Security Notes

- **API Key Security**: Your API key is passed in the URL path but not logged
- **HTTPS Only**: All communication is encrypted
- **No Data Storage**: No conversation data is stored on our servers
- **Direct API Calls**: Your requests go directly to OpenAI's API

The Cloudflare Workers deployment provides the fastest and most convenient way to use Jezweb MCP Core with zero setup required!