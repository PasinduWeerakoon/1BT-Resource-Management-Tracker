/**
 * useConfigCRUD Hook
 * Handles CRUD operations for configuration items
 */

import { useState, useCallback } from 'react';
import { Form, Modal, message } from 'antd';
import { showErrorToast, showSuccessToast } from '@utils/toast.utils';
import logger from '@utils/logger';

/**
 * Custom hook for configuration CRUD operations
 * @param {Object} options - Configuration options
 * @param {Function} options.service - Service object with getAll, create, update, delete methods
 * @param {Function} options.onFetch - Callback after successful fetch
 * @param {Function} options.transformPayload - Transform payload before API call
 * @param {Function} options.transformResponse - Transform response data
 * @param {Object} options.deleteConfig - Delete configuration (if different from standard)
 * @returns {Object} CRUD handlers and state
 */
export const useConfigCRUD = (options = {}) => {
  const {
    service,
    onFetch,
    transformPayload = (values) => values,
    transformResponse = (data) => data,
    deleteConfig = null, // Custom delete config: { method: 'update', payload: { is_active: false } }
  } = options;

  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);

  // Open modal for adding new item
  const handleAdd = useCallback(() => {
    setIsEditMode(false);
    setSelectedItem(null);
    form.resetFields();
    setIsModalVisible(true);
  }, [form]);

  // Open modal for editing item
  const handleEdit = useCallback((record) => {
    setIsEditMode(true);
    setSelectedItem(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  }, [form]);

  // Close modal and reset state
  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    form.resetFields();
    setSelectedItem(null);
    setIsEditMode(false);
  }, [form]);

  // Handle form submission (create or update)
  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const payload = transformPayload(values, selectedItem);

      let response;
      if (isEditMode) {
        response = await service.update(selectedItem.id, payload);
      } else {
        response = await service.create(payload);
      }

      if (response && (response.success !== false || response.data)) {
        const messageText = isEditMode ? 'updated successfully' : 'created successfully';
        showSuccessToast(`${messageText.charAt(0).toUpperCase() + messageText.slice(1)}`);
        
        if (onFetch) {
          await onFetch();
        }
        
        handleCloseModal();
      } else {
        showErrorToast(response?.message || `Failed to ${isEditMode ? 'update' : 'create'} item`);
      }
    } catch (error) {
      logger.error('Submit error:', error);
      showErrorToast(error?.message || `Failed to ${isEditMode ? 'update' : 'create'} item`);
    } finally {
      setLoading(false);
    }
  }, [form, isEditMode, selectedItem, service, transformPayload, onFetch, handleCloseModal]);

  // Handle delete
  const handleDelete = useCallback((record, options = {}) => {
    const {
      title = 'Delete Item',
      content = `Are you sure you want to delete "${record.name || record.id}"? This action cannot be undone.`,
      onSuccess,
      preventDelete = null, // Function that returns true if delete should be prevented
    } = options;

    // Check if delete should be prevented
    if (preventDelete && preventDelete(record)) {
      return;
    }

    const modal = Modal.confirm({
      title,
      content,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      okButtonProps: {
        loading: false,
      },
      onOk: async () => {
        try {
          modal.update({
            okButtonProps: {
              loading: true,
              disabled: true,
            },
            cancelButtonProps: {
              disabled: true,
            },
          });

          let response;
          if (deleteConfig && deleteConfig.method === 'update') {
            // Use update to deactivate instead of delete
            response = await service.update(record.id, {
              ...record,
              ...deleteConfig.payload,
            });
          } else {
            // Standard delete
            response = await service.delete(record.id);
          }

          if (response && (response.success !== false || response.message || response.data)) {
            const messageText = deleteConfig ? 'deactivated successfully' : 'deleted successfully';
            showSuccessToast(`Item ${messageText}`);
            
            if (onFetch) {
              await onFetch();
            }
            
            if (onSuccess) {
              onSuccess();
            }
            
            modal.destroy();
          } else {
            showErrorToast(response?.message || 'Failed to delete item');
            modal.update({
              okButtonProps: {
                loading: false,
                disabled: false,
              },
              cancelButtonProps: {
                disabled: false,
              },
            });
          }
        } catch (error) {
          logger.error('Failed to delete item:', error);
          showErrorToast(error?.message || 'Failed to delete item');
          modal.update({
            okButtonProps: {
              loading: false,
              disabled: false,
            },
            cancelButtonProps: {
              disabled: false,
            },
          });
        }
      },
    });
  }, [service, deleteConfig, onFetch]);

  return {
    form,
    isModalVisible,
    isEditMode,
    selectedItem,
    loading,
    handleAdd,
    handleEdit,
    handleCloseModal,
    handleSubmit,
    handleDelete,
    setIsModalVisible,
  };
};

export default useConfigCRUD;
