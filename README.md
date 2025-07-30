# OpenAI Assistants MCP Server

A production-ready Model Context Protocol (MCP) server that provides comprehensive OpenAI Assistants API access through multiple deployment options. This server enables AI assistants like Claude, Roo, and other MCP clients to manage assistants, threads, messages, and runs seamlessly.

## 🌟 Universal MCP Server - Three Ways to Connect

Choose the deployment option that best fits your needs:

### 🚀 Option 1: Cloudflare Workers (Production Ready)
**Production URL**: `https://openai-assistants-mcp.webfonts.workers.dev`
- ✅ Zero setup required
- ✅ Global edge distribution
- ✅ Sub-100ms response times
- ✅ No local dependencies
- ✅ **LIVE & OPERATIONAL** - Deployed and tested

### 📦 Option 2: NPM Package (Local Stdio)
**Package**: `openai-assistants-mcp`
- ✅ Direct stdio transport
- ✅ No proxy required
- ✅ Local execution
- ✅ Full control over environment

### 🔧 Option 3: Local Development Server
**Local Build**: Clone and run locally
- ✅ Full source code access
- ✅ Customizable implementation
- ✅ Development and testing
- ✅ Private deployment options

## ✨ Features

- **Complete Assistants API Coverage** - All 22 tools for full assistant, thread, message, and run management
- **Universal Deployment** - Three deployment options with identical functionality
- **Production Ready** - Deployed on Cloudflare Workers with global edge distribution
- **Zero Dependencies** - Lightweight implementation with no runtime dependencies
- **Type Safe** - Full TypeScript implementation with comprehensive type definitions
- **Secure Authentication** - URL-based API key authentication (Workers) or environment variables (NPM)
- **Error Handling** - Robust error handling with detailed error messages
- **CORS Support** - Ready for web-based MCP clients
- **Real-time Operations** - Support for streaming and real-time assistant interactions
- **Comprehensive Testing** - Built-in test suites for both deployment options

## 📊 Current Status

✅ **Phase 1 - COMPLETED** - Project structure setup and core architecture
✅ **Phase 2 - COMPLETED** - All 22 Assistants API tools implemented and tested
🎯 **Next Phase** - Advanced features and optimizations

**🎉 Deployment Parity Achieved**: Both Cloudflare Workers and NPM package now provide identical functionality with all 22 tools working seamlessly across both deployment options.

## 🛠️ Planned Tools

### Assistant Management
1. **assistant-create** - Create a new assistant with instructions and tools
2. **assistant-list** - List all assistants with pagination and sorting
3. **assistant-get** - Get detailed information about a specific assistant
4. **assistant-update** - Update assistant instructions, tools, or metadata
5. **assistant-delete** - Delete an assistant permanently

### Thread Management
6. **thread-create** - Create a new conversation thread
7. **thread-get** - Get thread details and metadata
8. **thread-update** - Update thread metadata
9. **thread-delete** - Delete a thread permanently

### Message Management
10. **message-create** - Add a message to a thread
11. **message-list** - List messages in a thread with pagination
12. **message-get** - Get details of a specific message
13. **message-update** - Update message metadata
14. **message-delete** - Delete a message from a thread

### Run Management
15. **run-create** - Start a new assistant run on a thread
16. **run-list** - List runs for a thread with filtering
17. **run-get** - Get run details and status
18. **run-update** - Update run metadata
19. **run-cancel** - Cancel a running assistant execution
20. **run-submit-tool-outputs** - Submit tool call results to continue a run

### Advanced Operations
21. **run-step-list** - List steps in a run execution
22. **run-step-get** - Get details of a specific run step

## 🚀 Quick Start - Choose Your Installation Method

### Prerequisites

- OpenAI API key with Assistants API access
- Node.js 18+ (for NPM package or local development)
- MCP client (Claude Desktop, Roo, or other MCP-compatible client)

### 🔑 Getting Started with OpenAI

Before using this MCP server, you'll need to set up your OpenAI account and API access:

#### 1. **Get Your OpenAI API Key**
- Visit the [OpenAI API Keys page](https://platform.openai.com/api-keys)
- Create a new API key or use an existing one
- Copy your API key (starts with `sk-proj-` or `sk-`)

#### 2. **Check Your Assistants Dashboard**
- Monitor your assistants at [OpenAI Assistants Dashboard](https://platform.openai.com/assistants)
- View usage, thread counts, and assistant configurations
- Track run executions and performance

#### 3. **Verify Assistants API Access**
- Ensure your account has access to the Assistants API
- Check your [OpenAI Usage Dashboard](https://platform.openai.com/usage) for API limits
- Review [OpenAI Pricing](https://openai.com/pricing) for assistants costs

#### 4. **Understand Assistants Limits**
- **Free Tier**: Limited assistant usage
- **Paid Tier**: Higher limits based on your plan
- **Thread Limits**: Check your account's thread quota
- **Message Limits**: Monitor message usage per thread

#### 📚 **Helpful OpenAI Resources**
- [Assistants API Documentation](https://platform.openai.com/docs/assistants/overview)
- [Assistants Playground](https://platform.openai.com/playground/assistants)
- [Thread Management Guide](https://platform.openai.com/docs/assistants/how-it-works/managing-threads-and-messages)
- [OpenAI Community Forum](https://community.openai.com/)

---

## 📦 Option 1: NPM Package (Recommended for Most Users)

### Installation

```bash
# Option A: Use directly with npx (recommended for latest fixes)
npx openai-assistants-mcp@latest

# Option B: Install globally
npm install -g openai-assistants-mcp@latest

# Option C: Install locally in your project
npm install openai-assistants-mcp@latest
```

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

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

### Roo Configuration

Add to your Roo configuration file:

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

---

## ☁️ Option 2: Cloudflare Workers (Zero Setup)

### Claude Desktop Configuration

1. Install the MCP proxy:
```bash
npm install -g mcp-proxy
```

2. Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "openai-assistants": {
      "command": "npx",
      "args": [
        "mcp-proxy",
        "https://openai-assistants-mcp.webfonts.workers.dev/mcp/YOUR_OPENAI_API_KEY_HERE"
      ]
    }
  }
}
```

---

## 🔧 Option 3: Local Development Server

### Setup

1. Clone the repository:
```bash
git clone https://github.com/jezweb/openai-assistants-mcp.git
cd openai-assistants-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Add your OpenAI API key to wrangler.toml or use wrangler secrets
wrangler secret put OPENAI_API_KEY
```

4. Start development server:
```bash
npm run dev
```

---

## 📖 Usage Examples

### Assistant Management

```
# Create a new assistant
"Create an assistant named 'Code Helper' with instructions to help with programming tasks"

# List all assistants
"List my assistants"

# Get assistant details
"Get details of assistant asst_abc123"

# Update an assistant
"Update assistant asst_abc123 to include the code_interpreter tool"

# Delete an assistant
"Delete assistant asst_abc123"
```

### Thread Management

```
# Create a new thread
"Create a new conversation thread"

# Get thread details
"Get details of thread thread_abc123"

# Update thread metadata
"Update thread thread_abc123 with metadata for project tracking"

# Delete a thread
"Delete thread thread_abc123"
```

### Message Management

```
# Add a message to a thread
"Add the message 'Hello, how can you help me?' to thread thread_abc123"

# List messages in a thread
"List all messages in thread thread_abc123"

# Get message details
"Get details of message msg_abc123"

# Update message metadata
"Update message msg_abc123 with metadata"
```

### Run Management

```
# Start an assistant run
"Start a run with assistant asst_abc123 on thread thread_abc123"

# Get run status
"Get status of run run_abc123"

# Cancel a running execution
"Cancel run run_abc123"

# Submit tool outputs
"Submit tool outputs for run run_abc123"
```

---

## 🔄 Deployment Option Parity

Both deployment options provide **identical functionality** with all 22 Assistants API tools working seamlessly across different transport mechanisms:

### ✅ Functional Parity
- **Identical Tools**: All 22 tools work exactly the same way in both deployments
- **Same API Surface**: Identical tool names, parameters, and responses
- **Consistent Behavior**: Error handling, validation, and responses are uniform
- **Feature Complete**: No functionality differences between deployment options

### 🚀 Transport Differences

| Feature | Cloudflare Workers | NPM Package |
|---------|-------------------|-------------|
| **Transport** | HTTP/SSE via mcp-proxy | Direct stdio |
| **Setup** | Zero setup required | Node.js 18+ required |
| **Performance** | Sub-100ms global edge | Direct process communication |
| **Dependencies** | No local dependencies | Local Node.js execution |
| **API Key** | URL-based authentication | Environment variable |
| **Scaling** | Automatic global scaling | Single process |
| **Offline** | Requires internet | Works offline (after setup) |

### 🎯 When to Use Each Option

#### Choose **Cloudflare Workers** when:
- You want zero setup and immediate usage
- You need global edge distribution and scaling
- You prefer cloud-based deployment
- You want to avoid local Node.js dependencies
- You're using web-based MCP clients

#### Choose **NPM Package** when:
- You want the fastest possible performance (direct stdio)
- You prefer local execution and control
- You're using Roo or other stdio-optimized clients
- You want to work offline after initial setup
- You need to customize the server implementation

### 🧪 Testing Parity
Both deployment options include comprehensive test suites that validate:
- All 22 tools function correctly
- MCP protocol compliance
- Error handling consistency
- API response formatting

---

## 🏗️ Architecture

### Clean Design Principles

- **Single Worker Pattern** - All functionality in one Cloudflare Worker
- **URL-Based Authentication** - Simple `/mcp/{api-key}` pattern
- **Direct HTTP Transport** - No complex proxy layers needed
- **Minimal Dependencies** - Only TypeScript types for development
- **Type Safety** - Comprehensive TypeScript throughout

### File Structure

```
src/
├── worker.ts              # Main Cloudflare Worker entry point
├── mcp-handler.ts         # MCP protocol implementation
├── types.ts               # TypeScript type definitions
└── services/
    └── openai-service.ts  # OpenAI Assistants API client wrapper
```

### Key Components

- **Worker** - Handles HTTP requests and CORS
- **MCP Handler** - Implements MCP protocol (initialize, tools/list, tools/call)
- **OpenAI Service** - Wraps OpenAI Assistants API calls
- **Types** - Comprehensive TypeScript definitions

---

## 🧪 Testing Infrastructure

### Comprehensive Test Suites

Both deployment options include robust testing infrastructure to ensure reliability and consistency:

#### NPM Package Testing
```bash
# Run the complete test suite
cd npm-package
npm test

# Test with debug output
DEBUG=* npm test
```

**Test Coverage:**
- ✅ Server initialization and startup
- ✅ MCP protocol compliance (initialize, tools/list, tools/call)
- ✅ All 22 tools validation
- ✅ Error handling and edge cases
- ✅ API key validation
- ✅ Input parameter validation
- ✅ Response format verification

#### Cloudflare Workers Testing
```bash
# Test the deployed worker
node test-validation-only.js

# Test assistant management specifically
node test-assistant-management.js
```

**Test Coverage:**
- ✅ HTTP endpoint functionality
- ✅ CORS handling
- ✅ URL-based API key authentication
- ✅ All 22 tools via HTTP transport
- ✅ Error response formatting
- ✅ Production deployment validation

### Manual Testing

Test the Cloudflare Workers deployment directly with curl:

```bash
# List available tools
curl -X POST "https://openai-assistants-mcp.webfonts.workers.dev/mcp/YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# Create an assistant
curl -X POST "https://openai-assistants-mcp.webfonts.workers.dev/mcp/YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "assistant-create",
      "arguments": {
        "name": "Test Assistant",
        "instructions": "You are a helpful assistant."
      }
    }
  }'
```

### Test the NPM Package directly:

```bash
# Test stdio transport
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | npx openai-assistants-mcp@latest
```

### Validation Process

Our testing process ensures deployment parity:

1. **Tool Enumeration**: Verify all 22 tools are available in both deployments
2. **Parameter Validation**: Test identical parameter handling across deployments
3. **Response Consistency**: Ensure identical response formats and error handling
4. **Protocol Compliance**: Validate MCP specification adherence
5. **Integration Testing**: Test with actual MCP clients (Claude Desktop, Roo)

---

## 🔧 Development

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/jezweb/openai-assistants-mcp.git
cd openai-assistants-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Add your OpenAI API key to wrangler.toml or use wrangler secrets
wrangler secret put OPENAI_API_KEY
```

4. Start development server:
```bash
npm run dev
```

### Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

The server will be available at your Cloudflare Workers domain.

---

## 🔒 Security

- **API Key Protection** - API keys are passed via URL path, not logged
- **Input Validation** - All inputs validated before processing
- **Error Handling** - Errors don't expose sensitive information
- **CORS Security** - Proper CORS headers for web clients
- **Rate Limiting** - Inherits OpenAI API rate limits

## 🚀 Performance

- **Global Edge** - Deployed on Cloudflare's global network
- **Sub-100ms** - Typical response times under 100ms
- **Zero Cold Start** - Cloudflare Workers eliminate cold starts
- **Efficient** - Minimal memory footprint and fast execution

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🎯 Roadmap

### Phase 1 - Project Setup ✅ COMPLETED
- [x] **Project Structure**: Set up repository and basic architecture
- [x] **Package Configuration**: Configure NPM package and Cloudflare Workers
- [x] **Documentation**: Create comprehensive README and setup guides
- [x] **Type Definitions**: Prepare TypeScript types for Assistants API

### Phase 2 - Core Implementation ✅ COMPLETED
- [x] **Assistant Tools**: All 5 assistant CRUD operations implemented
- [x] **Thread Tools**: All 4 thread management tools implemented
- [x] **Message Tools**: All 5 message operations implemented
- [x] **Run Tools**: All 6 run execution and management tools implemented
- [x] **Run Step Tools**: All 2 run step inspection tools implemented
- [x] **Error Handling**: Comprehensive error handling and validation
- [x] **Testing**: Complete test suites for both deployment options
- [x] **Deployment Parity**: Both Cloudflare Workers and NPM package provide identical functionality

### Phase 3 - Advanced Features 🔄 PLANNED
- [ ] **Streaming Support**: Real-time streaming for run executions
- [ ] **Tool Calling**: Advanced tool calling and function execution
- [ ] **File Attachments**: Support for file uploads and attachments
- [ ] **Advanced Filtering**: Enhanced search and filtering capabilities
- [ ] **Batch Operations**: Bulk operations for efficiency
- [ ] **Webhook Support**: Event notifications for long-running operations

### Phase 4 - Production Optimization 🔄 PLANNED
- [ ] **Performance Optimization**: Caching and performance improvements
- [ ] **Monitoring**: Comprehensive logging and monitoring
- [ ] **Documentation**: Complete API documentation and examples
- [ ] **Client Libraries**: Helper libraries for common use cases

---

**Ready to get started?** Choose your preferred installation method from the [Quick Start](#-quick-start-choose-your-installation-method) guide above and begin building with the OpenAI Assistants API!