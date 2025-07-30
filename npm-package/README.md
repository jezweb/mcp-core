# Universal OpenAI Assistants MCP Server (NPM Package)

A Model Context Protocol (MCP) server that provides comprehensive OpenAI Assistants API operations through stdio transport. This is the **recommended installation method** for most users, offering direct compatibility with Claude Desktop, Roo, and other MCP clients without requiring proxy servers.

**🆕 Complete Assistants API Coverage**: Now includes all 22 Assistants API tools for complete assistant, thread, message, and run management.

## 🌟 Part of the Universal MCP Server Ecosystem

This NPM package is one of **three deployment options** for the Universal OpenAI Assistants MCP Server:

1. **📦 NPM Package** (This package) - Direct stdio transport, no proxy required
2. **☁️ Cloudflare Workers** - Zero-setup cloud deployment
3. **🔧 Local Development** - Full source code access and customization

Choose the option that best fits your needs. See the [main repository](https://github.com/jezweb/openai-assistants-mcp) for all options.

## ✨ Features

- **22 Comprehensive Tools**: Complete OpenAI Assistants API coverage
- **Assistant Management**: Create, update, list, and delete assistants
- **Thread Management**: Full conversation thread lifecycle management
- **Message Management**: Create, list, update, and delete messages
- **Run Management**: Execute assistant runs with tool output support
- **Run Step Management**: Monitor and inspect run execution steps
- **Direct Stdio Transport**: No proxy servers required - fastest and most reliable
- **Universal Compatibility**: Works with Claude Desktop, Roo, and all MCP clients
- **TypeScript**: Full type safety and modern development experience
- **Zero Dependencies**: Lightweight with minimal runtime footprint
- **Easy Installation**: Simple `npx` usage or global installation
- **Comprehensive Testing**: Built-in test suite for validation
- **Environment Variable Support**: Secure API key management

## 🛠️ Available Tools (22 Total)

### Assistant Management (5 tools)
- `assistant-create` - Create a new OpenAI assistant with specified instructions and tools
- `assistant-list` - List all assistants with optional pagination and filtering
- `assistant-get` - Retrieve details of a specific assistant
- `assistant-update` - Update an existing assistant
- `assistant-delete` - Delete an assistant permanently

### Thread Management (4 tools)
- `thread-create` - Create a new conversation thread
- `thread-get` - Retrieve details of a specific thread
- `thread-update` - Update an existing thread
- `thread-delete` - Delete a thread permanently

### Message Management (5 tools)
- `message-create` - Add a message to a thread
- `message-list` - List messages in a thread with optional pagination
- `message-get` - Retrieve details of a specific message
- `message-update` - Update an existing message
- `message-delete` - Delete a message from a thread

### Run Management (6 tools)
- `run-create` - Start a new assistant run on a thread
- `run-list` - List runs for a thread with optional pagination
- `run-get` - Retrieve details of a specific run
- `run-update` - Update an existing run
- `run-cancel` - Cancel a running assistant execution
- `run-submit-tool-outputs` - Submit tool call results to continue a run

### Run Step Management (2 tools)
- `run-step-list` - List steps in a run execution
- `run-step-get` - Get details of a specific run step

## Installation

### Option 1: NPX (Recommended)
```bash
npx openai-assistants-mcp@latest
```

### Option 2: Global Installation
```bash
npm install -g openai-assistants-mcp@latest
openai-assistants-mcp
```

### Option 3: Local Installation
```bash
npm install openai-assistants-mcp@latest
npx openai-assistants-mcp@latest
```

**💡 Why use @latest?**
- Ensures you get the most recent bug fixes and improvements
- Bypasses NPM cache issues that can cause outdated versions
- Recommended for most reliable experience

## Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **OpenAI API Key**: Required for Assistants API operations (configured via MCP client)

## Configuration

### API Key Setup

**Important**: As of version 1.0.0, this package no longer requires environment variables to be set before startup. The API key is provided by your MCP client configuration and validated only when tools are called.

The server will start successfully without an API key and will only validate it when you actually use the assistants tools.

## 🔧 Client Integration

### Claude Desktop Setup

Add the following configuration to your Claude Desktop settings:

#### macOS
Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "openai-assistants": {
      "command": "npx",
      "args": ["openai-assistants-mcp@latest"],
      "env": {
        "OPENAI_API_KEY": "your-openai-api-key-here"
      }
    }
  }
}
```

#### Windows
Edit `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "openai-assistants": {
      "command": "npx",
      "args": ["openai-assistants-mcp@latest"],
      "env": {
        "OPENAI_API_KEY": "your-openai-api-key-here"
      }
    }
  }
}
```

#### Linux
Edit `~/.config/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "openai-assistants": {
      "command": "npx",
      "args": ["openai-assistants-mcp"],
      "env": {
        "OPENAI_API_KEY": "your-openai-api-key-here"
      }
    }
  }
}
```

### 🤖 Roo Integration

Roo users get the best experience with this NPM package due to direct stdio transport. Add the following to your Roo configuration:

#### Roo Configuration
Edit your Roo configuration file (typically `~/.config/roo/config.json`):

```json
{
  "mcpServers": {
    "openai-assistants": {
      "command": "npx",
      "args": ["openai-assistants-mcp@latest"],
      "env": {
        "OPENAI_API_KEY": "your-openai-api-key-here"
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

#### Why Roo Users Should Choose This Package

1. **No Proxy Required**: Direct stdio communication is faster and more reliable
2. **Automatic Tool Approval**: The `alwaysAllow` configuration prevents constant permission prompts
3. **Better Performance**: No HTTP overhead or network latency
4. **Simpler Setup**: No need to install or manage `mcp-proxy`
5. **Local Execution**: Full control over the server environment

#### Roo-Specific Features

- **Seamless Integration**: Works out-of-the-box with Roo's MCP implementation
- **Tool Auto-Approval**: Pre-configure all 22 tools to avoid interruptions
- **Environment Variables**: Secure API key management through environment variables
- **Debug Support**: Easy debugging with `DEBUG=*` environment variable

## 🖥️ Claude Code CLI Integration

Claude Code CLI users get excellent performance with this NPM package due to direct stdio transport. Add the MCP server using the command line interface:

### Basic Setup

```bash
# Add the MCP server with local scope (default - available only in current project)
claude mcp add openai-assistants -- npx openai-assistants-mcp@latest --env OPENAI_API_KEY="your-openai-api-key-here"

# Add with project scope (shared with team via .mcp.json file)
claude mcp add --scope project openai-assistants -- npx openai-assistants-mcp@latest --env OPENAI_API_KEY="your-openai-api-key-here"

# Add with user scope (available across all your projects)
claude mcp add --scope user openai-assistants -- npx openai-assistants-mcp@latest --env OPENAI_API_KEY="your-openai-api-key-here"
```

### Scope Options

- **`--scope local`** (default): Available only to you in the current project
- **`--scope project`**: Shared with everyone in the project via `.mcp.json` file
- **`--scope user`**: Available to you across all projects

### Managing MCP Servers

```bash
# List all configured servers
claude mcp list

# Get details for the server
claude mcp get openai-assistants

# Remove the server
claude mcp remove openai-assistants

# Check server status within Claude Code
/mcp
```

### Project-Level Configuration (.mcp.json)

When using `--scope project`, Claude Code creates a `.mcp.json` file in your project root:

```json
{
  "mcpServers": {
    "openai-assistants": {
      "command": "npx",
      "args": ["openai-assistants-mcp@latest"],
      "env": {
        "OPENAI_API_KEY": "${OPENAI_API_KEY}"
      }
    }
  }
}
```

**Environment Variable Expansion**: Claude Code supports `${VAR}` syntax for environment variables in `.mcp.json` files.

#### Why Claude Code CLI Users Should Choose This Package

1. **Direct Stdio Transport**: Fastest possible communication with no HTTP overhead
2. **Command-Line Management**: Easy server management with `claude mcp` commands
3. **Flexible Scoping**: Choose between local, project, or user-level configurations
4. **Environment Variable Support**: Secure API key management through environment variables
5. **Team Collaboration**: Share configurations via `.mcp.json` files

---

## 📖 Usage Examples

### Complete Assistant Workflow

#### Basic Assistant Creation and Usage
```
# 1. Create a new assistant
"Create an assistant named 'Code Helper' using gpt-4 with code interpreter tool"

# 2. Create a conversation thread
"Create a new thread for discussing Python programming"

# 3. Add a message to the thread
"Add a user message to the thread asking 'How do I create a list comprehension?'"

# 4. Run the assistant on the thread
"Start a run with the Code Helper assistant on this thread"

# 5. Monitor the run progress
"Get the status of the current run"

# 6. List all messages in the thread to see the response
"List all messages in this thread"
```

#### Advanced Assistant Management
```
# Create a specialized assistant
"Create an assistant named 'Data Analyst' using gpt-4 with file search and code interpreter tools"

# Update assistant instructions
"Update the Data Analyst assistant with new instructions about handling CSV files"

# List all your assistants
"Show me all my assistants"

# Get detailed information about an assistant
"Get details about the Data Analyst assistant"
```

### Thread and Message Management
```
# Create a thread with initial messages
"Create a thread with an initial user message asking about machine learning"

# Add multiple messages to a conversation
"Add an assistant message explaining neural networks to the thread"
"Add a user follow-up question about training data"

# Update message metadata
"Update the metadata for the last message to mark it as important"

# List messages with filtering
"List the last 10 messages in this thread"
"List messages from a specific run"
```

### Run Management and Tool Outputs
```
# Start a run with custom instructions
"Start a run with additional instructions to focus on Python examples"

# Monitor run execution
"List all runs for this thread"
"Get details about the current run including any required actions"

# Handle tool calls (when assistant needs external tools)
"Submit tool outputs for the function calls in the current run"

# Cancel a long-running execution
"Cancel the current run if it's taking too long"
```

### Run Step Inspection
```
# Monitor detailed execution steps
"List all steps in the current run to see what the assistant is doing"

# Get specific step details
"Get details about step 3 in the current run"

# Debug assistant behavior
"Show me all the steps to understand how the assistant processed my request"
```

## Testing

Run the built-in test suite to verify the server is working correctly:

```bash
cd npm-package
npm test
```

The test suite validates:
- Server initialization
- Tool listing (all 22 tools)
- Protocol compliance
- Error handling

## Development

### Building from Source

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the TypeScript code:
   ```bash
   npm run build
   ```
4. Run tests:
   ```bash
   npm test
   ```

### Project Structure

```
npm-package/
├── src/
│   ├── index.ts           # Main server entry point
│   ├── mcp-handler.ts     # MCP protocol handler
│   ├── openai-service.ts  # OpenAI API service
│   └── types.ts           # TypeScript type definitions
├── bin/
│   └── openai-assistants-mcp.js  # Executable script
├── dist/                  # Compiled JavaScript output
├── test/
│   └── test-stdio.js      # Test suite
└── package.json
```

## Error Handling

The server includes comprehensive error handling:

- **Invalid API Key**: Clear error message with setup instructions
- **Network Issues**: Automatic retry logic for transient failures
- **Invalid Parameters**: Detailed validation error messages
- **OpenAI API Errors**: Proper error code mapping and user-friendly messages

## 🛠️ Troubleshooting

### Common Issues

#### 1. "OPENAI_API_KEY environment variable is required" (when calling tools)
**Solution:**
This error now only appears when you try to use tools without configuring the API key in your MCP client. The server will start successfully without an API key.

Configure your API key in your MCP client configuration (see Client Integration section above).

#### 2. "Failed to start server" or "Command not found"
**Solutions:**
```bash
# Verify Node.js version (requires 18+)
node --version

# Update Node.js if needed (using nvm)
nvm install 18
nvm use 18

# Clear npm cache and reinstall
npm cache clean --force
npm install -g openai-assistants-mcp

# Test direct execution
npx openai-assistants-mcp --version
```

#### 3. "Connection timeout" or "Network errors"
**Solutions:**
- Verify internet connectivity
- Check if OpenAI API is accessible: `curl https://api.openai.com/v1/models`
- Test your API key: `curl -H "Authorization: Bearer YOUR_KEY" https://api.openai.com/v1/models`
- Check firewall/proxy settings

#### 4. Roo-Specific Issues

**"Permission denied" or constant approval prompts:**
```json
{
  "mcpServers": {
    "openai-assistants": {
      "command": "npx",
      "args": ["openai-assistants-mcp"],
      "env": {
        "OPENAI_API_KEY": "your-key"
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

**Tool names not recognized:**
- Ensure exact tool names are used in `alwaysAllow`
- Restart Roo after configuration changes
- Check Roo logs for specific error messages

#### 5. Claude Desktop Issues

**"Server not responding" or "MCP server failed":**
```bash
# Test the server independently (should start without API key)
npx openai-assistants-mcp

# Check Claude Desktop logs (macOS)
tail -f ~/Library/Logs/Claude/claude_desktop.log

# Verify configuration file syntax
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | python -m json.tool
```

### Debug Mode

#### Basic Debug
```bash
DEBUG=* npx openai-assistants-mcp
```

#### Specific Debug Categories
```bash
# MCP protocol debugging
DEBUG=mcp:* npx openai-assistants-mcp

# OpenAI API debugging
DEBUG=openai:* npx openai-assistants-mcp

# All debugging
DEBUG=* npx openai-assistants-mcp 2>&1 | tee debug.log
```

Note: The server will start successfully without an API key. API key validation only occurs when tools are called.

## Security Considerations

- **API Key Protection**: Never commit API keys to version control
- **Environment Variables**: Use environment variables for sensitive configuration
- **Network Security**: The server only communicates with OpenAI's official API endpoints
- **Input Validation**: All inputs are validated before processing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the troubleshooting section above
- Review the test output for specific error details
- Ensure your OpenAI API key has the necessary permissions for Assistants API operations

## Related Projects

- [MCP Specification](https://modelcontextprotocol.io/)
- [OpenAI Assistants API Documentation](https://platform.openai.com/docs/api-reference/assistants)
- [Claude Desktop](https://claude.ai/desktop)

---
