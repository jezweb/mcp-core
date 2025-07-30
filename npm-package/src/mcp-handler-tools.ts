// Enhanced tool definitions following MCP best practices
import { MCPTool } from '@shared/types';

export const enhancedTools: MCPTool[] = [
  // Assistant Management Tools
  {
    name: 'assistant-create',
    title: 'Create AI Assistant',
    description: 'Create a new AI assistant with custom instructions and capabilities for a specific task or domain. Use this when you need to set up a persistent assistant that can be used across multiple conversations. The assistant will retain its configuration and can be equipped with tools like code interpreter, file search, or custom functions. Perfect for creating specialized assistants for customer support, coding help, content creation, or domain-specific tasks. Returns the assistant ID for future operations.',
    inputSchema: {
      type: 'object',
      properties: {
        model: {
          type: 'string',
          description: 'The OpenAI model to use for the assistant (e.g., "gpt-4", "gpt-3.5-turbo", "gpt-4-turbo"). Choose gpt-4 for complex reasoning, gpt-3.5-turbo for faster responses, or gpt-4-turbo for balanced performance.',
        },
        name: {
          type: 'string',
          description: 'A descriptive name for the assistant (e.g., "Customer Support Bot", "Code Review Assistant", "Content Writer"). This helps identify the assistant\'s purpose.',
        },
        description: {
          type: 'string',
          description: 'A brief description of what the assistant does and its intended use case (e.g., "Helps customers with product questions and troubleshooting").',
        },
        instructions: {
          type: 'string',
          description: 'System instructions that define the assistant\'s behavior, personality, and capabilities. Be specific about the assistant\'s role, tone, and how it should respond to users.',
        },
        tools: {
          type: 'array',
          description: 'Array of tools to enable for the assistant. Available tools: code_interpreter (for running Python code), file_search (for searching uploaded files), function (for custom API calls).',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['code_interpreter', 'file_search', 'function'],
              },
            },
          },
        },
        metadata: {
          type: 'object',
          description: 'Custom key-value pairs for storing additional information about the assistant (e.g., {"department": "support", "version": "1.0", "created_by": "admin"}).',
        },
      },
      required: ['model'],
    },
  },
  {
    name: 'assistant-list',
    title: 'List All Assistants',
    description: 'Retrieve a list of all your AI assistants with pagination support. Use this to browse existing assistants, find specific ones by name, or get an overview of your assistant collection. Essential for assistant management workflows and discovering assistants created by your team. Returns assistant metadata including names, descriptions, models, and creation dates.',
    readOnlyHint: true,
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of assistants to return in one request (1-100, default: 20). Use smaller values for quick previews, larger for comprehensive listings.',
        },
        order: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort order by creation date: "desc" for newest first (default), "asc" for oldest first.',
        },
        after: {
          type: 'string',
          description: 'Pagination cursor - assistant ID to start listing after (format: "asst_abc123..."). Use for getting the next page of results.',
        },
        before: {
          type: 'string',
          description: 'Pagination cursor - assistant ID to end listing before (format: "asst_abc123..."). Use for getting the previous page of results.',
        },
      },
    },
  },
  {
    name: 'assistant-get',
    title: 'Get Assistant Details',
    description: 'Retrieve comprehensive details about a specific assistant including its configuration, tools, instructions, and metadata. Use this to inspect an assistant\'s current settings before making updates, debugging issues, or understanding how an assistant is configured. Essential for assistant management and troubleshooting workflows.',
    readOnlyHint: true,
    inputSchema: {
      type: 'object',
      properties: {
        assistant_id: {
          type: 'string',
          description: 'The unique identifier of the assistant to retrieve (format: "asst_abc123..."). Get this from assistant-list or assistant-create operations.',
        },
      },
      required: ['assistant_id'],
    },
  },
  {
    name: 'assistant-update',
    title: 'Update Assistant Configuration',
    description: 'Modify an existing assistant\'s configuration including its model, instructions, tools, or metadata. Use this to improve an assistant\'s performance, add new capabilities, change its behavior, or update its description. All parameters are optional - only specify the fields you want to change. The assistant will retain its existing settings for any unspecified parameters.',
    idempotentHint: true,
    inputSchema: {
      type: 'object',
      properties: {
        assistant_id: {
          type: 'string',
          description: 'The unique identifier of the assistant to update (format: "asst_abc123...").',
        },
        model: {
          type: 'string',
          description: 'New model to use for the assistant (e.g., "gpt-4", "gpt-3.5-turbo"). Only specify if you want to change the model.',
        },
        name: {
          type: 'string',
          description: 'New name for the assistant. Only specify if you want to change the name.',
        },
        description: {
          type: 'string',
          description: 'New description for the assistant. Only specify if you want to change the description.',
        },
        instructions: {
          type: 'string',
          description: 'New system instructions for the assistant. Only specify if you want to change the behavior or personality.',
        },
        tools: {
          type: 'array',
          description: 'New array of tools for the assistant. This replaces the existing tools entirely. Include all tools you want the assistant to have.',
        },
        metadata: {
          type: 'object',
          description: 'New metadata object. This replaces the existing metadata entirely.',
        },
      },
      required: ['assistant_id'],
    },
  },
  {
    name: 'assistant-delete',
    title: 'Delete Assistant',
    description: 'Permanently delete an assistant and all its associated data. This action cannot be undone. Use this for cleanup, removing outdated assistants, or when an assistant is no longer needed. Warning: This will also affect any active conversations or runs using this assistant.',
    destructiveHint: true,
    inputSchema: {
      type: 'object',
      properties: {
        assistant_id: {
          type: 'string',
          description: 'The unique identifier of the assistant to permanently delete (format: "asst_abc123..."). Double-check this ID as deletion is irreversible.',
        },
      },
      required: ['assistant_id'],
    },
  },

  // Thread Management Tools
  {
    name: 'thread-create',
    title: 'Create Conversation Thread',
    description: 'Create a new conversation thread to organize a series of messages and assistant interactions. Threads maintain conversation context and history, making them perfect for ongoing conversations, customer support sessions, or multi-turn interactions. You can optionally include initial messages to start the conversation. Returns a thread ID for adding messages and running assistants.',
    inputSchema: {
      type: 'object',
      properties: {
        messages: {
          type: 'array',
          description: 'Optional array of initial messages to start the conversation. Each message should have role ("user" or "assistant") and content.',
        },
        metadata: {
          type: 'object',
          description: 'Custom key-value pairs for organizing threads (e.g., {"customer_id": "12345", "session_type": "support", "priority": "high"}).',
        },
      },
    },
  },
  {
    name: 'thread-get',
    title: 'Get Thread Details',
    description: 'Retrieve details about a specific conversation thread including its metadata and configuration. Use this to inspect thread properties, check metadata, or verify thread existence before performing operations. Essential for thread management and debugging conversation flows.',
    readOnlyHint: true,
    inputSchema: {
      type: 'object',
      properties: {
        thread_id: {
          type: 'string',
          description: 'The unique identifier of the thread to retrieve (format: "thread_abc123..."). Get this from thread-create or other thread operations.',
        },
      },
      required: ['thread_id'],
    },
  },
  {
    name: 'thread-update',
    title: 'Update Thread Metadata',
    description: 'Update a thread\'s metadata for better organization and tracking. Use this to add tags, update customer information, change priority levels, or store additional context about the conversation. The thread\'s messages and core functionality remain unchanged.',
    idempotentHint: true,
    inputSchema: {
      type: 'object',
      properties: {
        thread_id: {
          type: 'string',
          description: 'The unique identifier of the thread to update (format: "thread_abc123...").',
        },
        metadata: {
          type: 'object',
          description: 'New metadata object that replaces the existing metadata entirely. Include all key-value pairs you want to keep.',
        },
      },
      required: ['thread_id'],
    },
  },
  {
    name: 'thread-delete',
    title: 'Delete Conversation Thread',
    description: 'Permanently delete a conversation thread and all its associated messages, runs, and data. This action cannot be undone. Use this for cleanup, privacy compliance, or when a conversation is no longer needed. Warning: This will delete all messages and run history in the thread.',
    destructiveHint: true,
    inputSchema: {
      type: 'object',
      properties: {
        thread_id: {
          type: 'string',
          description: 'The unique identifier of the thread to permanently delete (format: "thread_abc123..."). Double-check this ID as deletion is irreversible.',
        },
      },
      required: ['thread_id'],
    },
  },

  // Message Management Tools
  {
    name: 'message-create',
    title: 'Add Message to Thread',
    description: 'Add a new message to an existing conversation thread. Use this to continue conversations, add user input, or insert assistant responses. Messages maintain the conversation flow and provide context for assistant runs. Essential for building interactive chat experiences and maintaining conversation history.',
    inputSchema: {
      type: 'object',
      properties: {
        thread_id: {
          type: 'string',
          description: 'The unique identifier of the thread to add the message to (format: "thread_abc123...").',
        },
        role: {
          type: 'string',
          enum: ['user', 'assistant'],
          description: 'The role of the message sender: "user" for human input, "assistant" for AI responses.',
        },
        content: {
          type: 'string',
          description: 'The text content of the message. This is what will be displayed in the conversation.',
        },
        metadata: {
          type: 'object',
          description: 'Optional metadata for the message (e.g., {"timestamp": "2024-01-01T12:00:00Z", "source": "web_chat", "user_id": "12345"}).',
        },
      },
      required: ['thread_id', 'role', 'content'],
    },
  },
  {
    name: 'message-list',
    title: 'List Thread Messages',
    description: 'Retrieve messages from a conversation thread with pagination and filtering options. Use this to display conversation history, analyze chat patterns, or export conversation data. You can filter by run ID to see messages from specific assistant interactions, or use pagination to handle long conversations efficiently.',
    readOnlyHint: true,
    inputSchema: {
      type: 'object',
      properties: {
        thread_id: {
          type: 'string',
          description: 'The unique identifier of the thread to list messages from (format: "thread_abc123...").',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of messages to return (1-100, default: 20). Use smaller values for recent messages, larger for comprehensive history.',
        },
        order: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort order by creation time: "desc" for newest first (default), "asc" for oldest first (chronological order).',
        },
        after: {
          type: 'string',
          description: 'Pagination cursor - message ID to start listing after (format: "msg_abc123..."). Use for getting newer messages.',
        },
        before: {
          type: 'string',
          description: 'Pagination cursor - message ID to end listing before (format: "msg_abc123..."). Use for getting older messages.',
        },
        run_id: {
          type: 'string',
          description: 'Filter messages by specific run ID (format: "run_abc123..."). Use to see only messages from a particular assistant interaction.',
        },
      },
      required: ['thread_id'],
    },
  },
  {
    name: 'message-get',
    title: 'Get Message Details',
    description: 'Retrieve detailed information about a specific message including its content, metadata, timestamps, and any annotations. Use this to inspect message properties, debug conversation issues, or extract specific message data for analysis.',
    readOnlyHint: true,
    inputSchema: {
      type: 'object',
      properties: {
        thread_id: {
          type: 'string',
          description: 'The unique identifier of the thread containing the message (format: "thread_abc123...").',
        },
        message_id: {
          type: 'string',
          description: 'The unique identifier of the message to retrieve (format: "msg_abc123...").',
        },
      },
      required: ['thread_id', 'message_id'],
    },
  },
  {
    name: 'message-update',
    title: 'Update Message Metadata',
    description: 'Update a message\'s metadata for better organization and tracking. Use this to add tags, update status information, or store additional context about the message. The message content itself cannot be changed, only its metadata.',
    idempotentHint: true,
    inputSchema: {
      type: 'object',
      properties: {
        thread_id: {
          type: 'string',
          description: 'The unique identifier of the thread containing the message (format: "thread_abc123...").',
        },
        message_id: {
          type: 'string',
          description: 'The unique identifier of the message to update (format: "msg_abc123...").',
        },
        metadata: {
          type: 'object',
          description: 'New metadata object that replaces the existing metadata entirely. Include all key-value pairs you want to keep.',
        },
      },
      required: ['thread_id', 'message_id'],
    },
  },
  {
    name: 'message-delete',
    title: 'Delete Message',
    description: 'Permanently delete a message from a conversation thread. This action cannot be undone. Use this for content moderation, privacy compliance, or removing inappropriate content. Note that deleting messages may affect conversation context for future assistant runs.',
    destructiveHint: true,
    inputSchema: {
      type: 'object',
      properties: {
        thread_id: {
          type: 'string',
          description: 'The unique identifier of the thread containing the message (format: "thread_abc123...").',
        },
        message_id: {
          type: 'string',
          description: 'The unique identifier of the message to permanently delete (format: "msg_abc123..."). Double-check this ID as deletion is irreversible.',
        },
      },
      required: ['thread_id', 'message_id'],
    },
  },

  // Run Management Tools
  {
    name: 'run-create',
    title: 'Start Assistant Run',
    description: 'Execute an assistant on a conversation thread to generate responses and perform tasks. This is the core operation for getting AI assistance - the assistant will process the thread\'s messages and generate appropriate responses. Use this after adding user messages to a thread. The run may require tool outputs if the assistant needs to call functions. Monitor the run status to know when it completes.',
    inputSchema: {
      type: 'object',
      properties: {
        thread_id: {
          type: 'string',
          description: 'The unique identifier of the thread to run the assistant on (format: "thread_abc123...").',
        },
        assistant_id: {
          type: 'string',
          description: 'The unique identifier of the assistant to use for this run (format: "asst_abc123...").',
        },
        model: {
          type: 'string',
          description: 'Override the assistant\'s default model for this run only (e.g., "gpt-4", "gpt-3.5-turbo"). Leave empty to use the assistant\'s configured model.',
        },
        instructions: {
          type: 'string',
          description: 'Override the assistant\'s system instructions for this run only. Use this for context-specific behavior changes.',
        },
        additional_instructions: {
          type: 'string',
          description: 'Additional instructions to append to the assistant\'s existing instructions. Use this to add context without replacing the base instructions.',
        },
        tools: {
          type: 'array',
          description: 'Override the assistant\'s tools for this run only. This replaces all tools - include all tools you want available.',
        },
        metadata: {
          type: 'object',
          description: 'Custom metadata for tracking this specific run (e.g., {"session_id": "abc123", "user_intent": "support_request"}).',
        },
      },
      required: ['thread_id', 'assistant_id'],
    },
  },
  {
    name: 'run-list',
    title: 'List Thread Runs',
    description: 'Retrieve a list of all assistant runs for a specific thread with pagination support. Use this to track run history, monitor assistant performance, or debug conversation flows. Essential for understanding how many times an assistant has been executed on a thread and their outcomes.',
    readOnlyHint: true,
    inputSchema: {
      type: 'object',
      properties: {
        thread_id: {
          type: 'string',
          description: 'The unique identifier of the thread to list runs from (format: "thread_abc123...").',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of runs to return (1-100, default: 20). Use smaller values for recent runs, larger for comprehensive history.',
        },
        order: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort order by creation time: "desc" for newest first (default), "asc" for oldest first.',
        },
        after: {
          type: 'string',
          description: 'Pagination cursor - run ID to start listing after (format: "run_abc123..."). Use for getting newer runs.',
        },
        before: {
          type: 'string',
          description: 'Pagination cursor - run ID to end listing before (format: "run_abc123..."). Use for getting older runs.',
        },
      },
      required: ['thread_id'],
    },
  },
  {
    name: 'run-get',
    title: 'Get Run Details',
    description: 'Retrieve comprehensive details about a specific assistant run including its status, results, tool calls, and any errors. Use this to monitor run progress, debug issues, or extract run results. Essential for understanding what happened during an assistant execution.',
    readOnlyHint: true,
    inputSchema: {
      type: 'object',
      properties: {
        thread_id: {
          type: 'string',
          description: 'The unique identifier of the thread containing the run (format: "thread_abc123...").',
        },
        run_id: {
          type: 'string',
          description: 'The unique identifier of the run to retrieve (format: "run_abc123...").',
        },
      },
      required: ['thread_id', 'run_id'],
    },
  },
  {
    name: 'run-update',
    title: 'Update Run Metadata',
    description: 'Update a run\'s metadata for better tracking and organization. Use this to add tags, update status information, or store additional context about the run execution. The run\'s core execution data remains unchanged.',
    idempotentHint: true,
    inputSchema: {
      type: 'object',
      properties: {
        thread_id: {
          type: 'string',
          description: 'The unique identifier of the thread containing the run (format: "thread_abc123...").',
        },
        run_id: {
          type: 'string',
          description: 'The unique identifier of the run to update (format: "run_abc123...").',
        },
        metadata: {
          type: 'object',
          description: 'New metadata object that replaces the existing metadata entirely. Include all key-value pairs you want to keep.',
        },
      },
      required: ['thread_id', 'run_id'],
    },
  },
  {
    name: 'run-cancel',
    title: 'Cancel Running Assistant',
    description: 'Cancel an assistant run that is currently in progress. Use this to stop long-running operations, abort unwanted executions, or handle timeout scenarios. The run will transition to a cancelled state and stop processing. Note that cancellation may not be immediate.',
    inputSchema: {
      type: 'object',
      properties: {
        thread_id: {
          type: 'string',
          description: 'The unique identifier of the thread containing the run (format: "thread_abc123...").',
        },
        run_id: {
          type: 'string',
          description: 'The unique identifier of the run to cancel (format: "run_abc123..."). The run must be in progress to be cancelled.',
        },
      },
      required: ['thread_id', 'run_id'],
    },
  },
  {
    name: 'run-submit-tool-outputs',
    title: 'Submit Tool Call Results',
    description: 'Provide the results of tool calls to continue a paused assistant run. When an assistant needs to call external functions, the run pauses and waits for tool outputs. Use this to submit the function results and allow the assistant to continue processing. Essential for assistants that use custom functions or external APIs.',
    inputSchema: {
      type: 'object',
      properties: {
        thread_id: {
          type: 'string',
          description: 'The unique identifier of the thread containing the run (format: "thread_abc123...").',
        },
        run_id: {
          type: 'string',
          description: 'The unique identifier of the run waiting for tool outputs (format: "run_abc123..."). The run must be in "requires_action" status.',
        },
        tool_outputs: {
          type: 'array',
          description: 'Array of tool call results. Each output must match a tool call ID from the run\'s required_action.',
          items: {
            type: 'object',
            properties: {
              tool_call_id: {
                type: 'string',
                description: 'The unique identifier of the tool call being responded to (format: "call_abc123..."). Get this from the run\'s required_action.',
              },
              output: {
                type: 'string',
                description: 'The result of the tool call as a string. This will be provided to the assistant to continue processing.',
              },
            },
            required: ['tool_call_id', 'output'],
          },
        },
      },
      required: ['thread_id', 'run_id', 'tool_outputs'],
    },
  },

  // Run Step Management Tools
  {
    name: 'run-step-list',
    title: 'List Run Execution Steps',
    description: 'Retrieve detailed steps from an assistant run execution to understand the assistant\'s reasoning process and actions. Each step represents a discrete action the assistant took, such as generating a message or calling a tool. Use this for debugging, auditing assistant behavior, or understanding complex multi-step reasoning processes.',
    readOnlyHint: true,
    inputSchema: {
      type: 'object',
      properties: {
        thread_id: {
          type: 'string',
          description: 'The unique identifier of the thread containing the run (format: "thread_abc123...").',
        },
        run_id: {
          type: 'string',
          description: 'The unique identifier of the run to list steps from (format: "run_abc123...").',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of steps to return (1-100, default: 20). Use smaller values for recent steps, larger for complete execution traces.',
        },
        order: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort order by execution time: "asc" for chronological order (recommended for debugging), "desc" for most recent first.',
        },
        after: {
          type: 'string',
          description: 'Pagination cursor - step ID to start listing after (format: "step_abc123..."). Use for getting subsequent steps.',
        },
        before: {
          type: 'string',
          description: 'Pagination cursor - step ID to end listing before (format: "step_abc123..."). Use for getting previous steps.',
        },
      },
      required: ['thread_id', 'run_id'],
    },
  },
  {
    name: 'run-step-get',
    title: 'Get Run Step Details',
    description: 'Retrieve comprehensive details about a specific step in an assistant run execution. This includes the step type (message creation or tool calls), input/output data, timing information, and any errors. Essential for debugging assistant behavior, understanding tool usage, or auditing specific actions taken during a run.',
    readOnlyHint: true,
    inputSchema: {
      type: 'object',
      properties: {
        thread_id: {
          type: 'string',
          description: 'The unique identifier of the thread containing the run (format: "thread_abc123...").',
        },
        run_id: {
          type: 'string',
          description: 'The unique identifier of the run containing the step (format: "run_abc123...").',
        },
        step_id: {
          type: 'string',
          description: 'The unique identifier of the step to retrieve (format: "step_abc123...").',
        },
      },
      required: ['thread_id', 'run_id', 'step_id'],
    },
  },
];