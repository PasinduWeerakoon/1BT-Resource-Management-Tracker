/**
 * useFormSubmission Hook
 * Manages form submission with validation and error handling
 * 
 * @param {Object} form - Ant Design form instance
 * @param {Function} onSubmit - Submit handler function
 * @param {Object} options - Additional options
 * @param {Function} options.onSuccess - Callback on successful submission
 * @param {Function} options.onError - Callback on error
 * @param {Function} options.onValidationError - Callback on validation error
 * @param {boolean} options.resetOnSuccess - Whether to reset form on success (default: true)
 * @returns {Object} Form submission state and handlers
 * 
 * @example
 * const { handleSubmit, isSubmitting } = useFormSubmission(
 *   form,
 *   async (values) => await resourcesService.create(values),
 *   {
 *     onSuccess: () => showSuccessToast('Resource created successfully'),
 *     onError: (error) => showErrorToast(error.message)
 *   }
 * );
 */
import { useState, useCallback } from 'react';

export const useFormSubmission = (form, onSubmit, options = {}) => {
  const {
    onSuccess,
    onError,
    onValidationError,
    resetOnSuccess = true,
  } = options;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async (e) => {
    if (e) {
      e.preventDefault();
    }

    try {
      // Validate form
      const values = await form.validateFields();
      
      setIsSubmitting(true);

      // Call submit handler
      const result = await onSubmit(values);

      // Reset form if option is enabled
      if (resetOnSuccess) {
        form.resetFields();
      }

      // Call success callback
      if (onSuccess) {
        onSuccess(result, values);
      }

      return result;
    } catch (error) {
      // Handle validation errors
      if (error.errorFields) {
        if (onValidationError) {
          onValidationError(error);
        }
      } else {
        // Handle submission errors
        if (onError) {
          onError(error);
        }
      }
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [form, onSubmit, onSuccess, onError, onValidationError, resetOnSuccess]);

  return {
    handleSubmit,
    isSubmitting,
  };
};

export default useFormSubmission;
