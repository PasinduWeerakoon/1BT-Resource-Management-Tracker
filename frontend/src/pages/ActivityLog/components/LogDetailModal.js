/**
 * LogDetailModal Component
 * Modal for displaying audit log details
 */

import React from 'react';
import { Modal, Button, Descriptions, Tag, Input, Space } from 'antd';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';

const { TextArea } = Input;

/**
 * Get action badge component
 * @param {string} action - Action type
 * @returns {JSX.Element} Badge component
 */
const getActionBadge = (action) => {
  const actionMap = {
    CREATE: { status: 'success', text: 'CREATE' },
    UPDATE: { status: 'processing', text: 'UPDATE' },
    DELETE: { status: 'error', text: 'DELETE' },
    READ: { status: 'default', text: 'READ' },
  };

  const config = actionMap[action] || { status: 'default', text: action || 'UNKNOWN' };
  return <Badge status={config.status} text={config.text} />;
};

/**
 * LogDetailModal Component
 * @param {Object} props
 * @param {boolean} props.visible - Whether modal is visible
 * @param {Object} props.selectedLog - Selected log data
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onClose - Close handler
 */
const LogDetailModal = ({
  visible,
  selectedLog,
  loading,
  onClose,
}) => {
  return (
    <Modal
      title="Audit Log Details"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
      width={800}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      ) : selectedLog ? (
        <Descriptions column={1} bordered>
          <Descriptions.Item label="ID">{selectedLog.id}</Descriptions.Item>
          <Descriptions.Item label="Timestamp">
            {selectedLog.timestamp
              ? dayjs(selectedLog.timestamp).format('DD MMM YYYY HH:mm:ss')
              : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Action">
            {getActionBadge(selectedLog.action)}
          </Descriptions.Item>
          <Descriptions.Item label="Entity Type">
            <Tag>{selectedLog.entityType || 'N/A'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Entity ID">{selectedLog.entityId || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="User ID">{selectedLog.userId || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="User Email">{selectedLog.userEmail || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="IP Address">{selectedLog.ipAddress || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="User Agent">
            <TextArea
              value={selectedLog.userAgent || 'N/A'}
              autoSize
              readOnly
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
          </Descriptions.Item>
          <Descriptions.Item label="Service Name">{selectedLog.serviceName || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="API Endpoint">{selectedLog.apiEndpoint || 'N/A'}</Descriptions.Item>
          {selectedLog.changedFields && selectedLog.changedFields.length > 0 && (
            <Descriptions.Item label="Changed Fields">
              <Space wrap>
                {selectedLog.changedFields.map((field) => (
                  <Tag key={field}>{field}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
          )}
          {selectedLog.oldValues && Object.keys(selectedLog.oldValues).length > 0 && (
            <Descriptions.Item label="Old Values">
              <TextArea
                value={JSON.stringify(selectedLog.oldValues, null, 2)}
                autoSize={{ minRows: 3, maxRows: 10 }}
                readOnly
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
              />
            </Descriptions.Item>
          )}
          {selectedLog.newValues && Object.keys(selectedLog.newValues).length > 0 && (
            <Descriptions.Item label="New Values">
              <TextArea
                value={JSON.stringify(selectedLog.newValues, null, 2)}
                autoSize={{ minRows: 3, maxRows: 10 }}
                readOnly
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
              />
            </Descriptions.Item>
          )}
          {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
            <Descriptions.Item label="Metadata">
              <TextArea
                value={JSON.stringify(selectedLog.metadata, null, 2)}
                autoSize={{ minRows: 2, maxRows: 6 }}
                readOnly
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
              />
            </Descriptions.Item>
          )}
        </Descriptions>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px' }}>No data available</div>
      )}
    </Modal>
  );
};

LogDetailModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  selectedLog: PropTypes.object,
  loading: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
};

export default LogDetailModal;
