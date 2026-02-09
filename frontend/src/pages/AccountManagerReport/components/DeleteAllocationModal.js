/**
 * DeleteAllocationModal Component
 * Modal for confirming allocation deletion with effective date selection
 */

import React from 'react';
import { Form, DatePicker, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import CustomModal from '@components/Modal';
import dayjs from 'dayjs';

const DeleteAllocationModal = ({
  visible,
  onCancel,
  onSubmit,
  form,
  isSubmitting,
  allocationRecord,
}) => {
  return (
    <CustomModal
      title="Delete Allocation"
      open={visible}
      onClose={onCancel}
      width={500}
      buttons={[
        { text: 'Cancel', type: 'default', onClick: onCancel },
        { text: 'Delete', type: 'primary', danger: true, onClick: onSubmit, loading: isSubmitting },
      ]}
    >
      <Form form={form} layout="vertical">
        <div style={{ marginBottom: 16 }}>
          <p>
            Are you sure you want to delete the allocation for <strong>{allocationRecord?.employeeName}</strong>?
          </p>
          <p style={{ color: '#8c8c8c', fontSize: '12px' }}>
            This will remove the allocation from <strong>{allocationRecord?.project}</strong>.
            The action will take effect on the selected date.
          </p>
        </div>
        <Form.Item
          label={
            <span>
              Effective Date{' '}
              <Tooltip title="When the deletion should take effect. Future dates will schedule the deletion.">
                <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'help' }} />
              </Tooltip>
            </span>
          }
          name="effective_date"
          rules={[{ required: true, message: 'Effective date is required' }]}
          initialValue={dayjs()}
        >
          <DatePicker 
            style={{ width: '100%' }} 
            placeholder="Select effective date" 
            format="YYYY-MM-DD"
          />
        </Form.Item>
      </Form>
    </CustomModal>
  );
};

export default React.memo(DeleteAllocationModal);
