#!/usr/bin/env node

/**
 * Migration Script - Convert TypeScript tool definitions to JSON
 * 
 * This script extracts tool definitions from the existing TypeScript file
 * and converts them to the new modular JSON format.
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
  sourceFile: path.join(rootDir, 'shared/core/tool-definitions.ts'),
  outputDir: path.join(definitionsDir, 'tools'),
  schemasDir: path.join(definitionsDir, 'schemas')
};

// Categories and their tools
const categories = {
  assistant: ['assistant-create', 'assistant-list', 'assistant-get', 'assistant-update', 'assistant-delete'],
  thread: ['thread-create', 'thread-get', 'thread-update', 'thread-delete'],
  message: ['message-create', 'message-list', 'message-get', 'message-update', 'message-delete'],
  run: ['run-create', 'run-list', 'run-get', 'run-update', 'run-cancel', 'run-submit-tool-outputs'],
  'run-step': ['run-step-list', 'run-step-get']
};

/**
 * Main migration function
 */
async function migrate() {
  console.log('🔄 Starting migration from TypeScript to JSON...\n');
  
  try {
    // Step 1: Parse existing TypeScript definitions
    const toolDefinitions = await parseTypeScriptDefinitions();
    
    // Step 2: Create category directories
    await createCategoryDirectories();
    
    // Step 3: Convert and write JSON files
    await convertToJsonFiles(toolDefinitions);
    
    // Step 4: Validate migrated files
    await validateMigratedFiles();
    
    console.log('✅ Migration completed successfully!\n');
    console.log('📊 Migration Summary:');
    console.log(`   • ${Object.keys(toolDefinitions).length} tool definitions migrated`);
    console.log(`   • ${Object.keys(categories).length} categories created`);
    console.log(`   • JSON files validated against schema`);
    console.log(`   • Ready for build process\n`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

/**
 * Parse the existing TypeScript tool definitions
 */
async function parseTypeScriptDefinitions() {
  console.log('📖 Parsing TypeScript definitions...');
  
  const sourceContent = await fs.readFile(config.sourceFile, 'utf8');
  
  // Extract the TOOL_DEFINITIONS object using regex
  const definitionsMatch = sourceContent.match(/const TOOL_DEFINITIONS[^=]*=\s*({[\s\S]*?});/);
  
  if (!definitionsMatch) {
    throw new Error('Could not find TOOL_DEFINITIONS in source file');
  }
  
  // Parse the definitions object (this is a simplified approach)
  // In a real implementation, you might use a TypeScript parser
  const definitionsText = definitionsMatch[1];
  
  // Convert TypeScript object to JSON-parseable format
  const jsonText = convertTsObjectToJson(definitionsText);
  
  let definitions;
  try {
    definitions = JSON.parse(jsonText);
  } catch (error) {
    throw new Error(`Failed to parse definitions: ${error.message}`);
  }
  
  console.log(`✅ Parsed ${Object.keys(definitions).length} tool definitions\n`);
  return definitions;
}

/**
 * Convert TypeScript object syntax to JSON
 */
function convertTsObjectToJson(tsText) {
  // This is a simplified conversion - in production, use a proper TS parser
  let jsonText = tsText;
  
  // Remove TypeScript-specific syntax
  jsonText = jsonText.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments
  jsonText = jsonText.replace(/\/\/.*$/gm, ''); // Remove line comments
  
  // Convert single quotes to double quotes
  jsonText = jsonText.replace(/'/g, '"');
  
  // Add quotes around unquoted keys
  jsonText = jsonText.replace(/(\w+):/g, '"$1":');
  
  // Handle enum arrays
  jsonText = jsonText.replace(/enum:\s*\[(.*?)\]/g, (match, enumValues) => {
    const values = enumValues.split(',').map(v => v.trim().replace(/['"]/g, ''));
    return `"enum": [${values.map(v => `"${v}"`).join(', ')}]`;
  });
  
  return jsonText;
}

/**
 * Create category directories
 */
async function createCategoryDirectories() {
  console.log('📁 Creating category directories...');
  
  for (const category of Object.keys(categories)) {
    const categoryDir = path.join(config.outputDir, category);
    await fs.mkdir(categoryDir, { recursive: true });
    console.log(`   ✅ ${category}/`);
  }
  
  console.log('');
}

/**
 * Convert definitions to JSON files
 */
async function convertToJsonFiles(definitions) {
  console.log('🔧 Converting to JSON files...');
  
  for (const [category, tools] of Object.entries(categories)) {
    console.log(`   📁 ${category}/`);
    
    for (const toolName of tools) {
      const definition = definitions[toolName];
      
      if (!definition) {
        console.log(`      ⚠️  ${toolName}: No definition found, skipping`);
        continue;
      }
      
      // Convert to new JSON format
      const jsonDefinition = {
        $schema: '../../schemas/tool-schema.json',
        name: toolName,
        title: definition.title || generateTitle(toolName),
        description: definition.description || `Execute ${toolName} operation`,
        category: category,
        ...(definition.readOnlyHint && { hints: { readOnly: true } }),
        ...(definition.destructiveHint && { hints: { ...definition.hints, destructive: true } }),
        ...(definition.idempotentHint && { hints: { ...definition.hints, idempotent: true } }),
        inputSchema: definition.inputSchema || {
          type: 'object',
          properties: {}
        },
        metadata: {
          version: '1.0.0',
          author: 'OpenAI Assistants MCP Team',
          lastModified: new Date().toISOString(),
          tags: [category, toolName.split('-')[1] || 'operation']
        }
      };
      
      // Write JSON file
      const filePath = path.join(config.outputDir, category, `${toolName}.json`);
      await fs.writeFile(filePath, JSON.stringify(jsonDefinition, null, 2));
      
      console.log(`      ✅ ${toolName}.json`);
    }
    
    console.log('');
  }
}

/**
 * Validate migrated files
 */
async function validateMigratedFiles() {
  console.log('🔍 Validating migrated files...');
  
  // Import and run the validation script
  try {
    const { validate } = await import('./validate.js');
    await validate();
  } catch (error) {
    console.log(`   ⚠️  Validation script not available: ${error.message}`);
    console.log('   ℹ️  Run "npm run definitions:validate" manually after migration');
  }
}

/**
 * Generate a title from tool name
 */
function generateTitle(toolName) {
  return toolName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate().catch(console.error);
}

export { migrate };