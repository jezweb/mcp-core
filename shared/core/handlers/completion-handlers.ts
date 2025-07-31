/**
 * Completion Handlers - MCP Completions Implementation
 * 
 * This module implements the MCP completions specification to provide
 * contextual autocompletion for prompt arguments, resource URIs, and tool parameters.
 * 
 * Features:
 * - Prompt argument completions based on prompt definitions
 * - Resource URI completions for available resources
 * - Tool parameter completions with OpenAI API context
 * - Maximum 100 items per response (MCP spec compliance)
 */

import {
  MCPCompletionRequest,
  MCPCompletionResponse,
  MCPCompletionItem,
  MCPError,
  ErrorCodes,
} from '../../types/index.js';
import { getResources } from '../../resources/index.js';
import { generateToolDefinitions } from '../tool-definitions.js';

/**
 * Context interface for completion handlers
 */
export interface CompletionHandlerContext {
  requestId: string | number | null;
}

/**
 * Main completion handler that routes to specific completion types
 */
export class CompletionHandler {
  private context: CompletionHandlerContext;

  constructor(context: CompletionHandlerContext) {
    this.context = context;
  }

  /**
   * Handle completion requests based on reference type
   */
  async handleCompletion(request: MCPCompletionRequest): Promise<MCPCompletionResponse['result']> {
    const { ref, argument } = request.params;

    try {
      let completions: MCPCompletionItem[];

      switch (ref.type) {
        case 'ref/prompt':
          completions = await this.getPromptCompletions(ref.name, argument.name, argument.value);
          break;
        case 'ref/resource':
          completions = await this.getResourceCompletions(ref.name, argument.name, argument.value);
          break;
        default:
          throw new MCPError(
            ErrorCodes.INVALID_PARAMS,
            `Unsupported reference type: ${ref.type}`
          );
      }

      return { completions };
    } catch (error) {
      if (error instanceof MCPError) {
        throw error;
      }
      throw new MCPError(
        ErrorCodes.INTERNAL_ERROR,
        `Completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get completions for prompt arguments
   */
  private async getPromptCompletions(
    promptName: string,
    argumentName: string,
    currentValue: string
  ): Promise<MCPCompletionItem[]> {
    const completions: string[] = [];

    // Get completions based on prompt name and argument
    switch (promptName) {
      case 'create-coding-assistant':
        completions.push(...this.getCodingAssistantCompletions(argumentName, currentValue));
        break;
      case 'create-data-analyst':
        completions.push(...this.getDataAnalystCompletions(argumentName, currentValue));
        break;
      case 'create-writing-assistant':
        completions.push(...this.getWritingAssistantCompletions(argumentName, currentValue));
        break;
      case 'configure-assistant-run':
        completions.push(...this.getRunConfigCompletions(argumentName, currentValue));
        break;
      default:
        // Generic completions for common argument names
        completions.push(...this.getGenericPromptCompletions(argumentName, currentValue));
    }

    // Filter based on current value and limit to 100 items
    const filtered = this.filterAndLimitCompletions(completions, currentValue, 100);
    
    return [{
      values: filtered,
      total: completions.length,
      hasMore: filtered.length < completions.length
    }];
  }

  /**
   * Get completions for resource URIs
   */
  private async getResourceCompletions(
    resourceName: string,
    argumentName: string,
    currentValue: string
  ): Promise<MCPCompletionItem[]> {
    const completions: string[] = [];

    // Get all available resource URIs
    const resources = getResources();
    const resourceUris = resources.map(r => r.uri);

    // Add resource URIs as completions
    completions.push(...resourceUris);

    // Add common resource URI patterns
    completions.push(
      'assistant://templates/',
      'assistant://examples/',
      'assistant://documentation/',
      'workflow://batch-processing',
      'workflow://create-and-run'
    );

    // Filter based on current value and limit to 100 items
    const filtered = this.filterAndLimitCompletions(completions, currentValue, 100);
    
    return [{
      values: filtered,
      total: completions.length,
      hasMore: filtered.length < completions.length
    }];
  }

  /**
   * Get completions for coding assistant prompts
   */
  private getCodingAssistantCompletions(argumentName: string, currentValue: string): string[] {
    switch (argumentName) {
      case 'specialization':
        return [
          'Python web development',
          'React frontend development',
          'Node.js backend development',
          'DevOps and infrastructure',
          'Mobile app development',
          'Machine learning and AI',
          'Database design and optimization',
          'API development and integration',
          'Cloud architecture',
          'Microservices architecture',
          'Full-stack JavaScript',
          'Data engineering',
          'Cybersecurity',
          'Game development',
          'Blockchain development'
        ];
      case 'experience_level':
        return ['beginner', 'intermediate', 'expert', 'senior'];
      case 'additional_tools':
        return [
          'code_interpreter',
          'file_search',
          'code_interpreter, file_search',
          'function'
        ];
      default:
        return [];
    }
  }

  /**
   * Get completions for data analyst prompts
   */
  private getDataAnalystCompletions(argumentName: string, currentValue: string): string[] {
    switch (argumentName) {
      case 'data_type':
        return [
          'financial data',
          'customer data',
          'sales data',
          'marketing data',
          'operational data',
          'survey data',
          'time series data',
          'geospatial data',
          'social media data',
          'web analytics data'
        ];
      case 'analysis_type':
        return [
          'descriptive analysis',
          'predictive analysis',
          'prescriptive analysis',
          'diagnostic analysis',
          'exploratory data analysis',
          'statistical analysis',
          'trend analysis',
          'correlation analysis'
        ];
      default:
        return this.getGenericPromptCompletions(argumentName, currentValue);
    }
  }

  /**
   * Get completions for writing assistant prompts
   */
  private getWritingAssistantCompletions(argumentName: string, currentValue: string): string[] {
    switch (argumentName) {
      case 'writing_style':
        return [
          'professional',
          'casual',
          'academic',
          'creative',
          'technical',
          'journalistic',
          'marketing',
          'conversational'
        ];
      case 'content_type':
        return [
          'blog posts',
          'technical documentation',
          'marketing copy',
          'academic papers',
          'social media content',
          'email campaigns',
          'product descriptions',
          'press releases'
        ];
      default:
        return this.getGenericPromptCompletions(argumentName, currentValue);
    }
  }

  /**
   * Get completions for run configuration prompts
   */
  private getRunConfigCompletions(argumentName: string, currentValue: string): string[] {
    switch (argumentName) {
      case 'model':
        return [
          'gpt-4',
          'gpt-4-turbo',
          'gpt-3.5-turbo',
          'gpt-4o',
          'gpt-4o-mini'
        ];
      case 'assistant_id':
        return this.getAssistantIdCompletions(currentValue);
      case 'thread_id':
        return this.getThreadIdCompletions(currentValue);
      case 'tool_choice':
        return ['auto', 'none', 'required'];
      default:
        return this.getGenericPromptCompletions(argumentName, currentValue);
    }
  }

  /**
   * Get generic completions for common argument names
   */
  private getGenericPromptCompletions(argumentName: string, currentValue: string): string[] {
    switch (argumentName) {
      case 'model':
        return [
          'gpt-4',
          'gpt-4-turbo',
          'gpt-3.5-turbo',
          'gpt-4o',
          'gpt-4o-mini'
        ];
      case 'assistant_id':
        return this.getAssistantIdCompletions(currentValue);
      case 'thread_id':
        return this.getThreadIdCompletions(currentValue);
      case 'message_id':
        return this.getMessageIdCompletions(currentValue);
      case 'run_id':
        return this.getRunIdCompletions(currentValue);
      case 'file_id':
        return this.getFileIdCompletions(currentValue);
      case 'tools':
      case 'additional_tools':
        return [
          'code_interpreter',
          'file_search',
          'function'
        ];
      case 'order':
        return ['asc', 'desc'];
      case 'limit':
        return ['10', '20', '50', '100'];
      default:
        return [];
    }
  }

  /**
   * Get assistant ID completions with proper format
   */
  private getAssistantIdCompletions(currentValue: string): string[] {
    const completions = [];
    
    if (!currentValue || currentValue.length < 4) {
      completions.push('asst_');
    }
    
    // Add example assistant IDs
    completions.push(
      'asst_abc123',
      'asst_def456',
      'asst_ghi789'
    );
    
    return completions;
  }

  /**
   * Get thread ID completions with proper format
   */
  private getThreadIdCompletions(currentValue: string): string[] {
    const completions = [];
    
    if (!currentValue || currentValue.length < 7) {
      completions.push('thread_');
    }
    
    // Add example thread IDs
    completions.push(
      'thread_abc123',
      'thread_def456',
      'thread_ghi789'
    );
    
    return completions;
  }

  /**
   * Get message ID completions with proper format
   */
  private getMessageIdCompletions(currentValue: string): string[] {
    const completions = [];
    
    if (!currentValue || currentValue.length < 4) {
      completions.push('msg_');
    }
    
    // Add example message IDs
    completions.push(
      'msg_abc123',
      'msg_def456',
      'msg_ghi789'
    );
    
    return completions;
  }

  /**
   * Get run ID completions with proper format
   */
  private getRunIdCompletions(currentValue: string): string[] {
    const completions = [];
    
    if (!currentValue || currentValue.length < 4) {
      completions.push('run_');
    }
    
    // Add example run IDs
    completions.push(
      'run_abc123',
      'run_def456',
      'run_ghi789'
    );
    
    return completions;
  }

  /**
   * Get file ID completions with proper format
   */
  private getFileIdCompletions(currentValue: string): string[] {
    const completions = [];
    
    if (!currentValue || currentValue.length < 5) {
      completions.push('file-');
    }
    
    // Add example file IDs
    completions.push(
      'file-abc123',
      'file-def456',
      'file-ghi789'
    );
    
    return completions;
  }

  /**
   * Filter completions based on current value and limit results
   */
  private filterAndLimitCompletions(
    completions: string[],
    currentValue: string,
    maxResults: number
  ): string[] {
    // Remove duplicates
    const unique = [...new Set(completions)];
    
    // Filter based on current value (case-insensitive prefix match)
    const filtered = currentValue
      ? unique.filter(completion => 
          completion.toLowerCase().startsWith(currentValue.toLowerCase())
        )
      : unique;
    
    // Sort alphabetically
    filtered.sort();
    
    // Limit to max results
    return filtered.slice(0, maxResults);
  }
}

/**
 * Create completion handlers with context
 */
export function createCompletionHandlers(context: CompletionHandlerContext) {
  const handler = new CompletionHandler(context);
  
  return {
    'completion/complete': {
      handle: async (params: MCPCompletionRequest['params']) => {
        const request: MCPCompletionRequest = {
          jsonrpc: '2.0',
          id: context.requestId,
          method: 'completion/complete',
          params
        };
        
        return await handler.handleCompletion(request);
      },
      context
    }
  };
}