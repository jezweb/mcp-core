/**
 * URL Path Parser Utility - Multi-Provider Routing
 * 
 * This module provides utilities for parsing URL paths to extract provider information
 * for multi-provider routing in the Jezweb MCP Core system.
 * 
 * Key Features:
 * - Extract provider name from URL path
 * - Validate provider names
 * - Rewrite request paths for internal routing
 * - Support for known providers (openai, gemini, anthropic)
 */

/**
 * Supported provider names for multi-provider routing
 */
export type SupportedProvider = 'openai' | 'gemini' | 'anthropic' | string;

/**
 * URL parsing result
 */
export interface UrlParseResult {
  /** Original URL path */
  originalPath: string;
  /** Extracted provider name */
  provider?: SupportedProvider;
  /** Rewritten path without provider segment */
  rewrittenPath: string;
  /** Whether the path matches the MCP pattern */
  isMcpPath: boolean;
}

/**
 * Parse URL path to extract provider information
 * 
 * @param urlPath - The URL path to parse (e.g., '/mcp/openai/tools/list')
 * @returns Parsed URL information
 */
export function parseProviderFromPath(urlPath: string): UrlParseResult {
  const result: UrlParseResult = {
    originalPath: urlPath,
    rewrittenPath: urlPath,
    isMcpPath: false
  };

  // Check if this is an MCP path
  if (!urlPath.startsWith('/mcp/')) {
    return result;
  }

  result.isMcpPath = true;

  // Extract provider from path: /mcp/{provider}/...
  const pathSegments = urlPath.split('/').filter(segment => segment.length > 0);
  
  // Expected format: ['', 'mcp', 'provider', ...rest]
  // Only set provider if we have at least 3 segments (mcp, provider, and at least one more)
  if (pathSegments.length >= 3 && pathSegments[0] === 'mcp') {
    const provider = pathSegments[1].toLowerCase();
    // Only set provider if it's a valid format and not just "tools" or similar generic terms
    if (isValidProviderFormat(provider) && provider !== 'tools' && provider !== 'list' && provider !== 'call') {
      result.provider = provider;
      
      // Rewrite path by removing the provider segment
      // /mcp/openai/tools/list -> /mcp/tools/list
      const restSegments = pathSegments.slice(2);
      result.rewrittenPath = '/mcp/' + restSegments.join('/');
    } else {
      // If no valid provider, keep the original path as rewritten path
      result.rewrittenPath = urlPath;
    }
  }

  return result;
}

/**
 * Validate if a provider is supported
 *
 * @param provider - Provider name to validate
 * @returns Whether the provider is supported
 */
export function isSupportedProvider(provider: string): provider is SupportedProvider {
  if (!provider || typeof provider !== 'string') {
    return false;
  }
  
  const trimmedProvider = provider.trim();
  // Check if the provider format is valid first
  if (!isValidProviderFormat(trimmedProvider)) {
    return false;
  }
  
  const supportedProviders: SupportedProvider[] = ['openai', 'gemini', 'anthropic'];
  return supportedProviders.includes(trimmedProvider as SupportedProvider);
}

/**
 * Validate provider name format
 *
 * @param provider - Provider name to validate
 * @returns Whether the provider name format is valid
 */
export function isValidProviderFormat(provider: string): boolean {
  if (!provider || typeof provider !== 'string') {
    return false;
  }
  
  // Provider names should be lowercase alphanumeric with hyphens/underscores only
  return /^[a-z0-9_-]+$/.test(provider.trim());
}

/**
 * Get the default provider if none is specified
 * 
 * @returns Default provider name
 */
export function getDefaultProvider(): SupportedProvider {
  return 'openai';
}