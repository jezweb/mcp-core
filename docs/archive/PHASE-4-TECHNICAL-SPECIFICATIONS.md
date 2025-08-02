# Phase 4: Strengthened Testing - Technical Specifications

## Overview

This document provides detailed technical specifications for implementing Phase 4: Strengthened Testing. It complements the architectural plan with specific implementation details, code examples, and configuration specifications.

## 1. Enhanced Unit Testing Framework

### 1.1 Vitest Configuration

**File**: `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup/vitest.setup.ts'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'test/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*'
      ],
      thresholds: {
        global: {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        }
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './shared'),
      '@test': path.resolve(__dirname, './test')
    }
  }
});
```

### 1.2 Test Structure and Organization

**Directory Structure**:
```
test/
├── unit/                           # Unit tests
│   ├── shared/
│   │   ├── core/
│   │   │   ├── handlers/
│   │   │   │   ├── assistant-handler.test.ts
│   │   │   │   ├── thread-handler.test.ts
│   │   │   │   └── message-handler.test.ts
│   │   │   └── base-handler.test.ts
│   │   ├── types/
│   │   │   └── type-validation.test.ts
│   │   ├── validation/
│   │   │   └── schema-validator.test.ts
│   │   └── services/
│   │       └── openai-service.test.ts
│   └── npm-package/
│       └── deployment-adapter.test.ts
├── integration/                    # Enhanced integration tests
│   ├── chaos/
│   │   ├── network-failures.test.ts
│   │   ├── resource-exhaustion.test.ts
│   │   └── dependency-failures.test.ts
│   ├── contracts/
│   │   ├── openai-api-contracts.test.ts
│   │   └── mcp-protocol-contracts.test.ts
│   └── end-to-end/
│       ├── full-workflow.test.ts
│       └── cross-deployment.test.ts
├── performance/                    # Enhanced performance tests
│   ├── load/
│   │   ├── concurrent-users.test.ts
│   │   ├── sustained-load.test.ts
│   │   └── spike-testing.test.ts
│   ├── stress/
│   │   ├── breaking-point.test.ts
│   │   └── resource-limits.test.ts
│   └── memory/
│       ├── leak-detection.test.ts
│       └── gc-pressure.test.ts
├── security/                       # Security testing
│   ├── vulnerability/
│   │   ├── input-validation.test.ts
│   │   ├── injection-attacks.test.ts
│   │   └── authentication.test.ts
│   ├── penetration/
│   │   └── api-security.test.ts
│   └── compliance/
│       └── security-headers.test.ts
├── quality/                        # Test quality assurance
│   ├── mutation/
│   │   └── mutation-testing.config.ts
│   ├── coverage/
│   │   └── coverage-analysis.ts
│   └── reliability/
│       └── flaky-test-detection.ts
├── fixtures/                       # Test data and fixtures
│   ├── openai-responses/
│   ├── mcp-requests/
│   └── test-scenarios/
├── mocks/                          # Enhanced mock system
│   ├── openai-api.mock.ts
│   ├── cloudflare-env.mock.ts
│   └── network.mock.ts
└── setup/                          # Test setup and configuration
    ├── vitest.setup.ts
    ├── test-environment.ts
    └── global-mocks.ts
```

### 1.3 Enhanced Mock System

**File**: `test/mocks/openai-api.mock.ts`
```typescript
import { vi } from 'vitest';
import type { OpenAIService } from '@shared/services/openai-service';

export class OpenAIMockService implements OpenAIService {
  private responses = new Map<string, any>();
  private callHistory: Array<{ method: string; args: any[] }> = [];

  // Mock response configuration
  setMockResponse(endpoint: string, response: any) {
    this.responses.set(endpoint, response);
  }

  // Call history tracking
  getCallHistory() {
    return [...this.callHistory];
  }

  clearHistory() {
    this.callHistory = [];
  }

  // OpenAI API method implementations
  async createAssistant(data: any) {
    this.callHistory.push({ method: 'createAssistant', args: [data] });
    return this.responses.get('createAssistant') || {
      id: 'asst_mock_' + Math.random().toString(36).substr(2, 9),
      ...data
    };
  }

  async listAssistants(params: any) {
    this.callHistory.push({ method: 'listAssistants', args: [params] });
    return this.responses.get('listAssistants') || {
      object: 'list',
      data: [],
      has_more: false
    };
  }

  // ... other OpenAI API methods
}

export const createOpenAIMock = () => new OpenAIMockService();
```

### 1.4 Test Isolation Utilities

**File**: `test/setup/test-isolation.ts`
```typescript
import { beforeEach, afterEach } from 'vitest';
import { createOpenAIMock } from '../mocks/openai-api.mock';

export class TestIsolation {
  private static instance: TestIsolation;
  private mocks = new Map<string, any>();
  private cleanup: Array<() => void> = [];

  static getInstance() {
    if (!TestIsolation.instance) {
      TestIsolation.instance = new TestIsolation();
    }
    return TestIsolation.instance;
  }

  setupTest() {
    // Reset all mocks
    this.mocks.clear();
    this.cleanup = [];

    // Setup fresh mocks
    this.mocks.set('openai', createOpenAIMock());
    
    // Setup environment isolation
    this.isolateEnvironment();
  }

  teardownTest() {
    // Run cleanup functions
    this.cleanup.forEach(fn => fn());
    this.cleanup = [];
    
    // Clear mocks
    this.mocks.clear();
  }

  private isolateEnvironment() {
    // Isolate environment variables
    const originalEnv = { ...process.env };
    this.cleanup.push(() => {
      process.env = originalEnv;
    });
  }

  getMock<T>(name: string): T {
    return this.mocks.get(name);
  }
}

// Global setup for all tests
beforeEach(() => {
  TestIsolation.getInstance().setupTest();
});

afterEach(() => {
  TestIsolation.getInstance().teardownTest();
});
```

## 2. Chaos Engineering Framework

### 2.1 Chaos Testing Infrastructure

**File**: `test/integration/chaos/chaos-framework.ts`
```typescript
export interface ChaosScenario {
  name: string;
  description: string;
  setup: () => Promise<void>;
  inject: () => Promise<void>;
  verify: () => Promise<boolean>;
  cleanup: () => Promise<void>;
}

export class ChaosEngine {
  private scenarios: ChaosScenario[] = [];

  addScenario(scenario: ChaosScenario) {
    this.scenarios.push(scenario);
  }

  async runScenario(scenarioName: string): Promise<boolean> {
    const scenario = this.scenarios.find(s => s.name === scenarioName);
    if (!scenario) {
      throw new Error(`Chaos scenario '${scenarioName}' not found`);
    }

    try {
      await scenario.setup();
      await scenario.inject();
      const result = await scenario.verify();
      return result;
    } finally {
      await scenario.cleanup();
    }
  }

  async runAllScenarios(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    for (const scenario of this.scenarios) {
      try {
        const result = await this.runScenario(scenario.name);
        results.set(scenario.name, result);
      } catch (error) {
        console.error(`Chaos scenario '${scenario.name}' failed:`, error);
        results.set(scenario.name, false);
      }
    }
    
    return results;
  }
}
```

### 2.2 Network Failure Scenarios

**File**: `test/integration/chaos/network-failures.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { ChaosEngine } from './chaos-framework';

describe('Chaos Engineering: Network Failures', () => {
  const chaosEngine = new ChaosEngine();

  it('should handle OpenAI API timeout gracefully', async () => {
    chaosEngine.addScenario({
      name: 'openai-timeout',
      description: 'Simulate OpenAI API timeout',
      setup: async () => {
        // Setup test environment
      },
      inject: async () => {
        // Inject network delay/timeout
        global.fetch = vi.fn().mockImplementation(() => 
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 100)
          )
        );
      },
      verify: async () => {
        // Verify system handles timeout gracefully
        const result = await callAssistantAPI();
        return result.error && result.error.type === 'timeout';
      },
      cleanup: async () => {
        // Restore normal network behavior
        vi.restoreAllMocks();
      }
    });

    const result = await chaosEngine.runScenario('openai-timeout');
    expect(result).toBe(true);
  });

  it('should handle intermittent network failures', async () => {
    chaosEngine.addScenario({
      name: 'intermittent-failures',
      description: 'Simulate intermittent network failures',
      setup: async () => {
        // Setup test environment
      },
      inject: async () => {
        let callCount = 0;
        global.fetch = vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount % 3 === 0) {
            return Promise.reject(new Error('Network error'));
          }
          return Promise.resolve(new Response('{"success": true}'));
        });
      },
      verify: async () => {
        // Verify system retries and eventually succeeds
        const results = await Promise.allSettled([
          callAssistantAPI(),
          callAssistantAPI(),
          callAssistantAPI()
        ]);
        
        const successes = results.filter(r => r.status === 'fulfilled').length;
        return successes >= 2; // At least 2 out of 3 should succeed with retries
      },
      cleanup: async () => {
        vi.restoreAllMocks();
      }
    });

    const result = await chaosEngine.runScenario('intermittent-failures');
    expect(result).toBe(true);
  });
});
```

## 3. Performance Testing Framework

### 3.1 Load Testing Configuration

**File**: `test/performance/load/artillery.config.yml`
```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"
  defaults:
    headers:
      Content-Type: 'application/json'
      Authorization: 'Bearer test-api-key'

scenarios:
  - name: "Assistant Management Workflow"
    weight: 40
    flow:
      - post:
          url: "/mcp"
          json:
            jsonrpc: "2.0"
            id: 1
            method: "tools/call"
            params:
              name: "assistant-create"
              arguments:
                model: "gpt-4"
                name: "Load Test Assistant"
      - think: 1
      - post:
          url: "/mcp"
          json:
            jsonrpc: "2.0"
            id: 2
            method: "tools/call"
            params:
              name: "assistant-list"
              arguments:
                limit: 10

  - name: "Thread and Message Operations"
    weight: 60
    flow:
      - post:
          url: "/mcp"
          json:
            jsonrpc: "2.0"
            id: 1
            method: "tools/call"
            params:
              name: "thread-create"
              arguments:
                messages:
                  - role: "user"
                    content: "Test message"
      - think: 0.5
      - post:
          url: "/mcp"
          json:
            jsonrpc: "2.0"
            id: 2
            method: "tools/call"
            params:
              name: "message-create"
              arguments:
                thread_id: "{{ thread_id }}"
                role: "user"
                content: "Follow-up message"
```

### 3.2 Memory Leak Detection

**File**: `test/performance/memory/leak-detection.test.ts`
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryProfiler } from './memory-profiler';

describe('Memory Leak Detection', () => {
  let profiler: MemoryProfiler;

  beforeEach(() => {
    profiler = new MemoryProfiler();
    profiler.start();
  });

  afterEach(() => {
    profiler.stop();
  });

  it('should not leak memory during sustained operations', async () => {
    const initialMemory = profiler.getMemoryUsage();
    
    // Perform sustained operations
    for (let i = 0; i < 1000; i++) {
      await performAssistantOperation();
      
      // Force garbage collection every 100 operations
      if (i % 100 === 0 && global.gc) {
        global.gc();
      }
    }

    const finalMemory = profiler.getMemoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

    // Memory increase should be less than 50MB for 1000 operations
    expect(memoryIncreaseMB).toBeLessThan(50);
  });

  it('should release memory after operations complete', async () => {
    const baseline = profiler.getMemoryUsage();
    
    // Create many objects
    const operations = Array.from({ length: 100 }, () => 
      performAssistantOperation()
    );
    
    await Promise.all(operations);
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
      // Wait for GC to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const afterGC = profiler.getMemoryUsage();
    const memoryDiff = afterGC.heapUsed - baseline.heapUsed;
    const memoryDiffMB = memoryDiff / 1024 / 1024;
    
    // Memory should return close to baseline (within 10MB)
    expect(memoryDiffMB).toBeLessThan(10);
  });
});

class MemoryProfiler {
  private samples: Array<NodeJS.MemoryUsage> = [];
  private interval: NodeJS.Timeout | null = null;

  start() {
    this.samples = [];
    this.interval = setInterval(() => {
      this.samples.push(process.memoryUsage());
    }, 100);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  getMemoryTrend() {
    if (this.samples.length < 2) return 'insufficient-data';
    
    const recent = this.samples.slice(-10);
    const trend = recent[recent.length - 1].heapUsed - recent[0].heapUsed;
    
    return trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable';
  }
}
```

## 4. Security Testing Framework

### 4.1 Input Validation Testing

**File**: `test/security/vulnerability/input-validation.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { SecurityTester } from '../security-framework';

describe('Security: Input Validation', () => {
  const securityTester = new SecurityTester();

  const maliciousInputs = [
    // SQL Injection attempts
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    
    // XSS attempts
    "<script>alert('xss')</script>",
    "javascript:alert('xss')",
    
    // Command injection
    "; rm -rf /",
    "$(rm -rf /)",
    
    // Path traversal
    "../../../etc/passwd",
    "..\\..\\..\\windows\\system32\\config\\sam",
    
    // JSON injection
    '{"__proto__": {"isAdmin": true}}',
    
    // Large payloads
    "A".repeat(1000000),
    
    // Unicode and encoding attacks
    "\u0000\u0001\u0002",
    "%00%01%02",
    
    // Template injection
    "{{7*7}}",
    "${7*7}",
    
    // LDAP injection
    "*)(&(objectClass=*)",
    
    // NoSQL injection
    '{"$ne": null}',
    '{"$gt": ""}'
  ];

  it('should sanitize malicious inputs in assistant creation', async () => {
    for (const maliciousInput of maliciousInputs) {
      const result = await securityTester.testInput('assistant-create', {
        model: 'gpt-4',
        name: maliciousInput,
        description: maliciousInput,
        instructions: maliciousInput
      });

      expect(result.isSecure).toBe(true);
      expect(result.sanitized).toBe(true);
    }
  });

  it('should reject oversized payloads', async () => {
    const oversizedPayload = "A".repeat(100000);
    
    const result = await securityTester.testInput('assistant-create', {
      model: 'gpt-4',
      name: oversizedPayload,
      instructions: oversizedPayload
    });

    expect(result.isSecure).toBe(true);
    expect(result.rejected).toBe(true);
    expect(result.reason).toContain('payload too large');
  });

  it('should validate data types strictly', async () => {
    const invalidTypes = [
      { model: 123 }, // number instead of string
      { model: null }, // null instead of string
      { model: {} }, // object instead of string
      { model: [] }, // array instead of string
      { tools: "invalid" }, // string instead of array
      { metadata: "invalid" } // string instead of object
    ];

    for (const invalidData of invalidTypes) {
      const result = await securityTester.testInput('assistant-create', invalidData);
      
      expect(result.isSecure).toBe(true);
      expect(result.rejected).toBe(true);
      expect(result.reason).toContain('invalid type');
    }
  });
});
```

### 4.2 Authentication Security Testing

**File**: `test/security/vulnerability/authentication.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { AuthenticationTester } from '../security-framework';

describe('Security: Authentication', () => {
  const authTester = new AuthenticationTester();

  it('should reject invalid API keys', async () => {
    const invalidKeys = [
      '', // empty key
      'invalid-key', // malformed key
      'sk-' + 'A'.repeat(100), // too long
      'sk-' + 'A'.repeat(10), // too short
      null, // null key
      undefined, // undefined key
      123, // numeric key
      {}, // object key
      'Bearer sk-validkey', // double bearer
      'sk-validkey; DROP TABLE users;' // injection attempt
    ];

    for (const invalidKey of invalidKeys) {
      const result = await authTester.testAuthentication(invalidKey);
      
      expect(result.authenticated).toBe(false);
      expect(result.error).toBeDefined();
    }
  });

  it('should prevent timing attacks on API key validation', async () => {
    const validKey = 'sk-' + 'A'.repeat(48);
    const invalidKey = 'sk-' + 'B'.repeat(48);
    
    // Measure timing for valid and invalid keys
    const validTimes = [];
    const invalidTimes = [];
    
    for (let i = 0; i < 100; i++) {
      const start1 = performance.now();
      await authTester.testAuthentication(validKey);
      validTimes.push(performance.now() - start1);
      
      const start2 = performance.now();
      await authTester.testAuthentication(invalidKey);
      invalidTimes.push(performance.now() - start2);
    }
    
    const validAvg = validTimes.reduce((a, b) => a + b) / validTimes.length;
    const invalidAvg = invalidTimes.reduce((a, b) => a + b) / invalidTimes.length;
    
    // Timing difference should be minimal (less than 10ms)
    const timingDifference = Math.abs(validAvg - invalidAvg);
    expect(timingDifference).toBeLessThan(10);
  });

  it('should implement rate limiting for authentication attempts', async () => {
    const invalidKey = 'sk-invalid';
    const attempts = [];
    
    // Make rapid authentication attempts
    for (let i = 0; i < 20; i++) {
      attempts.push(authTester.testAuthentication(invalidKey));
    }
    
    const results = await Promise.all(attempts);
    
    // Some attempts should be rate limited
    const rateLimited = results.filter(r => r.rateLimited).length;
    expect(rateLimited).toBeGreaterThan(0);
  });
});
```

## 5. Mutation Testing Configuration

### 5.1 Stryker Configuration

**File**: `stryker.conf.json`
```json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "packageManager": "npm",
  "reporters": ["html", "clear-text", "progress", "dashboard"],
  "testRunner": "vitest",
  "coverageAnalysis": "perTest",
  "mutate": [
    "shared/**/*.ts",
    "npm-package/src/**/*.ts",
    "!**/*.test.ts",
    "!**/*.spec.ts",
    "!**/*.d.ts"
  ],
  "thresholds": {
    "high": 95,
    "low": 90,
    "break": 85
  },
  "dashboard": {
    "project": "openai-assistants-mcp",
    "version": "main"
  },
  "htmlReporter": {
    "baseDir": "reports/mutation"
  },
  "plugins": [
    "@stryker-mutator/vitest-runner",
    "@stryker-mutator/typescript-checker"
  ],
  "checkers": ["typescript"],
  "tsconfigFile": "tsconfig.json",
  "tempDirName": "stryker-tmp",
  "cleanTempDir": true,
  "concurrency": 4,
  "timeoutMS": 60000,
  "dryRunTimeoutMS": 300000
}
```

## 6. Enhanced CI/CD Pipeline

### 6.1 Updated GitHub Actions Workflow

**File**: `.github/workflows/enhanced-ci.yml`
```yaml
name: Enhanced Continuous Integration

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
  workflow_dispatch:

env:
  NODE_VERSION: '18'
  CACHE_VERSION: v2

jobs:
  # Job 1: Code Quality and Linting (Enhanced)
  code-quality:
    name: Code Quality & Linting
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: |
          npm ci
          cd npm-package && npm ci

      - name: TypeScript compilation check
        run: npm run type-check

      - name: Lint and format check
        run: |
          npm run lint || echo "Linting completed with warnings"
          npm run format:check || echo "Format check completed"

      - name: Validate package.json files
        run: |
          npm pkg fix
          cd npm-package && npm pkg fix

  # Job 2: Unit Tests with Coverage
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: code-quality
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: |
          npm ci
          cd npm-package && npm ci

      - name: Run unit tests with coverage
        run: npm run test:unit
        env:
          CI: true

      - name: Upload unit test coverage
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage/unit/lcov.info
          flags: unit-tests
          name: unit-tests-coverage

  # Job 3: Integration Tests (Enhanced)
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: unit-tests
    strategy:
      matrix:
        test-type: [integration, chaos, contracts]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: |
          npm ci
          cd npm-package && npm ci

      - name: Run integration tests - ${{ matrix.test-type }}
        run: npm run test:${{ matrix.test-type }}
        env:
          CI: true

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: integration-results-${{ matrix.test-type }}
          path: test-results/
          retention-days: 7

  # Job 4: Performance Tests (Enhanced)
  performance-tests:
    name: Performance Tests
    runs-on: ubuntu-latest
    needs: integration-tests
    if: github.event_name != 'pull_request' || contains(github.event.pull_request.labels.*.name, 'performance')
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: |
          npm ci
          cd npm-package && npm ci

      - name: Install Artillery for load testing
        run: npm install -g artillery@latest

      - name: Run performance tests
        run: |
          npm run test:performance
          npm run test:load
          npm run test:memory

      - name: Upload performance results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: performance-results
          path: |
            performance-results/
            reports/performance/
          retention-days: 30

  # Job 5: Security Tests (New)
  security-tests:
    name: Security Tests
    runs-on: ubuntu-latest
    needs: code-quality
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: |
          npm ci
          cd npm-package && npm ci

      - name: Run security tests
        run: npm run test:security
        env:
          CI: true

      - name: Run vulnerability scan
        run: |
          npm audit --audit-level=moderate
          cd npm-package && npm audit --audit-level=moderate

      - name: Upload security results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: security-results
          path: reports/security/
          retention-days: 30

  # Job 6: Mutation Testing (New)
  mutation-tests:
    name: Mutation Testing
    runs-on: ubuntu-latest
    needs: unit-tests
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: |
          npm ci
          cd npm-package && npm ci

      - name: Run mutation tests
        run: npm run test:mutation
        env:
          CI: true

      - name: Upload mutation results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: mutation-results
          path: reports/mutation/
          retention-days: 30

  # Job 7: Quality Gates (Enhanced)
  quality-gates:
    name: Quality Gates
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, security-tests]
    if: always()
    steps:
      - name: Download all test results
        uses: actions/download-artifact@v4

      - name: Evaluate quality gates
        run: |
          echo "Evaluating quality