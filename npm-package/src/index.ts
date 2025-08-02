#!/usr/bin/env node
import 'dotenv/config'; // Automatically loads .env
import { MCPHandler } from './mcp-handler.js';
import * as readline from 'readline';

function showHelp() {
  console.log(`
OpenAI Assistants MCP Server v3.0.8

USAGE:
  npx openai-assistants-mcp [OPTIONS]

DESCRIPTION:
  A Model Context Protocol (MCP) server that provides OpenAI Assistants API tools.
  Runs in stdio mode for integration with MCP clients like Claude Desktop.

OPTIONS:
  --help, -h     Show this help message
  --version, -v  Show version information

ENVIRONMENT VARIABLES:
  OPENAI_API_KEY    Required. Your OpenAI API key

EXAMPLES:
  # Run the MCP server (requires OPENAI_API_KEY)
  OPENAI_API_KEY=sk-... npx openai-assistants-mcp

  # Show help
  npx openai-assistants-mcp --help

  # Show version
  npx openai-assistants-mcp --version

MCP CLIENT CONFIGURATION:
  Add this to your MCP client configuration:
  {
    "mcpServers": {
      "openai-assistants": {
        "command": "npx",
        "args": ["openai-assistants-mcp"],
        "env": {
          "OPENAI_API_KEY": "your-api-key-here"
        }
      }
    }
  }

For more information, visit: https://github.com/jezweb/openai-assistants-mcp
`);
}

function showVersion() {
  console.log('3.0.8');
}

async function runMCPServer() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error(JSON.stringify({
      jsonrpc: '2.0', id: null, error: { code: -32000, message: 'OPENAI_API_KEY is not set in environment.' }
    }));
    process.exit(1);
  }

  const mcpHandler = new MCPHandler(apiKey);
  const rl = readline.createInterface({ input: process.stdin });

  console.error('OpenAI Assistants MCP Server is running in stdio mode...');

  for await (const line of rl) {
    try {
      const request = JSON.parse(line);
      const response = await mcpHandler.handleRequest(request);
      process.stdout.write(JSON.stringify(response) + '\n');
    } catch (e) {
      const errResponse = { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } };
      process.stdout.write(JSON.stringify(errResponse) + '\n');
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  // Handle command line arguments
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }
  
  if (args.includes('--version') || args.includes('-v')) {
    showVersion();
    process.exit(0);
  }
  
  // If no arguments or unrecognized arguments, run the MCP server
  await runMCPServer();
}

main().catch(err => {
  console.error(JSON.stringify({
    jsonrpc: '2.0', id: null, error: { code: -32603, message: 'Internal Server Error', data: err.message }
  }));
  process.exit(1);
});