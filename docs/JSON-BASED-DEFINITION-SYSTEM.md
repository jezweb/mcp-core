# JSON-Based Definition System

## Overview

The JSON-Based Definition System is a modernized architecture that transforms the OpenAI Assistants MCP server from hardcoded TypeScript definitions to a data-driven approach using modular JSON files. This system provides maintainability, scalability, and validation while maintaining 100% backward compatibility.

## Architecture

```
[JSON Definition Files] ---> [Build Script] ---> [Auto-Generated .ts Files] ---> [Application]
      (The Source)           (The "Compiler")      (The Runtime Code)         (What uses the code)
```

### Key Components

1. **JSON Definition Files**: Modular, schema-validated JSON files containing tool, prompt, and resource definitions
2. **Build Script**: Automated compilation system that transforms JSON into TypeScript
3. **Auto-Generated Files**: TypeScript files with backward-compatible interfaces
4. **Validation System**: JSON Schema validation ensuring data integrity

## Benefits

- **Maintainability**: Simple JSON files instead of complex TypeScript objects
- **Scalability**: Can handle hundreds of resources without file bloat
- **Validation**: Automatic schema validation prevents errors
- **Separation of Concerns**: Data separated from application logic
- **Collaboration**: No more merge conflicts in monolithic files
- **Type Safety**: Full TypeScript typing for all definitions

## Directory Structure

```
definitions/
├── tools/                    # Tool definitions (22 tools)
│   ├── assistant/           # Assistant management tools
│   ├── thread/              # Thread management tools
│   ├── message/             # Message handling tools
│   ├── run/                 # Run execution tools
│   └── run-step/            # Run step monitoring tools
├── prompts/                 # Prompt templates (10 prompts)
│   ├── assistant/           # Assistant creation prompts
│   ├── thread/              # Thread management prompts
│   ├── analysis/            # Code analysis prompts
│   ├── run/                 # Run configuration prompts
│   └── data/                # Data analysis prompts
├── resources/               # Resource definitions (9 resources)
│   ├── templates/           # Assistant templates
│   ├── documentation/       # API documentation
│   └── examples/            # Workflow examples
├── schemas/                 # JSON schemas for validation
│   ├── tool-schema.json
│   ├── prompt-schema.json
│   └── resource-schema.json
├── scripts/                 # Build and validation scripts
│   └── build.js            # Main build script
└── generated/              # Auto-generated output
    ├── types/              # TypeScript type definitions
    └── index.ts            # Unified exports
```

## JSON Schema Definitions

### Tool Schema
Tools define MCP operations with input schemas and metadata:

```json
{
  "name": "assistant-create",
  "title": "Create AI Assistant",
  "description": "Create a new AI assistant with custom instructions and capabilities",
  "category": "assistant",
  "inputSchema": {
    "type": "object",
    "properties": {
      "model": {"type": "string"},
      "name": {"type": "string"},
      "instructions": {"type": "string"}
    },
    "required": ["model"]
  }
}
```

### Prompt Schema
Prompts define template messages with arguments:

```json
{
  "name": "create-coding-assistant",
  "title": "Create Coding Assistant",
  "description": "Generate a specialized coding assistant",
  "category": "assistant",
  "template": "Create a specialized coding assistant for {{specialization}}...",
  "arguments": [
    {
      "name": "specialization",
      "description": "Programming specialization",
      "required": true
    }
  ]
}
```

### Resource Schema
Resources define content and metadata:

```json
{
  "uri": "docs://best-practices",
  "name": "Best Practices Guide",
  "description": "Guidelines for optimal usage",
  "mimeType": "text/markdown",
  "category": "documentation",
  "content": "# Best Practices Guide\n\n..."
}
```

## Build System

### Build Script Features

- **Environment Validation**: Checks required directories and dependencies
- **JSON Schema Validation**: Validates all definitions against schemas
- **TypeScript Generation**: Creates type-safe interfaces
- **Backward Compatibility**: Maintains existing API interfaces
- **Index Generation**: Creates unified export files

### Build Commands

```bash
# Build all definitions
npm run definitions:build

# Build specific types
npm run definitions:tools
npm run definitions:prompts
npm run definitions:resources

# Validation and development
npm run definitions:validate
npm run definitions:watch
npm run definitions:clean
```

### Generated Files

The build process generates:

1. **Type Definitions**: `definitions/generated/types/`
   - `tools-types.ts` - Tool parameter interfaces
   - `prompts-types.ts` - Prompt template interfaces
   - `resources-types.ts` - Resource content interfaces

2. **Compatibility Layers**: `shared/`
   - `shared/core/tool-definitions.ts` - Tool definitions
   - `shared/prompts/prompt-templates.ts` - Prompt templates
   - `shared/resources/resources.ts` - Resource definitions

3. **Unified Exports**: `definitions/generated/index.ts`

## Usage Examples

### Adding a New Tool

1. Create JSON definition:
```json
// definitions/tools/assistant/assistant-clone.json
{
  "$schema": "../../schemas/tool-schema.json",
  "name": "assistant-clone",
  "title": "Clone Assistant",
  "description": "Create a copy of an existing assistant",
  "category": "assistant",
  "inputSchema": {
    "type": "object",
    "properties": {
      "assistant_id": {"type": "string"},
      "name": {"type": "string"}
    },
    "required": ["assistant_id"]
  }
}
```

2. Update build script categories (if needed)
3. Run build: `npm run definitions:build`

### Adding a New Resource

1. Create JSON definition:
```json
// definitions/resources/documentation/api-changelog.json
{
  "$schema": "../../schemas/resource-schema.json",
  "uri": "docs://api-changelog",
  "name": "API Changelog",
  "description": "Recent API changes and updates",
  "mimeType": "text/markdown",
  "category": "documentation",
  "content": "# API Changelog\n\n## Version 3.3.0\n..."
}
```

2. Run build: `npm run definitions:build`

### Adding a New Prompt

1. Create JSON definition:
```json
// definitions/prompts/assistant/create-research-assistant.json
{
  "$schema": "../../schemas/prompt-schema.json",
  "name": "create-research-assistant",
  "title": "Create Research Assistant",
  "description": "Generate a research-focused assistant",
  "category": "assistant",
  "template": "Create a research assistant specialized in {{field}}...",
  "arguments": [
    {
      "name": "field",
      "description": "Research field or domain",
      "required": true
    }
  ]
}
```

2. Run build: `npm run definitions:build`

## Validation

### Schema Validation
All JSON files are validated against their respective schemas:

```bash
npm run definitions:validate
```

### Type Checking
Generated TypeScript files are type-checked:

```bash
npm run type-check
```

### Integration Testing
Full system validation:

```bash
npm test
```

## Migration Guide

### From Hardcoded to JSON

1. **Extract Definition**: Copy content from TypeScript file
2. **Create JSON File**: Use appropriate schema
3. **Validate**: Run `npm run definitions:validate`
4. **Build**: Run `npm run definitions:build`
5. **Test**: Verify functionality with `npm test`

### Backward Compatibility

The system maintains 100% backward compatibility:
- All existing imports continue to work
- API interfaces remain unchanged
- Function signatures are preserved
- Export names stay consistent

## Development Workflow

### Daily Development
```bash
# Watch for changes and auto-rebuild
npm run definitions:watch

# Validate changes
npm run definitions:validate

# Type check
npm run type-check
```

### Adding New Definitions
1. Create JSON file following schema
2. Add to appropriate category in build script (if new category)
3. Run build and validate
4. Test integration

### Debugging
- Check build output for validation errors
- Use `npm run definitions:validate` for detailed validation
- Examine generated files in `definitions/generated/`

## Performance

### Build Performance
- **Cold Build**: ~2-3 seconds for all definitions
- **Incremental**: Watch mode rebuilds in <1 second
- **Validation**: Schema validation adds ~200ms

### Runtime Performance
- **No Runtime Impact**: All processing happens at build time
- **Type Safety**: Full TypeScript compilation benefits
- **Memory Efficient**: Same memory footprint as before

## Best Practices

### JSON File Organization
- Use descriptive filenames matching the definition name
- Group related definitions in appropriate categories
- Include comprehensive metadata and descriptions

### Schema Compliance
- Always reference the appropriate schema
- Validate locally before committing
- Use required fields appropriately

### Content Guidelines
- Write clear, comprehensive descriptions
- Include practical examples in resources
- Use consistent naming conventions

### Version Control
- Commit JSON files and generated files together
- Use meaningful commit messages for definition changes
- Review generated file changes in PRs

## Troubleshooting

### Common Issues

1. **Schema Validation Errors**
   - Check JSON syntax and structure
   - Verify required fields are present
   - Ensure proper schema reference

2. **Build Failures**
   - Check file permissions
   - Verify directory structure
   - Review build script output

3. **Type Errors**
   - Run `npm run type-check`
   - Check generated type definitions
   - Verify import paths

### Debug Commands
```bash
# Detailed validation output
npm run definitions:validate

# Clean and rebuild
npm run definitions:clean
npm run definitions:build

# Check specific type
npm run definitions:tools
npm run definitions:prompts
npm run definitions:resources
```

## Future Enhancements

### Planned Features
- **Hot Reloading**: Development server integration
- **Visual Editor**: Web-based definition editor
- **Import/Export**: Bulk definition management
- **Versioning**: Definition version tracking
- **Documentation**: Auto-generated API docs

### Extensibility
The system is designed for easy extension:
- New definition types can be added
- Custom validation rules
- Additional build targets
- Plugin architecture support

## Conclusion

The JSON-Based Definition System represents a significant modernization of the OpenAI Assistants MCP server architecture. It provides a scalable, maintainable, and validated approach to managing definitions while preserving full backward compatibility. This system enables rapid development, reduces errors, and facilitates collaboration across development teams.

For questions or contributions, please refer to the project documentation or open an issue in the repository.