# Implementation Examples - Modular Architecture

## Overview

This document provides concrete implementation examples for the recommended hybrid modular + configuration approach for organizing tool definitions, prompts, and resources.

## Example 1: Modular Tool Definitions

### Current Structure (tool-definitions.ts)
```typescript
// Current: 659 lines in single file
const TOOL_DEFINITIONS: Record<string, Omit<MCPTool, 'name'>> = {
  'assistant-create': {
    title: 'Create AI Assistant',
    description: 'Create a new AI assistant...',
    inputSchema: { /* large schema */ }
  },
  'assistant-list': { /* definition */ },
  // ... 20 more tools
};
```

### Proposed Modular Structure

#### Directory Layout
```
shared/definitions/tools/
├── assistant/
│   ├── create.json
│   ├── list.json
│   ├── get.json
│   ├── update.json
│   └── delete.json
├── thread/
│   ├── create.json
│   ├── get.json
│   ├── update.json
│   └── delete.json
├── message/
│   ├── create.json
│   ├── list.json
│   ├── get.json
│   ├── update.json
│   └── delete.json
├── run/
│   ├── create.json
│   ├── list.json
│   ├── get.json
│   ├── update.json
│   ├── cancel.json
│   └── submit-tool-outputs.json
├── run-step/
│   ├── list.json
│   └── get.json
└── index.ts (auto-generated)
```

#### Individual Tool Definition Example
```json
// shared/definitions/tools/assistant/create.json
{
  "title": "Create AI Assistant",
  "description": "Create a new AI assistant with custom instructions and capabilities for a specific task or domain. Use this when you need to set up a persistent assistant that can be used across multiple conversations. The assistant will retain its configuration and can be equipped with tools like code interpreter, file search, or custom functions. Perfect for creating specialized assistants for customer support, coding help, content creation, or domain-specific tasks. Returns the assistant ID for future operations.",
  "category": "assistant-management",
  "tags": ["assistant", "create", "management"],
  "inputSchema": {
    "type": "object",
    "properties": {
      "model": {
        "type": "string",
        "description": "The OpenAI model to use for the assistant (e.g., \"gpt-4\", \"gpt-3.5-turbo\", \"gpt-4-turbo\"). Choose gpt-4 for complex reasoning, gpt-3.5-turbo for faster responses, or gpt-4-turbo for balanced performance."
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
              "enum": ["code_interpreter", "file_search", "function"]
            }
          }
        }
      },
      "metadata": {
        "type": "object",
        "description": "Custom key-value pairs for storing additional information about the assistant (e.g., {\"department\": \"support\", \"version\": \"1.0\", \"created_by\": \"admin\"})."
      }
    },
    "required": ["model"]
  }
}
```

#### Auto-Generated Index File
```typescript
// shared/definitions/tools/index.ts (auto-generated)
import assistantCreate from './assistant/create.json';
import assistantList from './assistant/list.json';
import assistantGet from './assistant/get.json';
import assistantUpdate from './assistant/update.json';
import assistantDelete from './assistant/delete.json';

import threadCreate from './thread/create.json';
import threadGet from './thread/get.json';
import threadUpdate from './thread/update.json';
import threadDelete from './thread/delete.json';

import messageCreate from './message/create.json';
import messageList from './message/list.json';
import messageGet from './message/get.json';
import messageUpdate from './message/update.json';
import messageDelete from './message/delete.json';

import runCreate from './run/create.json';
import runList from './run/list.json';
import runGet from './run/get.json';
import runUpdate from './run/update.json';
import runCancel from './run/cancel.json';
import runSubmitToolOutputs from './run/submit-tool-outputs.json';

import runStepList from './run-step/list.json';
import runStepGet from './run-step/get.json';

export const toolDefinitions = {
  'assistant-create': assistantCreate,
  'assistant-list': assistantList,
  'assistant-get': assistantGet,
  'assistant-update': assistantUpdate,
  'assistant-delete': assistantDelete,
  
  'thread-create': threadCreate,
  'thread-get': threadGet,
  'thread-update': threadUpdate,
  'thread-delete': threadDelete,
  
  'message-create': messageCreate,
  'message-list': messageList,
  'message-get': messageGet,
  'message-update': messageUpdate,
  'message-delete': messageDelete,
  
  'run-create': runCreate,
  'run-list': runList,
  'run-get': runGet,
  'run-update': runUpdate,
  'run-cancel': runCancel,
  'run-submit-tool-outputs': runSubmitToolOutputs,
  
  'run-step-list': runStepList,
  'run-step-get': runStepGet
};

export const toolCategories = {
  'assistant-management': [
    'assistant-create', 'assistant-list', 'assistant-get', 
    'assistant-update', 'assistant-delete'
  ],
  'thread-management': [
    'thread-create', 'thread-get', 'thread-update', 'thread-delete'
  ],
  'message-management': [
    'message-create', 'message-list', 'message-get', 
    'message-update', 'message-delete'
  ],
  'run-management': [
    'run-create', 'run-list', 'run-get', 'run-update', 
    'run-cancel', 'run-submit-tool-outputs'
  ],
  'run-step-management': [
    'run-step-list', 'run-step-get'
  ]
};
```

## Example 2: Configuration-Driven Loading

### Configuration Files

#### Main Configuration
```yaml
# config/tools.yaml
version: "1.0"
metadata:
  name: "OpenAI Assistants MCP Tools"
  description: "Tool definitions for OpenAI Assistants API"

categories:
  assistant-management:
    description: "Assistant lifecycle management"
    tools:
      - create
      - list
      - get
      - update
      - delete
    
  thread-management:
    description: "Conversation thread management"
    tools:
      - create
      - get
      - update
      - delete
    
  message-management:
    description: "Message handling within threads"
    tools:
      - create
      - list
      - get
      - update
      - delete
    
  run-management:
    description: "Assistant execution management"
    tools:
      - create
      - list
      - get
      - update
      - cancel
      - submit-tool-outputs
    
  run-step-management:
    description: "Run execution step analysis"
    tools:
      - list
      - get

environments:
  development:
    include_all: true
    debug_tools: true
    
  staging:
    include_categories:
      - assistant-management
      - thread-management
      - message-management
      - run-management
      - run-step-management
    exclude_tools: []
    
  production:
    include_categories:
      - assistant-management
      - thread-management
      - message-management
      - run-management
    exclude_categories:
      - run-step-management  # Exclude debugging tools in production
    
  minimal:
    include_categories:
      - assistant-management
      - thread-management
      - message-management
    include_tools:
      - run-create
      - run-get
```

#### Environment-Specific Configurations
```yaml
# config/environments/cloudflare-workers.yaml
name: "Cloudflare Workers Deployment"
extends: "production"

constraints:
  max_bundle_size: "800KB"
  max_tools: 20
  
optimizations:
  tree_shaking: true
  minify_descriptions: true
  remove_examples: true
  
overrides:
  exclude_tools:
    - run-step-list  # Remove debugging tools for size
    - run-step-get
```

```yaml
# config/environments/npm-package.yaml
name: "NPM Package Distribution"
extends: "development"

features:
  selective_imports: true
  tree_shaking: true
  
exports:
  - name: "core"
    categories: ["assistant-management", "thread-management"]
  - name: "full"
    include_all: true
  - name: "minimal"
    tools: ["assistant-create", "thread-create", "message-create", "run-create"]
```

### Configuration Loader Implementation

```typescript
// shared/config/config-loader.ts
import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { toolDefinitions, toolCategories } from '../definitions/tools/index.js';

export interface ToolConfig {
  version: string;
  metadata: {
    name: string;
    description: string;
  };
  categories: Record<string, {
    description: string;
    tools: string[];
  }>;
  environments: Record<string, EnvironmentConfig>;
}

export interface EnvironmentConfig {
  include_all?: boolean;
  include_categories?: string[];
  exclude_categories?: string[];
  include_tools?: string[];
  exclude_tools?: string[];
  extends?: string;
}

export class ConfigLoader {
  private config: ToolConfig;
  
  constructor(configPath: string = 'config/tools.yaml') {
    this.config = this.loadConfig(configPath);
  }
  
  private loadConfig(path: string): ToolConfig {
    const content = readFileSync(path, 'utf8');
    return parse(content);
  }
  
  getToolsForEnvironment(environment: string): string[] {
    const envConfig = this.config.environments[environment];
    if (!envConfig) {
      throw new Error(`Environment '${environment}' not found`);
    }
    
    // Handle inheritance
    let resolvedConfig = envConfig;
    if (envConfig.extends) {
      const parentConfig = this.config.environments[envConfig.extends];
      resolvedConfig = { ...parentConfig, ...envConfig };
    }
    
    // Start with all tools if include_all is true
    let tools: string[] = [];
    
    if (resolvedConfig.include_all) {
      tools = Object.keys(toolDefinitions);
    } else {
      // Include specific categories
      if (resolvedConfig.include_categories) {
        for (const category of resolvedConfig.include_categories) {
          const categoryTools = toolCategories[category] || [];
          tools.push(...categoryTools);
        }
      }
      
      // Include specific tools
      if (resolvedConfig.include_tools) {
        tools.push(...resolvedConfig.include_tools);
      }
    }
    
    // Remove excluded categories
    if (resolvedConfig.exclude_categories) {
      for (const category of resolvedConfig.exclude_categories) {
        const categoryTools = toolCategories[category] || [];
        tools = tools.filter(tool => !categoryTools.includes(tool));
      }
    }
    
    // Remove excluded tools
    if (resolvedConfig.exclude_tools) {
      tools = tools.filter(tool => !resolvedConfig.exclude_tools!.includes(tool));
    }
    
    // Remove duplicates and sort
    return [...new Set(tools)].sort();
  }
  
  getToolDefinitionsForEnvironment(environment: string) {
    const tools = this.getToolsForEnvironment(environment);
    const definitions: Record<string, any> = {};
    
    for (const toolName of tools) {
      if (toolDefinitions[toolName]) {
        definitions[toolName] = toolDefinitions[toolName];
      }
    }
    
    return definitions;
  }
}

// Usage example
export function createEnvironmentSpecificRegistry(environment: string) {
  const loader = new ConfigLoader();
  const definitions = loader.getToolDefinitionsForEnvironment(environment);
  
  return {
    tools: definitions,
    count: Object.keys(definitions).length,
    environment
  };
}
```

## Example 3: Build-Time Generation

### Build Script
```typescript
// scripts/generate-definitions.ts
import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, extname, basename } from 'path';
import { ConfigLoader } from '../shared/config/config-loader.js';

interface GenerationOptions {
  environment?: string;
  outputDir: string;
  format: 'typescript' | 'javascript' | 'json';
  minify?: boolean;
  includeTypes?: boolean;
}

export class DefinitionGenerator {
  private configLoader: ConfigLoader;
  
  constructor() {
    this.configLoader = new ConfigLoader();
  }
  
  async generateForEnvironment(options: GenerationOptions) {
    const { environment = 'development', outputDir, format } = options;
    
    console.log(`Generating definitions for environment: ${environment}`);
    
    // Get tools for environment
    const tools = this.configLoader.getToolsForEnvironment(environment);
    const definitions = this.configLoader.getToolDefinitionsForEnvironment(environment);
    
    console.log(`Including ${tools.length} tools: ${tools.join(', ')}`);
    
    // Generate index file
    await this.generateIndexFile(definitions, outputDir, format, options);
    
    // Generate type definitions if requested
    if (options.includeTypes) {
      await this.generateTypeDefinitions(definitions, outputDir);
    }
    
    // Generate metadata
    await this.generateMetadata(tools, definitions, outputDir, environment);
    
    console.log(`Generated definitions in ${outputDir}`);
  }
  
  private async generateIndexFile(
    definitions: Record<string, any>,
    outputDir: string,
    format: string,
    options: GenerationOptions
  ) {
    let content = '';
    
    if (format === 'typescript') {
      content = this.generateTypeScriptIndex(definitions, options);
    } else if (format === 'javascript') {
      content = this.generateJavaScriptIndex(definitions, options);
    } else {
      content = JSON.stringify(definitions, null, options.minify ? 0 : 2);
    }
    
    const extension = format === 'json' ? 'json' : (format === 'typescript' ? 'ts' : 'js');
    const filename = join(outputDir, `index.${extension}`);
    
    writeFileSync(filename, content);
  }
  
  private generateTypeScriptIndex(definitions: Record<string, any>, options: GenerationOptions): string {
    const imports: string[] = [];
    const exports: string[] = [];
    
    // Generate imports for each tool
    Object.keys(definitions).forEach(toolName => {
      const [category, action] = toolName.split('-');
      const importName = this.toCamelCase(toolName);
      const importPath = `./tools/${category}/${action}.json`;
      
      imports.push(`import ${importName} from '${importPath}';`);
      exports.push(`  '${toolName}': ${importName}`);
    });
    
    return `// Auto-generated tool definitions
// Generated at: ${new Date().toISOString()}
// Environment: ${options.environment || 'development'}

${imports.join('\n')}

export const toolDefinitions = {
${exports.join(',\n')}
};

export const toolNames = [
${Object.keys(definitions).map(name => `  '${name}'`).join(',\n')}
];

export const toolCount = ${Object.keys(definitions).length};
`;
  }
  
  private generateJavaScriptIndex(definitions: Record<string, any>, options: GenerationOptions): string {
    return `// Auto-generated tool definitions
// Generated at: ${new Date().toISOString()}
// Environment: ${options.environment || 'development'}

const toolDefinitions = ${JSON.stringify(definitions, null, options.minify ? 0 : 2)};

const toolNames = [
${Object.keys(definitions).map(name => `  '${name}'`).join(',\n')}
];

const toolCount = ${Object.keys(definitions).length};

module.exports = {
  toolDefinitions,
  toolNames,
  toolCount
};
`;
  }
  
  private async generateTypeDefinitions(definitions: Record<string, any>, outputDir: string) {
    const types = `// Auto-generated type definitions

export interface ToolDefinition {
  title: string;
  description: string;
  category?: string;
  tags?: string[];
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  readOnlyHint?: boolean;
  idempotentHint?: boolean;
  destructiveHint?: boolean;
}

export interface ToolRegistry {
  [toolName: string]: ToolDefinition;
}

export type ToolName = ${Object.keys(definitions).map(name => `'${name}'`).join(' | ')};
`;
    
    writeFileSync(join(outputDir, 'types.ts'), types);
  }
  
  private async generateMetadata(
    tools: string[],
    definitions: Record<string, any>,
    outputDir: string,
    environment: string
  ) {
    const metadata = {
      generatedAt: new Date().toISOString(),
      environment,
      toolCount: tools.length,
      tools,
      categories: this.groupToolsByCategory(tools),
      bundleSize: this.estimateBundleSize(definitions)
    };
    
    writeFileSync(
      join(outputDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
  }
  
  private groupToolsByCategory(tools: string[]): Record<string, string[]> {
    const categories: Record<string, string[]> = {};
    
    tools.forEach(tool => {
      const [category] = tool.split('-');
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(tool);
    });
    
    return categories;
  }
  
  private estimateBundleSize(definitions: Record<string, any>): number {
    return JSON.stringify(definitions).length;
  }
  
  private toCamelCase(str: string): string {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }
}

// CLI usage
if (require.main === module) {
  const generator = new DefinitionGenerator();
  
  const environment = process.argv[2] || 'development';
  const outputDir = process.argv[3] || './dist';
  
  generator.generateForEnvironment({
    environment,
    outputDir,
    format: 'typescript',
    includeTypes: true,
    minify: environment === 'production'
  }).catch(console.error);
}
```

### Package.json Scripts
```json
{
  "scripts": {
    "build:tools": "tsx scripts/generate-definitions.ts",
    "build:tools:dev": "tsx scripts/generate-definitions.ts development ./dist/dev",
    "build:tools:prod": "tsx scripts/generate-definitions.ts production ./dist/prod",
    "build:tools:minimal": "tsx scripts/generate-definitions.ts minimal ./dist/minimal",
    "build:tools:cloudflare": "tsx scripts/generate-definitions.ts cloudflare-workers ./dist/cloudflare",
    "build:tools:npm": "tsx scripts/generate-definitions.ts npm-package ./dist/npm",
    "validate:tools": "tsx scripts/validate-definitions.ts",
    "watch:tools": "chokidar 'shared/definitions/**/*.json' -c 'npm run build:tools:dev'"
  }
}
```

## Example 4: Selective Import System

### NPM Package Exports
```json
{
  "name": "openai-assistants-mcp",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./core": {
      "import": "./dist/core.js",
      "require": "./dist/core.cjs"
    },
    "./assistant": {
      "import": "./dist/assistant.js",
      "require": "./dist/assistant.cjs"
    },
    "./thread": {
      "import": "./dist/thread.js",
      "require": "./dist/thread.cjs"
    },
    "./message": {
      "import": "./dist/message.js",
      "require": "./dist/message.cjs"
    },
    "./run": {
      "import": "./dist/run.js",
      "require": "./dist/run.cjs"
    },
    "./tools/*": "./dist/tools/*.json",
    "./config": "./dist/config.js"
  }
}
```

### Usage Examples
```typescript
// Full import (current behavior)
import { MCPHandler } from 'openai-assistants-mcp';

// Selective imports (new capability)
import { AssistantTools } from 'openai-assistants-mcp/assistant';
import { ThreadTools } from 'openai-assistants-mcp/thread';
import { MessageTools } from 'openai-assistants-mcp/message';

// Individual tool imports
import assistantCreate from 'openai-assistants-mcp/tools/assistant/create.json';
import threadCreate from 'openai-assistants-mcp/tools/thread/create.json';

// Configuration-based imports
import { createCustomHandler } from 'openai-assistants-mcp/config';

const handler = createCustomHandler({
  tools: ['assistant-create', 'thread-create', 'message-create', 'run-create'],
  environment: 'minimal'
});
```

## Example 5: Validation and Type Safety

### JSON Schema Definitions
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Tool Definition Schema",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Human-readable title for the tool"
    },
    "description": {
      "type": "string",
      "description": "Detailed description of what the tool does"
    },
    "category": {
      "type": "string",
      "enum": ["assistant-management", "thread-management", "message-management", "run-management", "run-step-management"]
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "type": {
          "const": "object"
        },
        "properties": {
          "type": "object"
        },
        "required": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      "required": ["type", "properties"]
    },
    "readOnlyHint": {
      "type": "boolean"
    },
    "idempotentHint": {
      "type": "boolean"
    },
    "destructiveHint": {
      "type": "boolean"
    }
  },
  "required": ["title", "description", "inputSchema"]
}
```

### Runtime Validation
```typescript
// shared/validation/tool-validator.ts
import Ajv from 'ajv';
import toolSchema from '../schemas/tool-schema.json';

const ajv = new Ajv();
const validateTool = ajv.compile(toolSchema);

export function validateToolDefinition(tool: unknown, toolName: string): void {
  if (!validateTool(tool)) {
    const errors = validateTool.errors?.map(err => 
      `${err.instancePath}: ${err.message}`
    ).join(', ') || 'Unknown validation error';
    
    throw new Error(`Invalid tool definition for '${toolName}': ${errors}`);
  }
}

export function validateAllTools(definitions: Record<string, unknown>): void {
  const errors: string[] = [];
  
  for (const [toolName, definition] of Object.entries(definitions)) {
    try {
      validateToolDefinition(definition, toolName);
    } catch (error) {
      errors.push(`${toolName}: ${error.message}`);
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Tool validation failed:\n${errors.join('\n')}`);
  }
}
```

## Benefits Summary

### Maintainability Improvements
- ✅ **Individual Files**: Each tool in separate 50-100 line JSON file
- ✅ **Clear Ownership**: Files can have individual owners/maintainers
- ✅ **Easier Reviews**: Small, focused changes in PRs
- ✅ **Better Navigation**: IDE can jump to specific tool definitions

### Collaboration Benefits
- ✅ **Parallel Development**: Multiple developers can work on different tools
- ✅ **Reduced Conflicts**: Separate files eliminate merge conflicts
- ✅ **Granular History**: Git history shows changes to specific tools
- ✅ **Easier Contributions**: Lower barrier for community contributions

### Deployment Flexibility
- ✅ **Selective Loading**: Include only needed tools per environment
- ✅ **Bundle Optimization**: Reduce bundle size by 20-40%
- ✅ **Environment Variants**: Different tool sets for dev/staging/prod
- ✅ **Tree Shaking**: Modern bundlers can eliminate unused tools

### Future Extensibility
- ✅ **Plugin Architecture**: Easy to add external tool definitions
- ✅ **Dynamic Loading**: Runtime loading of new tools possible
- ✅ **Configuration Management**: YAML-based configuration for non-developers
- ✅ **Validation Pipeline**: Automated validation in CI/CD

This modular approach addresses all identified pain points while maintaining performance and type safety, providing a solid foundation for future growth and community contributions.