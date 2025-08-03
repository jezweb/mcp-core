# Jezweb MCP Core v3.0.1 - Adaptable Multi-Provider Architecture

A production-ready Model Context Protocol (MCP) server featuring an **adaptable, provider-agnostic architecture** that supports multiple LLM providers through a unified interface. Built with a **"Shared Core with Thin Adapters" architecture** for maximum flexibility and simplicity.

## 🌟 Universal MCP Server - Three Ways to Connect

Choose the deployment option that best fits your needs:

### 🚀 Option 1: Cloudflare Workers (Production Ready - v3.0 Unified Architecture)
**Production URL**: `https://jezweb-mcp-core.jezweb.ai/mcp/{api-key}`
- ✅ **Adaptable Architecture** - Support for multiple LLM providers (OpenAI, Claude, etc.)
- ✅ **Simple Configuration** - Environment-first configuration, no complex setup
- ✅ **Lightweight & Fast** - Sub-100ms response times with global edge distribution
- ✅ **Zero Dependencies** - No local setup required
- ✅ **LIVE & OPERATIONAL** - v3.0 unified architecture deployed and tested

### 📦 Option 2: NPM Package (Local Stdio - v3.0 Deployment Adapter)
**Package**: `jezweb-mcp-core@3.0.1`
- ✅ **Provider-Agnostic** - Unified core with deployment-specific adapter
- ✅ **Simple Configuration** - Environment variables and sensible defaults
- ✅ **Direct stdio transport** - No proxy required
- ✅ **Local execution** - Full control over environment
- ✅ **100% Backward Compatible** - Seamless upgrade from OpenAI-specific versions

### 🔧 Option 3: Local Development Server
**Local Build**: Clone and run locally
- ✅ Full source code access
- ✅ Customizable implementation
- ✅ Development and testing
- ✅ Private deployment options

## ✨ Key Features - Jezweb MCP Core v3.0

### 🏗️ **Adaptable Multi-Provider Architecture**
- **Provider-Agnostic Design** - Support for OpenAI, Anthropic Claude, Google, and more
- **Extensible Provider System** - Easy to add new LLM providers
- **Unified Interface** - Same tools and resources across all providers
- **Smart Provider Selection** - Automatic fallback and load balancing
- **Simple Configuration** - Environment-first setup with sensible defaults

### 🚀 Core Capabilities
- **Complete Assistant API Coverage** - All 22 tools for full assistant, thread, message, and run management
- **Universal Deployment** - Three deployment options with identical functionality
- **Production Ready** - Deployed on Cloudflare Workers with modern architecture
- **Lightweight** - Minimal dependencies and fast execution
- **Type Safe** - Full TypeScript implementation with comprehensive type definitions

### 🎯 Enhanced User Experience
- **Enhanced Tool Descriptions** - Workflow-oriented descriptions with practical examples
- **MCP Resources** - 9 comprehensive resources including templates, workflows, and documentation
- **Improved Validation** - Detailed error messages with examples and suggestions
- **Tool Annotations** - Proper MCP annotations for better client understanding
- **Assistant Templates** - Pre-configured templates for common use cases

### 🔧 Technical Excellence
- **Secure Authentication** - URL-based API key authentication (Workers) or environment variables (NPM)
- **Advanced Error Handling** - Context-aware error messages with actionable guidance
- **CORS Support** - Ready for web-based MCP clients
- **Real-time Operations** - Support for streaming and real-time assistant interactions
- **Comprehensive Testing** - Built-in test suites for both deployment options

## 📊 Architecture Overview

### Provider System
Jezweb MCP Core uses a sophisticated provider registry system that abstracts away provider-specific details:

```typescript
// Multiple providers supported
const providers = {
  openai: { /* OpenAI configuration */ },
  anthropic: { /* Claude configuration */ },
  google: { /* Gemini configuration */ }
};

// Automatic provider selection
const provider = registry.selectProvider({
  strategy: 'capability-based',
  requiredCapabilities: ['assistants', 'threads']
});
```

### Simple Configuration
Environment-first configuration with sensible defaults:

```bash
# Cloudflare Workers - via Wrangler secrets
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY

# NPM Package - via environment variables
export OPENAI_API_KEY="your-key-here"
export ANTHROPIC_API_KEY="your-key-here"
```

### Unified Architecture
```
shared/                    # Unified shared core (single source of truth)
├── core/                  # Core business logic and handlers
├── services/              # Provider registry and LLM service abstraction
│   ├── llm-service.ts     # Generic LLM provider interface
│   ├── provider-registry.ts # Provider management and selection
│   └── providers/         # Individual provider implementations
└── types/                 # Unified type definitions

src/                       # Cloudflare Workers deployment
├── worker.ts              # Cloudflare Workers entry point
└── mcp-handler.ts         # Worker-specific MCP handler

npm-package/               # NPM package deployment
├── src/                   # NPM-specific implementation
└── universal-mcp-server.cjs # NPM package entry point
```

## 🚀 Quick Start - Choose Your Installation Method

### Prerequisites

- API key for your chosen LLM provider (OpenAI, Anthropic, etc.)
- Node.js 18+ (for NPM package or local development)
- MCP client (Claude Desktop, Roo, or other MCP-compatible client)

### 🔑 Getting Started with LLM Providers

#### OpenAI Setup
- Visit the [OpenAI API Keys page](https://platform.openai.com/api-keys)
- Create a new API key
- Monitor usage at [OpenAI Dashboard](https://platform.openai.com/usage)

#### Anthropic Claude Setup
- Visit the [Anthropic Console](https://console.anthropic.com/)
- Create an API key
- Review [Claude API documentation](https://docs.anthropic.com/)

---

## 📦 Option 1: NPM Package (Recommended for Most Users)

### Installation

```bash
# Option A: Use directly with npx (recommended for latest fixes)
npx jezweb-mcp-core@latest

# Option B: Install globally
npm install -g jezweb-mcp-core@latest

# Option C: Install locally in your project
npm install jezweb-mcp-core@latest
```

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "jezweb-mcp-core": {
      "command": "npx",
      "args": ["jezweb-mcp-core@latest"],
      "env": {
        "OPENAI_API_KEY": "your-openai-api-key-here",
        "ANTHROPIC_API_KEY": "your-anthropic-api-key-here"
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
    "jezweb-mcp-core": {
      "command": "npx",
      "args": [
        "mcp-proxy",
        "https://openai-assistants-mcp.jezweb.ai/mcp/YOUR_OPENAI_API_KEY_HERE"
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
git clone https://github.com/jezweb/jezweb-mcp-core.git
cd jezweb-mcp-core
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Add your API keys to wrangler.toml or use wrangler secrets
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY
```

4. Start development server:
```bash
npm run dev
```

---

## 🛠️ Available Tools

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

---

## 📚 MCP Resources Available

This server provides **9 comprehensive MCP resources** to help you get started quickly:

### 🎯 Assistant Templates (4 resources)
- **`assistant://templates/coding-assistant`** - Pre-configured coding assistant
- **`assistant://templates/writing-assistant`** - Professional writing assistant
- **`assistant://templates/data-analyst`** - Data analysis assistant
- **`assistant://templates/customer-support`** - Customer support assistant

### 🔄 Workflow Examples (2 resources)
- **`examples://workflows/create-and-run`** - Complete workflow examples
- **`examples://workflows/batch-processing`** - Efficient batch processing

### 📖 Documentation (3 resources)
- **`docs://jezweb-mcp-core-api`** - Comprehensive API reference
- **`docs://error-handling`** - Common errors and solutions
- **`docs://best-practices`** - Guidelines for optimal usage

---

## 📖 Enhanced Usage Examples

### Multi-Provider Usage

```
# Create an assistant (automatically selects best available provider)
"Create an assistant named 'Code Helper' with instructions to help with programming tasks"

# Use specific provider
"Create an assistant using OpenAI's GPT-4 model"
"Create an assistant using Anthropic's Claude model"
```

### Assistant Management

```
# List all assistants
"List my assistants"

# Get assistant details
"Get details of assistant asst_abc123"

# Update an assistant
"Update assistant asst_abc123 to include the code_interpreter tool"
```

### Thread and Message Management

```
# Create a new thread
"Create a new conversation thread"

# Add a message to a thread
"Add the message 'Hello, how can you help me?' to thread thread_abc123"

# List messages in a thread
"List all messages in thread thread_abc123"
```

### Run Management

```
# Start an assistant run
"Start a run with assistant asst_abc123 on thread thread_abc123"

# Get run status
"Get status of run run_abc123"

# Cancel a running execution
"Cancel run run_abc123"
```

---

## 🔄 Deployment Option Parity

All deployment options provide **identical functionality** with all 22 tools working seamlessly:

### ✅ Functional Parity
- **Identical Tools**: All 22 tools work exactly the same way
- **Same API Surface**: Identical tool names, parameters, and responses
- **Consistent Behavior**: Error handling, validation, and responses are uniform
- **Multi-Provider Support**: All deployment options support multiple LLM providers

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

---

## 🏗️ Architecture - Provider-Agnostic Design

### Core Design Principles

- **Adaptable** - Support for multiple LLM providers through unified interface
- **Simple** - Environment-first configuration with sensible defaults
- **Lightweight** - Minimal dependencies and fast execution
- **Extensible** - Easy to add new providers and capabilities
- **Reliable** - Comprehensive error handling and fallback mechanisms

### Provider System Architecture

```typescript
// Provider Registry manages multiple LLM providers
interface LLMProvider {
  createAssistant(request: GenericCreateAssistantRequest): Promise<GenericAssistant>;
  listAssistants(request?: GenericListRequest): Promise<GenericListResponse<GenericAssistant>>;
  // ... all assistant API methods
}

// Providers implement the same interface
class OpenAIProvider implements LLMProvider { /* ... */ }
class AnthropicProvider implements LLMProvider { /* ... */ }
class GoogleProvider implements LLMProvider { /* ... */ }
```

### Configuration System

Simple, environment-first configuration using standard environment variables:

```bash
# Required - at least one provider API key
export OPENAI_API_KEY="your-openai-key-here"
export ANTHROPIC_API_KEY="your-anthropic-key-here"

# Optional configuration
export JEZWEB_LOG_LEVEL="info"
export JEZWEB_DEFAULT_PROVIDER="openai"
```

The system automatically detects the deployment environment and applies appropriate defaults.

---

## 🧪 Testing Infrastructure - Modern Vitest Framework

### Comprehensive Test Suites

The project uses **Vitest** as the modern testing framework with comprehensive test coverage:

#### Available Test Commands
```bash
# Run all tests
npm test

# Run specific test categories
npm run test:unit              # Unit tests only
npm run test:integration       # Integration tests
npm run test:performance       # Performance tests
npm run test:error-handling    # Error handling tests
npm run test:edge-cases        # Edge case tests
npm run test:deployment        # Deployment tests

# Run specific deployment tests
npm run test:cloudflare        # Cloudflare Workers tests
npm run test:npm               # NPM package tests

# Development and debugging
npm run test:watch             # Watch mode for development
npm run test:ui                # Interactive UI for test exploration
npm run test:coverage          # Generate coverage reports
npm run test:debug             # Debug mode with inspector
npm run test:ci                # CI-optimized test run
```

#### Test Categories
- **Integration Tests**: All 22 tools across both deployment options
- **Performance Tests**: Response time and memory usage benchmarks
- **Error Handling Tests**: Comprehensive error scenario coverage
- **Edge Case Tests**: Boundary conditions and Unicode handling
- **Deployment Tests**: Cloudflare Workers and NPM package specific tests

### Manual Testing

Test the Cloudflare Workers deployment:

```bash
# List available tools
curl -X POST "https://openai-assistants-mcp.jezweb.ai/mcp/YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Test the NPM Package:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | npx jezweb-mcp-core@latest
```

---

## 🔧 Development

### Local Development

1. Clone and install:
```bash
git clone https://github.com/jezweb/jezweb-mcp-core.git
cd jezweb-mcp-core
npm install
```

2. Set up environment:
```bash
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY
```

3. Start development:
```bash
npm run dev
```

### Adding New Providers

1. Implement the `LLMProvider` interface
2. Create a provider factory
3. Register with the provider registry
4. Add configuration schema

Example:
```typescript
class MyCustomProvider implements LLMProvider {
  // Implement all required methods
}

const factory: LLMProviderFactory = {
  create: (config) => new MyCustomProvider(config),
  getMetadata: () => ({ name: 'my-provider', ... }),
  validateConfig: (config) => true
};

registry.registerFactory(factory);
```

---

## 🔍 Enhanced Validation & Error Handling

### Intelligent Error Messages
- **Format Examples**: Error messages include correct format examples
- **Documentation References**: Errors link to relevant documentation
- **Suggestion Guidance**: Invalid values show supported alternatives
- **Provider Context**: Errors include provider-specific guidance

### Validation Features
- **ID Format Validation**: Strict format checking with helpful messages
- **Provider Validation**: Validates provider availability and capabilities
- **Configuration Validation**: Comprehensive config validation
- **Parameter Validation**: Type and range checking with examples

---

## 🔒 Security

- **API Key Protection** - Secure handling of multiple provider API keys
- **Enhanced Input Validation** - Comprehensive validation with helpful feedback
- **Provider Isolation** - Each provider operates in isolation
- **CORS Security** - Proper CORS headers for web clients
- **Rate Limiting** - Inherits provider-specific rate limits

## 🚀 Performance

- **Global Edge** - Deployed on Cloudflare's global network
- **Sub-100ms** - Typical response times under 100ms
- **Provider Selection** - Smart provider selection for optimal performance
- **Efficient** - Minimal memory footprint and fast execution

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🎯 Migration Guide

### From Jezweb MCP Core v2.x

The migration is seamless - just update your package name:

```bash
# Old
npx jezweb-mcp-core@latest

# New
npx jezweb-mcp-core@latest
```

All existing tools and functionality remain identical. The new version adds multi-provider support while maintaining 100% backward compatibility.

### Configuration Migration

Old environment variables continue to work:
```bash
# Still supported
OPENAI_API_KEY=your-key-here

# New multi-provider support
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

---

**Ready to get started?** Choose your preferred installation method from the [Quick Start](#-quick-start---choose-your-installation-method) guide above and begin building with multiple LLM providers through a unified interface!