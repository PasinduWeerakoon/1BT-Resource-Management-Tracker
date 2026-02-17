/**
 * Audit Client
 * Shared library for sending audit events to SQS
 * Used by all microservices to track user actions
 */

import { SQSClient, SendMessageCommand, SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import logger from '../logger/index.js';

const log = logger.child({ module: 'audit-client' });

// Initialize SQS client
const sqs = new SQSClient({
    region: process.env.AWS_REGION || 'ap-southeast-1'
});

// Queue URL from environment (set by each service)
const getQueueUrl = () => {
    const url = process.env.AUDIT_QUEUE_URL;
    if (!url) {
        log.warn('AUDIT_QUEUE_URL not set, audit events will be logged only');
    }
    return url;
};

/**
 * Audit Event Structure
 * @typedef {Object} AuditEvent
 * @property {string} action - Action performed (CREATE, READ, UPDATE, DELETE, etc.)
 * @property {string} entityType - Type of entity (resource, project, allocation, etc.)
 * @property {string} [entityId] - ID of the entity affected
 * @property {string} [entityName] - Human-readable name of the entity
 * @property {Object} [oldValues] - Previous values before change
 * @property {Object} [newValues] - New values after change
 * @property {string[]} [changedFields] - List of fields that changed
 * @property {Object} [metadata] - Additional context-specific data
 */

/**
 * Build audit event from request context
 * @param {Object} event - Lambda event object
 * @param {AuditEvent} auditData - Audit event data
 * @param {string} serviceName - Name of the calling service
 * @returns {Object} Complete audit event
 */
const buildAuditEvent = (event, auditData, serviceName) => {
    const requestContext = event.requestContext || {};
    const authorizer = requestContext.authorizer || {};
    const claims = authorizer.jwt?.claims || authorizer.claims || {};

    // Extract user info
    const user = event.user || {};
    const userId = user.id || claims.sub || null;
    const userEmail = user.email || claims.email || null;
    const userName = user.username || claims['cognito:username'] || userEmail;

    // Extract request context
    const httpMethod = requestContext.http?.method || event.httpMethod || 'UNKNOWN';
    const path = requestContext.http?.path || event.path || '';
    const sourceIp = requestContext.http?.sourceIp ||
        event.headers?.['X-Forwarded-For']?.split(',')[0]?.trim() ||
        null;
    const userAgent = event.headers?.['User-Agent'] || event.headers?.['user-agent'] || null;
    const requestId = requestContext.requestId || event.requestContext?.awsRequestId || null;

    return {
        timestamp: new Date().toISOString(),
        userId,
        userEmail,
        userName,
        action: auditData.action,
        entityType: auditData.entityType,
        entityId: auditData.entityId || null,
        entityName: auditData.entityName || null,
        oldValues: auditData.oldValues || null,
        newValues: auditData.newValues || null,
        changedFields: auditData.changedFields || null,
        ipAddress: sourceIp,
        userAgent,
        requestId,
        serviceName,
        apiEndpoint: `${httpMethod} ${path}`,
        metadata: auditData.metadata || null
    };
};

/**
 * Send a single audit event to SQS
 * @param {Object} event - Lambda event object  
 * @param {AuditEvent} auditData - Audit event data
 * @param {string} serviceName - Name of the calling service
 * @returns {Promise<Object>} SQS response or null if queue not configured
 */
export const sendAuditEvent = async (event, auditData, serviceName) => {
    const queueUrl = getQueueUrl();
    const auditEvent = buildAuditEvent(event, auditData, serviceName);

    // Always log the audit event
    log.info('Audit event', {
        action: auditEvent.action,
        entityType: auditEvent.entityType,
        entityId: auditEvent.entityId,
        userId: auditEvent.userId
    });

    // If no queue URL, just log and return
    if (!queueUrl) {
        return { logged: true, queued: false };
    }

    try {
        const command = new SendMessageCommand({
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify(auditEvent),
            MessageAttributes: {
                Action: {
                    DataType: 'String',
                    StringValue: auditEvent.action
                },
                EntityType: {
                    DataType: 'String',
                    StringValue: auditEvent.entityType
                },
                ServiceName: {
                    DataType: 'String',
                    StringValue: serviceName
                }
            }
            // Note: MessageDeduplicationId and MessageGroupId are only valid for FIFO queues
        });

        const response = await sqs.send(command);

        log.debug('Audit event sent to SQS', {
            messageId: response.MessageId,
            action: auditEvent.action
        });

        return {
            logged: true,
            queued: true,
            messageId: response.MessageId
        };

    } catch (error) {
        // Don't fail the main request if audit fails
        log.error('Failed to send audit event to SQS', {
            error: error.message,
            action: auditEvent.action,
            entityType: auditEvent.entityType
        });
        return {
            logged: true,
            queued: false,
            error: error.message
        };
    }
};

/**
 * Send multiple audit events in a batch
 * @param {Object} event - Lambda event object
 * @param {AuditEvent[]} auditDataArray - Array of audit events
 * @param {string} serviceName - Name of the calling service
 * @returns {Promise<Object>} Batch results
 */
export const sendAuditEventBatch = async (event, auditDataArray, serviceName) => {
    const queueUrl = getQueueUrl();

    if (!queueUrl || !auditDataArray?.length) {
        return { logged: auditDataArray?.length || 0, queued: 0 };
    }

    // Build all audit events
    const auditEvents = auditDataArray.map(data => buildAuditEvent(event, data, serviceName));

    // SQS batch limit is 10 messages
    const batches = [];
    for (let i = 0; i < auditEvents.length; i += 10) {
        batches.push(auditEvents.slice(i, i + 10));
    }

    let successCount = 0;
    let failCount = 0;

    for (const batch of batches) {
        try {
            const command = new SendMessageBatchCommand({
                QueueUrl: queueUrl,
                Entries: batch.map((auditEvent, index) => ({
                    Id: `msg-${index}`,
                    MessageBody: JSON.stringify(auditEvent),
                    MessageAttributes: {
                        Action: {
                            DataType: 'String',
                            StringValue: auditEvent.action
                        },
                        EntityType: {
                            DataType: 'String',
                            StringValue: auditEvent.entityType
                        }
                    }
                }))
            });

            const response = await sqs.send(command);
            successCount += response.Successful?.length || 0;
            failCount += response.Failed?.length || 0;

        } catch (error) {
            log.error('Failed to send audit batch', { error: error.message });
            failCount += batch.length;
        }
    }

    log.info('Audit batch sent', { total: auditDataArray.length, success: successCount, failed: failCount });

    return {
        logged: auditDataArray.length,
        queued: successCount,
        failed: failCount
    };
};

/**
 * Helper to calculate changed fields between two objects
 * @param {Object} oldObj - Original object
 * @param {Object} newObj - Updated object
 * @returns {string[]} Array of field names that changed
 */
export const getChangedFields = (oldObj, newObj) => {
    if (!oldObj || !newObj) return [];

    const changed = [];
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    for (const key of allKeys) {
        // Skip internal fields
        if (['updated_at', 'version', 'updated_by'].includes(key)) continue;

        const oldVal = JSON.stringify(oldObj[key]);
        const newVal = JSON.stringify(newObj[key]);

        if (oldVal !== newVal) {
            changed.push(key);
        }
    }

    return changed;
};

/**
 * Convenience methods for common actions
 */
export const audit = {
    create: (event, entityType, entityId, entityName, newValues, serviceName, metadata = null) =>
        sendAuditEvent(event, {
            action: 'CREATE',
            entityType,
            entityId,
            entityName,
            newValues,
            metadata
        }, serviceName),

    read: (event, entityType, entityId, entityName, serviceName, metadata = null) =>
        sendAuditEvent(event, {
            action: 'READ',
            entityType,
            entityId,
            entityName,
            metadata
        }, serviceName),

    update: (event, entityType, entityId, entityName, oldValues, newValues, serviceName, metadata = null) =>
        sendAuditEvent(event, {
            action: 'UPDATE',
            entityType,
            entityId,
            entityName,
            oldValues,
            newValues,
            changedFields: getChangedFields(oldValues, newValues),
            metadata
        }, serviceName),

    delete: (event, entityType, entityId, entityName, oldValues, serviceName, metadata = null) =>
        sendAuditEvent(event, {
            action: 'DELETE',
            entityType,
            entityId,
            entityName,
            oldValues,
            metadata
        }, serviceName),

    login: (event, userId, userEmail, serviceName, metadata = null) =>
        sendAuditEvent(event, {
            action: 'LOGIN',
            entityType: 'user',
            entityId: userId,
            entityName: userEmail,
            metadata
        }, serviceName),

    logout: (event, userId, userEmail, serviceName, metadata = null) =>
        sendAuditEvent(event, {
            action: 'LOGOUT',
            entityType: 'user',
            entityId: userId,
            entityName: userEmail,
            metadata
        }, serviceName),

    loginFailed: (event, userEmail, serviceName, metadata = null) =>
        sendAuditEvent(event, {
            action: 'LOGIN_FAILED',
            entityType: 'user',
            entityName: userEmail,
            metadata
        }, serviceName),

    export: (event, entityType, serviceName, metadata = null) =>
        sendAuditEvent(event, {
            action: 'EXPORT',
            entityType,
            metadata
        }, serviceName),

    bulkUpdate: (event, entityType, affectedCount, serviceName, metadata = null) =>
        sendAuditEvent(event, {
            action: 'BULK_UPDATE',
            entityType,
            metadata: { ...metadata, affectedCount }
        }, serviceName)
};

export default audit;
