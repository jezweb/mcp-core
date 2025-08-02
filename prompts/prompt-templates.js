/**
 * Prompt Templates - Generated from modular JSON definitions
 *
 * This file is auto-generated from the hybrid modular architecture.
 * Do not edit manually - changes will be overwritten.
 *
 * Generated at: 2025-07-31T05:43:46.950Z
 * Source: definitions/prompts/
 */
/**
 * Prompt template definitions (MCP format)
 */
const PROMPT_TEMPLATES = {
    "create-coding-assistant": {
        "name": "create-coding-assistant",
        "title": "Create Coding Assistant",
        "description": "Generate a specialized coding assistant with custom instructions and tools",
        "arguments": [
            {
                "name": "specialization",
                "description": "Programming specialization (e.g., \"Python web development\", \"React frontend\", \"DevOps\")",
                "required": true
            },
            {
                "name": "experience_level",
                "description": "Target experience level (beginner, intermediate, expert)",
                "required": false
            },
            {
                "name": "additional_tools",
                "description": "Additional tools to enable (code_interpreter, file_search)",
                "required": false
            }
        ]
    },
    "create-data-analyst": {
        "name": "create-data-analyst",
        "title": "Create Data Analyst Assistant",
        "description": "Generate a data analysis assistant with statistical and visualization capabilities",
        "arguments": [
            {
                "name": "domain",
                "description": "Data analysis domain (e.g., \"business intelligence\", \"scientific research\", \"marketing\")",
                "required": true
            },
            {
                "name": "tools_focus",
                "description": "Primary tools focus (python, r, sql, visualization)",
                "required": false
            }
        ]
    },
    "create-writing-assistant": {
        "name": "create-writing-assistant",
        "title": "Create Writing Assistant",
        "description": "Generate a professional writing assistant for content creation and editing",
        "arguments": [
            {
                "name": "writing_type",
                "description": "Type of writing (e.g., \"technical documentation\", \"marketing copy\", \"academic papers\")",
                "required": true
            },
            {
                "name": "tone",
                "description": "Preferred writing tone (professional, casual, academic, creative)",
                "required": false
            },
            {
                "name": "audience",
                "description": "Target audience (general public, technical experts, students, customers)",
                "required": false
            }
        ]
    },
    "create-conversation-thread": {
        "name": "create-conversation-thread",
        "title": "Create Conversation Thread",
        "description": "Set up a new conversation thread with initial context and metadata",
        "arguments": [
            {
                "name": "purpose",
                "description": "Purpose of the conversation (e.g., \"code review\", \"data analysis\", \"writing help\")",
                "required": true
            },
            {
                "name": "context",
                "description": "Initial context or background information",
                "required": false
            },
            {
                "name": "user_id",
                "description": "User identifier for tracking",
                "required": false
            }
        ]
    },
    "organize-thread-messages": {
        "name": "organize-thread-messages",
        "title": "Organize Thread Messages",
        "description": "Analyze and organize messages in a thread for better conversation flow",
        "arguments": [
            {
                "name": "thread_id",
                "description": "Thread ID to analyze",
                "required": true
            },
            {
                "name": "organization_type",
                "description": "How to organize (chronological, by_topic, by_importance)",
                "required": false
            }
        ]
    },
    "explain-code": {
        "name": "explain-code",
        "title": "Explain Code",
        "description": "Provide detailed explanation of how code works",
        "arguments": [
            {
                "name": "code",
                "description": "Code to explain",
                "required": true
            },
            {
                "name": "language",
                "description": "Programming language",
                "required": false
            },
            {
                "name": "detail_level",
                "description": "Level of detail (basic, intermediate, advanced)",
                "required": false
            }
        ]
    },
    "review-code": {
        "name": "review-code",
        "title": "Code Review",
        "description": "Perform comprehensive code review with suggestions for improvement",
        "arguments": [
            {
                "name": "code",
                "description": "Code to review",
                "required": true
            },
            {
                "name": "language",
                "description": "Programming language",
                "required": false
            },
            {
                "name": "focus_areas",
                "description": "Specific areas to focus on (security, performance, readability, best_practices)",
                "required": false
            }
        ]
    },
    "configure-assistant-run": {
        "name": "configure-assistant-run",
        "title": "Configure Assistant Run",
        "description": "Set up optimal run configuration for an assistant based on the task",
        "arguments": [
            {
                "name": "task_type",
                "description": "Type of task (code_review, data_analysis, writing, general_qa)",
                "required": true
            },
            {
                "name": "complexity",
                "description": "Task complexity (simple, moderate, complex)",
                "required": false
            },
            {
                "name": "time_sensitivity",
                "description": "Time sensitivity (low, medium, high)",
                "required": false
            }
        ]
    },
    "debug-run-issues": {
        "name": "debug-run-issues",
        "title": "Debug Run Issues",
        "description": "Analyze and troubleshoot assistant run problems",
        "arguments": [
            {
                "name": "run_id",
                "description": "Run ID that has issues",
                "required": true
            },
            {
                "name": "issue_description",
                "description": "Description of the observed issue",
                "required": true
            },
            {
                "name": "run_status",
                "description": "Current run status (failed, cancelled, requires_action, etc.)",
                "required": false
            }
        ]
    },
    "analyze-dataset": {
        "name": "analyze-dataset",
        "title": "Analyze Dataset",
        "description": "Perform comprehensive analysis of a dataset",
        "arguments": [
            {
                "name": "dataset_description",
                "description": "Description of the dataset",
                "required": true
            },
            {
                "name": "analysis_goals",
                "description": "What you want to learn from the data",
                "required": true
            },
            {
                "name": "data_format",
                "description": "Format of the data (CSV, JSON, database, etc.)",
                "required": false
            }
        ]
    }
};
/**
 * Template content mapping for message generation
 */
const TEMPLATE_CONTENT = {
    'create-coding-assistant': "Create a specialized coding assistant for {{specialization}}. The assistant should be designed for {{experience_level || 'intermediate'}} developers and include {{additional_tools || 'code_interpreter'}} tools. Please provide the complete assistant configuration including name, description, instructions, and tools array.",
    'create-data-analyst': "Create a data analyst assistant specialized in {{domain}} with a focus on {{tools_focus || 'python'}}. The assistant should be capable of data analysis, statistical modeling, and creating visualizations. Include appropriate tools and detailed instructions for data analysis workflows.",
    'create-writing-assistant': "Create a writing assistant specialized in {{writing_type}} with a {{tone || 'professional'}} tone for {{audience || 'general public'}}. The assistant should help with content creation, editing, proofreading, and style optimization. Include file_search tools for research capabilities.",
    'create-conversation-thread': "Create a new conversation thread for {{purpose}}. Set up appropriate metadata including user_id: \"{{user_id || 'anonymous'}}\", session_type: \"{{purpose}}\", and timestamp.{{#if context}}\n\nContext: {{context}}{{/if}}",
    'organize-thread-messages': "Analyze and organize the messages in thread {{thread_id}} using {{organization_type || 'chronological'}} organization. Provide a summary of the conversation flow and suggest any improvements for better structure.",
    'explain-code': "Explain how this {{language || 'auto-detect'}} code works at a {{detail_level || 'intermediate'}} level:\n\n```\n{{code}}\n```\n\nBreak down the logic, explain key concepts, and describe what each part does.",
    'review-code': "Please review this {{language || 'auto-detect'}} code focusing on {{focus_areas || 'all aspects'}}:\n\n```\n{{code}}\n```\n\nProvide feedback on code quality, potential issues, and suggestions for improvement.",
    'configure-assistant-run': "Configure an optimal assistant run for a {{task_type}} task with {{complexity || 'moderate'}} complexity and {{time_sensitivity || 'medium'}} time sensitivity. Recommend appropriate model, temperature, max_tokens, and tool_choice settings.",
    'debug-run-issues': "Debug issues with run {{run_id}}. Current status: {{run_status || 'unknown'}}. Issue description: {{issue_description}}. Analyze the run steps, check for errors, and provide troubleshooting recommendations.",
    'analyze-dataset': "Analyze this {{data_format || 'CSV'}} dataset: {{dataset_description}}\n\nAnalysis goals: {{analysis_goals}}\n\nPerform exploratory data analysis, identify patterns, and provide insights. Include statistical summaries and visualizations where appropriate."
};
/**
 * Template metadata mapping
 */
const TEMPLATE_METADATA = {
    'create-coding-assistant': { category: "assistant", tags: ["coding", "development", "assistant"] },
    'create-data-analyst': { category: "assistant", tags: ["data", "analytics", "statistics", "assistant"] },
    'create-writing-assistant': { category: "assistant", tags: ["writing", "content", "editing", "assistant"] },
    'create-conversation-thread': { category: "thread", tags: ["thread", "conversation", "setup"] },
    'organize-thread-messages': { category: "thread", tags: ["thread", "organization", "messages"] },
    'explain-code': { category: "analysis", tags: ["code", "explanation", "education"] },
    'review-code': { category: "analysis", tags: ["code", "review", "quality"] },
    'configure-assistant-run': { category: "run", tags: ["run", "configuration", "optimization"] },
    'debug-run-issues': { category: "run", tags: ["debug", "troubleshooting", "run"] },
    'analyze-dataset': { category: "data", tags: ["data", "analysis", "statistics"] }
};
/**
 * Generate messages for a prompt template
 */
function generateMessages(templateName, args = {}) {
    const template = TEMPLATE_CONTENT[templateName];
    if (!template) {
        throw new Error(`Template not found: ${templateName}`);
    }
    // Simple template substitution
    let content = template;
    for (const [key, value] of Object.entries(args)) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        content = content.replace(regex, value);
    }
    // Handle default values like {{key || 'default'}}
    content = content.replace(/{{\s*([^|]+?)\s*\|\|\s*'([^']*)'\s*}}/g, (match, key, defaultValue) => {
        return args[key.trim()] || defaultValue;
    });
    return [{
            role: 'user',
            content: {
                type: 'text',
                text: content
            }
        }];
}
/**
 * Convert Prompt to PromptTemplate with generateMessages method
 */
function createPromptTemplate(prompt) {
    const metadata = TEMPLATE_METADATA[prompt.name] || {};
    return {
        name: prompt.name,
        title: prompt.title || prompt.name,
        description: prompt.description || '',
        arguments: prompt.arguments || [],
        category: metadata.category,
        tags: metadata.tags,
        generateMessages: (args) => generateMessages(prompt.name, args)
    };
}
/**
 * Get all available prompt templates
 *
 * @returns Array of prompt templates
 */
export function getPromptTemplates() {
    return Object.values(PROMPT_TEMPLATES).map(createPromptTemplate);
}
/**
 * Get a specific prompt template by name
 *
 * @param name - The prompt template name
 * @returns The prompt template or undefined
 */
export function getPromptTemplate(name) {
    const prompt = PROMPT_TEMPLATES[name];
    return prompt ? createPromptTemplate(prompt) : undefined;
}
/**
 * Get prompt templates by category
 *
 * @param category - The category to filter by
 * @returns Array of prompt templates in the category
 */
export function getPromptTemplatesByCategory(category) {
    return Object.values(PROMPT_TEMPLATES)
        .map(createPromptTemplate)
        .filter(template => template.category === category ||
        template.name.startsWith(category) ||
        (template.description && template.description.toLowerCase().includes(category.toLowerCase())));
}
// Export individual templates for backward compatibility
export const CreateCodingAssistant = PROMPT_TEMPLATES['create-coding-assistant'];
export const CreateDataAnalyst = PROMPT_TEMPLATES['create-data-analyst'];
export const CreateWritingAssistant = PROMPT_TEMPLATES['create-writing-assistant'];
export const CreateConversationThread = PROMPT_TEMPLATES['create-conversation-thread'];
export const OrganizeThreadMessages = PROMPT_TEMPLATES['organize-thread-messages'];
export const ExplainCode = PROMPT_TEMPLATES['explain-code'];
export const ReviewCode = PROMPT_TEMPLATES['review-code'];
export const ConfigureAssistantRun = PROMPT_TEMPLATES['configure-assistant-run'];
export const DebugRunIssues = PROMPT_TEMPLATES['debug-run-issues'];
export const AnalyzeDataset = PROMPT_TEMPLATES['analyze-dataset'];
