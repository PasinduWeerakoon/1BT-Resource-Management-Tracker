/**
 * ConfigModal Component
 * Reusable modal component for configuration forms
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'antd';
import CustomModal from '@components/Modal';

/**
 * Configuration Modal Component
 * @param {Object} props
 * @param {string} props.title - Modal title
 * @param {boolean} props.open - Modal visibility
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onSubmit - Submit handler
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.isEditMode - Whether in edit mode
 * @param {Form} props.form - Form instance
 * @param {React.ReactNode} props.children - Form content
 * @param {number} props.width - Modal width
 */
const ConfigModal = ({
    title,
    open,
    onClose,
    onSubmit,
    loading,
    isEditMode,
    form,
    children,
    width = 600,
}) => {
    return (
        <CustomModal
            title={title || (isEditMode ? 'Edit Item' : 'Add New Item')}
            open={open}
            onClose={onClose}
            width={width}
            buttons={[
                {
                    text: 'Cancel',
                    type: 'default',
                    onClick: onClose,
                },
                {
                    text: isEditMode ? 'Update' : 'Add',
                    type: 'primary',
                    onClick: onSubmit,
                    loading,
                },
            ]}
        >
            <Form form={form} layout="vertical">
                {children}
            </Form>
        </CustomModal>
    );
};

export default ConfigModal;
