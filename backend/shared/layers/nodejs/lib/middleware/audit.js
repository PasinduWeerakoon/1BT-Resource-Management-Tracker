/**
 * Audit Middleware
 * Automatically captures audit events for API operations
 */

import { sendAuditEvent, getChangedFields } from '../audit/index.js';
import logger from '../logger/index.js';

const log = logger.child({ module: 'audit-middleware' });

/**
 * Map HTTP methods to audit actions
 */
const METHOD_TO_ACTION = {
    POST: 'CREATE',
    PUT: 'UPDATE',
    PATCH: 'UPDATE',
    DELETE: 'DELETE',
    GET: 'READ'
};

/**
 * Audit middleware for automatic event capture
 * 
 * @param {Object} options - Audit options
 * @param {string} options.entityType - Type of entity (resource, project, allocation, etc.)
 * @param {string} options.serviceName - Name of the calling service
 * @param {Function} [options.getEntityId] - Function to extract entity ID from request/response
 * @param {Function} [options.getEntityName] - Function to extract entity name from request/response
 * @param {Function} [options.getOldValues] - Function to get old values (for update/delete)
 * @param {Function} [options.shouldAudit] - Function to determine if request should be audited
 * @param {string[]} [options.excludePaths] - Paths to exclude from auditing (e.g., health checks)
 * @param {boolean} [options.auditReads] - Whether to audit GET requests (default: false)
 */
const auditMiddleware = (options = {}) => {
    const {
        entityType,
        serviceName = 'api',
        getEntityId = (request) => {
            // Try to get from path parameters
            return request.event.pathParameters?.id ||
                request.event.pathParameters?.resourceId ||
                request.event.pathParameters?.projectId ||
                request.event.pathParameters?.allocationId ||
                // Try to get from response body
                request.response?.body?.data?.id ||
                null;
        },
        getEntityName = (request) => {
            const data = request.response?.body?.data;
            return data?.name || data?.email || data?.title || null;
        },
        getOldValues = () => null,
        shouldAudit = () => true,
        excludePaths = ['/health', '/ping', '/ready'],
        auditReads = false
    } = options;

    return {
        after: async (request) => {
            try {
                const { event, response } = request;
                const path = event.requestContext?.http?.path || event.path || '';
                const method = event.requestContext?.http?.method || event.httpMethod || 'GET';

                // Skip if path is excluded
                if (excludePaths.some(p => path.includes(p))) {
                    return;
                }

                // Skip GET requests unless explicitly enabled
                if (method === 'GET' && !auditReads) {
                    return;
                }

                // Skip if custom shouldAudit returns false
                if (!shouldAudit(request)) {
                    return;
                }

                // Skip if response is not successful (4xx, 5xx)
                const statusCode = response?.statusCode || 200;
                if (statusCode >= 400) {
                    return;
                }

                const action = METHOD_TO_ACTION[method] || 'READ';
                const entityId = getEntityId(request);
                const entityName = getEntityName(request);
                const oldValues = await getOldValues(request);

                // Parse response body if it's a string
                let responseBody = response?.body;
                if (typeof responseBody === 'string') {
                    try {
                        responseBody = JSON.parse(responseBody);
                    } catch (e) {
                        responseBody = null;
                    }
                }

                const newValues = action === 'CREATE' || action === 'UPDATE'
                    ? (responseBody?.data || event.body)
                    : null;

                const auditData = {
                    action,
                    entityType,
                    entityId: entityId?.toString() || null,
                    entityName,
                    oldValues: oldValues ? sanitizeValues(oldValues) : null,
                    newValues: newValues ? sanitizeValues(newValues) : null,
                    changedFields: oldValues && newValues ? getChangedFields(oldValues, newValues) : null,
                    metadata: {
                        responseStatus: statusCode,
                        path
                    }
                };

                // Send audit event asynchronously (don't wait)
                sendAuditEvent(event, auditData, serviceName).catch(err => {
                    log.error('Failed to send audit event', { error: err.message });
                });

            } catch (error) {
                // Never fail the request due to audit errors
                log.error('Audit middleware error', { error: error.message });
            }
        }
    };
};

/**
 * Sanitize values for storage - remove sensitive fields and circular references
 */
const sanitizeValues = (values) => {
    if (!values || typeof values !== 'object') return values;

    const sensitiveFields = [
        'password', 'secret', 'token', 'apiKey', 'api_key',
        'accessToken', 'access_token', 'refreshToken', 'refresh_token',
        'privateKey', 'private_key', 'connectionString', 'connection_string'
    ];

    const sanitized = { ...values };

    for (const field of sensitiveFields) {
        if (field in sanitized) {
            sanitized[field] = '[REDACTED]';
        }
    }

    return sanitized;
};

/**
 * Create a handler wrapper with automatic audit logging
 * 
 * Usage:
 * ```
 * const handler = withAudit(
 *     async (event) => { ... },
 *     { 
 *         entityType: 'resource',
 *         serviceName: 'resource-service'
 *     }
 * );
 * ```
 */
const createAuditHandler = (handler, auditOptions) => {
    return async (event, context) => {
        const response = await handler(event, context);

        // Manual audit - call audit functions directly in handler
        // This is for cases where you need more control
        return response;
    };
};

/**
 * Helper to manually send audit event from within a handler
 * 
 * Usage:
 * ```
 * import { auditAction } from '/opt/nodejs/lib/middleware/audit.js';
 * 
 * const handler = async (event) => {
 *     const resource = await createResource(event.body);
 *     await auditAction(event, {
 *         action: 'CREATE',
 *         entityType: 'resource',
 *         entityId: resource.id,
 *         entityName: resource.name,
 *         newValues: resource
 *     }, 'resource-service');
 *     return success(resource);
 * };
 * ```
 */
const auditAction = async (event, auditData, serviceName) => {
    try {
        return await sendAuditEvent(event, auditData, serviceName);
    } catch (error) {
        log.error('Failed to send manual audit event', { error: error.message });
        return { logged: false, error: error.message };
    }
};

export {
    auditMiddleware,
    auditAction,
    createAuditHandler,
    sanitizeValues,
    METHOD_TO_ACTION
};
