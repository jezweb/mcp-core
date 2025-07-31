# 📚 Enhanced Usage Examples - OpenAI Assistants MCP Server

## 🌟 Enhanced Features Overview

This guide showcases the **enhanced OpenAI Assistants MCP Server** with:
- **9 MCP Resources** - Templates, workflows, and documentation
- **Enhanced Tool Descriptions** - Workflow-oriented guidance with examples
- **Improved Validation** - Actionable error messages with documentation references
- **Tool Annotations** - Better client understanding and user experience

## 🌐 Live Deployment URL
```
https://openai-assistants-mcp.webfonts.workers.dev
```

## 🚀 Quick Start Examples

### 📦 Option 1: NPM Package (Recommended - Direct Stdio)

#### Installation Options

```bash
# Option A: Use directly with npx (recommended for latest fixes)
npx openai-assistants-mcp@latest

# Option B: Install globally
npm install -g openai-assistants-mcp@latest

# Option C: Install locally in your project
npm install openai-assistants-mcp@latest
```

#### Claude Desktop Configuration (NPM Package)

Add this to your `claude_desktop_config.json`:

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

#### Roo Configuration (NPM Package)

Add this to your Roo configuration:

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

#### Claude Code CLI Configuration (NPM Package)

```bash
# Add with local scope (default - available only in current project)
claude mcp add openai-assistants -- npx openai-assistants-mcp@latest --env OPENAI_API_KEY="your-openai-api-key-here"

# Add with project scope (shared with team via .mcp.json file)
claude mcp add --scope project openai-assistants -- npx openai-assistants-mcp@latest --env OPENAI_API_KEY="your-openai-api-key-here"

# Add with user scope (available across all your projects)
claude mcp add --scope user openai-assistants -- npx openai-assistants-mcp@latest --env OPENAI_API_KEY="your-openai-api-key-here"
```

#### Direct NPM Package Testing

```bash
# Test stdio transport directly
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | npx openai-assistants-mcp@latest

# Test with environment variable
OPENAI_API_KEY=your-key-here echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | npx openai-assistants-mcp@latest
```

---

### ☁️ Option 2: Cloudflare Workers (Zero Setup)

#### Claude Desktop Configuration (Cloudflare Workers)

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "openai-assistants": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch", "https://openai-assistants-mcp.webfonts.workers.dev/mcp/YOUR_OPENAI_API_KEY"]
    }
  }
}
```

#### Roo Configuration (Cloudflare Workers)

Add this to your Roo configuration:

```json
{
  "mcpServers": {
    "openai-assistants": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch", "https://openai-assistants-mcp.webfonts.workers.dev/mcp/YOUR_OPENAI_API_KEY"]
    }
  }
}
```

---

## 📚 MCP Resources Examples

### List All Available Resources

```bash
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "resources/list",
    "params": {}
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resources": [
      {
        "uri": "assistant://templates/coding-assistant",
        "name": "Coding Assistant Template",
        "description": "Pre-configured template for a coding assistant with code review and debugging capabilities",
        "mimeType": "application/json"
      },
      {
        "uri": "examples://workflows/create-and-run",
        "name": "Complete Create and Run Workflow",
        "description": "Step-by-step example of creating an assistant, thread, and running a conversation",
        "mimeType": "text/markdown"
      },
      {
        "uri": "docs://best-practices",
        "name": "Best Practices Guide",
        "description": "Guidelines for optimal usage, performance, security, and cost optimization",
        "mimeType": "text/markdown"
      }
    ]
  }
}
```

### Access Assistant Templates

#### Get Coding Assistant Template
```bash
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "resources/read",
    "params": {
      "uri": "assistant://templates/coding-assistant"
    }
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "contents": [
      {
        "uri": "assistant://templates/coding-assistant",
        "mimeType": "application/json",
        "text": "{\n  \"model\": \"gpt-4\",\n  \"name\": \"Coding Assistant\",\n  \"description\": \"A specialized assistant for code review, debugging, and programming help\",\n  \"instructions\": \"You are an expert coding assistant...\",\n  \"tools\": [{\"type\": \"code_interpreter\"}, {\"type\": \"file_search\"}],\n  \"metadata\": {\"category\": \"development\", \"use_case\": \"code_assistance\"}\n}"
      }
    ]
  }
}
```

#### Use Template to Create Assistant
```bash
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "assistant-create",
      "arguments": {
        "model": "gpt-4",
        "name": "My Coding Assistant",
        "description": "A specialized assistant for code review, debugging, and programming help",
        "instructions": "You are an expert coding assistant with deep knowledge of multiple programming languages, frameworks, and best practices. Your role is to help with code review, debug issues, explain concepts clearly, recommend best practices, and assist with optimization.",
        "tools": [
          {"type": "code_interpreter"},
          {"type": "file_search"}
        ],
        "metadata": {
          "category": "development",
          "use_case": "code_assistance",
          "created_from": "template"
        }
      }
    }
  }'
```

### Access Workflow Examples

#### Get Complete Workflow Guide
```bash
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "resources/read",
    "params": {
      "uri": "examples://workflows/create-and-run"
    }
  }'
```

### Access Documentation Resources

#### Get Best Practices Guide
```bash
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 5,
    "method": "resources/read",
    "params": {
      "uri": "docs://best-practices"
    }
  }'
```

#### Get Error Handling Guide
```bash
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 6,
    "method": "resources/read",
    "params": {
      "uri": "docs://error-handling"
    }
  }'
```

---

## 🔍 Enhanced Error Handling Examples

### Invalid ID Format Error

**Request with Invalid ID:**
```bash
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 7,
    "method": "tools/call",
    "params": {
      "name": "assistant-get",
      "arguments": {
        "assistant_id": "invalid-id"
      }
    }
  }'
```

**Enhanced Error Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Invalid assistant ID format for parameter 'assistant_id'. Expected 'asst_' followed by 24 characters (e.g., 'asst_abc123def456ghi789jkl012'), but received: 'invalid-id'. See docs://openai-assistants-api for ID format specifications.",
        "isError": true
      }
    ]
  }
}
```

### Missing Required Parameter Error

**Request Missing Model:**
```bash
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 8,
    "method": "tools/call",
    "params": {
      "name": "assistant-create",
      "arguments": {
        "name": "Test Assistant"
      }
    }
  }'
```

**Enhanced Error Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 8,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Required parameter 'model' is missing. Specify a supported model like 'gpt-4', 'gpt-4-turbo', or 'gpt-3.5-turbo'. See docs://openai-assistants-api for the complete list of supported models.",
        "isError": true
      }
    ]
  }
}
```

### Parameter Relationship Error

**Request with Tool/Resource Mismatch:**
```bash
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 9,
    "method": "tools/call",
    "params": {
      "name": "assistant-create",
      "arguments": {
        "model": "gpt-4",
        "tools": [{"type": "code_interpreter"}],
        "tool_resources": {
          "file_search": {
            "vector_store_ids": ["vs_123"]
          }
        }
      }
    }
  }'
```

**Enhanced Error Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 9,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Cannot specify 'file_search' in 'tool_resources' without including file_search tool in tools array. Add {\"type\": \"file_search\"} to tools or remove file_search from tool_resources. See docs://best-practices for configuration guidance.",
        "isError": true
      }
    ]
  }
}
```

---

## 💻 Direct API Examples

### Initialize Connection

```bash
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "my-client",
        "version": "1.0.0"
      }
    }
  }'
```

### List All Available Tools

```bash
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'
```

## 🤖 Complete Assistant Workflow

### Step 1: Create an Assistant

```bash
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "assistant-create",
      "arguments": {
        "model": "gpt-4",
        "name": "Code Helper",
        "description": "A helpful coding assistant",
        "instructions": "You are an expert programmer who helps with coding tasks. Provide clear, well-commented code examples and explain your reasoning.",
        "tools": [
          {"type": "code_interpreter"}
        ],
        "metadata": {
          "project": "demo",
          "version": "1.0"
        }
      }
    }
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"id\": \"asst_abc123\",\n  \"object\": \"assistant\",\n  \"created_at\": 1640995200,\n  \"name\": \"Code Helper\",\n  \"description\": \"A helpful coding assistant\",\n  \"model\": \"gpt-4\",\n  \"instructions\": \"You are an expert programmer...\",\n  \"tools\": [{\"type\": \"code_interpreter\"}],\n  \"metadata\": {\"project\": \"demo\", \"version\": \"1.0\"}\n}"
      }
    ]
  }
}
```

### Step 2: Create a Thread

```bash
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "thread-create",
      "arguments": {
        "metadata": {
          "user": "demo-user",
          "session": "coding-help"
        }
      }
    }
  }'
```

### Step 3: Add a Message

```bash
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 5,
    "method": "tools/call",
    "params": {
      "name": "message-create",
      "arguments": {
        "thread_id": "thread_abc123",
        "role": "user",
        "content": "Can you help me write a Python function to calculate the factorial of a number?"
      }
    }
  }'
```

### Step 4: Run the Assistant

```bash
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 6,
    "method": "tools/call",
    "params": {
      "name": "run-create",
      "arguments": {
        "thread_id": "thread_abc123",
        "assistant_id": "asst_abc123",
        "instructions": "Please provide a clear, well-commented solution."
      }
    }
  }'
```

### Step 5: Check Run Status

```bash
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 7,
    "method": "tools/call",
    "params": {
      "name": "run-get",
      "arguments": {
        "thread_id": "thread_abc123",
        "run_id": "run_abc123"
      }
    }
  }'
```

### Step 6: Get Messages (Including Assistant Response)

```bash
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 8,
    "method": "tools/call",
    "params": {
      "name": "message-list",
      "arguments": {
        "thread_id": "thread_abc123",
        "order": "asc"
      }
    }
  }'
```

## 📋 Management Examples

### List All Assistants

```bash
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 9,
    "method": "tools/call",
    "params": {
      "name": "assistant-list",
      "arguments": {
        "limit": 10,
        "order": "desc"
      }
    }
  }'
```

### Update Assistant

```bash
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 10,
    "method": "tools/call",
    "params": {
      "name": "assistant-update",
      "arguments": {
        "assistant_id": "asst_abc123",
        "name": "Advanced Code Helper",
        "instructions": "You are an expert programmer who helps with complex coding tasks. Always provide optimized, production-ready code.",
        "tools": [
          {"type": "code_interpreter"},
          {"type": "file_search"}
        ]
      }
    }
  }'
```

### Delete Assistant

```bash
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 11,
    "method": "tools/call",
    "params": {
      "name": "assistant-delete",
      "arguments": {
        "assistant_id": "asst_abc123"
      }
    }
  }'
```

## 🔄 Advanced Run Management

### Cancel a Running Execution

```bash
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 12,
    "method": "tools/call",
    "params": {
      "name": "run-cancel",
      "arguments": {
        "thread_id": "thread_abc123",
        "run_id": "run_abc123"
      }
    }
  }'
```

### Submit Tool Outputs

```bash
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 13,
    "method": "tools/call",
    "params": {
      "name": "run-submit-tool-outputs",
      "arguments": {
        "thread_id": "thread_abc123",
        "run_id": "run_abc123",
        "tool_outputs": [
          {
            "tool_call_id": "call_abc123",
            "output": "The calculation result is 42"
          }
        ]
      }
    }
  }'
```

### List Run Steps

```bash
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 14,
    "method": "tools/call",
    "params": {
      "name": "run-step-list",
      "arguments": {
        "thread_id": "thread_abc123",
        "run_id": "run_abc123"
      }
    }
  }'
```

## 🌐 JavaScript/TypeScript Integration

### Basic Client Implementation

```javascript
class OpenAIAssistantsMCP {
  constructor(apiKey) {
    this.baseUrl = 'https://openai-assistants-mcp.webfonts.workers.dev';
    this.apiKey = apiKey;
  }

  async call(method, params = {}) {
    const response = await fetch(`${this.baseUrl}/mcp/${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Math.random(),
        method,
        params
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`MCP Error: ${data.error.message}`);
    }
    return data.result;
  }

  async callTool(name, arguments_) {
    return this.call('tools/call', { name, arguments: arguments_ });
  }

  // Assistant methods
  async createAssistant(config) {
    return this.callTool('assistant-create', config);
  }

  async listAssistants(options = {}) {
    return this.callTool('assistant-list', options);
  }

  async getAssistant(assistantId) {
    return this.callTool('assistant-get', { assistant_id: assistantId });
  }

  // Thread methods
  async createThread(config = {}) {
    return this.callTool('thread-create', config);
  }

  async getThread(threadId) {
    return this.callTool('thread-get', { thread_id: threadId });
  }

  // Message methods
  async createMessage(threadId, role, content, metadata = {}) {
    return this.callTool('message-create', {
      thread_id: threadId,
      role,
      content,
      metadata
    });
  }

  async listMessages(threadId, options = {}) {
    return this.callTool('message-list', {
      thread_id: threadId,
      ...options
    });
  }

  // Run methods
  async createRun(threadId, assistantId, options = {}) {
    return this.callTool('run-create', {
      thread_id: threadId,
      assistant_id: assistantId,
      ...options
    });
  }

  async getRun(threadId, runId) {
    return this.callTool('run-get', {
      thread_id: threadId,
      run_id: runId
    });
  }

  async waitForRun(threadId, runId, maxWait = 60000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      const run = await this.getRun(threadId, runId);
      const runData = JSON.parse(run.content[0].text);
      
      if (['completed', 'failed', 'cancelled', 'expired'].includes(runData.status)) {
        return runData;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Run timeout');
  }
}

// Usage example
const client = new OpenAIAssistantsMCP('your-api-key');

async function example() {
  try {
    // Create assistant
    const assistant = await client.createAssistant({
      model: 'gpt-4',
      name: 'Demo Assistant',
      instructions: 'You are a helpful assistant.'
    });
    
    const assistantData = JSON.parse(assistant.content[0].text);
    console.log('Created assistant:', assistantData.id);
    
    // Create thread
    const thread = await client.createThread();
    const threadData = JSON.parse(thread.content[0].text);
    console.log('Created thread:', threadData.id);
    
    // Add message
    await client.createMessage(threadData.id, 'user', 'Hello, how are you?');
    
    // Run assistant
    const run = await client.createRun(threadData.id, assistantData.id);
    const runData = JSON.parse(run.content[0].text);
    
    // Wait for completion
    const completedRun = await client.waitForRun(threadData.id, runData.id);
    console.log('Run completed:', completedRun.status);
    
    // Get messages
    const messages = await client.listMessages(threadData.id);
    const messagesData = JSON.parse(messages.content[0].text);
    console.log('Messages:', messagesData.data.length);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

example();
```

---

## 🎯 Using Enhanced Features in MCP Clients

### Claude Desktop Examples

#### Accessing Assistant Templates
```
"Show me the coding assistant template"
"Use the data analyst template to create a new assistant"
"What configuration does the customer support template use?"
```

#### Following Workflow Examples
```
"Walk me through the complete create and run workflow"
"Show me how to implement batch processing"
"What are the steps for setting up a conversation thread?"
```

#### Getting Documentation Help
```
"Show me the best practices guide"
"What are common error handling patterns?"
"Display the API reference documentation"
```

### Roo Integration Examples

#### Resource-Aware Conversations
```
"Create a coding assistant using the template, then help me review this Python code"
"Follow the batch processing workflow to handle multiple content creation tasks"
"Use the error handling guide to troubleshoot this validation issue"
```

#### Template-Based Assistant Creation
```
"Use the writing assistant template to create an assistant for blog posts"
"Create a data analyst assistant and analyze this CSV data"
"Set up a customer support assistant for handling product inquiries"
```

---

## 🛠️ Enhanced Troubleshooting Guide

### Common Issues and Enhanced Solutions

#### Issue 1: "Assistant not found" Error
**Enhanced Error Message:**
```
Invalid assistant ID format for parameter 'assistant_id'.
Expected 'asst_' followed by 24 characters (e.g., 'asst_abc123def456ghi789jkl012'),
but received: 'asst_123'.
See docs://openai-assistants-api for ID format specifications.
```

**Solution Steps:**
1. Check the assistant ID format
2. Use `assistant-list` to get valid IDs
3. Ensure the ID has the correct prefix and length
4. Reference the API documentation for format specifications

#### Issue 2: Tool Configuration Problems
**Enhanced Error Message:**
```
Tool at index 0 has invalid type 'invalid_tool'.
Allowed types: code_interpreter, file_search, function.
Example: {"type": "code_interpreter"}.
See assistant://templates for tool examples.
```

**Solution Steps:**
1. Use only supported tool types
2. Check assistant templates for correct configurations
3. Ensure tool_resources match enabled tools
4. Reference the best practices guide

#### Issue 3: Parameter Validation Failures
**Enhanced Error Message:**
```
Parameter 'limit' must be between 1 and 100 (inclusive), but received: 150.
Adjust the value to be within the valid range.
See docs://openai-assistants-api for parameter limits.
```

**Solution Steps:**
1. Check parameter ranges in the documentation
2. Use default values when unsure
3. Implement pagination for large datasets
4. Reference validation guide for all parameter rules

### Debugging with Enhanced Features

#### 1. Use Resource Documentation
```bash
# Get comprehensive error handling guide
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "resources/read",
    "params": {"uri": "docs://error-handling"}
  }'
```

#### 2. Reference Assistant Templates
```bash
# Get working configuration examples
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "resources/read",
    "params": {"uri": "assistant://templates/coding-assistant"}
  }'
```

#### 3. Follow Workflow Examples
```bash
# Get step-by-step guidance
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "resources/read",
    "params": {"uri": "examples://workflows/create-and-run"}
  }'
```

---

## 🔍 Error Handling Examples

### Invalid API Key

```bash
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/invalid-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": null,
  "error": {
    "code": -32600,
    "message": "Invalid or missing API key"
  }
}
```

### Invalid Method

```bash
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "invalid-method",
    "params": {}
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32601,
    "message": "Method not found: invalid-method"
  }
}
```

### Missing Required Parameters

```bash
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/your-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "assistant-create",
      "arguments": {
        "name": "Test Assistant"
      }
    }
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Error: Missing required parameter: model",
        "isError": true
      }
    ]
  }
}
```

---

## 🎯 Enhanced Best Practices

### 1. **Leverage Enhanced Features**
- **Use Templates**: Start with assistant templates for faster setup
- **Follow Workflows**: Reference workflow examples for complex operations
- **Read Documentation**: Access built-in documentation resources for guidance

### 2. **Enhanced Error Handling**
- **Read Error Messages**: Enhanced messages provide specific guidance
- **Follow Documentation Links**: Error messages include helpful resource references
- **Use Examples**: Error messages include format examples and suggestions

### 3. **Resource Utilization**
- **Template-Based Development**: Use assistant templates as starting points
- **Workflow-Driven Implementation**: Follow workflow examples for best practices
- **Documentation-First Approach**: Reference documentation resources before implementation

### 4. **Validation Best Practices**
- **Pre-validate Parameters**: Use validation patterns from the validation guide
- **Understand Relationships**: Ensure tool/resource consistency
- **Reference Examples**: Use templates and documentation for correct formats

### 5. **API Key Security**
- Never expose API keys in client-side code
- Use environment variables for API keys
- Rotate API keys regularly

### 6. **Resource Management**
- Clean up unused assistants and threads
- Monitor your OpenAI usage dashboard
- Use metadata for organization and tracking

### 7. **Performance Optimization**
- Use pagination for large lists
- Cache assistant and thread IDs
- Monitor run status efficiently
- Leverage resource caching for frequently accessed documentation

## 🚀 Ready to Use!

The OpenAI Assistants MCP Server is now live and ready for production use. All 22 tools are fully functional and tested. Start building amazing AI-powered applications today!

**Live URL**: `https://openai-assistants-mcp.webfonts.workers.dev`