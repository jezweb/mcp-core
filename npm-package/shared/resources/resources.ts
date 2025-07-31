/**
 * Resources - Generated from modular JSON definitions
 *
 * This file is auto-generated from the hybrid modular architecture.
 * Do not edit manually - changes will be overwritten.
 *
 * Generated at: 2025-07-31T05:43:46.957Z
 * Source: definitions/resources/
 */

import { MCPResource } from '../types/index.js';

/**
 * Resource definitions
 */
const RESOURCES: Record<string, MCPResource> = {
  "assistant://templates/coding-assistant": {
    "uri": "assistant://templates/coding-assistant",
    "name": "Coding Assistant Template",
    "description": "Pre-configured template for a coding assistant with code review and debugging capabilities",
    "mimeType": "application/json"
  },
  "assistant://templates/data-analyst": {
    "uri": "assistant://templates/data-analyst",
    "name": "Data Analyst Template",
    "description": "Template for a data analysis assistant with statistical and visualization capabilities",
    "mimeType": "application/json"
  },
  "assistant://templates/customer-support": {
    "uri": "assistant://templates/customer-support",
    "name": "Customer Support Template",
    "description": "Template for a customer support assistant with friendly and helpful responses",
    "mimeType": "application/json"
  },
  "docs://openai-assistants-api": {
    "uri": "docs://openai-assistants-api",
    "name": "OpenAI Assistants API Reference",
    "description": "Comprehensive API reference with ID formats, parameters, and examples",
    "mimeType": "text/markdown"
  },
  "docs://best-practices": {
    "uri": "docs://best-practices",
    "name": "Best Practices Guide",
    "description": "Guidelines for optimal usage, performance, security, and cost optimization",
    "mimeType": "text/markdown"
  },
  "docs://troubleshooting/common-issues": {
    "uri": "docs://troubleshooting/common-issues",
    "name": "Troubleshooting Guide",
    "description": "Common issues and solutions when working with OpenAI Assistants API",
    "mimeType": "text/markdown"
  },
  "examples://workflows/batch-processing": {
    "uri": "examples://workflows/batch-processing",
    "name": "Batch Processing Workflow",
    "description": "Example of processing multiple tasks efficiently with concurrent operations",
    "mimeType": "text/markdown"
  }
};

/**
 * Resource content mapping (separate from MCP resource definitions)
 */
const RESOURCE_CONTENT: Record<string, any> = {
  "assistant://templates/coding-assistant": {
    "model": "gpt-4",
    "name": "Coding Assistant",
    "description": "A specialized assistant for code review, debugging, and programming help",
    "instructions": "You are an expert coding assistant with deep knowledge of multiple programming languages, frameworks, and best practices. Your role is to:\n\n1. Help with code review and provide constructive feedback\n2. Debug issues and suggest solutions\n3. Explain complex programming concepts clearly\n4. Recommend best practices and design patterns\n5. Assist with code optimization and refactoring\n\nAlways provide clear explanations, include code examples when helpful, and consider security, performance, and maintainability in your recommendations.",
    "tools": [
      {
        "type": "code_interpreter"
      },
      {
        "type": "file_search"
      }
    ],
    "metadata": {
      "category": "development",
      "use_case": "code_assistance",
      "expertise_level": "expert"
    }
  },
  "assistant://templates/data-analyst": {
    "model": "gpt-4",
    "name": "Data Analyst Assistant",
    "description": "An expert assistant for data analysis, visualization, and statistical insights",
    "instructions": "You are an expert data analyst with strong skills in statistics, data visualization, and business intelligence. Your capabilities include:\n\n1. Analyzing datasets and identifying patterns and trends\n2. Creating visualizations and charts to communicate insights\n3. Performing statistical analysis and hypothesis testing\n4. Providing business recommendations based on data\n5. Explaining complex analytical concepts in simple terms\n\nAlways ensure data accuracy, use appropriate statistical methods, and present findings in a clear, actionable manner.",
    "tools": [
      {
        "type": "code_interpreter"
      },
      {
        "type": "file_search"
      }
    ],
    "metadata": {
      "category": "analytics",
      "use_case": "data_analysis",
      "expertise_level": "expert"
    }
  },
  "assistant://templates/customer-support": {
    "model": "gpt-3.5-turbo",
    "name": "Customer Support Assistant",
    "description": "A friendly and helpful customer support assistant",
    "instructions": "You are a customer support assistant dedicated to providing excellent service. Your approach should be:\n\n1. Friendly, empathetic, and professional in all interactions\n2. Quick to understand customer issues and provide solutions\n3. Knowledgeable about products, services, and policies\n4. Proactive in offering additional help and resources\n5. Focused on customer satisfaction and problem resolution\n\nAlways listen carefully, ask clarifying questions when needed, and follow up to ensure issues are fully resolved.",
    "tools": [
      {
        "type": "file_search"
      }
    ],
    "metadata": {
      "category": "support",
      "use_case": "customer_service",
      "expertise_level": "professional"
    }
  },
  "docs://openai-assistants-api": "# OpenAI Assistants API Reference\n\n## Assistant IDs\nAssistant IDs follow the format: `asst_[a-zA-Z0-9]{24}`\n\nExamples:\n- `asst_abc123def456ghi789jkl012`\n- `asst_1234567890abcdef12345678`\n\n## Thread IDs  \nThread IDs follow the format: `thread_[a-zA-Z0-9]{24}`\n\nExamples:\n- `thread_abc123def456ghi789jkl012`\n- `thread_1234567890abcdef12345678`\n\n## Message IDs\nMessage IDs follow the format: `msg_[a-zA-Z0-9]{24}`\n\nExamples:\n- `msg_abc123def456ghi789jkl012`\n- `msg_1234567890abcdef12345678`\n\n## Run IDs\nRun IDs follow the format: `run_[a-zA-Z0-9]{24}`\n\nExamples:\n- `run_abc123def456ghi789jkl012`\n- `run_1234567890abcdef12345678`\n\n## Parameter Formats\n\n### Model Names\nSupported models:\n- `gpt-4` - Most capable model for complex tasks\n- `gpt-4-turbo` - Faster version of GPT-4\n- `gpt-3.5-turbo` - Fast and efficient for simpler tasks\n\n### Tool Types\nAvailable tool types:\n- `code_interpreter` - For running Python code\n- `file_search` - For searching uploaded files\n- `function` - For custom function calls\n\n### Metadata Format\nMetadata should be a JSON object with string keys and values:\n```json\n{\n  \"user_id\": \"12345\",\n  \"session_type\": \"support\",\n  \"priority\": \"high\",\n  \"department\": \"engineering\"\n}\n```\n\n### Pagination Parameters\n- `limit`: Number of items to return (1-100, default: 20)\n- `order`: Sort order (\"asc\" or \"desc\", default: \"desc\")\n- `after`: Cursor for pagination (ID of last item from previous page)\n- `before`: Cursor for pagination (ID of first item from next page)",
  "docs://best-practices": "# Best Practices Guide\n\n## Assistant Design\n\n### 1. Clear Instructions\n- Write specific, detailed instructions\n- Define the assistant's role and capabilities\n- Include examples of desired behavior\n- Set boundaries and limitations\n\n### 2. Tool Selection\n- Only enable tools that are necessary\n- `code_interpreter` for data analysis and calculations\n- `file_search` for document-based tasks\n- `function` for external API integrations\n\n### 3. Model Selection\n- `gpt-4` for complex reasoning and analysis\n- `gpt-3.5-turbo` for faster, simpler tasks\n- Consider cost vs. performance trade-offs\n\n## Thread Management\n\n### 1. Thread Organization\n- Use meaningful metadata for categorization\n- Group related conversations in single threads\n- Create new threads for different topics/users\n\n### 2. Message Structure\n- Keep messages focused and clear\n- Include necessary context\n- Use appropriate message roles\n\n## Performance Optimization\n\n### 1. Efficient API Usage\n- Batch operations when possible\n- Use pagination for large datasets\n- Implement caching for frequently accessed data\n\n### 2. Run Management\n- Monitor run status actively\n- Handle tool calls promptly\n- Set appropriate timeouts\n\n### 3. Resource Management\n- Clean up unused threads and assistants\n- Monitor token usage\n- Implement rate limiting\n\n## Security Considerations\n\n### 1. Data Protection\n- Sanitize user inputs\n- Avoid storing sensitive information in metadata\n- Use secure communication channels\n\n### 2. Access Control\n- Implement proper authentication\n- Use role-based permissions\n- Audit access logs\n\n## Cost Optimization\n\n### 1. Model Selection\n- Use appropriate models for tasks\n- Consider `gpt-3.5-turbo` for simpler operations\n- Monitor token usage patterns\n\n### 2. Efficient Prompting\n- Write concise, effective instructions\n- Avoid unnecessary context\n- Use system messages appropriately\n\n### 3. Resource Cleanup\n- Delete unused assistants and threads\n- Implement automatic cleanup policies\n- Monitor resource usage regularly",
  "docs://troubleshooting/common-issues": "# OpenAI Assistants API Troubleshooting Guide\n\n## Common Issues and Solutions\n\n### 1. Rate Limiting Errors\n**Error**: `429 Too Many Requests`\n**Solution**: Implement exponential backoff and respect rate limits.\n\n```javascript\nconst delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));\n\nasync function retryWithBackoff(fn, maxRetries = 3) {\n  for (let i = 0; i < maxRetries; i++) {\n    try {\n      return await fn();\n    } catch (error) {\n      if (error.status === 429 && i < maxRetries - 1) {\n        await delay(Math.pow(2, i) * 1000);\n        continue;\n      }\n      throw error;\n    }\n  }\n}\n```\n\n### 2. Tool Call Timeouts\n**Issue**: Assistant runs get stuck waiting for tool outputs\n**Solution**: Always submit tool outputs or cancel the run\n\n```javascript\n// Monitor run status and handle timeouts\nconst checkRunStatus = async (threadId, runId) => {\n  const run = await openai.beta.threads.runs.retrieve(threadId, runId);\n  \n  if (run.status === 'requires_action') {\n    // Handle tool calls or cancel if taking too long\n    const toolCalls = run.required_action.submit_tool_outputs.tool_calls;\n    // Process tool calls...\n  }\n  \n  return run;\n};\n```\n\n### 3. Message Formatting Issues\n**Issue**: Messages not displaying correctly\n**Solution**: Ensure proper content formatting\n\n```javascript\n// Correct message format\nconst message = {\n  role: 'user',\n  content: 'Your message here',\n  metadata: {\n    source: 'user-input',\n    timestamp: new Date().toISOString()\n  }\n};\n```\n\n### 4. File Upload Problems\n**Issue**: Files not being processed correctly\n**Solution**: Verify file format and size limits\n\n- Supported formats: .txt, .pdf, .docx, .md\n- Maximum file size: 512MB\n- Ensure proper MIME type\n\n### 5. Assistant Configuration Errors\n**Issue**: Assistant not behaving as expected\n**Solution**: Review instructions and tool configuration\n\n```javascript\n// Clear, specific instructions\nconst assistant = {\n  model: 'gpt-4',\n  name: 'Code Helper',\n  instructions: 'You are a helpful coding assistant. Always provide clear, commented code examples.',\n  tools: [{ type: 'code_interpreter' }]\n};\n```\n\n## Debugging Tips\n\n1. **Check API Response Status**: Always verify HTTP status codes\n2. **Log Request/Response**: Enable detailed logging for debugging\n3. **Validate Input**: Ensure all required parameters are provided\n4. **Monitor Usage**: Track API usage to avoid limits\n5. **Test Incrementally**: Start with simple operations before complex workflows",
  "examples://workflows/batch-processing": "# Batch Processing Workflow\n\nThis example shows how to process multiple requests efficiently.\n\n## Step 1: Create Multiple Assistants\n```json\n// Create specialized assistants for different tasks\n{\n  \"tool\": \"assistant-create\",\n  \"arguments\": {\n    \"model\": \"gpt-4\",\n    \"name\": \"Content Writer\",\n    \"instructions\": \"You are a professional content writer specializing in blog posts and articles.\"\n  }\n}\n\n{\n  \"tool\": \"assistant-create\", \n  \"arguments\": {\n    \"model\": \"gpt-4\",\n    \"name\": \"Code Reviewer\",\n    \"instructions\": \"You are an expert code reviewer focusing on best practices and security.\"\n  }\n}\n```\n\n## Step 2: Create Threads for Each Task\n```json\n{\n  \"tool\": \"thread-create\",\n  \"arguments\": {\n    \"metadata\": {\"task_type\": \"content_writing\", \"priority\": \"high\"}\n  }\n}\n\n{\n  \"tool\": \"thread-create\",\n  \"arguments\": {\n    \"metadata\": {\"task_type\": \"code_review\", \"priority\": \"medium\"}\n  }\n}\n```\n\n## Step 3: Process Tasks Concurrently\n```json\n// Add messages and run assistants in parallel\n{\n  \"tool\": \"message-create\",\n  \"arguments\": {\n    \"thread_id\": \"thread_content_123\",\n    \"role\": \"user\",\n    \"content\": \"Write a blog post about AI in healthcare\"\n  }\n}\n\n{\n  \"tool\": \"run-create\",\n  \"arguments\": {\n    \"thread_id\": \"thread_content_123\",\n    \"assistant_id\": \"asst_writer_123\"\n  }\n}\n```"
};

/**
 * Get all available resources
 *
 * @returns Array of resources
 */
export function getResources(): MCPResource[] {
  return Object.values(RESOURCES);
}

/**
 * Get a specific resource by URI
 *
 * @param uri - The resource URI
 * @returns The resource or undefined
 */
export function getResource(uri: string): MCPResource | undefined {
  return RESOURCES[uri];
}

/**
 * Get resource content by URI
 *
 * @param uri - The resource URI
 * @returns The resource content or undefined
 */
export function getResourceContent(uri: string): any {
  return RESOURCE_CONTENT[uri];
}

/**
 * Get resources by category
 *
 * @param category - The category to filter by
 * @returns Array of resources in the category
 */
export function getResourcesByCategory(category: string): MCPResource[] {
  return Object.values(RESOURCES).filter(resource =>
    resource.uri.includes(category) || resource.name.toLowerCase().includes(category.toLowerCase())
  );
}

// Export resource URIs for easy access
export const RESOURCE_URIS = {
  CODINGASSISTANTTEMPLATE: 'assistant://templates/coding-assistant',
  DATAANALYSTTEMPLATE: 'assistant://templates/data-analyst',
  CUSTOMERSUPPORTTEMPLATE: 'assistant://templates/customer-support',
  OPENAIASSISTANTSAPIREFERENCE: 'docs://openai-assistants-api',
  BESTPRACTICESGUIDE: 'docs://best-practices',
  TROUBLESHOOTINGGUIDE: 'docs://troubleshooting/common-issues',
  BATCHPROCESSINGWORKFLOW: 'examples://workflows/batch-processing',
};

// Export legacy compatibility
export const mcpResources = getResources();
export const resourceContent = RESOURCE_CONTENT;
