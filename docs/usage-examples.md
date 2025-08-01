# Usage Examples - Enhanced

*Practical examples and workflows*

## Overview

This document provides practical examples of how to use the OpenAI Assistants MCP Server effectively.

**Generated:** 2025-08-01T03:39:51.880Z  
**Environment:** development

## Basic Examples

### Creating an Assistant
```javascript
// Create a coding assistant
const assistant = await mcpClient.callTool('assistant-create', {
  model: 'gpt-4',
  name: 'Code Review Assistant',
  description: 'Helps with code reviews and suggestions',
  instructions: 'You are an expert code reviewer. Provide constructive feedback and suggestions for improvement.',
  tools: [{ type: 'code_interpreter' }]
});

console.log('Assistant created:', assistant.id);
```

### Managing Conversations
```javascript
// Create a thread and add messages
const thread = await mcpClient.callTool('thread-create', {});

await mcpClient.callTool('message-create', {
  thread_id: thread.id,
  role: 'user',
  content: 'Please review this code: function add(a, b) { return a + b; }'
});

// Run the assistant
const run = await mcpClient.callTool('run-create', {
  thread_id: thread.id,
  assistant_id: assistant.id
});
```

## Advanced Workflows

### Batch Processing
```javascript
// Process multiple items efficiently
const items = ['item1', 'item2', 'item3'];
const results = [];

for (const item of items) {
  const result = await processItem(item);
  results.push(result);
}

console.log('Batch processing completed:', results.length);
```

### Error Recovery
```javascript
// Implement retry logic with exponential backoff
async function callToolWithRetry(toolName, params, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await mcpClient.callTool(toolName, params);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Performance Optimization

### Caching Strategies
```javascript
// Simple in-memory cache
const cache = new Map();

async function getCachedResult(key, fetchFn) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const result = await fetchFn();
  cache.set(key, result);
  return result;
}
```

### Parallel Processing
```javascript
// Process multiple operations in parallel
const operations = [
  mcpClient.callTool('assistant-list'),
  mcpClient.callTool('thread-list'),
  mcpClient.callTool('message-list', { thread_id: 'thread_123' })
];

const [assistants, threads, messages] = await Promise.all(operations);
```

## Integration Patterns

### Express.js Integration
```javascript
const express = require('express');
const app = express();

app.post('/api/assistant', async (req, res) => {
  try {
    const assistant = await mcpClient.callTool('assistant-create', req.body);
    res.json(assistant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### React Hook
```javascript
import { useState, useEffect } from 'react';

function useAssistant(assistantId) {
  const [assistant, setAssistant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAssistant() {
      try {
        const result = await mcpClient.callTool('assistant-get', { assistant_id: assistantId });
        setAssistant(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    if (assistantId) {
      fetchAssistant();
    }
  }, [assistantId]);

  return { assistant, loading, error };
}
```

## Testing Examples

### Unit Testing
```javascript
describe('Assistant Operations', () => {
  test('should create assistant successfully', async () => {
    const params = {
      model: 'gpt-4',
      name: 'Test Assistant',
      instructions: 'Test instructions'
    };

    const result = await mcpClient.callTool('assistant-create', params);
    
    expect(result).toHaveProperty('id');
    expect(result.name).toBe(params.name);
    expect(result.model).toBe(params.model);
  });
});
```

### Integration Testing
```javascript
describe('End-to-End Workflow', () => {
  test('should complete full conversation workflow', async () => {
    // Create assistant
    const assistant = await mcpClient.callTool('assistant-create', {
      model: 'gpt-4',
      name: 'Test Assistant',
      instructions: 'You are a helpful assistant.'
    });

    // Create thread
    const thread = await mcpClient.callTool('thread-create', {});

    // Add message
    await mcpClient.callTool('message-create', {
      thread_id: thread.id,
      role: 'user',
      content: 'Hello, world!'
    });

    // Run assistant
    const run = await mcpClient.callTool('run-create', {
      thread_id: thread.id,
      assistant_id: assistant.id
    });

    expect(run).toHaveProperty('id');
    expect(run.status).toBe('queued');
  });
});
```

## Troubleshooting

### Common Issues

1. **Rate Limiting**: Implement exponential backoff and respect rate limits
2. **Timeout Errors**: Increase timeout values for long-running operations
3. **Authentication**: Ensure OPENAI_API_KEY is properly configured
4. **Validation Errors**: Check input parameters against tool schemas

### Debug Mode
```javascript
// Enable debug logging
process.env.DEBUG = 'mcp:*';

// Or use verbose logging
const mcpClient = new MCPClient({ verbose: true });
```

## Additional Resources

- [API Reference](./api-reference.md)
- [Best Practices](./best-practices.md)
- [Configuration Guide](./configuration.md)
