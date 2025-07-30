# 📚 Usage Examples - OpenAI Assistants MCP Server

## 🌐 Live Deployment URL
```
https://openai-assistants-mcp.webfonts.workers.dev
```

## 🚀 Quick Start Examples

### 1. **Claude Desktop Configuration**

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

### 2. **Roo Configuration**

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

## 💻 Direct API Examples

### Initialize Connection

```bash
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/sk-your-api-key \
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
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/sk-your-api-key \
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
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/sk-your-api-key \
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
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/sk-your-api-key \
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
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/sk-your-api-key \
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
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/sk-your-api-key \
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
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/sk-your-api-key \
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
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/sk-your-api-key \
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
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/sk-your-api-key \
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
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/sk-your-api-key \
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
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/sk-your-api-key \
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
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/sk-your-api-key \
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
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/sk-your-api-key \
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
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/sk-your-api-key \
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
const client = new OpenAIAssistantsMCP('sk-your-api-key');

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
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/sk-your-api-key \
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
curl -X POST https://openai-assistants-mcp.webfonts.workers.dev/mcp/sk-your-api-key \
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

## 🎯 Best Practices

### 1. **Error Handling**
Always check for errors in responses and handle them appropriately.

### 2. **Rate Limiting**
Respect OpenAI's rate limits. The server inherits OpenAI's rate limiting.

### 3. **API Key Security**
- Never expose API keys in client-side code
- Use environment variables for API keys
- Rotate API keys regularly

### 4. **Resource Management**
- Clean up unused assistants and threads
- Monitor your OpenAI usage dashboard
- Use metadata for organization

### 5. **Performance**
- Use pagination for large lists
- Cache assistant and thread IDs
- Monitor run status efficiently

## 🚀 Ready to Use!

The OpenAI Assistants MCP Server is now live and ready for production use. All 22 tools are fully functional and tested. Start building amazing AI-powered applications today!

**Live URL**: `https://openai-assistants-mcp.webfonts.workers.dev`