/**
 * Training Transformers
 * Utility functions for transforming training report data
 */

/**
 * Transform track data for donut chart
 * @param {Array} trackData - Raw track distribution data
 * @returns {Array} Transformed track data
 */
export const transformTrackData = (trackData) => {
  if (!Array.isArray(trackData)) return [];

  return trackData.map((item) => ({
    track: item.track || item.name,
    count: item.count || 0,
    percentage: item.percentage || 0,
  }));
};

/**
 * Transform tech stack data for bar chart
 * @param {Array} techStackData - Raw tech stack distribution data
 * @returns {Array} Transformed tech stack data
 */
export const transformTechStackData = (techStackData) => {
  if (!Array.isArray(techStackData)) return [];

  return techStackData.map((item) => ({
    techStack: item.techStack || item.name,
    count: item.count || 0,
  }));
};

/**
 * Transform designation data for bar chart
 * @param {Array} designationData - Raw designation distribution data
 * @returns {Array} Transformed designation data
 */
export const transformDesignationData = (designationData) => {
  if (!Array.isArray(designationData)) return [];

  return designationData.map((item) => ({
    designation: item.designation || item.name,
    count: item.count || 0,
  }));
};

/**
 * Transform designation table data
 * @param {Array} data - Raw designation table data
 * @returns {Array} Transformed table data
 */
export const transformDesignationTableData = (data) => {
  if (!Array.isArray(data)) return [];

  return data.map((item, index) => ({
    key: item.id || `designation-${index}`,
    id: item.id,
    employeeName: item.employeeName || item.name,
    track: item.track,
    techStack: item.techStack,
    designation: item.designation,
  }));
};

/**
 * Transform allocation table data
 * @param {Array} data - Raw allocation table data
 * @returns {Array} Transformed table data
 */
export const transformAllocationTableData = (data) => {
  if (!Array.isArray(data)) return [];

  return data.map((item, index) => ({
    key: item.id || `allocation-${index}`,
    id: item.id,
    employeeName: item.employeeName || item.name,
    allocatedDate: item.allocatedDate || item.startDate,
    deallocatedDate: item.deallocatedDate || item.endDate,
    projectAllocation: item.projectAllocation || item.allocationPercentage,
    duration: item.duration || item.durationDays,
  }));
};
