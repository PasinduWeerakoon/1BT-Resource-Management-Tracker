/**
 * Structured Logger
 * Shared across all microservices
 */

import config from '../config/index.js';

const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};

const currentLevel = LOG_LEVELS[config.logging.level] ?? LOG_LEVELS.info;

/**
 * Create a log entry with structured format
 */
const createLogEntry = (level, message, meta = {}) => {
    return {
        timestamp: new Date().toISOString(),
        level,
        message,
        service: meta.service || '1bt-resource-management',
        environment: config.env,
        ...meta,
    };
};

/**
 * Logger instance
 */
const logger = {
    error: (message, meta = {}) => {
        if (LOG_LEVELS.error <= currentLevel) {
            console.error(JSON.stringify(createLogEntry('ERROR', message, meta)));
        }
    },

    warn: (message, meta = {}) => {
        if (LOG_LEVELS.warn <= currentLevel) {
            console.warn(JSON.stringify(createLogEntry('WARN', message, meta)));
        }
    },

    info: (message, meta = {}) => {
        if (LOG_LEVELS.info <= currentLevel) {
            console.info(JSON.stringify(createLogEntry('INFO', message, meta)));
        }
    },

    debug: (message, meta = {}) => {
        if (LOG_LEVELS.debug <= currentLevel) {
            console.debug(JSON.stringify(createLogEntry('DEBUG', message, meta)));
        }
    },

    /**
     * Log an HTTP request
     */
    request: (event, context, serviceName = 'api') => {
        logger.info('Incoming request', {
            service: serviceName,
            requestId: context.awsRequestId,
            method: event.httpMethod || event.requestContext?.http?.method,
            path: event.path || event.rawPath,
            queryParams: event.queryStringParameters,
            userAgent: event.headers?.['User-Agent'] || event.headers?.['user-agent'],
            sourceIp: event.requestContext?.identity?.sourceIp || event.requestContext?.http?.sourceIp,
        });
    },

    /**
     * Log an HTTP response
     */
    response: (statusCode, requestId, duration, serviceName = 'api') => {
        logger.info('Request completed', {
            service: serviceName,
            requestId,
            statusCode,
            durationMs: duration,
        });
    },

    /**
     * Create a child logger with additional context
     */
    child: (context = {}) => {
        return {
            error: (message, meta = {}) => logger.error(message, { ...context, ...meta }),
            warn: (message, meta = {}) => logger.warn(message, { ...context, ...meta }),
            info: (message, meta = {}) => logger.info(message, { ...context, ...meta }),
            debug: (message, meta = {}) => logger.debug(message, { ...context, ...meta }),
            child: (additionalContext = {}) => logger.child({ ...context, ...additionalContext }),
        };
    },
};

export default logger;
