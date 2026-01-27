/**
 * Common Middleware Stack
 * Shared across all microservices
 */

import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import httpCors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import logger from '../logger/index.js';

/**
 * Error logging middleware
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
const requestLogger = (serviceName = 'api') => ({
    before: async (request) => {
        request.internal = { startTime: Date.now() };
        logger.request(request.event, request.context, serviceName);
    },
    after: async (request) => {
        const duration = Date.now() - request.internal.startTime;
        logger.response(
            request.response?.statusCode || 200,
            request.context.awsRequestId,
            duration,
            serviceName
        );
    },
});

/**
 * Extract user info from authorization context
 */
const authContext = () => ({
    before: async (request) => {
        const requestContext = request.event.requestContext || {};
        const authorizer = requestContext.authorizer || {};

        // JWT Authorizer (HTTP API with Cognito)
        if (authorizer.jwt?.claims) {
            const claims = authorizer.jwt.claims;
            request.event.user = {
                id: claims.sub,
                email: claims.email,
                username: claims['cognito:username'] || claims.email,
                role: claims['custom:role'] || 'User',
                groups: claims['cognito:groups'] || [],
            };
            return;
        }

        // Cognito Authorizer (REST API)
        if (authorizer.claims) {
            request.event.user = {
                id: authorizer.claims.sub,
                email: authorizer.claims.email,
                username: authorizer.claims['cognito:username'] || authorizer.claims.email,
                role: authorizer.claims['custom:role'] || 'User',
                groups: authorizer.claims['cognito:groups'] || [],
            };
            return;
        }

        // Custom Lambda Authorizer
        if (authorizer.userId) {
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
 */
const withMiddleware = (handler, options = {}) => {
    const { requireAuth = true, serviceName = 'api', parseBody = true } = options;

    let wrapped = middy(handler)
        .use(requestLogger(serviceName));

    // Only parse body for non-GET methods
    if (parseBody) {
        wrapped = wrapped.use(httpJsonBodyParser({
            disableContentTypeError: true,
            // Skip body parsing for GET, DELETE, OPTIONS, HEAD requests
        }));
    }

    wrapped = wrapped.use(httpCors({
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

export { withMiddleware, requestLogger, errorLogger, authContext };
export { auditMiddleware, auditAction, sanitizeValues } from './audit.js';
