/**
 * HTTP Response Utilities
 * Shared across all microservices
 */

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
    'Content-Type': 'application/json',
};

/**
 * Create a successful response
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
 * Supports two call signatures:
 * 1. error(message, statusCode, code, details) - explicit error
 * 2. error(message, err) - auto-detect from Error object
 */
const error = (message, statusCodeOrError = 500, code = 'INTERNAL_ERROR', details = null) => {
    let statusCode = 500;
    let errorCode = code;
    let errorDetails = details;
    let errorMessage = message;

    // If second argument is an Error object, auto-detect the error type
    if (statusCodeOrError instanceof Error || (typeof statusCodeOrError === 'object' && statusCodeOrError !== null && statusCodeOrError.message)) {
        const err = statusCodeOrError;
        const errMsg = err.message || '';

        // Map common database errors to proper status codes
        if (errMsg.includes('duplicate key') || errMsg.includes('unique constraint') || errMsg.includes('already exists')) {
            statusCode = 409;
            errorCode = 'CONFLICT';
            errorMessage = message || 'Resource already exists';
            errorDetails = errMsg;
        } else if (errMsg.includes('foreign key') || errMsg.includes('violates foreign key constraint')) {
            statusCode = 400;
            errorCode = 'FOREIGN_KEY_VIOLATION';
            errorMessage = message || 'Referenced resource does not exist';
            errorDetails = errMsg;
        } else if (errMsg.includes('not found') || errMsg.includes('does not exist')) {
            statusCode = 404;
            errorCode = 'NOT_FOUND';
            errorMessage = message || 'Resource not found';
            errorDetails = errMsg;
        } else if (errMsg.includes('validation') || errMsg.includes('invalid') || errMsg.includes('required')) {
            statusCode = 400;
            errorCode = 'VALIDATION_ERROR';
            errorMessage = message || 'Validation failed';
            errorDetails = errMsg;
        } else if (errMsg.includes('permission') || errMsg.includes('forbidden') || errMsg.includes('not allowed')) {
            statusCode = 403;
            errorCode = 'FORBIDDEN';
            errorMessage = message || 'Access denied';
            errorDetails = errMsg;
        } else if (errMsg.includes('unauthorized') || errMsg.includes('authentication')) {
            statusCode = 401;
            errorCode = 'UNAUTHORIZED';
            errorMessage = message || 'Authentication required';
            errorDetails = errMsg;
        } else if (errMsg.includes('timeout') || errMsg.includes('timed out')) {
            statusCode = 504;
            errorCode = 'TIMEOUT';
            errorMessage = message || 'Request timed out';
            errorDetails = errMsg;
        } else if (errMsg.includes('column') && errMsg.includes('does not exist')) {
            statusCode = 500;
            errorCode = 'DATABASE_SCHEMA_ERROR';
            errorMessage = message || 'Database schema error';
            errorDetails = errMsg;
        } else if (errMsg.includes('syntax error')) {
            statusCode = 500;
            errorCode = 'DATABASE_QUERY_ERROR';
            errorMessage = message || 'Database query error';
            errorDetails = errMsg;
        } else {
            // Default to 500 for unknown errors but include the message
            statusCode = 500;
            errorCode = 'INTERNAL_ERROR';
            errorDetails = errMsg;
        }
    } else if (typeof statusCodeOrError === 'number') {
        statusCode = statusCodeOrError;
    }

    const body = {
        success: false,
        error: {
            message: errorMessage,
            code: errorCode,
            ...(errorDetails && { details: errorDetails }),
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

export { success, error, errors, paginated, created, noContent, CORS_HEADERS };

// Also export common error helpers directly for convenience
export const notFound = errors.notFound;
export const validationError = errors.validationError;
export const conflict = errors.conflict;
export const badRequest = errors.badRequest;
export const unauthorized = errors.unauthorized;
export const forbidden = errors.forbidden;
export const internalError = errors.internalError;
