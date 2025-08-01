/**
 * CommonJS version of Transport Adapters for NPM package compatibility
 * 
 * This file provides CommonJS-compatible versions of the transport adapters
 * that can be used by the NPM package while maintaining the same functionality
 * as the TypeScript version.
 */

/**
 * Base transport adapter interface
 */
class TransportAdapter {
  async preprocessRequest(request) {
    return request;
  }

  async postprocessResponse(response) {
    return response;
  }

  formatError(error, requestId) {
    return {
      jsonrpc: '2.0',
      id: requestId,
      error: {
        code: error.code,
        message: error.message,
        data: error.data,
      },
    };
  }
}

/**
 * HTTP Transport Adapter for web-based deployments
 */
class HTTPTransportAdapter extends TransportAdapter {
  constructor(options = {}) {
    super();
    this.options = {
      corsEnabled: true,
      maxRequestSize: 1024 * 1024, // 1MB
      timeout: 30000, // 30 seconds
      ...options
    };
  }

  async preprocessRequest(request) {
    // Add HTTP-specific preprocessing
    if (this.options.validateContentType) {
      // Validate content type if needed
    }
    
    return request;
  }

  async postprocessResponse(response) {
    // Add HTTP-specific headers if needed
    if (this.options.corsEnabled) {
      // CORS headers would be handled at the HTTP layer
    }
    
    return response;
  }
}

/**
 * Stdio Transport Adapter for command-line/NPM package deployments
 */
class StdioTransportAdapter extends TransportAdapter {
  constructor(options = {}) {
    super();
    this.options = {
      bufferSize: 64 * 1024, // 64KB
      encoding: 'utf8',
      ...options
    };
  }

  async preprocessRequest(request) {
    // Add stdio-specific preprocessing
    // Ensure request is properly formatted for stdio
    return request;
  }

  async postprocessResponse(response) {
    // Add stdio-specific postprocessing
    // Ensure response is properly formatted for stdio output
    return response;
  }

  formatError(error, requestId) {
    // Stdio-specific error formatting
    return {
      jsonrpc: '2.0',
      id: requestId,
      error: {
        code: error.code,
        message: error.message,
        data: error.data,
      },
    };
  }
}

/**
 * Cloudflare Worker Transport Adapter for Workers deployments
 */
class CloudflareWorkerTransportAdapter extends TransportAdapter {
  constructor(options = {}) {
    super();
    this.options = {
      edgeOptimized: true,
      cacheEnabled: false,
      ...options
    };
  }

  async preprocessRequest(request) {
    // Add Cloudflare Workers-specific preprocessing
    // Handle edge-specific optimizations
    return request;
  }

  async postprocessResponse(response) {
    // Add Cloudflare Workers-specific postprocessing
    // Handle edge caching if enabled
    if (this.options.cacheEnabled) {
      // Add cache headers
    }
    
    return response;
  }

  formatError(error, requestId) {
    // Workers-specific error formatting
    return {
      jsonrpc: '2.0',
      id: requestId,
      error: {
        code: error.code,
        message: error.message,
        data: {
          ...error.data,
          edge: true,
          timestamp: new Date().toISOString()
        },
      },
    };
  }
}

/**
 * Request Router for handling different request types
 */
class RequestRouter {
  constructor() {
    this.routes = new Map();
  }

  addRoute(method, handler) {
    this.routes.set(method, handler);
  }

  async route(request) {
    const handler = this.routes.get(request.method);
    if (!handler) {
      throw new Error(`No handler found for method: ${request.method}`);
    }
    return await handler(request);
  }
}

/**
 * Proxy Transport Adapter for forwarding requests
 */
class ProxyTransportAdapter extends TransportAdapter {
  constructor(targetUrl, options = {}) {
    super();
    this.targetUrl = targetUrl;
    this.options = {
      timeout: 30000,
      retries: 3,
      ...options
    };
  }

  async preprocessRequest(request) {
    // Add proxy-specific preprocessing
    return request;
  }

  async forwardRequest(request) {
    // Forward request to target URL
    const response = await fetch(this.targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Proxy request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }
}

/**
 * Local Development Transport Adapter
 */
class LocalDevTransportAdapter extends TransportAdapter {
  constructor(options = {}) {
    super();
    this.options = {
      debugMode: true,
      verboseLogging: true,
      ...options
    };
  }

  async preprocessRequest(request) {
    if (this.options.verboseLogging) {
      console.log('[LocalDev] Incoming request:', JSON.stringify(request, null, 2));
    }
    return request;
  }

  async postprocessResponse(response) {
    if (this.options.verboseLogging) {
      console.log('[LocalDev] Outgoing response:', JSON.stringify(response, null, 2));
    }
    return response;
  }

  formatError(error, requestId) {
    if (this.options.debugMode) {
      console.error('[LocalDev] Error:', error);
    }
    
    return {
      jsonrpc: '2.0',
      id: requestId,
      error: {
        code: error.code,
        message: error.message,
        data: {
          ...error.data,
          debug: this.options.debugMode,
          stack: error.stack
        },
      },
    };
  }
}

module.exports = {
  TransportAdapter,
  HTTPTransportAdapter,
  StdioTransportAdapter,
  CloudflareWorkerTransportAdapter,
  RequestRouter,
  ProxyTransportAdapter,
  LocalDevTransportAdapter
};