/**
 * All Configurations Handler
 * Returns all configuration values - both hardcoded enums and database-managed configs
 * 
 * Response format matches the config structure used in backend/configs/
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error } from '/opt/nodejs/utils/response.js';

// Hardcoded configuration enums (from backend/configs/)
const TRACKS = [
    { id: 1, value: 'QA', label: 'QA', description: 'Quality Assurance', isActive: true, displayOrder: 1 },
    { id: 2, value: 'Dev', label: 'Dev', description: 'Development', isActive: true, displayOrder: 2 },
    { id: 3, value: 'UI', label: 'UI', description: 'UI Development', isActive: true, displayOrder: 3 },
    { id: 4, value: 'BA', label: 'BA', description: 'Business Analysis', isActive: true, displayOrder: 4 },
    { id: 5, value: 'PM', label: 'PM', description: 'Project Management', isActive: true, displayOrder: 5 },
    { id: 6, value: 'Support', label: 'Support', description: 'Support Functions', isActive: true, displayOrder: 6 },
    { id: 7, value: 'Synergy', label: 'Synergy', description: 'Synergy Program', isActive: true, displayOrder: 7 },
    { id: 8, value: 'UX', label: 'UX', description: 'User Experience', isActive: true, displayOrder: 8 },
    { id: 9, value: 'Execs', label: 'Execs', description: 'Executives', isActive: true, displayOrder: 9 },
    { id: 10, value: 'Delivery', label: 'Delivery', description: 'Delivery Management', isActive: true, displayOrder: 10 },
    { id: 11, value: 'Functional Consultant - MS Dynamics 365', label: 'Functional Consultant - MS Dynamics 365', description: 'MS Dynamics 365 Functional Consultant', isActive: true, displayOrder: 11 },
];

const TECH_STACKS = [
    { id: 1, value: 'QA', label: 'QA', description: 'Quality Assurance', isActive: true, displayOrder: 1 },
    { id: 2, value: '.NET', label: '.NET', description: '.NET Development', isActive: true, displayOrder: 2 },
    { id: 3, value: 'Full Stack', label: 'Full Stack', description: 'Full Stack Development', isActive: true, displayOrder: 3 },
    { id: 4, value: 'Synergy', label: 'Synergy', description: 'Synergy Program', isActive: true, displayOrder: 4 },
    { id: 5, value: 'PM', label: 'PM', description: 'Project Management', isActive: true, displayOrder: 5 },
    { id: 6, value: 'BA', label: 'BA', description: 'Business Analysis', isActive: true, displayOrder: 6 },
    { id: 7, value: 'UI', label: 'UI', description: 'UI Development', isActive: true, displayOrder: 7 },
    { id: 8, value: 'Java', label: 'Java', description: 'Java Development', isActive: true, displayOrder: 8 },
    { id: 9, value: 'Data Science', label: 'Data Science', description: 'Data Science & Analytics', isActive: true, displayOrder: 9 },
    { id: 10, value: 'Power Apps', label: 'Power Apps', description: 'Microsoft Power Apps', isActive: true, displayOrder: 10 },
    { id: 11, value: 'Finance', label: 'Finance', description: 'Finance Operations', isActive: true, displayOrder: 11 },
    { id: 12, value: 'React', label: 'React', description: 'React.js Development', isActive: true, displayOrder: 12 },
    { id: 13, value: 'Dynamics', label: 'Dynamics', description: 'Microsoft Dynamics', isActive: true, displayOrder: 13 },
    { id: 14, value: 'UX', label: 'UX', description: 'User Experience Design', isActive: true, displayOrder: 14 },
    { id: 15, value: 'BA/PM', label: 'BA/PM', description: 'Business Analysis / Project Management', isActive: true, displayOrder: 15 },
    { id: 16, value: 'UI/UX', label: 'UI/UX', description: 'UI/UX Design', isActive: true, displayOrder: 16 },
    { id: 17, value: 'HR', label: 'HR', description: 'Human Resources', isActive: true, displayOrder: 17 },
    { id: 18, value: 'Execs', label: 'Execs', description: 'Executive Functions', isActive: true, displayOrder: 18 },
    { id: 19, value: 'Admin', label: 'Admin', description: 'Administration', isActive: true, displayOrder: 19 },
    { id: 20, value: 'Marketing', label: 'Marketing', description: 'Marketing', isActive: true, displayOrder: 20 },
    { id: 21, value: 'Drupal', label: 'Drupal', description: 'Drupal Development', isActive: true, displayOrder: 21 },
    { id: 22, value: 'Sales & Marketing', label: 'Sales & Marketing', description: 'Sales & Marketing', isActive: true, displayOrder: 22 },
    { id: 23, value: 'BC', label: 'BC', description: 'Business Central', isActive: true, displayOrder: 23 },
    { id: 24, value: 'Business Central (Functional)', label: 'Business Central (Functional)', description: 'Business Central Functional', isActive: true, displayOrder: 24 },
    { id: 25, value: 'AI/ML', label: 'AI/ML', description: 'AI & Machine Learning', isActive: true, displayOrder: 25 },
    { id: 26, value: 'Blockchain', label: 'Blockchain', description: 'Blockchain Development', isActive: true, displayOrder: 26 },
];

const TIERS = [
    { id: 1, value: 'Tier - 1', label: 'Tier - 1', description: 'Tier 1 - Entry level', isActive: true, displayOrder: 1 },
    { id: 2, value: 'Tier - 2', label: 'Tier - 2', description: 'Tier 2 - Intermediate', isActive: true, displayOrder: 2 },
    { id: 3, value: 'Tier - 3', label: 'Tier - 3', description: 'Tier 3 - Senior', isActive: true, displayOrder: 3 },
    { id: 4, value: 'Tier - 4', label: 'Tier - 4', description: 'Tier 4 - Expert', isActive: true, displayOrder: 4 },
    { id: 5, value: 'Intern', label: 'Intern', description: 'Internship tier', isActive: true, displayOrder: 5 },
    { id: 6, value: 'None', label: 'None', description: 'No tier assigned', isActive: true, displayOrder: 6 },
    { id: 7, value: 'Synergy', label: 'Synergy', description: 'Synergy program tier', isActive: true, displayOrder: 7 },
];

// Employee statuses (from schema enums)
const EMPLOYEE_STATUSES = [
    { id: 1, value: 'Active', label: 'Active', description: 'Active employee', isActive: true, displayOrder: 1 },
    { id: 2, value: 'Inactive', label: 'Inactive', description: 'Inactive employee', isActive: true, displayOrder: 2 },
    { id: 3, value: 'Serving Notice Period', label: 'Serving Notice Period', description: 'Employee serving notice', isActive: true, displayOrder: 3 },
    { id: 4, value: 'On Leave', label: 'On Leave', description: 'Employee on leave', isActive: true, displayOrder: 4 },
    { id: 5, value: 'Terminated', label: 'Terminated', description: 'Terminated employee', isActive: true, displayOrder: 5 },
];

// Project statuses (from schema enums)
const PROJECT_STATUSES = [
    { id: 1, value: 'Active', label: 'Active', description: 'Active project', isActive: true, displayOrder: 1 },
    { id: 2, value: 'Inactive', label: 'Inactive', description: 'Inactive project', isActive: true, displayOrder: 2 },
    { id: 3, value: 'Completed', label: 'Completed', description: 'Completed project', isActive: true, displayOrder: 3 },
    { id: 4, value: 'On Hold', label: 'On Hold', description: 'Project on hold', isActive: true, displayOrder: 4 },
];

// Account types (from schema enums)
const ACCOUNT_TYPES = [
    { id: 1, value: 'Internal', label: 'Internal', description: 'Internal project', isActive: true, displayOrder: 1 },
    { id: 2, value: 'External', label: 'External', description: 'External client project', isActive: true, displayOrder: 2 },
];

// User roles (from schema enums)
const USER_ROLES = [
    { id: 1, value: 'Super User', label: 'Super User', description: 'Full system access', isActive: true, displayOrder: 1 },
    { id: 2, value: 'Admin', label: 'Admin', description: 'Administrative access', isActive: true, displayOrder: 2 },
    { id: 3, value: 'User', label: 'User', description: 'Standard user access', isActive: true, displayOrder: 3 },
];

// User statuses (from schema enums)
const USER_STATUSES = [
    { id: 1, value: 'Active', label: 'Active', description: 'Active user', isActive: true, displayOrder: 1 },
    { id: 2, value: 'Inactive', label: 'Inactive', description: 'Inactive user', isActive: true, displayOrder: 2 },
    { id: 3, value: 'Suspended', label: 'Suspended', description: 'Suspended user', isActive: true, displayOrder: 3 },
    { id: 4, value: 'Pending', label: 'Pending', description: 'Pending activation', isActive: true, displayOrder: 4 },
];

/**
 * Transform database row to config format
 * Ensures consistent format with value, label, description, isActive, displayOrder
 */
const transformDbRow = (row, useNameAsValue = true) => ({
    id: row.id,
    value: useNameAsValue ? row.name : row.id,
    label: row.name,
    description: row.description || row.name,
    isActive: row.is_active,
    displayOrder: row.display_order || row.level || row.id,
    // Include additional fields if they exist
    ...(row.level !== undefined && { level: row.level }),
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
            meta: {
                configBased: ['tracks', 'techStacks', 'tiers', 'employeeStatuses', 'projectStatuses', 'accountTypes', 'userRoles', 'userStatuses'],
                databaseBased: ['designations', 'billingStatuses', 'projectTypes', 'employeeTypes', 'tags', 'universities'],
            }
        });

    } catch (err) {
        log.error('Failed to fetch configurations', { error: err.message, stack: err.stack });
        return error('Failed to fetch configurations', 500);
    }
};

export default { getAll };
