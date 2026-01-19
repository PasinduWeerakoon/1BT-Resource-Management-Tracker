/**
 * Project Service
 * Business logic for Project management
 */

import * as db from '../lib/database/index.js';
import logger from '../lib/logger/index.js';

const list = async ({ page = 1, limit = 20, search, client_id, status, project_type, is_billable }) => {
    const offset = (page - 1) * limit;
    const params = [];
    let paramIndex = 1;

    let whereClause = 'WHERE p.deleted_at IS NULL';

    if (search) {
        whereClause += ` AND (p.project_name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
    }

    if (client_id) {
        whereClause += ` AND p.client_id = $${paramIndex}`;
        params.push(client_id);
        paramIndex++;
    }

    if (status) {
        whereClause += ` AND p.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
    }

    if (project_type) {
        whereClause += ` AND p.project_type = $${paramIndex}`;
        params.push(project_type);
        paramIndex++;
    }

    if (is_billable !== undefined) {
        whereClause += ` AND p.is_billable = $${paramIndex}`;
        params.push(is_billable);
        paramIndex++;
    }

    const countQuery = `SELECT COUNT(*) as total FROM projects p ${whereClause}`;
    const dataQuery = `
        SELECT 
            p.*,
            c.client_name
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        ${whereClause}
        ORDER BY p.project_name ASC
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
            p.*,
            c.client_name
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        WHERE p.id = $1 AND p.deleted_at IS NULL
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
};

const create = async (data, userId) => {
    const query = `
        INSERT INTO projects (
            project_name, client_id, project_type, is_billable, status,
            start_date, end_date, description, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
    `;
    const params = [
        data.project_name,
        data.client_id || null,
        data.project_type || 'Internal',
        data.is_billable ?? true,
        data.status || 'Active',
        data.start_date || null,
        data.end_date || null,
        data.description || null,
        userId,
    ];

    const result = await db.query(query, params);
    logger.info('Project created', { projectId: result.rows[0].id, createdBy: userId });
    return getById(result.rows[0].id);
};

const update = async (id, data, userId) => {
    const { version, ...updateData } = data;

    const updates = [];
    const params = [id, version, userId];
    let idx = 4;

    const fieldMappings = {
        project_name: 'project_name',
        client_id: 'client_id',
        project_type: 'project_type',
        is_billable: 'is_billable',
        status: 'status',
        start_date: 'start_date',
        end_date: 'end_date',
        description: 'description',
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
        UPDATE projects
        SET ${updates.join(', ')}
        WHERE id = $1 AND version = $2 AND deleted_at IS NULL
        RETURNING *
    `;

    const result = await db.query(query, params);

    if (result.rowCount === 0) {
        const existing = await getById(id);
        if (!existing) return null;
        const error = new Error('VERSION_CONFLICT');
        throw error;
    }

    logger.info('Project updated', { projectId: id, updatedBy: userId });
    return getById(id);
};

const softDelete = async (id, userId) => {
    const query = `
        UPDATE projects
        SET deleted_at = CURRENT_TIMESTAMP, updated_by = $2
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING id
    `;
    const result = await db.query(query, [id, userId]);

    if (result.rowCount === 0) return false;

    logger.info('Project soft deleted', { projectId: id, deletedBy: userId });
    return true;
};

const getAllocations = async (projectId) => {
    const query = `
        SELECT 
            a.*,
            r.name as resource_name,
            r.email as resource_email
        FROM allocations a
        LEFT JOIN resources r ON a.resource_id = r.id
        WHERE a.project_id = $1
        ORDER BY a.start_date DESC
    `;
    const result = await db.query(query, [projectId]);
    return result.rows;
};

export default {
    list,
    getById,
    create,
    update,
    softDelete,
    getAllocations,
};
