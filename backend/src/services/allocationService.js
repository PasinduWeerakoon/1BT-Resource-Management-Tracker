/**
 * Allocation Service
 * Business logic for Resource Allocations
 */

import * as db from '../lib/database/index.js';
import logger from '../lib/logger/index.js';

const list = async ({ page = 1, limit = 20, resource_id, project_id, status }) => {
    const offset = (page - 1) * limit;
    const params = [];
    let paramIndex = 1;

    let whereClause = 'WHERE 1=1';

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

    const countQuery = `SELECT COUNT(*) as total FROM allocations a ${whereClause}`;
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

    params.push(limit, offset);

    const [countResult, dataResult] = await Promise.all([
        db.query(countQuery, params.slice(0, -2)),
        db.query(dataQuery, params),
    ]);

    return {
        items: dataResult.rows,
        total: parseInt(countResult.rows[0].total, 10),
    };
};

const getById = async (id) => {
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
    return result.rows[0] || null;
};

const create = async (data, userId) => {
    // Validate total allocation doesn't exceed 100%
    const validationResult = await validateAllocation(data.resource_id, data.allocation_percentage, null, data.start_date, data.end_date);
    if (!validationResult.valid) {
        const error = new Error(validationResult.message);
        error.code = 'ALLOCATION_EXCEEDED';
        throw error;
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
        data.resource_id,
        data.project_id,
        data.allocation_percentage,
        data.start_date,
        data.end_date || null,
        data.status || 'ACTIVE',
        data.notes || null,
        userId,
    ];

    const result = await db.query(query, params);

    // Log to history
    await logAllocationHistory(result.rows[0], 'CREATE', userId);

    logger.info('Allocation created', { allocationId: result.rows[0].id, createdBy: userId });
    return getById(result.rows[0].id);
};

const update = async (id, data, userId) => {
    const { version, ...updateData } = data;

    // If updating percentage, validate
    if (updateData.allocation_percentage !== undefined) {
        const existing = await getById(id);
        if (!existing) return null;

        const validationResult = await validateAllocation(
            existing.resource_id,
            updateData.allocation_percentage,
            id,
            updateData.start_date || existing.start_date,
            updateData.end_date || existing.end_date
        );
        if (!validationResult.valid) {
            const error = new Error(validationResult.message);
            error.code = 'ALLOCATION_EXCEEDED';
            throw error;
        }
    }

    const updates = [];
    const params = [id, version, userId];
    let idx = 4;

    const fieldMappings = {
        allocation_percentage: 'allocation_percentage',
        start_date: 'start_date',
        end_date: 'end_date',
        status: 'status',
        notes: 'notes',
    };

    for (const [key, column] of Object.entries(fieldMappings)) {
        if (updateData[key] !== undefined) {
            updates.push(`${column} = $${idx++}`);
            params.push(updateData[key]);
        }
    }

    if (updates.length === 0) return getById(id);

    updates.push('updated_by = $3');
    updates.push('version = version + 1');

    const query = `
        UPDATE allocations
        SET ${updates.join(', ')}
        WHERE id = $1 AND version = $2
        RETURNING *
    `;

    const result = await db.query(query, params);

    if (result.rowCount === 0) {
        const existing = await getById(id);
        if (!existing) return null;
        const error = new Error('VERSION_CONFLICT');
        throw error;
    }

    // Log to history
    await logAllocationHistory(result.rows[0], 'UPDATE', userId);

    logger.info('Allocation updated', { allocationId: id, updatedBy: userId });
    return getById(id);
};

const remove = async (id, userId) => {
    const existing = await getById(id);
    if (!existing) return false;

    const query = 'DELETE FROM allocations WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);

    if (result.rowCount === 0) return false;

    // Log to history
    await logAllocationHistory({ ...existing, id }, 'DELETE', userId);

    logger.info('Allocation deleted', { allocationId: id, deletedBy: userId });
    return true;
};

// Helper: Validate total allocation for a resource
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
        };
    }

    return { valid: true, currentTotal, newTotal };
};

// Helper: Log allocation changes to history
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
        changeType,
    ]);
};

// Get resource utilization summary
const getResourceUtilization = async (resourceId) => {
    const query = `
        SELECT 
            r.id,
            r.name as resource_name,
            COALESCE(SUM(CASE WHEN a.status = 'ACTIVE' AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE) THEN a.allocation_percentage ELSE 0 END), 0) as current_allocation,
            100 - COALESCE(SUM(CASE WHEN a.status = 'ACTIVE' AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE) THEN a.allocation_percentage ELSE 0 END), 0) as available_capacity
        FROM resources r
        LEFT JOIN allocations a ON r.id = a.resource_id
        WHERE r.id = $1 AND r.deleted_at IS NULL
        GROUP BY r.id, r.name
    `;
    const result = await db.query(query, [resourceId]);
    return result.rows[0] || null;
};

export default {
    list,
    getById,
    create,
    update,
    remove,
    validateAllocation,
    getResourceUtilization,
};
