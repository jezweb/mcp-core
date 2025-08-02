/**
 * Tool Definitions Generator - Generated from modular JSON definitions
 * 
 * This file is auto-generated from the hybrid modular architecture.
 * Do not edit manually - changes will be overwritten.
 * 
 * Generated at: 2025-08-02T08:29:03.281Z
 * Source: definitions/tools/
 */

import { MCPTool } from '../types/index.js';
import { BaseToolHandler } from './handlers/base-tool-handler.js';
import { ToolRegistry } from './tool-registry.js';

/**
 * Tool definition templates for each tool
 * These provide the MCP-specific metadata that handlers don't contain
 */
const TOOL_DEFINITIONS: Record<string, Omit<MCPTool, 'name'>> = {
  "assistant-create": {
    "title": "Create AI Assistant",
    "description": "Create a new AI assistant with custom instructions and capabilities for a specific task or domain. Use this when you need to set up a persistent assistant that can be used across multiple conversations. The assistant will retain its configuration and can be equipped with tools like code interpreter, file search, or custom functions. Perfect for creating specialized assistants for customer support, coding help, content creation, or domain-specific tasks. Returns the assistant ID for future operations.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "model": {
          "type": "string",
          "description": "The AI model to use for the assistant (e.g., \"gpt-4\", \"gpt-3.5-turbo\", \"claude-3-sonnet\"). Choose based on your provider's available models and performance requirements."
        },
        "name": {
          "type": "string",
          "description": "A descriptive name for the assistant (e.g., \"Customer Support Bot\", \"Code Review Assistant\", \"Content Writer\"). This helps identify the assistant's purpose."
        },
        "description": {
          "type": "string",
          "description": "A brief description of what the assistant does and its intended use case (e.g., \"Helps customers with product questions and troubleshooting\")."
        },
        "instructions": {
          "type": "string",
          "description": "System instructions that define the assistant's behavior, personality, and capabilities. Be specific about the assistant's role, tone, and how it should respond to users."
        },
        "tools": {
          "type": "array",
          "description": "Array of tools to enable for the assistant. Available tools: code_interpreter (for running Python code), file_search (for searching uploaded files), function (for custom API calls).",
          "items": {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "enum": [
                  "code_interpreter",
                  "file_search",
                  "function"
                ]
              }
            }
          }
        },
        "tool_resources": {
          "type": "object",
          "description": "Resources for tools like file_search vector stores and code_interpreter files. Must match the tools specified in the tools array.",
          "properties": {
            "file_search": {
              "type": "object",
              "description": "Resources for file_search tool",
              "properties": {
                "vector_store_ids": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  },
                  "description": "Array of vector store IDs for file search (e.g., [\"vs_6885cd2c21e0819196770bf8eceddffc\"]). Vector stores must be created separately."
                }
              },
              "required": [
                "vector_store_ids"
              ]
            },
            "code_interpreter": {
              "type": "object",
              "description": "Resources for code_interpreter tool",
              "properties": {
                "file_ids": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  },
                  "description": "Array of file IDs for code interpreter (e.g., [\"file-abc123def456ghi789jkl012\"]). Files must be uploaded separately."
                }
              },
              "required": [
                "file_ids"
              ]
            }
          }
        },
        "metadata": {
          "type": "object",
          "description": "Custom key-value pairs for storing additional information about the assistant (e.g., {\"department\": \"support\", \"version\": \"1.0\", \"created_by\": \"admin\"})."
        }
      },
      "required": [
        "model"
      ]
    }
  },
  "assistant-list": {
    "title": "List All Assistants",
    "description": "Retrieve a list of all your AI assistants with pagination support. Use this to browse existing assistants, find specific ones by name, or get an overview of your assistant collection. Essential for assistant management workflows and discovering assistants created by your team. Returns assistant metadata including names, descriptions, models, and creation dates.",
    "readOnlyHint": true,
    "inputSchema": {
      "type": "object",
      "properties": {
        "limit": {
          "type": "number",
          "description": "Maximum number of assistants to return in one request (1-100, default: 20). Use smaller values for quick previews, larger for comprehensive listings."
        },
        "order": {
          "type": "string",
          "enum": [
            "asc",
            "desc"
          ],
          "description": "Sort order by creation date: \"desc\" for newest first (default), \"asc\" for oldest first."
        },
        "after": {
          "type": "string",
          "description": "Pagination cursor - assistant ID to start listing after (format: \"asst_abc123...\"). Use for getting the next page of results."
        },
        "before": {
          "type": "string",
          "description": "Pagination cursor - assistant ID to end listing before (format: \"asst_abc123...\"). Use for getting the previous page of results."
        }
      }
    }
  },
  "assistant-get": {
    "title": "Get Assistant Details",
    "description": "Retrieve detailed information about a specific AI assistant including its configuration, tools, and metadata. Use this to inspect assistant settings, verify configurations, or get assistant details for management purposes. Essential for debugging assistant behavior and understanding current settings.",
    "readOnlyHint": true,
    "inputSchema": {
      "type": "object",
      "properties": {
        "assistant_id": {
          "type": "string",
          "description": "The unique identifier of the assistant to retrieve (format: \"asst_abc123...\"). Get this from assistant-create response or assistant-list results."
        }
      },
      "required": [
        "assistant_id"
      ]
    }
  },
  "assistant-update": {
    "title": "Update Assistant",
    "description": "Modify an existing AI assistant's configuration, instructions, tools, or metadata. Use this to refine assistant behavior, add new capabilities, update instructions based on feedback, or change the model. Perfect for iterative improvement and maintaining assistants over time.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "assistant_id": {
          "type": "string",
          "description": "The unique identifier of the assistant to update (format: \"asst_abc123...\")."
        },
        "model": {
          "type": "string",
          "description": "The AI model to use for the assistant (e.g., \"gpt-4\", \"gpt-3.5-turbo\", \"claude-3-sonnet\"). Choose based on your provider's available models. Leave unchanged if not specified."
        },
        "name": {
          "type": "string",
          "description": "New name for the assistant. Leave unchanged if not specified."
        },
        "description": {
          "type": "string",
          "description": "New description of what the assistant does. Leave unchanged if not specified."
        },
        "instructions": {
          "type": "string",
          "description": "New system instructions that define the assistant's behavior. Leave unchanged if not specified."
        },
        "tools": {
          "type": "array",
          "description": "New array of tools to enable for the assistant. Replaces existing tools if specified.",
          "items": {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "enum": [
                  "code_interpreter",
                  "file_search",
                  "function"
                ]
              }
            }
          }
        },
        "tool_resources": {
          "type": "object",
          "description": "Resources for tools like file_search vector stores and code_interpreter files. Must match the tools specified in the tools array.",
          "properties": {
            "file_search": {
              "type": "object",
              "description": "Resources for file_search tool",
              "properties": {
                "vector_store_ids": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  },
                  "description": "Array of vector store IDs for file search (e.g., [\"vs_6885cd2c21e0819196770bf8eceddffc\"]). Vector stores must be created separately."
                }
              },
              "required": [
                "vector_store_ids"
              ]
            },
            "code_interpreter": {
              "type": "object",
              "description": "Resources for code_interpreter tool",
              "properties": {
                "file_ids": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  },
                  "description": "Array of file IDs for code interpreter (e.g., [\"file-abc123def456ghi789jkl012\"]). Files must be uploaded separately."
                }
              },
              "required": [
                "file_ids"
              ]
            }
          }
        },
        "metadata": {
          "type": "object",
          "description": "New metadata key-value pairs. Replaces existing metadata if specified."
        }
      },
      "required": [
        "assistant_id"
      ]
    }
  },
  "assistant-delete": {
    "title": "Delete Assistant",
    "description": "Permanently delete an AI assistant and all its associated data. Use this for cleanup, removing unused assistants, or when an assistant is no longer needed. This action cannot be undone, so use with caution. All threads using this assistant will no longer be able to create new runs.",
    "destructiveHint": true,
    "inputSchema": {
      "type": "object",
      "properties": {
        "assistant_id": {
          "type": "string",
          "description": "The unique identifier of the assistant to delete (format: \"asst_abc123...\"). Double-check this ID as deletion is irreversible."
        }
      },
      "required": [
        "assistant_id"
      ]
    }
  },
  "thread-create": {
    "title": "Create Conversation Thread",
    "description": "Create a new conversation thread to organize a series of messages and assistant interactions. Threads maintain conversation context and history, making them perfect for ongoing conversations, customer support sessions, or multi-turn interactions. You can optionally include initial messages to start the conversation. Returns a thread ID for adding messages and running assistants.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "messages": {
          "type": "array",
          "description": "Optional array of initial messages to start the conversation. Each message should have role (\"user\" or \"assistant\") and content."
        },
        "metadata": {
          "type": "object",
          "description": "Custom key-value pairs for organizing threads (e.g., {\"customer_id\": \"12345\", \"session_type\": \"support\", \"priority\": \"high\"})."
        }
      }
    }
  },
  "thread-get": {
    "title": "Get Thread Details",
    "description": "Retrieve detailed information about a specific conversation thread including its metadata and current state. Use this to inspect thread properties, verify configurations, or get thread details for management purposes. Essential for understanding thread context and debugging conversation flows.",
    "readOnlyHint": true,
    "inputSchema": {
      "type": "object",
      "properties": {
        "thread_id": {
          "type": "string",
          "description": "The unique identifier of the thread to retrieve (format: \"thread_abc123...\"). Get this from thread-create response or other thread operations."
        }
      },
      "required": [
        "thread_id"
      ]
    }
  },
  "thread-update": {
    "title": "Update Thread",
    "description": "Modify an existing conversation thread's metadata and properties. Use this to update thread categorization, add tracking information, change priority levels, or organize conversations better. Perfect for maintaining thread organization and adding context as conversations evolve.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "thread_id": {
          "type": "string",
          "description": "The unique identifier of the thread to update (format: \"thread_abc123...\")."
        },
        "metadata": {
          "type": "object",
          "description": "New metadata key-value pairs to replace existing metadata. Use for organizing threads (e.g., {\"priority\": \"high\", \"department\": \"support\", \"status\": \"resolved\"})."
        }
      },
      "required": [
        "thread_id"
      ]
    }
  },
  "thread-delete": {
    "title": "Delete Thread",
    "description": "Permanently delete a conversation thread and all its associated messages and runs. Use this for cleanup, removing completed conversations, or when a thread is no longer needed. This action cannot be undone and will remove all conversation history, so use with caution.",
    "destructiveHint": true,
    "inputSchema": {
      "type": "object",
      "properties": {
        "thread_id": {
          "type": "string",
          "description": "The unique identifier of the thread to delete (format: \"thread_abc123...\"). Double-check this ID as deletion is irreversible and will remove all messages and runs."
        }
      },
      "required": [
        "thread_id"
      ]
    }
  },
  "message-create": {
    "title": "Create Message",
    "description": "Add a new message to a conversation thread. Use this to send user messages, add context, or continue conversations. Messages can include text content and will be processed by assistants when runs are created. Essential for building interactive conversations and providing input to assistants.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "thread_id": {
          "type": "string",
          "description": "The unique identifier of the thread to add the message to (format: \"thread_abc123...\")."
        },
        "role": {
          "type": "string",
          "enum": [
            "user",
            "assistant"
          ],
          "description": "The role of the message sender. Use \"user\" for human messages, \"assistant\" for AI responses."
        },
        "content": {
          "type": "string",
          "description": "The text content of the message. This is what the assistant will see and respond to."
        },
        "metadata": {
          "type": "object",
          "description": "Optional metadata for the message (e.g., {\"source\": \"web\", \"timestamp\": \"2025-01-31T02:37:00.000Z\", \"user_id\": \"12345\"})."
        }
      },
      "required": [
        "thread_id",
        "role",
        "content"
      ]
    }
  },
  "message-list": {
    "title": "List Thread Messages",
    "description": "Retrieve all messages from a conversation thread with pagination support. Use this to view conversation history, analyze message patterns, or get context for assistant responses. Essential for understanding conversation flow and debugging assistant behavior.",
    "readOnlyHint": true,
    "inputSchema": {
      "type": "object",
      "properties": {
        "thread_id": {
          "type": "string",
          "description": "The unique identifier of the thread to list messages from (format: \"thread_abc123...\")."
        },
        "limit": {
          "type": "number",
          "description": "Maximum number of messages to return in one request (1-100, default: 20). Use smaller values for quick previews, larger for comprehensive history."
        },
        "order": {
          "type": "string",
          "enum": [
            "asc",
            "desc"
          ],
          "description": "Sort order by creation date: \"desc\" for newest first (default), \"asc\" for oldest first (chronological order)."
        },
        "after": {
          "type": "string",
          "description": "Pagination cursor - message ID to start listing after (format: \"msg_abc123...\"). Use for getting the next page of results."
        },
        "before": {
          "type": "string",
          "description": "Pagination cursor - message ID to end listing before (format: \"msg_abc123...\"). Use for getting the previous page of results."
        },
        "run_id": {
          "type": "string",
          "description": "Filter messages by specific run ID (format: \"run_abc123...\"). Shows only messages from that particular assistant run."
        }
      },
      "required": [
        "thread_id"
      ]
    }
  },
  "message-get": {
    "title": "Get Message Details",
    "description": "Retrieve detailed information about a specific message including its content, metadata, and creation details. Use this to inspect individual messages, verify content, or get message details for debugging purposes.",
    "readOnlyHint": true,
    "inputSchema": {
      "type": "object",
      "properties": {
        "thread_id": {
          "type": "string",
          "description": "The unique identifier of the thread containing the message (format: \"thread_abc123...\")."
        },
        "message_id": {
          "type": "string",
          "description": "The unique identifier of the message to retrieve (format: \"msg_abc123...\")."
        }
      },
      "required": [
        "thread_id",
        "message_id"
      ]
    }
  },
  "message-update": {
    "title": "Update Message",
    "description": "Modify an existing message's metadata. Use this to add tags, update tracking information, or organize messages better. Note that message content cannot be changed, only metadata can be updated.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "thread_id": {
          "type": "string",
          "description": "The unique identifier of the thread containing the message (format: \"thread_abc123...\")."
        },
        "message_id": {
          "type": "string",
          "description": "The unique identifier of the message to update (format: \"msg_abc123...\")."
        },
        "metadata": {
          "type": "object",
          "description": "New metadata key-value pairs to replace existing metadata (e.g., {\"importance\": \"high\", \"category\": \"question\"})."
        }
      },
      "required": [
        "thread_id",
        "message_id"
      ]
    }
  },
  "message-delete": {
    "title": "Delete Message",
    "description": "Permanently delete a message from a conversation thread. Use this to remove unwanted messages, clean up conversations, or correct mistakes. This action cannot be undone and will remove the message from the conversation history.",
    "destructiveHint": true,
    "inputSchema": {
      "type": "object",
      "properties": {
        "thread_id": {
          "type": "string",
          "description": "The unique identifier of the thread containing the message (format: \"thread_abc123...\")."
        },
        "message_id": {
          "type": "string",
          "description": "The unique identifier of the message to delete (format: \"msg_abc123...\"). Double-check this ID as deletion is irreversible."
        }
      },
      "required": [
        "thread_id",
        "message_id"
      ]
    }
  },
  "run-create": {
    "title": "Create Assistant Run",
    "description": "Start a new assistant run on a conversation thread to generate responses. This is the core operation that makes assistants process messages and generate replies. Use this after adding messages to a thread to get assistant responses. The run will process all messages in the thread and generate appropriate responses.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "thread_id": {
          "type": "string",
          "description": "The unique identifier of the thread to run the assistant on (format: \"thread_abc123...\")."
        },
        "assistant_id": {
          "type": "string",
          "description": "The unique identifier of the assistant to use for the run (format: \"asst_abc123...\")."
        },
        "model": {
          "type": "string",
          "description": "Override the model used by the assistant for this run (e.g., \"gpt-4\", \"gpt-3.5-turbo\"). Leave empty to use assistant's default model."
        },
        "instructions": {
          "type": "string",
          "description": "Override the instructions of the assistant for this run. Use to provide run-specific context or modify behavior."
        },
        "additional_instructions": {
          "type": "string",
          "description": "Additional instructions to append to the assistant's existing instructions for this run."
        },
        "tools": {
          "type": "array",
          "description": "Override the tools used by the assistant for this run. Replaces assistant's tools if specified.",
          "items": {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "enum": [
                  "code_interpreter",
                  "file_search",
                  "function"
                ]
              }
            }
          }
        },
        "metadata": {
          "type": "object",
          "description": "Custom metadata for the run (e.g., {\"priority\": \"high\", \"source\": \"api\", \"user_id\": \"12345\"})."
        }
      },
      "required": [
        "thread_id",
        "assistant_id"
      ]
    }
  },
  "run-list": {
    "title": "List Thread Runs",
    "description": "Retrieve all runs for a conversation thread with pagination support. Use this to view run history, monitor assistant activity, or debug conversation flows. Essential for understanding how assistants have processed messages over time.",
    "readOnlyHint": true,
    "inputSchema": {
      "type": "object",
      "properties": {
        "thread_id": {
          "type": "string",
          "description": "The unique identifier of the thread to list runs from (format: \"thread_abc123...\")."
        },
        "limit": {
          "type": "number",
          "description": "Maximum number of runs to return in one request (1-100, default: 20)."
        },
        "order": {
          "type": "string",
          "enum": [
            "asc",
            "desc"
          ],
          "description": "Sort order by creation date: \"desc\" for newest first (default), \"asc\" for oldest first."
        },
        "after": {
          "type": "string",
          "description": "Pagination cursor - run ID to start listing after (format: \"run_abc123...\")."
        },
        "before": {
          "type": "string",
          "description": "Pagination cursor - run ID to end listing before (format: \"run_abc123...\")."
        }
      },
      "required": [
        "thread_id"
      ]
    }
  },
  "run-get": {
    "title": "Get Run Details",
    "description": "Retrieve detailed information about a specific assistant run including its status, configuration, and results. Use this to monitor run progress, check completion status, or debug run issues. Essential for understanding run execution and handling different run states.",
    "readOnlyHint": true,
    "inputSchema": {
      "type": "object",
      "properties": {
        "thread_id": {
          "type": "string",
          "description": "The unique identifier of the thread containing the run (format: \"thread_abc123...\")."
        },
        "run_id": {
          "type": "string",
          "description": "The unique identifier of the run to retrieve (format: \"run_abc123...\")."
        }
      },
      "required": [
        "thread_id",
        "run_id"
      ]
    }
  },
  "run-update": {
    "title": "Update Run",
    "description": "Modify an existing run's metadata. Use this to add tracking information, update run categorization, or organize run data better. Note that run configuration cannot be changed, only metadata can be updated.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "thread_id": {
          "type": "string",
          "description": "The unique identifier of the thread containing the run (format: \"thread_abc123...\")."
        },
        "run_id": {
          "type": "string",
          "description": "The unique identifier of the run to update (format: \"run_abc123...\")."
        },
        "metadata": {
          "type": "object",
          "description": "New metadata key-value pairs to replace existing metadata (e.g., {\"priority\": \"high\", \"category\": \"analysis\"})."
        }
      },
      "required": [
        "thread_id",
        "run_id"
      ]
    }
  },
  "run-cancel": {
    "title": "Cancel Run",
    "description": "Cancel a running assistant execution that is currently in progress. Use this to stop long-running operations, abort stuck runs, or cancel runs that are no longer needed. The run will be stopped and marked as cancelled.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "thread_id": {
          "type": "string",
          "description": "The unique identifier of the thread containing the run (format: \"thread_abc123...\")."
        },
        "run_id": {
          "type": "string",
          "description": "The unique identifier of the run to cancel (format: \"run_abc123...\"). Only runs in 'in_progress' or 'requires_action' status can be cancelled."
        }
      },
      "required": [
        "thread_id",
        "run_id"
      ]
    }
  },
  "run-submit-tool-outputs": {
    "title": "Submit Tool Outputs",
    "description": "Submit tool call results to continue a run that is waiting for tool outputs. Use this when a run status is 'requires_action' and the assistant has made tool calls that need responses. Essential for interactive workflows where assistants use tools and need results to continue processing.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "thread_id": {
          "type": "string",
          "description": "The unique identifier of the thread containing the run (format: \"thread_abc123...\")."
        },
        "run_id": {
          "type": "string",
          "description": "The unique identifier of the run to submit tool outputs for (format: \"run_abc123...\"). Must be in 'requires_action' status."
        },
        "tool_outputs": {
          "type": "array",
          "description": "Array of tool outputs to submit. Each output should correspond to a tool call made by the assistant.",
          "items": {
            "type": "object",
            "properties": {
              "tool_call_id": {
                "type": "string",
                "description": "The ID of the tool call this output is for."
              },
              "output": {
                "type": "string",
                "description": "The output/result of the tool call."
              }
            },
            "required": [
              "tool_call_id",
              "output"
            ]
          }
        }
      },
      "required": [
        "thread_id",
        "run_id",
        "tool_outputs"
      ]
    }
  },
  "run-step-list": {
    "title": "List Run Steps",
    "description": "Retrieve all steps in a run execution with pagination support. Use this to understand how an assistant processed a run, debug issues, or analyze assistant behavior. Each step shows what the assistant did during the run, including tool calls and message creation.",
    "readOnlyHint": true,
    "inputSchema": {
      "type": "object",
      "properties": {
        "thread_id": {
          "type": "string",
          "description": "The unique identifier of the thread containing the run (format: \"thread_abc123...\")."
        },
        "run_id": {
          "type": "string",
          "description": "The unique identifier of the run to list steps from (format: \"run_abc123...\")."
        },
        "limit": {
          "type": "number",
          "description": "Maximum number of steps to return in one request (1-100, default: 20)."
        },
        "order": {
          "type": "string",
          "enum": [
            "asc",
            "desc"
          ],
          "description": "Sort order by creation date: \"desc\" for newest first (default), \"asc\" for oldest first (chronological order)."
        },
        "after": {
          "type": "string",
          "description": "Pagination cursor - step ID to start listing after (format: \"step_abc123...\")."
        },
        "before": {
          "type": "string",
          "description": "Pagination cursor - step ID to end listing before (format: \"step_abc123...\")."
        }
      },
      "required": [
        "thread_id",
        "run_id"
      ]
    }
  },
  "run-step-get": {
    "title": "Get Run Step Details",
    "description": "Retrieve detailed information about a specific step in a run execution. Use this to examine what the assistant did during a particular step, debug specific issues, or understand tool calls and message creation in detail.",
    "readOnlyHint": true,
    "inputSchema": {
      "type": "object",
      "properties": {
        "thread_id": {
          "type": "string",
          "description": "The unique identifier of the thread containing the run (format: \"thread_abc123...\")."
        },
        "run_id": {
          "type": "string",
          "description": "The unique identifier of the run containing the step (format: \"run_abc123...\")."
        },
        "step_id": {
          "type": "string",
          "description": "The unique identifier of the step to retrieve (format: \"step_abc123...\")."
        }
      },
      "required": [
        "thread_id",
        "run_id",
        "step_id"
      ]
    }
  }
};

/**
 * Generate tool definitions from a tool registry
 * 
 * @param registry - The tool registry containing all handlers
 * @returns Array of MCP tool definitions
 */
export function generateToolDefinitions(registry: ToolRegistry): MCPTool[] {
  const tools: MCPTool[] = [];
  const registeredTools = registry.getRegisteredTools();

  for (const toolName of registeredTools) {
    const definition = TOOL_DEFINITIONS[toolName];
    if (definition) {
      tools.push({
        name: toolName,
        ...definition
      });
    } else {
      console.warn(`[ToolDefinitions] No definition found for tool: ${toolName}`);
      // Create a basic definition as fallback
      tools.push({
        name: toolName,
        title: toolName.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        description: `Execute ${toolName} operation`,
        inputSchema: {
          type: 'object',
          properties: {},
        },
      });
    }
  }

  return tools.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Validate that all registered tools have definitions
 * 
 * @param registry - The tool registry to validate
 * @returns Validation result
 */
export function validateToolDefinitions(registry: ToolRegistry): {
  isComplete: boolean;
  missingDefinitions: string[];
  extraDefinitions: string[];
} {
  const registeredTools = registry.getRegisteredTools();
  const definedTools = Object.keys(TOOL_DEFINITIONS);
  
  const missingDefinitions = registeredTools.filter(tool => !definedTools.includes(tool));
  const extraDefinitions = definedTools.filter(tool => !registeredTools.includes(tool));
  
  return {
    isComplete: missingDefinitions.length === 0,
    missingDefinitions,
    extraDefinitions
  };
}
