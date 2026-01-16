/**
 * Structured Logger
 * Provides consistent logging format for Lambda functions
 */

const config = require('../../config');

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
        service: '1bt-resource-management',
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
    request: (event, context) => {
        logger.info('Incoming request', {
            requestId: context.awsRequestId,
            method: event.httpMethod,
            path: event.path,
            queryParams: event.queryStringParameters,
            userAgent: event.headers?.['User-Agent'] || event.headers?.['user-agent'],
            sourceIp: event.requestContext?.identity?.sourceIp,
        });
    },

    /**
     * Log an HTTP response
     */
    response: (statusCode, requestId, duration) => {
        logger.info('Request completed', {
            requestId,
            statusCode,
            durationMs: duration,
        });
    },
};

module.exports = logger;
