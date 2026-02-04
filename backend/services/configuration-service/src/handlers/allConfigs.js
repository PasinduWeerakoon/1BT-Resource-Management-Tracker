/**
 * All Configurations Handler
 * Returns all configuration values - both hardcoded enums and database-managed configs
 * 
 * Hardcoded configs are imported from the shared layer (/opt/nodejs/configs/index.js)
 * so other services can also access them directly without making API calls.
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error } from '/opt/nodejs/utils/response.js';

// Import hardcoded configs from shared layer - available to ALL services
import {
    TRACKS,
    TECH_STACKS,
    TIERS,
    EMPLOYEE_STATUSES,
    PROJECT_STATUSES,
    ACCOUNT_TYPES,
    USER_ROLES,
    USER_STATUSES,
    CONFIG_METADATA,
} from '/opt/nodejs/configs/index.js';

/**
 * Transform database row to config format
 * Ensures consistent format with numeric id and value, label, description, isActive, displayOrder
 * Value is always numeric (same as id) for consistency with hardcoded configs
 */
const transformDbRow = (row) => ({
    id: row.id,
    value: row.id,  // Use numeric ID for value (consistent with hardcoded configs)
    label: row.name,
    description: row.description || row.name,
    isActive: row.is_active,
    displayOrder: row.display_order || row.level || row.id,
    // Include additional fields if they exist
    ...(row.level !== undefined && { level: row.level }),
    ...(row.tier_id !== undefined && { tierId: row.tier_id }),
    ...(row.is_intern_role !== undefined && { isInternRole: row.is_intern_role }),
    ...(row.category && { category: row.category }),
    ...(row.is_default !== undefined && { isDefault: row.is_default }),
    ...(row.color && { color: row.color }),
    ...(row.short_name && { shortName: row.short_name }),
    ...(row.country && { country: row.country }),
});

/**
 * Get all configurations
 * Returns both hardcoded enums and database-managed configs in a unified format
 */
export const getAll = async (event) => {
    const log = logger.child({ handler: 'allConfigs.getAll' });

    try {
        log.info('Fetching all configurations');

        // Query all database-managed configurations in parallel
        const [
            designationsResult,
            billingStatusesResult,
            projectTypesResult,
            employeeTypesResult,
            tagsResult,
            universitiesResult
        ] = await Promise.all([
            db.query('SELECT * FROM designations WHERE is_active = true ORDER BY display_order ASC, level ASC, name ASC'),
            db.query('SELECT * FROM billing_statuses WHERE is_active = true ORDER BY display_order ASC, name ASC'),
            db.query('SELECT * FROM project_types WHERE is_active = true ORDER BY display_order ASC, name ASC'),
            db.query('SELECT * FROM employee_types WHERE is_active = true ORDER BY name ASC'),
            db.query('SELECT * FROM tags WHERE is_active = true ORDER BY name ASC'),
            db.query('SELECT * FROM universities WHERE is_active = true ORDER BY name ASC'),
        ]);

        // Build response with both config-based and database-based values
        const configs = {
            // Config-based enums (hardcoded)
            tracks: TRACKS.filter(t => t.isActive),
            techStacks: TECH_STACKS.filter(t => t.isActive),
            tiers: TIERS.filter(t => t.isActive),
            employeeStatuses: EMPLOYEE_STATUSES.filter(s => s.isActive),
            projectStatuses: PROJECT_STATUSES.filter(s => s.isActive),
            accountTypes: ACCOUNT_TYPES.filter(t => t.isActive),
            userRoles: USER_ROLES.filter(r => r.isActive),
            userStatuses: USER_STATUSES.filter(s => s.isActive),

            // Database-managed configurations
            designations: designationsResult.rows.map(row => transformDbRow(row)),
            billingStatuses: billingStatusesResult.rows.map(row => transformDbRow(row)),
            projectTypes: projectTypesResult.rows.map(row => transformDbRow(row)),
            employeeTypes: employeeTypesResult.rows.map(row => transformDbRow(row)),
            tags: tagsResult.rows.map(row => transformDbRow(row)),
            universities: universitiesResult.rows.map(row => transformDbRow(row)),
        };

        log.info('Configurations fetched successfully', {
            tracks: configs.tracks.length,
            techStacks: configs.techStacks.length,
            tiers: configs.tiers.length,
            designations: configs.designations.length,
            billingStatuses: configs.billingStatuses.length,
            projectTypes: configs.projectTypes.length,
            employeeTypes: configs.employeeTypes.length,
            tags: configs.tags.length,
            universities: configs.universities.length,
        });

        return success({
            data: configs,
            meta: CONFIG_METADATA,
        });

    } catch (err) {
        log.error('Failed to fetch configurations', { error: err.message, stack: err.stack });
        return error('Failed to fetch configurations', 500);
    }
};

export default { getAll };
