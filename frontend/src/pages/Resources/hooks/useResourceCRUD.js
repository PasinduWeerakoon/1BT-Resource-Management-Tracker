/**
 * useResourceCRUD Hook
 * Handles create, update, and delete operations for resources
 */

import { useState } from 'react';
import { resourcesService } from '@api';
import { App } from 'antd';
import logger from '@utils/logger';
import dayjs from 'dayjs';

export const useResourceCRUD = ({ form, fetchEmployees, pagination }) => {
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

    form.setFieldsValue({
      employeeNumber: record.employeeNumber || record.emp_no,
      name: record.name,
      email: record.email,
      mobile: record.mobile || record.phone_number,
      designation_id: record.designation_id,
      track_id: record.track_id,
      joinDate: record.joinDate || record.date_of_joining ? dayjs(record.joinDate || record.date_of_joining) : null,
      bod: record.date_of_birth ? dayjs(record.date_of_birth) : null,
      nicOrPassport: record.nic || record.nic_passport,
      is_internal_employee: record.is_internal_employee !== undefined ? record.is_internal_employee : (record.employee_type === 'Internal'),
      employment_type: record.employment_type || 'Permanent',
      is_intern: record.is_intern !== undefined ? record.is_intern : false,
      tech_stack: record.tech_stack,
      tag_ids: tagIds,
      tier: record.tier,
      status: record.status,
      photo_url: record.photo_url || record.photo,
      // New fields
      epf_no: record.epf_no,
      total_allocation: record.total_allocation,
      total_resource_billing: record.total_resource_billing,
      internship_completion_target_date: record.internship_completion_target_date ? dayjs(record.internship_completion_target_date) : null,
      university: record.university,
      global_employeeid: record.global_employeeid,
      helper_id: record.helper_id,
      helper: record.helper,
      last_increment_date: record.last_increment_date ? dayjs(record.last_increment_date) : null,
      last_promotion_date: record.last_promotion_date ? dayjs(record.last_promotion_date) : null,
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

  // Handle Add/Edit Employee Submit
  const handleEmployeeSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      if (isEditMode) {
        const updatePayload = {
          name: values.name,
          email: values.email || '',
          phone_number: values.mobile || values.phone_number || '',
          designation_id: values.designation_id,
          track_id: values.track_id,
          date_of_birth: values.bod ? values.bod.format('YYYY-MM-DD') : values.date_of_birth || undefined,
          nic_passport: values.nicOrPassport || values.nic_passport || '',
          is_intern: values.is_intern !== undefined ? values.is_intern : false,
          is_internal_employee: values.is_internal_employee !== undefined ? values.is_internal_employee : true,
          employment_type: values.employment_type || 'Permanent',
          tier: values.tier || undefined,
          tech_stack: values.tech_stack || undefined,
          photo_url: values.photo_url || undefined,
          status: values.status || 'Active',
          tag_ids: values.tag_ids && Array.isArray(values.tag_ids) ? values.tag_ids : undefined,
          // New fields
          epf_no: values.epf_no || undefined,
          total_allocation: values.total_allocation !== undefined && values.total_allocation !== null ? values.total_allocation : undefined,
          total_resource_billing: values.total_resource_billing !== undefined && values.total_resource_billing !== null ? values.total_resource_billing : undefined,
          internship_completion_target_date: values.internship_completion_target_date ? values.internship_completion_target_date.format('YYYY-MM-DD') : undefined,
          university: values.university || undefined,
          global_employeeid: values.global_employeeid || undefined,
          helper_id: values.helper_id || undefined,
          helper: values.helper || undefined,
          last_increment_date: values.last_increment_date ? values.last_increment_date.format('YYYY-MM-DD') : undefined,
          last_promotion_date: values.last_promotion_date ? values.last_promotion_date.format('YYYY-MM-DD') : undefined,
        };

        // Clean up undefined and empty string values
        Object.keys(updatePayload).forEach(key => {
          if (updatePayload[key] === undefined || (updatePayload[key] === '' && key !== 'employment_type' && key !== 'is_internal_employee')) {
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
        const apiPayload = {
          employee_id: values.employee_id || values.employeeNumber || '',
          employee_number: values.employeeNumber || '',
          name: values.name,
          phone_number: values.mobile || '',
          email: values.email || '',
          designation_id: values.designation_id,
          track_id: values.track_id,
          date_of_joining: values.joinDate ? values.joinDate.format('YYYY-MM-DD') : null,
          date_of_birth: values.bod ? values.bod.format('YYYY-MM-DD') : null,
          nic_passport: values.nicOrPassport || '',
          is_intern: values.is_intern || false,
          is_internal_employee: values.is_internal_employee !== undefined ? values.is_internal_employee : true,
          employment_type: values.employment_type || 'Permanent',
          tier: values.tier || undefined,
          tech_stack: values.tech_stack || undefined,
          photo_url: values.photo_url || undefined,
          status: values.status || 'Active',
          tag_ids: values.tag_ids && Array.isArray(values.tag_ids) && values.tag_ids.length > 0 ? values.tag_ids : undefined,
          // New fields
          epf_no: values.epf_no || undefined,
          total_allocation: values.total_allocation !== undefined && values.total_allocation !== null ? values.total_allocation : undefined,
          total_resource_billing: values.total_resource_billing !== undefined && values.total_resource_billing !== null ? values.total_resource_billing : undefined,
          internship_completion_target_date: values.internship_completion_target_date ? values.internship_completion_target_date.format('YYYY-MM-DD') : undefined,
          university: values.university || undefined,
          global_employeeid: values.global_employeeid || undefined,
          helper_id: values.helper_id || undefined,
          helper: values.helper || undefined,
          last_increment_date: values.last_increment_date ? values.last_increment_date.format('YYYY-MM-DD') : undefined,
          last_promotion_date: values.last_promotion_date ? values.last_promotion_date.format('YYYY-MM-DD') : undefined,
        };

        // Clean up undefined and empty string values
        Object.keys(apiPayload).forEach(key => {
          if (apiPayload[key] === undefined || (apiPayload[key] === '' && key !== 'employment_type' && key !== 'is_internal_employee')) {
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
    handleToggleAccountManager,
    handleUpdateTier,
    handleUpdateTechStack,
    setIsAddEmployeeModalVisible,
    setSelectedEmployee,
  };
};
