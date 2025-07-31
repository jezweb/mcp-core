# 🎯 MCP Prompts Support - OpenAI Assistants MCP Server

This document describes the comprehensive MCP prompts support that has been added to the OpenAI Assistants MCP Server, following the official MCP prompts specification.

## 📋 Overview

The MCP prompts protocol enables clients to discover and use templated prompts provided by the server. This implementation includes:

- **prompts/list**: List all available prompts
- **prompts/get**: Get a specific prompt with generated messages
- **10 specialized prompt templates** for OpenAI Assistants workflows
- **Full MCP specification compliance**
- **Comprehensive error handling and validation**

## 🏗️ Architecture

### Core Components

1. **Prompt Templates** (`shared/prompts/prompt-templates.ts`)
   - Pre-defined prompt templates for common OpenAI Assistants tasks
   - Dynamic message generation based on user arguments
   - Categorized by functionality (assistant-creation, code-analysis, etc.)

2. **Prompt Registry** (`shared/prompts/prompt-registry.ts`)
   - Central registry for managing all available prompts
   - Validation and argument processing
   - Search and filtering capabilities

3. **Prompt Handlers** (`shared/core/handlers/prompt-handlers.ts`)
   - MCP protocol implementation for prompts/list and prompts/get
   - Following the established Strategy pattern
   - Integrated with the base MCP handler

4. **Type Definitions** (`shared/types/prompt-types.ts`)
   - Complete TypeScript types for MCP prompts protocol
   - Prompt template interfaces
   - Validation and execution context types

## 🎯 Available Prompts

### Assistant Creation Prompts

#### `create-coding-assistant`
Create a specialized coding assistant with custom instructions and tools.

**Arguments:**
- `specialization` (required): Programming specialization (e.g., "Python web development", "React frontend")
- `experience_level` (optional): Target experience level (beginner, intermediate, expert)
- `additional_tools` (optional): Additional tools to enable

**Example:**
```json
{
  "name": "create-coding-assistant",
  "arguments": {
    "specialization": "Python web development",
    "experience_level": "intermediate",
    "additional_tools": "code_interpreter"
  }
}
```

#### `create-data-analyst`
Generate a data analysis assistant with statistical and visualization capabilities.

**Arguments:**
- `domain` (required): Data analysis domain (e.g., "business intelligence", "scientific research")
- `tools_focus` (optional): Primary tools focus (python, r, sql, visualization)

#### `create-writing-assistant`
Generate a professional writing assistant for content creation and editing.

**Arguments:**
- `writing_type` (required): Type of writing (e.g., "technical documentation", "marketing copy")
- `tone` (optional): Preferred writing tone (professional, casual, academic, creative)
- `audience` (optional): Target audience (general public, technical experts, students)

### Thread Management Prompts

#### `create-conversation-thread`
Set up a new conversation thread with initial context and metadata.

**Arguments:**
- `purpose` (required): Purpose of the conversation
- `context` (optional): Initial context or background information
- `user_id` (optional): User identifier for tracking

#### `organize-thread-messages`
Analyze and organize messages in a thread for better conversation flow.

**Arguments:**
- `thread_id` (required): Thread ID to analyze
- `organization_type` (optional): How to organize (chronological, by_topic, by_importance)

### Run Configuration Prompts

#### `configure-assistant-run`
Set up optimal run configuration for an assistant based on the task.

**Arguments:**
- `task_type` (required): Type of task (code_review, data_analysis, writing, general_qa)
- `complexity` (optional): Task complexity (simple, moderate, complex)
- `time_sensitivity` (optional): Time sensitivity (low, medium, high)

#### `debug-run-issues`
Analyze and troubleshoot assistant run problems.

**Arguments:**
- `run_id` (required): Run ID that has issues
- `issue_description` (required): Description of the observed issue
- `run_status` (optional): Current run status

### Code Analysis Prompts

#### `review-code`
Perform comprehensive code review with suggestions for improvement.

**Arguments:**
- `code` (required): Code to review
- `language` (optional): Programming language
- `focus_areas` (optional): Specific areas to focus on

#### `explain-code`
Provide detailed explanation of how code works.

**Arguments:**
- `code` (required): Code to explain
- `language` (optional): Programming language
- `detail_level` (optional): Level of detail (basic, intermediate, advanced)

### Data Analysis Prompts

#### `analyze-dataset`
Perform comprehensive analysis of a dataset.

**Arguments:**
- `dataset_description` (required): Description of the dataset
- `analysis_goals` (required): What you want to learn from the data
- `data_format` (optional): Format of the data (CSV, JSON, database, etc.)

## 🔧 Usage Examples

### Listing Available Prompts

```bash
curl -X POST https://assistants.jezweb.com/mcp/test \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "prompts/list",
    "params": {}
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "prompts": [
      {
        "name": "create-coding-assistant",
        "title": "Create Coding Assistant",
        "description": "Generate a specialized coding assistant with custom instructions and tools",
        "arguments": [
          {
            "name": "specialization",
            "description": "Programming specialization",
            "required": true
          }
        ]
      }
    ]
  }
}
```

### Getting a Specific Prompt

```bash
curl -X POST https://assistants.jezweb.com/mcp/test \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "prompts/get",
    "params": {
      "name": "review-code",
      "arguments": {
        "code": "def hello():\n    print(\"world\")",
        "language": "python",
        "focus_areas": "best_practices"
      }
    }
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "description": "Perform comprehensive code review with suggestions for improvement",
    "messages": [
      {
        "role": "user",
        "content": {
          "type": "text",
          "text": "Please review this python code focusing on best_practices:\n\n```\ndef hello():\n    print(\"world\")\n```\n\nProvide feedback on code quality, potential issues, and suggestions for improvement."
        }
      }
    ]
  }
}
```

## 🚀 Integration with MCP Clients

### Claude Desktop

Add the prompts-enabled server to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "openai-assistants": {
      "command": "npx",
      "args": ["openai-assistants-mcp@latest"],
      "env": {
        "OPENAI_API_KEY": "your-api-key"
      }
    }
  }
}
```

Prompts will appear as slash commands in Claude Desktop, making them easily accessible for assistant workflows.

### Other MCP Clients

The prompts implementation follows the official MCP specification and should work with any compliant MCP client that supports the prompts protocol.

## 🔍 Error Handling

The prompts implementation includes comprehensive error handling:

### Invalid Prompt Name
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "[prompts/get] Parameter 'name': Prompt not found: invalid-prompt"
  }
}
```

### Missing Required Arguments
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32603,
    "message": "[prompts/get] Execution failed: Invalid arguments for prompt review-code: Missing required argument: code"
  }
}
```

### Invalid Argument Types
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "[prompts/get] Parameter 'arguments': Argument 'code' must be a string, got number"
  }
}
```

## 🧪 Testing

The prompts functionality includes comprehensive tests covering:

- **prompts/list functionality**
- **prompts/get with various arguments**
- **Error handling for invalid prompts and arguments**
- **MCP capabilities declaration**
- **Message structure validation**

Run the prompts tests:
```bash
node test/prompts/prompts-functionality-test.cjs
```

## 🔧 Development

### Adding New Prompts

1. **Define the prompt template** in `shared/prompts/prompt-templates.ts`:

```typescript
export const MY_NEW_PROMPT: PromptTemplate = {
  name: 'my-new-prompt',
  title: 'My New Prompt',
  description: 'Description of what this prompt does',
  category: 'my-category',
  tags: ['tag1', 'tag2'],
  arguments: [
    {
      name: 'required_arg',
      description: 'A required argument',
      required: true
    }
  ],
  generateMessages: (args) => {
    return [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Generated prompt text using ${args.required_arg}`
        }
      }
    ];
  }
};
```

2. **Add to the PROMPT_TEMPLATES array**:

```typescript
export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // ... existing prompts
  MY_NEW_PROMPT
];
```

3. **Test the new prompt** using the prompts/get endpoint.

### Extending Prompt Functionality

The prompt system is designed to be extensible:

- **Custom argument validation** can be added to prompt templates
- **Multi-modal content** (images, audio) is supported in prompt messages
- **Resource embedding** allows prompts to reference server resources
- **Dynamic prompt generation** based on context or external data

## 📊 Performance

The prompts implementation is optimized for performance:

- **Lazy loading**: Prompts are only generated when requested
- **Caching**: Prompt registry is initialized once and reused
- **Efficient validation**: Fast argument validation with early returns
- **Memory efficient**: Templates are stored as functions, not pre-generated content

## 🔒 Security

Security considerations for the prompts implementation:

- **Input validation**: All arguments are validated before processing
- **Sanitization**: Sensitive data is removed from logs
- **Error boundaries**: Errors are contained and don't expose internal state
- **Rate limiting**: Inherits rate limiting from the base MCP handler

## 🚀 Future Enhancements

Potential future enhancements for the prompts system:

1. **Dynamic prompt discovery** from external sources
2. **Prompt versioning** and backwards compatibility
3. **User-specific prompt customization**
4. **Prompt analytics** and usage tracking
5. **Integration with Context7** for enhanced prompt capabilities
6. **Prompt chaining** for complex workflows
7. **A/B testing** for prompt effectiveness

## 📚 References

- [MCP Prompts Specification](https://spec.modelcontextprotocol.io/specification/server/prompts/)
- [OpenAI Assistants API Documentation](https://platform.openai.com/docs/assistants/overview)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)

---

This prompts implementation provides a solid foundation for building sophisticated AI workflows with the OpenAI Assistants API, making it easier for users to create, configure, and manage AI assistants through standardized, reusable prompt templates.