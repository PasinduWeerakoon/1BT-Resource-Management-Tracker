/**
 * Tiers Handler
 * Lambda handlers for tier management
 * 
 * Tiers are hardcoded configs from the shared layer, not database-managed.
 * This handler provides read-only access to the shared config values.
 */

import logger from '/opt/nodejs/logger/index.js';
import { success, error, notFound } from '/opt/nodejs/utils/response.js';
import { TIERS, getConfigById } from '/opt/nodejs/configs/index.js';

/**
 * List all tiers
 */
export const list = async (event) => {
    const log = logger.child({ handler: 'tiers.list' });

    try {
        log.info('Listing tiers');

        const queryParams = event.queryStringParameters || {};
        const { is_active, search } = queryParams;

        let tiers = [...TIERS];

        // Filter by active status
        if (is_active !== undefined) {
            const activeFilter = is_active === 'true';
            tiers = tiers.filter(t => t.isActive === activeFilter);
        }

        // Filter by search term
        if (search) {
            const searchLower = search.toLowerCase();
            tiers = tiers.filter(t =>
                t.label.toLowerCase().includes(searchLower) ||
                t.description.toLowerCase().includes(searchLower)
            );
        }

        // Sort by displayOrder
        tiers.sort((a, b) => a.displayOrder - b.displayOrder);

        return success({
            data: tiers,
            total: tiers.length
        });

    } catch (err) {
        log.error('Failed to list tiers', { error: err.message });
        return error('Failed to list tiers', err);
    }
};

/**
 * Get a tier by ID
 */
export const getById = async (event) => {
    const log = logger.child({ handler: 'tiers.getById' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting tier', { id });

        const tier = getConfigById(TIERS, parseInt(id, 10));

        if (!tier) {
            return notFound('Tier not found');
        }

        return success(tier);

    } catch (err) {
        log.error('Failed to get tier', { id, error: err.message });
        return error('Failed to get tier', err);
    }
};

/**
 * Create a new tier - Not supported for hardcoded configs
 */
export const create = async (event) => {
    return error('Tiers are hardcoded configs and cannot be created via API. Please update the shared configs module.', null, 405);
};

/**
 * Update an existing tier - Not supported for hardcoded configs
 */
export const update = async (event) => {
    return error('Tiers are hardcoded configs and cannot be updated via API. Please update the shared configs module.', null, 405);
};

/**
 * Delete a tier - Not supported for hardcoded configs
 */
export const remove = async (event) => {
    return error('Tiers are hardcoded configs and cannot be deleted via API. Please update the shared configs module.', null, 405);
};
