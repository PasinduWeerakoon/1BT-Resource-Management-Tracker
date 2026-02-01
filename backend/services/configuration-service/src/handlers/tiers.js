/**
 * Tiers Handler
 * Lambda handlers for tier management
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error, notFound, validationError, conflict } from '/opt/nodejs/utils/response.js';
import audit from '/opt/nodejs/lib/audit/index.js';

const SERVICE_NAME = 'configuration-service';

/**
 * List all tiers
 */
export const list = async (event) => {
    const log = logger.child({ handler: 'tiers.list' });

    try {
        log.info('Listing tiers');

        const query = `
            SELECT * FROM tiers 
            WHERE is_active = true
            ORDER BY is_default DESC, level ASC NULLS LAST, name ASC
        `;
        const result = await db.query(query);

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

        return success({ data: result.rows[0] });

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
    const userId = event.requestContext?.authorizer?.claims?.sub || 'system';

    try {
        const body = JSON.parse(event.body);
        log.info('Creating tier', { body });

        // Validate required fields
        if (!body.name) {
            return error('Name is required', null, 400);
        }

        // Check for duplicate name
        const checkQuery = 'SELECT id FROM tiers WHERE LOWER(name) = LOWER($1)';
        const checkResult = await db.query(checkQuery, [body.name]);

        if (checkResult.rows.length > 0) {
            return conflict('Tier with this name already exists');
        }

        // Insert new tier
        const insertQuery = `
            INSERT INTO tiers (name, level, description, is_active, is_default, created_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const result = await db.query(insertQuery, [
            body.name,
            body.level || null,
            body.description || null,
            body.is_active !== undefined ? body.is_active : true,
            false, // User-created tiers are never default
            userId
        ]);

        // Audit log
        await audit.log({
            service: SERVICE_NAME,
            action: 'CREATE',
            entity: 'Tier',
            entityId: result.rows[0].id,
            userId,
            details: { name: body.name }
        });

        log.info('Tier created', { id: result.rows[0].id });
        return success({ data: result.rows[0] }, 201);

    } catch (err) {
        log.error('Failed to create tier', { error: err.message });
        return error('Failed to create tier', err);
    }
};

/**
 * Update an existing tier
 */
export const update = async (event) => {
    const log = logger.child({ handler: 'tiers.update' });
    const { id } = event.pathParameters;
    const userId = event.requestContext?.authorizer?.claims?.sub || 'system';

    try {
        const body = JSON.parse(event.body);
        log.info('Updating tier', { id, body });

        // Check if tier exists and is not default
        const checkQuery = 'SELECT id, is_default FROM tiers WHERE id = $1';
        const checkResult = await db.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return notFound('Tier not found');
        }

        if (checkResult.rows[0].is_default) {
            return error('Cannot modify default tiers', null, 403);
        }

        // Check for duplicate name (if name is being updated)
        if (body.name) {
            const nameCheckQuery = 'SELECT id FROM tiers WHERE LOWER(name) = LOWER($1) AND id != $2';
            const nameCheckResult = await db.query(nameCheckQuery, [body.name, id]);

            if (nameCheckResult.rows.length > 0) {
                return conflict('Tier with this name already exists');
            }
        }

        // Build update query dynamically
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (body.name !== undefined) {
            updates.push(`name = $${paramCount++}`);
            values.push(body.name);
        }
        if (body.level !== undefined) {
            updates.push(`level = $${paramCount++}`);
            values.push(body.level);
        }
        if (body.description !== undefined) {
            updates.push(`description = $${paramCount++}`);
            values.push(body.description);
        }
        if (body.is_active !== undefined) {
            updates.push(`is_active = $${paramCount++}`);
            values.push(body.is_active);
        }

        updates.push(`updated_by = $${paramCount++}`);
        values.push(userId);
        values.push(id);

        const updateQuery = `
            UPDATE tiers
            SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramCount}
            RETURNING *
        `;
        const result = await db.query(updateQuery, values);

        // Audit log
        await audit.log({
            service: SERVICE_NAME,
            action: 'UPDATE',
            entity: 'Tier',
            entityId: id,
            userId,
            details: body
        });

        log.info('Tier updated', { id });
        return success({ data: result.rows[0] });

    } catch (err) {
        log.error('Failed to update tier', { error: err.message, id });
        return error('Failed to update tier', err);
    }
};

/**
 * Delete a tier
 */
export const remove = async (event) => {
    const log = logger.child({ handler: 'tiers.remove' });
    const { id } = event.pathParameters;
    const userId = event.requestContext?.authorizer?.claims?.sub || 'system';

    try {
        log.info('Deleting tier', { id });

        // Check if tier exists and is not default
        const checkQuery = 'SELECT id, is_default, name FROM tiers WHERE id = $1';
        const checkResult = await db.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return notFound('Tier not found');
        }

        if (checkResult.rows[0].is_default) {
            return error('Cannot delete default tiers', null, 403);
        }

        // Check if tier is in use
        const usageQuery = 'SELECT COUNT(*) as count FROM resources WHERE tier = $1';
        const usageResult = await db.query(usageQuery, [checkResult.rows[0].name]);

        if (parseInt(usageResult.rows[0].count) > 0) {
            return error(
                `Cannot delete tier "${checkResult.rows[0].name}" as it is currently used by ${usageResult.rows[0].count} resource(s)`,
                null,
                409
            );
        }

        // Soft delete by setting is_active to false
        const deleteQuery = `
            UPDATE tiers
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `;
        await db.query(deleteQuery, [id]);

        // Audit log
        await audit.log({
            service: SERVICE_NAME,
            action: 'DELETE',
            entity: 'Tier',
            entityId: id,
            userId,
            details: { name: checkResult.rows[0].name }
        });

        log.info('Tier deleted', { id });
        return success({ message: 'Tier deleted successfully' });

    } catch (err) {
        log.error('Failed to delete tier', { error: err.message, id });
        return error('Failed to delete tier', err);
    }
};
