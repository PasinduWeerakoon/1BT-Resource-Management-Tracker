/**
 * Project Types Handler
 * Lambda handlers for project type management
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
    displayOrder: row.display_order || row.id,
    ...(row.is_default !== undefined && { isDefault: row.is_default }),
});

/**
 * List all project types
 */
export const list = async (event) => {
    const log = logger.child({ handler: 'projectTypes.list' });

    try {
        log.info('Listing project types');

        const query = 'SELECT * FROM project_types ORDER BY display_order ASC, name ASC';
        const result = await db.query(query);

        return success({
            data: result.rows.map(transformRow),
            total: result.rows.length
        });

    } catch (err) {
        log.error('Failed to list project types', { error: err.message });
        return error('Failed to list project types', err);
    }
};

/**
 * Get a project type by ID
 */
export const getById = async (event) => {
    const log = logger.child({ handler: 'projectTypes.getById' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting project type', { id });

        const query = 'SELECT * FROM project_types WHERE id = $1';
        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return notFound('Project type not found');
        }

        return success(result.rows[0]);

    } catch (err) {
        log.error('Failed to get project type', { id, error: err.message });
        return error('Failed to get project type', err);
    }
};

/**
 * Create a new project type
 */
export const create = async (event) => {
    const log = logger.child({ handler: 'projectTypes.create' });

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

        log.info('Creating project type', { name: validated.name });

        const query = `
            INSERT INTO project_types (name, description, is_active)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const params = [
            validated.name,
            validated.description || null,
            validated.is_active ?? true
        ];

        const result = await db.query(query, params);
        const newProjectType = result.rows[0];

        // Send audit event for project type creation
        await audit.create(
            event,
            'project_type',
            newProjectType.id,
            newProjectType.name,
            newProjectType,
            SERVICE_NAME
        );

        log.info('Project type created', { id: newProjectType.id });

        return success(newProjectType, 201);

    } catch (err) {
        log.error('Failed to create project type', { error: err.message });

        if (err.code === '23505') { // Unique violation
            return error('A project type with this name already exists', null, 409);
        }

        return error('Failed to create project type', err);
    }
};

/**
 * Update an existing project type
 */
export const update = async (event) => {
    const log = logger.child({ handler: 'projectTypes.update' });
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

        log.info('Updating project type', { id });

        // Check if exists and get current data for audit
        const existingResult = await db.query('SELECT * FROM project_types WHERE id = $1', [id]);
        if (existingResult.rows.length === 0) {
            return notFound('Project type not found');
        }
        const existing = existingResult.rows[0];

        // Prevent editing default project types
        if (existing.is_default === true) {
            return error('Cannot edit default project type', null, 403);
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
            UPDATE project_types
            SET ${updates.join(', ')}
            WHERE id = $1
            RETURNING *
        `;

        const result = await db.query(query, params);
        const updatedProjectType = result.rows[0];

        // Send audit event for project type update
        await audit.update(
            event,
            'project_type',
            id,
            updatedProjectType.name,
            existing,
            updatedProjectType,
            SERVICE_NAME
        );

        log.info('Project type updated', { id });

        return success(updatedProjectType);

    } catch (err) {
        log.error('Failed to update project type', { id, error: err.message });

        if (err.code === '23505') { // Unique violation
            return error('A project type with this name already exists', null, 409);
        }

        return error('Failed to update project type', err);
    }
};

/**
 * Delete a project type
 */
export const remove = async (event) => {
    const log = logger.child({ handler: 'projectTypes.remove' });
    const { id } = event.pathParameters;

    try {
        log.info('Deleting project type', { id });

        // Check if exists and get current data for audit
        const existingResult = await db.query('SELECT * FROM project_types WHERE id = $1', [id]);
        if (existingResult.rows.length === 0) {
            return notFound('Project type not found');
        }
        const existing = existingResult.rows[0];

        // Prevent deleting default project types
        if (existing.is_default === true) {
            return error('Cannot delete default project type', null, 403);
        }

        // Check if project type is being used by any projects
        const usageCheck = await db.query(
            'SELECT COUNT(*) as count FROM projects WHERE project_type = $1 AND deleted_at IS NULL',
            [existing.name]
        );

        if (parseInt(usageCheck.rows[0].count) > 0) {
            return error('Cannot delete project type that is in use by projects', null, 409);
        }

        const query = 'DELETE FROM project_types WHERE id = $1 RETURNING *';
        const result = await db.query(query, [id]);

        // Send audit event for project type deletion
        await audit.delete(
            event,
            'project_type',
            id,
            existing.name,
            existing,
            SERVICE_NAME
        );

        log.info('Project type deleted', { id });

        return success(result.rows[0]);

    } catch (err) {
        log.error('Failed to delete project type', { id, error: err.message });
        return error('Failed to delete project type', err);
    }
};
