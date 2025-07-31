# 📚 MCP Resources Guide - OpenAI Assistants MCP Server

This guide provides comprehensive documentation for all **9 MCP resources** available in the OpenAI Assistants MCP Server. These resources provide templates, workflows, and documentation to help you get started quickly and follow best practices.

## 🎯 Resource Categories

### 🤖 Assistant Templates (4 resources)
Pre-configured assistant templates for common use cases

### 🔄 Workflow Examples (2 resources)
Step-by-step workflow examples for complex operations

### 📖 Documentation (3 resources)
Comprehensive guides and reference materials

---

## 🤖 Assistant Templates

### 1. Coding Assistant Template
**URI**: `assistant://templates/coding-assistant`  
**MIME Type**: `application/json`

A specialized assistant for code review, debugging, and programming help.

**Configuration:**
```json
{
  "model": "gpt-4",
  "name": "Coding Assistant",
  "description": "A specialized assistant for code review, debugging, and programming help",
  "instructions": "You are an expert coding assistant with deep knowledge of multiple programming languages, frameworks, and best practices. Your role is to:\n\n1. Help with code review and provide constructive feedback\n2. Debug issues and suggest solutions\n3. Explain complex programming concepts clearly\n4. Recommend best practices and design patterns\n5. Assist with code optimization and refactoring\n\nAlways provide clear explanations, include code examples when helpful, and consider security, performance, and maintainability in your recommendations.",
  "tools": [
    { "type": "code_interpreter" },
    { "type": "file_search" }
  ],
  "metadata": {
    "category": "development",
    "use_case": "code_assistance",
    "expertise_level": "expert"
  }
}
```

**Use Cases:**
- Code review and feedback
- Debugging assistance
- Programming concept explanations
- Best practices recommendations
- Code optimization and refactoring

---

### 2. Writing Assistant Template
**URI**: `assistant://templates/writing-assistant`  
**MIME Type**: `application/json`

A professional writing assistant for content creation, editing, and proofreading.

**Configuration:**
```json
{
  "model": "gpt-4",
  "name": "Writing Assistant",
  "description": "A professional writing assistant for content creation, editing, and proofreading",
  "instructions": "You are a professional writing assistant specializing in creating high-quality content across various formats and styles. Your expertise includes:\n\n1. Content creation for blogs, articles, and marketing materials\n2. Editing and proofreading for grammar, style, and clarity\n3. Adapting tone and style for different audiences\n4. Research assistance and fact-checking\n5. SEO optimization and content strategy\n\nAlways maintain professional standards, ensure accuracy, and tailor your writing to the intended audience and purpose.",
  "tools": [
    { "type": "file_search" }
  ],
  "metadata": {
    "category": "content",
    "use_case": "writing_assistance",
    "expertise_level": "professional"
  }
}
```

**Use Cases:**
- Blog post and article creation
- Content editing and proofreading
- Marketing material development
- SEO content optimization
- Professional communication

---

### 3. Data Analyst Template
**URI**: `assistant://templates/data-analyst`  
**MIME Type**: `application/json`

An expert assistant for data analysis, visualization, and statistical insights.

**Configuration:**
```json
{
  "model": "gpt-4",
  "name": "Data Analyst Assistant",
  "description": "An expert assistant for data analysis, visualization, and statistical insights",
  "instructions": "You are an expert data analyst with strong skills in statistics, data visualization, and business intelligence. Your capabilities include:\n\n1. Analyzing datasets and identifying patterns and trends\n2. Creating visualizations and charts to communicate insights\n3. Performing statistical analysis and hypothesis testing\n4. Providing business recommendations based on data\n5. Explaining complex analytical concepts in simple terms\n\nAlways ensure data accuracy, use appropriate statistical methods, and present findings in a clear, actionable manner.",
  "tools": [
    { "type": "code_interpreter" },
    { "type": "file_search" }
  ],
  "metadata": {
    "category": "analytics",
    "use_case": "data_analysis",
    "expertise_level": "expert"
  }
}
```

**Use Cases:**
- Dataset analysis and pattern identification
- Statistical analysis and hypothesis testing
- Data visualization and reporting
- Business intelligence insights
- Predictive analytics

---

### 4. Customer Support Template
**URI**: `assistant://templates/customer-support`  
**MIME Type**: `application/json`

A friendly and helpful customer support assistant.

**Configuration:**
```json
{
  "model": "gpt-3.5-turbo",
  "name": "Customer Support Assistant",
  "description": "A friendly and helpful customer support assistant",
  "instructions": "You are a customer support assistant dedicated to providing excellent service. Your approach should be:\n\n1. Friendly, empathetic, and professional in all interactions\n2. Quick to understand customer issues and provide solutions\n3. Knowledgeable about products, services, and policies\n4. Proactive in offering additional help and resources\n5. Focused on customer satisfaction and problem resolution\n\nAlways listen carefully, ask clarifying questions when needed, and follow up to ensure issues are fully resolved.",
  "tools": [
    { "type": "file_search" }
  ],
  "metadata": {
    "category": "support",
    "use_case": "customer_service",
    "expertise_level": "professional"
  }
}
```

**Use Cases:**
- Customer inquiry handling
- Technical support assistance
- Product information and guidance
- Issue resolution and troubleshooting
- Customer satisfaction management

---

## 🔄 Workflow Examples

### 1. Complete Create and Run Workflow
**URI**: `examples://workflows/create-and-run`  
**MIME Type**: `text/markdown`

A comprehensive step-by-step workflow demonstrating the complete process from creating an assistant to running a conversation.

**Workflow Steps:**

#### Step 1: Create an Assistant
```json
{
  "tool": "assistant-create",
  "arguments": {
    "model": "gpt-4",
    "name": "Code Review Assistant",
    "description": "Helps with code review and programming questions",
    "instructions": "You are an expert code reviewer. Analyze code for bugs, performance issues, and best practices.",
    "tools": [{"type": "code_interpreter"}]
  }
}
```

#### Step 2: Create a Thread
```json
{
  "tool": "thread-create",
  "arguments": {
    "metadata": {
      "session_type": "code_review",
      "user_id": "user123"
    }
  }
}
```

#### Step 3: Add a Message
```json
{
  "tool": "message-create",
  "arguments": {
    "thread_id": "thread_abc123",
    "role": "user",
    "content": "Please review this Python function for any issues: def calculate_average(numbers): return sum(numbers) / len(numbers)"
  }
}
```

#### Step 4: Run the Assistant
```json
{
  "tool": "run-create",
  "arguments": {
    "thread_id": "thread_abc123",
    "assistant_id": "asst_abc123"
  }
}
```

#### Step 5: Check Run Status
```json
{
  "tool": "run-get",
  "arguments": {
    "thread_id": "thread_abc123",
    "run_id": "run_abc123"
  }
}
```

#### Step 6: Get Messages
```json
{
  "tool": "message-list",
  "arguments": {
    "thread_id": "thread_abc123",
    "order": "asc"
  }
}
```

**Use Cases:**
- First-time setup and testing
- Understanding the complete workflow
- Educational purposes
- Integration planning

---

### 2. Batch Processing Workflow
**URI**: `examples://workflows/batch-processing`  
**MIME Type**: `text/markdown`

An example showing how to process multiple requests efficiently using concurrent operations.

**Workflow Steps:**

#### Step 1: Create Multiple Assistants
```json
// Create specialized assistants for different tasks
{
  "tool": "assistant-create",
  "arguments": {
    "model": "gpt-4",
    "name": "Content Writer",
    "instructions": "You are a professional content writer specializing in blog posts and articles."
  }
}

{
  "tool": "assistant-create", 
  "arguments": {
    "model": "gpt-4",
    "name": "Code Reviewer",
    "instructions": "You are an expert code reviewer focusing on best practices and security."
  }
}
```

#### Step 2: Create Threads for Each Task
```json
{
  "tool": "thread-create",
  "arguments": {
    "metadata": {"task_type": "content_writing", "priority": "high"}
  }
}

{
  "tool": "thread-create",
  "arguments": {
    "metadata": {"task_type": "code_review", "priority": "medium"}
  }
}
```

#### Step 3: Process Tasks Concurrently
```json
// Add messages and run assistants in parallel
{
  "tool": "message-create",
  "arguments": {
    "thread_id": "thread_content_123",
    "role": "user",
    "content": "Write a blog post about AI in healthcare"
  }
}

{
  "tool": "run-create",
  "arguments": {
    "thread_id": "thread_content_123",
    "assistant_id": "asst_writer_123"
  }
}
```

**Use Cases:**
- High-volume processing
- Concurrent task management
- Efficiency optimization
- Scalable implementations

---

## 📖 Documentation Resources

### 1. OpenAI Assistants API Reference
**URI**: `docs://openai-assistants-api`  
**MIME Type**: `text/markdown`

Comprehensive API reference with ID formats, parameters, and examples.

**Contents:**
- **Assistant IDs**: Format `asst_[a-zA-Z0-9]{24}`
- **Thread IDs**: Format `thread_[a-zA-Z0-9]{24}`
- **Message IDs**: Format `msg_[a-zA-Z0-9]{24}`
- **Run IDs**: Format `run_[a-zA-Z0-9]{24}`
- **Parameter Formats**: Model names, tool types, metadata structure
- **Pagination Parameters**: Limit, order, cursors

**Key Sections:**
- ID format specifications
- Supported model names
- Tool type definitions
- Metadata format guidelines
- Pagination best practices

---

### 2. Error Handling Guide
**URI**: `docs://error-handling`  
**MIME Type**: `text/markdown`

Common errors, solutions, and debugging techniques for the Assistants API.

**Contents:**
- **Common Error Scenarios**: Invalid IDs, missing parameters, rate limiting
- **Error Response Format**: Standard JSON-RPC error structure
- **Best Practices**: Error handling strategies and retry logic
- **Debugging Tips**: Using run steps, message history, status monitoring

**Key Sections:**
- Invalid Assistant/Thread/Message ID handling
- Missing required parameter resolution
- Rate limiting and backoff strategies
- Run status troubleshooting
- Debugging workflow examples

---

### 3. Best Practices Guide
**URI**: `docs://best-practices`  
**MIME Type**: `text/markdown`

Guidelines for optimal usage, performance, security, and cost optimization.

**Contents:**
- **Assistant Design**: Clear instructions, tool selection, model selection
- **Thread Management**: Organization, message structure, lifecycle management
- **Performance Optimization**: Efficient API usage, run management, resource management
- **Security Considerations**: Data protection, access control, audit logging
- **Cost Optimization**: Model selection, efficient prompting, resource cleanup

**Key Sections:**
- Assistant configuration best practices
- Thread and message management strategies
- Performance optimization techniques
- Security implementation guidelines
- Cost management recommendations

---

## 🔍 Accessing Resources

### Via MCP Client
Most MCP clients support resource access through natural language:

```
"Show me the coding assistant template"
"Display the create and run workflow"
"What are the best practices for assistant design?"
```

### Via Direct API
For programmatic access:

```bash
# List all resources
curl -X POST https://openai-assistants-mcp.jezweb.ai/mcp/YOUR_API_KEY \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "resources/list", "params": {}}'

# Read a specific resource
curl -X POST https://openai-assistants-mcp.jezweb.ai/mcp/YOUR_API_KEY \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 2, "method": "resources/read", "params": {"uri": "assistant://templates/coding-assistant"}}'
```

### Via NPM Package
When using the NPM package with stdio transport:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"resources/list","params":{}}' | npx openai-assistants-mcp@latest
```

---

## 🎯 Resource Usage Patterns

### 1. Quick Start with Templates
1. Access a template resource
2. Copy the configuration
3. Modify for your specific needs
4. Create the assistant using `assistant-create`

### 2. Learning Workflows
1. Read workflow examples
2. Follow step-by-step instructions
3. Adapt to your use case
4. Implement with actual data

### 3. Troubleshooting Issues
1. Check error handling guide
2. Identify your specific error
3. Apply recommended solutions
4. Refer to debugging tips

### 4. Optimizing Implementation
1. Review best practices guide
2. Assess current implementation
3. Apply optimization recommendations
4. Monitor performance improvements

---

## 🚀 Integration Examples

### JavaScript/TypeScript
```javascript
// Access resources programmatically
async function getTemplate(templateName) {
  const response = await mcpClient.call('resources/read', {
    uri: `assistant://templates/${templateName}`
  });
  return JSON.parse(response.result.contents[0].text);
}

// Use template to create assistant
const codingTemplate = await getTemplate('coding-assistant');
const assistant = await mcpClient.callTool('assistant-create', codingTemplate);
```

### Python
```python
import json

# Access workflow example
def get_workflow(workflow_name):
    response = mcp_client.call('resources/read', {
        'uri': f'examples://workflows/{workflow_name}'
    })
    return response['result']['contents'][0]['text']

# Follow workflow steps
workflow = get_workflow('create-and-run')
print(workflow)
```

---

## 📋 Resource Maintenance

### Version Compatibility
- Resources are versioned with the MCP server
- Backward compatibility is maintained
- New resources are added without breaking existing ones

### Content Updates
- Templates updated with latest best practices
- Workflows enhanced based on user feedback
- Documentation kept current with API changes

### Community Contributions
- Resource suggestions welcome
- Template improvements encouraged
- Workflow examples from real use cases

---

## 🔗 Related Documentation

- [Main README](../../README.md) - Complete server documentation
- [Usage Examples](../deployment/USAGE-EXAMPLES.md) - Practical usage examples
- [Enhanced Features](../implementation/ENHANCED-FEATURES.md) - Detailed feature documentation
- [Validation Guide](VALIDATION-GUIDE.md) - Parameter validation and error handling

---

**Ready to use these resources?** Start by accessing the templates and workflows through your MCP client, then follow the documentation guides for best practices and troubleshooting!