/**
 * Billing Statuses Handler
 * Lambda handlers for billing status management
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error, notFound, validationError } from '/opt/nodejs/utils/response.js';
import audit from '/opt/nodejs/lib/audit/index.js';

const SERVICE_NAME = 'resource-service';

/**
 * List all billing statuses
 */
export const list = async (event) => {
    const log = logger.child({ handler: 'billingStatuses.list' });

    try {
        log.info('Listing billing statuses');

        const query = 'SELECT * FROM billing_statuses ORDER BY name ASC';
        const result = await db.query(query);

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
 * Get a billing status by ID
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
        
        // Basic validation
        if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
            return validationError([{ field: 'name', message: 'Name is required' }]);
        }

        if (body.name.length > 50) {
            return validationError([{ field: 'name', message: 'Name must be less than 50 characters' }]);
        }

        const validated = {
            name: body.name.trim(),
            description: body.description || null,
            is_active: body.is_active !== undefined ? body.is_active : true
        };

        log.info('Creating billing status', { name: validated.name });

        const query = `
            INSERT INTO billing_statuses (name, description, is_active)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const params = [
            validated.name,
            validated.description || null,
            validated.is_active ?? true
        ];

        const result = await db.query(query, params);
        const newBillingStatus = result.rows[0];

        // Send audit event for billing status creation
        await audit.create(
            event,
            'billing_status',
            newBillingStatus.id,
            newBillingStatus.name,
            newBillingStatus,
            SERVICE_NAME
        );

        log.info('Billing status created', { id: newBillingStatus.id });

        return success(newBillingStatus, 201);

    } catch (err) {
        log.error('Failed to create billing status', { error: err.message });

        if (err.code === '23505') { // Unique violation
            return error('A billing status with this name already exists', null, 409);
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

        // Basic validation
        if (body.name !== undefined) {
            if (typeof body.name !== 'string' || body.name.trim().length === 0) {
                return validationError([{ field: 'name', message: 'Name cannot be empty' }]);
            }
            if (body.name.length > 50) {
                return validationError([{ field: 'name', message: 'Name must be less than 50 characters' }]);
            }
        }

        log.info('Updating billing status', { id });

        // Check if exists and get current data for audit
        const existingResult = await db.query('SELECT * FROM billing_statuses WHERE id = $1', [id]);
        if (existingResult.rows.length === 0) {
            return notFound('Billing status not found');
        }
        const existing = existingResult.rows[0];

        // Prevent editing default billing statuses
        if (existing.is_default === true) {
            return error('Cannot edit default billing status', null, 403);
        }

        // Build dynamic update
        const updates = [];
        const params = [id];
        let idx = 2;

        if (body.name !== undefined) {
            updates.push(`name = $${idx++}`);
            params.push(body.name.trim());
        }
        if (body.description !== undefined) {
            updates.push(`description = $${idx++}`);
            params.push(body.description || null);
        }
        if (body.is_active !== undefined) {
            updates.push(`is_active = $${idx++}`);
            params.push(body.is_active);
        }

        if (updates.length === 0) {
            return success(existing);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');

        const query = `
            UPDATE billing_statuses
            SET ${updates.join(', ')}
            WHERE id = $1
            RETURNING *
        `;

        const result = await db.query(query, params);
        const updatedBillingStatus = result.rows[0];

        // Send audit event for billing status update
        await audit.update(
            event,
            'billing_status',
            id,
            updatedBillingStatus.name,
            existing,
            updatedBillingStatus,
            SERVICE_NAME
        );

        log.info('Billing status updated', { id });

        return success(updatedBillingStatus);

    } catch (err) {
        log.error('Failed to update billing status', { id, error: err.message });

        if (err.code === '23505') { // Unique violation
            return error('A billing status with this name already exists', null, 409);
        }

        return error('Failed to update billing status', err);
    }
};

/**
 * Delete a billing status
 */
export const remove = async (event) => {
    const log = logger.child({ handler: 'billingStatuses.remove' });
    const { id } = event.pathParameters;

    try {
        log.info('Deleting billing status', { id });

        // Check if exists and get current data for audit
        const existingResult = await db.query('SELECT * FROM billing_statuses WHERE id = $1', [id]);
        if (existingResult.rows.length === 0) {
            return notFound('Billing status not found');
        }
        const existing = existingResult.rows[0];

        // Prevent deleting default billing statuses
        if (existing.is_default === true) {
            return error('Cannot delete default billing status', null, 403);
        }

        // Check if billing status is being used by any projects
        const usageCheck = await db.query(
            'SELECT COUNT(*) as count FROM projects WHERE billing_status = $1 AND deleted_at IS NULL',
            [existing.name]
        );

        if (parseInt(usageCheck.rows[0].count) > 0) {
            return error('Cannot delete billing status that is in use by projects', null, 409);
        }

        const query = 'DELETE FROM billing_statuses WHERE id = $1 RETURNING *';
        const result = await db.query(query, [id]);

        // Send audit event for billing status deletion
        await audit.delete(
            event,
            'billing_status',
            id,
            existing.name,
            existing,
            SERVICE_NAME
        );

        log.info('Billing status deleted', { id });

        return success(result.rows[0]);

    } catch (err) {
        log.error('Failed to delete billing status', { id, error: err.message });
        return error('Failed to delete billing status', err);
    }
};
