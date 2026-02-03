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
 * @param {Function} options.onCloseModal - Close modal handler
 * @returns {Object} Form state and handlers
 */
export const useProjectForm = ({
  form,
  onFetch,
  projectTypesForModal,
  billingStatusesForModal,
  onCloseModal,
}) => {
  const [accountType, setAccountType] = useState('External');

  /**
   * Handle form submission
   * @param {boolean} isEditMode - Whether in edit mode
   * @param {Object} selectedItem - Selected project item
   * @param {Function} setPagination - Set pagination function
   * @param {Object} pagination - Current pagination state
   */
  const handleSubmit = async (isEditMode, selectedItem, setPagination, pagination) => {
    try {
      const values = await form.validateFields();

      if (!values.project_name) {
        showErrorToast('Project name is required');
        return;
      }

      if (!values.account_manager) {
        showErrorToast('Account manager is required');
        return;
      }

      let client_id = null;
      const accountType = values.account_type || 'External';
      if (accountType === 'External') {
        if (values.client_id) {
          client_id = values.client_id;
        } else {
          showErrorToast('Client is required for External projects');
          return;
        }
      }

      const projectTypeObj = projectTypesForModal.find(pt => pt.id === values.project_type);
      const project_type = projectTypeObj?.name || 'Client';

      const status = values.status || 'Active';

      if (isEditMode) {
        const updatePayload = {
          project_name: values.project_name,
          client_id: client_id,
          status: status,
          description: values.description || '',
        };

        const response = await projectsService.update(selectedItem.id, updatePayload);
        if (response && (response.success !== false || response.data)) {
          showSuccessToast('Project updated successfully');
          await onFetch();
          onCloseModal();
        } else {
          showErrorToast(response?.message || 'Failed to update project');
        }
      } else {
        const billingTypeObj = billingStatusesForModal.find(bs => bs.id === values.billing_type);
        const billing_type = billingTypeObj?.name || 'Billing';

        const projectPayload = {
          project_name: values.project_name,
          project_code: values.project_code || '',
          client_id: client_id,
          project_type: project_type,
          account_type: accountType || 'External',
          account_manager: values.account_manager,
          account_reg_sales_owner: values.account_reg_sales_owner || '',
          team_size: values.team_size || 1,
          billing_type: billing_type,
          budget: values.budget || 0,
          status: status,
          start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
          end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
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
        if (!cleanedPayload.start_date) {
          delete cleanedPayload.start_date;
        }
        if (!cleanedPayload.end_date) {
          delete cleanedPayload.end_date;
        }
        if (accountType === 'Internal') {
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
    accountType,
    setAccountType,
    handleSubmit,
  };
};

export default useProjectForm;
