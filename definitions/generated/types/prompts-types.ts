/**
 * Generated Prompts Types
 * 
 * This file is auto-generated from JSON prompts definitions.
 * Do not edit manually - changes will be overwritten.
 * 
 * Generated at: 2025-08-02T08:29:03.287Z
 */

export interface CreateCodingAssistantPrompt {
  name: 'create-coding-assistant';
  description: string;
  arguments: {
  /** Programming specialization (e.g., "Python web development", "React frontend", "DevOps") */
  specialization: string;
  /** Target experience level (beginner, intermediate, expert) */
  experience_level?: string;
  /** Additional tools to enable (code_interpreter, file_search) */
  additional_tools?: string;
  };
}

export interface CreateDataAnalystPrompt {
  name: 'create-data-analyst';
  description: string;
  arguments: {
  /** Data analysis domain (e.g., "business intelligence", "scientific research", "marketing") */
  domain: string;
  /** Primary tools focus (python, r, sql, visualization) */
  tools_focus?: string;
  };
}

export interface CreateWritingAssistantPrompt {
  name: 'create-writing-assistant';
  description: string;
  arguments: {
  /** Type of writing (e.g., "technical documentation", "marketing copy", "academic papers") */
  writing_type: string;
  /** Preferred writing tone (professional, casual, academic, creative) */
  tone?: string;
  /** Target audience (general public, technical experts, students, customers) */
  audience?: string;
  };
}

export interface CreateConversationThreadPrompt {
  name: 'create-conversation-thread';
  description: string;
  arguments: {
  /** Purpose of the conversation (e.g., "code review", "data analysis", "writing help") */
  purpose: string;
  /** Initial context or background information */
  context?: string;
  /** User identifier for tracking */
  user_id?: string;
  };
}

export interface OrganizeThreadMessagesPrompt {
  name: 'organize-thread-messages';
  description: string;
  arguments: {
  /** Thread ID to analyze */
  thread_id: string;
  /** How to organize (chronological, by_topic, by_importance) */
  organization_type?: string;
  };
}

export interface ExplainCodePrompt {
  name: 'explain-code';
  description: string;
  arguments: {
  /** Code to explain */
  code: string;
  /** Programming language */
  language?: string;
  /** Level of detail (basic, intermediate, advanced) */
  detail_level?: string;
  };
}

export interface ReviewCodePrompt {
  name: 'review-code';
  description: string;
  arguments: {
  /** Code to review */
  code: string;
  /** Programming language */
  language?: string;
  /** Specific areas to focus on (security, performance, readability, best_practices) */
  focus_areas?: string;
  };
}

export interface ConfigureAssistantRunPrompt {
  name: 'configure-assistant-run';
  description: string;
  arguments: {
  /** Type of task (code_review, data_analysis, writing, general_qa) */
  task_type: string;
  /** Task complexity (simple, moderate, complex) */
  complexity?: string;
  /** Time sensitivity (low, medium, high) */
  time_sensitivity?: string;
  };
}

export interface DebugRunIssuesPrompt {
  name: 'debug-run-issues';
  description: string;
  arguments: {
  /** Run ID that has issues */
  run_id: string;
  /** Description of the observed issue */
  issue_description: string;
  /** Current run status (failed, cancelled, requires_action, etc.) */
  run_status?: string;
  };
}

export interface AnalyzeDatasetPrompt {
  name: 'analyze-dataset';
  description: string;
  arguments: {
  /** Description of the dataset */
  dataset_description: string;
  /** What you want to learn from the data */
  analysis_goals: string;
  /** Format of the data (CSV, JSON, database, etc.) */
  data_format?: string;
  };
}

// Union type of all prompts types
export type PromptsTypes = CreateCodingAssistantPrompt | CreateDataAnalystPrompt | CreateWritingAssistantPrompt | CreateConversationThreadPrompt | OrganizeThreadMessagesPrompt | ExplainCodePrompt | ReviewCodePrompt | ConfigureAssistantRunPrompt | DebugRunIssuesPrompt | AnalyzeDatasetPrompt;

// prompts name to type mapping
export interface PromptsTypesMap {
  'create-coding-assistant': CreateCodingAssistantPrompt;
  'create-data-analyst': CreateDataAnalystPrompt;
  'create-writing-assistant': CreateWritingAssistantPrompt;
  'create-conversation-thread': CreateConversationThreadPrompt;
  'organize-thread-messages': OrganizeThreadMessagesPrompt;
  'explain-code': ExplainCodePrompt;
  'review-code': ReviewCodePrompt;
  'configure-assistant-run': ConfigureAssistantRunPrompt;
  'debug-run-issues': DebugRunIssuesPrompt;
  'analyze-dataset': AnalyzeDatasetPrompt;
}
