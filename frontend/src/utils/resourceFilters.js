/**
 * Resource Filtering Utilities
 * 
 * Centralized logic for filtering resources based on business rules
 */

// Billable tracks: QA, Dev, UI, BA, PM, UX, Delivery, Functional Consultant
export const BILLABLE_TRACK_IDS = [1, 2, 3, 4, 5, 8, 10, 11];

// Track names for reference
export const TRACK_NAMES = {
  1: 'QA',
  2: 'Dev',
  3: 'UI',
  4: 'BA',
  5: 'PM',
  6: 'Support',      // Not billable
  8: 'UX',
  9: 'Execs',        // Not billable
  10: 'Delivery',
  11: 'Functional Consultant - MS Dynamics 365'
};

/**
 * Filter resources to only billable, active resources (including interns)
 * 
 * Criteria:
 * - Status must be 'Active'
 * - Track must be in BILLABLE_TRACK_IDS (QA, Dev, UI, BA, PM, UX, Delivery, Functional Consultant)
 * - Includes interns (no employee_type filter)
 * 
 * @param {Array} resources - Array of resource objects
 * @returns {Array} Filtered array of billable active resources
 */
export const filterBillableResources = (resources) => {
  if (!Array.isArray(resources)) {
    return [];
  }

  return resources.filter(resource => {
    // Must be Active status
    if (resource.status !== 'Active') {
      return false;
    }

    // Must be in billable tracks
    if (!BILLABLE_TRACK_IDS.includes(resource.track_id)) {
      return false;
    }

    // Interns are included (no additional filtering)
    return true;
  });
};

/**
 * Check if a resource is billable
 * 
 * @param {Object} resource - Resource object
 * @returns {Boolean} True if resource is billable
 */
export const isBillableResource = (resource) => {
  return resource.status === 'Active' && 
         BILLABLE_TRACK_IDS.includes(resource.track_id);
};

/**
 * Get billable resource count from a list
 * 
 * @param {Array} resources - Array of resource objects
 * @returns {Number} Count of billable resources
 */
export const getBillableResourceCount = (resources) => {
  if (!Array.isArray(resources)) {
    return 0;
  }
  return filterBillableResources(resources).length;
};
