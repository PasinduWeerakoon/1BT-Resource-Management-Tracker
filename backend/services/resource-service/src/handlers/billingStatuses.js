/**
 * Billing Statuses Handler
 * Lambda handlers for billing status management (configurable)
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error, notFound, validationError, conflict } from '/opt/nodejs/utils/response.js';
import audit from '/opt/nodejs/lib/audit/index.js';

const SERVICE_NAME = 'resource-service';

/**
 * List all billing statuses (active only by default)
 */
export const list = async (event) => {
    const log = logger.child({ handler: 'billingStatuses.list' });

    try {
        const queryParams = event.queryStringParameters || {};
        const includeInactive = queryParams.include_inactive === 'true';

        log.info('Listing billing statuses', { includeInactive });

        let query = 'SELECT * FROM billing_statuses';
        const params = [];

        if (!includeInactive) {
            query += ' WHERE is_active = true';
        }

        query += ' ORDER BY display_order ASC, name ASC';

        const result = await db.query(query, params);

        return success({
            data: result.rows,
            total: result.rows.length
        });

    } catch (err) {
        log.error('Failed to list billing statuses', { error: err.message });
        return error('Failed to list billing statuses', err);
    }
};

/**
 * Get a single billing status by ID
 */
export const getById = async (event) => {
    const log = logger.child({ handler: 'billingStatuses.getById' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting billing status', { id });

        const query = 'SELECT * FROM billing_statuses WHERE id = $1';
        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return notFound('Billing status not found');
        }

        return success(result.rows[0]);

    } catch (err) {
        log.error('Failed to get billing status', { id, error: err.message });
        return error('Failed to get billing status', err);
    }
};

/**
 * Create a new billing status
 */
export const create = async (event) => {
    const log = logger.child({ handler: 'billingStatuses.create' });

    try {
        const body = JSON.parse(event.body || '{}');
        const { name, description, color, display_order, is_active } = body;

        // Validation
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return validationError('Name is required and must be a non-empty string');
        }

        if (name.length > 50) {
            return validationError('Name must be 50 characters or less');
        }

        log.info('Creating billing status', { name });

        // Get user info for created_by
        const cognitoSub = event.requestContext?.authorizer?.jwt?.claims?.sub
            || event.requestContext?.authorizer?.claims?.sub;

        let userId = null;
        if (cognitoSub) {
            const userResult = await db.query(
                'SELECT id FROM users WHERE cognito_user_id = $1',
                [cognitoSub]
            );
            if (userResult.rows.length > 0) {
                userId = userResult.rows[0].id;
            }
        }

        // Get max display_order if not provided
        let displayOrder = display_order;
        if (displayOrder === undefined || displayOrder === null) {
            const maxOrderResult = await db.query(
                'SELECT COALESCE(MAX(display_order), 0) as max_order FROM billing_statuses'
            );
            displayOrder = (maxOrderResult.rows[0].max_order || 0) + 1;
        }

        const query = `
            INSERT INTO billing_statuses (name, description, color, display_order, is_active, is_system, created_by)
            VALUES ($1, $2, $3, $4, $5, false, $6)
            RETURNING *
        `;

        const params = [
            name.trim(),
            description || null,
            color || '#1890ff',
            displayOrder,
            is_active !== undefined ? is_active : true,
            userId
        ];

        const result = await db.query(query, params);
        const newStatus = result.rows[0];

        // Send audit event
        await audit.create(
            event,
            'billing_status',
            newStatus.id,
            newStatus.name,
            newStatus,
            SERVICE_NAME
        );

        log.info('Billing status created', { id: newStatus.id });

        return success(newStatus, 201);

    } catch (err) {
        log.error('Failed to create billing status', { error: err.message });

        if (err.code === '23505') { // Unique violation
            return conflict('A billing status with this name already exists');
        }

        return error('Failed to create billing status', err);
    }
};

/**
 * Update an existing billing status
 */
export const update = async (event) => {
    const log = logger.child({ handler: 'billingStatuses.update' });
    const { id } = event.pathParameters;

    try {
        const body = JSON.parse(event.body || '{}');
        const { name, description, color, display_order, is_active } = body;

        log.info('Updating billing status', { id });

        // Check if exists and get current data for audit
        const existingResult = await db.query('SELECT * FROM billing_statuses WHERE id = $1', [id]);
        if (existingResult.rows.length === 0) {
            return notFound('Billing status not found');
        }
        const existing = existingResult.rows[0];

        // Prevent modification of system statuses (except description and color)
        if (existing.is_system) {
            if (name !== undefined && name !== existing.name) {
                return error('Cannot change name of system billing status', null, 403);
            }
            if (is_active !== undefined && is_active !== existing.is_active) {
                return error('Cannot change active status of system billing status', null, 403);
            }
        }

        // Get user info for updated_by
        const cognitoSub = event.requestContext?.authorizer?.jwt?.claims?.sub
            || event.requestContext?.authorizer?.claims?.sub;

        let userId = null;
        if (cognitoSub) {
            const userResult = await db.query(
                'SELECT id FROM users WHERE cognito_user_id = $1',
                [cognitoSub]
            );
            if (userResult.rows.length > 0) {
                userId = userResult.rows[0].id;
            }
        }

        // Build dynamic update
        const updates = [];
        const params = [id];
        let idx = 2;

        if (name !== undefined && !existing.is_system) {
            if (typeof name !== 'string' || name.trim().length === 0) {
                return validationError('Name must be a non-empty string');
            }
            if (name.length > 50) {
                return validationError('Name must be 50 characters or less');
            }
            updates.push(`name = $${idx++}`);
            params.push(name.trim());
        }

        if (description !== undefined) {
            updates.push(`description = $${idx++}`);
            params.push(description || null);
        }

        if (color !== undefined) {
            updates.push(`color = $${idx++}`);
            params.push(color || '#1890ff');
        }

        if (display_order !== undefined) {
            updates.push(`display_order = $${idx++}`);
            params.push(display_order);
        }

        if (is_active !== undefined && !existing.is_system) {
            updates.push(`is_active = $${idx++}`);
            params.push(is_active);
        }

        if (updates.length === 0) {
            return success(existing);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        if (userId) {
            updates.push(`updated_by = $${idx++}`);
            params.push(userId);
        }

        const query = `
            UPDATE billing_statuses
            SET ${updates.join(', ')}
            WHERE id = $1
            RETURNING *
        `;

        const result = await db.query(query, params);
        const updated = result.rows[0];

        // Send audit event
        await audit.update(
            event,
            'billing_status',
            id,
            updated.name,
            existing,
            updated,
            SERVICE_NAME
        );

        log.info('Billing status updated', { id });

        return success(updated);

    } catch (err) {
        log.error('Failed to update billing status', { id, error: err.message });

        if (err.code === '23505') { // Unique violation
            return conflict('A billing status with this name already exists');
        }

        return error('Failed to update billing status', err);
    }
};

/**
 * Delete a billing status (soft delete by setting is_active = false)
 * System statuses cannot be deleted
 */
export const remove = async (event) => {
    const log = logger.child({ handler: 'billingStatuses.remove' });
    const { id } = event.pathParameters;

    try {
        log.info('Deleting billing status', { id });

        // Check if exists and if it's a system status
        const existingResult = await db.query('SELECT * FROM billing_statuses WHERE id = $1', [id]);
        if (existingResult.rows.length === 0) {
            return notFound('Billing status not found');
        }

        const existing = existingResult.rows[0];

        if (existing.is_system) {
            return error('Cannot delete system billing status', null, 403);
        }

        // Check if any allocations are using this status
        const allocationsCheck = await db.query(
            'SELECT COUNT(*) as count FROM allocations WHERE billing_status_id = $1 AND deleted_at IS NULL',
            [id]
        );

        const allocationCount = parseInt(allocationsCheck.rows[0].count, 10);
        if (allocationCount > 0) {
            return error(
                `Cannot delete billing status. It is currently used by ${allocationCount} allocation(s). Please reassign allocations first.`,
                null,
                409
            );
        }

        // Soft delete by setting is_active = false
        const query = `
            UPDATE billing_statuses
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;

        const result = await db.query(query, [id]);
        const deleted = result.rows[0];

        // Send audit event
        await audit.delete(
            event,
            'billing_status',
            id,
            deleted.name,
            existing,
            SERVICE_NAME
        );

        log.info('Billing status deleted', { id });

        return success({ message: 'Billing status deleted successfully', data: deleted });

    } catch (err) {
        log.error('Failed to delete billing status', { id, error: err.message });
        return error('Failed to delete billing status', err);
    }
};

