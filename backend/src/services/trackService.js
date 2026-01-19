/**
 * Track Service
 * Business logic for Tech Tracks
 */

import * as db from '../lib/database/index.js';

const list = async () => {
    console.log('[trackService.list] Starting query...');
    try {
        const query = 'SELECT * FROM tracks ORDER BY name ASC';
        console.log('[trackService.list] Executing query:', query);
        const result = await db.query(query);
        console.log('[trackService.list] Query succeeded, rows:', result.rows?.length);
        return result.rows;
    } catch (err) {
        console.error('[trackService.list] Query FAILED:', err.message);
        console.error('[trackService.list] Error code:', err.code);
        console.error('[trackService.list] Error detail:', err.detail);
        throw err;
    }
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
