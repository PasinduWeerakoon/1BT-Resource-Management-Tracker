/**
 * useModal Hook
 * Manages modal visibility state
 * 
 * @param {boolean} initialVisible - Initial visibility state (default: false)
 * @returns {Object} Modal state and handlers
 * 
 * @example
 * const { visible, show, hide, toggle } = useModal();
 */
import { useState, useCallback } from 'react';

export const useModal = (initialVisible = false) => {
  const [visible, setVisible] = useState(initialVisible);

  const show = useCallback(() => {
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  const toggle = useCallback(() => {
    setVisible((prev) => !prev);
  }, []);

  return {
    visible,
    setVisible,
    show,
    hide,
    toggle,
  };
};

export default useModal;
