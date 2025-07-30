/**
 * Run Tool Handlers - Handlers for all run-related operations
 * 
 * This file contains handlers for:
 * - run-create: Start an assistant run on a thread
 * - run-list: List runs for a thread with pagination
 * - run-get: Get details of a specific run
 * - run-update: Update run metadata
 * - run-cancel: Cancel a running assistant
 * - run-submit-tool-outputs: Submit tool call results
 * 
 * Each handler implements the BaseToolHandler interface and provides
 * specific validation and execution logic for run operations.
 */

import { BaseToolHandler, ToolHandlerContext } from './base-tool-handler.js';
import { MCPError, ErrorCodes } from '../../../src/types.js';
import { ValidationResult } from '../../../src/validation.js';
import {
  validateOpenAIId,
  validateModel,
  validateMetadata,
  validatePaginationParams,
  validateArray
} from '../../../src/validation.js';

/**
 * Handler for creating new runs
 */
export class RunCreateHandler extends BaseToolHandler {
  getToolName(): string {
    return 'run-create';
  }

  getCategory(): string {
    return 'run';
  }

  validate(args: any): ValidationResult {
    // Validate required thread ID
    const threadIdValidation = validateOpenAIId(args?.thread_id, 'thread', 'thread_id');
    if (!threadIdValidation.isValid) {
      return threadIdValidation;
    }

    // Validate required assistant ID
    const assistantIdValidation = validateOpenAIId(args?.assistant_id, 'assistant', 'assistant_id');
    if (!assistantIdValidation.isValid) {
      return assistantIdValidation;
    }

    // Validate model if provided
    if (args?.model) {
      const modelValidation = validateModel(args.model);
      if (!modelValidation.isValid) {
        return modelValidation;
      }
    }

    // Validate metadata if provided
    if (args?.metadata !== undefined) {
      const metadataValidation = validateMetadata(args.metadata);
      if (!metadataValidation.isValid) {
        return metadataValidation;
      }
    }

    return { isValid: true };
  }

  async execute(args: any): Promise<any> {
    try {
      const { thread_id, ...runData } = args;
      return await this.context.openaiService.createRun(thread_id, runData);
    } catch (error) {
      throw this.createExecutionError(
        `Failed to create run: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }
}

/**
 * Handler for listing runs
 */
export class RunListHandler extends BaseToolHandler {
  getToolName(): string {
    return 'run-list';
  }

  getCategory(): string {
    return 'run';
  }

  validate(args: any): ValidationResult {
    // Validate thread ID
    const threadIdValidation = validateOpenAIId(args?.thread_id, 'thread', 'thread_id');
    if (!threadIdValidation.isValid) {
      return threadIdValidation;
    }

    const { thread_id, ...listData } = args;

    // Validate pagination parameters
    const paginationValidation = validatePaginationParams(listData);
    if (!paginationValidation.isValid) {
      return paginationValidation;
    }

    return { isValid: true };
  }

  async execute(args: any): Promise<any> {
    try {
      const { thread_id, ...listData } = args;
      return await this.context.openaiService.listRuns(thread_id, listData);
    } catch (error) {
      throw this.createExecutionError(
        `Failed to list runs: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }
}

/**
 * Handler for getting run details
 */
export class RunGetHandler extends BaseToolHandler {
  getToolName(): string {
    return 'run-get';
  }

  getCategory(): string {
    return 'run';
  }

  validate(args: any): ValidationResult {
    // Validate thread ID
    const threadIdValidation = validateOpenAIId(args?.thread_id, 'thread', 'thread_id');
    if (!threadIdValidation.isValid) {
      return threadIdValidation;
    }

    // Validate run ID
    const runIdValidation = validateOpenAIId(args?.run_id, 'run', 'run_id');
    if (!runIdValidation.isValid) {
      return runIdValidation;
    }

    return { isValid: true };
  }

  async execute(args: any): Promise<any> {
    try {
      return await this.context.openaiService.getRun(args.thread_id, args.run_id);
    } catch (error) {
      throw this.createExecutionError(
        `Failed to get run: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }
}

/**
 * Handler for updating runs
 */
export class RunUpdateHandler extends BaseToolHandler {
  getToolName(): string {
    return 'run-update';
  }

  getCategory(): string {
    return 'run';
  }

  validate(args: any): ValidationResult {
    // Validate thread ID
    const threadIdValidation = validateOpenAIId(args?.thread_id, 'thread', 'thread_id');
    if (!threadIdValidation.isValid) {
      return threadIdValidation;
    }

    // Validate run ID
    const runIdValidation = validateOpenAIId(args?.run_id, 'run', 'run_id');
    if (!runIdValidation.isValid) {
      return runIdValidation;
    }

    const { thread_id, run_id, ...updateData } = args;

    // Validate metadata if provided
    if (updateData.metadata !== undefined) {
      const metadataValidation = validateMetadata(updateData.metadata);
      if (!metadataValidation.isValid) {
        return metadataValidation;
      }
    }

    return { isValid: true };
  }

  async execute(args: any): Promise<any> {
    try {
      const { thread_id, run_id, ...updateData } = args;
      return await this.context.openaiService.updateRun(thread_id, run_id, updateData);
    } catch (error) {
      throw this.createExecutionError(
        `Failed to update run: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }
}

/**
 * Handler for canceling runs
 */
export class RunCancelHandler extends BaseToolHandler {
  getToolName(): string {
    return 'run-cancel';
  }

  getCategory(): string {
    return 'run';
  }

  validate(args: any): ValidationResult {
    // Validate thread ID
    const threadIdValidation = validateOpenAIId(args?.thread_id, 'thread', 'thread_id');
    if (!threadIdValidation.isValid) {
      return threadIdValidation;
    }

    // Validate run ID
    const runIdValidation = validateOpenAIId(args?.run_id, 'run', 'run_id');
    if (!runIdValidation.isValid) {
      return runIdValidation;
    }

    return { isValid: true };
  }

  async execute(args: any): Promise<any> {
    try {
      return await this.context.openaiService.cancelRun(args.thread_id, args.run_id);
    } catch (error) {
      throw this.createExecutionError(
        `Failed to cancel run: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }
}

/**
 * Handler for submitting tool outputs
 */
export class RunSubmitToolOutputsHandler extends BaseToolHandler {
  getToolName(): string {
    return 'run-submit-tool-outputs';
  }

  getCategory(): string {
    return 'run';
  }

  validate(args: any): ValidationResult {
    // Validate required thread ID
    const threadIdValidation = validateOpenAIId(args?.thread_id, 'thread', 'thread_id');
    if (!threadIdValidation.isValid) {
      return threadIdValidation;
    }

    // Validate required run ID
    const runIdValidation = validateOpenAIId(args?.run_id, 'run', 'run_id');
    if (!runIdValidation.isValid) {
      return runIdValidation;
    }

    // Validate required tool_outputs array
    const toolOutputsValidation = validateArray(args?.tool_outputs, 'tool_outputs', true);
    if (!toolOutputsValidation.isValid) {
      return toolOutputsValidation;
    }

    // Validate each tool output
    if (args?.tool_outputs && Array.isArray(args.tool_outputs)) {
      for (let i = 0; i < args.tool_outputs.length; i++) {
        const output = args.tool_outputs[i];

        if (!output.tool_call_id) {
          return {
            isValid: false,
            error: new MCPError(
              ErrorCodes.INVALID_PARAMS,
              `Tool output at index ${i} is missing 'tool_call_id'. Each tool output must include the tool_call_id from the run's required_action. Example: {"tool_call_id": "call_abc123def456ghi789jkl012", "output": "result"}.`
            )
          };
        }

        const toolCallIdValidation = validateOpenAIId(output.tool_call_id, 'tool_call', `tool_outputs[${i}].tool_call_id`);
        if (!toolCallIdValidation.isValid) {
          return toolCallIdValidation;
        }

        if (!output.output || typeof output.output !== 'string') {
          return {
            isValid: false,
            error: new MCPError(
              ErrorCodes.INVALID_PARAMS,
              `Tool output at index ${i} is missing or has invalid 'output'. Provide the function result as a string. Example: {"tool_call_id": "call_abc123def456ghi789jkl012", "output": "The calculation result is 42"}.`
            )
          };
        }
      }
    }

    return { isValid: true };
  }

  async execute(args: any): Promise<any> {
    try {
      const { thread_id, run_id, ...submitData } = args;
      return await this.context.openaiService.submitToolOutputs(thread_id, run_id, submitData);
    } catch (error) {
      throw this.createExecutionError(
        `Failed to submit tool outputs: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }
}

/**
 * Factory function to create all run handlers
 */
export function createRunHandlers(context: ToolHandlerContext): Record<string, BaseToolHandler> {
  return {
    'run-create': new RunCreateHandler(context),
    'run-list': new RunListHandler(context),
    'run-get': new RunGetHandler(context),
    'run-update': new RunUpdateHandler(context),
    'run-cancel': new RunCancelHandler(context),
    'run-submit-tool-outputs': new RunSubmitToolOutputsHandler(context)
  };
}