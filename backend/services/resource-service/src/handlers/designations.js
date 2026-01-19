/**
 * Designations Handler
 * Lambda handlers for designation management
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error, notFound, validationError } from '/opt/nodejs/utils/response.js';
import { validate, designationSchemas } from '/opt/nodejs/validation/index.js';

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

        log.info('Designation created', { id: result.rows[0].id });

        return success(result.rows[0], 201);

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

        // Check if exists
        const existing = await db.query('SELECT id FROM designations WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return notFound('Designation not found');
        }

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
            const current = await db.query('SELECT * FROM designations WHERE id = $1', [id]);
            return success(current.rows[0]);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');

        const query = `
            UPDATE designations
            SET ${updates.join(', ')}
            WHERE id = $1
            RETURNING *
        `;

        const result = await db.query(query, params);

        log.info('Designation updated', { id });

        return success(result.rows[0]);

    } catch (err) {
        log.error('Failed to update designation', { id, error: err.message });

        if (err.name === 'ValidationError') {
            return validationError(err.details);
        }

        return error('Failed to update designation', err);
    }
};
