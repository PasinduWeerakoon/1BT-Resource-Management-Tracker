/**
 * Tiers Handler
 * Lambda handlers for tier management
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error, notFound, validationError } from '/opt/nodejs/utils/response.js';
import { validate, tierSchemas } from '/opt/nodejs/validation/index.js';
import audit from '/opt/nodejs/lib/audit/index.js';

const SERVICE_NAME = 'resource-service';

/**
 * List all tiers
 */
export const list = async (event) => {
    const log = logger.child({ handler: 'tiers.list' });

    try {
        log.info('Listing tiers');

        const queryParams = event.queryStringParameters || {};
        const { is_active, search } = queryParams;

        let query = 'SELECT * FROM tiers WHERE 1=1';
        const params = [];
        let idx = 1;

        if (is_active !== undefined) {
            query += ` AND is_active = $${idx++}`;
            params.push(is_active === 'true');
        }

        if (search) {
            query += ` AND (name ILIKE $${idx} OR description ILIKE $${idx})`;
            params.push(`%${search}%`);
            idx++;
        }

        query += ' ORDER BY level ASC NULLS LAST, name ASC';

        const result = await db.query(query, params);

        return success({
            data: result.rows,
            total: result.rows.length
        });

    } catch (err) {
        log.error('Failed to list tiers', { error: err.message });
        return error('Failed to list tiers', err);
    }
};

/**
 * Get a tier by ID
 */
export const getById = async (event) => {
    const log = logger.child({ handler: 'tiers.getById' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting tier', { id });

        const query = 'SELECT * FROM tiers WHERE id = $1';
        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return notFound('Tier not found');
        }

        return success(result.rows[0]);

    } catch (err) {
        log.error('Failed to get tier', { id, error: err.message });
        return error('Failed to get tier', err);
    }
};

/**
 * Create a new tier
 */
export const create = async (event) => {
    const log = logger.child({ handler: 'tiers.create' });

    try {
        const body = JSON.parse(event.body || '{}');
        const validated = validate(body, tierSchemas.create);

        log.info('Creating tier', { name: validated.name });

        const query = `
            INSERT INTO tiers (name, level, description, is_active)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;

        const params = [
            validated.name,
            validated.level,
            validated.description,
            validated.is_active ?? true
        ];

        const result = await db.query(query, params);
        const newTier = result.rows[0];

        // Send audit event for tier creation
        await audit.create(
            event,
            'tier',
            newTier.id,
            newTier.name,
            newTier,
            SERVICE_NAME
        );

        log.info('Tier created', { id: newTier.id });

        return success(newTier, 201);

    } catch (err) {
        log.error('Failed to create tier', { error: err.message });

        if (err.isValidationError) {
            return validationError(err.message);
        }

        if (err.code === '23505') { // Unique violation
            return error('A tier with this name already exists', null, 409);
        }

        return error('Failed to create tier', err);
    }
};

/**
 * Update an existing tier
 */
export const update = async (event) => {
    const log = logger.child({ handler: 'tiers.update' });
    const { id } = event.pathParameters;

    try {
        const body = JSON.parse(event.body || '{}');
        const validated = validate(body, tierSchemas.update);

        log.info('Updating tier', { id });

        // Check if exists and get current data for audit
        const existingResult = await db.query('SELECT * FROM tiers WHERE id = $1', [id]);
        if (existingResult.rows.length === 0) {
            return notFound('Tier not found');
        }
        const existing = existingResult.rows[0];

        // Build dynamic update
        const { name, level, description, is_active } = validated;
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
        if (description !== undefined) {
            updates.push(`description = $${idx++}`);
            params.push(description);
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
            UPDATE tiers
            SET ${updates.join(', ')}
            WHERE id = $1
            RETURNING *
        `;

        const result = await db.query(query, params);
        const updatedTier = result.rows[0];

        // Send audit event for tier update
        await audit.update(
            event,
            'tier',
            id,
            updatedTier.name,
            existing,
            updatedTier,
            SERVICE_NAME
        );

        log.info('Tier updated', { id });

        return success(updatedTier);

    } catch (err) {
        log.error('Failed to update tier', { id, error: err.message });

        if (err.isValidationError) {
            return validationError(err.message);
        }

        if (err.code === '23505') { // Unique violation
            return error('A tier with this name already exists', null, 409);
        }

        return error('Failed to update tier', err);
    }
};

/**
 * Delete a tier
 */
export const remove = async (event) => {
    const log = logger.child({ handler: 'tiers.remove' });
    const { id } = event.pathParameters;

    try {
        log.info('Deleting tier', { id });

        // Check if exists and get data for audit
        const existingResult = await db.query('SELECT * FROM tiers WHERE id = $1', [id]);
        if (existingResult.rows.length === 0) {
            return notFound('Tier not found');
        }
        const existing = existingResult.rows[0];

        // Check if tier is in use by any resources
        const usageCheck = await db.query(
            'SELECT COUNT(*) as count FROM resources WHERE tier = $1 AND deleted_at IS NULL',
            [existing.name]
        );

        if (parseInt(usageCheck.rows[0].count) > 0) {
            return error(
                `Cannot delete tier. It is currently assigned to ${usageCheck.rows[0].count} resource(s).`,
                null,
                409
            );
        }

        // Delete the tier
        await db.query('DELETE FROM tiers WHERE id = $1', [id]);

        // Send audit event for tier deletion
        await audit.delete(
            event,
            'tier',
            id,
            existing.name,
            existing,
            SERVICE_NAME
        );

        log.info('Tier deleted', { id });

        return success({ message: 'Tier deleted successfully' });

    } catch (err) {
        log.error('Failed to delete tier', { id, error: err.message });
        return error('Failed to delete tier', err);
    }
};
