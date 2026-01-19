/**
 * Common Middleware Stack
 * Reusable middleware configuration for Lambda handlers
 */

import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import httpCors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import logger from '../lib/logger/index.js';
import { errors } from '../utils/response.js';

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
 * Handles both custom Lambda authorizer and Cognito JWT authorizer
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
 * @param {Function} handler - Lambda handler function
 * @param {object} options - Middleware options
 */
const withMiddleware = (handler, options = {}) => {
    const { requireAuth = true } = options;

    let wrapped = middy(handler)
        .use(requestLogger())
        .use(httpJsonBodyParser({ disableContentTypeError: true }))
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

export {
    withMiddleware,
    requestLogger,
    errorLogger,
    authContext,
};
