/**
 * Designations Handler
 * Lambda handlers for designation management
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error, notFound, validationError } from '/opt/nodejs/utils/response.js';
import { validate, designationSchemas } from '/opt/nodejs/validation/index.js';
import audit from '/opt/nodejs/lib/audit/index.js';

const SERVICE_NAME = 'resource-service';

/**
 * List all designations
 */
export const list = async (event) => {
    const log = logger.child({ handler: 'designations.list' });

    try {
        log.info('Listing designations');

        const query = 'SELECT * FROM designations ORDER BY level ASC, name ASC';
        const result = await db.query(query);

        return success({
            data: result.rows,
            total: result.rows.length
        });

    } catch (err) {
        log.error('Failed to list designations', { error: err.message });
        return error('Failed to list designations', err);
    }
};

/**
 * Get a designation by ID
 */
export const getById = async (event) => {
    const log = logger.child({ handler: 'designations.getById' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting designation', { id });

        const query = 'SELECT * FROM designations WHERE id = $1';
        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return notFound('Designation not found');
        }

        return success(result.rows[0]);

    } catch (err) {
        log.error('Failed to get designation', { id, error: err.message });
        return error('Failed to get designation', err);
    }
};

/**
 * Create a new designation
 */
export const create = async (event) => {
    const log = logger.child({ handler: 'designations.create' });

    try {
        const body = JSON.parse(event.body || '{}');
        const validated = validate(body, designationSchemas.create);

        log.info('Creating designation', { name: validated.name });

        const query = `
            INSERT INTO designations (name, level, is_intern_role, is_active)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;

        const params = [
            validated.name,
            validated.level,
            validated.is_intern_role ?? false,
            validated.is_active ?? true
        ];

        const result = await db.query(query, params);
        const newDesignation = result.rows[0];

        // Send audit event for designation creation
        await audit.create(
            event,
            'designation',
            newDesignation.id,
            newDesignation.name,
            newDesignation,
            SERVICE_NAME
        );

        log.info('Designation created', { id: newDesignation.id });

        return success(newDesignation, 201);

    } catch (err) {
        log.error('Failed to create designation', { error: err.message });

        if (err.name === 'ValidationError') {
            return validationError(err.details);
        }

        if (err.code === '23505') { // Unique violation
            return error('A designation with this name already exists', null, 409);
        }

        return error('Failed to create designation', err);
    }
};

/**
 * Update an existing designation
 */
export const update = async (event) => {
    const log = logger.child({ handler: 'designations.update' });
    const { id } = event.pathParameters;

    try {
        const body = JSON.parse(event.body || '{}');
        const validated = validate(body, designationSchemas.update);

        log.info('Updating designation', { id });

        // Check if exists and get current data for audit
        const existingResult = await db.query('SELECT * FROM designations WHERE id = $1', [id]);
        if (existingResult.rows.length === 0) {
            return notFound('Designation not found');
        }
        const existing = existingResult.rows[0];

        // Build dynamic update
        const { name, level, is_intern_role, is_active } = validated;
        const updates = [];
        const params = [id];
        let idx = 2;

        if (name !== undefined) {
            updates.push(`name = $${idx++}`);
            params.push(name);
        }
        if (level !== undefined) {
            updates.push(`level = $${idx++}`);
            params.push(level);
        }
        if (is_intern_role !== undefined) {
            updates.push(`is_intern_role = $${idx++}`);
            params.push(is_intern_role);
        }
        if (is_active !== undefined) {
            updates.push(`is_active = $${idx++}`);
            params.push(is_active);
        }

        if (updates.length === 0) {
            return success(existing);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');

        const query = `
            UPDATE designations
            SET ${updates.join(', ')}
            WHERE id = $1
            RETURNING *
        `;

        const result = await db.query(query, params);
        const updatedDesignation = result.rows[0];

        // Send audit event for designation update
        await audit.update(
            event,
            'designation',
            id,
            updatedDesignation.name,
            existing,
            updatedDesignation,
            SERVICE_NAME
        );

        log.info('Designation updated', { id });

        return success(updatedDesignation);

    } catch (err) {
        log.error('Failed to update designation', { id, error: err.message });

        if (err.name === 'ValidationError') {
            return validationError(err.details);
        }

        return error('Failed to update designation', err);
    }
};

/**
 * Delete a designation
 */
export const remove = async (event) => {
    const log = logger.child({ handler: 'designations.remove' });
    const { id } = event.pathParameters;
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;

    try {
        log.info('Deleting designation', { id, userId });

        // Check if exists and get current data for audit
        const existingResult = await db.query('SELECT * FROM designations WHERE id = $1', [id]);
        if (existingResult.rows.length === 0) {
            return notFound('Designation not found');
        }
        const existing = existingResult.rows[0];

        // Check if designation is being used by any resources
        const usageCheck = await db.query(
            'SELECT COUNT(*) as count FROM resources WHERE designation_id = $1',
            [id]
        );

        if (parseInt(usageCheck.rows[0].count) > 0) {
            return error('Cannot delete designation that is in use by resources', null, 409);
        }

        const query = 'DELETE FROM designations WHERE id = $1 RETURNING *';
        const result = await db.query(query, [id]);

        // Send audit event for designation deletion
        await audit.delete(
            event,
            'designation',
            id,
            existing.name,
            existing,
            SERVICE_NAME
        );

        log.info('Designation deleted', { id });

        return success({ message: 'Designation deleted successfully', data: result.rows[0] });

    } catch (err) {
        log.error('Failed to delete designation', { id, error: err.message });
        return error('Failed to delete designation', err);
    }
};
