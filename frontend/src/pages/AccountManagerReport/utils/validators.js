/**
 * Validators for AccountManagerReport
 * Validation functions for forms and data
 */

/**
 * Validate team member data
 */
export const validateTeamMembers = (teamMembersList) => {
  const errors = [];

  teamMembersList.forEach((member, index) => {
    if (!member.employeeName) {
      errors.push(`Member ${index + 1}: Employee name is required`);
    }
    if (!member.allocatedDate) {
      errors.push(`Member ${index + 1}: Allocated date is required`);
    }
    if (member.billingPercentage === undefined || member.billingPercentage === null) {
      errors.push(`Member ${index + 1}: Billing percentage is required`);
    }
    if (member.projectAllocation === undefined || member.projectAllocation === null) {
      errors.push(`Member ${index + 1}: Project allocation is required`);
    }
    if (member.duration === undefined || member.duration === null) {
      errors.push(`Member ${index + 1}: Duration is required`);
    }
  });

  return errors;
};

/**
 * Validate user allocations data
 */
export const validateUserAllocations = (userAllocationsList) => {
  const errors = [];

  userAllocationsList.forEach((allocation, index) => {
    if (!allocation.projectName) {
      errors.push(`Allocation ${index + 1}: Project name is required`);
    }
    if (!allocation.allocatedDate) {
      errors.push(`Allocation ${index + 1}: Allocated date is required`);
    }
    if (allocation.billingPercentage === undefined || allocation.billingPercentage === null) {
      errors.push(`Allocation ${index + 1}: Billing percentage is required`);
    }
    if (allocation.projectAllocation === undefined || allocation.projectAllocation === null) {
      errors.push(`Allocation ${index + 1}: Project allocation is required`);
    }
    if (allocation.duration === undefined || allocation.duration === null) {
      errors.push(`Allocation ${index + 1}: Duration is required`);
    }
  });

  return errors;
};

/**
 * Validate project form data
 */
export const validateProjectForm = (values, accountTypesList, clientsList) => {
  const errors = [];

  if (!values.projectName) {
    errors.push('Project name is required');
  }

  if (!values.accountManager) {
    errors.push('Account manager is required');
  }

  // Validate client for External projects
  const selectedAccountType = accountTypesList.find(t => t.id === values.accountType);
  if (selectedAccountType?.name === 'External') {
    if (!values.clientName) {
      errors.push('Client is required for External projects');
    } else {
      // Verify client exists
      const selectedClient = clientsList.find(client => client.id === values.clientName);
      if (!selectedClient) {
        errors.push('Selected client not found');
      }
    }
  }

  return errors;
};

/**
 * Validate allocation form data
 */
export const validateAllocationForm = (values) => {
  const errors = [];

  if (!values.resource_id) {
    errors.push('Resource is required');
  }

  if (!values.project_id) {
    errors.push('Project is required');
  }

  if (values.allocation_percentage === undefined || values.allocation_percentage === null) {
    errors.push('Allocation percentage is required');
  } else if (values.allocation_percentage < 0 || values.allocation_percentage > 100) {
    errors.push('Allocation percentage must be between 0 and 100');
  }

  if (values.billing_percentage === undefined || values.billing_percentage === null) {
    errors.push('Billing percentage is required');
  } else if (values.billing_percentage < 0 || values.billing_percentage > 100) {
    errors.push('Billing percentage must be between 0 and 100');
  }

  if (!values.start_date) {
    errors.push('Start date is required');
  }

  if (values.end_date && values.start_date && values.end_date < values.start_date) {
    errors.push('End date must be after start date');
  }

  return errors;
};
