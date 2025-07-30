/**
 * Cloudflare-specific Types
 * 
 * This module contains types specific to the Cloudflare Workers deployment.
 * Consolidates 5 lines of Cloudflare-specific type definitions.
 */

// Cloudflare Workers environment types
export interface Env {
  OPENAI_API_KEY: string;
}