# Tool and Resource Count Verification Guide

## Expected Counts

The OpenAI Assistants MCP Server should provide exactly:
- **22 Tools** - Complete OpenAI Assistants API coverage
- **13 Resources** - Templates, workflows, and documentation

## Verification Methods

### Method 1: Using Custom Domain Test Script

```bash
node test-custom-domain.cjs
```

This script will show:
- Total tool count
- Total resource count
- Connection status

### Method 2: Manual MCP Testing

```bash
# Test tools list
curl -X POST https://openai-assistants-mcp.jezweb.ai/mcp/test-key \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}'

# Test resources list
curl -X POST https://openai-assistants-mcp.jezweb.ai/mcp/test-key \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "resources/list", "params": {}}'
```

## Common Issues and Solutions

### Issue: Different Tool/Resource Counts

If you see different counts (e.g., 15 tools, 9 resources), you may be connected to the wrong server.

**Common Causes:**
1. **Wrong Domain**: Connecting to `vectorstore.jezweb.com` instead of `openai-assistants-mcp.jezweb.ai`
2. **Cached Configuration**: Old MCP client configuration pointing to wrong server
3. **Proxy Issues**: MCP proxy forwarding to wrong endpoint

**Solutions:**
1. **Verify Domain**: Ensure you're using `https://openai-assistants-mcp.jezweb.ai/mcp/{api-key}`
2. **Clear Cache**: Restart your MCP client after configuration changes
3. **Check Logs**: Review MCP client logs for connection details

### Issue: Connection to vectorstore.jezweb.com

The `vectorstore.jezweb.com` domain hosts a different MCP server (OpenAI Vector Store MCP) which provides:
- 15 tools (vector store operations)
- 9 resources (vector store documentation)

**Fix:** Update your configuration to use the correct domain:
```json
{
  "mcpServers": {
    "openai-assistants": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch", "https://openai-assistants-mcp.jezweb.ai/mcp/YOUR_API_KEY"]
    }
  }
}
```

## Expected Tool List (22 Total)

### Assistant Management (5 tools)
- `assistant-create`
- `assistant-list`
- `assistant-get`
- `assistant-update`
- `assistant-delete`

### Thread Management (4 tools)
- `thread-create`
- `thread-get`
- `thread-update`
- `thread-delete`

### Message Management (5 tools)
- `message-create`
- `message-list`
- `message-get`
- `message-update`
- `message-delete`

### Run Management (6 tools)
- `run-create`
- `run-list`
- `run-get`
- `run-update`
- `run-cancel`
- `run-submit-tool-outputs`

### Run Step Management (2 tools)
- `run-step-list`
- `run-step-get`

## Expected Resource List (13 Total)

### Assistant Templates (4 resources)
- `assistant://templates/coding-assistant`
- `assistant://templates/data-analyst`
- `assistant://templates/customer-support`
- `assistant://templates/writing-assistant`

### Workflow Examples (3 resources)
- `examples://workflows/create-and-run`
- `examples://workflows/batch-processing`
- `examples://workflows/code-review`

### Documentation (6 resources)
- `docs://openai-assistants-api`
- `docs://best-practices`
- `docs://troubleshooting/common-issues`
- `docs://getting-started`
- `docs://tool-usage`
- `examples://workflows/data-analysis`

## Troubleshooting Steps

1. **Verify Domain**: Confirm you're connecting to `openai-assistants-mcp.jezweb.ai`
2. **Test Connection**: Use the test script to verify counts
3. **Check Configuration**: Ensure MCP client points to correct server
4. **Review Logs**: Check for connection errors or redirects
5. **Clear Cache**: Restart MCP client after configuration changes

## Support

If you continue to see incorrect counts after following this guide:
1. Run the verification script and share the output
2. Check your MCP client configuration
3. Verify you're not accidentally connecting to a different MCP server

The correct server at `https://openai-assistants-mcp.jezweb.ai/mcp/{api-key}` will always provide exactly 22 tools and 13 resources.