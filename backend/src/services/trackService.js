/**
 * Track Service
 * Business logic for Tech Tracks
 */

import * as db from '../lib/database/index.js';

const list = async () => {
    const query = 'SELECT * FROM tracks ORDER BY name ASC';
    const result = await db.query(query);
    return result.rows;
};

const getById = async (id) => {
    const query = 'SELECT * FROM tracks WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
};

const create = async (data) => {
    const query = `
        INSERT INTO tracks (name, description, is_active)
        VALUES ($1, $2, $3)
        RETURNING *
    `;
    const params = [data.name, data.description, data.is_active ?? true];
    const result = await db.query(query, params);
    return result.rows[0];
};

const update = async (id, data) => {
    const { name, description, is_active } = data;
    const params = [id];
    const updates = [];
    let idx = 2;

    if (name !== undefined) {
        updates.push(`name = $${idx++}`);
        params.push(name);
    }
    if (description !== undefined) {
        updates.push(`description = $${idx++}`);
        params.push(description);
    }
    if (is_active !== undefined) {
        updates.push(`is_active = $${idx++}`);
        params.push(is_active);
    }

    if (updates.length === 0) return getById(id);

    const query = `
        UPDATE tracks
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
