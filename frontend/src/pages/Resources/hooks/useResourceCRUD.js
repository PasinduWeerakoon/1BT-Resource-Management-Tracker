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
      employeeNumber: record.employeeNumber,
      name: record.name,
      email: record.email,
      mobile: record.mobile || record.phone_number,
      designation_id: record.designation_id,
      track_id: record.track_id,
      joinDate: record.joinDate ? dayjs(record.joinDate) : null,
      bod: record.date_of_birth ? dayjs(record.date_of_birth) : null,
      nicOrPassport: record.nic || record.nic_passport,
      employee_type: record.employee_type || 'Internal',
      is_intern: record.is_intern !== undefined ? record.is_intern : false,
      tech_stack: record.tech_stack,
      tag_ids: tagIds,
      tier: record.tier,
      status: record.status,
      photo_url: record.photo_url || record.photo,
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
          date_of_birth: values.bod ? values.bod.format('YYYY-MM-DD') : values.date_of_birth || undefined,
          nic_passport: values.nicOrPassport || values.nic_passport || '',
          is_intern: values.is_intern !== undefined ? values.is_intern : false,
          employee_type: values.employee_type || 'Internal',
          tier: values.tier || undefined,
          tech_stack: values.tech_stack || undefined,
          photo_url: values.photo_url || undefined,
          status: values.status || 'Active',
          tag_ids: values.tag_ids && Array.isArray(values.tag_ids) ? values.tag_ids : undefined,
        };

        const employeeTypeValue = values.employee_type || 'Internal';
        Object.keys(updatePayload).forEach(key => {
          if (updatePayload[key] === undefined || (updatePayload[key] === '' && key !== 'employee_type')) {
            delete updatePayload[key];
          }
        });

        updatePayload.employee_type = employeeTypeValue;

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
          employee_type: values.employee_type || 'Internal',
          tier: values.tier || undefined,
          tech_stack: values.tech_stack || undefined,
          photo_url: values.photo_url || undefined,
          status: values.status || 'Active',
          tag_ids: values.tag_ids && Array.isArray(values.tag_ids) && values.tag_ids.length > 0 ? values.tag_ids : undefined,
        };

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
    handleToggleAccountManager,
    handleUpdateTier,
    handleUpdateTechStack,
    setIsAddEmployeeModalVisible,
    setSelectedEmployee,
  };
};
