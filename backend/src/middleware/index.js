/**
 * Common Middleware Stack
 * Reusable middleware configuration for Lambda handlers
 */

const middy = require('@middy/core');
const httpJsonBodyParser = require('@middy/http-json-body-parser');
const httpCors = require('@middy/http-cors');
const httpErrorHandler = require('@middy/http-error-handler');
const logger = require('../lib/logger');
const { errors } = require('../utils/response');

/**
 * Error handling middleware
 */
const errorLogger = () => ({
    onError: async (request) => {
        const { error } = request;
        logger.error('Unhandled error', {
            error: error.message,
            stack: error.stack,
            requestId: request.context.awsRequestId,
        });
    },
});

/**
 * Request logging middleware
 */
const requestLogger = () => ({
    before: async (request) => {
        request.internal = { startTime: Date.now() };
        logger.request(request.event, request.context);
    },
    after: async (request) => {
        const duration = Date.now() - request.internal.startTime;
        logger.response(
            request.response?.statusCode || 200,
            request.context.awsRequestId,
            duration
        );
    },
});

/**
 * Extract user info from authorization context
 */
const authContext = () => ({
    before: async (request) => {
        const { authorizer } = request.event.requestContext || {};
        if (authorizer) {
            request.event.user = {
                id: authorizer.userId,
                username: authorizer.username,
                role: authorizer.role,
                permissions: authorizer.permissions ? JSON.parse(authorizer.permissions) : [],
            };
        }
    },
});

/**
 * Apply standard middleware stack to a handler
 * @param {Function} handler - Lambda handler function
 * @param {object} options - Middleware options
 */
const withMiddleware = (handler, options = {}) => {
    const { requireAuth = true } = options;

    let wrapped = middy(handler)
        .use(requestLogger())
        .use(httpJsonBodyParser())
        .use(httpCors({
            origin: '*',
            credentials: true,
        }));

    if (requireAuth) {
        wrapped = wrapped.use(authContext());
    }

    wrapped = wrapped
        .use(errorLogger())
        .use(httpErrorHandler({
            fallbackMessage: 'Internal server error',
        }));

    return wrapped;
};

module.exports = {
    withMiddleware,
    requestLogger,
    errorLogger,
    authContext,
};
