#!/usr/bin/env node

/**
 * NPM Package Specific Tests for OpenAI Assistants MCP Server
 * Tests features and behaviors specific to the NPM package deployment
 */

import { TestTracker, TestDataGenerator, MCPValidator, PerformanceTracker } from '../utils/test-helpers.js';

class NPMPackageSpecificTester {
  constructor() {
    this.tracker = new TestTracker('NPM Package Specific Tests');
    this.performanceTracker = new PerformanceTracker();
    this.npmPackagePath = './npm-package/universal-mcp-server.cjs';
    this.testApiKey = process.env.OPENAI_API_KEY || 'test-api-key-for-validation';
  }

  async runAllTests() {
    this.tracker.log('🚀 Starting NPM Package Specific Tests', 'start');

    try {
      // Test NPM package specific features
      await this.testStdioTransport();
      await this.testProcessLifecycle();
      await this.testEnvironmentVariables();
      await this.testSignalHandling();
      await this.testMemoryUsage();
      await this.testFileSystemAccess();
      await this.testNodeJSCompatibility();
      await this.testCLIInterface();
      await this.testErrorLogging();
      await this.testGracefulShutdown();
      
      this.tracker.log('🎉 All NPM package specific tests completed!', 'success');
      return true;
    } catch (error) {
      this.tracker.log(`💥 NPM package test suite failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testStdioTransport() {
    await this.tracker.runTest('Stdio Transport', async () => {
      const { spawn } = require('child_process');
      
      return new Promise((resolve, reject) => {
        const child = spawn('node', [this.npmPackagePath], {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, OPENAI_API_KEY: this.testApiKey }
        });

        let responseData = '';
        let errorData = '';
        const responses = [];

        child.stdout.on('data', (data) => {
          responseData += data.toString();
        });

        child.stderr.on('data', (data) => {
          errorData += data.toString();
        });

        child.on('close', (code) => {
          try {
            // Parse all responses
            const lines = responseData.trim().split('\n');
            for (const line of lines) {
              if (line.trim() && line.startsWith('{')) {
                try {
                  const response = JSON.parse(line);
                  responses.push(response);
                } catch (e) {
                  // Skip non-JSON lines
                }
              }
            }

            if (responses.length === 0) {
              reject(new Error('No valid JSON-RPC responses received'));
              return;
            }

            // Validate responses
            for (const response of responses) {
              const errors = MCPValidator.validateMCPResponse(response);
              if (errors.length > 0) {
                reject(new Error(`Invalid response: ${errors.join(', ')}`));
                return;
              }
            }

            this.tracker.log(`✅ Received ${responses.length} valid JSON-RPC responses`, 'info');
            resolve(responses);
          } catch (error) {
            reject(new Error(`Failed to parse stdio responses: ${error.message}`));
          }
        });

        child.on('error', (error) => {
          reject(new Error(`Process error: ${error.message}`));
        });

        // Send test requests
        const requests = [
          {
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
              protocolVersion: '2024-11-05',
              capabilities: { tools: {} },
              clientInfo: { name: 'stdio-test-client', version: '1.0.0' }
            }
          },
          {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/list',
            params: {}
          }
        ];

        for (const request of requests) {
          child.stdin.write(JSON.stringify(request) + '\n');
        }
        child.stdin.end();

        setTimeout(() => {
          child.kill();
          reject(new Error('Stdio test timeout'));
        }, 10000);
      });
    });
  }

  async testProcessLifecycle() {
    await this.tracker.runTest('Process Lifecycle', async () => {
      const { spawn } = require('child_process');
      
      // Test normal startup and shutdown
      const child = spawn('node', [this.npmPackagePath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, OPENAI_API_KEY: this.testApiKey }
      });

      let processStarted = false;
      let processEnded = false;

      child.stdout.on('data', () => {
        processStarted = true;
      });

      child.on('close', (code) => {
        processEnded = true;
      });

      // Send a request to ensure process is working
      child.stdin.write(JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          clientInfo: { name: 'lifecycle-test-client', version: '1.0.0' }
        }
      }) + '\n');

      // Wait a bit for process to start
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!processStarted) {
        child.kill();
        throw new Error('Process did not start properly');
      }

      // Close stdin to trigger graceful shutdown
      child.stdin.end();

      // Wait for process to end
      await new Promise(resolve => {
        child.on('close', resolve);
        setTimeout(() => {
          child.kill();
          resolve();
        }, 5000);
      });

      if (!processEnded) {
        throw new Error('Process did not end gracefully');
      }

      this.tracker.log('✅ Process lifecycle working correctly', 'info');
    });
  }

  async testEnvironmentVariables() {
    await this.tracker.runTest('Environment Variables', async () => {
      const { spawn } = require('child_process');
      
      // Test with different environment variables
      const testCases = [
        {
          name: 'Valid API Key',
          env: { OPENAI_API_KEY: 'test-api-key-123' },
          expectError: false
        },
        {
          name: 'Invalid API Key',
          env: { OPENAI_API_KEY: 'invalid-key' },
          expectError: false // Should still start but fail on API calls
        },
        {
          name: 'Missing API Key',
          env: {},
          expectError: false // Should start but fail on API calls
        }
      ];

      for (const testCase of testCases) {
        const child = spawn('node', [this.npmPackagePath], {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, ...testCase.env }
        });

        let responseReceived = false;
        let errorOccurred = false;

        child.stdout.on('data', (data) => {
          responseReceived = true;
        });

        child.stderr.on('data', (data) => {
          const errorText = data.toString();
          if (errorText.includes('Error') || errorText.includes('error')) {
            errorOccurred = true;
          }
        });

        // Send test request
        child.stdin.write(JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            clientInfo: { name: 'env-test-client', version: '1.0.0' }
          }
        }) + '\n');

        child.stdin.end();

        // Wait for response
        await new Promise(resolve => {
          child.on('close', resolve);
          setTimeout(() => {
            child.kill();
            resolve();
          }, 3000);
        });

        if (testCase.expectError && !errorOccurred) {
          throw new Error(`Expected error for ${testCase.name} but none occurred`);
        }

        if (!testCase.expectError && !responseReceived) {
          throw new Error(`Expected response for ${testCase.name} but none received`);
        }

        this.tracker.log(`✅ ${testCase.name}: Handled correctly`, 'info');
      }
    });
  }

  async testSignalHandling() {
    await this.tracker.runTest('Signal Handling', async () => {
      const { spawn } = require('child_process');
      
      const child = spawn('node', [this.npmPackagePath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, OPENAI_API_KEY: this.testApiKey }
      });

      let processRunning = true;

      child.on('close', () => {
        processRunning = false;
      });

      // Wait for process to start
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!processRunning) {
        throw new Error('Process exited too early');
      }

      // Send SIGTERM
      child.kill('SIGTERM');

      // Wait for graceful shutdown
      await new Promise(resolve => {
        child.on('close', resolve);
        setTimeout(() => {
          child.kill('SIGKILL'); // Force kill if not graceful
          resolve();
        }, 5000);
      });

      if (processRunning) {
        throw new Error('Process did not respond to SIGTERM');
      }

      this.tracker.log('✅ Signal handling working correctly', 'info');
    });
  }

  async testMemoryUsage() {
    await this.tracker.runTest('Memory Usage', async () => {
      const { spawn } = require('child_process');
      
      const child = spawn('node', [this.npmPackagePath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, OPENAI_API_KEY: this.testApiKey }
      });

      // Send multiple requests to test memory usage
      const requests = Array.from({ length: 20 }, (_, i) => ({
        jsonrpc: '2.0',
        id: i,
        method: 'tools/list',
        params: {}
      }));

      for (const request of requests) {
        child.stdin.write(JSON.stringify(request) + '\n');
      }

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if process is still responsive
      child.stdin.write(JSON.stringify({
        jsonrpc: '2.0',
        id: 999,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          clientInfo: { name: 'memory-test-client', version: '1.0.0' }
        }
      }) + '\n');

      child.stdin.end();

      let finalResponseReceived = false;

      child.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.includes('"id":999')) {
            finalResponseReceived = true;
          }
        }
      });

      await new Promise(resolve => {
        child.on('close', resolve);
        setTimeout(() => {
          child.kill();
          resolve();
        }, 5000);
      });

      if (!finalResponseReceived) {
        throw new Error('Process became unresponsive (possible memory issue)');
      }

      this.tracker.log('✅ Memory usage appears stable', 'info');
    });
  }

  async testFileSystemAccess() {
    await this.tracker.runTest('File System Access', async () => {
      const fs = require('fs');
      const path = require('path');

      // Check if the main file exists and is readable
      const mainFile = path.resolve(this.npmPackagePath);
      
      if (!fs.existsSync(mainFile)) {
        throw new Error(`Main file does not exist: ${mainFile}`);
      }

      const stats = fs.statSync(mainFile);
      if (!stats.isFile()) {
        throw new Error(`Main path is not a file: ${mainFile}`);
      }

      // Check file permissions
      try {
        fs.accessSync(mainFile, fs.constants.R_OK);
        this.tracker.log('✅ Main file is readable', 'info');
      } catch (error) {
        throw new Error(`Main file is not readable: ${error.message}`);
      }

      try {
        fs.accessSync(mainFile, fs.constants.X_OK);
        this.tracker.log('✅ Main file is executable', 'info');
      } catch (error) {
        this.tracker.log('⚠️  Main file may not be executable', 'warn');
      }

      // Check package.json
      const packageJsonPath = path.join(path.dirname(mainFile), 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        if (packageJson.bin && packageJson.bin['openai-assistants-mcp']) {
          this.tracker.log('✅ Binary entry point configured', 'info');
        }

        if (packageJson.main === path.basename(mainFile)) {
          this.tracker.log('✅ Main entry point matches', 'info');
        }
      }
    });
  }

  async testNodeJSCompatibility() {
    await this.tracker.runTest('Node.js Compatibility', async () => {
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

      this.tracker.log(`Node.js version: ${nodeVersion}`, 'info');

      if (majorVersion < 18) {
        throw new Error(`Node.js version ${nodeVersion} is below minimum requirement (18.0.0)`);
      }

      this.tracker.log('✅ Node.js version compatible', 'info');

      // Test ES modules support
      try {
        const { spawn } = require('child_process');
        
        const testScript = `
          import { createRequire } from 'module';
          const require = createRequire(import.meta.url);
          console.log('ES modules working');
          process.exit(0);
        `;

        const child = spawn('node', ['--input-type=module', '-e', testScript], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let esModulesWorking = false;

        child.stdout.on('data', (data) => {
          if (data.toString().includes('ES modules working')) {
            esModulesWorking = true;
          }
        });

        await new Promise(resolve => {
          child.on('close', resolve);
          setTimeout(() => {
            child.kill();
            resolve();
          }, 3000);
        });

        if (esModulesWorking) {
          this.tracker.log('✅ ES modules support working', 'info');
        } else {
          this.tracker.log('⚠️  ES modules support may be limited', 'warn');
        }
      } catch (error) {
        this.tracker.log('⚠️  Could not test ES modules support', 'warn');
      }
    });
  }

  async testCLIInterface() {
    await this.tracker.runTest('CLI Interface', async () => {
      const { spawn } = require('child_process');
      
      // Test direct execution
      const child = spawn('node', [this.npmPackagePath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, OPENAI_API_KEY: this.testApiKey }
      });

      let cliWorking = false;

      child.stdout.on('data', (data) => {
        // Any output indicates CLI is working
        cliWorking = true;
      });

      // Send a simple request
      child.stdin.write(JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          clientInfo: { name: 'cli-test-client', version: '1.0.0' }
        }
      }) + '\n');

      child.stdin.end();

      await new Promise(resolve => {
        child.on('close', resolve);
        setTimeout(() => {
          child.kill();
          resolve();
        }, 5000);
      });

      if (!cliWorking) {
        throw new Error('CLI interface not responding');
      }

      this.tracker.log('✅ CLI interface working', 'info');

      // Test if it can be run as a binary (if installed globally)
      try {
        const binaryChild = spawn('openai-assistants-mcp', [], {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, OPENAI_API_KEY: this.testApiKey }
        });

        let binaryWorking = false;

        binaryChild.stdout.on('data', () => {
          binaryWorking = true;
        });

        binaryChild.stdin.write(JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            clientInfo: { name: 'binary-test-client', version: '1.0.0' }
          }
        }) + '\n');

        binaryChild.stdin.end();

        await new Promise(resolve => {
          binaryChild.on('close', resolve);
          setTimeout(() => {
            binaryChild.kill();
            resolve();
          }, 3000);
        });

        if (binaryWorking) {
          this.tracker.log('✅ Binary command working', 'info');
        } else {
          this.tracker.log('⚠️  Binary command not available (not installed globally)', 'warn');
        }
      } catch (error) {
        this.tracker.log('⚠️  Binary command not available', 'warn');
      }
    });
  }

  async testErrorLogging() {
    await this.tracker.runTest('Error Logging', async () => {
      const { spawn } = require('child_process');
      
      const child = spawn('node', [this.npmPackagePath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, OPENAI_API_KEY: this.testApiKey }
      });

      let errorLogged = false;
      let stderrOutput = '';

      child.stderr.on('data', (data) => {
        stderrOutput += data.toString();
        errorLogged = true;
      });

      // Send an invalid request to trigger error logging
      child.stdin.write('invalid json\n');
      child.stdin.end();

      await new Promise(resolve => {
        child.on('close', resolve);
        setTimeout(() => {
          child.kill();
          resolve();
        }, 5000);
      });

      if (errorLogged) {
        this.tracker.log('✅ Error logging working', 'info');
        this.tracker.log(`Error output: ${stderrOutput.substring(0, 100)}...`, 'info');
      } else {
        this.tracker.log('⚠️  No error logging detected', 'warn');
      }
    });
  }

  async testGracefulShutdown() {
    await this.tracker.runTest('Graceful Shutdown', async () => {
      const { spawn } = require('child_process');
      
      const child = spawn('node', [this.npmPackagePath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, OPENAI_API_KEY: this.testApiKey }
      });

      // Start a request
      child.stdin.write(JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      }) + '\n');

      // Wait a bit for request to start processing
      await new Promise(resolve => setTimeout(resolve, 500));

      // Close stdin to signal shutdown
      child.stdin.end();

      const shutdownStart = Date.now();
      let shutdownCompleted = false;

      child.on('close', (code) => {
        shutdownCompleted = true;
        const shutdownTime = Date.now() - shutdownStart;
        this.tracker.log(`Shutdown completed in ${shutdownTime}ms with code ${code}`, 'info');
      });

      // Wait for graceful shutdown
      await new Promise(resolve => {
        child.on('close', resolve);
        setTimeout(() => {
          child.kill('SIGKILL'); // Force kill if taking too long
          resolve();
        }, 10000);
      });

      if (!shutdownCompleted) {
        throw new Error('Process did not shutdown gracefully');
      }

      this.tracker.log('✅ Graceful shutdown working', 'info');
    });
  }

  generateReport() {
    const report = this.tracker.generateReport();
    this.performanceTracker.generateReport();
    return report;
  }
}

// Run the tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new NPMPackageSpecificTester();
  
  tester.runAllTests().then(success => {
    const report = tester.generateReport();
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ NPM package test runner failed:', error);
    process.exit(1);
  });
}

export { NPMPackageSpecificTester };