/**
 * Data Transformers for AccountManagerReport
 * Utility functions to transform API responses to component-friendly formats
 */

import dayjs from 'dayjs';

/**
 * Transform project data from API response
 */
export const transformProjectData = (projectsData, allocationsData = []) => {
  return projectsData.map((project) => {
    // Calculate allocated resource count (unique resources allocated to this project)
    const projectAllocations = allocationsData.filter(alloc => alloc.project_id === project.id);
    const uniqueResourceIds = new Set(projectAllocations.map(alloc => alloc.resource_id).filter(Boolean));
    const allocatedResourceCount = uniqueResourceIds.size;

    // Calculate billing count (resources with billing_percentage > 0)
    const billingResources = projectAllocations.filter(alloc => {
      const billingPct = parseFloat(allocation.billing_percentage) || 0;
      return billingPct > 0;
    });
    const uniqueBillingResourceIds = new Set(billingResources.map(alloc => alloc.resource_id).filter(Boolean));
    const billingCount = uniqueBillingResourceIds.size;

    return {
      key: project.id,
      id: project.id,
      project: project.project || project.project_name || project.name || 'N/A',
      customer: project.customer || project.client_name || 'N/A',
      projectType: project.project_type || 'N/A',
      teamSize: project.team_size ? (typeof project.team_size === 'string' ? parseInt(project.team_size, 10) : project.team_size) : 0,
      status: project.status || 'N/A',
      billingStatus: project.billing_status || 'N/A',
      accountManagerId: project.account_manager_id,
      accountManagerName: project.account_manager_name || 'N/A',
      allocatedResourceCount: project.allocated_resource_count !== undefined ? project.allocated_resource_count : allocatedResourceCount,
      billingCount: project.billing_count !== undefined ? project.billing_count : billingCount,
      // Keep additional fields for edit functionality
      project_name: project.project || project.project_name,
      project_code: project.project_code,
      client_id: project.client_id,
      is_billable: project.billing_status === 'Billing',
      start_date: project.start_date,
      end_date: project.end_date,
      description: project.description,
      project_type: project.project_type,
    };
  });
};

/**
 * Transform allocation data from API response
 */
export const transformAllocationData = (allocationsData) => {
  return allocationsData.map((allocation) => {
    const allocationPercentage = parseFloat(allocation.allocation_percentage || allocation.project_allocation) || 0;
    const billingPercentage = parseFloat(allocation.billing_percentage) || 0;
    const billingStatus = billingPercentage > 0 ? 'Billing' : 'Non-Billing';

    return {
      key: allocation.id,
      id: allocation.id,
      resource_id: allocation.resource_id,
      resource_name: allocation.resource_name || allocation.employee_name || 'N/A',
      employeeName: allocation.resource_name || allocation.employee_name || 'N/A',
      project_id: allocation.project_id,
      project_name: allocation.project_name || allocation.project || 'N/A',
      project: allocation.project_name || allocation.project || 'N/A',
      allocatedDate: allocation.allocated_date
        ? dayjs(allocation.allocated_date).format('DD MMM YYYY')
        : (allocation.project_allocated_date || ''),
      deallocatedDate: allocation.deallocated_date
        ? dayjs(allocation.deallocated_date).format('DD MMM YYYY')
        : (allocation.project_deallocated_date || ''),
      billingStatus: billingStatus,
      billingPercentage: billingPercentage ? `${billingPercentage.toFixed(2)}%` : '0.00%',
      projectAllocation: allocationPercentage ? `${allocationPercentage.toFixed(2)}%` : '0.00%',
      duration: allocation.duration || allocation.duration_days || 0,
      status: allocation.is_active ? 'Active' : 'Inactive',
    };
  });
};

/**
 * Transform team member data from allocation data
 */
export const transformTeamMemberData = async (allocationsData, resourcesList = [], project) => {
  return Promise.all(allocationsData.map(async (allocation, index) => {
    // Parse dates
    let allocatedDate = undefined;
    let deallocatedDate = undefined;
    if (allocation.start_date) {
      allocatedDate = dayjs(allocation.start_date);
    }
    if (allocation.end_date) {
      deallocatedDate = dayjs(allocation.end_date);
    }

    // Handle allocation_percentage and billing_percentage as strings or numbers
    const allocationPercentage = typeof allocation.allocation_percentage === 'string'
      ? parseFloat(allocation.allocation_percentage)
      : (allocation.allocation_percentage || 0);
    const billingPercentage = typeof allocation.billing_percentage === 'string'
      ? parseFloat(allocation.billing_percentage)
      : (allocation.billing_percentage || 0);

    // Determine billing status based on project_type
    let billingStatus = 'Non-Billing';
    if (allocation.project_type === 'Client' || allocation.project_is_billable) {
      billingStatus = 'Billing';
    } else if (allocation.project_type === 'Bench') {
      billingStatus = 'Bench';
    } else if (allocation.project_type === 'Pre-Sales' || allocation.project_type === 'Presale' || allocation.project_type === 'Pre-Sale') {
      billingStatus = 'Presale';
    } else if (allocation.project_type === 'Training') {
      billingStatus = 'Training';
    }

    // Calculate duration in days
    let duration = 0;
    if (allocation.start_date) {
      const startDate = dayjs(allocation.start_date);
      const endDate = allocation.end_date ? dayjs(allocation.end_date) : dayjs();
      duration = endDate.diff(startDate, 'day');
    }

    // Get resource name
    let resourceName = allocation.resource_name ||
      allocation.employeeName ||
      allocation.name;

    // If resource name is missing and we have resource_id, try to find it
    if (!resourceName && allocation.resource_id) {
      const resource = resourcesList.find(r => r.id === allocation.resource_id);
      if (resource) {
        resourceName = resource.name;
      }
    }

    resourceName = resourceName || 'N/A';

    return {
      key: `existing-${allocation.id || index}`,
      id: allocation.id,
      resource_id: allocation.resource_id,
      employeeName: resourceName,
      employeeId: allocation.resource_id,
      projectName: allocation.project_name || project?.project || '',
      allocatedDate: allocatedDate,
      deallocatedDate: deallocatedDate,
      billingStatus: billingStatus,
      billingPercentage: billingPercentage,
      projectAllocation: allocationPercentage,
      duration: duration,
      status: allocation.is_active !== undefined ? (allocation.is_active ? 'Active' : 'Inactive') : (allocation.status || 'Active'),
      isExisting: true,
    };
  }));
};

/**
 * Transform resource allocations data (active and future)
 */
export const transformResourceAllocationsData = (allocationsData) => {
  // Separate active and future allocations
  const activeAllocations = allocationsData.filter(a => a.allocation_status !== 'future');
  const futureAllocations = allocationsData.filter(a => a.allocation_status === 'future');

  // Transform active allocations
  const transformedActiveAllocations = activeAllocations.map((allocation, index) => {
    let duration = 0;
    if (allocation.allocated_date) {
      const startDate = dayjs(allocation.allocated_date);
      const endDate = allocation.deallocated_date ? dayjs(allocation.deallocated_date) : dayjs();
      duration = endDate.diff(startDate, 'day');
    }

    const allocationPercentage = typeof allocation.allocation_percentage === 'string'
      ? parseFloat(allocation.allocation_percentage)
      : (allocation.allocation_percentage || 0);
    const billingPercentage = typeof allocation.billing_percentage === 'string'
      ? parseFloat(allocation.billing_percentage)
      : (allocation.billing_percentage || 0);

    let billingStatus = 'Non-Billing';
    if (allocation.project_type === 'Client' || allocation.project_is_billable) {
      billingStatus = 'Billing';
    } else if (allocation.project_type === 'Bench') {
      billingStatus = 'Bench';
    } else if (allocation.project_type === 'Pre-Sales' || allocation.project_type === 'Presale' || allocation.project_type === 'Pre-Sale') {
      billingStatus = 'Presale';
    } else if (allocation.project_type === 'Training') {
      billingStatus = 'Training';
    }

    return {
      key: allocation.id || `allocation-${index}`,
      id: allocation.id,
      project: allocation.project_name || 'N/A',
      allocatedDate: allocation.allocated_date ? dayjs(allocation.allocated_date).format('YYYY-MM-DD') : '-',
      deallocatedDate: allocation.deallocated_date ? dayjs(allocation.deallocated_date).format('YYYY-MM-DD') : '-',
      billingStatus: billingStatus,
      billingPercentage: billingPercentage ? `${billingPercentage.toFixed(0)}%` : '0%',
      projectAllocation: allocationPercentage ? `${allocationPercentage.toFixed(0)}%` : '0%',
      duration: duration,
      status: allocation.is_active !== undefined ? (allocation.is_active ? 'Active' : 'Inactive') : (allocation.status || 'Active'),
      project_id: allocation.project_id,
      allocationType: 'active'
    };
  });

  // Transform future allocations
  const transformedFutureAllocations = futureAllocations.map((allocation, index) => {
    let duration = 0;
    if (allocation.allocated_date) {
      const startDate = dayjs(allocation.allocated_date);
      const endDate = allocation.deallocated_date ? dayjs(allocation.deallocated_date) : dayjs();
      duration = endDate.diff(startDate, 'day');
    }

    const daysUntilActivation = allocation.effective_date
      ? dayjs(allocation.effective_date).diff(dayjs(), 'day')
      : 0;

    const allocationPercentage = typeof allocation.allocation_percentage === 'string'
      ? parseFloat(allocation.allocation_percentage)
      : (allocation.allocation_percentage || 0);
    const billingPercentage = typeof allocation.billing_percentage === 'string'
      ? parseFloat(allocation.billing_percentage)
      : (allocation.billing_percentage || 0);

    let billingStatus = 'Non-Billing';
    if (allocation.project_type === 'Client' || allocation.project_is_billable) {
      billingStatus = 'Billing';
    } else if (allocation.project_type === 'Bench') {
      billingStatus = 'Bench';
    } else if (allocation.project_type === 'Pre-Sales' || allocation.project_type === 'Presale' || allocation.project_type === 'Pre-Sale') {
      billingStatus = 'Presale';
    } else if (allocation.project_type === 'Training') {
      billingStatus = 'Training';
    }

    return {
      key: allocation.id || `future-allocation-${index}`,
      id: allocation.id,
      project: allocation.project_name || 'N/A',
      allocatedDate: allocation.allocated_date ? dayjs(allocation.allocated_date).format('YYYY-MM-DD') : '-',
      deallocatedDate: allocation.deallocated_date ? dayjs(allocation.deallocated_date).format('YYYY-MM-DD') : '-',
      effectiveDate: allocation.effective_date ? dayjs(allocation.effective_date).format('YYYY-MM-DD') : '-',
      daysUntilActivation: daysUntilActivation,
      billingStatus: billingStatus,
      billingPercentage: billingPercentage ? `${billingPercentage.toFixed(0)}%` : '0%',
      projectAllocation: allocationPercentage ? `${allocationPercentage.toFixed(0)}%` : '0%',
      duration: duration,
      status: 'Scheduled',
      changeType: allocation.change_type || 'new',
      project_id: allocation.project_id,
      allocationType: 'future'
    };
  });

  return [...transformedActiveAllocations, ...transformedFutureAllocations];
};

/**
 * Extract data from API response (handles different response structures)
 */
export const extractResponseData = (response) => {
  if (!response) return [];

  // Check if response has data array directly
  if (Array.isArray(response.data)) {
    return response.data;
  }
  // Check if response has nested data structure
  else if (response.data && response.data.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  // Check if response is the data object directly
  else if (response.pagination && response.data && Array.isArray(response.data)) {
    return response.data;
  }
  // Fallback: response is an array
  else if (Array.isArray(response)) {
    return response;
  }

  return [];
};

/**
 * Extract pagination from API response
 */
export const extractPagination = (response, defaultPage = 1, defaultLimit = 10) => {
  let paginationData = {};

  if (response) {
    if (response.pagination) {
      paginationData = response.pagination;
    } else if (response.data && response.data.pagination) {
      paginationData = response.data.pagination;
    }
  }

  return {
    total: paginationData.total || 0,
    page: paginationData.page || defaultPage,
    limit: paginationData.limit || defaultLimit,
    totalPages: paginationData.totalPages || 0,
  };
};
