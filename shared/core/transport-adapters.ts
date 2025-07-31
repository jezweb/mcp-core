/**
 * Transport Adapters for Different Deployment Targets
 * 
 * These adapters handle deployment-specific transport logic while keeping
 * the core MCP protocol handling unified in BaseMCPHandler.
 */

import {
  MCPRequest,
  MCPResponse,
  MCPError,
  ErrorCodes,
  createStandardErrorResponse,
} from '../types/index.js';
import { TransportAdapter } from './base-mcp-handler.js';

/**
 * HTTP Transport Adapter for Cloudflare Workers
 * 
 * Handles HTTP-specific request/response processing for the Cloudflare Workers deployment.
 * This includes CORS handling, HTTP status code mapping, and request validation.
 */
export class CloudflareWorkerTransportAdapter implements TransportAdapter {
  async preprocessRequest(request: MCPRequest): Promise<MCPRequest> {
    // HTTP transport doesn't need special preprocessing for MCP requests
    // The Worker already handles HTTP -> JSON conversion
    return request;
  }

  async postprocessResponse(response: MCPResponse): Promise<MCPResponse> {
    // HTTP transport doesn't need special postprocessing
    // The Worker handles JSON -> HTTP conversion
    return response;
  }

  formatError(error: MCPError, requestId: string | number | null): MCPResponse {
    // JSON-RPC 2.0 compliant error format for HTTP transport
    return createStandardErrorResponse(requestId, error.code, error.message, error.data);
  }
}

/**
 * Stdio Transport Adapter for NPM Package
 * 
 * Handles stdio-specific processing for the NPM package deployment.
 * This includes line-based protocol handling and stdio-specific error formatting.
 */
export class StdioTransportAdapter implements TransportAdapter {
  async preprocessRequest(request: MCPRequest): Promise<MCPRequest> {
    // Validate JSON-RPC 2.0 format for stdio transport
    if (request.jsonrpc !== '2.0') {
      throw new MCPError(ErrorCodes.INVALID_REQUEST, 'Invalid JSON-RPC version');
    }
    return request;
  }

  async postprocessResponse(response: MCPResponse): Promise<MCPResponse> {
    // Ensure response is properly formatted for stdio
    return response;
  }

  formatError(error: MCPError, requestId: string | number | null): MCPResponse {
    // JSON-RPC 2.0 compliant error formatting for stdio
    return createStandardErrorResponse(requestId, error.code, error.message, error.data);
  }
}

/**
 * Proxy Transport Adapter for NPM Package Cloudflare Proxy Mode
 * 
 * Handles forwarding requests to the Cloudflare Worker when the NPM package
 * is configured to use proxy mode instead of direct OpenAI API calls.
 */
export class ProxyTransportAdapter implements TransportAdapter {
  private cloudflareWorkerUrl: string;

  constructor(cloudflareWorkerUrl: string) {
    this.cloudflareWorkerUrl = cloudflareWorkerUrl;
  }

  async preprocessRequest(request: MCPRequest): Promise<MCPRequest> {
    // For proxy mode, we'll handle the forwarding in a special way
    // Mark the request as needing proxy forwarding
    (request as any)._proxyForward = true;
    return request;
  }

  async postprocessResponse(response: MCPResponse): Promise<MCPResponse> {
    return response;
  }

  formatError(error: MCPError, requestId: string | number | null): MCPResponse {
    // JSON-RPC 2.0 compliant error formatting for proxy mode
    return createStandardErrorResponse(requestId, error.code, error.message, error.data);
  }

  /**
   * Forward request to Cloudflare Worker
   */
  async forwardToCloudflareWorker(request: MCPRequest): Promise<MCPResponse> {
    try {
      const response = await fetch(this.cloudflareWorkerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json() as MCPResponse;
      return result;
    } catch (error) {
      throw new MCPError(
        ErrorCodes.INTERNAL_ERROR,
        'Proxy request failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
}

/**
 * Local Development Transport Adapter
 * 
 * Handles local development specific processing, including enhanced debugging
 * and development-specific optimizations.
 */
export class LocalDevTransportAdapter implements TransportAdapter {
  private debug: boolean;

  constructor(debug: boolean = false) {
    this.debug = debug;
  }

  async preprocessRequest(request: MCPRequest): Promise<MCPRequest> {
    if (this.debug) {
      console.log('[LocalDev] Processing request:', request.method);
    }
    return request;
  }

  async postprocessResponse(response: MCPResponse): Promise<MCPResponse> {
    if (this.debug) {
      console.log('[LocalDev] Sending response for ID:', response.id);
    }
    return response;
  }

  formatError(error: MCPError, requestId: string | number | null): MCPResponse {
    if (this.debug) {
      console.error('[LocalDev] Error:', error.message);
      if (error.data) {
        console.error('[LocalDev] Error data:', error.data);
      }
    }
    
    // JSON-RPC 2.0 compliant error formatting for local development
    return createStandardErrorResponse(requestId, error.code, error.message, error.data);
  }
}