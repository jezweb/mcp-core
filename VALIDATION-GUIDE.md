# 🔍 Validation Guide - OpenAI Assistants MCP Server

This comprehensive guide covers the enhanced parameter validation and error handling system in the OpenAI Assistants MCP Server. Learn how to understand, troubleshoot, and resolve validation errors with actionable guidance.

## 📋 Overview

The validation system provides **context-aware error messages** with:
- **Format Examples**: Show exactly what valid input looks like
- **Documentation References**: Link to relevant guides and specifications
- **Actionable Guidance**: Clear steps to resolve issues
- **Parameter Relationships**: Explain how parameters work together

---

## 🎯 Validation Categories

### 1. OpenAI ID Format Validation

#### Supported ID Types
- **Assistant IDs**: `asst_[a-zA-Z0-9]{24}`
- **Thread IDs**: `thread_[a-zA-Z0-9]{24}`
- **Message IDs**: `msg_[a-zA-Z0-9]{24}`
- **Run IDs**: `run_[a-zA-Z0-9]{24}`
- **Step IDs**: `step_[a-zA-Z0-9]{24}`
- **File IDs**: `file-[a-zA-Z0-9]{24}`
- **Tool Call IDs**: `call_[a-zA-Z0-9]{24}`

#### Common ID Format Errors

**Error Example:**
```
Invalid assistant ID format for parameter 'assistant_id'. 
Expected 'asst_' followed by 24 characters (e.g., 'asst_abc123def456ghi789jkl012'), 
but received: 'invalid-id'. 
See docs://openai-assistants-api for ID format specifications.
```

**Resolution Steps:**
1. Check the ID format matches the expected pattern
2. Ensure the prefix is correct (`asst_`, `thread_`, etc.)
3. Verify the ID has exactly 24 characters after the prefix
4. Use `assistant-list`, `thread-list`, etc. to get valid IDs

**Valid Examples:**
```json
{
  "assistant_id": "asst_abc123def456ghi789jkl012",
  "thread_id": "thread_xyz789abc123def456ghi012",
  "message_id": "msg_123abc456def789ghi012jkl",
  "run_id": "run_456def789ghi012jkl345abc"
}
```

---

### 2. Model Validation

#### Supported Models
- **GPT-4 Family**: `gpt-4`, `gpt-4-turbo`, `gpt-4-turbo-preview`, `gpt-4-0125-preview`, `gpt-4-1106-preview`, `gpt-4-vision-preview`
- **GPT-3.5 Family**: `gpt-3.5-turbo`, `gpt-3.5-turbo-0125`, `gpt-3.5-turbo-1106`, `gpt-3.5-turbo-16k`

#### Model Selection Guidance

**Error Example:**
```
Invalid model 'gpt-5' for parameter 'model'. 
Supported models include: gpt-4, gpt-4-turbo, gpt-3.5-turbo, gpt-3.5-turbo-16k. 
See assistant://templates for configuration examples.
```

**Resolution Steps:**
1. Choose from the supported model list
2. Consider your use case:
   - **Complex tasks**: Use `gpt-4` or `gpt-4-turbo`
   - **Speed/cost optimization**: Use `gpt-3.5-turbo`
   - **Large context**: Use `gpt-3.5-turbo-16k`
3. Check assistant templates for recommended configurations

**Model Selection Examples:**
```json
{
  "coding_assistant": {
    "model": "gpt-4",
    "reason": "Complex reasoning for code analysis"
  },
  "customer_support": {
    "model": "gpt-3.5-turbo", 
    "reason": "Fast responses for simple queries"
  },
  "data_analysis": {
    "model": "gpt-4-turbo",
    "reason": "Advanced analysis with good performance"
  }
}
```

---

### 3. Numeric Range Validation

#### Common Range Parameters
- **limit**: 1-100 (pagination)
- **temperature**: 0-2 (response randomness)
- **top_p**: 0-1 (nucleus sampling)

#### Range Error Examples

**Error Example:**
```
Parameter 'limit' must be between 1 and 100 (inclusive), but received: 150. 
Adjust the value to be within the valid range. 
See docs://openai-assistants-api for parameter limits.
```

**Resolution Steps:**
1. Check the valid range for the parameter
2. Adjust your value to fit within bounds
3. Consider pagination for large datasets
4. Use default values when unsure

**Valid Range Examples:**
```json
{
  "pagination": {
    "limit": 20,
    "order": "desc"
  },
  "assistant_config": {
    "temperature": 0.7,
    "top_p": 0.9
  }
}
```

---

### 4. Required Parameter Validation

#### Missing Parameter Errors

**Error Example:**
```
Required parameter 'model' is missing. 
Specify a supported model like 'gpt-4', 'gpt-4-turbo', or 'gpt-3.5-turbo'. 
See docs://openai-assistants-api for the complete list of supported models.
```

**Resolution Steps:**
1. Add the missing required parameter
2. Use appropriate values from the documentation
3. Check assistant templates for complete examples
4. Validate all required fields before submission

**Required Parameters by Tool:**

#### assistant-create
```json
{
  "model": "gpt-4",  // Required
  "name": "My Assistant",  // Optional but recommended
  "instructions": "You are a helpful assistant."  // Optional but recommended
}
```

#### message-create
```json
{
  "thread_id": "thread_abc123def456ghi789jkl012",  // Required
  "role": "user",  // Required
  "content": "Hello, how can you help me?"  // Required
}
```

#### run-create
```json
{
  "thread_id": "thread_abc123def456ghi789jkl012",  // Required
  "assistant_id": "asst_abc123def456ghi789jkl012"  // Required
}
```

---

### 5. Tool Configuration Validation

#### Tool Types
- **code_interpreter**: For running Python code and data analysis
- **file_search**: For searching through uploaded files
- **function**: For custom function calls

#### Tool Configuration Errors

**Error Example:**
```
Tool at index 0 has invalid type 'invalid_tool'. 
Allowed types: code_interpreter, file_search, function. 
Example: {"type": "code_interpreter"}. 
See assistant://templates for tool examples.
```

**Resolution Steps:**
1. Use only supported tool types
2. Ensure proper tool configuration structure
3. Match tool_resources with enabled tools
4. Reference assistant templates for examples

**Valid Tool Configurations:**
```json
{
  "tools": [
    {
      "type": "code_interpreter"
    },
    {
      "type": "file_search"
    },
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get current weather for a location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "City name"
            }
          },
          "required": ["location"]
        }
      }
    }
  ]
}
```

---

### 6. Parameter Relationship Validation

#### Tool Resources Validation

**Error Example:**
```
Cannot specify 'file_search' in 'tool_resources' without including file_search tool in tools array. 
Add {"type": "file_search"} to tools or remove file_search from tool_resources. 
See docs://best-practices for configuration guidance.
```

**Resolution Steps:**
1. Ensure tool_resources match enabled tools
2. Add missing tools to the tools array
3. Remove unused tool_resources
4. Check configuration consistency

**Correct Tool/Resource Relationships:**
```json
{
  "tools": [
    {"type": "file_search"},
    {"type": "code_interpreter"}
  ],
  "tool_resources": {
    "file_search": {
      "vector_store_ids": ["vs_abc123"]
    },
    "code_interpreter": {
      "file_ids": ["file-abc123"]
    }
  }
}
```

---

### 7. Metadata Validation

#### Metadata Requirements
- **Type**: Must be an object (not array or primitive)
- **Size**: Maximum 16KB when serialized
- **Keys**: String keys only
- **Values**: String values only

#### Metadata Errors

**Error Example:**
```
Parameter 'metadata' exceeds the 16KB size limit. 
Current size: 18432 bytes. 
Reduce the amount of metadata or use shorter keys/values. 
See docs://openai-assistants-api for metadata limitations.
```

**Resolution Steps:**
1. Reduce metadata size by shortening keys/values
2. Remove unnecessary metadata fields
3. Use abbreviations for common terms
4. Store large data externally and reference by ID

**Valid Metadata Examples:**
```json
{
  "metadata": {
    "user_id": "12345",
    "session_type": "support",
    "priority": "high",
    "department": "engineering",
    "created_by": "system",
    "version": "1.0"
  }
}
```

---

### 8. Pagination Validation

#### Pagination Parameters
- **limit**: Number of items (1-100)
- **order**: Sort order ("asc" or "desc")
- **after**: Cursor for forward pagination
- **before**: Cursor for backward pagination

#### Pagination Errors

**Error Example:**
```
Cannot specify both 'after' and 'before' parameters simultaneously. 
Use 'after' for forward pagination or 'before' for backward pagination, but not both.
```

**Resolution Steps:**
1. Use either `after` OR `before`, not both
2. Use `after` for forward pagination (next page)
3. Use `before` for backward pagination (previous page)
4. Use cursor values from previous responses

**Pagination Examples:**
```json
{
  "forward_pagination": {
    "limit": 20,
    "order": "desc",
    "after": "asst_abc123def456ghi789jkl012"
  },
  "backward_pagination": {
    "limit": 20,
    "order": "desc", 
    "before": "asst_xyz789abc123def456ghi012"
  }
}
```

---

## 🛠️ Troubleshooting Common Scenarios

### Scenario 1: Creating Your First Assistant

**Common Issues:**
- Missing required `model` parameter
- Invalid model name
- Incorrect tool configuration

**Solution:**
```json
{
  "model": "gpt-4",
  "name": "My First Assistant",
  "description": "A helpful assistant for general tasks",
  "instructions": "You are a helpful assistant. Be concise and accurate.",
  "tools": [
    {"type": "code_interpreter"}
  ],
  "metadata": {
    "created_by": "user123",
    "purpose": "testing"
  }
}
```

### Scenario 2: Setting Up a Conversation

**Common Issues:**
- Invalid thread or assistant IDs
- Incorrect message role
- Missing required parameters

**Solution:**
```json
// 1. Create thread
{
  "metadata": {
    "user_id": "12345",
    "session_type": "chat"
  }
}

// 2. Add message
{
  "thread_id": "thread_abc123def456ghi789jkl012",
  "role": "user",
  "content": "Hello, I need help with Python programming."
}

// 3. Create run
{
  "thread_id": "thread_abc123def456ghi789jkl012",
  "assistant_id": "asst_abc123def456ghi789jkl012"
}
```

### Scenario 3: Handling Tool Outputs

**Common Issues:**
- Invalid tool call IDs
- Missing tool outputs
- Incorrect output format

**Solution:**
```json
{
  "thread_id": "thread_abc123def456ghi789jkl012",
  "run_id": "run_abc123def456ghi789jkl012",
  "tool_outputs": [
    {
      "tool_call_id": "call_abc123def456ghi789jkl012",
      "output": "The calculation result is 42"
    }
  ]
}
```

---

## 📚 Error Message Reference

### Error Code Categories

#### -32602: Invalid Params
Most validation errors fall into this category:
- ID format validation
- Parameter type validation
- Range validation
- Required parameter validation

#### -32600: Invalid Request
Request structure issues:
- Malformed JSON
- Missing required fields
- Invalid method names

#### -32601: Method Not Found
- Invalid tool names
- Unsupported MCP methods

### Error Message Structure

```json
{
  "jsonrpc": "2.0",
  "id": "request_id",
  "error": {
    "code": -32602,
    "message": "Detailed error message with examples and guidance",
    "data": "Additional context when available"
  }
}
```

---

## 🎯 Best Practices for Validation

### 1. Pre-validation
- Validate parameters client-side before sending requests
- Use the validation patterns provided in this guide
- Check ID formats using regex patterns

### 2. Error Handling
- Always check for error responses
- Parse error messages for specific guidance
- Follow documentation references in error messages

### 3. Testing
- Test with invalid parameters to understand error messages
- Use the enhanced error messages to improve your implementation
- Validate edge cases and boundary conditions

### 4. Documentation Usage
- Reference the error message documentation links
- Use assistant templates for configuration examples
- Follow workflow examples for proper sequencing

---

## 🔗 Documentation References

### Internal Resources
- `docs://openai-assistants-api` - Complete API reference
- `docs://best-practices` - Configuration and usage best practices
- `docs://error-handling` - Comprehensive error handling guide
- `assistant://templates/*` - Pre-configured assistant examples
- `examples://workflows/*` - Step-by-step workflow examples

### External Resources
- [OpenAI Assistants API Documentation](https://platform.openai.com/docs/assistants/overview)
- [MCP Specification](https://modelcontextprotocol.io/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference/assistants)

---

## 🧪 Testing Your Validation Understanding

### Quick Validation Quiz

Try to identify what's wrong with these examples:

#### Example 1
```json
{
  "assistant_id": "asst_123",
  "thread_id": "thread_abc123def456ghi789jkl012"
}
```
**Issue**: Assistant ID too short (needs 24 characters after prefix)

#### Example 2
```json
{
  "model": "gpt-5",
  "tools": [{"type": "invalid_tool"}]
}
```
**Issues**: Invalid model name and invalid tool type

#### Example 3
```json
{
  "limit": 150,
  "after": "asst_123",
  "before": "asst_456"
}
```
**Issues**: Limit exceeds maximum (100), both after and before specified, invalid ID formats

---

## 📞 Getting Help

### When You Encounter Validation Errors

1. **Read the Error Message**: Enhanced error messages provide specific guidance
2. **Check Documentation**: Follow the documentation references in error messages
3. **Use Templates**: Reference assistant templates for working examples
4. **Test Incrementally**: Start with simple configurations and add complexity
5. **Validate Locally**: Use the patterns in this guide to pre-validate parameters

### Common Resolution Patterns

1. **ID Format Issues**: Use list operations to get valid IDs
2. **Parameter Issues**: Reference assistant templates for examples
3. **Configuration Issues**: Check best practices documentation
4. **Relationship Issues**: Ensure tool/resource consistency

---

**The enhanced validation system is designed to guide you toward successful API usage. Use the detailed error messages, documentation references, and examples to quickly resolve issues and build robust integrations.**