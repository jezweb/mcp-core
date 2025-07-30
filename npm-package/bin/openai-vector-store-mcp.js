#!/usr/bin/env node

/**
 * OpenAI Assistants MCP Server CLI
 *
 * This is the executable entry point for the OpenAI Assistants MCP Server.
 * It can be run directly or via npx without requiring environment variables.
 * The API key will be provided by the MCP client configuration.
 */

const path = require('path');

// Import and run the main server
async function main() {
  try {
    // Import the main server module
    const serverPath = path.join(__dirname, '../universal-mcp-server.cjs');
    require(serverPath);
    
  } catch (error) {
    console.error('Failed to start OpenAI Assistants MCP Server:', error);
    process.exit(1);
  }
}

// Start the server without API key validation
// The API key will be provided by the MCP client via environment variables
console.error('[INFO] Starting OpenAI Assistants MCP Server...');
console.error('[INFO] API key will be validated when tools are called');
console.error('[INFO] Configure OPENAI_API_KEY in your MCP client configuration');

main();