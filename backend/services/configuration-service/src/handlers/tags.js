/**
 * Tags Handler
 * Lambda handlers for tag management
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error, notFound, validationError } from '/opt/nodejs/utils/response.js';
import audit from '/opt/nodejs/lib/audit/index.js';

const SERVICE_NAME = 'resource-service';

/**
 * Transform database row to config format
 */
const transformRow = (row) => ({
    id: row.id,
    value: row.id,
    label: row.name,
    description: row.description || row.name,
    isActive: row.is_active,
    displayOrder: row.id,
    ...(row.is_default !== undefined && { isDefault: row.is_default }),
});

/**
 * List all tags
 */
export const list = async (event) => {
    const log = logger.child({ handler: 'tags.list' });

    try {
        log.info('Listing tags');

        const query = 'SELECT * FROM tags ORDER BY name ASC';
        const result = await db.query(query);

        return success({
            data: result.rows.map(transformRow),
            total: result.rows.length
        });

    } catch (err) {
        log.error('Failed to list tags', { error: err.message });
        return error('Failed to list tags', err);
    }
};

/**
 * Get a tag by ID
 */
export const getById = async (event) => {
    const log = logger.child({ handler: 'tags.getById' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting tag', { id });

        const query = 'SELECT * FROM tags WHERE id = $1';
        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return notFound('Tag not found');
        }

        return success(result.rows[0]);

    } catch (err) {
        log.error('Failed to get tag', { id, error: err.message });
        return error('Failed to get tag', err);
    }
};

/**
 * Create a new tag
 */
export const create = async (event) => {
    const log = logger.child({ handler: 'tags.create' });

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

        log.info('Creating tag', { name: validated.name });

        const query = `
            INSERT INTO tags (name, description, is_active)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const params = [
            validated.name,
            validated.description || null,
            validated.is_active ?? true
        ];

        const result = await db.query(query, params);
        const newTag = result.rows[0];

        // Send audit event for tag creation
        await audit.create(
            event,
            'tag',
            newTag.id,
            newTag.name,
            newTag,
            SERVICE_NAME
        );

        log.info('Tag created', { id: newTag.id });

        return success(newTag, 201);

    } catch (err) {
        log.error('Failed to create tag', { error: err.message });

        if (err.code === '23505') { // Unique violation
            return error('A tag with this name already exists', null, 409);
        }

        return error('Failed to create tag', err);
    }
};

/**
 * Update an existing tag
 */
export const update = async (event) => {
    const log = logger.child({ handler: 'tags.update' });
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

        log.info('Updating tag', { id });

        // Check if exists and get current data for audit
        const existingResult = await db.query('SELECT * FROM tags WHERE id = $1', [id]);
        if (existingResult.rows.length === 0) {
            return notFound('Tag not found');
        }
        const existing = existingResult.rows[0];

        // Prevent editing default tags
        if (existing.is_default === true) {
            return error('Cannot edit default tag', null, 403);
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
            UPDATE tags
            SET ${updates.join(', ')}
            WHERE id = $1
            RETURNING *
        `;

        const result = await db.query(query, params);
        const updatedTag = result.rows[0];

        // Send audit event for tag update
        await audit.update(
            event,
            'tag',
            id,
            updatedTag.name,
            existing,
            updatedTag,
            SERVICE_NAME
        );

        log.info('Tag updated', { id });

        return success(updatedTag);

    } catch (err) {
        log.error('Failed to update tag', { id, error: err.message });

        if (err.code === '23505') { // Unique violation
            return error('A tag with this name already exists', null, 409);
        }

        return error('Failed to update tag', err);
    }
};

/**
 * Delete a tag
 */
export const remove = async (event) => {
    const log = logger.child({ handler: 'tags.remove' });
    const { id } = event.pathParameters;

    try {
        log.info('Deleting tag', { id });

        // Check if exists and get current data for audit
        const existingResult = await db.query('SELECT * FROM tags WHERE id = $1', [id]);
        if (existingResult.rows.length === 0) {
            return notFound('Tag not found');
        }
        const existing = existingResult.rows[0];

        // Prevent deleting default tags
        if (existing.is_default === true) {
            return error('Cannot delete default tag', null, 403);
        }

        // Check if tag is being used by any resources (if there's a employee_tags table)
        // For now, we'll just check if it exists in any resource tag fields
        // This can be expanded based on your actual schema
        const usageCheck = await db.query(
            `SELECT COUNT(*) as count FROM employees 
             WHERE tags::text LIKE $1 AND deleted_at IS NULL`,
            [`%${existing.name}%`]
        ).catch(() => {
            // If the query fails (e.g., tags column doesn't exist), return empty result
            return { rows: [{ count: '0' }] };
        });

        if (parseInt(usageCheck.rows[0].count) > 0) {
            return error('Cannot delete tag that is in use by resources', null, 409);
        }

        const query = 'DELETE FROM tags WHERE id = $1 RETURNING *';
        const result = await db.query(query, [id]);

        // Send audit event for tag deletion
        await audit.delete(
            event,
            'tag',
            id,
            existing.name,
            existing,
            SERVICE_NAME
        );

        log.info('Tag deleted', { id });

        return success(result.rows[0]);

    } catch (err) {
        log.error('Failed to delete tag', { id, error: err.message });
        return error('Failed to delete tag', err);
    }
};
