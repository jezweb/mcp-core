import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',
    
    // Global setup and teardown
    globalSetup: './test/setup/global-setup.js',
    setupFiles: ['./test/setup/test-setup.js'],
    
    // Test isolation
    isolate: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
    
    // Test patterns
    include: [
      'test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'test/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'test/integration/**/*.js',
      'test/performance/**/*.js',
      'test/error-handling/**/*.js',
      'test/edge-cases/**/*.js',
      'test/deployment/**/*.js'
    ],
    exclude: [
      'node_modules',
      'dist',
      '.git',
      'test/fixtures',
      'test/utils',
      'test/config'
    ],
    
    // Timeouts
    testTimeout: 30000,
    hookTimeout: 10000,
    
    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        'packages/*/test{,s}/**',
        '**/*.d.ts',
        'cypress/**',
        'test{,s}/**',
        'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
        '**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}',
        '**/*{.,-}spec.{js,cjs,mjs,ts,tsx,jsx}',
        '**/__tests__/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
        '**/.{eslint,mocha,prettier}rc.{js,cjs,yml}'
      ]
    },
    
    // Reporters
    reporter: ['verbose', 'json'],
    outputFile: {
      json: './test/reports/vitest-results.json'
    },
    
    // Mock handling
    clearMocks: true,
    restoreMocks: true,
    
    // Retry failed tests
    retry: 2,
    
    // Concurrent tests
    maxConcurrency: 5,
    
    // Watch mode
    watch: false,
    
    // Environment variables
    env: {
      NODE_ENV: 'test',
      VITEST: 'true'
    }
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@shared': path.resolve(__dirname, './shared'),
      '@core': path.resolve(__dirname, './core'),
      '@test': path.resolve(__dirname, './test')
    }
  },
  
  // Define global constants
  define: {
    __TEST__: true,
    __DEV__: false
  }
});