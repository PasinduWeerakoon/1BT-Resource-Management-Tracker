/**
 * Tiers Configuration
 * 
 * Tiers are managed as enums in config, not stored in database.
 * Used to categorize employees by seniority/experience level.
 */

export const TIERS = [
    { value: 'Tier - 1', label: 'Tier - 1', description: 'Tier 1 - Entry level', isActive: true, displayOrder: 1 },
    { value: 'Tier - 2', label: 'Tier - 2', description: 'Tier 2 - Intermediate', isActive: true, displayOrder: 2 },
    { value: 'Tier - 3', label: 'Tier - 3', description: 'Tier 3 - Senior', isActive: true, displayOrder: 3 },
    { value: 'Tier - 4', label: 'Tier - 4', description: 'Tier 4 - Expert', isActive: true, displayOrder: 4 },
    { value: 'Intern', label: 'Intern', description: 'Internship tier', isActive: true, displayOrder: 5 },
    { value: 'None', label: 'None', description: 'No tier assigned', isActive: true, displayOrder: 6 },
    { value: 'Synergy', label: 'Synergy', description: 'Synergy program tier', isActive: true, displayOrder: 7 },
];

/**
 * Get all active tiers
 */
export const getActiveTiers = () => TIERS.filter(t => t.isActive);

/**
 * Get tier by value
 */
export const getTierByValue = (value) => TIERS.find(t => t.value === value);

/**
 * Validate if tier value exists
 */
export const isValidTier = (value) => TIERS.some(t => t.value === value && t.isActive);

/**
 * Get all tier values as array
 */
export const getTierValues = () => TIERS.filter(t => t.isActive).map(t => t.value);

export default {
    TIERS,
    getActiveTiers,
    getTierByValue,
    isValidTier,
    getTierValues
};
