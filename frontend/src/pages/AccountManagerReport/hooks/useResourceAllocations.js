/**
 * useResourceAllocations Hook
 * Handles the Resource Allocations modal (view a resource's allocations)
 * and the User Allocations modal (edit a user's allocations)
 */

import { useState, useCallback } from 'react';
import { Form } from 'antd';
import dayjs from 'dayjs';
import { resourcesService } from '@api';
import { showErrorToast, showWarningToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import { transformResourceAllocationsData } from '../utils/dataTransformers';

const useResourceAllocations = () => {
  // ─── Resource allocations modal (read-only view) ───
  const [isResourceAllocationsModalVisible, setIsResourceAllocationsModalVisible] = useState(false);
  const [resourceAllocationsData, setResourceAllocationsData] = useState([]);
  const [loadingResourceAllocations, setLoadingResourceAllocations] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [selectedResourceName, setSelectedResourceName] = useState('');
  const [selectedResourceTotalAllocation, setSelectedResourceTotalAllocation] = useState(0);
  const [selectedResourceTotalBilling, setSelectedResourceTotalBilling] = useState(0);

  // ─── User allocations modal (editable) ───
  const [isUserAllocationModalVisible, setIsUserAllocationModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [userAllocationsList, setUserAllocationsList] = useState([]);
  const [userAllocationsForm] = Form.useForm();

  // ─── View resource allocations (from BY ALLOCATION row click) ───
  const handleViewResourceAllocations = useCallback(async (record) => {
    if (!record.resource_id) {
      showWarningToast('Resource ID not found');
      return;
    }

    setSelectedResourceId(record.resource_id);
    setSelectedResourceName(record.employeeName || 'N/A');
    setSelectedResourceTotalAllocation(parseFloat(record.total_allocation || 0));
    setSelectedResourceTotalBilling(parseFloat(record.total_billing || 0));
    setIsResourceAllocationsModalVisible(true);

    try {
      setLoadingResourceAllocations(true);
      const response = await resourcesService.getAllocations(record.resource_id);

      let allocationsData = [];
      if (response) {
        if (response.allocations && Array.isArray(response.allocations)) {
          allocationsData = response.allocations;
        } else if (response.data?.allocations && Array.isArray(response.data.allocations)) {
          allocationsData = response.data.allocations;
        } else if (Array.isArray(response.data)) {
          allocationsData = response.data;
        } else if (Array.isArray(response)) {
          allocationsData = response;
        } else if (response.data && typeof response.data === 'object') {
          if (response.data.allocations && Array.isArray(response.data.allocations)) {
            allocationsData = response.data.allocations;
          } else if (response.data.id) {
            allocationsData = [response.data];
          }
        }
      }

      const transformed = transformResourceAllocationsData(allocationsData);
      setResourceAllocationsData(transformed);

      if (transformed.length === 0 && allocationsData.length === 0) {
        showWarningToast('No allocations found for this resource');
      }
    } catch (error) {
      logger.error('Failed to fetch resource allocations:', error);
      showErrorToast(error?.response?.data?.message || error?.message || 'Failed to load resource allocations');
      setResourceAllocationsData([]);
    } finally {
      setLoadingResourceAllocations(false);
    }
  }, []);

  // ─── Close resource allocations modal ───
  const handleCloseResourceAllocations = useCallback(() => {
    setIsResourceAllocationsModalVisible(false);
    setResourceAllocationsData([]);
    setSelectedResourceId(null);
    setSelectedResourceName('');
    setSelectedResourceTotalAllocation(0);
    setSelectedResourceTotalBilling(0);
  }, []);

  // ─── Row click handler (BY ALLOCATION table) ───
  const handleRowClick = useCallback((record) => {
    if (record.resource_id) {
      handleViewResourceAllocations(record);
    } else {
      showWarningToast('Resource ID not found for this allocation');
    }
  }, [handleViewResourceAllocations]);

  // ─── User allocations modal handlers ───
  const handleUserAllocationCancel = useCallback(() => {
    setIsUserAllocationModalVisible(false);
    setSelectedEmployee(null);
    setUserAllocationsList([]);
    userAllocationsForm.resetFields();
  }, [userAllocationsForm]);

  const handleAddUserAllocationRow = useCallback(() => {
    setUserAllocationsList((prev) => [
      ...prev,
      {
        key: `new-${Date.now()}`,
        projectName: undefined,
        allocatedDate: undefined,
        deallocatedDate: undefined,
        billingStatus: 'Billing',
        billingPercentage: 0,
        projectAllocation: 0,
        duration: 0,
        status: 'Active',
        isExisting: false,
      },
    ]);
  }, []);

  const handleRemoveUserAllocationRow = useCallback((key) => {
    setUserAllocationsList((prev) => prev.filter((a) => a.key !== key));
  }, []);

  const handleUserAllocationFieldChange = useCallback((allocationKey, field, value) => {
    setUserAllocationsList((prev) =>
      prev.map((a) => (a.key === allocationKey ? { ...a, [field]: value } : a))
    );
  }, []);

  const handleUserAllocationsSubmit = useCallback(async () => {
    try {
      const formValues = await userAllocationsForm.getFieldsValue();
      const errors = [];

      userAllocationsList.forEach((allocation, i) => {
        if (!allocation.projectName) errors.push(`Allocation ${i + 1}: Project name is required`);
        if (!allocation.allocatedDate) errors.push(`Allocation ${i + 1}: Allocated date is required`);
        if (allocation.billingPercentage == null) errors.push(`Allocation ${i + 1}: Billing percentage is required`);
        if (allocation.projectAllocation == null) errors.push(`Allocation ${i + 1}: Project allocation is required`);
        if (allocation.duration == null) errors.push(`Allocation ${i + 1}: Duration is required`);
      });

      if (errors.length > 0) {
        logger.error('Validation errors:', errors);
        return;
      }

      const allocationsToSave = userAllocationsList.map((allocation) => {
        const data = formValues.allocations?.[allocation.key] || {};
        return { employeeName: selectedEmployee, ...allocation, ...data };
      });

      logger.debug('Saving user allocations:', allocationsToSave);
      // TODO: Add API call to save user allocations

      handleUserAllocationCancel();
    } catch (error) {
      logger.error('Validation failed:', error);
    }
  }, [userAllocationsList, userAllocationsForm, selectedEmployee, handleUserAllocationCancel]);

  return {
    // Resource allocations modal
    isResourceAllocationsModalVisible,
    resourceAllocationsData,
    loadingResourceAllocations,
    selectedResourceId,
    selectedResourceName,
    selectedResourceTotalAllocation,
    selectedResourceTotalBilling,
    handleViewResourceAllocations,
    handleCloseResourceAllocations,
    handleRowClick,

    // User allocations modal
    isUserAllocationModalVisible,
    selectedEmployee,
    userAllocationsList,
    userAllocationsForm,
    handleUserAllocationCancel,
    handleAddUserAllocationRow,
    handleRemoveUserAllocationRow,
    handleUserAllocationFieldChange,
    handleUserAllocationsSubmit,
  };
};

export default useResourceAllocations;
