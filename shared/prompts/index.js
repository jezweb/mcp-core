/**
 * Prompts Index - Centralized exports for all prompt-related functionality
 *
 * This module provides clean, tree-shakable exports for all prompt functionality
 * including templates, registry, and utility functions.
 */
// Export prompt templates
export * from './prompt-templates.js';
// Export prompt registry
export * from './prompt-registry.js';
// Re-export commonly used functions for convenience
export { getAvailablePrompts, getPrompt, generatePromptMessages, hasPrompt, searchPrompts, getPromptsByCategory, getPromptRegistryStats, promptRegistry } from './prompt-registry.js';
// Re-export prompt templates for convenience (using new generated exports)
export { getPromptTemplates, getPromptTemplate, getPromptTemplatesByCategory, 
// Individual template exports
CreateCodingAssistant, CreateDataAnalyst, CreateWritingAssistant, CreateConversationThread, OrganizeThreadMessages, ConfigureAssistantRun, DebugRunIssues, ReviewCode, ExplainCode, AnalyzeDataset } from './prompt-templates.js';
