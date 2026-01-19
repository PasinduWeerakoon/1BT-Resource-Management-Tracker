/**
 * Structured Logger
 * Shared across all microservices
 * Compatible with pino-style API (supports child loggers)
 */

import config from '../config/index.js';

const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};

const currentLevel = LOG_LEVELS[config.logging?.level] ?? LOG_LEVELS.info;

/**
 * Create a log entry with structured format
 */
const createLogEntry = (level, message, meta = {}, baseMeta = {}) => {
    return {
        timestamp: new Date().toISOString(),
        level,
        message,
        service: meta.service || baseMeta.service || '1bt-resource-management',
        environment: config.env,
        ...baseMeta,
        ...meta,
    };
};

/**
 * Create a logger instance with optional base metadata
 */
const createLogger = (baseMeta = {}) => {
    const logger = {
        error: (message, meta = {}) => {
            if (LOG_LEVELS.error <= currentLevel) {
                console.error(JSON.stringify(createLogEntry('ERROR', message, meta, baseMeta)));
            }
        },

        warn: (message, meta = {}) => {
            if (LOG_LEVELS.warn <= currentLevel) {
                console.warn(JSON.stringify(createLogEntry('WARN', message, meta, baseMeta)));
            }
        },

        info: (message, meta = {}) => {
            if (LOG_LEVELS.info <= currentLevel) {
                console.info(JSON.stringify(createLogEntry('INFO', message, meta, baseMeta)));
            }
        },

        debug: (message, meta = {}) => {
            if (LOG_LEVELS.debug <= currentLevel) {
                console.debug(JSON.stringify(createLogEntry('DEBUG', message, meta, baseMeta)));
            }
        },

        /**
         * Create a child logger with additional base metadata (pino-style API)
         */
        child: (childMeta = {}) => {
            return createLogger({ ...baseMeta, ...childMeta });
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
    };

    return logger;
};

// Export a default logger instance
export default createLogger();
