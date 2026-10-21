/**
 * useProjectManagement Hook
 * Handles project create/edit modal state and form submission
 */

import { useState, useCallback } from 'react';
import { Form } from 'antd';
import dayjs from 'dayjs';
import { projectsService } from '@api';
import { showErrorToast, showSuccessToast } from '@utils/toast.utils';
import logger from '@utils/logger';

const useProjectManagement = ({
  filters,
  accountTypesList,
  projectStatusesList,
  billingStatusesList,
  clientsList,
  accountManagersList,
  onSuccess, // callback after create/update success (e.g. refresh report)
  onProjectCreated, // callback after project created (e.g. refresh project list)
}) => {
  const [form] = Form.useForm();
  const [isCreateProjectModalVisible, setIsCreateProjectModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [billingType, setBillingType] = useState(null);

  const defaultAccountTypeId = accountTypesList?.find((at) => at.name === 'External')?.id || 2;
  const [accountType, setAccountType] = useState(defaultAccountTypeId);

  // ─── Open create modal ───
  const handleCreateProject = useCallback(() => {
    const accountManagerValue =
      filters.accountManager && filters.accountManager !== 'All' ? filters.accountManager : undefined;
    const externalAccountTypeId = accountTypesList.find((at) => at.name === 'External')?.id;
    const activeStatusId = projectStatusesList.find((ps) => ps.name === 'Active')?.id;

    form.setFieldsValue({
      account_manager: accountManagerValue,
      status: activeStatusId,
      billing_type: billingStatusesList.find((bs) => bs.name === 'Billing')?.id,
      account_type: externalAccountTypeId,
      team_size: 1,
    });
    setBillingType(null);
    setAccountType(externalAccountTypeId);
    setIsCreateProjectModalVisible(true);
  }, [filters.accountManager, accountTypesList, projectStatusesList, billingStatusesList, form]);

  // ─── Cancel / close modal ───
  const handleCreateProjectCancel = useCallback(() => {
    setIsCreateProjectModalVisible(false);
    setIsEditMode(false);
    setSelectedProject(null);
    form.resetFields();
    setBillingType(null);
    setAccountType(accountTypesList.find((at) => at.name === 'External')?.id || null);
  }, [accountTypesList, form]);

  // ─── Open edit modal ───
  const handleEditProject = useCallback((project) => {
    setSelectedProject(project);
    setIsEditMode(true);

    const accountTypeId =
      accountTypesList.find(
        (at) =>
          at.name === project.account_type ||
          (project.project_type === 'Internal' ? 'Internal' : 'External')
      )?.id || accountTypesList.find((at) => at.name === 'External')?.id;
    const statusId =
      projectStatusesList.find((ps) => ps.name === project.status)?.id ||
      projectStatusesList.find((ps) => ps.name === 'Active')?.id;
    const billingStatusId = billingStatusesList.find(
      (bs) => bs.name === (project.is_billable ? 'Billing' : 'Non-Billing')
    )?.id;

    const formValues = {
      project_name: project.project_name || project.project || '',
      project_code: project.project_code || '',
      client_id: project.client_id || null,
      project_type: project.project_type_id || null,
      account_type: accountTypeId,
      status: statusId,
      account_manager: project.account_manager_id || filters.accountManager || null,
      billing_type: billingStatusId || null,
      team_size: project.team_size ?? project.teamSize ?? 1,
      account_reg_sales_owner: project.account_reg_sales_owner || '',
      budget: project.budget != null ? parseFloat(project.budget) : 0,
      start_date: project.project_start_date
        ? dayjs(project.project_start_date)
        : project.start_date
        ? dayjs(project.start_date)
        : null,
      end_date: project.project_end_date
        ? dayjs(project.project_end_date)
        : project.end_date
        ? dayjs(project.end_date)
        : null,
      description: project.description || '',
    };

    form.resetFields();
    setTimeout(() => form.setFieldsValue(formValues), 100);
    setBillingType(billingStatusId);
    setAccountType(accountTypeId);
    setIsCreateProjectModalVisible(true);
  }, [accountTypesList, projectStatusesList, billingStatusesList, filters.accountManager, form]);

  // ─── Form submission ───
  const handleCreateProjectSubmit = useCallback(async (values) => {
    try {
      setIsSubmittingProject(true);

      if (!values.project_name) {
        showErrorToast('Project name is required');
        return;
      }
      if (!values.account_manager) {
        showErrorToast('Account manager is required');
        return;
      }

      // Validate client for External projects
      const accountType = accountTypesList.find((at) => at.id === values.account_type);
      if (accountType?.name === 'External') {
        if (!values.client_id || values.client_id === null || values.client_id === undefined || values.client_id === '') {
          showErrorToast('Client is required for External projects');
          return;
        }
        // Validate client exists if provided
        if (!clientsList.find((c) => c.id === values.client_id)) {
          showErrorToast('Selected client not found');
          return;
        }
      }

      const basePayload = {
        project_name: values.project_name,
        project_code: values.project_code || '',
        project_type_id: values.project_type,
        account_type_id: values.account_type,
        account_manager_id: values.account_manager,
        account_reg_sales_owner: values.account_reg_sales_owner || '',
        team_size: values.team_size || 1,
        billing_status_id: values.billing_type,
        budget: values.budget || 0,
        status_id: values.status,
        project_start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
        project_end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
        description: values.description || '',
      };

      // Add client_id only if it has a value
      if (values.client_id) {
        basePayload.client_id = values.client_id;
      }

      // Clean up empty optional fields
      const cleanPayload = { ...basePayload };
      ['project_code', 'account_reg_sales_owner', 'description', 'project_start_date', 'project_end_date'].forEach(
        (key) => {
          if (!cleanPayload[key] || cleanPayload[key] === '') delete cleanPayload[key];
        }
      );
      
      // Remove client_id if not provided or if Internal project
      if (!cleanPayload.client_id || cleanPayload.client_id === null) {
        delete cleanPayload.client_id;
      }
      if (accountType?.name === 'Internal') {
        delete cleanPayload.client_id;
      }

      let response;
      if (isEditMode && selectedProject) {
        response = await projectsService.update(selectedProject.key || selectedProject.id, cleanPayload);
      } else {
        response = await projectsService.create(cleanPayload);
      }

      if (response && (response.success !== false || response.data)) {
        showSuccessToast(isEditMode ? 'Project updated successfully' : 'Project created successfully');
        handleCreateProjectCancel();
        onSuccess?.();
        // Trigger project list refetch after creation/update
        if (onProjectCreated) {
          onProjectCreated();
        }
      } else {
        showErrorToast(response?.message || `Failed to ${isEditMode ? 'update' : 'create'} project`);
      }
    } catch (error) {
      logger.error('Error creating/updating project:', error);
      showErrorToast(error?.response?.data?.message || error?.message || 'Failed to save project');
    } finally {
      setIsSubmittingProject(false);
    }
  }, [isEditMode, selectedProject, accountTypesList, clientsList, handleCreateProjectCancel, onSuccess]);

  return {
    form,
    isCreateProjectModalVisible,
    isEditMode,
    selectedProject,
    isSubmittingProject,
    billingType,
    setBillingType,
    accountType,
    setAccountType,
    handleCreateProject,
    handleCreateProjectCancel,
    handleEditProject,
    handleCreateProjectSubmit,
  };
};

export default useProjectManagement;
