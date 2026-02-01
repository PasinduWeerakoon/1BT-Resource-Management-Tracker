/**
 * useModal Hook
 * Manages modal visibility state, edit mode, and selected item
 * 
 * @param {Object} options - Additional options
 * @param {boolean} options.initialVisible - Initial visibility state (default: false)
 * @param {Function} options.onOpen - Callback when modal opens
 * @param {Function} options.onClose - Callback when modal closes
 * @returns {Object} Modal state and handlers
 * 
 * @example
 * const { isVisible, openModal, closeModal, toggleModal, isEditMode, setIsEditMode, selectedItem, setSelectedItem } = useModal({
 *   onOpen: () => console.log('Modal opened'),
 *   onClose: () => form.resetFields()
 * });
 */
import { useState, useCallback } from 'react';

export const useModal = (options = {}) => {
  const {
    initialVisible = false,
    onOpen,
    onClose,
  } = options;

  const [isVisible, setIsVisible] = useState(initialVisible);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Open modal
  const openModal = useCallback((item = null, editMode = false) => {
    setSelectedItem(item);
    setIsEditMode(editMode);
    setIsVisible(true);
    
    if (onOpen) {
      onOpen(item, editMode);
    }
  }, [onOpen]);

  // Close modal
  const closeModal = useCallback(() => {
    setIsVisible(false);
    setIsEditMode(false);
    setSelectedItem(null);
    
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  // Toggle modal
  const toggleModal = useCallback(() => {
    if (isVisible) {
      closeModal();
    } else {
      openModal();
    }
  }, [isVisible, openModal, closeModal]);

  // Open modal in create mode
  const openCreateModal = useCallback(() => {
    openModal(null, false);
  }, [openModal]);

  // Open modal in edit mode
  const openEditModal = useCallback((item) => {
    openModal(item, true);
  }, [openModal]);

  return {
    isVisible,
    setIsVisible,
    openModal,
    closeModal,
    toggleModal,
    openCreateModal,
    openEditModal,
    isEditMode,
    setIsEditMode,
    selectedItem,
    setSelectedItem,
  };
};

export default useModal;
