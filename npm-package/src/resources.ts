/**
 * MCP Resources for OpenAI Assistants MCP Server
 * 
 * This module provides comprehensive resources including templates, examples,
 * documentation, and best practices for using the OpenAI Assistants API.
 */

import { MCPResource } from './types.js';

// Assistant Templates
const CODING_ASSISTANT_TEMPLATE = {
  model: "gpt-4",
  name: "Coding Assistant",
  description: "A specialized assistant for code review, debugging, and programming help",
  instructions: `You are an expert coding assistant with deep knowledge of multiple programming languages, frameworks, and best practices. Your role is to:

1. Help with code review and provide constructive feedback
2. Debug issues and suggest solutions
3. Explain complex programming concepts clearly
4. Recommend best practices and design patterns
5. Assist with code optimization and refactoring

Always provide clear explanations, include code examples when helpful, and consider security, performance, and maintainability in your recommendations.`,
  tools: [
    { type: "code_interpreter" },
    { type: "file_search" }
  ],
  metadata: {
    category: "development",
    use_case: "code_assistance",
    expertise_level: "expert"
  }
};

const WRITING_ASSISTANT_TEMPLATE = {
  model: "gpt-4",
  name: "Writing Assistant",
  description: "A professional writing assistant for content creation, editing, and proofreading",
  instructions: `You are a professional writing assistant specializing in creating high-quality content across various formats and styles. Your expertise includes:

1. Content creation for blogs, articles, and marketing materials
2. Editing and proofreading for grammar, style, and clarity
3. Adapting tone and style for different audiences
4. Research assistance and fact-checking
5. SEO optimization and content strategy

Always maintain professional standards, ensure accuracy, and tailor your writing to the intended audience and purpose.`,
  tools: [
    { type: "file_search" }
  ],
  metadata: {
    category: "content",
    use_case: "writing_assistance",
    expertise_level: "professional"
  }
};

const DATA_ANALYST_TEMPLATE = {
  model: "gpt-4",
  name: "Data Analyst Assistant",
  description: "An expert assistant for data analysis, visualization, and statistical insights",
  instructions: `You are an expert data analyst with strong skills in statistics, data visualization, and business intelligence. Your capabilities include:

1. Analyzing datasets and identifying patterns and trends
2. Creating visualizations and charts to communicate insights
3. Performing statistical analysis and hypothesis testing
4. Providing business recommendations based on data
5. Explaining complex analytical concepts in simple terms

Always ensure data accuracy, use appropriate statistical methods, and present findings in a clear, actionable manner.`,
  tools: [
    { type: "code_interpreter" },
    { type: "file_search" }
  ],
  metadata: {
    category: "analytics",
    use_case: "data_analysis",
    expertise_level: "expert"
  }
};

const CUSTOMER_SUPPORT_TEMPLATE = {
  model: "gpt-3.5-turbo",
  name: "Customer Support Assistant",
  description: "A friendly and helpful customer support assistant",
  instructions: `You are a customer support assistant dedicated to providing excellent service. Your approach should be:

1. Friendly, empathetic, and professional in all interactions
2. Quick to understand customer issues and provide solutions
3. Knowledgeable about products, services, and policies
4. Proactive in offering additional help and resources
5. Focused on customer satisfaction and problem resolution

Always listen carefully, ask clarifying questions when needed, and follow up to ensure issues are fully resolved.`,
  tools: [
    { type: "file_search" }
  ],
  metadata: {
    category: "support",
    use_case: "customer_service",
    expertise_level: "professional"
  }
};

// Workflow Examples
const CREATE_AND_RUN_WORKFLOW = `# Complete Workflow: Create Assistant and Run Conversation

This example demonstrates the complete workflow from creating an assistant to running a conversation.

## Step 1: Create an Assistant
\`\`\`json
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
\`\`\`

## Step 2: Create a Thread
\`\`\`json
{
  "tool": "thread-create",
  "arguments": {
    "metadata": {
      "session_type": "code_review",
      "user_id": "user123"
    }
  }
}
\`\`\`

## Step 3: Add a Message
\`\`\`json
{
  "tool": "message-create",
  "arguments": {
    "thread_id": "thread_abc123",
    "role": "user",
    "content": "Please review this Python function for any issues: def calculate_average(numbers): return sum(numbers) / len(numbers)"
  }
}
\`\`\`

## Step 4: Run the Assistant
\`\`\`json
{
  "tool": "run-create",
  "arguments": {
    "thread_id": "thread_abc123",
    "assistant_id": "asst_abc123"
  }
}
\`\`\`

## Step 5: Check Run Status
\`\`\`json
{
  "tool": "run-get",
  "arguments": {
    "thread_id": "thread_abc123",
    "run_id": "run_abc123"
  }
}
\`\`\`

## Step 6: Get Messages
\`\`\`json
{
  "tool": "message-list",
  "arguments": {
    "thread_id": "thread_abc123",
    "order": "asc"
  }
}
\`\`\`
`;

const BATCH_PROCESSING_WORKFLOW = `# Batch Processing Workflow

This example shows how to process multiple requests efficiently.

## Step 1: Create Multiple Assistants
\`\`\`json
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
\`\`\`

## Step 2: Create Threads for Each Task
\`\`\`json
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
\`\`\`

## Step 3: Process Tasks Concurrently
\`\`\`json
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
\`\`\`
`;

// API Reference Documentation
const API_REFERENCE_DOCS = `# OpenAI Assistants API Reference

## Assistant IDs
Assistant IDs follow the format: \`asst_[a-zA-Z0-9]{24}\`

Examples:
- \`asst_abc123def456ghi789jkl012\`
- \`asst_1234567890abcdef12345678\`

## Thread IDs  
Thread IDs follow the format: \`thread_[a-zA-Z0-9]{24}\`

Examples:
- \`thread_abc123def456ghi789jkl012\`
- \`thread_1234567890abcdef12345678\`

## Message IDs
Message IDs follow the format: \`msg_[a-zA-Z0-9]{24}\`

Examples:
- \`msg_abc123def456ghi789jkl012\`
- \`msg_1234567890abcdef12345678\`

## Run IDs
Run IDs follow the format: \`run_[a-zA-Z0-9]{24}\`

Examples:
- \`run_abc123def456ghi789jkl012\`
- \`run_1234567890abcdef12345678\`

## Parameter Formats

### Model Names
Supported models:
- \`gpt-4\` - Most capable model for complex tasks
- \`gpt-4-turbo\` - Faster version of GPT-4
- \`gpt-3.5-turbo\` - Fast and efficient for simpler tasks

### Tool Types
Available tool types:
- \`code_interpreter\` - For running Python code
- \`file_search\` - For searching uploaded files
- \`function\` - For custom function calls

### Metadata Format
Metadata should be a JSON object with string keys and values:
\`\`\`json
{
  "user_id": "12345",
  "session_type": "support",
  "priority": "high",
  "department": "engineering"
}
\`\`\`

### Pagination Parameters
- \`limit\`: Number of items to return (1-100, default: 20)
- \`order\`: Sort order ("asc" or "desc", default: "desc")
- \`after\`: Cursor for pagination (ID of last item from previous page)
- \`before\`: Cursor for pagination (ID of first item from next page)
`;

// Error Handling Guide
const ERROR_HANDLING_GUIDE = `# Error Handling Guide

## Common Error Scenarios

### 1. Invalid Assistant ID
**Error**: \`Assistant not found\`
**Cause**: Using an incorrect or non-existent assistant ID
**Solution**: 
- Verify the assistant ID format: \`asst_[24 characters]\`
- Use \`assistant-list\` to get valid assistant IDs
- Check if the assistant was deleted

### 2. Invalid Thread ID
**Error**: \`Thread not found\`
**Cause**: Using an incorrect or non-existent thread ID
**Solution**:
- Verify the thread ID format: \`thread_[24 characters]\`
- Ensure the thread wasn't deleted
- Create a new thread if needed

### 3. Missing Required Parameters
**Error**: \`Missing required parameter: model\`
**Cause**: Not providing required fields in requests
**Solution**:
- Check tool documentation for required parameters
- Validate all required fields before making requests

### 4. Rate Limiting
**Error**: \`Rate limit exceeded\`
**Cause**: Making too many requests too quickly
**Solution**:
- Implement exponential backoff
- Reduce request frequency
- Use batch operations when possible

### 5. Run Status Issues
**Error**: Run stuck in "in_progress" status
**Cause**: Long-running operations or tool calls requiring input
**Solution**:
- Check run status regularly with \`run-get\`
- Handle \`requires_action\` status for tool calls
- Set appropriate timeouts

## Error Response Format
All errors follow this structure:
\`\`\`json
{
  "jsonrpc": "2.0",
  "id": "request_id",
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": "Additional error details"
  }
}
\`\`\`

## Best Practices for Error Handling

1. **Always check response status** before processing results
2. **Implement retry logic** with exponential backoff
3. **Log errors** with sufficient context for debugging
4. **Validate inputs** before making API calls
5. **Handle timeouts** gracefully
6. **Provide user-friendly error messages**

## Debugging Tips

1. **Use run steps** to understand assistant behavior:
   \`\`\`json
   {
     "tool": "run-step-list",
     "arguments": {
       "thread_id": "thread_abc123",
       "run_id": "run_abc123"
     }
   }
   \`\`\`

2. **Check message history** for context:
   \`\`\`json
   {
     "tool": "message-list", 
     "arguments": {
       "thread_id": "thread_abc123",
       "order": "asc"
     }
   }
   \`\`\`

3. **Monitor run status** for issues:
   \`\`\`json
   {
     "tool": "run-get",
     "arguments": {
       "thread_id": "thread_abc123",
       "run_id": "run_abc123"
     }
   }
   \`\`\`
`;

// Best Practices Guide
const BEST_PRACTICES_GUIDE = `# Best Practices Guide

## Assistant Design

### 1. Clear Instructions
- Write specific, detailed instructions
- Define the assistant's role and capabilities
- Include examples of desired behavior
- Set boundaries and limitations

### 2. Tool Selection
- Only enable tools that are necessary
- \`code_interpreter\` for data analysis and calculations
- \`file_search\` for document-based tasks
- \`function\` for external API integrations

### 3. Model Selection
- \`gpt-4\` for complex reasoning and analysis
- \`gpt-3.5-turbo\` for faster, simpler tasks
- Consider cost vs. performance trade-offs

## Thread Management

### 1. Thread Organization
- Use meaningful metadata for categorization
- Group related conversations in single threads
- Create new threads for different topics/users

### 2. Message Structure
- Keep messages focused and clear
- Include necessary context
- Use appropriate message roles

## Performance Optimization

### 1. Efficient API Usage
- Batch operations when possible
- Use pagination for large datasets
- Implement caching for frequently accessed data

### 2. Run Management
- Monitor run status actively
- Handle tool calls promptly
- Set appropriate timeouts

### 3. Resource Management
- Clean up unused threads and assistants
- Monitor token usage
- Implement rate limiting

## Security Considerations

### 1. Data Protection
- Sanitize user inputs
- Avoid storing sensitive information in metadata
- Use secure communication channels

### 2. Access Control
- Implement proper authentication
- Use role-based permissions
- Audit access logs

## Monitoring and Debugging

### 1. Logging
- Log all API interactions
- Include request/response details
- Track performance metrics

### 2. Error Handling
- Implement comprehensive error handling
- Provide meaningful error messages
- Use retry mechanisms with backoff

### 3. Testing
- Test with various input scenarios
- Validate error conditions
- Monitor production usage

## Cost Optimization

### 1. Model Selection
- Use appropriate models for tasks
- Consider \`gpt-3.5-turbo\` for simpler operations
- Monitor token usage patterns

### 2. Efficient Prompting
- Write concise, effective instructions
- Avoid unnecessary context
- Use system messages appropriately

### 3. Resource Cleanup
- Delete unused assistants and threads
- Implement automatic cleanup policies
- Monitor resource usage regularly
`;

// Resource definitions
export const mcpResources: MCPResource[] = [
  // Assistant Templates
  {
    uri: 'assistant://templates/coding-assistant',
    name: 'Coding Assistant Template',
    description: 'Pre-configured template for a coding assistant with code review and debugging capabilities',
    mimeType: 'application/json'
  },
  {
    uri: 'assistant://templates/writing-assistant',
    name: 'Writing Assistant Template', 
    description: 'Template for a professional writing assistant for content creation and editing',
    mimeType: 'application/json'
  },
  {
    uri: 'assistant://templates/data-analyst',
    name: 'Data Analyst Template',
    description: 'Template for a data analysis assistant with statistical and visualization capabilities',
    mimeType: 'application/json'
  },
  {
    uri: 'assistant://templates/customer-support',
    name: 'Customer Support Template',
    description: 'Template for a customer support assistant with friendly and helpful responses',
    mimeType: 'application/json'
  },

  // Workflow Examples
  {
    uri: 'examples://workflows/create-and-run',
    name: 'Complete Create and Run Workflow',
    description: 'Step-by-step example of creating an assistant, thread, and running a conversation',
    mimeType: 'text/markdown'
  },
  {
    uri: 'examples://workflows/batch-processing',
    name: 'Batch Processing Workflow',
    description: 'Example of processing multiple tasks efficiently with concurrent operations',
    mimeType: 'text/markdown'
  },

  // Documentation
  {
    uri: 'docs://openai-assistants-api',
    name: 'OpenAI Assistants API Reference',
    description: 'Comprehensive API reference with ID formats, parameters, and examples',
    mimeType: 'text/markdown'
  },
  {
    uri: 'docs://error-handling',
    name: 'Error Handling Guide',
    description: 'Common errors, solutions, and debugging techniques for the Assistants API',
    mimeType: 'text/markdown'
  },
  {
    uri: 'docs://best-practices',
    name: 'Best Practices Guide',
    description: 'Guidelines for optimal usage, performance, security, and cost optimization',
    mimeType: 'text/markdown'
  }
];

// Resource content mapping
export const resourceContent: Record<string, any> = {
  'assistant://templates/coding-assistant': CODING_ASSISTANT_TEMPLATE,
  'assistant://templates/writing-assistant': WRITING_ASSISTANT_TEMPLATE,
  'assistant://templates/data-analyst': DATA_ANALYST_TEMPLATE,
  'assistant://templates/customer-support': CUSTOMER_SUPPORT_TEMPLATE,
  'examples://workflows/create-and-run': CREATE_AND_RUN_WORKFLOW,
  'examples://workflows/batch-processing': BATCH_PROCESSING_WORKFLOW,
  'docs://openai-assistants-api': API_REFERENCE_DOCS,
  'docs://error-handling': ERROR_HANDLING_GUIDE,
  'docs://best-practices': BEST_PRACTICES_GUIDE
};

/**
 * Get resource content by URI
 */
export function getResourceContent(uri: string): { content: any; mimeType: string } | null {
  const content = resourceContent[uri];
  if (!content) {
    return null;
  }

  // Determine MIME type based on URI scheme
  let mimeType = 'text/plain';
  if (uri.startsWith('assistant://templates/')) {
    mimeType = 'application/json';
  } else if (uri.startsWith('examples://') || uri.startsWith('docs://')) {
    mimeType = 'text/markdown';
  }

  return {
    content: typeof content === 'string' ? content : JSON.stringify(content, null, 2),
    mimeType
  };
}