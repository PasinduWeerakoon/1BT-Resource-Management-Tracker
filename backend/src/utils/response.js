/**
 * HTTP Response Utilities
 * Standardized API response formatting
 */

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
    'Content-Type': 'application/json',
};

/**
 * Create a successful response
 * @param {object} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {object} meta - Additional metadata (pagination, etc.)
 */
const success = (data, statusCode = 200, meta = {}) => {
    const body = {
        success: true,
        data,
        ...meta,
    };

    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify(body),
    };
};

/**
 * Create an error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {string} code - Error code for client handling
 * @param {object} details - Additional error details
 */
const error = (message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) => {
    const body = {
        success: false,
        error: {
            message,
            code,
            ...(details && { details }),
        },
    };

    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify(body),
    };
};

/**
 * Common error responses
 */
const errors = {
    badRequest: (message = 'Bad request', details = null) =>
        error(message, 400, 'BAD_REQUEST', details),

    unauthorized: (message = 'Unauthorized') =>
        error(message, 401, 'UNAUTHORIZED'),

    forbidden: (message = 'Forbidden') =>
        error(message, 403, 'FORBIDDEN'),

    notFound: (resource = 'Resource') =>
        error(`${resource} not found`, 404, 'NOT_FOUND'),

    conflict: (message = 'Resource already exists') =>
        error(message, 409, 'CONFLICT'),

    validationError: (details) =>
        error('Validation failed', 422, 'VALIDATION_ERROR', details),

    internalError: (message = 'Internal server error') =>
        error(message, 500, 'INTERNAL_ERROR'),
};

/**
 * Create a paginated response
 * @param {Array} items - Result items
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 */
const paginated = (items, total, page, limit) => {
    return success(items, 200, {
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
        },
    });
};

/**
 * Create a created response (201)
 * @param {object} data - Created resource
 */
const created = (data) => success(data, 201);

/**
 * Create a no content response (204)
 */
const noContent = () => ({
    statusCode: 204,
    headers: CORS_HEADERS,
    body: '',
});

// Export individual functions as they are defined
export {
    success,
    error,
    errors,
    paginated,
    created,
    noContent,
    CORS_HEADERS
};
