/**
 * Generic Types - Provider-agnostic type definitions
 *
 * This module defines generic, provider-agnostic types that map to specific
 * provider implementations. It enables type-safe operations across different
 * LLM providers while maintaining compatibility with existing OpenAI types.
 *
 * Key Features:
 * - Provider-agnostic type definitions
 * - Backward compatibility with OpenAI types
 * - Type mapping utilities
 * - Generic request/response interfaces
 * - Extensible for future providers
 */
// Re-export functions and classes
export { LLMProviderError, createProviderError, } from '../services/llm-service.js';
// Re-export registry functions and classes
export { ProviderRegistry, getGlobalProviderRegistry, initializeGlobalProviderRegistry, shutdownGlobalProviderRegistry, } from '../services/provider-registry.js';
/**
 * Type Mapping Utilities
 * Functions to convert between provider-specific and generic types
 */
/**
 * Convert OpenAI Assistant to Generic Assistant
 */
export function mapOpenAIToGenericAssistant(openaiAssistant) {
    return {
        id: openaiAssistant.id,
        name: openaiAssistant.name,
        description: openaiAssistant.description,
        model: openaiAssistant.model,
        instructions: openaiAssistant.instructions,
        tools: openaiAssistant.tools.map(mapOpenAIToGenericTool),
        metadata: openaiAssistant.metadata,
        createdAt: new Date(openaiAssistant.created_at * 1000),
        providerData: openaiAssistant,
    };
}
/**
 * Convert Generic Assistant to OpenAI Assistant
 */
export function mapGenericToOpenAIAssistant(genericAssistant) {
    // If we have original provider data, use it as base
    if (genericAssistant.providerData && typeof genericAssistant.providerData === 'object') {
        return {
            ...genericAssistant.providerData,
            id: genericAssistant.id,
            name: genericAssistant.name,
            description: genericAssistant.description,
            model: genericAssistant.model,
            instructions: genericAssistant.instructions,
            tools: genericAssistant.tools.map(mapGenericToOpenAITool),
            metadata: genericAssistant.metadata,
        };
    }
    // Create new OpenAI assistant structure
    return {
        id: genericAssistant.id,
        object: 'assistant',
        created_at: Math.floor(genericAssistant.createdAt.getTime() / 1000),
        name: genericAssistant.name,
        description: genericAssistant.description,
        model: genericAssistant.model,
        instructions: genericAssistant.instructions,
        tools: genericAssistant.tools.map(mapGenericToOpenAITool),
        metadata: genericAssistant.metadata,
        temperature: null,
        top_p: null,
        response_format: 'auto',
    };
}
/**
 * Convert OpenAI Tool to Generic Tool
 */
export function mapOpenAIToGenericTool(openaiTool) {
    return {
        type: openaiTool.type,
        function: openaiTool.function,
        providerData: openaiTool,
    };
}
/**
 * Convert Generic Tool to OpenAI Tool
 */
export function mapGenericToOpenAITool(genericTool) {
    if (genericTool.providerData) {
        return genericTool.providerData;
    }
    return {
        type: genericTool.type,
        function: genericTool.function,
    };
}
/**
 * Convert OpenAI Thread to Generic Thread
 */
export function mapOpenAIToGenericThread(openaiThread) {
    return {
        id: openaiThread.id,
        metadata: openaiThread.metadata,
        createdAt: new Date(openaiThread.created_at * 1000),
        providerData: openaiThread,
    };
}
/**
 * Convert Generic Thread to OpenAI Thread
 */
export function mapGenericToOpenAIThread(genericThread) {
    if (genericThread.providerData) {
        return genericThread.providerData;
    }
    return {
        id: genericThread.id,
        object: 'thread',
        created_at: Math.floor(genericThread.createdAt.getTime() / 1000),
        metadata: genericThread.metadata,
    };
}
/**
 * Convert OpenAI Message to Generic Message
 */
export function mapOpenAIToGenericMessage(openaiMessage) {
    return {
        id: openaiMessage.id,
        threadId: openaiMessage.thread_id,
        role: openaiMessage.role,
        content: openaiMessage.content.map(mapOpenAIToGenericMessageContent),
        metadata: openaiMessage.metadata,
        createdAt: new Date(openaiMessage.created_at * 1000),
        providerData: openaiMessage,
    };
}
/**
 * Convert Generic Message to OpenAI Message
 */
export function mapGenericToOpenAIMessage(genericMessage) {
    if (genericMessage.providerData) {
        return genericMessage.providerData;
    }
    return {
        id: genericMessage.id,
        object: 'thread.message',
        created_at: Math.floor(genericMessage.createdAt.getTime() / 1000),
        thread_id: genericMessage.threadId,
        status: 'completed',
        role: genericMessage.role,
        content: genericMessage.content.map(mapGenericToOpenAIMessageContent),
        metadata: genericMessage.metadata,
    };
}
/**
 * Convert OpenAI Message Content to Generic Message Content
 */
export function mapOpenAIToGenericMessageContent(openaiContent) {
    const genericContent = {
        type: openaiContent.type,
        providerData: openaiContent,
    };
    if (openaiContent.type === 'text' && openaiContent.text) {
        genericContent.text = openaiContent.text.value;
    }
    else if (openaiContent.type === 'image_url' && openaiContent.image_url) {
        genericContent.imageUrl = openaiContent.image_url.url;
    }
    else if (openaiContent.type === 'image_file' && openaiContent.image_file) {
        genericContent.fileId = openaiContent.image_file.file_id;
    }
    return genericContent;
}
/**
 * Convert Generic Message Content to OpenAI Message Content
 */
export function mapGenericToOpenAIMessageContent(genericContent) {
    if (genericContent.providerData) {
        return genericContent.providerData;
    }
    if (genericContent.type === 'text') {
        return {
            type: 'text',
            text: {
                value: genericContent.text || '',
                annotations: [],
            },
        };
    }
    else if (genericContent.type === 'image' && genericContent.imageUrl) {
        return {
            type: 'image_url',
            image_url: {
                url: genericContent.imageUrl,
            },
        };
    }
    else if (genericContent.type === 'file' && genericContent.fileId) {
        return {
            type: 'image_file',
            image_file: {
                file_id: genericContent.fileId,
            },
        };
    }
    // Fallback to text content
    return {
        type: 'text',
        text: {
            value: genericContent.text || '',
            annotations: [],
        },
    };
}
/**
 * Convert OpenAI Run to Generic Run
 */
export function mapOpenAIToGenericRun(openaiRun) {
    return {
        id: openaiRun.id,
        threadId: openaiRun.thread_id,
        assistantId: openaiRun.assistant_id,
        status: openaiRun.status,
        model: openaiRun.model,
        instructions: openaiRun.instructions,
        tools: openaiRun.tools.map(mapOpenAIToGenericTool),
        metadata: openaiRun.metadata,
        createdAt: new Date(openaiRun.created_at * 1000),
        startedAt: openaiRun.started_at ? new Date(openaiRun.started_at * 1000) : undefined,
        completedAt: openaiRun.completed_at ? new Date(openaiRun.completed_at * 1000) : undefined,
        failedAt: openaiRun.failed_at ? new Date(openaiRun.failed_at * 1000) : undefined,
        cancelledAt: openaiRun.cancelled_at ? new Date(openaiRun.cancelled_at * 1000) : undefined,
        expiresAt: openaiRun.expires_at ? new Date(openaiRun.expires_at * 1000) : undefined,
        lastError: openaiRun.last_error,
        usage: openaiRun.usage ? {
            promptTokens: openaiRun.usage.prompt_tokens,
            completionTokens: openaiRun.usage.completion_tokens,
            totalTokens: openaiRun.usage.total_tokens,
        } : undefined,
        providerData: openaiRun,
    };
}
/**
 * Convert Generic Run to OpenAI Run
 */
export function mapGenericToOpenAIRun(genericRun) {
    if (genericRun.providerData) {
        return genericRun.providerData;
    }
    return {
        id: genericRun.id,
        object: 'thread.run',
        created_at: Math.floor(genericRun.createdAt.getTime() / 1000),
        thread_id: genericRun.threadId,
        assistant_id: genericRun.assistantId,
        status: genericRun.status,
        model: genericRun.model,
        instructions: genericRun.instructions,
        tools: genericRun.tools.map(mapGenericToOpenAITool),
        metadata: genericRun.metadata,
        started_at: genericRun.startedAt ? Math.floor(genericRun.startedAt.getTime() / 1000) : undefined,
        completed_at: genericRun.completedAt ? Math.floor(genericRun.completedAt.getTime() / 1000) : undefined,
        failed_at: genericRun.failedAt ? Math.floor(genericRun.failedAt.getTime() / 1000) : undefined,
        cancelled_at: genericRun.cancelledAt ? Math.floor(genericRun.cancelledAt.getTime() / 1000) : undefined,
        expires_at: genericRun.expiresAt ? Math.floor(genericRun.expiresAt.getTime() / 1000) : undefined,
        last_error: genericRun.lastError ? {
            code: genericRun.lastError.code,
            message: genericRun.lastError.message,
        } : undefined,
        usage: genericRun.usage ? {
            prompt_tokens: genericRun.usage.promptTokens,
            completion_tokens: genericRun.usage.completionTokens,
            total_tokens: genericRun.usage.totalTokens,
        } : undefined,
    };
}
/**
 * Convert OpenAI Run Step to Generic Run Step
 */
export function mapOpenAIToGenericRunStep(openaiRunStep) {
    return {
        id: openaiRunStep.id,
        runId: openaiRunStep.run_id,
        threadId: openaiRunStep.thread_id,
        assistantId: openaiRunStep.assistant_id,
        type: openaiRunStep.type,
        status: openaiRunStep.status,
        stepDetails: openaiRunStep.step_details,
        createdAt: new Date(openaiRunStep.created_at * 1000),
        completedAt: openaiRunStep.completed_at ? new Date(openaiRunStep.completed_at * 1000) : undefined,
        failedAt: openaiRunStep.failed_at ? new Date(openaiRunStep.failed_at * 1000) : undefined,
        cancelledAt: openaiRunStep.cancelled_at ? new Date(openaiRunStep.cancelled_at * 1000) : undefined,
        expiredAt: openaiRunStep.expired_at ? new Date(openaiRunStep.expired_at * 1000) : undefined,
        lastError: openaiRunStep.last_error,
        usage: openaiRunStep.usage ? {
            promptTokens: openaiRunStep.usage.prompt_tokens,
            completionTokens: openaiRunStep.usage.completion_tokens,
            totalTokens: openaiRunStep.usage.total_tokens,
        } : undefined,
        metadata: openaiRunStep.metadata,
        providerData: openaiRunStep,
    };
}
/**
 * Convert Generic Run Step to OpenAI Run Step
 */
export function mapGenericToOpenAIRunStep(genericRunStep) {
    if (genericRunStep.providerData) {
        return genericRunStep.providerData;
    }
    return {
        id: genericRunStep.id,
        object: 'thread.run.step',
        created_at: Math.floor(genericRunStep.createdAt.getTime() / 1000),
        assistant_id: genericRunStep.assistantId,
        thread_id: genericRunStep.threadId,
        run_id: genericRunStep.runId,
        type: genericRunStep.type,
        status: genericRunStep.status,
        step_details: genericRunStep.stepDetails,
        completed_at: genericRunStep.completedAt ? Math.floor(genericRunStep.completedAt.getTime() / 1000) : undefined,
        failed_at: genericRunStep.failedAt ? Math.floor(genericRunStep.failedAt.getTime() / 1000) : undefined,
        cancelled_at: genericRunStep.cancelledAt ? Math.floor(genericRunStep.cancelledAt.getTime() / 1000) : undefined,
        expired_at: genericRunStep.expiredAt ? Math.floor(genericRunStep.expiredAt.getTime() / 1000) : undefined,
        last_error: genericRunStep.lastError ? {
            code: genericRunStep.lastError.code,
            message: genericRunStep.lastError.message,
        } : undefined,
        usage: genericRunStep.usage ? {
            prompt_tokens: genericRunStep.usage.promptTokens,
            completion_tokens: genericRunStep.usage.completionTokens,
            total_tokens: genericRunStep.usage.totalTokens,
        } : undefined,
        metadata: genericRunStep.metadata,
    };
}
/**
 * Request Mapping Functions
 */
/**
 * Convert OpenAI Create Assistant Request to Generic
 */
export function mapOpenAIToGenericCreateAssistantRequest(openaiRequest) {
    return {
        model: openaiRequest.model,
        name: openaiRequest.name,
        description: openaiRequest.description,
        instructions: openaiRequest.instructions,
        tools: openaiRequest.tools?.map(mapOpenAIToGenericTool),
        metadata: openaiRequest.metadata,
        providerOptions: openaiRequest,
    };
}
/**
 * Convert Generic Create Assistant Request to OpenAI
 */
export function mapGenericToOpenAICreateAssistantRequest(genericRequest) {
    if (genericRequest.providerOptions) {
        return genericRequest.providerOptions;
    }
    return {
        model: genericRequest.model,
        name: genericRequest.name,
        description: genericRequest.description,
        instructions: genericRequest.instructions,
        tools: genericRequest.tools?.map(mapGenericToOpenAITool),
        metadata: genericRequest.metadata,
    };
}
/**
 * Response Mapping Functions
 */
/**
 * Convert OpenAI List Response to Generic
 */
export function mapOpenAIToGenericListResponse(openaiResponse, mapper) {
    return {
        data: openaiResponse.data.map(mapper),
        hasMore: openaiResponse.has_more,
        firstId: openaiResponse.first_id,
        lastId: openaiResponse.last_id,
    };
}
/**
 * Convert Generic List Response to OpenAI
 */
export function mapGenericToOpenAIListResponse(genericResponse, mapper) {
    return {
        object: 'list',
        data: genericResponse.data.map(mapper),
        has_more: genericResponse.hasMore,
        first_id: genericResponse.firstId,
        last_id: genericResponse.lastId,
    };
}
/**
 * Helper function to preserve provider-specific data during conversions
 */
export function preserveProviderData(source, target) {
    if (source.providerData) {
        target.providerData = source.providerData;
    }
    return target;
}
