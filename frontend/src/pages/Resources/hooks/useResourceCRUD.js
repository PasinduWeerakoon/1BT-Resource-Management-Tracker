/**
 * useResourceCRUD Hook
 * Handles create, update, and delete operations for resources
 */

import { useState } from 'react';
import { resourcesService } from '@api';
import { App, Modal } from 'antd';
import logger from '@utils/logger';
import dayjs from 'dayjs';

export const useResourceCRUD = ({ form, fetchEmployees, pagination, tiers, employeeTypes, techStacks, universities }) => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isAddEmployeeModalVisible, setIsAddEmployeeModalVisible] = useState(false);
  const [updatingAccountManager, setUpdatingAccountManager] = useState({});
  const [updatingTier, setUpdatingTier] = useState({});
  const [updatingTechStack, setUpdatingTechStack] = useState({});

  // Handle Add Employee
  const handleAddEmployee = () => {
    setIsEditMode(false);
    setSelectedEmployee(null);
    form.resetFields();
    setIsAddEmployeeModalVisible(true);
  };

  // Handle Edit Employee
  const handleEditEmployee = (record) => {
    setIsEditMode(true);
    setSelectedEmployee(record);

    // Extract tag IDs from tags array
    const tagIds = record.tags && Array.isArray(record.tags)
      ? record.tags.map(tag => (typeof tag === 'object' ? tag.id : tag))
      : [];

    // Map employee_type string to employee_type_id (find ID from employeeTypes)
    const employeeTypeId = record.employee_type_id ||
      (record.employment_type && employeeTypes
        ? employeeTypes.find(et => et.name === record.employment_type || et.label === record.employment_type)?.id
        : undefined);

    // Map tech_stack string to tech_stack_id (find ID from techStacks)
    const techStackId = record.tech_stack_id ||
      (record.tech_stack && techStacks
        ? techStacks.find(ts => ts.name === record.tech_stack || ts.label === record.tech_stack)?.id
        : undefined);

    // Map university string to university_id (find ID from universities)
    const universityId = record.university_id ||
      (record.university && universities
        ? universities.find(u => u.name === record.university || u.label === record.university)?.id
        : undefined);

    form.setFieldsValue({
      emp_no: record.emp_no || record.employeeNumber,
      name: record.name,
      email: record.email,
      mobile: record.mobile || record.phone_number,
      designation_id: record.designation_id,
      track_id: record.track_id,
      joined_date: record.joined_date || record.joinDate || record.date_of_joining
        ? dayjs(record.joined_date || record.joinDate || record.date_of_joining)
        : null,
      employee_type_id: employeeTypeId,
      is_intern: record.is_intern !== undefined ? record.is_intern : false,
      is_external: record.is_external !== undefined ? record.is_external : false,
      tech_stack_id: techStackId,
      tag_ids: tagIds,
      tier_id: record.tier_id || (record.tier && tiers ? tiers.find(t => t.name === record.tier)?.id : undefined),
      status: record.status,
      photo_url: record.photo_url || record.photo,
      // New fields
      epf_no: record.epf_no,
      total_allocation: record.total_allocation !== undefined && record.total_allocation !== null ? record.total_allocation : 0,
      total_resource_billing: record.total_resource_billing !== undefined && record.total_resource_billing !== null ? record.total_resource_billing : 0,
      internship_completion_target_date: record.internship_completion_target_date ? dayjs(record.internship_completion_target_date) : null,
      university_id: universityId,
      global_employee_id: record.global_employee_id || record.global_employeeid,
      helper_id: record.helper_id || null,
      helper: record.helper,
      last_increment_date: record.last_increment_date ? dayjs(record.last_increment_date) : null,
      last_promotion_date: record.last_promotion_date ? dayjs(record.last_promotion_date) : null,
      skills: record.skills && Array.isArray(record.skills) ? record.skills : [],
    });
    setIsAddEmployeeModalVisible(true);
  };

  // Handle Cancel
  const handleCancel = () => {
    setIsAddEmployeeModalVisible(false);
    form.resetFields();
    setSelectedEmployee(null);
    setIsEditMode(false);
  };

  // Handle Delete Employee (soft delete via API)
  const handleDeleteEmployee = (record) => {
    const name = record?.name || record?.employeeNumber || 'this employee';
    const employeeId = record?.id ?? record?.resource_id;
    if (employeeId == null || employeeId === '') {
      message.error('Cannot delete: employee ID is missing.');
      return;
    }
    Modal.confirm({
      title: 'Delete Employee',
      content: `Are you sure you want to delete ${name}? This will remove the employee from the active list. They must have no active project allocations.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setLoading(true);
          const response = await resourcesService.delete(employeeId);
          if (response && response.success !== false) {
            message.success(response.message || 'Employee deleted successfully');
            await fetchEmployees(pagination.current, pagination.pageSize);
          } else {
            message.error(response?.message || 'Failed to delete employee');
          }
        } catch (error) {
          const apiMessage = error?.response?.data?.message || error?.message;
          message.error(apiMessage || 'Failed to delete employee');
          logger.error('Delete employee error', error);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Handle Add/Edit Employee Submit
  const handleEmployeeSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      if (isEditMode) {
        const updatePayload = {
          name: values.name,
          email: values.email || '',
          phone_number: values.mobile || values.phone_number || undefined,
          designation_id: values.designation_id,
          track_id: values.track_id,
          tier_id: values.tier_id,
          employee_type_id: values.employee_type_id,
          tech_stack_id: values.tech_stack_id || undefined,
          university_id: values.university_id || undefined,
          joined_date: values.joined_date ? values.joined_date.format('YYYY-MM-DD') : undefined,
          is_intern: values.is_intern !== undefined ? values.is_intern : false,
          is_external: values.is_external !== undefined ? values.is_external : false,
          photo_url: values.photo_url || undefined,
          skills: values.skills && Array.isArray(values.skills) && values.skills.length > 0 ? values.skills : undefined,
          status: values.status || 'Active',
          tag_ids: values.tag_ids && Array.isArray(values.tag_ids) && values.tag_ids.length > 0 ? values.tag_ids : undefined,
          total_allocation: values.total_allocation !== undefined && values.total_allocation !== null ? Number(values.total_allocation) : 0,
          total_resource_billing: values.total_resource_billing !== undefined && values.total_resource_billing !== null ? Number(values.total_resource_billing) : 0,
          internship_completion_target_date: values.internship_completion_target_date ? values.internship_completion_target_date.format('YYYY-MM-DD') : undefined,
          global_employee_id: values.global_employee_id || undefined,
          helper_id: values.helper_id || null,
          helper: values.helper || undefined,
          last_increment_date: values.last_increment_date ? values.last_increment_date.format('YYYY-MM-DD') : undefined,
          last_promotion_date: values.last_promotion_date ? values.last_promotion_date.format('YYYY-MM-DD') : undefined,
        };

        // Clean up undefined values (but keep null for helper_id and 0 for numbers)
        Object.keys(updatePayload).forEach(key => {
          if (updatePayload[key] === undefined || (updatePayload[key] === '' && key !== 'email')) {
            delete updatePayload[key];
          }
        });

        const response = await resourcesService.update(selectedEmployee.id, updatePayload);

        if (response && (response.success !== false || response.data)) {
          message.success('Employee updated successfully');
          await fetchEmployees(pagination.current, pagination.pageSize);
        } else {
          message.error(response?.message || 'Failed to update employee');
        }
      } else {
        // CREATE payload - Required fields
        const apiPayload = {
          epf_no: values.epf_no,                              // REQUIRED
          emp_no: values.emp_no,                              // REQUIRED
          name: values.name,                                  // REQUIRED
          email: values.email,                                // REQUIRED
          track_id: values.track_id,                          // REQUIRED
          tier_id: values.tier_id,                            // REQUIRED
          designation_id: values.designation_id,             // REQUIRED
          employee_type_id: values.employee_type_id,          // REQUIRED

          // Optional fields
          global_employee_id: values.global_employee_id || undefined,
          phone_number: values.mobile || values.phone_number || undefined,
          tech_stack_id: values.tech_stack_id || undefined,
          university_id: values.university_id || undefined,
          joined_date: values.joined_date ? values.joined_date.format('YYYY-MM-DD') : undefined,
          last_increment_date: values.last_increment_date ? values.last_increment_date.format('YYYY-MM-DD') : undefined,
          last_promotion_date: values.last_promotion_date ? values.last_promotion_date.format('YYYY-MM-DD') : undefined,
          internship_completion_target_date: values.internship_completion_target_date ? values.internship_completion_target_date.format('YYYY-MM-DD') : undefined,
          is_intern: values.is_intern !== undefined ? values.is_intern : false,
          is_external: values.is_external !== undefined ? values.is_external : false,
          photo_url: values.photo_url || undefined,
          skills: values.skills && Array.isArray(values.skills) && values.skills.length > 0 ? values.skills : undefined,
          status: values.status || 'Active',
          tag_ids: values.tag_ids && Array.isArray(values.tag_ids) && values.tag_ids.length > 0 ? values.tag_ids : undefined,
          total_allocation: values.total_allocation !== undefined && values.total_allocation !== null ? Number(values.total_allocation) : 0,
          total_resource_billing: values.total_resource_billing !== undefined && values.total_resource_billing !== null ? Number(values.total_resource_billing) : 0,
          helper_id: values.helper_id || null,
          helper: values.helper || undefined,
        };

        // Clean up undefined values (but keep null for helper_id and 0 for numbers)
        Object.keys(apiPayload).forEach(key => {
          if (apiPayload[key] === undefined) {
            delete apiPayload[key];
          }
        });

        const response = await resourcesService.create(apiPayload);

        if (response && (response.success !== false || response.data)) {
          message.success('Employee created successfully');
          await fetchEmployees(pagination.current, pagination.pageSize);
        } else {
          message.error(response?.message || 'Failed to create employee');
        }
      }

      setIsAddEmployeeModalVisible(false);
      form.resetFields();
      setSelectedEmployee(null);
      setIsEditMode(false);
    } catch (error) {
      logger.error('Employee submit error', error);
      message.error(error.message || 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  // Handle Account Manager Toggle
  const handleToggleAccountManager = async (record, isAccountManager) => {
    try {
      setUpdatingAccountManager(prev => ({ ...prev, [record.id]: true }));
      const response = await resourcesService.updateAccountManager(record.id, {
        is_account_manager: isAccountManager,
      });
      if (response && (response.success !== false || response.data)) {
        message.success(isAccountManager ? 'Resource assigned as account manager' : 'Account manager status removed');
        await fetchEmployees(pagination.current, pagination.pageSize);
      } else {
        message.error(response?.message || 'Failed to update account manager status');
      }
    } catch (error) {
      logger.error('Account manager toggle error', error);
      message.error(error.message || 'Failed to update account manager status');
    } finally {
      setUpdatingAccountManager(prev => ({ ...prev, [record.id]: false }));
    }
  };

  // Handle Tier Update
  const handleUpdateTier = async (record, newTier) => {
    try {
      setUpdatingTier(prev => ({ ...prev, [record.id]: true }));
      const response = await resourcesService.updateTier(record.id, { tier: newTier });
      if (response && (response.success !== false || response.data)) {
        message.success('Resource tier updated successfully');
        await fetchEmployees(pagination.current, pagination.pageSize);
      } else {
        message.error(response?.message || 'Failed to update tier');
      }
    } catch (error) {
      logger.error('Tier update error', error);
      message.error(error.message || 'Failed to update tier');
    } finally {
      setUpdatingTier(prev => ({ ...prev, [record.id]: false }));
    }
  };

  // Handle Tech Stack Update
  const handleUpdateTechStack = async (record, newTechStack) => {
    try {
      setUpdatingTechStack(prev => ({ ...prev, [record.id]: true }));
      const response = await resourcesService.updateTechStack(record.id, { tech_stack: newTechStack });
      if (response && (response.success !== false || response.data)) {
        message.success('Resource tech stack updated successfully');
        await fetchEmployees(pagination.current, pagination.pageSize);
      } else {
        message.error(response?.message || 'Failed to update tech stack');
      }
    } catch (error) {
      logger.error('Tech stack update error', error);
      message.error(error.message || 'Failed to update tech stack');
    } finally {
      setUpdatingTechStack(prev => ({ ...prev, [record.id]: false }));
    }
  };

  return {
    loading,
    isEditMode,
    selectedEmployee,
    isAddEmployeeModalVisible,
    updatingAccountManager,
    updatingTier,
    updatingTechStack,
    handleAddEmployee,
    handleEditEmployee,
    handleCancel,
    handleEmployeeSubmit,
    handleDeleteEmployee,
    handleToggleAccountManager,
    handleUpdateTier,
    handleUpdateTechStack,
    setIsAddEmployeeModalVisible,
    setSelectedEmployee,
  };
};
