/**
 * Tracks Handler
 * Lambda handlers for track management
 * 
 * Tracks are hardcoded configs from the shared layer, not database-managed.
 * This handler provides read-only access to the shared config values.
 */

import logger from '/opt/nodejs/logger/index.js';
import { success, error, notFound } from '/opt/nodejs/utils/response.js';
import { TRACKS, getConfigById } from '/opt/nodejs/configs/index.js';

/**
 * List all tracks
 */
export const list = async (event) => {
    const log = logger.child({ handler: 'tracks.list' });

    try {
        log.info('Listing tracks');

        const queryParams = event.queryStringParameters || {};
        const { is_active, search } = queryParams;

        let tracks = [...TRACKS];

        // Filter by active status
        if (is_active !== undefined) {
            const activeFilter = is_active === 'true';
            tracks = tracks.filter(t => t.isActive === activeFilter);
        }

        // Filter by search term
        if (search) {
            const searchLower = search.toLowerCase();
            tracks = tracks.filter(t => 
                t.label.toLowerCase().includes(searchLower) || 
                t.description.toLowerCase().includes(searchLower)
            );
        }

        // Sort by displayOrder
        tracks.sort((a, b) => a.displayOrder - b.displayOrder);

        return success({
            data: tracks,
            total: tracks.length
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

        const track = getConfigById(TRACKS, parseInt(id, 10));

        if (!track) {
            return notFound('Track not found');
        }

        return success(track);

    } catch (err) {
        log.error('Failed to get track', { id, error: err.message });
        return error('Failed to get track', err);
    }
};

/**
 * Create a new track - Not supported for hardcoded configs
 */
export const create = async (event) => {
    return error('Tracks are hardcoded configs and cannot be created via API. Please update the shared configs module.', null, 405);
};

/**
 * Update an existing track - Not supported for hardcoded configs
 */
export const update = async (event) => {
    return error('Tracks are hardcoded configs and cannot be updated via API. Please update the shared configs module.', null, 405);
};

/**
 * Delete a track - Not supported for hardcoded configs
 */
export const remove = async (event) => {
    return error('Tracks are hardcoded configs and cannot be deleted via API. Please update the shared configs module.', null, 405);
};
