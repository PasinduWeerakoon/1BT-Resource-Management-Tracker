/**
 * Designation Service
 * Business logic for Designations
 */

import * as db from '../lib/database/index.js';

const list = async () => {
    const query = 'SELECT * FROM designations ORDER BY level ASC, name ASC';
    const result = await db.query(query);
    return result.rows;
};

const getById = async (id) => {
    const query = 'SELECT * FROM designations WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
};

const create = async (data) => {
    const query = `
        INSERT INTO designations (name, level, is_intern_role, is_active)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;
    const params = [
        data.name,
        data.level,
        data.is_intern_role ?? false,
        data.is_active ?? true
    ];
    const result = await db.query(query, params);
    return result.rows[0];
};

const update = async (id, data) => {
    const { name, level, is_intern_role, is_active } = data;
    const params = [id];
    const updates = [];
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

    if (updates.length === 0) return getById(id);

    const query = `
        UPDATE designations
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
    `;

    const result = await db.query(query, params);
    return result.rows[0];
};

export default {
    list,
    getById,
    create,
    update
};
