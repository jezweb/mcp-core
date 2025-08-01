#!/usr/bin/env node

/**
 * Enhanced Validation Script - Phase 1 Improvements
 * 
 * This script extends the existing validation with:
 * - Duplicate name detection across all definition types
 * - Unused file detection
 * - Cross-reference consistency checks
 * - Enhanced reporting with metrics
 * - Automated fix suggestions
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const definitionsDir = path.resolve(__dirname, '..');
const rootDir = path.resolve(__dirname, '../..');

// Configuration
const config = {
  toolsDir: path.join(definitionsDir, 'tools'),
  promptsDir: path.join(definitionsDir, 'prompts'),
  resourcesDir: path.join(definitionsDir, 'resources'),
  schemasDir: path.join(definitionsDir, 'schemas'),
  generatedDir: path.join(definitionsDir, 'generated'),
  sharedDir: path.join(rootDir, 'shared'),
  verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
  fix: process.argv.includes('--fix'),
  report: process.argv.includes('--report')
};

// Expected structure for all definition types
const expectedStructure = {
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
    documentation: ['api-reference', 'best-practices', 'troubleshooting-guide', 'getting-started-guide', 'tool-usage-guide'],
    examples: ['batch-processing-workflow', 'code-review-workflow', 'data-analysis-workflow']
  }
};

/**
 * Main enhanced validation function
 */
async function enhancedValidate() {
  console.log('🔍 Enhanced Validation - Phase 1 Improvements');
  console.log('='.repeat(60));
  console.log('');
  
  const startTime = Date.now();
  let hasErrors = false;
  const results = {
    validated: 0,
    errors: 0,
    warnings: 0,
    missing: 0,
    duplicates: 0,
    unused: 0,
    inconsistencies: 0,
    suggestions: []
  };
  
  try {
    // Step 1: Load all schemas
    console.log('📋 Step 1: Loading schemas...');
    const schemas = await loadAllSchemas();
    console.log(`   ✅ Loaded ${Object.keys(schemas).length} schemas\n`);
    
    // Step 2: Validate all definition types
    console.log('📋 Step 2: Validating definitions...');
    const allDefinitions = {};
    
    for (const [type, structure] of Object.entries(expectedStructure)) {
      console.log(`📁 Validating ${type}...`);
      const typeResults = await validateDefinitionType(type, structure, schemas[type]);
      allDefinitions[type] = typeResults.definitions;
      
      results.validated += typeResults.validated;
      results.errors += typeResults.errors;
      results.warnings += typeResults.warnings;
      results.missing += typeResults.missing;
      
      if (typeResults.errors > 0) {
        hasErrors = true;
      }
      console.log('');
    }
    
    // Step 3: Cross-validation checks
    console.log('📋 Step 3: Cross-validation checks...');
    const crossValidation = await performCrossValidation(allDefinitions);
    results.duplicates = crossValidation.duplicates;
    results.inconsistencies = crossValidation.inconsistencies;
    results.suggestions.push(...crossValidation.suggestions);
    
    if (crossValidation.errors > 0) {
      hasErrors = true;
      results.errors += crossValidation.errors;
    }
    console.log('');
    
    // Step 4: Unused file detection
    console.log('📋 Step 4: Detecting unused files...');
    const unusedFiles = await detectUnusedFiles(allDefinitions);
    results.unused = unusedFiles.length;
    
    if (unusedFiles.length > 0) {
      console.log(`   ⚠️  Found ${unusedFiles.length} unused files:`);
      unusedFiles.forEach(file => console.log(`      - ${file}`));
      results.suggestions.push({
        type: 'cleanup',
        message: `Consider removing ${unusedFiles.length} unused files`,
        files: unusedFiles
      });
    } else {
      console.log('   ✅ No unused files detected');
    }
    console.log('');
    
    // Step 5: Generate enhanced report
    console.log('📋 Step 5: Generating enhanced report...');
    await generateEnhancedReport(results, allDefinitions, Date.now() - startTime);
    
    // Step 6: Apply fixes if requested
    if (config.fix && results.suggestions.length > 0) {
      console.log('📋 Step 6: Applying automated fixes...');
      await applyAutomatedFixes(results.suggestions);
    }
    
    // Final summary
    printEnhancedSummary(results, Date.now() - startTime);
    
    if (hasErrors) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Enhanced validation failed:', error.message);
    if (config.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Load all schemas for validation
 */
async function loadAllSchemas() {
  const schemas = {};
  const schemaFiles = ['tool-schema.json', 'prompt-schema.json', 'resource-schema.json'];
  
  for (const schemaFile of schemaFiles) {
    const schemaPath = path.join(config.schemasDir, schemaFile);
    const type = schemaFile.replace('-schema.json', '');
    
    try {
      const schemaContent = await fs.readFile(schemaPath, 'utf8');
      schemas[type + 's'] = JSON.parse(schemaContent); // tools, prompts, resources
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new Error(`Failed to load schema ${schemaFile}: ${error.message}`);
      }
      // Schema doesn't exist, create a basic one
      schemas[type + 's'] = createBasicSchema(type);
    }
  }
  
  return schemas;
}

/**
 * Create a basic schema for missing schema files
 */
function createBasicSchema(type) {
  return {
    type: 'object',
    properties: {
      name: { type: 'string' },
      title: { type: 'string' },
      description: { type: 'string' },
      category: { type: 'string' }
    },
    required: ['name', 'title', 'description', 'category']
  };
}

/**
 * Validate a specific definition type
 */
async function validateDefinitionType(type, structure, schema) {
  const results = {
    validated: 0,
    errors: 0,
    warnings: 0,
    missing: 0,
    definitions: []
  };
  
  const typeDir = config[`${type}Dir`];
  
  for (const [category, items] of Object.entries(structure)) {
    console.log(`   📂 Category: ${category}`);
    
    const categoryDir = path.join(typeDir, category);
    
    // Check if category directory exists
    try {
      await fs.access(categoryDir);
    } catch {
      console.log(`      ❌ Category directory missing: ${categoryDir}`);
      results.errors++;
      continue;
    }
    
    // Validate each item in category
    for (const itemName of items) {
      const itemPath = path.join(categoryDir, `${itemName}.json`);
      
      try {
        const result = await validateDefinitionFile(itemPath, itemName, category, type, schema);
        
        if (result.valid) {
          console.log(`      ✅ ${itemName}`);
          results.validated++;
          results.definitions.push(result.definition);
        } else {
          console.log(`      ❌ ${itemName}: ${result.error}`);
          results.errors++;
        }
        
        if (result.warnings?.length > 0) {
          result.warnings.forEach(warning => {
            console.log(`      ⚠️  ${itemName}: ${warning}`);
            results.warnings++;
          });
        }
        
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log(`      ⚠️  ${itemName}: Definition file missing`);
          results.missing++;
        } else {
          console.log(`      ❌ ${itemName}: ${error.message}`);
          results.errors++;
        }
      }
    }
  }
  
  return results;
}

/**
 * Validate a single definition file with enhanced checks
 */
async function validateDefinitionFile(filePath, expectedName, expectedCategory, type, schema) {
  const result = {
    valid: false,
    error: null,
    warnings: [],
    definition: null
  };
  
  try {
    // Read and parse definition
    const content = await fs.readFile(filePath, 'utf8');
    let definition;
    
    try {
      definition = JSON.parse(content);
    } catch (parseError) {
      result.error = `Invalid JSON: ${parseError.message}`;
      return result;
    }
    
    // Enhanced validation checks
    const validationChecks = [
      () => validateBasicStructure(definition, expectedName, expectedCategory, type),
      () => validateNamingConventions(definition, type),
      () => validateContentQuality(definition, type),
      () => validateSchemaCompliance(definition, schema),
      () => validateCategoryConsistency(definition, expectedCategory),
      () => validateRequiredFields(definition, type)
    ];
    
    for (const check of validationChecks) {
      const checkResult = check();
      if (!checkResult.valid) {
        result.error = checkResult.error;
        return result;
      }
      result.warnings.push(...checkResult.warnings);
    }
    
    result.valid = true;
    result.definition = definition;
    return result;
    
  } catch (error) {
    result.error = error.message;
    return result;
  }
}

/**
 * Enhanced basic structure validation
 */
function validateBasicStructure(definition, expectedName, expectedCategory, type) {
  const result = { valid: true, error: null, warnings: [] };
  
  // Type-specific required fields
  const requiredFields = {
    tools: ['name', 'title', 'description', 'category', 'inputSchema'],
    prompts: ['name', 'title', 'description', 'category', 'template'],
    resources: ['uri', 'name', 'description', 'mimeType']
  };
  
  const fields = requiredFields[type] || requiredFields.tools;
  
  for (const field of fields) {
    if (!definition[field]) {
      result.valid = false;
      result.error = `Missing required field: ${field}`;
      return result;
    }
  }
  
  // Name/URI consistency check
  const nameField = type === 'resources' ? 'uri' : 'name';
  const actualName = type === 'resources' ? 
    definition.uri.split('/').pop() : definition.name;
  
  if (actualName !== expectedName && !definition.uri?.includes(expectedName)) {
    result.valid = false;
    result.error = `Name mismatch: expected '${expectedName}', got '${actualName}'`;
    return result;
  }
  
  // Category consistency
  if (definition.category !== expectedCategory) {
    result.valid = false;
    result.error = `Category mismatch: expected '${expectedCategory}', got '${definition.category}'`;
    return result;
  }
  
  return result;
}

/**
 * Validate naming conventions
 */
function validateNamingConventions(definition, type) {
  const result = { valid: true, error: null, warnings: [] };
  
  if (type === 'tools' || type === 'prompts') {
    // Check kebab-case format
    if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(definition.name)) {
      result.warnings.push('Name should be in kebab-case format');
    }
    
    // Check for consistent naming patterns
    if (type === 'tools') {
      const category = definition.category;
      if (!definition.name.startsWith(category + '-')) {
        result.warnings.push(`Tool name should start with category prefix '${category}-'`);
      }
    }
  }
  
  return result;
}

/**
 * Validate content quality
 */
function validateContentQuality(definition, type) {
  const result = { valid: true, error: null, warnings: [] };
  
  // Description quality checks
  if (definition.description) {
    if (definition.description.length < 20) {
      result.warnings.push('Description is quite short, consider adding more detail');
    }
    
    if (definition.description.length > 1000) {
      result.warnings.push('Description is very long, consider making it more concise');
    }
    
    // Check for placeholder text
    if (definition.description.includes('TODO') || definition.description.includes('FIXME')) {
      result.warnings.push('Description contains placeholder text');
    }
  }
  
  // Title quality checks
  if (definition.title) {
    if (definition.title.length > 60) {
      result.warnings.push('Title is quite long, consider making it shorter');
    }
    
    if (definition.title === definition.name) {
      result.warnings.push('Title should be more descriptive than just the name');
    }
  }
  
  return result;
}

/**
 * Validate schema compliance (simplified)
 */
function validateSchemaCompliance(definition, schema) {
  const result = { valid: true, error: null, warnings: [] };
  
  // Basic schema validation
  if (schema && schema.required) {
    for (const requiredField of schema.required) {
      if (!definition[requiredField]) {
        result.valid = false;
        result.error = `Schema violation: missing required field '${requiredField}'`;
        return result;
      }
    }
  }
  
  return result;
}

/**
 * Validate category consistency
 */
function validateCategoryConsistency(definition, expectedCategory) {
  const result = { valid: true, error: null, warnings: [] };
  
  if (definition.category !== expectedCategory) {
    result.valid = false;
    result.error = `Category inconsistency: expected '${expectedCategory}', got '${definition.category}'`;
  }
  
  return result;
}

/**
 * Validate required fields based on type
 */
function validateRequiredFields(definition, type) {
  const result = { valid: true, error: null, warnings: [] };
  
  if (type === 'tools' && definition.inputSchema) {
    // Validate input schema structure
    if (!definition.inputSchema.properties) {
      result.warnings.push('Input schema should have properties defined');
    }
    
    if (definition.inputSchema.required) {
      for (const requiredParam of definition.inputSchema.required) {
        const paramDef = definition.inputSchema.properties?.[requiredParam];
        if (!paramDef?.description) {
          result.warnings.push(`Required parameter '${requiredParam}' needs a description`);
        }
      }
    }
  }
  
  return result;
}

/**
 * Perform cross-validation checks
 */
async function performCrossValidation(allDefinitions) {
  const results = {
    errors: 0,
    duplicates: 0,
    inconsistencies: 0,
    suggestions: []
  };
  
  // Check for duplicate names across all types
  const allNames = new Map();
  
  for (const [type, definitions] of Object.entries(allDefinitions)) {
    for (const def of definitions) {
      const name = def.name || def.uri;
      if (allNames.has(name)) {
        console.log(`   ❌ Duplicate name found: '${name}' in ${type} and ${allNames.get(name)}`);
        results.duplicates++;
        results.errors++;
      } else {
        allNames.set(name, type);
      }
    }
  }
  
  if (results.duplicates === 0) {
    console.log('   ✅ No duplicate names found');
  }
  
  // Check for naming inconsistencies
  const inconsistencies = checkNamingInconsistencies(allDefinitions);
  results.inconsistencies = inconsistencies.length;
  
  if (inconsistencies.length > 0) {
    console.log(`   ⚠️  Found ${inconsistencies.length} naming inconsistencies:`);
    inconsistencies.forEach(issue => {
      console.log(`      - ${issue}`);
    });
    results.suggestions.push({
      type: 'naming',
      message: 'Fix naming inconsistencies',
      issues: inconsistencies
    });
  } else {
    console.log('   ✅ No naming inconsistencies found');
  }
  
  return results;
}

/**
 * Check for naming inconsistencies
 */
function checkNamingInconsistencies(allDefinitions) {
  const inconsistencies = [];
  
  // Check tools for consistent category prefixes
  if (allDefinitions.tools) {
    for (const tool of allDefinitions.tools) {
      if (!tool.name.startsWith(tool.category + '-')) {
        inconsistencies.push(`Tool '${tool.name}' should start with category prefix '${tool.category}-'`);
      }
    }
  }
  
  // Check for consistent casing
  for (const [type, definitions] of Object.entries(allDefinitions)) {
    for (const def of definitions) {
      const name = def.name || def.uri;
      if (name && name !== name.toLowerCase()) {
        inconsistencies.push(`${type} '${name}' should be lowercase`);
      }
    }
  }
  
  return inconsistencies;
}

/**
 * Detect unused files in the definitions directory
 */
async function detectUnusedFiles(allDefinitions) {
  const unusedFiles = [];
  const usedFiles = new Set();
  
  // Collect all used files
  for (const [type, definitions] of Object.entries(allDefinitions)) {
    for (const def of definitions) {
      const name = def.name || def.uri?.split('/').pop();
      if (name) {
        usedFiles.add(`${type}/${def.category}/${name}.json`);
      }
    }
  }
  
  // Scan for all JSON files in definitions directories
  for (const type of ['tools', 'prompts', 'resources']) {
    const typeDir = config[`${type}Dir`];
    
    try {
      const categories = await fs.readdir(typeDir);
      
      for (const category of categories) {
        const categoryPath = path.join(typeDir, category);
        const stat = await fs.stat(categoryPath);
        
        if (stat.isDirectory()) {
          const files = await fs.readdir(categoryPath);
          
          for (const file of files) {
            if (file.endsWith('.json')) {
              const relativePath = `${type}/${category}/${file}`;
              if (!usedFiles.has(relativePath)) {
                unusedFiles.push(relativePath);
              }
            }
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist, skip
    }
  }
  
  return unusedFiles;
}

/**
 * Generate enhanced validation report
 */
async function generateEnhancedReport(results, allDefinitions, duration) {
  if (!config.report) {
    return;
  }
  
  const reportPath = path.join(config.generatedDir, 'validation-report.json');
  
  const report = {
    timestamp: new Date().toISOString(),
    duration: duration,
    summary: {
      validated: results.validated,
      errors: results.errors,
      warnings: results.warnings,
      missing: results.missing,
      duplicates: results.duplicates,
      unused: results.unused,
      inconsistencies: results.inconsistencies
    },
    definitions: {
      tools: allDefinitions.tools?.length || 0,
      prompts: allDefinitions.prompts?.length || 0,
      resources: allDefinitions.resources?.length || 0
    },
    suggestions: results.suggestions,
    coverage: calculateCoverage(allDefinitions),
    quality: calculateQualityScore(results)
  };
  
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`   ✅ Enhanced report generated: ${reportPath}`);
}

/**
 * Calculate definition coverage
 */
function calculateCoverage(allDefinitions) {
  const coverage = {};
  
  for (const [type, structure] of Object.entries(expectedStructure)) {
    const expected = Object.values(structure).flat().length;
    const actual = allDefinitions[type]?.length || 0;
    coverage[type] = {
      expected,
      actual,
      percentage: Math.round((actual / expected) * 100)
    };
  }
  
  return coverage;
}

/**
 * Calculate overall quality score
 */
function calculateQualityScore(results) {
  const total = results.validated + results.errors + results.missing;
  if (total === 0) return 100;
  
  const errorWeight = 3;
  const warningWeight = 1;
  const missingWeight = 2;
  
  const penalties = (results.errors * errorWeight) + 
                   (results.warnings * warningWeight) + 
                   (results.missing * missingWeight) +
                   (results.duplicates * errorWeight) +
                   (results.inconsistencies * warningWeight);
  
  const maxScore = total * errorWeight;
  const score = Math.max(0, Math.round(((maxScore - penalties) / maxScore) * 100));
  
  return score;
}

/**
 * Apply automated fixes
 */
async function applyAutomatedFixes(suggestions) {
  let fixesApplied = 0;
  
  for (const suggestion of suggestions) {
    if (suggestion.type === 'cleanup' && suggestion.files) {
      console.log(`   🔧 Cleaning up ${suggestion.files.length} unused files...`);
      
      for (const file of suggestion.files) {
        const filePath = path.join(definitionsDir, file);
        try {
          await fs.unlink(filePath);
          console.log(`      ✅ Removed: ${file}`);
          fixesApplied++;
        } catch (error) {
          console.log(`      ❌ Failed to remove: ${file} - ${error.message}`);
        }
      }
    }
  }
  
  console.log(`   ✅ Applied ${fixesApplied} automated fixes`);
}

/**
 * Print enhanced summary
 */
function printEnhancedSummary(results, duration) {
  console.log('📊 Enhanced Validation Summary');
  console.log('='.repeat(60));
  console.log(`   ⏱️  Duration: ${duration}ms`);
  console.log(`   ✅ Validated: ${results.validated}`);
  console.log(`   ❌ Errors: ${results.errors}`);
  console.log(`   ⚠️  Warnings: ${results.warnings}`);
  console.log(`   📝 Missing: ${results.missing}`);
  console.log(`   🔄 Duplicates: ${results.duplicates}`);
  console.log(`   🗑️  Unused: ${results.unused}`);
  console.log(`   📋 Inconsistencies: ${results.inconsistencies}`);
  
  const qualityScore = calculateQualityScore(results);
  console.log(`   🎯 Quality Score: ${qualityScore}%`);
  
  if (results.suggestions.length > 0) {
    console.log(`   💡 Suggestions: ${results.suggestions.length}`);
    
    if (config.verbose) {
      console.log('\n💡 Improvement Suggestions:');
      results.suggestions.forEach((suggestion, i) => {
        console.log(`   ${i + 1}. ${suggestion.message}`);
      });
    }
  }
  
  console.log('');
  
  if (results.errors === 0 && results.missing === 0) {
    console.log('🎉 All enhanced validations passed!');
    if (qualityScore >= 90) {
      console.log('⭐ Excellent quality score!');
    } else if (qualityScore >= 75) {
      console.log('👍 Good quality score!');
    }
  } else if (results.errors === 0) {
    console.log('✅ No errors found, but some definitions are missing.');
  } else {
    console.log('❌ Enhanced validation failed with errors.');
  }
  
  if (config.fix) {
    console.log('\n🔧 Use --fix flag to apply automated fixes');
  }
  
  if (config.report) {
    console.log('📄 Detailed report generated in definitions/generated/validation-report.json');
  }
}

// Run enhanced validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  enhancedValidate().catch(console.error);
}

export { enhancedValidate };