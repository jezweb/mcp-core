# Tool Definitions - Hybrid Modular Architecture

This directory contains the modular tool definitions for the OpenAI Assistants MCP server. The architecture provides:

## Architecture Overview

### 1. **JSON-First Definitions**
- Tool definitions are stored as JSON files for easy editing and validation
- Each tool has its own file for maintainability
- Category-based organization for logical grouping

### 2. **Build-Time Compilation**
- JSON definitions are compiled to TypeScript at build time
- Type safety is maintained through generated interfaces
- Backward compatibility is preserved

### 3. **Configuration Layer**
- Environment-specific configurations
- Feature flags for selective tool inclusion
- Build-time optimization for different deployment targets

## Directory Structure

```
definitions/
├── README.md                    # This file
├── schemas/                     # JSON Schema definitions
│   ├── tool-schema.json        # Base tool schema
│   ├── input-schema.json       # Input parameter schemas
│   └── category-schemas/       # Category-specific schemas
├── tools/                      # Individual tool definitions
│   ├── assistant/              # Assistant management tools
│   ├── thread/                 # Thread management tools
│   ├── message/                # Message management tools
│   ├── run/                    # Run management tools
│   └── run-step/               # Run step management tools
├── configs/                    # Configuration files
│   ├── environments/           # Environment-specific configs
│   ├── features/               # Feature flag definitions
│   └── build/                  # Build-time configurations
├── generated/                  # Generated TypeScript files
│   ├── types/                  # Generated type definitions
│   ├── definitions/            # Compiled tool definitions
│   └── index.ts                # Main export file
└── scripts/                    # Build and validation scripts
    ├── build.js                # Main build script
    ├── validate.js             # Validation script
    ├── generate-types.js       # Type generation script
    └── utils/                  # Utility functions
```

## Usage

### Development
```bash
npm run definitions:validate    # Validate all definitions
npm run definitions:build      # Build definitions to TypeScript
npm run definitions:watch      # Watch for changes and rebuild
```

### Adding New Tools
1. Create JSON definition in appropriate category folder
2. Run validation to ensure schema compliance
3. Build to generate TypeScript types
4. Update tests and documentation

### Configuration
- Edit files in `configs/` to customize behavior
- Use feature flags to enable/disable tools
- Configure environment-specific settings

## Benefits

1. **Maintainability**: Each tool is in its own file
2. **Type Safety**: Generated TypeScript ensures type correctness
3. **Validation**: JSON Schema validation catches errors early
4. **Flexibility**: Easy to add/remove tools and configure behavior
5. **Performance**: Build-time optimization for different targets
6. **Backward Compatibility**: Existing code continues to work unchanged