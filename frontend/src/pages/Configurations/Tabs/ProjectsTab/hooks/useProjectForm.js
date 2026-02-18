/**
 * useProjectForm Hook
 * Manages project form state and submission logic
 */

import { useState, useEffect } from 'react';
import { projectsService } from '@api';
import { showErrorToast, showSuccessToast } from '@utils/toast.utils';
import logger from '@utils/logger';

/**
 * useProjectForm Hook
 * @param {Object} options - Hook options
 * @param {Object} options.form - Form instance
 * @param {Function} options.onFetch - Callback to refetch projects
 * @param {Array} options.projectTypesForModal - Project types list
 * @param {Array} options.billingStatusesForModal - Billing statuses list
 * @param {Array} options.accountTypesForModal - Account types list from Redux
 * @param {Array} options.projectStatusesForModal - Project statuses list from Redux
 * @param {Function} options.onCloseModal - Close modal handler
 * @returns {Object} Form state and handlers
 */
export const useProjectForm = ({
  form,
  onFetch,
  projectTypesForModal,
  billingStatusesForModal,
  accountTypesForModal,
  projectStatusesForModal,
  onCloseModal,
}) => {
  // Initialize with External account type ID (id: 2)
  const defaultAccountTypeId = accountTypesForModal?.find(at => at.name === 'External')?.id || 2;
  const [accountTypeId, setAccountTypeId] = useState(defaultAccountTypeId);

  /**
   * Handle form submission
   * @param {boolean} isEditMode - Whether in edit mode
   * @param {Object} selectedItem - Selected project item
   * @param {Function} setPagination - Set pagination function
   * @param {Object} pagination - Current pagination state
   */
  const handleSubmit = async (isEditMode, selectedItem, setPagination, pagination) => {
    try {
      // Validate form fields first
      await form.validateFields();
      
      // Get all form values including nested fields
      const values = form.getFieldsValue(true); // true to get nested field values

      if (!values.project_name) {
        showErrorToast('Project name is required');
        return;
      }

      if (!values.account_manager) {
        showErrorToast('Account manager is required');
        return;
      }

      // Extract client_id from form values
      const accountTypeId = values.account_type;
      const accountType = accountTypesForModal?.find(at => at.id === accountTypeId);
      
      // Get status name from status ID
      const statusId = values.status;
      const statusObj = projectStatusesForModal?.find(s => s.id === statusId);
      const statusName = statusObj?.name || 'Active';
      
      // Get client_id - use form.getFieldValue as backup
      let client_id = values.client_id ?? form.getFieldValue('client_id') ?? null;
      
      // Convert to number if it's a valid value
      if (client_id != null && client_id !== '' && client_id !== 0) {
        client_id = typeof client_id === 'string' ? Number(client_id) : client_id;
        if (isNaN(client_id) || client_id <= 0) {
          client_id = null;
        }
      } else {
        client_id = null;
      }
      
      // For Internal projects, client_id should always be null
      if (accountType?.name === 'Internal') {
        client_id = null;
      }

      if (isEditMode) {
        // For edit mode, send all updatable fields
        // Backend expects account_type and status as strings, not IDs
        const updatePayload = {
          project_name: values.project_name,
          project_code: values.project_code || '',
          client_id: accountType?.name === 'External' ? client_id : null,
          project_type_id: values.project_type || null,
          account_type: accountType?.name || 'Internal', // Send string, not ID
          account_manager_id: values.account_manager || null,
          account_reg_sales_owner: values.account_reg_sales_owner || '',
          team_size: values.team_size || 1,
          billing_status_id: values.billing_type || null,
          budget: values.budget || 0,
          status: statusName, // Send string, not ID
          project_start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
          project_end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
          description: values.description || '',
        };

        // Clean up payload - remove empty optional fields
        const cleanedPayload = { ...updatePayload };
        if (!cleanedPayload.project_code || cleanedPayload.project_code === '') {
          delete cleanedPayload.project_code;
        }
        if (!cleanedPayload.account_reg_sales_owner || cleanedPayload.account_reg_sales_owner === '') {
          delete cleanedPayload.account_reg_sales_owner;
        }
        if (!cleanedPayload.description || cleanedPayload.description === '') {
          delete cleanedPayload.description;
        }
        if (!cleanedPayload.project_start_date) {
          delete cleanedPayload.project_start_date;
        }
        if (!cleanedPayload.project_end_date) {
          delete cleanedPayload.project_end_date;
        }
        // For Internal projects, explicitly set client_id to null to clear it in the database
        // Don't delete it from payload - we need to send null to clear the existing value
        if (accountType?.name === 'Internal') {
          cleanedPayload.client_id = null;
        }

        const response = await projectsService.update(selectedItem.id, cleanedPayload);
        if (response && (response.success !== false || response.data)) {
          showSuccessToast('Project updated successfully');
          await onFetch();
          onCloseModal();
        } else {
          showErrorToast(response?.message || 'Failed to update project');
        }
      } else {
        // Backend expects account_type and status as strings, not IDs
        const projectPayload = {
          project_name: values.project_name,
          project_code: values.project_code || '',
          client_id: client_id,
          project_type_id: values.project_type, // ID from form
          account_type: accountType?.name || 'Internal', // Send string, not ID
          account_manager_id: values.account_manager, // ID from form
          account_reg_sales_owner: values.account_reg_sales_owner || '',
          team_size: values.team_size || 1,
          billing_status_id: values.billing_type, // ID from form
          budget: values.budget || 0,
          status: statusName, // Send string, not ID
          project_start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
          project_end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
          description: values.description || '',
        };

        // Clean up payload
        const cleanedPayload = { ...projectPayload };
        if (!cleanedPayload.project_code || cleanedPayload.project_code === '') {
          delete cleanedPayload.project_code;
        }
        if (!cleanedPayload.account_reg_sales_owner || cleanedPayload.account_reg_sales_owner === '') {
          delete cleanedPayload.account_reg_sales_owner;
        }
        if (!cleanedPayload.description || cleanedPayload.description === '') {
          delete cleanedPayload.description;
        }
        if (!cleanedPayload.project_start_date) {
          delete cleanedPayload.project_start_date;
        }
        if (!cleanedPayload.project_end_date) {
          delete cleanedPayload.project_end_date;
        }
        // Check if account type is Internal to remove client_id
        const accountTypeObj = accountTypesForModal?.find(at => at.id === values.account_type);
        if (accountTypeObj?.name === 'Internal') {
          delete cleanedPayload.client_id;
        }

        const response = await projectsService.create(cleanedPayload);
        if (response && (response.success !== false || response.data)) {
          showSuccessToast('Project created successfully');
          await onFetch();
          onCloseModal();
          setPagination({ ...pagination, current: 1 });
        } else {
          showErrorToast(response?.message || 'Failed to create project');
        }
      }
    } catch (error) {
      logger.error('Failed to submit project:', error);
      showErrorToast(error?.message || 'Failed to save project');
    }
  };

  return {
    accountType: accountTypeId,
    setAccountType: setAccountTypeId,
    handleSubmit,
  };
};

export default useProjectForm;
