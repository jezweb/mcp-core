/**
 * Run Step Tool Handlers - Handlers for all run step-related operations
 *
 * This file contains handlers for:
 * - run-step-list: List execution steps from an assistant run
 * - run-step-get: Get details of a specific run step
 *
 * Each handler implements the BaseToolHandler interface and provides
 * specific validation and execution logic for run step operations.
 */
import { BaseToolHandler } from './base-tool-handler.js';
import { validateOpenAIId, validatePaginationParams } from '../../validation/index.js';
/**
 * Handler for listing run steps
 */
export class RunStepListHandler extends BaseToolHandler {
    getToolName() {
        return 'run-step-list';
    }
    getCategory() {
        return 'run-step';
    }
    validate(args) {
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
        const { thread_id, run_id, ...listData } = args;
        // Validate pagination parameters
        const paginationValidation = validatePaginationParams(listData);
        if (!paginationValidation.isValid) {
            return paginationValidation;
        }
        return { isValid: true };
    }
    async execute(args) {
        try {
            const { thread_id, run_id, ...listData } = args;
            return await this.context.openaiService.listRunSteps(thread_id, run_id, listData);
        }
        catch (error) {
            throw this.createExecutionError(`Failed to list run steps: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
        }
    }
}
/**
 * Handler for getting run step details
 */
export class RunStepGetHandler extends BaseToolHandler {
    getToolName() {
        return 'run-step-get';
    }
    getCategory() {
        return 'run-step';
    }
    validate(args) {
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
        // Validate step ID
        const stepIdValidation = validateOpenAIId(args?.step_id, 'step', 'step_id');
        if (!stepIdValidation.isValid) {
            return stepIdValidation;
        }
        return { isValid: true };
    }
    async execute(args) {
        try {
            return await this.context.openaiService.getRunStep(args.thread_id, args.run_id, args.step_id);
        }
        catch (error) {
            throw this.createExecutionError(`Failed to get run step: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
        }
    }
}
/**
 * Factory function to create all run step handlers
 */
export function createRunStepHandlers(context) {
    return {
        'run-step-list': new RunStepListHandler(context),
        'run-step-get': new RunStepGetHandler(context)
    };
}
