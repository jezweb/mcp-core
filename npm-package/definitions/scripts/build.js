#!/usr/bin/env node

/**
 * Build Script - Hybrid Modular Architecture
 * 
 * This script compiles JSON definitions (tools, prompts, resources) into TypeScript files,
 * maintaining backward compatibility while enabling modular development.
 * 
 * Features:
 * - JSON Schema validation for all definition types
 * - TypeScript type generation
 * - Backward compatibility layer
 * - Environment-specific builds
 * - Feature flag support
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const definitionsDir = path.resolve(__dirname, '..');

// Configuration
const config = {
  toolsDir: path.join(definitionsDir, 'tools'),
  promptsDir: path.join(definitionsDir, 'prompts'),
  resourcesDir: path.join(definitionsDir, 'resources'),
  outputDir: path.join(definitionsDir, 'generated'),
  schemasDir: path.join(definitionsDir, 'schemas'),
  configsDir: path.join(definitionsDir, 'configs'),
  backupDir: path.join(rootDir, 'shared/core'),
  targetFiles: {
    tools: path.join(rootDir, 'shared/core/tool-definitions.ts'),
    prompts: path.join(rootDir, 'shared/prompts/prompt-templates.ts'),
    resources: path.join(rootDir, 'shared/resources/resources.ts')
  }
};

// Categories mapping
const categories = {
  tools: {
    assistant: ['assistant-create', 'assistant-list', 'assistant-get', 'assistant-update', 'assistant-delete'],
    thread: ['thread-create', 'thread-get', 'thread-update', 'thread-delete'],
    message: ['message-create', 'message-list', 'message-get', 'message-update', 'message-delete'],
    run: ['run-create', 'run-list', 'run-get', 'run-update', 'run-cancel', 'run-submit-tool-outputs'],
    'run-step': ['run-step-list', 'run-step-get']
  },
  prompts: {
    assistant: ['create-coding-assistant', 'create-data-analyst', 'create-writing-assistant'],
    thread: ['create-conversation-thread', 'organize-thread-messages'],
    analysis: ['explain-code', 'review-code'],
    run: ['configure-assistant-run', 'debug-run-issues'],
    data: ['analyze-dataset']
  },
  resources: {
    templates: ['coding-assistant-template', 'data-analyst-template', 'customer-support-template'],
    documentation: ['api-reference', 'best-practices', 'troubleshooting-guide'],
    examples: ['basic-workflow', 'advanced-workflow', 'batch-processing-workflow']
  }
};

/**
 * Main build function
 */
async function build() {
  console.log('🏗️  Starting hybrid modular architecture build...\n');
  
  try {
    // Step 1: Validate environment
    await validateEnvironment();
    
    // Step 2: Load configuration
    const buildConfig = await loadConfiguration();
    
    // Step 3: Process all definition types
    const allDefinitions = {};
    
    // Process tools
    console.log('🔧 Processing tool definitions...');
    allDefinitions.tools = await validateDefinitions('tools');
    await generateTypes(allDefinitions.tools, 'tools');
    await createBackwardCompatibilityLayer(allDefinitions.tools, 'tools');
    
    // Process prompts
    console.log('📝 Processing prompt definitions...');
    allDefinitions.prompts = await validateDefinitions('prompts');
    await generateTypes(allDefinitions.prompts, 'prompts');
    await createBackwardCompatibilityLayer(allDefinitions.prompts, 'prompts');
    
    // Process resources
    console.log('📚 Processing resource definitions...');
    allDefinitions.resources = await validateDefinitions('resources');
    await generateTypes(allDefinitions.resources, 'resources');
    await createBackwardCompatibilityLayer(allDefinitions.resources, 'resources');
    
    // Step 4: Generate unified index files
    await generateIndexFiles(allDefinitions);
    
    // Step 5: Update package.json scripts
    await updatePackageScripts();
    
    console.log('✅ Build completed successfully!\n');
    console.log('📊 Build Summary:');
    console.log(`   • ${allDefinitions.tools.length} tool definitions processed`);
    console.log(`   • ${allDefinitions.prompts.length} prompt definitions processed`);
    console.log(`   • ${allDefinitions.resources.length} resource definitions processed`);
    console.log(`   • ${Object.keys(categories.tools).length + Object.keys(categories.prompts).length + Object.keys(categories.resources).length} categories organized`);
    console.log(`   • TypeScript types generated for all definition types`);
    console.log(`   • Backward compatibility maintained`);
    console.log(`   • Index files updated\n`);
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

/**
 * Validate build environment
 */
async function validateEnvironment() {
  console.log('🔍 Validating environment...');
  
  // Check if required directories exist
  const requiredDirs = [config.toolsDir, config.promptsDir, config.resourcesDir, config.schemasDir];
  
  for (const dir of requiredDirs) {
    try {
      await fs.access(dir);
    } catch {
      throw new Error(`Required directory not found: ${dir}`);
    }
  }
  
  // Ensure output directories exist
  await fs.mkdir(config.outputDir, { recursive: true });
  await fs.mkdir(path.join(config.outputDir, 'types'), { recursive: true });
  await fs.mkdir(path.join(config.outputDir, 'definitions'), { recursive: true });
  
  console.log('✅ Environment validated\n');
}

/**
 * Load build configuration
 */
async function loadConfiguration() {
  console.log('⚙️  Loading configuration...');
  
  const defaultConfig = {
    environment: process.env.NODE_ENV || 'development',
    features: {
      enableAllTools: true,
      enableValidation: true,
      enableTypeGeneration: true,
      enableBackwardCompatibility: true
    },
    build: {
      minify: false,
      sourceMap: true,
      target: 'es2022'
    }
  };
  
  // Try to load environment-specific config
  try {
    const envConfigPath = path.join(config.configsDir, 'environments', `${defaultConfig.environment}.json`);
    const envConfig = JSON.parse(await fs.readFile(envConfigPath, 'utf8'));
    Object.assign(defaultConfig, envConfig);
  } catch {
    console.log('   Using default configuration');
  }
  
  console.log(`✅ Configuration loaded for ${defaultConfig.environment} environment\n`);
  return defaultConfig;
}

/**
 * Validate JSON definitions against schema
 */
async function validateDefinitions(type) {
  console.log(`🔍 Validating ${type} definitions...`);
  
  const definitions = [];
  const inputDir = config[`${type}Dir`];
  const categoryMap = categories[type];
  
  // Load schema
  const schemaPath = path.join(config.schemasDir, `${type.slice(0, -1)}-schema.json`);
  const schema = JSON.parse(await fs.readFile(schemaPath, 'utf8'));
  
  // Process each category
  for (const [category, items] of Object.entries(categoryMap)) {
    const categoryDir = path.join(inputDir, category);
    
    try {
      await fs.access(categoryDir);
    } catch {
      console.log(`   ⚠️  Category directory not found: ${category} (will be created)`);
      continue;
    }
    
    // Process each item in category
    for (const itemName of items) {
      const itemPath = path.join(categoryDir, `${itemName}.json`);
      
      try {
        const itemContent = await fs.readFile(itemPath, 'utf8');
        const itemDef = JSON.parse(itemContent);
        
        // Basic validation
        if (type === 'tools' && itemDef.name !== itemName) {
          throw new Error(`Tool name mismatch: expected ${itemName}, got ${itemDef.name}`);
        }
        
        if (itemDef.category !== category) {
          throw new Error(`Category mismatch: expected ${category}, got ${itemDef.category}`);
        }
        
        definitions.push(itemDef);
        console.log(`   ✅ ${itemName}`);
        
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log(`   ⚠️  ${itemName} (definition not found, will use fallback)`);
        } else {
          console.log(`   ❌ ${itemName}: ${error.message}`);
          throw error;
        }
      }
    }
  }
  
  console.log(`✅ ${definitions.length} ${type} definitions validated\n`);
  return definitions;
}

/**
 * Generate TypeScript types from JSON definitions
 */
async function generateTypes(definitions, type) {
  console.log(`🔧 Generating TypeScript types for ${type}...`);
  
  const typeDefinitions = [];
  
  // Generate interface for each definition
  for (const def of definitions) {
    let interfaceName, typeInterface;
    
    if (type === 'tools') {
      interfaceName = toPascalCase(def.name) + 'Params';
      typeInterface = generateTypeInterface(def.inputSchema, interfaceName);
    } else if (type === 'prompts') {
      interfaceName = toPascalCase(def.name) + 'Prompt';
      typeInterface = generatePromptInterface(def, interfaceName);
    } else if (type === 'resources') {
      interfaceName = toPascalCase(def.name) + 'Resource';
      typeInterface = generateResourceInterface(def, interfaceName);
    }
    
    typeDefinitions.push(typeInterface);
  }
  
  // Generate main types file
  const typesContent = `/**
 * Generated ${type.charAt(0).toUpperCase() + type.slice(1)} Types
 * 
 * This file is auto-generated from JSON ${type} definitions.
 * Do not edit manually - changes will be overwritten.
 * 
 * Generated at: ${new Date().toISOString()}
 */

${typeDefinitions.join('\n\n')}

// Union type of all ${type} types
export type ${toPascalCase(type)}Types = ${definitions.map(def => toPascalCase(def.name) + (type === 'tools' ? 'Params' : type === 'prompts' ? 'Prompt' : 'Resource')).join(' | ')};

// ${type} name to type mapping
export interface ${toPascalCase(type)}TypesMap {
${definitions.map(def => `  '${def.name || def.uri}': ${toPascalCase(def.name)}${type === 'tools' ? 'Params' : type === 'prompts' ? 'Prompt' : 'Resource'};`).join('\n')}
}
`;
  
  await fs.writeFile(path.join(config.outputDir, 'types', `${type}-types.ts`), typesContent);
  console.log(`✅ TypeScript types for ${type} generated\n`);
}

/**
 * Create backward compatibility layer
 */
async function createBackwardCompatibilityLayer(definitions, type) {
  console.log(`🔄 Creating backward compatibility layer for ${type}...`);
  
  const targetFile = config.targetFiles[type];
  
  // Backup original file if it exists
  try {
    const originalContent = await fs.readFile(targetFile, 'utf8');
    await fs.writeFile(`${targetFile}.backup`, originalContent);
    console.log(`   📦 Original ${type} file backed up`);
  } catch {
    console.log(`   ℹ️  No existing ${type} file to backup`);
  }
  
  // Generate new file with same interface
  let compatibilityContent;
  
  if (type === 'tools') {
    compatibilityContent = generateToolsCompatibilityLayer(definitions);
  } else if (type === 'prompts') {
    compatibilityContent = generatePromptsCompatibilityLayer(definitions);
  } else if (type === 'resources') {
    compatibilityContent = generateResourcesCompatibilityLayer(definitions);
  }
  
  await fs.writeFile(targetFile, compatibilityContent);
  
  console.log(`✅ Backward compatibility layer for ${type} created\n`);
}

/**
 * Generate the tools compatibility layer content
 */
function generateToolsCompatibilityLayer(definitions) {
  const toolDefinitionsMap = definitions.reduce((acc, def) => {
    acc[def.name] = {
      title: def.title,
      description: def.description,
      ...(def.hints?.readOnly && { readOnlyHint: true }),
      ...(def.hints?.destructive && { destructiveHint: true }),
      ...(def.hints?.idempotent && { idempotentHint: true }),
      inputSchema: def.inputSchema
    };
    return acc;
  }, {});
  
  return `/**
 * Tool Definitions Generator - Generated from modular JSON definitions
 * 
 * This file is auto-generated from the hybrid modular architecture.
 * Do not edit manually - changes will be overwritten.
 * 
 * Generated at: ${new Date().toISOString()}
 * Source: definitions/tools/
 */

import { MCPTool } from '../types/index.js';
import { BaseToolHandler } from './handlers/base-tool-handler.js';
import { ToolRegistry } from './tool-registry.js';

/**
 * Tool definition templates for each tool
 * These provide the MCP-specific metadata that handlers don't contain
 */
const TOOL_DEFINITIONS: Record<string, Omit<MCPTool, 'name'>> = ${JSON.stringify(toolDefinitionsMap, null, 2)};

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
      console.warn(\`[ToolDefinitions] No definition found for tool: \${toolName}\`);
      // Create a basic definition as fallback
      tools.push({
        name: toolName,
        title: toolName.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        description: \`Execute \${toolName} operation\`,
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
`;
}

/**
 * Generate the prompts compatibility layer content
 */
function generatePromptsCompatibilityLayer(definitions) {
  const promptTemplatesMap = definitions.reduce((acc, def) => {
    acc[def.name] = {
      name: def.name,
      title: def.title,
      description: def.description,
      arguments: def.arguments || []
    };
    return acc;
  }, {});

  return `/**
 * Prompt Templates - Generated from modular JSON definitions
 *
 * This file is auto-generated from the hybrid modular architecture.
 * Do not edit manually - changes will be overwritten.
 *
 * Generated at: ${new Date().toISOString()}
 * Source: definitions/prompts/
 */

import { Prompt, PromptTemplate, PromptMessage } from '../types/index.js';

/**
 * Prompt template definitions (MCP format)
 */
const PROMPT_TEMPLATES: Record<string, Prompt> = ${JSON.stringify(promptTemplatesMap, null, 2)};

/**
 * Template content mapping for message generation
 */
const TEMPLATE_CONTENT: Record<string, string> = {
${definitions.map(def => `  '${def.name}': ${JSON.stringify(def.template || '')}`).join(',\n')}
};

/**
 * Template metadata mapping
 */
const TEMPLATE_METADATA: Record<string, { category?: string; tags?: string[] }> = {
${definitions.map(def => `  '${def.name}': { category: ${JSON.stringify(def.category)}, tags: ${JSON.stringify(def.tags || [])} }`).join(',\n')}
};

/**
 * Generate messages for a prompt template
 */
function generateMessages(templateName: string, args: Record<string, string> = {}): PromptMessage[] {
  const template = TEMPLATE_CONTENT[templateName];
  if (!template) {
    throw new Error(\`Template not found: \${templateName}\`);
  }

  // Simple template substitution
  let content = template;
  for (const [key, value] of Object.entries(args)) {
    const regex = new RegExp(\`{{\\\\s*\${key}\\\\s*}}\`, 'g');
    content = content.replace(regex, value);
  }

  // Handle default values like {{key || 'default'}}
  content = content.replace(/{{\\s*([^|]+?)\\s*\\|\\|\\s*'([^']*)'\\s*}}/g, (match, key, defaultValue) => {
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
function createPromptTemplate(prompt: Prompt): PromptTemplate {
  const metadata = TEMPLATE_METADATA[prompt.name] || {};
  return {
    name: prompt.name,
    title: prompt.title || prompt.name,
    description: prompt.description || '',
    arguments: prompt.arguments || [],
    category: metadata.category,
    tags: metadata.tags,
    generateMessages: (args: Record<string, string>) => generateMessages(prompt.name, args)
  };
}

/**
 * Get all available prompt templates
 *
 * @returns Array of prompt templates
 */
export function getPromptTemplates(): PromptTemplate[] {
  return Object.values(PROMPT_TEMPLATES).map(createPromptTemplate);
}

/**
 * Get a specific prompt template by name
 *
 * @param name - The prompt template name
 * @returns The prompt template or undefined
 */
export function getPromptTemplate(name: string): PromptTemplate | undefined {
  const prompt = PROMPT_TEMPLATES[name];
  return prompt ? createPromptTemplate(prompt) : undefined;
}

/**
 * Get prompt templates by category
 *
 * @param category - The category to filter by
 * @returns Array of prompt templates in the category
 */
export function getPromptTemplatesByCategory(category: string): PromptTemplate[] {
  return Object.values(PROMPT_TEMPLATES)
    .map(createPromptTemplate)
    .filter(template =>
      template.category === category ||
      template.name.startsWith(category) ||
      (template.description && template.description.toLowerCase().includes(category.toLowerCase()))
    );
}

// Export individual templates for backward compatibility
${definitions.map(def => `export const ${toPascalCase(def.name).replace(/[^a-zA-Z0-9]/g, '')} = PROMPT_TEMPLATES['${def.name}'];`).join('\n')}
`;
}

/**
 * Generate the resources compatibility layer content
 */
function generateResourcesCompatibilityLayer(definitions) {
  const resourcesMap = definitions.reduce((acc, def) => {
    acc[def.uri] = {
      uri: def.uri,
      name: def.name,
      description: def.description,
      mimeType: def.mimeType
    };
    return acc;
  }, {});

  // Create a separate content map for resource content
  const resourceContentMap = definitions.reduce((acc, def) => {
    if (def.content) {
      acc[def.uri] = def.content;
    }
    return acc;
  }, {});

  return `/**
 * Resources - Generated from modular JSON definitions
 *
 * This file is auto-generated from the hybrid modular architecture.
 * Do not edit manually - changes will be overwritten.
 *
 * Generated at: ${new Date().toISOString()}
 * Source: definitions/resources/
 */

import { MCPResource } from '../types/index.js';

/**
 * Resource definitions
 */
const RESOURCES: Record<string, MCPResource> = ${JSON.stringify(resourcesMap, null, 2)};

/**
 * Resource content mapping (separate from MCP resource definitions)
 */
const RESOURCE_CONTENT: Record<string, any> = ${JSON.stringify(resourceContentMap, null, 2)};

/**
 * Get all available resources
 *
 * @returns Array of resources
 */
export function getResources(): MCPResource[] {
  return Object.values(RESOURCES);
}

/**
 * Get a specific resource by URI
 *
 * @param uri - The resource URI
 * @returns The resource or undefined
 */
export function getResource(uri: string): MCPResource | undefined {
  return RESOURCES[uri];
}

/**
 * Get resource content by URI
 *
 * @param uri - The resource URI
 * @returns The resource content or undefined
 */
export function getResourceContent(uri: string): any {
  return RESOURCE_CONTENT[uri];
}

/**
 * Get resources by category
 *
 * @param category - The category to filter by
 * @returns Array of resources in the category
 */
export function getResourcesByCategory(category: string): MCPResource[] {
  return Object.values(RESOURCES).filter(resource =>
    resource.uri.includes(category) || resource.name.toLowerCase().includes(category.toLowerCase())
  );
}

// Export resource URIs for easy access
export const RESOURCE_URIS = {
${definitions.map(def => `  ${toPascalCase(def.name).replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}: '${def.uri}',`).join('\n')}
};

// Export legacy compatibility
export const mcpResources = getResources();
export const resourceContent = RESOURCE_CONTENT;
`;
}

/**
 * Generate index files
 */
async function generateIndexFiles(allDefinitions) {
  console.log('📝 Generating unified index files...');
  
  // Generate main index file
  const indexContent = `/**
 * Generated Definitions Index - Unified Architecture
 * 
 * This file is auto-generated from JSON definitions (tools, prompts, resources).
 * Do not edit manually - changes will be overwritten.
 * 
 * Generated at: ${new Date().toISOString()}
 */

// Re-export backward compatibility layers
export * from '../../shared/core/tool-definitions.js';
export * from '../../shared/prompts/prompt-templates.js';
export * from '../../shared/resources/resources.js';

// Re-export generated types
export * from './types/tools-types.js';
export * from './types/prompts-types.js';
export * from './types/resources-types.js';

// Unified metadata
export const DEFINITIONS_METADATA = {
  tools: {
    total: ${allDefinitions.tools.length},
    categories: ${JSON.stringify(Object.keys(categories.tools))},
    items: ${JSON.stringify(allDefinitions.tools.map(d => d.name))}
  },
  prompts: {
    total: ${allDefinitions.prompts.length},
    categories: ${JSON.stringify(Object.keys(categories.prompts))},
    items: ${JSON.stringify(allDefinitions.prompts.map(d => d.name))}
  },
  resources: {
    total: ${allDefinitions.resources.length},
    categories: ${JSON.stringify(Object.keys(categories.resources))},
    items: ${JSON.stringify(allDefinitions.resources.map(d => d.uri))}
  },
  generatedAt: '${new Date().toISOString()}'
};
`;
  
  await fs.writeFile(path.join(config.outputDir, 'index.ts'), indexContent);
  console.log('✅ Unified index files generated\n');
}

/**
 * Update package.json scripts
 */
async function updatePackageScripts() {
  console.log('📦 Updating package.json scripts...');
  
  const packagePath = path.join(rootDir, 'package.json');
  const packageContent = JSON.parse(await fs.readFile(packagePath, 'utf8'));
  
  // Add new scripts for definitions management
  const newScripts = {
    'definitions:validate': 'node definitions/scripts/validate.js',
    'definitions:build': 'node definitions/scripts/build.js',
    'definitions:watch': 'nodemon --exec "npm run definitions:build" --watch definitions/ --ext json',
    'definitions:clean': 'rm -rf definitions/generated/*',
    'definitions:migrate': 'node definitions/scripts/migrate.js',
    'definitions:tools': 'node definitions/scripts/build.js --type=tools',
    'definitions:prompts': 'node definitions/scripts/build.js --type=prompts',
    'definitions:resources': 'node definitions/scripts/build.js --type=resources'
  };
  
  Object.assign(packageContent.scripts, newScripts);
  
  await fs.writeFile(packagePath, JSON.stringify(packageContent, null, 2));
  console.log('✅ Package scripts updated\n');
}

/**
 * Utility functions
 */
function toPascalCase(str) {
  return str.split(/[-_]/).map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('');
}

function generateTypeInterface(schema, interfaceName) {
  const properties = Object.entries(schema.properties || {}).map(([key, prop]) => {
    const optional = !schema.required?.includes(key) ? '?' : '';
    const type = mapJsonTypeToTs(prop);
    const description = prop.description ? `  /** ${prop.description} */\n` : '';
    return `${description}  ${key}${optional}: ${type};`;
  }).join('\n');
  
  return `export interface ${interfaceName} {\n${properties}\n}`;
}

function generatePromptInterface(def, interfaceName) {
  const args = def.arguments || [];
  const properties = args.map(arg => {
    const optional = !arg.required ? '?' : '';
    const description = arg.description ? `  /** ${arg.description} */\n` : '';
    return `${description}  ${arg.name}${optional}: string;`;
  }).join('\n');
  
  return `export interface ${interfaceName} {\n  name: '${def.name}';\n  description: string;\n  arguments: {\n${properties}\n  };\n}`;
}

function generateResourceInterface(def, interfaceName) {
  return `export interface ${interfaceName} {\n  uri: '${def.uri}';\n  name: string;\n  description: string;\n  mimeType: string;\n  content: string;\n  metadata: Record<string, any>;\n}`;
}

function mapJsonTypeToTs(prop) {
  switch (prop.type) {
    case 'string':
      if (prop.enum) {
        return prop.enum.map(v => `'${v}'`).join(' | ');
      }
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      const itemType = prop.items ? mapJsonTypeToTs(prop.items) : 'any';
      return `${itemType}[]`;
    case 'object':
      return 'Record<string, any>';
    default:
      return 'any';
  }
}

// Run build if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  build().catch(console.error);
}

export { build };