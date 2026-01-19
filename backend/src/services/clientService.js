/**
 * Client Service
 * Business logic for Client management
 */

import * as db from '../lib/database/index.js';
import logger from '../lib/logger/index.js';

const list = async ({ page = 1, limit = 20, search, is_active }) => {
    const offset = (page - 1) * limit;
    const params = [];
    let paramIndex = 1;

    let whereClause = 'WHERE deleted_at IS NULL';

    if (search) {
        whereClause += ` AND (client_name ILIKE $${paramIndex} OR contact_person ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
    }

    if (is_active !== undefined) {
        whereClause += ` AND is_active = $${paramIndex}`;
        params.push(is_active);
        paramIndex++;
    }

    const countQuery = `SELECT COUNT(*) as total FROM clients ${whereClause}`;
    const dataQuery = `
        SELECT * FROM clients
        ${whereClause}
        ORDER BY client_name ASC
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
    const query = 'SELECT * FROM clients WHERE id = $1 AND deleted_at IS NULL';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
};

const create = async (data, userId) => {
    const query = `
        INSERT INTO clients (client_name, contact_person, contact_email, contact_phone, address, is_active, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `;
    const params = [
        data.client_name,
        data.contact_person || null,
        data.contact_email || null,
        data.contact_phone || null,
        data.address || null,
        data.is_active ?? true,
        userId,
    ];

    const result = await db.query(query, params);
    logger.info('Client created', { clientId: result.rows[0].id, createdBy: userId });
    return result.rows[0];
};

const update = async (id, data, userId) => {
    const updates = [];
    const params = [id];
    let idx = 2;

    const fieldMappings = {
        client_name: 'client_name',
        contact_person: 'contact_person',
        contact_email: 'contact_email',
        contact_phone: 'contact_phone',
        address: 'address',
        is_active: 'is_active',
    };

    for (const [key, column] of Object.entries(fieldMappings)) {
        if (data[key] !== undefined) {
            updates.push(`${column} = $${idx++}`);
            params.push(data[key]);
        }
    }

    if (updates.length === 0) return getById(id);

    updates.push(`updated_by = $${idx++}`);
    params.push(userId);

    const query = `
        UPDATE clients
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING *
    `;

    const result = await db.query(query, params);
    if (result.rowCount === 0) return null;

    logger.info('Client updated', { clientId: id, updatedBy: userId });
    return result.rows[0];
};

const softDelete = async (id, userId) => {
    const query = `
        UPDATE clients
        SET deleted_at = CURRENT_TIMESTAMP, updated_by = $2
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING id
    `;
    const result = await db.query(query, [id, userId]);

    if (result.rowCount === 0) return false;

    logger.info('Client soft deleted', { clientId: id, deletedBy: userId });
    return true;
};

const getProjects = async (clientId) => {
    const query = `
        SELECT * FROM projects
        WHERE client_id = $1 AND deleted_at IS NULL
        ORDER BY project_name ASC
    `;
    const result = await db.query(query, [clientId]);
    return result.rows;
};

export default {
    list,
    getById,
    create,
    update,
    softDelete,
    getProjects,
};
