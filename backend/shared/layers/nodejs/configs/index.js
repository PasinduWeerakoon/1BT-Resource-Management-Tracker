/**
 * Shared Configuration Constants
 * 
 * This module contains all hardcoded configuration enums used across the application.
 * These can be imported by any service via: import { TRACKS, TIERS, ... } from '/opt/nodejs/configs/index.js';
 * 
 * For database-managed configs (designations, billingStatuses, etc.), 
 * use the /api/v1/configs endpoint or query the database directly.
 */

// ============================================================================
// TRACKS - Resource tracks/departments
// ============================================================================
export const TRACKS = [
    { id: 1, value: 1, label: 'QA', description: 'Quality Assurance', isActive: true, displayOrder: 1 },
    { id: 2, value: 2, label: 'Dev', description: 'Development', isActive: true, displayOrder: 2 },
    { id: 3, value: 3, label: 'UI', description: 'UI Development', isActive: true, displayOrder: 3 },
    { id: 4, value: 4, label: 'BA', description: 'Business Analysis', isActive: true, displayOrder: 4 },
    { id: 5, value: 5, label: 'PM', description: 'Project Management', isActive: true, displayOrder: 5 },
    { id: 6, value: 6, label: 'Support', description: 'Support Functions', isActive: true, displayOrder: 6 },
    { id: 8, value: 8, label: 'UX', description: 'User Experience', isActive: true, displayOrder: 7 },
    { id: 9, value: 9, label: 'Execs', description: 'Executives', isActive: true, displayOrder: 8 },
    { id: 10, value: 10, label: 'Delivery', description: 'Delivery Management', isActive: true, displayOrder: 9 },
    { id: 11, value: 11, label: 'Functional Consultant - MS Dynamics 365', description: 'MS Dynamics 365 Functional Consultant', isActive: true, displayOrder: 10 },
];

// ============================================================================
// TECH STACKS - Technology specializations
// ============================================================================
export const TECH_STACKS = [
    { id: 1, value: 1, label: 'QA', description: 'Quality Assurance', isActive: true, displayOrder: 1 },
    { id: 2, value: 2, label: '.NET', description: '.NET Development', isActive: true, displayOrder: 2 },
    { id: 3, value: 3, label: 'Full Stack', description: 'Full Stack Development', isActive: true, displayOrder: 3 },
    { id: 4, value: 4, label: 'Synergy', description: 'Synergy Program', isActive: true, displayOrder: 4 },
    { id: 5, value: 5, label: 'PM', description: 'Project Management', isActive: true, displayOrder: 5 },
    { id: 6, value: 6, label: 'BA', description: 'Business Analysis', isActive: true, displayOrder: 6 },
    { id: 7, value: 7, label: 'UI', description: 'UI Development', isActive: true, displayOrder: 7 },
    { id: 8, value: 8, label: 'Java', description: 'Java Development', isActive: true, displayOrder: 8 },
    { id: 9, value: 9, label: 'Data Science', description: 'Data Science & Analytics', isActive: true, displayOrder: 9 },
    { id: 10, value: 10, label: 'Power Apps', description: 'Microsoft Power Apps', isActive: true, displayOrder: 10 },
    { id: 11, value: 11, label: 'Finance', description: 'Finance Operations', isActive: true, displayOrder: 11 },
    { id: 12, value: 12, label: 'React', description: 'React.js Development', isActive: true, displayOrder: 12 },
    { id: 13, value: 13, label: 'Dynamics', description: 'Microsoft Dynamics', isActive: true, displayOrder: 13 },
    { id: 14, value: 14, label: 'UX', description: 'User Experience Design', isActive: true, displayOrder: 14 },
    { id: 15, value: 15, label: 'BA/PM', description: 'Business Analysis / Project Management', isActive: true, displayOrder: 15 },
    { id: 16, value: 16, label: 'UI/UX', description: 'UI/UX Design', isActive: true, displayOrder: 16 },
    { id: 17, value: 17, label: 'HR', description: 'Human Resources', isActive: true, displayOrder: 17 },
    { id: 18, value: 18, label: 'Execs', description: 'Executive Functions', isActive: true, displayOrder: 18 },
    { id: 19, value: 19, label: 'Admin', description: 'Administration', isActive: true, displayOrder: 19 },
    { id: 20, value: 20, label: 'Marketing', description: 'Marketing', isActive: true, displayOrder: 20 },
    { id: 21, value: 21, label: 'Drupal', description: 'Drupal Development', isActive: true, displayOrder: 21 },
    { id: 22, value: 22, label: 'Sales & Marketing', description: 'Sales & Marketing', isActive: true, displayOrder: 22 },
    { id: 23, value: 23, label: 'BC', description: 'Business Central', isActive: true, displayOrder: 23 },
    { id: 24, value: 24, label: 'Business Central (Functional)', description: 'Business Central Functional', isActive: true, displayOrder: 24 },
    { id: 25, value: 25, label: 'AI/ML', description: 'AI & Machine Learning', isActive: true, displayOrder: 25 },
    { id: 26, value: 26, label: 'Blockchain', description: 'Blockchain Development', isActive: true, displayOrder: 26 },
];

// ============================================================================
// TIERS - Resource seniority levels
// ============================================================================
export const TIERS = [
    { id: 1, value: 1, label: 'Tier - 1', description: 'Tier 1 - Entry level', isActive: true, displayOrder: 1 },
    { id: 2, value: 2, label: 'Tier - 2', description: 'Tier 2 - Intermediate', isActive: true, displayOrder: 2 },
    { id: 3, value: 3, label: 'Tier - 3', description: 'Tier 3 - Senior', isActive: true, displayOrder: 3 },
    { id: 4, value: 4, label: 'Tier - 4', description: 'Tier 4 - Expert', isActive: true, displayOrder: 4 },
    { id: 5, value: 5, label: 'Intern', description: 'Internship tier', isActive: true, displayOrder: 5 },
    { id: 6, value: 6, label: 'None', description: 'No tier assigned', isActive: true, displayOrder: 6 },
    { id: 7, value: 7, label: 'Synergy', description: 'Synergy program tier', isActive: true, displayOrder: 7 },
];

// ============================================================================
// EMPLOYEE STATUSES - Resource employment status
// ============================================================================
export const EMPLOYEE_STATUSES = [
    { id: 1, value: 1, label: 'Active', description: 'Active employee', isActive: true, displayOrder: 1 },
    { id: 2, value: 2, label: 'Inactive', description: 'Inactive employee', isActive: true, displayOrder: 2 },
    { id: 3, value: 3, label: 'Serving Notice Period', description: 'Employee serving notice', isActive: true, displayOrder: 3 },
    { id: 4, value: 4, label: 'On Leave', description: 'Employee on leave', isActive: true, displayOrder: 4 },
    { id: 5, value: 5, label: 'Terminated', description: 'Terminated employee', isActive: true, displayOrder: 5 },
];

// ============================================================================
// BILLABLE TRACKS - Tracks that should have auto-bench allocation
// These tracks get auto-bench allocation when employee is created/seeded
// Includes: Dev, QA, BA, PM, UI, UX, Delivery, Functional Consultants
// Non-billable (no bench): Support (6), Execs (9)
// ============================================================================
export const BENCH_ELIGIBLE_TRACK_IDS = [1, 2, 3, 4, 5, 8, 10, 11];
// Mapping: QA=1, Dev=2, UI=3, BA=4, PM=5, UX=8, Delivery=10, Functional Consultant=11

// ============================================================================
// BILLABLE RESOURCE TRACKS - Tracks counted as billable resources for stats
// Used for dashboard billable resource count and bench percentage calculation
// EXCLUDES Delivery (10) - they are on bench but not counted as billable
// ============================================================================
export const BILLABLE_RESOURCE_TRACK_IDS = [1, 2, 3, 4, 5, 8, 11];
// Mapping: QA=1, Dev=2, UI=3, BA=4, PM=5, UX=8, Functional Consultant=11

// Legacy alias for backward compatibility
export const BILLABLE_TRACK_IDS = BENCH_ELIGIBLE_TRACK_IDS;

/**
 * Check if a track ID is bench-eligible (should have auto-bench allocation)
 * @param {number} trackId - Track ID to check
 * @returns {boolean} - True if bench-eligible track
 */
export const isBenchEligibleTrackId = (trackId) =>
    BENCH_ELIGIBLE_TRACK_IDS.includes(trackId);

/**
 * Check if a track ID is billable (counted in billable resource stats)
 * @param {number} trackId - Track ID to check
 * @returns {boolean} - True if billable track (excludes Delivery)
 */
export const isBillableResourceTrackId = (trackId) =>
    BILLABLE_RESOURCE_TRACK_IDS.includes(trackId);

// Legacy alias for backward compatibility
export const isBillableTrackId = isBenchEligibleTrackId;

/**
 * Get billable track labels for display
 * @returns {string[]} - Array of billable track labels
 */
export const getBillableTrackLabels = () =>
    TRACKS.filter(t => BILLABLE_TRACK_IDS.includes(t.id)).map(t => t.label);

// ============================================================================
// PROJECT STATUSES - Project lifecycle status
// ============================================================================
export const PROJECT_STATUSES = [
    { id: 1, value: 1, label: 'Active', description: 'Active project', isActive: true, displayOrder: 1 },
    { id: 2, value: 2, label: 'Inactive', description: 'Inactive project', isActive: true, displayOrder: 2 },
    { id: 3, value: 3, label: 'Completed', description: 'Completed project', isActive: true, displayOrder: 3 },
    { id: 4, value: 4, label: 'On Hold', description: 'Project on hold', isActive: true, displayOrder: 4 },
];

// ============================================================================
// ACCOUNT TYPES - Project account classification
// ============================================================================
export const ACCOUNT_TYPES = [
    { id: 1, value: 1, label: 'Internal', description: 'Internal project', isActive: true, displayOrder: 1 },
    { id: 2, value: 2, label: 'External', description: 'External client project', isActive: true, displayOrder: 2 },
];

// ============================================================================
// CONSTANTS - System-wide constants
// ============================================================================
export const BENCH_PROJECT_CODE = 'BENCH';

// ============================================================================
// USER ROLES - System access levels
// ============================================================================
export const USER_ROLES = [
    { id: 1, value: 1, label: 'Super User', description: 'Full system access', isActive: true, displayOrder: 1 },
    { id: 2, value: 2, label: 'Admin', description: 'Administrative access', isActive: true, displayOrder: 2 },
    { id: 3, value: 3, label: 'User', description: 'Standard user access', isActive: true, displayOrder: 3 },
];

// ============================================================================
// USER STATUSES - User account status
// ============================================================================
export const USER_STATUSES = [
    { id: 1, value: 1, label: 'Active', description: 'Active user', isActive: true, displayOrder: 1 },
    { id: 2, value: 2, label: 'Inactive', description: 'Inactive user', isActive: true, displayOrder: 2 },
    { id: 3, value: 3, label: 'Suspended', description: 'Suspended user', isActive: true, displayOrder: 3 },
    { id: 4, value: 4, label: 'Pending', description: 'Pending activation', isActive: true, displayOrder: 4 },
];

// ============================================================================
// ALLOCATED ROLES - Roles assigned to resources on project allocations
// ============================================================================
export const ALLOCATED_ROLES = [
    { id: 1, value: 1, label: 'Software Engineer', description: 'Software Engineer', isActive: true, displayOrder: 1 },
    { id: 2, value: 2, label: 'Senior Software Engineer', description: 'Senior Software Engineer', isActive: true, displayOrder: 2 },
    { id: 3, value: 3, label: 'Tech Lead', description: 'Technical Lead', isActive: true, displayOrder: 3 },
    { id: 4, value: 4, label: 'Architect', description: 'Solution Architect', isActive: true, displayOrder: 4 },
    { id: 5, value: 5, label: 'QA Lead', description: 'QA Lead', isActive: true, displayOrder: 5 },
    { id: 6, value: 6, label: 'UI Engineer', description: 'UI Engineer', isActive: true, displayOrder: 6 },
    { id: 7, value: 7, label: 'Senior UI Engineer', description: 'Senior UI Engineer', isActive: true, displayOrder: 7 },
    { id: 8, value: 8, label: 'UI Lead', description: 'UI Lead', isActive: true, displayOrder: 8 },
    { id: 9, value: 9, label: 'Team Lead', description: 'Team Lead', isActive: true, displayOrder: 9 },
    { id: 10, value: 10, label: 'Project Manager', description: 'Project Manager', isActive: true, displayOrder: 10 },
    { id: 11, value: 11, label: 'QA Engineer', description: 'QA Engineer', isActive: true, displayOrder: 11 },
    { id: 12, value: 12, label: 'Senior QA Engineer', description: 'Senior QA Engineer', isActive: true, displayOrder: 12 },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get config by value (numeric)
 * @param {Array} configs - Config array to search
 * @param {number} value - Value to find
 * @returns {Object|undefined} - Config object or undefined
 */
export const getConfigByValue = (configs, value) =>
    configs.find(c => c.value === value);

/**
 * Get config by id
 * @param {Array} configs - Config array to search
 * @param {number} id - ID to find
 * @returns {Object|undefined} - Config object or undefined
 */
export const getConfigById = (configs, id) =>
    configs.find(c => c.id === id);

/**
 * Get config by label
 * @param {Array} configs - Config array to search
 * @param {string} label - Label to find
 * @returns {Object|undefined} - Config object or undefined
 */
export const getConfigByLabel = (configs, label) =>
    configs.find(c => c.label === label);

/**
 * Get active configs only
 * @param {Array} configs - Config array to filter
 * @returns {Array} - Filtered array of active configs
 */
export const getActiveConfigs = (configs) =>
    configs.filter(c => c.isActive);

/**
 * Get config values as array of numbers
 * @param {Array} configs - Config array
 * @returns {Array<number>} - Array of values
 */
export const getConfigValues = (configs) =>
    configs.map(c => c.value);

/**
 * Get config labels as array of strings
 * @param {Array} configs - Config array
 * @returns {Array<string>} - Array of labels
 */
export const getConfigLabels = (configs) =>
    configs.map(c => c.label);

/**
 * Validate if a value exists in config
 * @param {Array} configs - Config array to search
 * @param {number} value - Value to validate
 * @returns {boolean} - True if value exists
 */
export const isValidConfigValue = (configs, value) =>
    configs.some(c => c.value === value && c.isActive);

// ============================================================================
// AGGREGATED EXPORTS
// ============================================================================

/**
 * All hardcoded configs in one object (useful for bulk access)
 */
export const ALL_CONFIGS = {
    tracks: TRACKS,
    techStacks: TECH_STACKS,
    tiers: TIERS,
    employeeStatuses: EMPLOYEE_STATUSES,
    projectStatuses: PROJECT_STATUSES,
    accountTypes: ACCOUNT_TYPES,
    userRoles: USER_ROLES,
    userStatuses: USER_STATUSES,
    allocatedRoles: ALLOCATED_ROLES,
};

/**
 * Config metadata
 */
export const CONFIG_METADATA = {
    configBased: ['tracks', 'techStacks', 'tiers', 'employeeStatuses', 'projectStatuses', 'accountTypes', 'userRoles', 'userStatuses', 'allocatedRoles'],
    databaseBased: ['designations', 'billingStatuses', 'projectTypes', 'employeeTypes', 'tags', 'universities'],
};

export default {
    TRACKS,
    TECH_STACKS,
    TIERS,
    EMPLOYEE_STATUSES,
    PROJECT_STATUSES,
    ACCOUNT_TYPES,
    USER_ROLES,
    USER_STATUSES,
    ALLOCATED_ROLES,
    BILLABLE_TRACK_IDS,
    ALL_CONFIGS,
    CONFIG_METADATA,
    // Helper functions
    getConfigByValue,
    getConfigById,
    getConfigByLabel,
    getActiveConfigs,
    getConfigValues,
    getConfigLabels,
    isValidConfigValue,
    isBillableTrackId,
    getBillableTrackLabels,
};
