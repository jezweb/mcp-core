/**
 * Generated Definitions Index - Unified Architecture
 * 
 * This file is auto-generated from JSON definitions (tools, prompts, resources).
 * Do not edit manually - changes will be overwritten.
 * 
 * Generated at: 2025-08-02T08:29:03.295Z
 */

// Re-export backward compatibility layers
export * from '../../shared/core/tool-definitions.js';
export * from '../../shared/prompts/prompt-templates.js';
export * from '../../shared/resources/resources.js';

// Re-export generated types
export * from './types/tools-types.js';
export * from './types/prompts-types.js';
export * from './types/resources-types.js';

// Unified metadata
export const DEFINITIONS_METADATA = {
  tools: {
    total: 22,
    categories: ["assistant","thread","message","run","run-step"],
    items: ["assistant-create","assistant-list","assistant-get","assistant-update","assistant-delete","thread-create","thread-get","thread-update","thread-delete","message-create","message-list","message-get","message-update","message-delete","run-create","run-list","run-get","run-update","run-cancel","run-submit-tool-outputs","run-step-list","run-step-get"]
  },
  prompts: {
    total: 10,
    categories: ["assistant","thread","analysis","run","data"],
    items: ["create-coding-assistant","create-data-analyst","create-writing-assistant","create-conversation-thread","organize-thread-messages","explain-code","review-code","configure-assistant-run","debug-run-issues","analyze-dataset"]
  },
  resources: {
    total: 9,
    categories: ["templates","documentation","examples"],
    items: ["assistant://templates/coding-assistant","assistant://templates/data-analyst","assistant://templates/customer-support","docs://openai-assistants-api","docs://best-practices","docs://troubleshooting/common-issues","examples://workflows/basic-workflow","examples://workflows/advanced-workflow","examples://workflows/batch-processing"]
  },
  generatedAt: '2025-08-02T08:29:03.295Z'
};
