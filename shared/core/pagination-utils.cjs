/**
 * CommonJS version of Pagination Utilities for NPM package compatibility
 * 
 * This file provides CommonJS-compatible versions of the pagination utilities
 * that can be used by the NPM package while maintaining the same functionality
 * as the TypeScript version.
 */

/**
 * Default pagination configuration
 */
const PAGINATION_DEFAULTS = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1
};

/**
 * Validate pagination parameters
 */
function validatePaginationParams(params) {
  const errors = [];
  
  if (params.limit !== undefined) {
    if (typeof params.limit !== 'number' || params.limit < PAGINATION_DEFAULTS.MIN_LIMIT) {
      errors.push(`Limit must be a number >= ${PAGINATION_DEFAULTS.MIN_LIMIT}`);
    }
    if (params.limit > PAGINATION_DEFAULTS.MAX_LIMIT) {
      errors.push(`Limit must be <= ${PAGINATION_DEFAULTS.MAX_LIMIT}`);
    }
  }
  
  if (params.cursor !== undefined && typeof params.cursor !== 'string') {
    errors.push('Cursor must be a string');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Paginate an array of items
 */
function paginateArray(items, params = {}) {
  const limit = params.limit || PAGINATION_DEFAULTS.DEFAULT_LIMIT;
  const cursor = params.cursor;
  
  // Validate parameters
  const validation = validatePaginationParams({ limit, cursor });
  if (!validation.isValid) {
    throw new Error(`Invalid pagination parameters: ${validation.errors.join(', ')}`);
  }
  
  let startIndex = 0;
  
  // If cursor is provided, find the starting index
  if (cursor) {
    try {
      const cursorData = JSON.parse(Buffer.from(cursor, 'base64').toString());
      startIndex = cursorData.offset || 0;
    } catch (error) {
      throw new Error('Invalid cursor format');
    }
  }
  
  // Calculate end index
  const endIndex = Math.min(startIndex + limit, items.length);
  
  // Get the page items
  const pageItems = items.slice(startIndex, endIndex);
  
  // Generate next cursor if there are more items
  let nextCursor = null;
  if (endIndex < items.length) {
    const nextCursorData = { offset: endIndex };
    nextCursor = Buffer.from(JSON.stringify(nextCursorData)).toString('base64');
  }
  
  return {
    items: pageItems,
    nextCursor,
    hasMore: endIndex < items.length,
    totalCount: items.length,
    pageSize: pageItems.length
  };
}

/**
 * Create pagination metadata for logging/debugging
 */
function createPaginationMetadata(params, result) {
  return {
    requestedLimit: params.limit || PAGINATION_DEFAULTS.DEFAULT_LIMIT,
    actualPageSize: result.pageSize,
    hasMore: result.hasMore,
    totalCount: result.totalCount,
    nextCursor: result.nextCursor ? 'present' : 'none'
  };
}

/**
 * Create a cursor from an offset
 */
function createCursor(offset) {
  const cursorData = { offset };
  return Buffer.from(JSON.stringify(cursorData)).toString('base64');
}

/**
 * Parse a cursor to get the offset
 */
function parseCursor(cursor) {
  try {
    const cursorData = JSON.parse(Buffer.from(cursor, 'base64').toString());
    return cursorData.offset || 0;
  } catch (error) {
    throw new Error('Invalid cursor format');
  }
}

module.exports = {
  PAGINATION_DEFAULTS,
  validatePaginationParams,
  paginateArray,
  createPaginationMetadata,
  createCursor,
  parseCursor
};