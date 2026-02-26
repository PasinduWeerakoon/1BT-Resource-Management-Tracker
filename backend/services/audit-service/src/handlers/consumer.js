/**
 * Audit Event Consumer
 * SQS Lambda handler for processing audit events
 * Implements batch processing with partial failure support
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';

const log = logger.child({ handler: 'audit.consumer' });

/**
 * Process a single audit event record
 * @param {Object} record - SQS message record
 * @returns {Object} - Result with success status
 */
const processRecord = async (record) => {
    const messageId = record.messageId;

    try {
        // Parse the message body
        const auditEvent = JSON.parse(record.body);

        log.info('Processing audit event', {
            messageId,
            action: auditEvent.action,
            entityType: auditEvent.entityType
        });

        // Validate required fields
        if (!auditEvent.action || !auditEvent.entityType || !auditEvent.serviceName) {
            throw new Error('Missing required fields: action, entityType, or serviceName');
        }

        // Insert into audit_logs table
        const query = `
            INSERT INTO audit_logs (
                timestamp,
                user_id,
                user_email,
                user_name,
                action,
                entity_type,
                entity_id,
                entity_name,
                old_values,
                new_values,
                changed_fields,
                ip_address,
                user_agent,
                request_id,
                service_name,
                api_endpoint,
                metadata,
                message_id
            ) VALUES (
                COALESCE($1::timestamptz, CURRENT_TIMESTAMP),
                $2,
                $3,
                $4,
                $5::audit_action,
                $6,
                $7,
                $8,
                $9::jsonb,
                $10::jsonb,
                $11::text[],
                $12::inet,
                $13,
                $14,
                $15,
                $16,
                $17::jsonb,
                $18
            )
            ON CONFLICT (message_id) WHERE message_id IS NOT NULL DO NOTHING
            RETURNING id
        `;

        const values = [
            auditEvent.timestamp || null,
            auditEvent.userId || null,
            auditEvent.userEmail || null,
            auditEvent.userName || null,
            auditEvent.action,
            auditEvent.entityType,
            auditEvent.entityId || null,
            auditEvent.entityName || null,
            auditEvent.oldValues ? JSON.stringify(auditEvent.oldValues) : null,
            auditEvent.newValues ? JSON.stringify(auditEvent.newValues) : null,
            auditEvent.changedFields || null,
            auditEvent.ipAddress || null,
            auditEvent.userAgent || null,
            auditEvent.requestId || null,
            auditEvent.serviceName,
            auditEvent.apiEndpoint || null,
            auditEvent.metadata ? JSON.stringify(auditEvent.metadata) : null,
            messageId
        ];

        const result = await db.query(query, values);

        if (result.rowCount === 0) {
            log.warn('Duplicate message detected, skipping', { messageId });
        } else {
            log.info('Audit event stored', {
                messageId,
                auditLogId: result.rows[0]?.id
            });
        }

        return { messageId, success: true };

    } catch (error) {
        log.error('Failed to process audit event', {
            messageId,
            error: error.message,
            stack: error.stack
        });
        return { messageId, success: false, error: error.message };
    }
};

/**
 * Main SQS handler with batch processing
 * Implements partial batch failure reporting
 */
export const processAuditEvent = async (event) => {
    log.info('Processing audit batch', { recordCount: event.Records.length });

    const results = await Promise.all(
        event.Records.map(record => processRecord(record))
    );

    // Collect failed message IDs for partial batch failure
    const batchItemFailures = results
        .filter(result => !result.success)
        .map(result => ({
            itemIdentifier: result.messageId
        }));

    const successCount = results.filter(r => r.success).length;
    const failCount = batchItemFailures.length;

    log.info('Batch processing complete', {
        total: event.Records.length,
        success: successCount,
        failed: failCount
    });

    // Return failed items for retry
    return { batchItemFailures };
};
