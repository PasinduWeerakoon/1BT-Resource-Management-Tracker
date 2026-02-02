/**
 * ConfirmModal Component
 * Reusable confirmation modal
 */

import React from 'react';
import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';

/**
 * ConfirmModal Component
 * @param {Object} props
 * @param {boolean} props.visible - Whether modal is visible
 * @param {string} props.title - Modal title
 * @param {string} props.content - Modal content/message
 * @param {Function} props.onConfirm - Confirm handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {string} props.okText - OK button text (default: 'OK')
 * @param {string} props.cancelText - Cancel button text (default: 'Cancel')
 * @param {string} props.okType - OK button type (default: 'primary')
 * @param {boolean} props.danger - Whether to show danger style (default: false)
 * @param {boolean} props.loading - Whether OK button is loading
 */
const ConfirmModal = ({
  visible,
  title = 'Confirm',
  content,
  onConfirm,
  onCancel,
  okText = 'OK',
  cancelText = 'Cancel',
  okType = 'primary',
  danger = false,
  loading = false,
}) => {
  return (
    <Modal
      title={
        <span>
          <ExclamationCircleOutlined style={{ color: danger ? '#ff4d4f' : '#1890ff', marginRight: 8 }} />
          {title}
        </span>
      }
      open={visible}
      onOk={onConfirm}
      onCancel={onCancel}
      okText={okText}
      cancelText={cancelText}
      okType={okType}
      okButtonProps={{ danger, loading }}
      cancelButtonProps={{ disabled: loading }}
    >
      <p>{content}</p>
    </Modal>
  );
};

ConfirmModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  title: PropTypes.string,
  content: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  okText: PropTypes.string,
  cancelText: PropTypes.string,
  okType: PropTypes.string,
  danger: PropTypes.bool,
  loading: PropTypes.bool,
};

export default ConfirmModal;
