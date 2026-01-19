/**
 * Resources Handler
 * Lambda handlers for resource (employee) management
 * Uses shared layer for database, logger, and utilities
 */

// Import from Lambda Layer (mounted at /opt/nodejs)
import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error, notFound, validationError, conflict } from '/opt/nodejs/utils/response.js';
import { validate, resourceSchemas } from '/opt/nodejs/validation/index.js';

/**
 * List resources with pagination and filters
 */
export const list = async (event) => {
    const log = logger.child({ handler: 'resources.list' });

    try {
        const queryParams = event.queryStringParameters || {};

        // Validate query parameters
        const validated = validate(queryParams, resourceSchemas.list);
        const { page, limit, search, track_id, designation_id, status, is_intern } = validated;
        const offset = (page - 1) * limit;

        log.info('Listing resources', { page, limit, filters: { search, track_id, status } });

        // Build dynamic query
        let whereClause = 'WHERE r.deleted_at IS NULL';
        const params = [];
        let paramIndex = 1;

        if (search) {
            whereClause += ` AND (r.name ILIKE $${paramIndex} OR r.email ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (track_id) {
            whereClause += ` AND r.track_id = $${paramIndex}`;
            params.push(track_id);
            paramIndex++;
        }

        if (designation_id) {
            whereClause += ` AND r.designation_id = $${paramIndex}`;
            params.push(designation_id);
            paramIndex++;
        }

        if (status) {
            whereClause += ` AND r.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (is_intern !== undefined) {
            whereClause += ` AND r.is_intern = $${paramIndex}`;
            params.push(is_intern);
            paramIndex++;
        }

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM resources r 
            ${whereClause}
        `;
        const countResult = await db.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total);

        // Get paginated results with joins
        const dataQuery = `
            SELECT 
                r.*,
                d.name as designation_name,
                d.level as designation_level,
                t.name as track_name
            FROM resources r
            LEFT JOIN designations d ON r.designation_id = d.id
            LEFT JOIN tracks t ON r.track_id = t.id
            ${whereClause}
            ORDER BY r.name ASC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        params.push(limit, offset);

        const result = await db.query(dataQuery, params);

        return success({
            data: result.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (err) {
        log.error('Failed to list resources', { error: err.message });

        if (err.name === 'ValidationError') {
            return validationError(err.details);
        }

        return error('Failed to list resources', err);
    }
};

/**
 * Get a single resource by ID
 */
export const getById = async (event) => {
    const log = logger.child({ handler: 'resources.getById' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting resource', { id });

        const query = `
            SELECT 
                r.*,
                d.name as designation_name,
                d.level as designation_level,
                t.name as track_name
            FROM resources r
            LEFT JOIN designations d ON r.designation_id = d.id
            LEFT JOIN tracks t ON r.track_id = t.id
            WHERE r.id = $1 AND r.deleted_at IS NULL
        `;

        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return notFound('Resource not found');
        }

        return success(result.rows[0]);

    } catch (err) {
        log.error('Failed to get resource', { id, error: err.message });
        return error('Failed to get resource', err);
    }
};

/**
 * Create a new resource
 */
export const create = async (event) => {
    const log = logger.child({ handler: 'resources.create' });

    try {
        const body = JSON.parse(event.body || '{}');
        const validated = validate(body, resourceSchemas.create);

        log.info('Creating resource', { email: validated.email });

        // Check for duplicate email
        const existingCheck = await db.query(
            'SELECT id FROM resources WHERE email = $1 AND deleted_at IS NULL',
            [validated.email]
        );

        if (existingCheck.rows.length > 0) {
            return conflict('A resource with this email already exists');
        }

        const query = `
            INSERT INTO resources (
                name, email, mobile, nic, designation_id, track_id,
                join_date, status, is_intern
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;

        const params = [
            validated.name,
            validated.email,
            validated.mobile || null,
            validated.nic || null,
            validated.designation_id,
            validated.track_id,
            validated.join_date || new Date().toISOString().split('T')[0],
            validated.status || 'ACTIVE',
            validated.is_intern || false
        ];

        const result = await db.query(query, params);

        log.info('Resource created', { id: result.rows[0].id });

        return success(result.rows[0], 201);

    } catch (err) {
        log.error('Failed to create resource', { error: err.message });

        if (err.name === 'ValidationError') {
            return validationError(err.details);
        }

        return error('Failed to create resource', err);
    }
};

/**
 * Update an existing resource
 */
export const update = async (event) => {
    const log = logger.child({ handler: 'resources.update' });
    const { id } = event.pathParameters;

    try {
        const body = JSON.parse(event.body || '{}');
        const validated = validate(body, resourceSchemas.update);

        log.info('Updating resource', { id });

        // Check if resource exists and get current version
        const existing = await db.query(
            'SELECT id, version FROM resources WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (existing.rows.length === 0) {
            return notFound('Resource not found');
        }

        // Optimistic locking check
        if (existing.rows[0].version !== validated.version) {
            return conflict('Resource has been modified by another user. Please refresh and try again.');
        }

        // Build dynamic update query
        const { version, ...updateData } = validated;
        const updates = [];
        const params = [id];
        let paramIndex = 2;

        for (const [key, value] of Object.entries(updateData)) {
            if (value !== undefined) {
                updates.push(`${key} = $${paramIndex}`);
                params.push(value);
                paramIndex++;
            }
        }

        if (updates.length === 0) {
            return success(existing.rows[0]);
        }

        // Increment version
        updates.push(`version = version + 1`);
        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        const query = `
            UPDATE resources 
            SET ${updates.join(', ')}
            WHERE id = $1 AND deleted_at IS NULL
            RETURNING *
        `;

        const result = await db.query(query, params);

        log.info('Resource updated', { id });

        return success(result.rows[0]);

    } catch (err) {
        log.error('Failed to update resource', { id, error: err.message });

        if (err.name === 'ValidationError') {
            return validationError(err.details);
        }

        return error('Failed to update resource', err);
    }
};

/**
 * Soft delete a resource
 */
export const remove = async (event) => {
    const log = logger.child({ handler: 'resources.remove' });
    const { id } = event.pathParameters;

    try {
        log.info('Deleting resource', { id });

        // Check if resource exists
        const existing = await db.query(
            'SELECT id FROM resources WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (existing.rows.length === 0) {
            return notFound('Resource not found');
        }

        // Soft delete
        await db.query(
            'UPDATE resources SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
            [id]
        );

        log.info('Resource deleted', { id });

        return success({ message: 'Resource deleted successfully' });

    } catch (err) {
        log.error('Failed to delete resource', { id, error: err.message });
        return error('Failed to delete resource', err);
    }
};

/**
 * Get allocations for a resource
 */
export const getAllocations = async (event) => {
    const log = logger.child({ handler: 'resources.getAllocations' });
    const { id } = event.pathParameters;
    const queryParams = event.queryStringParameters || {};
    const includeHistory = queryParams.includeHistory === 'true';

    try {
        log.info('Getting resource allocations', { id, includeHistory });

        // Check if resource exists
        const resourceCheck = await db.query(
            'SELECT id FROM resources WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (resourceCheck.rows.length === 0) {
            return notFound('Resource not found');
        }

        let whereClause = 'WHERE a.resource_id = $1';
        if (!includeHistory) {
            whereClause += " AND a.status = 'ACTIVE'";
        }

        const query = `
            SELECT 
                a.*,
                p.project_name,
                p.project_code,
                p.project_type,
                c.client_name
            FROM allocations a
            LEFT JOIN projects p ON a.project_id = p.id
            LEFT JOIN clients c ON p.client_id = c.id
            ${whereClause}
            ORDER BY a.start_date DESC
        `;

        const result = await db.query(query, [id]);

        return success({
            resource_id: id,
            allocations: result.rows,
            total: result.rows.length
        });

    } catch (err) {
        log.error('Failed to get resource allocations', { id, error: err.message });
        return error('Failed to get resource allocations', err);
    }
};

/**
 * Get designation history for a resource
 */
export const getDesignationHistory = async (event) => {
    const log = logger.child({ handler: 'resources.getDesignationHistory' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting designation history', { id });

        // Check if resource exists
        const resourceCheck = await db.query(
            'SELECT id, name FROM resources WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (resourceCheck.rows.length === 0) {
            return notFound('Resource not found');
        }

        const query = `
            SELECT 
                dh.*,
                d.name as designation_name,
                d.level as designation_level
            FROM designation_history dh
            LEFT JOIN designations d ON dh.designation_id = d.id
            WHERE dh.resource_id = $1
            ORDER BY dh.effective_date DESC
        `;

        const result = await db.query(query, [id]);

        return success({
            resource_id: id,
            resource_name: resourceCheck.rows[0].name,
            history: result.rows
        });

    } catch (err) {
        log.error('Failed to get designation history', { id, error: err.message });
        return error('Failed to get designation history', err);
    }
};
