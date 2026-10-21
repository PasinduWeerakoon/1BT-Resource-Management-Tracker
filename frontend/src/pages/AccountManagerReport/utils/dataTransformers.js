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
      const billingPct = parseFloat(alloc.billing_percentage) || 0;
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
 * API returns: resource_name, total_allocation, total_resource_billing, billing_status_name, updated_at
 */
export const transformAllocationData = (allocationsData) => {
  return allocationsData.map((allocation, index) => {
    // Calculate duration in days
    let duration = 0;
    if (allocation.allocated_date) {
      const startDate = dayjs(allocation.allocated_date);
      const endDate = allocation.deallocated_date ? dayjs(allocation.deallocated_date) : dayjs();
      duration = endDate.diff(startDate, 'day');
    }

    const resourceId = allocation.employee_id || allocation.resource_id;
    const resourceName = allocation.resource_name || allocation.employee_name || 'N/A';
    const projectName = allocation.project_name || 'N/A';
    const billingStatus = allocation.billing_status_name || 'N/A';

    const allocationPercentage = typeof allocation.allocation_percentage === 'string'
      ? parseFloat(allocation.allocation_percentage)
      : (allocation.allocation_percentage || 0);
    const billingPercentage = typeof allocation.billing_percentage === 'string'
      ? parseFloat(allocation.billing_percentage)
      : (allocation.billing_percentage || 0);

    const totalAllocation = parseFloat(allocation.total_allocation) || 0;
    const totalBilling = parseFloat(allocation.total_resource_billing) || 0;

    const isActive =
      allocation.is_active === true
      || allocation.is_active === 'true'
      || allocation.is_active === 1;

    return {
      key: allocation.id || `allocation-${index}`,
      id: allocation.id,
      employeeName: resourceName,
      project: projectName,
      allocatedDate: allocation.allocated_date ? dayjs(allocation.allocated_date).format('DD MMM YYYY') : '',
      deallocatedDate: allocation.deallocated_date ? dayjs(allocation.deallocated_date).format('DD MMM YYYY') : '',
      billingStatus,
      billing_status_id: allocation.billing_status_id,
      billingPercentage: billingPercentage ? `${billingPercentage.toFixed(2)}%` : '0.00%',
      projectAllocation: allocationPercentage ? `${allocationPercentage.toFixed(2)}%` : '0.00%',
      totalAllocation: `${totalAllocation.toFixed(2)}%`,
      totalBilling: `${totalBilling.toFixed(2)}%`,
      lastUpdated: allocation.updated_at ? dayjs(allocation.updated_at).format('DD MMM YYYY') : '',
      duration,
      status: allocation.is_active !== undefined && allocation.is_active !== null
        ? (isActive ? 'Active' : 'Inactive')
        : (allocation.status || 'Active'),
      resource_id: resourceId,
      project_id: allocation.project_id,
      project_name: projectName,
    };
  });
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

    return {
      key: allocation.id || `allocation-${index}`,
      id: allocation.id,
      project: allocation.project_name || 'N/A',
      allocatedDate: allocation.allocated_date ? dayjs(allocation.allocated_date).format('YYYY-MM-DD') : '-',
      deallocatedDate: allocation.deallocated_date ? dayjs(allocation.deallocated_date).format('YYYY-MM-DD') : '-',
      billing_status_id: allocation.billing_status_id,
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

    return {
      key: allocation.id || `future-allocation-${index}`,
      id: allocation.id,
      project: allocation.project_name || 'N/A',
      allocatedDate: allocation.allocated_date ? dayjs(allocation.allocated_date).format('YYYY-MM-DD') : '-',
      deallocatedDate: allocation.deallocated_date ? dayjs(allocation.deallocated_date).format('YYYY-MM-DD') : '-',
      effectiveDate: allocation.effective_date ? dayjs(allocation.effective_date).format('YYYY-MM-DD') : '-',
      daysUntilActivation: daysUntilActivation,
      billing_status_id: allocation.billing_status_id,
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
