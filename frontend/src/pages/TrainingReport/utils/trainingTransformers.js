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
 * API: [{ designation, employees: [{ id, employee_name, track, tech_stack, ... }] }]
 * @param {Array} data - Raw designation table data from API
 * @returns {Array} Flat list of rows: { key, employeeName, track, techStack, designation }
 */
export const transformDesignationTableData = (data) => {
  if (!Array.isArray(data)) return [];

  return data.flatMap((group, groupIndex) => {
    const designation = group.designation || '';
    const employees = group.employees || [];
    return employees.map((emp, empIndex) => ({
      key: `designation-${groupIndex}-${emp.id}-${empIndex}`,
      id: emp.id,
      employeeName: emp.employee_name ?? emp.employeeName ?? emp.name ?? '',
      track: emp.track ?? '',
      techStack: emp.tech_stack ?? emp.techStack ?? '',
      designation,
    }));
  });
};

/**
 * Parse date string (e.g. "02 Jan 2026", "22 Jan 2025") to Date for duration calc
 * @param {string} dateStr
 * @returns {Date|null}
 */
const parseReportDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Compute duration in days between allocated and deallocated date
 * @param {string} allocatedDateStr
 * @param {string|null} deallocatedDateStr
 * @returns {string} e.g. "45" or "Ongoing"
 */
export const computeAllocationDuration = (allocatedDateStr, deallocatedDateStr) => {
  const start = parseReportDate(allocatedDateStr);
  if (!start) return '';
  const end = deallocatedDateStr ? parseReportDate(deallocatedDateStr) : new Date();
  if (end && deallocatedDateStr) {
    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    return String(days);
  }
  return 'Ongoing';
};

/**
 * Transform allocation table data
 * API: [{ id, employee_name, allocations: [{ project, allocated_date, deallocated_date, allocation_percentage }] }]
 * @param {Array} data - Raw allocation table data from API
 * @returns {Array} Flat list of rows: one per allocation with employeeName, dates, projectAllocation, duration
 */
export const transformAllocationTableData = (data) => {
  if (!Array.isArray(data)) return [];

  return data.flatMap((emp, empIndex) => {
    const employeeName = emp.employee_name ?? emp.employeeName ?? emp.name ?? '';
    const allocations = emp.allocations || [];
    return allocations.map((alloc, allocIndex) => ({
      key: `allocation-${emp.id}-${allocIndex}`,
      id: emp.id,
      employeeName,
      allocatedDate: alloc.allocated_date ?? alloc.allocatedDate ?? '',
      deallocatedDate: alloc.deallocated_date ?? alloc.deallocatedDate ?? '',
      projectAllocation:
        alloc.allocation_percentage == null
          ? (alloc.projectAllocation ?? '')
          : `${alloc.allocation_percentage}%`,
      duration: computeAllocationDuration(
        alloc.allocated_date ?? alloc.allocatedDate,
        alloc.deallocated_date ?? alloc.deallocatedDate
      ),
    }));
  });
};
