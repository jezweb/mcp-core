/**
 * Pagination Utilities - Cursor-based pagination helpers for MCP compliance
 *
 * This module provides utilities for implementing cursor-based pagination
 * across all MCP list methods (tools/list, resources/list, prompts/list).
 *
 * Features:
 * - Base64-encoded cursor generation and parsing
 * - Consistent pagination logic across all endpoints
 * - Edge case handling (invalid cursors, end of results)
 * - Type-safe pagination interfaces
 */
import { MCPError, ErrorCodes } from '../types/index.js';
/**
 * Default pagination settings
 */
export const PAGINATION_DEFAULTS = {
    /** Default page size */
    DEFAULT_LIMIT: 10,
    /** Maximum page size */
    MAX_LIMIT: 50,
    /** Minimum page size */
    MIN_LIMIT: 1,
    /** Cursor expiration time (1 hour) */
    CURSOR_EXPIRY_MS: 60 * 60 * 1000,
};
/**
 * Encode pagination cursor to base64 string
 */
export function encodeCursor(cursor) {
    try {
        const json = JSON.stringify(cursor);
        return Buffer.from(json, 'utf-8').toString('base64');
    }
    catch (error) {
        throw new MCPError(ErrorCodes.INTERNAL_ERROR, 'Failed to encode pagination cursor', { cursor, error: error instanceof Error ? error.message : 'Unknown error' });
    }
}
/**
 * Decode pagination cursor from base64 string
 */
export function decodeCursor(cursorString) {
    try {
        const json = Buffer.from(cursorString, 'base64').toString('utf-8');
        const cursor = JSON.parse(json);
        // Validate cursor structure
        if (typeof cursor.index !== 'number' ||
            typeof cursor.total !== 'number' ||
            typeof cursor.timestamp !== 'number') {
            throw new Error('Invalid cursor structure');
        }
        // Check if cursor is expired
        const now = Date.now();
        if (now - cursor.timestamp > PAGINATION_DEFAULTS.CURSOR_EXPIRY_MS) {
            throw new Error('Cursor has expired');
        }
        return cursor;
    }
    catch (error) {
        throw new MCPError(ErrorCodes.INVALID_PARAMS, 'Invalid pagination cursor', {
            cursor: cursorString,
            error: error instanceof Error ? error.message : 'Unknown error',
            hint: 'Cursor may be malformed, expired, or from a different session'
        });
    }
}
/**
 * Validate pagination parameters
 */
export function validatePaginationParams(params) {
    // Validate and normalize limit
    let limit = params.limit ?? PAGINATION_DEFAULTS.DEFAULT_LIMIT;
    if (limit < PAGINATION_DEFAULTS.MIN_LIMIT) {
        limit = PAGINATION_DEFAULTS.MIN_LIMIT;
    }
    else if (limit > PAGINATION_DEFAULTS.MAX_LIMIT) {
        limit = PAGINATION_DEFAULTS.MAX_LIMIT;
    }
    // Determine start index from cursor
    let startIndex = 0;
    if (params.cursor) {
        const cursor = decodeCursor(params.cursor);
        startIndex = cursor.index;
        // Validate cursor index
        if (startIndex < 0) {
            throw new MCPError(ErrorCodes.INVALID_PARAMS, 'Invalid cursor: negative index', { cursor: params.cursor, index: startIndex });
        }
    }
    return { limit, startIndex };
}
/**
 * Paginate an array of items
 */
export function paginateArray(items, params) {
    const total = items.length;
    const { limit, startIndex } = validatePaginationParams(params);
    // Handle edge case: start index beyond array length
    if (startIndex >= total) {
        return {
            items: [],
            total,
            hasMore: false
        };
    }
    // Calculate end index
    const endIndex = Math.min(startIndex + limit, total);
    const pageItems = items.slice(startIndex, endIndex);
    // Determine if there are more results
    const hasMore = endIndex < total;
    // Generate next cursor if needed
    let nextCursor;
    if (hasMore) {
        const nextCursorData = {
            index: endIndex,
            total,
            timestamp: Date.now()
        };
        nextCursor = encodeCursor(nextCursorData);
    }
    return {
        items: pageItems,
        nextCursor,
        total,
        hasMore
    };
}
/**
 * Create pagination metadata for logging/debugging
 */
export function createPaginationMetadata(params, result) {
    return {
        requestedLimit: params.limit,
        actualLimit: result.items.length,
        cursor: params.cursor,
        nextCursor: result.nextCursor,
        total: result.total,
        hasMore: result.hasMore,
        timestamp: new Date().toISOString()
    };
}
/**
 * Helper to create first page cursor for a collection
 */
export function createFirstPageCursor(total) {
    const cursor = {
        index: 0,
        total,
        timestamp: Date.now()
    };
    return encodeCursor(cursor);
}
/**
 * Helper to check if pagination is needed for a collection
 */
export function isPaginationNeeded(totalItems, limit = PAGINATION_DEFAULTS.DEFAULT_LIMIT) {
    return totalItems > limit;
}
/**
 * Helper to get pagination summary for logging
 */
export function getPaginationSummary(params, result) {
    const { limit, startIndex } = validatePaginationParams(params);
    const endIndex = startIndex + result.items.length;
    return `Page ${Math.floor(startIndex / limit) + 1}: items ${startIndex + 1}-${endIndex} of ${result.total}`;
}
