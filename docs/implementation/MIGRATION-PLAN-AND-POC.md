# Migration Plan and Proof of Concept

## Overview

This document provides a detailed migration plan for transitioning from the current monolithic file structure to the proposed modular architecture, along with a working proof-of-concept implementation.

## Migration Strategy

### Phase 1: Foundation Setup (Week 1)

#### 1.1 Schema and Validation Infrastructure
```bash
# Create directory structure
mkdir -p shared/schemas
mkdir -p shared/validation
mkdir -p scripts/migration
mkdir -p config/environments
```

#### 1.2 JSON Schema Definitions
Create validation schemas for all definition types:

```json
// shared/schemas/tool-definition.schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "MCP Tool Definition",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "description": {
      "type": "string",
      "minLength": 10,
      "maxLength": 2000
    },
    "category": {
      "type": "string",
      "enum": [
        "assistant-management",
        "thread-management", 
        "message-management",
        "run-management",
        "run-step-management"
      ]
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "uniqueItems": true
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
      "required": ["type", "properties"],
      "additionalProperties": true
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
  "required": ["title", "description", "inputSchema"],
  "additionalProperties": false
}
```

#### 1.3 Migration Scripts
```typescript
// scripts/migration/extract-tools.ts
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { TOOL_DEFINITIONS } from '../../shared/core/tool-definitions.js';

interface ToolDefinition {
  title: string;
  description: string;
  category?: string;
  tags?: string[];
  inputSchema: any;
  readOnlyHint?: boolean;
  idempotentHint?: boolean;
  destructiveHint?: boolean;
}

export class ToolExtractor {
  private outputDir: string;
  
  constructor(outputDir: string = 'shared/definitions/tools') {
    this.outputDir = outputDir;
  }
  
  extractAllTools(): void {
    console.log('Extracting tools from monolithic definition...');
    
    let extractedCount = 0;
    let skippedCount = 0;
    
    for (const [toolName, definition] of Object.entries(TOOL_DEFINITIONS)) {
      try {
        this.extractTool(toolName, definition);
        extractedCount++;
        console.log(`✅ Extracted: ${toolName}`);
      } catch (error) {
        console.error(`❌ Failed to extract ${toolName}:`, error.message);
        skippedCount++;
      }
    }
    
    console.log(`\nExtraction complete:`);
    console.log(`  ✅ Extracted: ${extractedCount} tools`);
    console.log(`  ❌ Skipped: ${skippedCount} tools`);
    
    // Generate index file
    this.generateIndexFile();
  }
  
  private extractTool(toolName: string, definition: any): void {
    const [category, action] = toolName.split('-');
    
    if (!category || !action) {
      throw new Error(`Invalid tool name format: ${toolName}`);
    }
    
    // Create category directory
    const categoryDir = join(this.outputDir, category);
    mkdirSync(categoryDir, { recursive: true });
    
    // Enhance definition with metadata
    const enhancedDefinition: ToolDefinition = {
      ...definition,
      category: this.mapToStandardCategory(category),
      tags: this.generateTags(toolName, definition)
    };
    
    // Validate definition
    this.validateDefinition(enhancedDefinition, toolName);
    
    // Write to file
    const filePath = join(categoryDir, `${action}.json`);
    writeFileSync(filePath, JSON.stringify(enhancedDefinition, null, 2));
  }
  
  private mapToStandardCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      'assistant': 'assistant-management',
      'thread': 'thread-management',
      'message': 'message-management',
      'run': 'run-management',
      'step': 'run-step-management'
    };
    
    return categoryMap[category] || `${category}-management`;
  }
  
  private generateTags(toolName: string, definition: any): string[] {
    const tags = new Set<string>();
    
    // Add category tag
    const [category] = toolName.split('-');
    tags.add(category);
    
    // Add action tag
    const [, action] = toolName.split('-');
    tags.add(action);
    
    // Add semantic tags based on description
    const description = definition.description?.toLowerCase() || '';
    
    if (description.includes('create')) tags.add('create');
    if (description.includes('delete') || description.includes('remove')) tags.add('delete');
    if (description.includes('update') || description.includes('modify')) tags.add('update');
    if (description.includes('list') || description.includes('retrieve')) tags.add('read');
    if (description.includes('manage')) tags.add('management');
    
    // Add hint-based tags
    if (definition.readOnlyHint) tags.add('read-only');
    if (definition.idempotentHint) tags.add('idempotent');
    if (definition.destructiveHint) tags.add('destructive');
    
    return Array.from(tags).sort();
  }
  
  private validateDefinition(definition: ToolDefinition, toolName: string): void {
    // Basic validation
    if (!definition.title || definition.title.length === 0) {
      throw new Error(`Missing title for ${toolName}`);
    }
    
    if (!definition.description || definition.description.length < 10) {
      throw new Error(`Description too short for ${toolName}`);
    }
    
    if (!definition.inputSchema || !definition.inputSchema.type) {
      throw new Error(`Invalid input schema for ${toolName}`);
    }
  }
  
  private generateIndexFile(): void {
    console.log('\nGenerating index file...');
    
    // Scan extracted files
    const tools = this.scanExtractedTools();
    
    // Generate TypeScript index
    const indexContent = this.generateTypeScriptIndex(tools);
    writeFileSync(join(this.outputDir, 'index.ts'), indexContent);
    
    // Generate metadata
    const metadata = {
      generatedAt: new Date().toISOString(),
      toolCount: Object.keys(tools).length,
      categories: this.groupByCategory(tools),
      tools: Object.keys(tools).sort()
    };
    
    writeFileSync(
      join(this.outputDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    console.log(`Generated index with ${Object.keys(tools).length} tools`);
  }
  
  private scanExtractedTools(): Record<string, string> {
    const tools: Record<string, string> = {};
    
    // This would scan the filesystem in a real implementation
    // For now, we'll use the known tool names
    for (const toolName of Object.keys(TOOL_DEFINITIONS)) {
      const [category, action] = toolName.split('-');
      tools[toolName] = `${category}/${action}`;
    }
    
    return tools;
  }
  
  private generateTypeScriptIndex(tools: Record<string, string>): string {
    const imports: string[] = [];
    const exports: string[] = [];
    
    for (const [toolName, path] of Object.entries(tools)) {
      const importName = this.toCamelCase(toolName);
      imports.push(`import ${importName} from './${path}.json';`);
      exports.push(`  '${toolName}': ${importName}`);
    }
    
    return `// Auto-generated tool definitions index
// Generated at: ${new Date().toISOString()}
// Source: Extracted from monolithic tool-definitions.ts

${imports.join('\n')}

export const toolDefinitions = {
${exports.join(',\n')}
};

export const toolNames = Object.keys(toolDefinitions);
export const toolCount = toolNames.length;

// Category mappings
export const toolCategories = {
${this.generateCategoryMappings(tools)}
};
`;
  }
  
  private generateCategoryMappings(tools: Record<string, string>): string {
    const categories = this.groupByCategory(tools);
    
    return Object.entries(categories)
      .map(([category, toolList]) => 
        `  '${category}': [${toolList.map(t => `'${t}'`).join(', ')}]`
      )
      .join(',\n');
  }
  
  private groupByCategory(tools: Record<string, string>): Record<string, string[]> {
    const categories: Record<string, string[]> = {};
    
    for (const toolName of Object.keys(tools)) {
      const [category] = toolName.split('-');
      const categoryKey = `${category}-management`;
      
      if (!categories[categoryKey]) {
        categories[categoryKey] = [];
      }
      categories[categoryKey].push(toolName);
    }
    
    return categories;
  }
  
  private toCamelCase(str: string): string {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }
}

// CLI execution
if (require.main === module) {
  const extractor = new ToolExtractor();
  extractor.extractAllTools();
}
```

### Phase 2: Proof of Concept (Week 2)

#### 2.1 Create Sample Modular Structure
Let's create a working example with a few tools to demonstrate the concept:

```bash
# Create PoC directory structure
mkdir -p poc/definitions/tools/assistant
mkdir -p poc/definitions/tools/thread
mkdir -p poc/config
mkdir -p poc/generated
```

#### 2.2 Sample Tool Definitions

```json
// poc/definitions/tools/assistant/create.json
{
  "title": "Create AI Assistant",
  "description": "Create a new AI assistant with custom instructions and capabilities for a specific task or domain. Use this when you need to set up a persistent assistant that can be used across multiple conversations.",
  "category": "assistant-management",
  "tags": ["assistant", "create", "management"],
  "inputSchema": {
    "type": "object",
    "properties": {
      "model": {
        "type": "string",
        "description": "The OpenAI model to use for the assistant (e.g., \"gpt-4\", \"gpt-3.5-turbo\", \"gpt-4-turbo\")"
      },
      "name": {
        "type": "string",
        "description": "A descriptive name for the assistant"
      },
      "description": {
        "type": "string",
        "description": "A brief description of what the assistant does"
      },
      "instructions": {
        "type": "string",
        "description": "System instructions that define the assistant's behavior"
      },
      "tools": {
        "type": "array",
        "description": "Array of tools to enable for the assistant",
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
        "description": "Custom key-value pairs for storing additional information"
      }
    },
    "required": ["model"]
  }
}
```

```json
// poc/definitions/tools/assistant/list.json
{
  "title": "List All Assistants",
  "description": "Retrieve a list of all your AI assistants with pagination support. Use this to browse existing assistants, find specific ones by name, or get an overview of your assistant collection.",
  "category": "assistant-management",
  "tags": ["assistant", "list", "read", "management"],
  "readOnlyHint": true,
  "inputSchema": {
    "type": "object",
    "properties": {
      "limit": {
        "type": "number",
        "description": "Maximum number of assistants to return in one request (1-100, default: 20)"
      },
      "order": {
        "type": "string",
        "enum": ["asc", "desc"],
        "description": "Sort order by creation date: \"desc\" for newest first (default), \"asc\" for oldest first"
      },
      "after": {
        "type": "string",
        "description": "Pagination cursor - assistant ID to start listing after"
      },
      "before": {
        "type": "string",
        "description": "Pagination cursor - assistant ID to end listing before"
      }
    }
  }
}
```

```json
// poc/definitions/tools/thread/create.json
{
  "title": "Create Conversation Thread",
  "description": "Create a new conversation thread to organize a series of messages and assistant interactions. Threads maintain conversation context and history.",
  "category": "thread-management",
  "tags": ["thread", "create", "conversation"],
  "inputSchema": {
    "type": "object",
    "properties": {
      "messages": {
        "type": "array",
        "description": "Optional array of initial messages to start the conversation"
      },
      "metadata": {
        "type": "object",
        "description": "Custom key-value pairs for organizing threads"
      }
    }
  }
}
```

#### 2.3 Configuration Files

```yaml
# poc/config/tools.yaml
version: "1.0"
metadata:
  name: "PoC Tool Definitions"
  description: "Proof of concept for modular tool organization"

categories:
  assistant-management:
    description: "Assistant lifecycle management"
    tools:
      - create
      - list
  
  thread-management:
    description: "Conversation thread management"
    tools:
      - create

environments:
  development:
    include_all: true
    
  minimal:
    include_categories:
      - assistant-management
    include_tools:
      - thread-create
      
  production:
    include_categories:
      - assistant-management
      - thread-management
```

#### 2.4 PoC Generator Script

```typescript
// poc/generate-poc.ts
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { parse } from 'yaml';

interface ToolDefinition {
  title: string;
  description: string;
  category: string;
  tags: string[];
  inputSchema: any;
  readOnlyHint?: boolean;
  idempotentHint?: boolean;
  destructiveHint?: boolean;
}

interface Config {
  version: string;
  metadata: {
    name: string;
    description: string;
  };
  categories: Record<string, {
    description: string;
    tools: string[];
  }>;
  environments: Record<string, {
    include_all?: boolean;
    include_categories?: string[];
    include_tools?: string[];
  }>;
}

class PoCGenerator {
  private config: Config;
  private toolsDir: string;
  private outputDir: string;
  
  constructor(
    configPath: string = 'poc/config/tools.yaml',
    toolsDir: string = 'poc/definitions/tools',
    outputDir: string = 'poc/generated'
  ) {
    this.config = this.loadConfig(configPath);
    this.toolsDir = toolsDir;
    this.outputDir = outputDir;
  }
  
  private loadConfig(path: string): Config {
    const content = readFileSync(path, 'utf8');
    return parse(content);
  }
  
  generateForEnvironment(environment: string): void {
    console.log(`\n🚀 Generating PoC for environment: ${environment}`);
    
    const envConfig = this.config.environments[environment];
    if (!envConfig) {
      throw new Error(`Environment '${environment}' not found`);
    }
    
    // Discover available tools
    const availableTools = this.discoverTools();
    console.log(`📁 Discovered ${Object.keys(availableTools).length} tools`);
    
    // Determine which tools to include
    const includedTools = this.getToolsForEnvironment(environment, availableTools);
    console.log(`✅ Including ${includedTools.length} tools: ${includedTools.join(', ')}`);
    
    // Load tool definitions
    const definitions = this.loadToolDefinitions(includedTools, availableTools);
    
    // Generate outputs
    this.generateTypeScriptIndex(definitions, environment);
    this.generateJavaScriptIndex(definitions, environment);
    this.generateMetadata(definitions, environment);
    
    console.log(`📦 Generated files in ${this.outputDir}/`);
    
    // Show bundle size comparison
    this.showBundleSizeComparison(definitions);
  }
  
  private discoverTools(): Record<string, string> {
    const tools: Record<string, string> = {};
    
    const categories = readdirSync(this.toolsDir);
    
    for (const category of categories) {
      const categoryPath = join(this.toolsDir, category);
      
      if (statSync(categoryPath).isDirectory()) {
        const files = readdirSync(categoryPath);
        
        for (const file of files) {
          if (extname(file) === '.json') {
            const action = file.replace('.json', '');
            const toolName = `${category}-${action}`;
            tools[toolName] = join(category, action);
          }
        }
      }
    }
    
    return tools;
  }
  
  private getToolsForEnvironment(
    environment: string,
    availableTools: Record<string, string>
  ): string[] {
    const envConfig = this.config.environments[environment];
    let tools: string[] = [];
    
    if (envConfig.include_all) {
      tools = Object.keys(availableTools);
    } else {
      // Include by categories
      if (envConfig.include_categories) {
        for (const category of envConfig.include_categories) {
          const categoryConfig = this.config.categories[category];
          if (categoryConfig) {
            for (const action of categoryConfig.tools) {
              const toolName = `${category.replace('-management', '')}-${action}`;
              if (availableTools[toolName]) {
                tools.push(toolName);
              }
            }
          }
        }
      }
      
      // Include specific tools
      if (envConfig.include_tools) {
        tools.push(...envConfig.include_tools);
      }
    }
    
    // Remove duplicates and filter by available tools
    return [...new Set(tools)].filter(tool => availableTools[tool]);
  }
  
  private loadToolDefinitions(
    toolNames: string[],
    availableTools: Record<string, string>
  ): Record<string, ToolDefinition> {
    const definitions: Record<string, ToolDefinition> = {};
    
    for (const toolName of toolNames) {
      const toolPath = availableTools[toolName];
      if (toolPath) {
        const filePath = join(this.toolsDir, `${toolPath}.json`);
        const content = readFileSync(filePath, 'utf8');
        definitions[toolName] = JSON.parse(content);
      }
    }
    
    return definitions;
  }
  
  private generateTypeScriptIndex(
    definitions: Record<string, ToolDefinition>,
    environment: string
  ): void {
    const imports: string[] = [];
    const exports: string[] = [];
    
    for (const [toolName, _] of Object.entries(definitions)) {
      const [category, action] = toolName.split('-');
      const importName = this.toCamelCase(toolName);
      imports.push(`import ${importName} from '../definitions/tools/${category}/${action}.json';`);
      exports.push(`  '${toolName}': ${importName}`);
    }
    
    const content = `// Auto-generated tool definitions for ${environment}
// Generated at: ${new Date().toISOString()}
// Tools included: ${Object.keys(definitions).length}

${imports.join('\n')}

export const toolDefinitions = {
${exports.join(',\n')}
};

export const toolNames = Object.keys(toolDefinitions);
export const toolCount = toolNames.length;
export const environment = '${environment}';

// Type definitions
export interface ToolDefinition {
  title: string;
  description: string;
  category: string;
  tags: string[];
  inputSchema: any;
  readOnlyHint?: boolean;
  idempotentHint?: boolean;
  destructiveHint?: boolean;
}

export type ToolName = ${Object.keys(definitions).map(name => `'${name}'`).join(' | ')};
`;
    
    writeFileSync(join(this.outputDir, `${environment}.ts`), content);
  }
  
  private generateJavaScriptIndex(
    definitions: Record<string, ToolDefinition>,
    environment: string
  ): void {
    const content = `// Auto-generated tool definitions for ${environment}
// Generated at: ${new Date().toISOString()}
// Tools included: ${Object.keys(definitions).length}

const toolDefinitions = ${JSON.stringify(definitions, null, 2)};

const toolNames = Object.keys(toolDefinitions);
const toolCount = toolNames.length;
const environment = '${environment}';

module.exports = {
  toolDefinitions,
  toolNames,
  toolCount,
  environment
};
`;
    
    writeFileSync(join(this.outputDir, `${environment}.js`), content);
  }
  
  private generateMetadata(
    definitions: Record<string, ToolDefinition>,
    environment: string
  ): void {
    const categories = this.groupByCategory(Object.keys(definitions));
    const tags = this.extractAllTags(definitions);
    
    const metadata = {
      generatedAt: new Date().toISOString(),
      environment,
      toolCount: Object.keys(definitions).length,
      bundleSize: JSON.stringify(definitions).length,
      categories,
      tags,
      tools: Object.keys(definitions).sort()
    };
    
    writeFileSync(
      join(this.outputDir, `${environment}-metadata.json`),
      JSON.stringify(metadata, null, 2)
    );
  }
  
  private groupByCategory(toolNames: string[]): Record<string, string[]> {
    const categories: Record<string, string[]> = {};
    
    for (const toolName of toolNames) {
      const [category] = toolName.split('-');
      const categoryKey = `${category}-management`;
      
      if (!categories[categoryKey]) {
        categories[categoryKey] = [];
      }
      categories[categoryKey].push(toolName);
    }
    
    return categories;
  }
  
  private extractAllTags(definitions: Record<string, ToolDefinition>): string[] {
    const tags = new Set<string>();
    
    for (const definition of Object.values(definitions)) {
      if (definition.tags) {
        definition.tags.forEach(tag => tags.add(tag));
      }
    }
    
    return Array.from(tags).sort();
  }
  
  private showBundleSizeComparison(definitions: Record<string, ToolDefinition>): void {
    const currentSize = JSON.stringify(definitions).length;
    const estimatedOriginalSize = 59200; // From analysis
    const reduction = ((estimatedOriginalSize - currentSize) / estimatedOriginalSize * 100).toFixed(1);
    
    console.log(`\n📊 Bundle Size Analysis:`);
    console.log(`  Current bundle: ${currentSize} bytes`);
    console.log(`  Original size: ${estimatedOriginalSize} bytes (estimated)`);
    console.log(`  Reduction: ${reduction}% smaller`);
  }
  
  private toCamelCase(str: string): string {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }
}

// CLI execution
if (require.main === module) {
  const generator = new PoCGenerator();
  
  const environment = process.argv[2] || 'development';
  
  try {
    generator.generateForEnvironment(environment);
  } catch (error) {
    console.error('❌ Generation failed:', error.message);
    process.exit(1);
  }
}

export { PoCGenerator };
```

### Phase 3: Validation and Testing (Week 3)

#### 3.1 Validation Script
```typescript
// scripts/validate-definitions.ts
import Ajv from 'ajv';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const toolSchema = JSON.parse(
  readFileSync('shared/schemas/tool-definition.schema.json', 'utf8')
);

class DefinitionValidator {
  private ajv: Ajv;
  private validateTool: any;
  
  constructor() {
    this.ajv = new Ajv();
    this.validateTool = this.ajv.compile(toolSchema);
  }
  
  validateAllDefinitions(definitionsDir: string): boolean {
    console.log(`🔍 Validating definitions in ${definitionsDir}`);
    
    let totalFiles = 0;
    let validFiles = 0;
    let errors: string[] = [];
    
    const categories = readdirSync(definitionsDir);
    
    for (const category of categories) {
      const categoryPath = join(definitionsDir, category);
      
      if (statSync(categoryPath).isDirectory()) {
        const files = readdirSync(categoryPath);
        
        for (const file of files) {
          if (extname(file) === '.json') {
            totalFiles++;
            const filePath = join(categoryPath, file);
            const toolName = `${category}-${file.replace('.json', '')}`;
            
            try {
              const definition = JSON.parse(readFileSync(filePath, 'utf8'));
              
              if (this.validateTool(definition)) {
                validFiles++;
                console.log(`✅ ${toolName}`);
              } else {
                const errorMsg = this.formatValidationErrors(toolName, this.validateTool.errors);
                errors.push(errorMsg);
                console.log(`❌ ${toolName}: ${errorMsg}`);
              }
            } catch (error) {
              const errorMsg = `JSON parse error: ${error.message}`;
              errors.push(`${toolName}: ${errorMsg}`);
              console.log(`❌ ${toolName}: ${errorMsg}`);
            }
          }
        }
      }
    }
    
    console.log(`\n📊 Validation Summary:`);
    console.log(`  Total files: ${totalFiles}`);
    console.log(`  Valid files: ${validFiles}`);
    console.log(`  Invalid files: ${totalFiles - validFiles}`);
    
    if (errors.length > 0) {
      console.log(`\n❌ Validation Errors:`);
      errors.forEach(error => console.log(`  ${error}`));
    }
    
    return errors.length === 0;
  }
  
  private formatValidationErrors(toolName: string, errors: any[]): string {
    if (!errors || errors.length === 0) {
      return 'Unknown validation error';
    }
    
    return errors.map(err => 
      `${err.instancePath || 'root'}: ${err.message}`
    ).join(', ');
  }
}

// CLI execution
if (require.main === module) {
  const validator = new DefinitionValidator();
  const definitionsDir = process.argv[2] || 'poc/definitions/tools';
  
  const isValid = validator.validateAllDefinitions(definitionsDir);
  process.exit(isValid ? 0 : 1);
}
```

#### 3.2 Comparison Test
```typescript
// scripts/compare-outputs.ts
import { toolDefinitions as originalDefinitions } from '../shared/core/tool-definitions.js';
import { PoCGenerator } from '../poc/generate-poc.js';

class OutputComparator {
  compareWithOriginal(): void {
    console.log('🔄 Comparing modular output with original definitions...');
    
    // Generate modular definitions
    const generator = new PoCGenerator();
    generator.generateForEnvironment('development');
    
    // Load generated definitions
    const generatedPath = 'poc/generated/development.js';
    const generated = require(`../${generatedPath}`);
    
    // Compare tool counts
    const originalCount = Object.keys(originalDefinitions).length;
    const generatedCount = generated.toolCount;
    
    console.log(`\n📊 Tool Count Comparison:`);
    console.log(`  Original: ${originalCount} tools`);
    console.log(`  Generated: ${generatedCount} tools`);
    
    // Compare specific tools (for PoC subset)
    const pocTools = ['assistant-create', 'assistant-list', 'thread-create'];
    
    for (const toolName of pocTools) {
      if (originalDefinitions[toolName] && generated.toolDefinitions[toolName]) {
        this.compareToolDefinition(
          toolName,
          originalDefinitions[toolName],
          generated.toolDefinitions[toolName]
        );
      }
    }
  }
  
  private compareToolDefinition(name: string, original: any, generated: any): void {
    console.log(`\n🔍 Comparing ${name}:`);
    
    // Compare titles
    if (original.title === generated.title) {
      console.log(`  ✅ Title matches`);
    } else {
      console.log(`  ❌ Title differs:`);
      console.log(`    Original: ${original.title}`);
      console.log(`    Generated: ${generated.title}`);
    }
    
    // Compare required fields
    const originalRequired = original.inputSchema?.required || [];
    const generatedRequired = generated.inputSchema?.required || [];
    
    if (JSON.stringify(originalRequired.sort()) === JSON.stringify(generatedRequired.sort())) {
      console.log(`  ✅ Required fields match`);
    } else {
      console.log(`  ❌ Required fields differ:`);
      console.log(`    Original: ${originalRequired.join(', ')}`);
      console.log(`    Generated: ${generate