/**
 * Provider Registry System - MVP Implementation
 *
 * Simplified registry for managing LLM providers with minimal complexity.
 * This is a Minimum Viable Product focused on core functionality.
 *
 * MVP Features:
 * - Basic provider registration and retrieval
 * - Simple default provider selection
 * - Essential configuration support
 *
 * Advanced features (commented out for future implementation):
 * - Health monitoring, complex selection strategies, dynamic management
 */
import { 
// MVP: Advanced features - implement later
// LLMProviderStatus,
// LLMProviderError,
createProviderError, } from './llm-service.js';
import { MCPError, ErrorCodes, } from '../types/index.js';
// MVP: Advanced features - implement later
// /**
//  * Provider Selection Strategy
//  */
// export type ProviderSelectionStrategy =
//   | 'default'           // Use configured default provider
//   | 'priority'          // Use highest priority available provider
//   | 'round-robin'       // Rotate between available providers
//   | 'capability-based'  // Select based on required capabilities
//   | 'health-based';     // Select healthiest provider
// /**
//  * Provider Selection Context
//  */
// export interface ProviderSelectionContext {
//   /** Required capabilities for the operation */
//   requiredCapabilities?: string[];
//   /** Preferred provider name */
//   preferredProvider?: string;
//   /** Selection strategy to use */
//   strategy?: ProviderSelectionStrategy;
//   /** Operation type (for capability-based selection) */
//   operationType?: string;
//   /** Additional context metadata */
//   metadata?: Record<string, any>;
// }
// /**
//  * Registry Statistics
//  */
// export interface RegistryStatistics {
//   /** Total number of registered providers */
//   totalProviders: number;
//   /** Number of available providers */
//   availableProviders: number;
//   /** Number of healthy providers */
//   healthyProviders: number;
//   /** Current default provider */
//   defaultProvider?: string;
//   /** Provider status summary */
//   providerStatus: Record<string, LLMProviderStatus>;
//   /** Last registry update timestamp */
//   lastUpdated: Date;
// }
// /**
//  * Provider Registry Events
//  */
// export interface ProviderRegistryEvents {
//   /** Provider registered */
//   'provider:registered': (metadata: LLMProviderMetadata) => void;
//   /** Provider unregistered */
//   'provider:unregistered': (providerName: string) => void;
//   /** Provider status changed */
//   'provider:status-changed': (providerName: string, status: LLMProviderStatus) => void;
//   /** Default provider changed */
//   'default-provider:changed': (oldProvider?: string, newProvider?: string) => void;
//   /** Registry error occurred */
//   'registry:error': (error: Error) => void;
// }
/**
 * MVP Provider Registry Class
 * Simplified provider management focused on core functionality
 */
export class ProviderRegistry {
    providers = new Map();
    factories = new Map();
    configs = new Map();
    // MVP: Advanced features - implement later
    // private status = new Map<string, LLMProviderStatus>();
    // private healthCheckIntervals = new Map<string, NodeJS.Timeout>();
    // private eventListeners = new Map<keyof ProviderRegistryEvents, Function[]>();
    config;
    initialized = false;
    // MVP: Advanced features - implement later
    // private roundRobinIndex = 0;
    constructor(config) {
        this.config = {
            defaultProvider: config.defaultProvider || '',
            providers: config.providers || [],
            // MVP: Advanced features - implement later
            // enableHealthChecks: config.enableHealthChecks ?? true,
            // healthCheckInterval: config.healthCheckInterval ?? 60000, // 1 minute
            // maxRetryAttempts: config.maxRetryAttempts ?? 3,
            // retryDelay: config.retryDelay ?? 5000, // 5 seconds
        };
    }
    /**
     * MVP Initialize the registry with configured providers
     */
    async initialize() {
        if (this.initialized) {
            throw new MCPError(ErrorCodes.INTERNAL_ERROR, 'Provider registry already initialized');
        }
        try {
            // Initialize configured providers
            for (const providerConfig of this.config.providers) {
                if (providerConfig.enabled !== false) {
                    await this.initializeProvider(providerConfig);
                }
            }
            // Set default provider if not specified
            if (!this.config.defaultProvider && this.providers.size > 0) {
                const firstProvider = Array.from(this.providers.keys())[0];
                this.config.defaultProvider = firstProvider;
                // MVP: Advanced features - implement later
                // this.emit('default-provider:changed', undefined, firstProvider);
            }
            // MVP: Advanced features - implement later
            // // Start health checks if enabled
            // if (this.config.enableHealthChecks) {
            //   this.startHealthChecks();
            // }
            this.initialized = true;
        }
        catch (error) {
            // MVP: Advanced features - implement later
            // this.emit('registry:error', error as Error);
            throw new MCPError(ErrorCodes.INTERNAL_ERROR, `Failed to initialize provider registry: ${error instanceof Error ? error.message : 'Unknown error'}`, { originalError: error });
        }
    }
    /**
     * Register a provider factory
     */
    registerFactory(factory) {
        const metadata = factory.getMetadata();
        this.factories.set(metadata.name, factory);
    }
    /**
     * MVP Register a provider instance directly
     */
    async registerProvider(provider, config) {
        const metadata = provider.metadata;
        // Validate provider
        if (!await provider.validateConnection()) {
            throw createProviderError(metadata.name, 'Provider failed connection validation', undefined, ErrorCodes.INTERNAL_ERROR);
        }
        // Store provider and config
        this.providers.set(metadata.name, provider);
        if (config) {
            this.configs.set(metadata.name, config);
        }
        // MVP: Advanced features - implement later
        // // Initialize status
        // this.status.set(metadata.name, {
        //   name: metadata.name,
        //   available: true,
        //   healthy: true,
        //   lastHealthCheck: new Date(),
        // });
        // Set as default if none exists
        if (!this.config.defaultProvider) {
            this.config.defaultProvider = metadata.name;
            // MVP: Advanced features - implement later
            // this.emit('default-provider:changed', undefined, metadata.name);
        }
        // MVP: Advanced features - implement later
        // this.emit('provider:registered', metadata);
    }
    // MVP: Advanced features - implement later
    // /**
    //  * Unregister a provider
    //  */
    // async unregisterProvider(providerName: string): Promise<void> {
    //   if (!this.providers.has(providerName)) {
    //     throw new MCPError(ErrorCodes.NOT_FOUND, `Provider not found: ${providerName}`);
    //   }
    //   // Stop health checks
    //   const interval = this.healthCheckIntervals.get(providerName);
    //   if (interval) {
    //     clearInterval(interval);
    //     this.healthCheckIntervals.delete(providerName);
    //   }
    //   // Remove provider data
    //   this.providers.delete(providerName);
    //   this.configs.delete(providerName);
    //   this.status.delete(providerName);
    //   // Update default provider if necessary
    //   if (this.config.defaultProvider === providerName) {
    //     const remainingProviders = Array.from(this.providers.keys());
    //     const newDefault = remainingProviders.length > 0 ? remainingProviders[0] : undefined;
    //     this.config.defaultProvider = newDefault || '';
    //     this.emit('default-provider:changed', providerName, newDefault);
    //   }
    //   this.emit('provider:unregistered', providerName);
    // }
    /**
     * Get a provider by name
     */
    getProvider(providerName) {
        return this.providers.get(providerName);
    }
    /**
     * Get the default provider
     */
    getDefaultProvider() {
        if (!this.config.defaultProvider) {
            return undefined;
        }
        return this.providers.get(this.config.defaultProvider);
    }
    /**
     * MVP Select a provider - simplified to default selection only
     */
    selectProvider() {
        // MVP: Simplified to only return default provider
        const defaultProvider = this.getDefaultProvider();
        if (!defaultProvider) {
            // Fallback to first available provider
            const availableProviders = Array.from(this.providers.values());
            if (availableProviders.length === 0) {
                throw new MCPError(ErrorCodes.INTERNAL_ERROR, 'No available providers');
            }
            return availableProviders[0];
        }
        return defaultProvider;
    }
    // MVP: Advanced features - implement later
    // /**
    //  * Select a provider based on context and strategy
    //  */
    // selectProvider(context: ProviderSelectionContext = {}): LLMProvider {
    //   const strategy = context.strategy || 'default';
    //   const availableProviders = this.getAvailableProviders();
    //   if (availableProviders.length === 0) {
    //     throw new MCPError(ErrorCodes.INTERNAL_ERROR, 'No available providers');
    //   }
    //   let selectedProvider: LLMProvider | undefined;
    //   switch (strategy) {
    //     case 'default':
    //       selectedProvider = this.getDefaultProvider();
    //       break;
    //     case 'priority':
    //       selectedProvider = this.selectByPriority(availableProviders);
    //       break;
    //     case 'round-robin':
    //       selectedProvider = this.selectRoundRobin(availableProviders);
    //       break;
    //     case 'capability-based':
    //       selectedProvider = this.selectByCapabilities(availableProviders, context.requiredCapabilities || []);
    //       break;
    //     case 'health-based':
    //       selectedProvider = this.selectByHealth(availableProviders);
    //       break;
    //     default:
    //       selectedProvider = this.getDefaultProvider();
    //   }
    //   // Fallback to preferred provider if specified
    //   if (!selectedProvider && context.preferredProvider) {
    //     selectedProvider = this.providers.get(context.preferredProvider);
    //   }
    //   // Final fallback to first available provider
    //   if (!selectedProvider) {
    //     selectedProvider = availableProviders[0];
    //   }
    //   if (!selectedProvider) {
    //     throw new MCPError(ErrorCodes.INTERNAL_ERROR, 'No suitable provider found');
    //   }
    //   return selectedProvider;
    // }
    // MVP: Advanced features - implement later
    // /**
    //  * Get all available (healthy) providers
    //  */
    // getAvailableProviders(): LLMProvider[] {
    //   return Array.from(this.providers.entries())
    //     .filter(([name]) => {
    //       const status = this.status.get(name);
    //       return status?.available && status?.healthy;
    //     })
    //     .map(([, provider]) => provider);
    // }
    // /**
    //  * Get provider status
    //  */
    // getProviderStatus(providerName: string): LLMProviderStatus | undefined {
    //   return this.status.get(providerName);
    // }
    // /**
    //  * Get all provider statuses
    //  */
    // getAllProviderStatuses(): Record<string, LLMProviderStatus> {
    //   const statuses: Record<string, LLMProviderStatus> = {};
    //   for (const [name, status] of this.status.entries()) {
    //     statuses[name] = status;
    //   }
    //   return statuses;
    // }
    // /**
    //  * Get registry statistics
    //  */
    // getStatistics(): RegistryStatistics {
    //   const statuses = this.getAllProviderStatuses();
    //   const availableCount = Object.values(statuses).filter(s => s.available).length;
    //   const healthyCount = Object.values(statuses).filter(s => s.healthy).length;
    //   return {
    //     totalProviders: this.providers.size,
    //     availableProviders: availableCount,
    //     healthyProviders: healthyCount,
    //     defaultProvider: this.config.defaultProvider,
    //     providerStatus: statuses,
    //     lastUpdated: new Date(),
    //   };
    // }
    /**
     * MVP Set default provider
     */
    setDefaultProvider(providerName) {
        if (!this.providers.has(providerName)) {
            throw new MCPError(ErrorCodes.NOT_FOUND, `Provider not found: ${providerName}`);
        }
        this.config.defaultProvider = providerName;
        // MVP: Advanced features - implement later
        // const oldDefault = this.config.defaultProvider;
        // this.emit('default-provider:changed', oldDefault, providerName);
    }
    // MVP: Advanced features - implement later
    // /**
    //  * Event listener management
    //  */
    // on<K extends keyof ProviderRegistryEvents>(event: K, listener: ProviderRegistryEvents[K]): void {
    //   if (!this.eventListeners.has(event)) {
    //     this.eventListeners.set(event, []);
    //   }
    //   this.eventListeners.get(event)!.push(listener);
    // }
    // off<K extends keyof ProviderRegistryEvents>(event: K, listener: ProviderRegistryEvents[K]): void {
    //   const listeners = this.eventListeners.get(event);
    //   if (listeners) {
    //     const index = listeners.indexOf(listener);
    //     if (index > -1) {
    //       listeners.splice(index, 1);
    //     }
    //   }
    // }
    /**
     * MVP Shutdown the registry
     */
    async shutdown() {
        // MVP: Advanced features - implement later
        // // Stop all health checks
        // for (const interval of this.healthCheckIntervals.values()) {
        //   clearInterval(interval);
        // }
        // this.healthCheckIntervals.clear();
        // Clear all data
        this.providers.clear();
        this.factories.clear();
        this.configs.clear();
        // MVP: Advanced features - implement later
        // this.status.clear();
        // this.eventListeners.clear();
        this.initialized = false;
    }
    /**
     * Private Methods
     */
    async initializeProvider(config) {
        const factory = this.factories.get(config.provider);
        if (!factory) {
            throw new MCPError(ErrorCodes.NOT_FOUND, `Provider factory not found: ${config.provider}`);
        }
        // Validate configuration
        if (!factory.validateConfig(config.config)) {
            throw new MCPError(ErrorCodes.INVALID_PARAMS, `Invalid configuration for provider: ${config.provider}`);
        }
        // Create and initialize provider
        const provider = await factory.create(config.config);
        await provider.initialize(config.config);
        // Register the provider
        await this.registerProvider(provider, config);
    }
}
/**
 * Global provider registry instance
 */
let globalRegistry;
/**
 * Get or create the global provider registry
 */
export function getGlobalProviderRegistry() {
    if (!globalRegistry) {
        throw new MCPError(ErrorCodes.INTERNAL_ERROR, 'Global provider registry not initialized. Call initializeGlobalProviderRegistry() first.');
    }
    return globalRegistry;
}
/**
 * Initialize the global provider registry
 */
export function initializeGlobalProviderRegistry(config) {
    if (globalRegistry) {
        throw new MCPError(ErrorCodes.INTERNAL_ERROR, 'Global provider registry already initialized');
    }
    globalRegistry = new ProviderRegistry(config);
    return globalRegistry;
}
/**
 * Shutdown the global provider registry
 */
export async function shutdownGlobalProviderRegistry() {
    if (globalRegistry) {
        await globalRegistry.shutdown();
        globalRegistry = undefined;
    }
}
