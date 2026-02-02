/**
 * Tech Stacks Configuration
 * 
 * Tech Stacks are managed as enums in config, not stored in database.
 * Used to identify the primary technology expertise of employees.
 */

export const TECH_STACKS = [
    { value: 'QA', label: 'QA', description: 'Quality Assurance', isActive: true, displayOrder: 1 },
    { value: '.NET', label: '.NET', description: '.NET Development', isActive: true, displayOrder: 2 },
    { value: 'Full Stack', label: 'Full Stack', description: 'Full Stack Development', isActive: true, displayOrder: 3 },
    { value: 'Synergy', label: 'Synergy', description: 'Synergy Program', isActive: true, displayOrder: 4 },
    { value: 'PM', label: 'PM', description: 'Project Management', isActive: true, displayOrder: 5 },
    { value: 'BA', label: 'BA', description: 'Business Analysis', isActive: true, displayOrder: 6 },
    { value: 'UI', label: 'UI', description: 'UI Development', isActive: true, displayOrder: 7 },
    { value: 'Java', label: 'Java', description: 'Java Development', isActive: true, displayOrder: 8 },
    { value: 'Data Science', label: 'Data Science', description: 'Data Science & Analytics', isActive: true, displayOrder: 9 },
    { value: 'Power Apps', label: 'Power Apps', description: 'Microsoft Power Apps', isActive: true, displayOrder: 10 },
    { value: 'Finance', label: 'Finance', description: 'Finance Operations', isActive: true, displayOrder: 11 },
    { value: 'React', label: 'React', description: 'React.js Development', isActive: true, displayOrder: 12 },
    { value: 'Dynamics', label: 'Dynamics', description: 'Microsoft Dynamics', isActive: true, displayOrder: 13 },
    { value: 'UX', label: 'UX', description: 'User Experience Design', isActive: true, displayOrder: 14 },
    { value: 'BA/PM', label: 'BA/PM', description: 'Business Analysis / Project Management', isActive: true, displayOrder: 15 },
    { value: 'UI/UX', label: 'UI/UX', description: 'UI/UX Design', isActive: true, displayOrder: 16 },
    { value: 'HR', label: 'HR', description: 'Human Resources', isActive: true, displayOrder: 17 },
    { value: 'Execs', label: 'Execs', description: 'Executive Functions', isActive: true, displayOrder: 18 },
    { value: 'Admin', label: 'Admin', description: 'Administration', isActive: true, displayOrder: 19 },
    { value: 'Marketing', label: 'Marketing', description: 'Marketing', isActive: true, displayOrder: 20 },
    { value: 'Drupal', label: 'Drupal', description: 'Drupal Development', isActive: true, displayOrder: 21 },
    { value: 'Sales & Marketing', label: 'Sales & Marketing', description: 'Sales & Marketing', isActive: true, displayOrder: 22 },
    { value: 'BC', label: 'BC', description: 'Business Central', isActive: true, displayOrder: 23 },
    { value: 'Business Central (Functional)', label: 'Business Central (Functional)', description: 'Business Central Functional', isActive: true, displayOrder: 24 },
    { value: 'AI/ML', label: 'AI/ML', description: 'AI & Machine Learning', isActive: true, displayOrder: 25 },
    { value: 'Blockchain', label: 'Blockchain', description: 'Blockchain Development', isActive: true, displayOrder: 26 },
];

/**
 * Get all active tech stacks
 */
export const getActiveTechStacks = () => TECH_STACKS.filter(t => t.isActive);

/**
 * Get tech stack by value
 */
export const getTechStackByValue = (value) => TECH_STACKS.find(t => t.value === value);

/**
 * Validate if tech stack value exists
 */
export const isValidTechStack = (value) => TECH_STACKS.some(t => t.value === value && t.isActive);

/**
 * Get all tech stack values as array
 */
export const getTechStackValues = () => TECH_STACKS.filter(t => t.isActive).map(t => t.value);

export default {
    TECH_STACKS,
    getActiveTechStacks,
    getTechStackByValue,
    isValidTechStack,
    getTechStackValues
};
