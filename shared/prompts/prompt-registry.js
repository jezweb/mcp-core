/**
 * Prompt Registry - Central registry for managing MCP prompts
 *
 * This module implements the PromptRegistry interface and provides
 * centralized management of all available prompts for the MCP server.
 */
import { getPromptTemplates } from './prompt-templates.js';
/**
 * Implementation of the PromptRegistry interface
 */
export class PromptRegistry {
    constructor() {
        this.templates = new Map();
        // Register all default prompt templates
        this.registerDefaultTemplates();
    }
    /**
     * Register all default prompt templates
     */
    registerDefaultTemplates() {
        const templates = getPromptTemplates();
        for (const template of templates) {
            this.registerPrompt(template);
        }
    }
    /**
     * Get all available prompts
     */
    getPrompts() {
        return Array.from(this.templates.values()).map(template => ({
            name: template.name,
            title: template.title,
            description: template.description,
            arguments: template.arguments
        }));
    }
    /**
     * Get a specific prompt by name
     */
    getPrompt(name) {
        const template = this.templates.get(name);
        if (!template) {
            return null;
        }
        return {
            name: template.name,
            title: template.title,
            description: template.description,
            arguments: template.arguments
        };
    }
    /**
     * Generate messages for a prompt with arguments
     */
    generatePromptMessages(name, args = {}) {
        const template = this.templates.get(name);
        if (!template) {
            throw new Error(`Prompt not found: ${name}`);
        }
        // Validate arguments
        const validation = this.validateArguments(template, args);
        if (!validation.isValid) {
            throw new Error(`Invalid arguments for prompt ${name}: ${validation.errors.join(', ')}`);
        }
        // Generate messages using the template
        return template.generateMessages(args);
    }
    /**
     * Register a new prompt template
     */
    registerPrompt(template) {
        this.templates.set(template.name, template);
    }
    /**
     * Check if a prompt exists
     */
    hasPrompt(name) {
        return this.templates.has(name);
    }
    /**
     * Get prompt template (internal use)
     */
    getTemplate(name) {
        return this.templates.get(name) || null;
    }
    /**
     * Get all prompt names
     */
    getPromptNames() {
        return Array.from(this.templates.keys());
    }
    /**
     * Get prompts by category
     */
    getPromptsByCategory(category) {
        return Array.from(this.templates.values())
            .filter(template => template.category === category)
            .map(template => ({
            name: template.name,
            title: template.title,
            description: template.description,
            arguments: template.arguments
        }));
    }
    /**
     * Get prompts by tag
     */
    getPromptsByTag(tag) {
        return Array.from(this.templates.values())
            .filter(template => template.tags?.includes(tag))
            .map(template => ({
            name: template.name,
            title: template.title,
            description: template.description,
            arguments: template.arguments
        }));
    }
    /**
     * Search prompts by name or description
     */
    searchPrompts(query) {
        const lowerQuery = query.toLowerCase();
        return Array.from(this.templates.values())
            .filter(template => template.name.toLowerCase().includes(lowerQuery) ||
            template.title?.toLowerCase().includes(lowerQuery) ||
            template.description?.toLowerCase().includes(lowerQuery))
            .map(template => ({
            name: template.name,
            title: template.title,
            description: template.description,
            arguments: template.arguments
        }));
    }
    /**
     * Validate arguments for a prompt template
     */
    validateArguments(template, args) {
        const errors = [];
        const missingArguments = [];
        if (!template.arguments) {
            return { isValid: true, errors: [], missingArguments: [] };
        }
        // Check required arguments
        for (const arg of template.arguments) {
            if (arg.required && !(arg.name in args)) {
                missingArguments.push(arg.name);
                errors.push(`Missing required argument: ${arg.name}`);
            }
        }
        // Check for unknown arguments (optional validation)
        const validArgNames = new Set(template.arguments.map(arg => arg.name));
        for (const argName in args) {
            if (!validArgNames.has(argName)) {
                errors.push(`Unknown argument: ${argName}`);
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
            missingArguments
        };
    }
    /**
     * Get registry statistics
     */
    getStats() {
        const templates = Array.from(this.templates.values());
        const categories = new Set(templates.map(t => t.category).filter(Boolean));
        const tags = new Set(templates.flatMap(t => t.tags || []));
        return {
            totalPrompts: templates.length,
            categories: Array.from(categories),
            tags: Array.from(tags),
            promptsByCategory: Object.fromEntries(Array.from(categories).map(cat => [
                cat,
                templates.filter(t => t.category === cat).length
            ]))
        };
    }
    /**
     * Export all prompts for debugging
     */
    exportPrompts() {
        return Array.from(this.templates.values());
    }
    /**
     * Clear all prompts (for testing)
     */
    clear() {
        this.templates.clear();
    }
    /**
     * Reset to default prompts
     */
    reset() {
        this.clear();
        this.registerDefaultTemplates();
    }
}
/**
 * Global prompt registry instance
 */
export const promptRegistry = new PromptRegistry();
/**
 * Convenience functions for common operations
 */
/**
 * Get all available prompts
 */
export function getAvailablePrompts() {
    return promptRegistry.getPrompts();
}
/**
 * Get a specific prompt
 */
export function getPrompt(name) {
    return promptRegistry.getPrompt(name);
}
/**
 * Generate prompt messages
 */
export function generatePromptMessages(name, args) {
    return promptRegistry.generatePromptMessages(name, args);
}
/**
 * Check if a prompt exists
 */
export function hasPrompt(name) {
    return promptRegistry.hasPrompt(name);
}
/**
 * Search prompts
 */
export function searchPrompts(query) {
    return promptRegistry.searchPrompts(query);
}
/**
 * Get prompts by category
 */
export function getPromptsByCategory(category) {
    return promptRegistry.getPromptsByCategory(category);
}
/**
 * Get registry statistics
 */
export function getPromptRegistryStats() {
    return promptRegistry.getStats();
}
