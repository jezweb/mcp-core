#!/usr/bin/env node

/**
 * Validation Script - Hybrid Modular Architecture
 * 
 * This script validates JSON tool definitions against the schema
 * and performs additional consistency checks.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const definitionsDir = path.resolve(__dirname, '..');

// Configuration
const config = {
  toolsDir: path.join(definitionsDir, 'tools'),
  schemasDir: path.join(definitionsDir, 'schemas'),
  verbose: process.argv.includes('--verbose') || process.argv.includes('-v')
};

// Expected categories and tools
const expectedStructure = {
  assistant: ['assistant-create', 'assistant-list', 'assistant-get', 'assistant-update', 'assistant-delete'],
  thread: ['thread-create', 'thread-get', 'thread-update', 'thread-delete'],
  message: ['message-create', 'message-list', 'message-get', 'message-update', 'message-delete'],
  run: ['run-create', 'run-list', 'run-get', 'run-update', 'run-cancel', 'run-submit-tool-outputs'],
  'run-step': ['run-step-list', 'run-step-get']
};

/**
 * Main validation function
 */
async function validate() {
  console.log('🔍 Validating tool definitions...\n');
  
  let hasErrors = false;
  const results = {
    validated: 0,
    errors: 0,
    warnings: 0,
    missing: 0
  };
  
  try {
    // Load schema
    const schema = await loadSchema();
    
    // Validate each category
    for (const [category, tools] of Object.entries(expectedStructure)) {
      console.log(`📁 Category: ${category}`);
      
      const categoryDir = path.join(config.toolsDir, category);
      
      // Check if category directory exists
      try {
        await fs.access(categoryDir);
      } catch {
        console.log(`   ❌ Category directory missing: ${categoryDir}`);
        results.errors++;
        hasErrors = true;
        continue;
      }
      
      // Validate each tool in category
      for (const toolName of tools) {
        const toolPath = path.join(categoryDir, `${toolName}.json`);
        
        try {
          const result = await validateTool(toolPath, toolName, category, schema);
          
          if (result.valid) {
            console.log(`   ✅ ${toolName}`);
            results.validated++;
          } else {
            console.log(`   ❌ ${toolName}: ${result.error}`);
            results.errors++;
            hasErrors = true;
          }
          
          if (result.warnings?.length > 0) {
            result.warnings.forEach(warning => {
              console.log(`   ⚠️  ${toolName}: ${warning}`);
              results.warnings++;
            });
          }
          
        } catch (error) {
          if (error.code === 'ENOENT') {
            console.log(`   ⚠️  ${toolName}: Definition file missing`);
            results.missing++;
          } else {
            console.log(`   ❌ ${toolName}: ${error.message}`);
            results.errors++;
            hasErrors = true;
          }
        }
      }
      
      console.log('');
    }
    
    // Print summary
    printSummary(results);
    
    if (hasErrors) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

/**
 * Load and parse the JSON schema
 */
async function loadSchema() {
  const schemaPath = path.join(config.schemasDir, 'tool-schema.json');
  
  try {
    const schemaContent = await fs.readFile(schemaPath, 'utf8');
    return JSON.parse(schemaContent);
  } catch (error) {
    throw new Error(`Failed to load schema: ${error.message}`);
  }
}

/**
 * Validate a single tool definition
 */
async function validateTool(toolPath, expectedName, expectedCategory, schema) {
  const result = {
    valid: false,
    error: null,
    warnings: []
  };
  
  try {
    // Read and parse tool definition
    const toolContent = await fs.readFile(toolPath, 'utf8');
    let toolDef;
    
    try {
      toolDef = JSON.parse(toolContent);
    } catch (parseError) {
      result.error = `Invalid JSON: ${parseError.message}`;
      return result;
    }
    
    // Basic structure validation
    const basicValidation = validateBasicStructure(toolDef, expectedName, expectedCategory);
    if (!basicValidation.valid) {
      result.error = basicValidation.error;
      return result;
    }
    
    result.warnings.push(...basicValidation.warnings);
    
    // Schema validation (simplified - in a real implementation, use a JSON Schema validator)
    const schemaValidation = validateAgainstSchema(toolDef, schema);
    if (!schemaValidation.valid) {
      result.error = schemaValidation.error;
      return result;
    }
    
    result.warnings.push(...schemaValidation.warnings);
    
    // Content validation
    const contentValidation = validateContent(toolDef);
    result.warnings.push(...contentValidation.warnings);
    
    result.valid = true;
    return result;
    
  } catch (error) {
    result.error = error.message;
    return result;
  }
}

/**
 * Validate basic structure requirements
 */
function validateBasicStructure(toolDef, expectedName, expectedCategory) {
  const result = { valid: true, error: null, warnings: [] };
  
  // Check required fields
  const requiredFields = ['name', 'title', 'description', 'category', 'inputSchema'];
  for (const field of requiredFields) {
    if (!toolDef[field]) {
      result.valid = false;
      result.error = `Missing required field: ${field}`;
      return result;
    }
  }
  
  // Check name matches expected
  if (toolDef.name !== expectedName) {
    result.valid = false;
    result.error = `Name mismatch: expected '${expectedName}', got '${toolDef.name}'`;
    return result;
  }
  
  // Check category matches expected
  if (toolDef.category !== expectedCategory) {
    result.valid = false;
    result.error = `Category mismatch: expected '${expectedCategory}', got '${toolDef.category}'`;
    return result;
  }
  
  // Check name format
  if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(toolDef.name)) {
    result.warnings.push('Name should be in kebab-case format');
  }
  
  return result;
}

/**
 * Validate against JSON schema (simplified)
 */
function validateAgainstSchema(toolDef, schema) {
  const result = { valid: true, error: null, warnings: [] };
  
  // Check inputSchema structure
  if (!toolDef.inputSchema || typeof toolDef.inputSchema !== 'object') {
    result.valid = false;
    result.error = 'inputSchema must be an object';
    return result;
  }
  
  if (toolDef.inputSchema.type !== 'object') {
    result.valid = false;
    result.error = 'inputSchema.type must be "object"';
    return result;
  }
  
  if (!toolDef.inputSchema.properties || typeof toolDef.inputSchema.properties !== 'object') {
    result.valid = false;
    result.error = 'inputSchema.properties must be an object';
    return result;
  }
  
  // Validate properties
  for (const [propName, propDef] of Object.entries(toolDef.inputSchema.properties)) {
    if (!propDef.type) {
      result.warnings.push(`Property '${propName}' missing type`);
    }
    
    if (!propDef.description) {
      result.warnings.push(`Property '${propName}' missing description`);
    }
  }
  
  return result;
}

/**
 * Validate content quality
 */
function validateContent(toolDef) {
  const result = { warnings: [] };
  
  // Check description length
  if (toolDef.description.length < 50) {
    result.warnings.push('Description is quite short, consider adding more detail');
  }
  
  if (toolDef.description.length > 1000) {
    result.warnings.push('Description is very long, consider making it more concise');
  }
  
  // Check title length
  if (toolDef.title.length > 50) {
    result.warnings.push('Title is quite long, consider making it shorter');
  }
  
  // Check for required parameters without descriptions
  if (toolDef.inputSchema.required) {
    for (const requiredParam of toolDef.inputSchema.required) {
      const paramDef = toolDef.inputSchema.properties[requiredParam];
      if (!paramDef?.description || paramDef.description.length < 10) {
        result.warnings.push(`Required parameter '${requiredParam}' needs a better description`);
      }
    }
  }
  
  return result;
}

/**
 * Print validation summary
 */
function printSummary(results) {
  console.log('📊 Validation Summary:');
  console.log(`   ✅ Validated: ${results.validated}`);
  console.log(`   ❌ Errors: ${results.errors}`);
  console.log(`   ⚠️  Warnings: ${results.warnings}`);
  console.log(`   📝 Missing: ${results.missing}`);
  console.log('');
  
  if (results.errors === 0 && results.missing === 0) {
    console.log('🎉 All validations passed!');
  } else if (results.errors === 0) {
    console.log('✅ No errors found, but some definitions are missing.');
  } else {
    console.log('❌ Validation failed with errors.');
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validate().catch(console.error);
}

export { validate };