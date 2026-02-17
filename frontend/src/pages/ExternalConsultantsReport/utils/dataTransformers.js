/**
 * Data Transformers for External Consultants Report
 */

import dayjs from 'dayjs';

/**
 * Transform project data for table
 */
export const transformProjectData = (reportData) => {
  if (!reportData?.tables?.byProject) return [];
  
  return reportData.tables.byProject.map((item, index) => ({
    key: item.key || `project-${index}`,
    projectName: item.projectName || 'N/A',
    accountManager: item.accountManager || 'N/A',
    consultantCount: item.consultantCount || 0,
    totalAllocation: item.totalAllocation || '0.00%',
    billingStatus: item.billingStatus || 'Non-Billing',
    consultants: item.consultants || '',
  }));
};

/**
 * Transform allocation data for table
 */
export const transformAllocationData = (reportData) => {
  if (!reportData?.tables?.byAllocation) return [];
  
  return reportData.tables.byAllocation.map((item, index) => {
    const startDate = item.startDate ? dayjs(item.startDate).format('DD MMM YYYY') : '';
    const endDate = item.endDate ? dayjs(item.endDate).format('DD MMM YYYY') : '';
    
    // Calculate duration in days
    let duration = 0;
    if (item.startDate) {
      const start = dayjs(item.startDate);
      const end = item.endDate ? dayjs(item.endDate) : dayjs();
      duration = end.diff(start, 'day');
    }
    
    return {
      key: item.key || `allocation-${index}`,
      consultantName: item.consultantName || 'N/A',
      email: item.email || '',
      designation: item.designation || 'N/A',
      track: item.track || 'N/A',
      techStack: item.techStack || 'N/A',
      project: item.project || 'Bench',
      accountManager: item.accountManager || 'N/A',
      allocationPercentage: item.allocationPercentage || '0.00%',
      startDate: startDate,
      endDate: endDate,
      duration: duration,
      billingStatus: item.billingStatus || 'Non-Billing',
    };
  });
};

/**
 * Get unique tech stacks from allocation data
 */
export const getUniqueTechStacks = (reportData) => {
  if (!reportData?.tables?.byAllocation) return [];
  const techStacks = new Set();
  reportData.tables.byAllocation.forEach(item => {
    if (item.techStack) {
      techStacks.add(item.techStack);
    }
  });
  return Array.from(techStacks).sort();
};

/**
 * Calculate tech stack distribution
 */
export const calculateTechStackDistribution = (reportData) => {
  if (!reportData?.tables?.byAllocation) return [];
  
  const techStackMap = new Map();
  reportData.tables.byAllocation.forEach(item => {
    const techStack = item.techStack || 'Unassigned';
    techStackMap.set(techStack, (techStackMap.get(techStack) || 0) + 1);
  });
  
  return Array.from(techStackMap.entries())
    .map(([techStack, count]) => ({ techStack, count }))
    .sort((a, b) => b.count - a.count);
};
