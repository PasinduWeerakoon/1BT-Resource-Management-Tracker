/**
 * Centralized Logging Utility
 * Provides structured logging that only works in development mode
 * All logs are automatically disabled in production builds
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Log levels enum
 */
export const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

/**
 * Logger class
 */
class Logger {
  constructor() {
    this.enabled = isDevelopment;
  }

  /**
   * Enable or disable logging
   * @param {boolean} enabled - Whether logging should be enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Format log message with timestamp and level
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {any} data - Additional data to log
   * @returns {string} Formatted log message
   */
  formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (data !== undefined) {
      return `${prefix} ${message}`, data;
    }
    return `${prefix} ${message}`;
  }

  /**
   * Debug level logging
   * @param {string} message - Log message
   * @param {any} data - Additional data to log
   */
  debug(message, data) {
    if (!this.enabled) return;
    if (data !== undefined) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message), data);
    } else {
      console.debug(this.formatMessage(LogLevel.DEBUG, message));
    }
  }

  /**
   * Info level logging
   * @param {string} message - Log message
   * @param {any} data - Additional data to log
   */
  info(message, data) {
    if (!this.enabled) return;
    if (data !== undefined) {
      console.info(this.formatMessage(LogLevel.INFO, message), data);
    } else {
      console.info(this.formatMessage(LogLevel.INFO, message));
    }
  }

  /**
   * Warning level logging
   * @param {string} message - Log message
   * @param {any} data - Additional data to log
   */
  warn(message, data) {
    if (!this.enabled) return;
    if (data !== undefined) {
      console.warn(this.formatMessage(LogLevel.WARN, message), data);
    } else {
      console.warn(this.formatMessage(LogLevel.WARN, message));
    }
  }

  /**
   * Error level logging
   * Always logs errors, even in production (but can be disabled)
   * @param {string} message - Log message
   * @param {Error|any} error - Error object or additional data
   */
  error(message, error) {
    // Errors are important, but we can still control them
    if (!this.enabled && process.env.NODE_ENV === 'production') {
      // In production, you might want to send errors to an error tracking service
      // For now, we'll just skip console logging
      return;
    }

    if (error instanceof Error) {
      console.error(this.formatMessage(LogLevel.ERROR, message), error);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    } else if (error !== undefined) {
      console.error(this.formatMessage(LogLevel.ERROR, message), error);
    } else {
      console.error(this.formatMessage(LogLevel.ERROR, message));
    }
  }

  /**
   * Log API request
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {any} data - Request data
   */
  logRequest(method, url, data) {
    if (!this.enabled) return;
    this.debug(`API Request: ${method} ${url}`, data);
  }

  /**
   * Log API response
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {any} response - Response data
   */
  logResponse(method, url, response) {
    if (!this.enabled) return;
    this.debug(`API Response: ${method} ${url}`, response);
  }

  /**
   * Log API error
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {Error} error - Error object
   */
  logApiError(method, url, error) {
    this.error(`API Error: ${method} ${url}`, error);
  }
}

// Create singleton instance
const logger = new Logger();

// Export singleton instance and class
export default logger;
export { Logger };

// Export convenience functions
export const logDebug = (message, data) => logger.debug(message, data);
export const logInfo = (message, data) => logger.info(message, data);
export const logWarn = (message, data) => logger.warn(message, data);
export const logError = (message, error) => logger.error(message, error);
export const logRequest = (method, url, data) => logger.logRequest(method, url, data);
export const logResponse = (method, url, response) => logger.logResponse(method, url, response);
export const logApiError = (method, url, error) => logger.logApiError(method, url, error);
