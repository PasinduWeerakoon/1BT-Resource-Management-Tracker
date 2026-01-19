/**
 * Allocations Handler
 * Lambda handlers for resource allocation management
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error, notFound, validationError, conflict, badRequest } from '/opt/nodejs/utils/response.js';
import { validate, allocationSchemas } from '/opt/nodejs/validation/index.js';

/**
 * Validate total allocation doesn't exceed 100%
 */
const validateAllocation = async (resourceId, newPercentage, excludeAllocationId, startDate, endDate) => {
    let query = `
        SELECT COALESCE(SUM(allocation_percentage), 0) as total
        FROM allocations
        WHERE resource_id = $1
        AND status = 'ACTIVE'
        AND (end_date IS NULL OR end_date >= $2)
        AND start_date <= COALESCE($3, '9999-12-31')
    `;
    const params = [resourceId, startDate, endDate];

    if (excludeAllocationId) {
        query += ` AND id != $4`;
        params.push(excludeAllocationId);
    }

    const result = await db.query(query, params);
    const currentTotal = parseInt(result.rows[0].total, 10);
    const newTotal = currentTotal + newPercentage;

    if (newTotal > 100) {
        return {
            valid: false,
            message: `Allocation would exceed 100%. Current: ${currentTotal}%, Request: ${newPercentage}%, Total would be: ${newTotal}%`,
            currentTotal,
            newTotal
        };
    }

    return { valid: true, currentTotal, newTotal };
};

/**
 * Log allocation changes to history
 */
const logAllocationHistory = async (allocation, changeType, userId) => {
    const query = `
        INSERT INTO allocation_history (
            allocation_id, resource_id, project_id, allocation_percentage,
            start_date, end_date, status, changed_by, change_type
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    await db.query(query, [
        allocation.id,
        allocation.resource_id,
        allocation.project_id,
        allocation.allocation_percentage,
        allocation.start_date,
        allocation.end_date,
        allocation.status,
        userId,
        changeType
    ]);
};

/**
 * List allocations with pagination and filters
 */
export const list = async (event) => {
    const log = logger.child({ handler: 'allocations.list' });

    try {
        const queryParams = event.queryStringParameters || {};
        const { page = 1, limit = 20, resource_id, project_id, status } = queryParams;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        log.info('Listing allocations', { page, limit, filters: { resource_id, project_id, status } });

        // Build dynamic query
        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (resource_id) {
            whereClause += ` AND a.resource_id = $${paramIndex}`;
            params.push(resource_id);
            paramIndex++;
        }

        if (project_id) {
            whereClause += ` AND a.project_id = $${paramIndex}`;
            params.push(project_id);
            paramIndex++;
        }

        if (status) {
            whereClause += ` AND a.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM allocations a ${whereClause}`;
        const countResult = await db.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total);

        // Get paginated results with joins
        const dataQuery = `
            SELECT 
                a.*,
                r.name as resource_name,
                r.email as resource_email,
                p.project_name,
                c.client_name
            FROM allocations a
            LEFT JOIN resources r ON a.resource_id = r.id
            LEFT JOIN projects p ON a.project_id = p.id
            LEFT JOIN clients c ON p.client_id = c.id
            ${whereClause}
            ORDER BY a.start_date DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        params.push(parseInt(limit), offset);

        const result = await db.query(dataQuery, params);

        return success({
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (err) {
        log.error('Failed to list allocations', { error: err.message });
        return error('Failed to list allocations', err);
    }
};

/**
 * Get a single allocation by ID
 */
export const getById = async (event) => {
    const log = logger.child({ handler: 'allocations.getById' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting allocation', { id });

        const query = `
            SELECT 
                a.*,
                r.name as resource_name,
                r.email as resource_email,
                p.project_name,
                c.client_name
            FROM allocations a
            LEFT JOIN resources r ON a.resource_id = r.id
            LEFT JOIN projects p ON a.project_id = p.id
            LEFT JOIN clients c ON p.client_id = c.id
            WHERE a.id = $1
        `;

        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return notFound('Allocation not found');
        }

        return success(result.rows[0]);

    } catch (err) {
        log.error('Failed to get allocation', { id, error: err.message });
        return error('Failed to get allocation', err);
    }
};

/**
 * Create a new allocation
 */
export const create = async (event) => {
    const log = logger.child({ handler: 'allocations.create' });

    try {
        const body = JSON.parse(event.body || '{}');
        const validated = validate(body, allocationSchemas.create);
        const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;

        log.info('Creating allocation', { resource_id: validated.resource_id, project_id: validated.project_id });

        // Validate allocation doesn't exceed 100%
        const validationResult = await validateAllocation(
            validated.resource_id,
            validated.allocation_percentage,
            null,
            validated.start_date,
            validated.end_date
        );

        if (!validationResult.valid) {
            return badRequest(validationResult.message);
        }

        const query = `
            INSERT INTO allocations (
                resource_id, project_id, allocation_percentage, start_date, end_date,
                status, notes, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;

        const params = [
            validated.resource_id,
            validated.project_id,
            validated.allocation_percentage,
            validated.start_date,
            validated.end_date || null,
            validated.status || 'ACTIVE',
            validated.notes || null,
            userId
        ];

        const result = await db.query(query, params);
        const allocation = result.rows[0];

        // Log to history
        await logAllocationHistory(allocation, 'CREATE', userId);

        log.info('Allocation created', { id: allocation.id });

        return success(allocation, 201);

    } catch (err) {
        log.error('Failed to create allocation', { error: err.message });

        if (err.name === 'ValidationError') {
            return validationError(err.details);
        }

        if (err.code === '23503') {
            return badRequest('Resource or Project not found');
        }

        return error('Failed to create allocation', err);
    }
};

/**
 * Update an existing allocation
 */
export const update = async (event) => {
    const log = logger.child({ handler: 'allocations.update' });
    const { id } = event.pathParameters;

    try {
        const body = JSON.parse(event.body || '{}');
        const validated = validate(body, allocationSchemas.update);
        const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;

        log.info('Updating allocation', { id, userId });

        // Get existing allocation
        const existingResult = await db.query('SELECT * FROM allocations WHERE id = $1', [id]);
        if (existingResult.rows.length === 0) {
            return notFound('Allocation not found');
        }
        const existing = existingResult.rows[0];

        // Optimistic locking check
        if (validated.version !== undefined && existing.version !== validated.version) {
            return conflict('Allocation has been modified by another user. Please refresh and try again.');
        }

        // If updating percentage, validate
        if (validated.allocation_percentage !== undefined) {
            const validationResult = await validateAllocation(
                existing.resource_id,
                validated.allocation_percentage,
                id,
                validated.start_date || existing.start_date,
                validated.end_date || existing.end_date
            );
            if (!validationResult.valid) {
                return badRequest(validationResult.message);
            }
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
            return success(existing);
        }

        // Add audit fields
        updates.push(`updated_by = $${paramIndex++}`);
        params.push(userId);
        updates.push(`version = version + 1`);
        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        const query = `
            UPDATE allocations 
            SET ${updates.join(', ')}
            WHERE id = $1
            RETURNING *
        `;

        const result = await db.query(query, params);
        const allocation = result.rows[0];

        // Log to history
        await logAllocationHistory(allocation, 'UPDATE', userId);

        log.info('Allocation updated', { id });

        return success(allocation);

    } catch (err) {
        log.error('Failed to update allocation', { id, error: err.message });

        if (err.name === 'ValidationError') {
            return validationError(err.details);
        }

        return error('Failed to update allocation', err);
    }
};

/**
 * Delete an allocation
 */
export const remove = async (event) => {
    const log = logger.child({ handler: 'allocations.remove' });
    const { id } = event.pathParameters;
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;

    try {
        log.info('Deleting allocation', { id, userId });

        // Get existing for history
        const existingResult = await db.query('SELECT * FROM allocations WHERE id = $1', [id]);
        if (existingResult.rows.length === 0) {
            return notFound('Allocation not found');
        }

        const result = await db.query('DELETE FROM allocations WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return notFound('Allocation not found');
        }

        // Log to history
        await logAllocationHistory(existingResult.rows[0], 'DELETE', userId);

        log.info('Allocation deleted', { id });

        return success({ message: 'Allocation deleted successfully' });

    } catch (err) {
        log.error('Failed to delete allocation', { id, error: err.message });
        return error('Failed to delete allocation', err);
    }
};

/**
 * Get utilization summary for a resource
 */
export const getResourceUtilization = async (event) => {
    const log = logger.child({ handler: 'allocations.getResourceUtilization' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting resource utilization', { id });

        // Check if resource exists
        const resourceResult = await db.query(
            'SELECT id, name, email FROM resources WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (resourceResult.rows.length === 0) {
            return notFound('Resource not found');
        }

        const resource = resourceResult.rows[0];

        // Get current active allocations
        const allocationsQuery = `
            SELECT 
                a.*,
                p.project_name
            FROM allocations a
            LEFT JOIN projects p ON a.project_id = p.id
            WHERE a.resource_id = $1
            AND a.status = 'ACTIVE'
            AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE)
            AND a.start_date <= CURRENT_DATE
        `;

        const allocationsResult = await db.query(allocationsQuery, [id]);

        // Calculate total utilization
        const totalUtilization = allocationsResult.rows.reduce(
            (sum, a) => sum + parseInt(a.allocation_percentage),
            0
        );

        return success({
            resource_id: id,
            resource_name: resource.name,
            resource_email: resource.email,
            total_utilization: totalUtilization,
            available_capacity: 100 - totalUtilization,
            active_allocations: allocationsResult.rows.length,
            allocations: allocationsResult.rows
        });

    } catch (err) {
        log.error('Failed to get resource utilization', { id, error: err.message });
        return error('Failed to get resource utilization', err);
    }
};

/**
 * Get allocation history
 */
export const getHistory = async (event) => {
    const log = logger.child({ handler: 'allocations.getHistory' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting allocation history', { id });

        const query = `
            SELECT 
                ah.*,
                u.name as changed_by_name
            FROM allocation_history ah
            LEFT JOIN users u ON ah.changed_by = u.id
            WHERE ah.allocation_id = $1
            ORDER BY ah.created_at DESC
        `;

        const result = await db.query(query, [id]);

        return success({
            allocation_id: id,
            history: result.rows,
            total: result.rows.length
        });

    } catch (err) {
        log.error('Failed to get allocation history', { id, error: err.message });
        return error('Failed to get allocation history', err);
    }
};
