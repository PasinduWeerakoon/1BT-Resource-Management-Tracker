/**
 * Tracks Handler
 * Lambda handlers for tech track management
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error, notFound, validationError } from '/opt/nodejs/utils/response.js';
import { validate, trackSchemas } from '/opt/nodejs/validation/index.js';
import audit from '/opt/nodejs/lib/audit/index.js';

const SERVICE_NAME = 'resource-service';

/**
 * List all tracks
 */
export const list = async (event) => {
    const log = logger.child({ handler: 'tracks.list' });

    try {
        log.info('Listing tracks');

        const query = 'SELECT * FROM tracks ORDER BY name ASC';
        const result = await db.query(query);

        return success({
            data: result.rows,
            total: result.rows.length
        });

    } catch (err) {
        log.error('Failed to list tracks', { error: err.message });
        return error('Failed to list tracks', err);
    }
};

/**
 * Get a track by ID
 */
export const getById = async (event) => {
    const log = logger.child({ handler: 'tracks.getById' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting track', { id });

        const query = 'SELECT * FROM tracks WHERE id = $1';
        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return notFound('Track not found');
        }

        return success(result.rows[0]);

    } catch (err) {
        log.error('Failed to get track', { id, error: err.message });
        return error('Failed to get track', err);
    }
};

/**
 * Create a new track
 */
export const create = async (event) => {
    const log = logger.child({ handler: 'tracks.create' });

    try {
        const body = JSON.parse(event.body || '{}');
        const validated = validate(body, trackSchemas.create);

        log.info('Creating track', { name: validated.name });

        const query = `
            INSERT INTO tracks (name, description, is_active)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const params = [
            validated.name,
            validated.description || null,
            validated.is_active ?? true
        ];

        const result = await db.query(query, params);
        const newTrack = result.rows[0];

        // Send audit event for track creation
        await audit.create(
            event,
            'track',
            newTrack.id,
            newTrack.name,
            newTrack,
            SERVICE_NAME
        );

        log.info('Track created', { id: newTrack.id });

        return success(newTrack, 201);

    } catch (err) {
        log.error('Failed to create track', { error: err.message });

        if (err.name === 'ValidationError') {
            return validationError(err.details);
        }

        if (err.code === '23505') { // Unique violation
            return error('A track with this name already exists', null, 409);
        }

        return error('Failed to create track', err);
    }
};

/**
 * Update an existing track
 */
export const update = async (event) => {
    const log = logger.child({ handler: 'tracks.update' });
    const { id } = event.pathParameters;

    try {
        const body = JSON.parse(event.body || '{}');
        const validated = validate(body, trackSchemas.update);

        log.info('Updating track', { id });

        // Check if exists and get current data for audit
        const existingResult = await db.query('SELECT * FROM tracks WHERE id = $1', [id]);
        if (existingResult.rows.length === 0) {
            return notFound('Track not found');
        }
        const existing = existingResult.rows[0];

        // Build dynamic update
        const { name, description, is_active } = validated;
        const updates = [];
        const params = [id];
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

        if (updates.length === 0) {
            return success(existing);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');

        const query = `
            UPDATE tracks
            SET ${updates.join(', ')}
            WHERE id = $1
            RETURNING *
        `;

        const result = await db.query(query, params);
        const updatedTrack = result.rows[0];

        // Send audit event for track update
        await audit.update(
            event,
            'track',
            id,
            updatedTrack.name,
            existing,
            updatedTrack,
            SERVICE_NAME
        );

        log.info('Track updated', { id });

        return success(updatedTrack);

    } catch (err) {
        log.error('Failed to update track', { id, error: err.message });

        if (err.name === 'ValidationError') {
            return validationError(err.details);
        }

        return error('Failed to update track', err);
    }
};

/**
 * Delete a track
 */
export const remove = async (event) => {
    const log = logger.child({ handler: 'tracks.remove' });
    const { id } = event.pathParameters;
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;

    try {
        log.info('Deleting track', { id, userId });

        // Check if exists and get current data for audit
        const existingResult = await db.query('SELECT * FROM tracks WHERE id = $1', [id]);
        if (existingResult.rows.length === 0) {
            return notFound('Track not found');
        }
        const existing = existingResult.rows[0];

        // Check if track is being used by any resources
        const usageCheck = await db.query(
            'SELECT COUNT(*) as count FROM resources WHERE track_id = $1',
            [id]
        );

        if (parseInt(usageCheck.rows[0].count) > 0) {
            return error('Cannot delete track that is in use by resources', null, 409);
        }

        const query = 'DELETE FROM tracks WHERE id = $1 RETURNING *';
        const result = await db.query(query, [id]);

        // Send audit event for track deletion
        await audit.delete(
            event,
            'track',
            id,
            existing.name,
            existing,
            SERVICE_NAME
        );

        log.info('Track deleted', { id });

        return success({ message: 'Track deleted successfully', data: result.rows[0] });

    } catch (err) {
        log.error('Failed to delete track', { id, error: err.message });
        return error('Failed to delete track', err);
    }
};
