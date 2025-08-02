/**
 * Resources - Generated from modular JSON definitions
 *
 * This file is auto-generated from the hybrid modular architecture.
 * Do not edit manually - changes will be overwritten.
 *
 * Generated at: 2025-08-02T08:29:03.294Z
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
    "description": "Comprehensive template for creating a specialized coding assistant with advanced code review, debugging, and programming guidance capabilities. Includes pre-configured tools, detailed instructions, and best practices for software development assistance.",
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
    "name": "AI Provider Assistants API Reference",
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
    "description": "Common issues and solutions when working with AI Provider Assistants API",
    "mimeType": "text/markdown"
  },
  "examples://workflows/basic-workflow": {
    "uri": "examples://workflows/basic-workflow",
    "name": "Basic Workflow Example",
    "description": "Simple step-by-step workflow demonstrating basic assistant operations with thread creation, message handling, and run execution",
    "mimeType": "text/markdown"
  },
  "examples://workflows/advanced-workflow": {
    "uri": "examples://workflows/advanced-workflow",
    "name": "Advanced Workflow Example",
    "description": "Complex workflow demonstrating advanced features including tool calls, file handling, custom instructions, and error handling patterns",
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
    "name": "Expert Coding Assistant",
    "description": "A specialized assistant for comprehensive code review, debugging, architecture guidance, and programming best practices. Equipped with code interpreter and file search capabilities for hands-on development assistance.",
    "instructions": "You are an expert coding assistant with deep knowledge of multiple programming languages, frameworks, design patterns, and software engineering best practices. Your comprehensive role includes:\n\n## Core Responsibilities:\n1. **Code Review & Analysis**: Provide detailed, constructive feedback on code quality, structure, and adherence to best practices\n2. **Debugging & Problem Solving**: Identify issues, suggest solutions, and help trace through complex problems\n3. **Architecture Guidance**: Recommend design patterns, system architecture improvements, and scalability considerations\n4. **Performance Optimization**: Identify bottlenecks and suggest performance improvements\n5. **Security Assessment**: Review code for security vulnerabilities and recommend secure coding practices\n6. **Documentation & Testing**: Help create comprehensive documentation and suggest testing strategies\n\n## Technical Expertise:\n- **Languages**: Python, JavaScript/TypeScript, Java, C#, Go, Rust, and more\n- **Frameworks**: React, Node.js, Django, Spring, .NET, and popular frameworks\n- **Databases**: SQL, NoSQL, optimization, and design patterns\n- **DevOps**: CI/CD, containerization, cloud platforms, and deployment strategies\n- **Tools**: Git, IDEs, debugging tools, and development workflows\n\n## Communication Style:\n- Provide clear, step-by-step explanations with practical examples\n- Include relevant code snippets and demonstrations\n- Explain the 'why' behind recommendations, not just the 'what'\n- Consider different skill levels and adjust explanations accordingly\n- Always prioritize security, performance, maintainability, and readability\n\n## Code Review Process:\n1. Analyze code structure and organization\n2. Check for potential bugs and edge cases\n3. Evaluate performance implications\n4. Assess security considerations\n5. Suggest improvements with examples\n6. Provide alternative approaches when beneficial\n\nAlways maintain a helpful, educational tone while being thorough and precise in your technical guidance.",
    "tools": [
      {
        "type": "code_interpreter",
        "description": "Execute and test code snippets, perform calculations, and demonstrate programming concepts"
      },
      {
        "type": "file_search",
        "description": "Search through uploaded codebases, documentation, and technical files for context and reference"
      }
    ],
    "metadata": {
      "category": "development",
      "use_case": "comprehensive_code_assistance",
      "expertise_level": "expert",
      "specializations": [
        "code_review",
        "debugging",
        "architecture",
        "performance",
        "security"
      ],
      "supported_languages": [
        "python",
        "javascript",
        "typescript",
        "java",
        "csharp",
        "go",
        "rust"
      ],
      "frameworks": [
        "react",
        "nodejs",
        "django",
        "spring",
        "dotnet"
      ],
      "focus_areas": [
        "best_practices",
        "security",
        "performance",
        "maintainability"
      ]
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
  "docs://openai-assistants-api": "# AI Provider Assistants API Reference\n\n## Assistant IDs\nAssistant IDs follow the format: `asst_[a-zA-Z0-9]{24}`\n\nExamples:\n- `asst_abc123def456ghi789jkl012`\n- `asst_1234567890abcdef12345678`\n\n## Thread IDs  \nThread IDs follow the format: `thread_[a-zA-Z0-9]{24}`\n\nExamples:\n- `thread_abc123def456ghi789jkl012`\n- `thread_1234567890abcdef12345678`\n\n## Message IDs\nMessage IDs follow the format: `msg_[a-zA-Z0-9]{24}`\n\nExamples:\n- `msg_abc123def456ghi789jkl012`\n- `msg_1234567890abcdef12345678`\n\n## Run IDs\nRun IDs follow the format: `run_[a-zA-Z0-9]{24}`\n\nExamples:\n- `run_abc123def456ghi789jkl012`\n- `run_1234567890abcdef12345678`\n\n## Parameter Formats\n\n### Model Names\nSupported models:\n- `gpt-4` - Most capable model for complex tasks\n- `gpt-4-turbo` - Faster version of GPT-4\n- `gpt-3.5-turbo` - Fast and efficient for simpler tasks\n\n### Tool Types\nAvailable tool types:\n- `code_interpreter` - For running Python code\n- `file_search` - For searching uploaded files\n- `function` - For custom function calls\n\n### Metadata Format\nMetadata should be a JSON object with string keys and values:\n```json\n{\n  \"user_id\": \"12345\",\n  \"session_type\": \"support\",\n  \"priority\": \"high\",\n  \"department\": \"engineering\"\n}\n```\n\n### Pagination Parameters\n- `limit`: Number of items to return (1-100, default: 20)\n- `order`: Sort order (\"asc\" or \"desc\", default: \"desc\")\n- `after`: Cursor for pagination (ID of last item from previous page)\n- `before`: Cursor for pagination (ID of first item from next page)",
  "docs://best-practices": "# Best Practices Guide\n\n## Assistant Design\n\n### 1. Clear Instructions\n- Write specific, detailed instructions\n- Define the assistant's role and capabilities\n- Include examples of desired behavior\n- Set boundaries and limitations\n\n### 2. Tool Selection\n- Only enable tools that are necessary\n- `code_interpreter` for data analysis and calculations\n- `file_search` for document-based tasks\n- `function` for external API integrations\n\n### 3. Model Selection\n- `gpt-4` for complex reasoning and analysis\n- `gpt-3.5-turbo` for faster, simpler tasks\n- Consider cost vs. performance trade-offs\n\n## Thread Management\n\n### 1. Thread Organization\n- Use meaningful metadata for categorization\n- Group related conversations in single threads\n- Create new threads for different topics/users\n\n### 2. Message Structure\n- Keep messages focused and clear\n- Include necessary context\n- Use appropriate message roles\n\n## Performance Optimization\n\n### 1. Efficient API Usage\n- Batch operations when possible\n- Use pagination for large datasets\n- Implement caching for frequently accessed data\n\n### 2. Run Management\n- Monitor run status actively\n- Handle tool calls promptly\n- Set appropriate timeouts\n\n### 3. Resource Management\n- Clean up unused threads and assistants\n- Monitor token usage\n- Implement rate limiting\n\n## Security Considerations\n\n### 1. Data Protection\n- Sanitize user inputs\n- Avoid storing sensitive information in metadata\n- Use secure communication channels\n\n### 2. Access Control\n- Implement proper authentication\n- Use role-based permissions\n- Audit access logs\n\n## Cost Optimization\n\n### 1. Model Selection\n- Use appropriate models for tasks\n- Consider `gpt-3.5-turbo` for simpler operations\n- Monitor token usage patterns\n\n### 2. Efficient Prompting\n- Write concise, effective instructions\n- Avoid unnecessary context\n- Use system messages appropriately\n\n### 3. Resource Cleanup\n- Delete unused assistants and threads\n- Implement automatic cleanup policies\n- Monitor resource usage regularly",
  "docs://troubleshooting/common-issues": "# AI Provider Assistants API Troubleshooting Guide\n\n## Common Issues and Solutions\n\n### 1. Rate Limiting Errors\n**Error**: `429 Too Many Requests`\n**Solution**: Implement exponential backoff and respect rate limits.\n\n```javascript\nconst delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));\n\nasync function retryWithBackoff(fn, maxRetries = 3) {\n  for (let i = 0; i < maxRetries; i++) {\n    try {\n      return await fn();\n    } catch (error) {\n      if (error.status === 429 && i < maxRetries - 1) {\n        await delay(Math.pow(2, i) * 1000);\n        continue;\n      }\n      throw error;\n    }\n  }\n}\n```\n\n### 2. Tool Call Timeouts\n**Issue**: Assistant runs get stuck waiting for tool outputs\n**Solution**: Always submit tool outputs or cancel the run\n\n```javascript\n// Monitor run status and handle timeouts\nconst checkRunStatus = async (threadId, runId) => {\n  const run = await openai.beta.threads.runs.retrieve(threadId, runId);\n  \n  if (run.status === 'requires_action') {\n    // Handle tool calls or cancel if taking too long\n    const toolCalls = run.required_action.submit_tool_outputs.tool_calls;\n    // Process tool calls...\n  }\n  \n  return run;\n};\n```\n\n### 3. Message Formatting Issues\n**Issue**: Messages not displaying correctly\n**Solution**: Ensure proper content formatting\n\n```javascript\n// Correct message format\nconst message = {\n  role: 'user',\n  content: 'Your message here',\n  metadata: {\n    source: 'user-input',\n    timestamp: new Date().toISOString()\n  }\n};\n```\n\n### 4. File Upload Problems\n**Issue**: Files not being processed correctly\n**Solution**: Verify file format and size limits\n\n- Supported formats: .txt, .pdf, .docx, .md\n- Maximum file size: 512MB\n- Ensure proper MIME type\n\n### 5. Assistant Configuration Errors\n**Issue**: Assistant not behaving as expected\n**Solution**: Review instructions and tool configuration\n\n```javascript\n// Clear, specific instructions\nconst assistant = {\n  model: 'gpt-4',\n  name: 'Code Helper',\n  instructions: 'You are a helpful coding assistant. Always provide clear, commented code examples.',\n  tools: [{ type: 'code_interpreter' }]\n};\n```\n\n## Debugging Tips\n\n1. **Check API Response Status**: Always verify HTTP status codes\n2. **Log Request/Response**: Enable detailed logging for debugging\n3. **Validate Input**: Ensure all required parameters are provided\n4. **Monitor Usage**: Track API usage to avoid limits\n5. **Test Incrementally**: Start with simple operations before complex workflows",
  "examples://workflows/basic-workflow": "# Basic Workflow Example\n\nThis example demonstrates a simple workflow for getting started with AI Provider Assistants.\n\n## Step 1: Create an Assistant\n```json\n{\n  \"tool\": \"assistant-create\",\n  \"arguments\": {\n    \"model\": \"gpt-3.5-turbo\",\n    \"name\": \"My First Assistant\",\n    \"description\": \"A helpful assistant for general questions and tasks\",\n    \"instructions\": \"You are a helpful assistant. Provide clear, concise answers and be friendly in your responses.\"\n  }\n}\n```\n\n## Step 2: Create a Conversation Thread\n```json\n{\n  \"tool\": \"thread-create\",\n  \"arguments\": {\n    \"metadata\": {\n      \"user_id\": \"user_123\",\n      \"session_type\": \"general\",\n      \"created_at\": \"2025-01-31T12:00:00Z\"\n    }\n  }\n}\n```\n\n## Step 3: Add a Message\n```json\n{\n  \"tool\": \"message-create\",\n  \"arguments\": {\n    \"thread_id\": \"thread_abc123\",\n    \"role\": \"user\",\n    \"content\": \"Hello! Can you help me understand how AI assistants work?\"\n  }\n}\n```\n\n## Step 4: Run the Assistant\n```json\n{\n  \"tool\": \"run-create\",\n  \"arguments\": {\n    \"thread_id\": \"thread_abc123\",\n    \"assistant_id\": \"asst_def456\",\n    \"instructions\": \"Please provide a helpful and educational response.\"\n  }\n}\n```\n\n## Step 5: Check Run Status\n```json\n{\n  \"tool\": \"run-get\",\n  \"arguments\": {\n    \"thread_id\": \"thread_abc123\",\n    \"run_id\": \"run_ghi789\"\n  }\n}\n```\n\n## Step 6: Retrieve Messages\n```json\n{\n  \"tool\": \"message-list\",\n  \"arguments\": {\n    \"thread_id\": \"thread_abc123\",\n    \"order\": \"asc\"\n  }\n}\n```\n\n## Best Practices for Basic Workflows\n\n1. **Start Simple**: Begin with basic assistants using `gpt-3.5-turbo` for cost efficiency\n2. **Use Metadata**: Add meaningful metadata to threads for organization\n3. **Monitor Runs**: Always check run status before proceeding\n4. **Handle Errors**: Implement proper error handling for API calls\n5. **Clean Up**: Delete unused threads and assistants to manage resources\n\n## Common Use Cases\n\n- **Q&A Sessions**: Simple question-and-answer interactions\n- **Content Generation**: Basic content creation tasks\n- **Information Retrieval**: Answering questions about specific topics\n- **Learning**: Educational conversations and explanations",
  "examples://workflows/advanced-workflow": "# Advanced Workflow Example\n\nThis example demonstrates advanced patterns for complex AI Provider Assistant workflows.\n\n## Step 1: Create a Specialized Assistant with Tools\n```json\n{\n  \"tool\": \"assistant-create\",\n  \"arguments\": {\n    \"model\": \"gpt-4\",\n    \"name\": \"Advanced Data Analyst\",\n    \"description\": \"Expert assistant for complex data analysis with code execution and file processing capabilities\",\n    \"instructions\": \"You are an expert data analyst with advanced statistical knowledge. When analyzing data:\\n\\n1. Always start with exploratory data analysis\\n2. Use appropriate statistical methods\\n3. Create visualizations to support findings\\n4. Provide actionable business insights\\n5. Handle missing data appropriately\\n6. Validate assumptions before applying statistical tests\\n\\nUse code_interpreter for calculations and file_search for documentation.\",\n    \"tools\": [\n      {\"type\": \"code_interpreter\"},\n      {\"type\": \"file_search\"}\n    ],\n    \"metadata\": {\n      \"specialization\": \"data_analysis\",\n      \"complexity\": \"advanced\",\n      \"version\": \"2.0\"\n    }\n  }\n}\n```\n\n## Step 2: Create Thread with Rich Metadata\n```json\n{\n  \"tool\": \"thread-create\",\n  \"arguments\": {\n    \"metadata\": {\n      \"project_id\": \"proj_analytics_2025\",\n      \"user_id\": \"analyst_jane_doe\",\n      \"department\": \"business_intelligence\",\n      \"priority\": \"high\",\n      \"deadline\": \"2025-02-15\",\n      \"data_sources\": [\"sales_db\", \"customer_feedback\", \"market_research\"],\n      \"analysis_type\": \"predictive_modeling\",\n      \"stakeholders\": [\"ceo\", \"marketing_director\", \"sales_manager\"]\n    }\n  }\n}\n```\n\n## Step 3: Add Complex Message with Context\n```json\n{\n  \"tool\": \"message-create\",\n  \"arguments\": {\n    \"thread_id\": \"thread_advanced_123\",\n    \"role\": \"user\",\n    \"content\": \"I need you to analyze our Q4 sales data to predict Q1 performance. The dataset includes:\\n\\n- 50,000 transaction records\\n- Customer demographics\\n- Product categories\\n- Seasonal trends\\n- Marketing campaign data\\n\\nPlease:\\n1. Identify key performance drivers\\n2. Build a predictive model\\n3. Provide confidence intervals\\n4. Suggest optimization strategies\\n\\nThe analysis should account for the upcoming product launch and increased marketing spend.\",\n    \"metadata\": {\n      \"message_type\": \"analysis_request\",\n      \"complexity\": \"high\",\n      \"expected_duration\": \"45-60 minutes\"\n    }\n  }\n}\n```\n\n## Step 4: Run with Custom Configuration\n```json\n{\n  \"tool\": \"run-create\",\n  \"arguments\": {\n    \"thread_id\": \"thread_advanced_123\",\n    \"assistant_id\": \"asst_analyst_456\",\n    \"additional_instructions\": \"Focus on statistical significance and provide detailed methodology. Include code snippets for reproducibility. Address potential biases in the data.\",\n    \"metadata\": {\n      \"run_type\": \"complex_analysis\",\n      \"timeout\": \"3600\",\n      \"priority\": \"high\"\n    }\n  }\n}\n```\n\n## Step 5: Monitor Run with Tool Call Handling\n```json\n{\n  \"tool\": \"run-get\",\n  \"arguments\": {\n    \"thread_id\": \"thread_advanced_123\",\n    \"run_id\": \"run_analysis_789\"\n  }\n}\n```\n\n## Step 6: Handle Tool Calls (if required_action status)\n```json\n{\n  \"tool\": \"run-submit-tool-outputs\",\n  \"arguments\": {\n    \"thread_id\": \"thread_advanced_123\",\n    \"run_id\": \"run_analysis_789\",\n    \"tool_outputs\": [\n      {\n        \"tool_call_id\": \"call_code_exec_001\",\n        \"output\": \"Analysis completed. Model accuracy: 87.3%. Key drivers identified: seasonality (0.42), marketing_spend (0.31), product_mix (0.27).\"\n      }\n    ]\n  }\n}\n```\n\n## Step 7: Retrieve Detailed Run Steps\n```json\n{\n  \"tool\": \"run-step-list\",\n  \"arguments\": {\n    \"thread_id\": \"thread_advanced_123\",\n    \"run_id\": \"run_analysis_789\",\n    \"order\": \"asc\"\n  }\n}\n```\n\n## Step 8: Update Assistant Based on Results\n```json\n{\n  \"tool\": \"assistant-update\",\n  \"arguments\": {\n    \"assistant_id\": \"asst_analyst_456\",\n    \"instructions\": \"You are an expert data analyst with advanced statistical knowledge. Based on recent analysis, you've learned that our data shows strong seasonal patterns and marketing spend correlation. When analyzing similar datasets:\\n\\n1. Always check for seasonality first\\n2. Include marketing attribution analysis\\n3. Use ensemble methods for better accuracy\\n4. Validate with holdout data\\n\\nContinue with your standard analytical approach for other aspects.\",\n    \"metadata\": {\n      \"last_updated\": \"2025-01-31T15:30:00Z\",\n      \"update_reason\": \"learned_from_analysis\",\n      \"version\": \"2.1\"\n    }\n  }\n}\n```\n\n## Advanced Patterns\n\n### Error Handling\n```json\n// If run fails, cancel and retry with different parameters\n{\n  \"tool\": \"run-cancel\",\n  \"arguments\": {\n    \"thread_id\": \"thread_advanced_123\",\n    \"run_id\": \"run_failed_999\"\n  }\n}\n```\n\n### Thread Management\n```json\n// Update thread metadata as project evolves\n{\n  \"tool\": \"thread-update\",\n  \"arguments\": {\n    \"thread_id\": \"thread_advanced_123\",\n    \"metadata\": {\n      \"status\": \"analysis_complete\",\n      \"completion_date\": \"2025-01-31T16:00:00Z\",\n      \"final_accuracy\": \"87.3%\",\n      \"recommendations_count\": 5\n    }\n  }\n}\n```\n\n## Best Practices for Advanced Workflows\n\n1. **Rich Metadata**: Use comprehensive metadata for tracking and organization\n2. **Tool Integration**: Leverage code_interpreter and file_search effectively\n3. **Error Recovery**: Implement robust error handling and retry logic\n4. **Progress Monitoring**: Track run steps for complex operations\n5. **Adaptive Learning**: Update assistant instructions based on results\n6. **Resource Management**: Clean up completed threads and unused assistants\n7. **Security**: Sanitize inputs and validate outputs\n8. **Performance**: Monitor token usage and optimize for cost\n\n## Complex Use Cases\n\n- **Multi-step Analysis**: Complex data science workflows\n- **Document Processing**: Large-scale document analysis with file_search\n- **Code Generation**: Advanced programming tasks with code_interpreter\n- **Research Projects**: Long-running research with multiple iterations\n- **Business Intelligence**: Comprehensive reporting and insights generation",
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
  AIPROVIDERASSISTANTSAPIREFERENCE: 'docs://openai-assistants-api',
  BESTPRACTICESGUIDE: 'docs://best-practices',
  TROUBLESHOOTINGGUIDE: 'docs://troubleshooting/common-issues',
  BASICWORKFLOWEXAMPLE: 'examples://workflows/basic-workflow',
  ADVANCEDWORKFLOWEXAMPLE: 'examples://workflows/advanced-workflow',
  BATCHPROCESSINGWORKFLOW: 'examples://workflows/batch-processing',
};

// Export legacy compatibility
export const mcpResources = getResources();
export const resourceContent = RESOURCE_CONTENT;
