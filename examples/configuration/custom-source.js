/**
 * Custom Configuration Source Example
 * 
 * This example demonstrates how to create and integrate custom configuration sources,
 * including external APIs, databases, and custom file formats.
 */

import { ConfigurationSystem, ConfigurationSource } from '../../shared/config/index.js';
import { EventEmitter } from 'events';

// Custom Configuration Source Implementation
class DatabaseConfigurationSource extends ConfigurationSource {
  constructor(connectionString, options = {}) {
    super('database', options);
    this.connectionString = connectionString;
    this.pollInterval = options.pollInterval || 30000;
    this.cache = new Map();
    this.lastSync = null;
    this.isConnected = false;
  }

  async initialize() {
    console.log('🔌 Initializing database configuration source...');
    
    // Simulate database connection
    await this.simulateConnection();
    this.isConnected = true;
    
    // Start polling for changes
    this.startPolling();
    
    console.log('✅ Database configuration source initialized');
  }

  async simulateConnection() {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mock database with configuration data
    this.mockDatabase = {
      configurations: {
        'server.name': 'Custom Database Server',
        'server.port': 3000,
        'server.environment': 'production',
        'deployment.type': 'database-driven',
        'deployment.debug': false,
        'runtime.hotReload': true,
        'runtime.configRefreshInterval': 60000,
        'features.advancedLogging': true,
        'features.metrics': true,
        'database.maxConnections': 100,
        'database.timeout': 5000
      },
      metadata: {
        lastUpdated: new Date().toISOString(),
        version: '1.2.3',
        environment: 'production'
      }
    };
  }

  async load() {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    console.log('📥 Loading configuration from database...');
    
    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const config = this.transformDatabaseConfig(this.mockDatabase.configurations);
    this.lastSync = new Date();
    
    console.log('✅ Configuration loaded from database');
    return config;
  }

  transformDatabaseConfig(dbConfig) {
    const config = {};
    
    for (const [key, value] of Object.entries(dbConfig)) {
      const keyParts = key.split('.');
      let current = config;
      
      for (let i = 0; i < keyParts.length - 1; i++) {
        if (!current[keyParts[i]]) {
          current[keyParts[i]] = {};
        }
        current = current[keyParts[i]];
      }
      
      current[keyParts[keyParts.length - 1]] = value;
    }
    
    return config;
  }

  async save(config) {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    console.log('💾 Saving configuration to database...');
    
    // Transform config back to flat structure
    const flatConfig = this.flattenConfig(config);
    
    // Update mock database
    this.mockDatabase.configurations = {
      ...this.mockDatabase.configurations,
      ...flatConfig
    };
    this.mockDatabase.metadata.lastUpdated = new Date().toISOString();
    
    // Simulate database write
    await new Promise(resolve => setTimeout(resolve, 75));
    
    console.log('✅ Configuration saved to database');
    this.emit('configurationSaved', config);
  }

  flattenConfig(obj, prefix = '') {
    const flattened = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenConfig(value, fullKey));
      } else {
        flattened[fullKey] = value;
      }
    }
    
    return flattened;
  }

  startPolling() {
    this.pollTimer = setInterval(async () => {
      try {
        const currentConfig = await this.load();
        this.emit('configurationChanged', currentConfig);
      } catch (error) {
        console.error('❌ Error polling database:', error.message);
      }
    }, this.pollInterval);
  }

  async cleanup() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
    this.isConnected = false;
    console.log('🧹 Database configuration source cleaned up');
  }
}

// Custom API Configuration Source
class APIConfigurationSource extends ConfigurationSource {
  constructor(apiUrl, apiKey, options = {}) {
    super('api', options);
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  async initialize() {
    console.log('🌐 Initializing API configuration source...');
    
    // Validate API connection
    await this.validateConnection();
    
    console.log('✅ API configuration source initialized');
  }

  async validateConnection() {
    // Simulate API health check
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mock successful validation
    console.log('🔍 API connection validated');
  }

  async load() {
    console.log('📡 Loading configuration from API...');
    
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const config = await this.fetchFromAPI();
        console.log('✅ Configuration loaded from API');
        return config;
      } catch (error) {
        lastError = error;
        console.log(`⚠️ API attempt ${attempt} failed: ${error.message}`);
        
        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }
    
    throw new Error(`Failed to load from API after ${this.retryAttempts} attempts: ${lastError.message}`);
  }

  async fetchFromAPI() {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Mock API response
    return {
      server: {
        name: 'API-Driven Server',
        port: 8080,
        environment: 'cloud'
      },
      deployment: {
        type: 'api-managed',
        debug: false,
        region: 'us-east-1'
      },
      runtime: {
        hotReload: false,
        configRefreshInterval: 120000
      },
      api: {
        version: 'v2',
        rateLimit: 1000,
        timeout: 10000
      }
    };
  }

  async save(config) {
    console.log('📤 Saving configuration to API...');
    
    // Simulate API POST request
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('✅ Configuration saved to API');
    this.emit('configurationSaved', config);
  }
}

// Custom File Format Source (YAML)
class YAMLConfigurationSource extends ConfigurationSource {
  constructor(filePath, options = {}) {
    super('yaml', options);
    this.filePath = filePath;
    this.watchFile = options.watchFile !== false;
  }

  async initialize() {
    console.log('📄 Initializing YAML configuration source...');
    
    if (this.watchFile) {
      this.setupFileWatcher();
    }
    
    console.log('✅ YAML configuration source initialized');
  }

  setupFileWatcher() {
    // Simulate file watching
    console.log('👁️ Setting up YAML file watcher...');
    
    // Mock file change detection
    this.watchTimer = setInterval(() => {
      // Randomly trigger file change (for demo)
      if (Math.random() < 0.1) {
        console.log('📝 YAML file changed, reloading...');
        this.load().then(config => {
          this.emit('configurationChanged', config);
        }).catch(console.error);
      }
    }, 5000);
  }

  async load() {
    console.log('📖 Loading YAML configuration...');
    
    // Simulate YAML parsing
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Mock YAML content
    const yamlConfig = {
      server: {
        name: 'YAML-Configured Server',
        port: 4000,
        environment: 'development'
      },
      deployment: {
        type: 'yaml-based',
        debug: true,
        logLevel: 'debug'
      },
      runtime: {
        hotReload: true,
        configRefreshInterval: 10000
      },
      yaml: {
        version: '1.1',
        strict: true,
        indentation: 2
      }
    };
    
    console.log('✅ YAML configuration loaded');
    return yamlConfig;
  }

  async save(config) {
    console.log('💾 Saving YAML configuration...');
    
    // Simulate YAML serialization and file write
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('✅ YAML configuration saved');
    this.emit('configurationSaved', config);
  }

  async cleanup() {
    if (this.watchTimer) {
      clearInterval(this.watchTimer);
    }
    console.log('🧹 YAML configuration source cleaned up');
  }
}

async function customSourceExample() {
  console.log('🔧 Custom Configuration Source Example\n');

  // Initialize configuration system
  const configSystem = new ConfigurationSystem();
  await configSystem.initialize();

  // 1. Register Custom Sources
  console.log('1. Registering custom configuration sources...');
  
  const dbSource = new DatabaseConfigurationSource('postgresql://localhost:5432/config', {
    pollInterval: 15000
  });
  
  const apiSource = new APIConfigurationSource('https://api.example.com/config', 'api-key-123', {
    retryAttempts: 2,
    retryDelay: 500
  });
  
  const yamlSource = new YAMLConfigurationSource('./config.yaml', {
    watchFile: true
  });
  
  // Register sources with the configuration system
  configSystem.registerSource('database', dbSource);
  configSystem.registerSource('api', apiSource);
  configSystem.registerSource('yaml', yamlSource);
  
  console.log('✅ Custom sources registered');
  console.log('');

  // 2. Initialize Custom Sources
  console.log('2. Initializing custom sources...');
  
  await dbSource.initialize();
  await apiSource.initialize();
  await yamlSource.initialize();
  
  console.log('✅ All custom sources initialized');
  console.log('');

  // 3. Load Configuration from Each Source
  console.log('3. Loading configurations from custom sources...');
  
  const configurations = {};
  
  try {
    configurations.database = await dbSource.load();
    console.log('📊 Database config loaded:', Object.keys(configurations.database).join(', '));
  } catch (error) {
    console.log('❌ Database load failed:', error.message);
  }
  
  try {
    configurations.api = await apiSource.load();
    console.log('🌐 API config loaded:', Object.keys(configurations.api).join(', '));
  } catch (error) {
    console.log('❌ API load failed:', error.message);
  }
  
  try {
    configurations.yaml = await yamlSource.load();
    console.log('📄 YAML config loaded:', Object.keys(configurations.yaml).join(', '));
  } catch (error) {
    console.log('❌ YAML load failed:', error.message);
  }
  
  console.log('');

  // 4. Configuration Merging Strategy
  console.log('4. Implementing configuration merging strategy...');
  
  // Define merge priority: YAML (highest) -> API -> Database (lowest)
  const mergedConfig = {
    ...configurations.database,
    ...configurations.api,
    ...configurations.yaml
  };
  
  console.log('🔀 Configuration merge completed');
  console.log('📋 Final server name:', mergedConfig.server?.name);
  console.log('📋 Final server port:', mergedConfig.server?.port);
  console.log('📋 Final environment:', mergedConfig.server?.environment);
  console.log('');

  // 5. Apply Merged Configuration
  console.log('5. Applying merged configuration...');
  
  await configSystem.updateConfiguration(mergedConfig);
  
  const currentConfig = configSystem.getConfiguration();
  console.log('✅ Configuration applied successfully');
  console.log('📊 Active server name:', currentConfig.server?.name);
  console.log('📊 Active deployment type:', currentConfig.deployment?.type);
  console.log('');

  // 6. Source-Specific Updates
  console.log('6. Demonstrating source-specific updates...');
  
  // Update database configuration
  const dbUpdate = {
    ...configurations.database,
    server: {
      ...configurations.database.server,
      name: 'Updated Database Server'
    },
    database: {
      ...configurations.database.database,
      maxConnections: 200
    }
  };
  
  await dbSource.save(dbUpdate);
  console.log('💾 Database configuration updated');
  
  // Update API configuration
  const apiUpdate = {
    ...configurations.api,
    api: {
      ...configurations.api.api,
      rateLimit: 2000
    }
  };
  
  await apiSource.save(apiUpdate);
  console.log('💾 API configuration updated');
  console.log('');

  // 7. Source Change Detection
  console.log('7. Setting up source change detection...');
  
  let changeCount = 0;
  
  dbSource.on('configurationChanged', (config) => {
    changeCount++;
    console.log(`🔄 Database configuration changed (${changeCount})`);
  });
  
  apiSource.on('configurationSaved', (config) => {
    console.log('💾 API configuration save event received');
  });
  
  yamlSource.on('configurationChanged', (config) => {
    console.log('📝 YAML configuration file changed');
  });
  
  console.log('👂 Change listeners registered');
  console.log('');

  // 8. Source Health Monitoring
  console.log('8. Monitoring source health...');
  
  const sourceHealth = {
    database: {
      connected: dbSource.isConnected,
      lastSync: dbSource.lastSync,
      status: dbSource.isConnected ? 'healthy' : 'disconnected'
    },
    api: {
      connected: true,
      retryAttempts: apiSource.retryAttempts,
      status: 'healthy'
    },
    yaml: {
      watching: yamlSource.watchFile,
      filePath: yamlSource.filePath,
      status: 'healthy'
    }
  };
  
  console.log('🏥 Source health status:');
  for (const [source, health] of Object.entries(sourceHealth)) {
    console.log(`   ${source}: ${health.status}`);
  }
  console.log('');

  // 9. Configuration Source Fallback
  console.log('9. Implementing configuration source fallback...');
  
  const fallbackChain = ['yaml', 'api', 'database'];
  let fallbackConfig = null;
  
  for (const sourceName of fallbackChain) {
    try {
      const source = configSystem.getSource(sourceName);
      if (source) {
        fallbackConfig = await source.load();
        console.log(`✅ Fallback successful using ${sourceName} source`);
        break;
      }
    } catch (error) {
      console.log(`⚠️ Fallback failed for ${sourceName}: ${error.message}`);
    }
  }
  
  if (fallbackConfig) {
    console.log('🛡️ Fallback configuration available');
  } else {
    console.log('❌ All fallback sources failed');
  }
  console.log('');

  // 10. Source Performance Comparison
  console.log('10. Comparing source performance...');
  
  const performanceResults = {};
  
  for (const [name, config] of Object.entries(configurations)) {
    const startTime = Date.now();
    
    try {
      // Simulate reload
      const source = configSystem.getSource(name);
      if (source) {
        await source.load();
      }
      
      performanceResults[name] = {
        loadTime: Date.now() - startTime,
        success: true
      };
    } catch (error) {
      performanceResults[name] = {
        loadTime: Date.now() - startTime,
        success: false,
        error: error.message
      };
    }
  }
  
  console.log('⚡ Source performance results:');
  for (const [source, result] of Object.entries(performanceResults)) {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${source}: ${status} ${result.loadTime}ms`);
  }
  console.log('');

  // 11. Cleanup
  console.log('11. Cleaning up custom sources...');
  
  await dbSource.cleanup();
  await yamlSource.cleanup();
  
  console.log('🧹 Custom sources cleaned up');
  console.log('');

  console.log('🎉 Custom configuration source example completed successfully!');
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  customSourceExample().catch(console.error);
}

export { customSourceExample, DatabaseConfigurationSource, APIConfigurationSource, YAMLConfigurationSource };