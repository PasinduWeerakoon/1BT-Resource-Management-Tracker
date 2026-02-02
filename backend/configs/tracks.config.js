/**
 * Tracks Configuration
 * 
 * Tracks are managed as enums in config, not stored in database.
 * Used to categorize employees by their functional track.
 */

export const TRACKS = [
    { value: 'QA', label: 'QA', description: 'Quality Assurance', isActive: true, displayOrder: 1 },
    { value: 'Dev', label: 'Dev', description: 'Development', isActive: true, displayOrder: 2 },
    { value: 'UI', label: 'UI', description: 'UI Development', isActive: true, displayOrder: 3 },
    { value: 'BA', label: 'BA', description: 'Business Analysis', isActive: true, displayOrder: 4 },
    { value: 'PM', label: 'PM', description: 'Project Management', isActive: true, displayOrder: 5 },
    { value: 'Support', label: 'Support', description: 'Support Functions', isActive: true, displayOrder: 6 },
    { value: 'Synergy', label: 'Synergy', description: 'Synergy Program', isActive: true, displayOrder: 7 },
    { value: 'UX', label: 'UX', description: 'User Experience', isActive: true, displayOrder: 8 },
    { value: 'Execs', label: 'Execs', description: 'Executives', isActive: true, displayOrder: 9 },
    { value: 'Delivery', label: 'Delivery', description: 'Delivery Management', isActive: true, displayOrder: 10 },
    { value: 'Functional Consultant - MS Dynamics 365', label: 'Functional Consultant - MS Dynamics 365', description: 'MS Dynamics 365 Functional Consultant', isActive: true, displayOrder: 11 },
];

/**
 * Get all active tracks
 */
export const getActiveTracks = () => TRACKS.filter(t => t.isActive);

/**
 * Get track by value
 */
export const getTrackByValue = (value) => TRACKS.find(t => t.value === value);

/**
 * Validate if track value exists
 */
export const isValidTrack = (value) => TRACKS.some(t => t.value === value && t.isActive);

/**
 * Get all track values as array
 */
export const getTrackValues = () => TRACKS.filter(t => t.isActive).map(t => t.value);

export default {
    TRACKS,
    getActiveTracks,
    getTrackByValue,
    isValidTrack,
    getTrackValues
};
