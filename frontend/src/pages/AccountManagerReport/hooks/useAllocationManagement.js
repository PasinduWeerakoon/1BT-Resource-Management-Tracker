/**
 * useAllocationManagement Hook
 * Handles allocation CRUD operations (add, edit, delete) and the allocation form modal
 */

import { useState, useCallback } from 'react';
import { Form, Modal } from 'antd';
import dayjs from 'dayjs';
import { allocationsService } from '@api';
import { showErrorToast, showSuccessToast } from '@utils/toast.utils';
import logger from '@utils/logger';

const useAllocationManagement = ({
  resourcesList,
  projectsForFilter,
  onSuccess, // callback after CRUD success (e.g. refresh report)
}) => {
  const [isAllocationModalVisible, setIsAllocationModalVisible] = useState(false);
  const [isEditAllocationMode, setIsEditAllocationMode] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [allocationForm] = Form.useForm();
  const [isSubmittingAllocation, setIsSubmittingAllocation] = useState(false);
  
  // Delete allocation modal state
  const [isDeleteAllocationModalVisible, setIsDeleteAllocationModalVisible] = useState(false);
  const [allocationToDelete, setAllocationToDelete] = useState(null);
  const [deleteAllocationForm] = Form.useForm();
  const [isDeletingAllocation, setIsDeletingAllocation] = useState(false);

  // ─── Add allocation ───
  const handleAddAllocation = useCallback(() => {
    setIsEditAllocationMode(false);
    setSelectedAllocation(null);
    allocationForm.resetFields();
    allocationForm.setFieldsValue({
      project_id: undefined,
      allocation_percentage: 100,
      billing_percentage: 100,
      is_active: true,
    });
    setIsAllocationModalVisible(true);
  }, [allocationForm]);

  // ─── Edit allocation ───
  const handleEditAllocation = useCallback((record) => {
    setIsEditAllocationMode(true);
    setSelectedAllocation(record);

    const resource = resourcesList.find((r) => r.name === record.employeeName);
    const project = projectsForFilter.find(
      (p) => p.project_name === record.project_name || p.name === record.project_name
    );

    allocationForm.setFieldsValue({
      resource_id: resource?.id,
      project_id: project?.id,
      allocation_percentage: parseFloat(record.projectAllocation?.replace('%', '') || '0'),
      billing_percentage: parseFloat(record.billingPercentage?.replace('%', '') || '0'),
      start_date: record.allocatedDate ? dayjs(record.allocatedDate, 'DD MMM YYYY') : null,
      end_date: record.deallocatedDate ? dayjs(record.deallocatedDate, 'DD MMM YYYY') : null,
      is_active: record.status === 'Active',
      billing_status_id: record.billing_status_id,
      notes: record.notes || '',
    });
    setIsAllocationModalVisible(true);
  }, [allocationForm, resourcesList, projectsForFilter]);

  // ─── Delete allocation ───
  const handleDeleteAllocation = useCallback((record) => {
    // Skip if project is Bench (should be disabled in UI, but double-check)
    if (record.project === 'Bench') {
      showErrorToast('Cannot delete Bench allocations');
      return;
    }
    
    // Set the allocation to delete and show modal
    setAllocationToDelete(record);
    deleteAllocationForm.resetFields();
    deleteAllocationForm.setFieldsValue({
      effective_date: dayjs(),
    });
    setIsDeleteAllocationModalVisible(true);
  }, [deleteAllocationForm]);

  // ─── Submit delete allocation (with effective date) ───
  const handleDeleteAllocationSubmit = useCallback(async () => {
    if (!allocationToDelete) return;

    try {
      setIsDeletingAllocation(true);
      const values = await deleteAllocationForm.validateFields();
      const effectiveDate = values.effective_date ? values.effective_date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');

      // Use update endpoint to set deallocated_date with effective_date
      // This effectively deallocates the resource on the selected date
      const updatePayload = {
        end_date: effectiveDate, // Maps to deallocated_date in backend
        effective_date: effectiveDate,
        is_active: false,
      };

      const response = await allocationsService.update(allocationToDelete.id, updatePayload);

      if (response && (response.success !== false || response.data)) {
        showSuccessToast('Allocation will be deallocated on the selected date');
        handleDeleteAllocationModalCancel();
        onSuccess?.();
      } else {
        showErrorToast(response?.message || 'Failed to delete allocation');
      }
    } catch (error) {
      logger.error('Failed to delete allocation:', error);
      if (error.errorFields) return; // Form validation errors
      showErrorToast(error?.response?.data?.message || error?.message || 'Failed to delete allocation');
    } finally {
      setIsDeletingAllocation(false);
    }
  }, [allocationToDelete, deleteAllocationForm, onSuccess]);

  // ─── Close delete allocation modal ───
  const handleDeleteAllocationModalCancel = useCallback(() => {
    setIsDeleteAllocationModalVisible(false);
    deleteAllocationForm.resetFields();
    setAllocationToDelete(null);
  }, [deleteAllocationForm]);

  // ─── Close modal ───
  const handleAllocationModalCancel = useCallback(() => {
    setIsAllocationModalVisible(false);
    allocationForm.resetFields();
    setSelectedAllocation(null);
    setIsEditAllocationMode(false);
  }, [allocationForm]);

  // ─── Submit allocation form ───
  const handleAllocationSubmit = useCallback(async () => {
    try {
      setIsSubmittingAllocation(true);
      const values = await allocationForm.validateFields();

      const payload = {
        resource_id: values.resource_id,
        project_id: values.project_id,
        allocation_percentage: values.allocation_percentage,
        billing_percentage: values.billing_percentage,
        billing_status_id: values.billing_status_id || undefined,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
        notes: values.notes || '',
      };

      let response;
      if (isEditAllocationMode && selectedAllocation) {
        const updatePayload = {
          allocation_percentage: values.allocation_percentage,
          billing_percentage: values.billing_percentage,
          billing_status_id: values.billing_status_id || undefined,
          start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
          end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
          is_active: values.is_active !== undefined ? values.is_active : true,
          notes: values.notes || '',
        };
        // Clean undefined values
        Object.keys(updatePayload).forEach((k) => {
          if (updatePayload[k] === undefined) delete updatePayload[k];
        });
        response = await allocationsService.update(selectedAllocation.id, updatePayload);
      } else {
        // Clean undefined values from create payload
        Object.keys(payload).forEach((k) => {
          if (payload[k] === undefined) delete payload[k];
        });
        response = await allocationsService.create(payload);
      }

      if (response && (response.success !== false || response.data)) {
        showSuccessToast(
          isEditAllocationMode ? 'Allocation updated successfully' : 'Allocation created successfully'
        );
        handleAllocationModalCancel();
        onSuccess?.();
      } else {
        showErrorToast(response?.message || `Failed to ${isEditAllocationMode ? 'update' : 'create'} allocation`);
      }
    } catch (error) {
      logger.error('Allocation submit error:', error);
      if (error.errorFields) return; // Form validation errors
      showErrorToast(error?.response?.data?.message || error?.message || 'Failed to save allocation');
    } finally {
      setIsSubmittingAllocation(false);
    }
  }, [isEditAllocationMode, selectedAllocation, allocationForm, handleAllocationModalCancel, onSuccess]);

  return {
    isAllocationModalVisible,
    isEditAllocationMode,
    selectedAllocation,
    allocationForm,
    isSubmittingAllocation,
    handleAddAllocation,
    handleEditAllocation,
    handleDeleteAllocation,
    handleAllocationModalCancel,
    handleAllocationSubmit,
    // Delete allocation modal
    isDeleteAllocationModalVisible,
    allocationToDelete,
    deleteAllocationForm,
    isDeletingAllocation,
    handleDeleteAllocationSubmit,
    handleDeleteAllocationModalCancel,
  };
};

export default useAllocationManagement;
