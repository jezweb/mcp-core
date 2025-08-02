/**
 * Shared Validation Library - Comprehensive validation utilities for OpenAI Assistants MCP Server
 *
 * This module consolidates all validation logic used across both Cloudflare Workers
 * and NPM package deployments. Following MCP best practices for error messages
 * and parameter validation.
 *
 * Consolidates 562 lines of duplicate validation code.
 */
import { MCPError, ErrorCodes } from '../types/index.js';
// Supported OpenAI models
export const SUPPORTED_MODELS = [
    'gpt-4',
    'gpt-4o',
    'gpt-4-turbo',
    'gpt-4-turbo-preview',
    'gpt-4-0125-preview',
    'gpt-4-1106-preview',
    'gpt-4-vision-preview',
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-0125',
    'gpt-3.5-turbo-1106',
    'gpt-3.5-turbo-16k'
];
// OpenAI ID format patterns
export const ID_PATTERNS = {
    assistant: /^asst_[a-zA-Z0-9]{24}$/,
    thread: /^thread_[a-zA-Z0-9]{24}$/,
    message: /^msg_[a-zA-Z0-9]{24}$/,
    run: /^run_[a-zA-Z0-9]{24}$/,
    step: /^step_[a-zA-Z0-9]{24}$/,
    file: /^file-[a-zA-Z0-9]{24}$/,
    tool_call: /^call_[a-zA-Z0-9]{24}$/
};
/**
 * Validate OpenAI ID format
 */
export function validateOpenAIId(id, type, paramName) {
    if (!id) {
        return {
            isValid: false,
            error: new MCPError(ErrorCodes.INVALID_PARAMS, `Required parameter '${paramName}' is missing. Provide a valid ${type} ID in format '${type}_' followed by 24 characters (e.g., '${type}_abc123def456ghi789jkl012'). See docs://openai-assistants-api for more information.`)
        };
    }
    if (typeof id !== 'string') {
        return {
            isValid: false,
            error: new MCPError(ErrorCodes.INVALID_PARAMS, `Parameter '${paramName}' must be a string. Expected ${type} ID format: '${type}_' followed by 24 characters (e.g., '${type}_abc123def456ghi789jkl012').`)
        };
    }
    const pattern = ID_PATTERNS[type];
    if (!pattern.test(id)) {
        return {
            isValid: false,
            error: new MCPError(ErrorCodes.INVALID_PARAMS, `Invalid ${type} ID format for parameter '${paramName}'. Expected '${type}_' followed by 24 characters (e.g., '${type}_abc123def456ghi789jkl012'), but received: '${id}'. See docs://openai-assistants-api for ID format specifications.`)
        };
    }
    return { isValid: true };
}
/**
 * Validate OpenAI model name
 */
export function validateModel(model, paramName = 'model') {
    if (!model) {
        return {
            isValid: false,
            error: new MCPError(ErrorCodes.INVALID_PARAMS, `Required parameter '${paramName}' is missing. Specify a supported model like 'gpt-4', 'gpt-4o', 'gpt-4-turbo', or 'gpt-3.5-turbo'. See docs://openai-assistants-api for the complete list of supported models.`)
        };
    }
    if (typeof model !== 'string') {
        return {
            isValid: false,
            error: new MCPError(ErrorCodes.INVALID_PARAMS, `Parameter '${paramName}' must be a string. Supported models include: ${SUPPORTED_MODELS.join(', ')}. See docs://openai-assistants-api for model specifications.`)
        };
    }
    if (!SUPPORTED_MODELS.includes(model)) {
        return {
            isValid: false,
            error: new MCPError(ErrorCodes.INVALID_PARAMS, `Invalid model '${model}' for parameter '${paramName}'. Supported models include: ${SUPPORTED_MODELS.join(', ')}. See assistant://templates for configuration examples.`)
        };
    }
    return { isValid: true };
}
/**
 * Validate numeric range
 */
export function validateNumericRange(value, paramName, min, max, defaultValue) {
    if (value === undefined || value === null) {
        if (defaultValue !== undefined) {
            return { isValid: true };
        }
        return {
            isValid: false,
            error: new MCPError(ErrorCodes.INVALID_PARAMS, `Required parameter '${paramName}' is missing. Provide a number between ${min} and ${max} (inclusive). See docs://openai-assistants-api for parameter specifications.`)
        };
    }
    if (typeof value !== 'number' || isNaN(value)) {
        return {
            isValid: false,
            error: new MCPError(ErrorCodes.INVALID_PARAMS, `Parameter '${paramName}' must be a valid number between ${min} and ${max} (inclusive), but received: ${value}. Example: ${paramName}: ${Math.min(max, Math.max(min, defaultValue || min))}.`)
        };
    }
    if (value < min || value > max) {
        return {
            isValid: false,
            error: new MCPError(ErrorCodes.INVALID_PARAMS, `Parameter '${paramName}' must be between ${min} and ${max} (inclusive), but received: ${value}. Adjust the value to be within the valid range. See docs://openai-assistants-api for parameter limits.`)
        };
    }
    return { isValid: true };
}
/**
 * Validate required string parameter
 */
export function validateRequiredString(value, paramName, examples) {
    if (!value) {
        const exampleText = examples ? ` Examples: ${examples.join(', ')}.` : '';
        return {
            isValid: false,
            error: new MCPError(ErrorCodes.INVALID_PARAMS, `Required parameter '${paramName}' is missing. Provide a non-empty string value.${exampleText} See docs://openai-assistants-api for parameter specifications.`)
        };
    }
    if (typeof value !== 'string') {
        const exampleText = examples ? ` Examples: ${examples.join(', ')}.` : '';
        return {
            isValid: false,
            error: new MCPError(ErrorCodes.INVALID_PARAMS, `Parameter '${paramName}' must be a string, but received: ${typeof value}.${exampleText}`)
        };
    }
    if (value.trim().length === 0) {
        const exampleText = examples ? ` Examples: ${examples.join(', ')}.` : '';
        return {
            isValid: false,
            error: new MCPError(ErrorCodes.INVALID_PARAMS, `Parameter '${paramName}' cannot be empty. Provide a non-empty string value.${exampleText}`)
        };
    }
    return { isValid: true };
}
/**
 * Validate enum value
 */
export function validateEnum(value, paramName, allowedValues, defaultValue) {
    if (value === undefined || value === null) {
        if (defaultValue !== undefined) {
            return { isValid: true };
        }
        return {
            isValid: false,
            error: new MCPError(ErrorCodes.INVALID_PARAMS, `Required parameter '${paramName}' is missing. Allowed values: ${allowedValues.join(', ')}. See docs://openai-assistants-api for parameter specifications.`)
        };
    }
    if (!allowedValues.includes(value)) {
        return {
            isValid: false,
            error: new MCPError(ErrorCodes.INVALID_PARAMS, `Invalid value '${value}' for parameter '${paramName}'. Allowed values: ${allowedValues.join(', ')}. Example: ${paramName}: "${allowedValues[0]}".`)
        };
    }
    return { isValid: true };
}
/**
 * Validate array parameter
 */
export function validateArray(value, paramName, required = false) {
    if (value === undefined || value === null) {
        if (required) {
            return {
                isValid: false,
                error: new MCPError(ErrorCodes.INVALID_PARAMS, `Required parameter '${paramName}' is missing. Provide an array value. Example: ${paramName}: []. See docs://openai-assistants-api for parameter specifications.`)
            };
        }
        return { isValid: true };
    }
    if (!Array.isArray(value)) {
        return {
            isValid: false,
            error: new MCPError(ErrorCodes.INVALID_PARAMS, `Parameter '${paramName}' must be an array, but received: ${typeof value}. Example: ${paramName}: [].`)
        };
    }
    return { isValid: true };
}
/**
 * Validate metadata object
 */
export function validateMetadata(metadata, paramName = 'metadata') {
    if (metadata === undefined || metadata === null) {
        return { isValid: true };
    }
    if (typeof metadata !== 'object' || Array.isArray(metadata)) {
        return {
            isValid: false,
            error: new MCPError(ErrorCodes.INVALID_PARAMS, `Parameter '${paramName}' must be an object with key-value pairs, but received: ${typeof metadata}. Example: ${paramName}: {"key": "value", "category": "support"}.`)
        };
    }
    // Check metadata size (OpenAI has a 16KB limit)
    const metadataString = JSON.stringify(metadata);
    if (metadataString.length > 16384) {
        return {
            isValid: false,
            error: new MCPError(ErrorCodes.INVALID_PARAMS, `Parameter '${paramName}' exceeds the 16KB size limit. Current size: ${metadataString.length} bytes. Reduce the amount of metadata or use shorter keys/values. See docs://openai-assistants-api for metadata limitations.`)
        };
    }
    return { isValid: true };
}
/**
 * Validate tool configuration
 */
export function validateTools(tools, paramName = 'tools') {
    if (tools === undefined || tools === null) {
        return { isValid: true };
    }
    const arrayValidation = validateArray(tools, paramName);
    if (!arrayValidation.isValid) {
        return arrayValidation;
    }
    const allowedToolTypes = ['code_interpreter', 'file_search', 'function'];
    for (let i = 0; i < tools.length; i++) {
        const tool = tools[i];
        if (!tool || typeof tool !== 'object') {
            return {
                isValid: false,
                error: new MCPError(ErrorCodes.INVALID_PARAMS, `Tool at index ${i} in '${paramName}' must be an object. Example: {"type": "code_interpreter"} or {"type": "function", "function": {...}}. See docs://best-practices for tool configuration.`)
            };
        }
        if (!tool.type || !allowedToolTypes.includes(tool.type)) {
            return {
                isValid: false,
                error: new MCPError(ErrorCodes.INVALID_PARAMS, `Tool at index ${i} has invalid type '${tool.type}'. Allowed types: ${allowedToolTypes.join(', ')}. Example: {"type": "code_interpreter"}. See assistant://templates for tool examples.`)
            };
        }
        // Validate function tool
        if (tool.type === 'function') {
            if (!tool.function) {
                return {
                    isValid: false,
                    error: new MCPError(ErrorCodes.INVALID_PARAMS, `Function tool at index ${i} is missing 'function' property. Example: {"type": "function", "function": {"name": "my_function", "description": "Function description"}}. See docs://best-practices for function tool configuration.`)
                };
            }
            if (!tool.function.name || typeof tool.function.name !== 'string') {
                return {
                    isValid: false,
                    error: new MCPError(ErrorCodes.INVALID_PARAMS, `Function tool at index ${i} is missing or has invalid 'name' property. Provide a string name for the function. Example: "name": "calculate_sum".`)
                };
            }
        }
    }
    return { isValid: true };
}
/**
 * Validate tool resources configuration
 */
export function validateToolResources(toolResources, tools, paramName = 'tool_resources') {
    if (toolResources === undefined || toolResources === null) {
        return { isValid: true };
    }
    if (typeof toolResources !== 'object' || Array.isArray(toolResources)) {
        return {
            isValid: false,
            error: new MCPError(ErrorCodes.INVALID_PARAMS, `Parameter '${paramName}' must be an object, but received: ${typeof toolResources}. Example: {"file_search": {"vector_store_ids": ["vs_123"]}}. See docs://best-practices for tool resource configuration.`)
        };
    }
    // Check if file_search tool_resources is provided without file_search tool
    if (toolResources.file_search && !tools.some(tool => tool.type === 'file_search')) {
        return {
            isValid: false,
            error: new MCPError(ErrorCodes.INVALID_PARAMS, `Cannot specify 'file_search' in '${paramName}' without including file_search tool in tools array. Add {"type": "file_search"} to tools or remove file_search from tool_resources. See docs://best-practices for configuration guidance.`)
        };
    }
    // Check if code_interpreter tool_resources is provided without code_interpreter tool
    if (toolResources.code_interpreter && !tools.some(tool => tool.type === 'code_interpreter')) {
        return {
            isValid: false,
            error: new MCPError(ErrorCodes.INVALID_PARAMS, `Cannot specify 'code_interpreter' in '${paramName}' without including code_interpreter tool in tools array. Add {"type": "code_interpreter"} to tools or remove code_interpreter from tool_resources. See docs://best-practices for configuration guidance.`)
        };
    }
    return { isValid: true };
}
/**
 * Validate message role
 */
export function validateMessageRole(role, paramName = 'role') {
    return validateEnum(role, paramName, ['user', 'assistant']);
}
/**
 * Validate pagination parameters
 */
export function validatePaginationParams(params) {
    // Validate limit
    if (params.limit !== undefined) {
        const limitValidation = validateNumericRange(params.limit, 'limit', 1, 100, 20);
        if (!limitValidation.isValid) {
            return limitValidation;
        }
    }
    // Validate order
    if (params.order !== undefined) {
        const orderValidation = validateEnum(params.order, 'order', ['asc', 'desc'], 'desc');
        if (!orderValidation.isValid) {
            return orderValidation;
        }
    }
    // Validate after/before cursor format (if provided)
    if (params.after !== undefined && params.after !== null) {
        if (typeof params.after !== 'string' || params.after.trim().length === 0) {
            return {
                isValid: false,
                error: new MCPError(ErrorCodes.INVALID_PARAMS, `Parameter 'after' must be a non-empty string cursor ID (e.g., 'asst_abc123def456ghi789jkl012'). Use the ID from the last item of the previous page.`)
            };
        }
    }
    if (params.before !== undefined && params.before !== null) {
        if (typeof params.before !== 'string' || params.before.trim().length === 0) {
            return {
                isValid: false,
                error: new MCPError(ErrorCodes.INVALID_PARAMS, `Parameter 'before' must be a non-empty string cursor ID (e.g., 'asst_abc123def456ghi789jkl012'). Use the ID from the first item of the next page.`)
            };
        }
    }
    // Cannot specify both after and before
    if (params.after && params.before) {
        return {
            isValid: false,
            error: new MCPError(ErrorCodes.INVALID_PARAMS, `Cannot specify both 'after' and 'before' parameters simultaneously. Use 'after' for forward pagination or 'before' for backward pagination, but not both.`)
        };
    }
    return { isValid: true };
}
/**
 * Comprehensive validation for assistant creation
 */
export function validateCreateAssistantParams(params) {
    // Validate required model
    const modelValidation = validateModel(params.model);
    if (!modelValidation.isValid) {
        return modelValidation;
    }
    // Validate optional name
    if (params.name !== undefined) {
        const nameValidation = validateRequiredString(params.name, 'name', ['Customer Support Bot', 'Code Review Assistant']);
        if (!nameValidation.isValid) {
            return nameValidation;
        }
    }
    // Validate optional description
    if (params.description !== undefined && params.description !== null) {
        if (typeof params.description !== 'string') {
            return {
                isValid: false,
                error: new MCPError(ErrorCodes.INVALID_PARAMS, `Parameter 'description' must be a string, but received: ${typeof params.description}. Example: "Helps customers with product questions and troubleshooting".`)
            };
        }
    }
    // Validate optional instructions
    if (params.instructions !== undefined && params.instructions !== null) {
        if (typeof params.instructions !== 'string') {
            return {
                isValid: false,
                error: new MCPError(ErrorCodes.INVALID_PARAMS, `Parameter 'instructions' must be a string, but received: ${typeof params.instructions}. Example: "You are a helpful customer support assistant. Be polite and provide clear answers."`)
            };
        }
    }
    // Validate tools
    if (params.tools !== undefined) {
        const toolsValidation = validateTools(params.tools);
        if (!toolsValidation.isValid) {
            return toolsValidation;
        }
        // Validate tool_resources if tools are provided
        if (params.tool_resources !== undefined) {
            const toolResourcesValidation = validateToolResources(params.tool_resources, params.tools);
            if (!toolResourcesValidation.isValid) {
                return toolResourcesValidation;
            }
        }
    }
    // Validate metadata
    if (params.metadata !== undefined) {
        const metadataValidation = validateMetadata(params.metadata);
        if (!metadataValidation.isValid) {
            return metadataValidation;
        }
    }
    // Validate temperature
    if (params.temperature !== undefined) {
        const tempValidation = validateNumericRange(params.temperature, 'temperature', 0, 2);
        if (!tempValidation.isValid) {
            return tempValidation;
        }
    }
    // Validate top_p
    if (params.top_p !== undefined) {
        const topPValidation = validateNumericRange(params.top_p, 'top_p', 0, 1);
        if (!topPValidation.isValid) {
            return topPValidation;
        }
    }
    return { isValid: true };
}
