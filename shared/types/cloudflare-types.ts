/**
 * Cloudflare-specific Types
 * 
 * This module contains types specific to the Cloudflare Workers deployment.
 * Consolidates 5 lines of Cloudflare-specific type definitions.
 */

// Cloudflare Workers environment types
export interface Env {
  // Required API key from Cloudflare Secrets
  OPENAI_API_KEY: string;
  
  // Configuration from wrangler.toml [vars]
  SERVER_NAME?: string;
  SERVER_VERSION?: string;
  DEBUG?: string;
  
  // Environment-specific variables
  ENVIRONMENT?: string;
  NODE_ENV?: string;
  LOG_LEVEL?: string;
  DEPLOYMENT_REGION?: string;
}