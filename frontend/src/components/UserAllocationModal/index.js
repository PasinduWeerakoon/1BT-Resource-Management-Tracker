import React, { useEffect, useState } from 'react';
import { Row, Col, Form, Input, InputNumber, Select, DatePicker, Button } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import CustomModal from '@components/Modal';
import { billingStatusesService } from '@api';
import dayjs from 'dayjs';

const { useWatch } = Form;

const { Option } = Select;

const UserAllocationModal = ({
    visible,
    selectedEmployee,
    allocationsList,
    form,
    onCancel,
    onAddRow,
    onRemoveRow,
    onFieldChange,
    onSubmit,
    projectOptions = [],
}) => {
    const [billingStatuses, setBillingStatuses] = useState([]);
    const [loadingStatuses, setLoadingStatuses] = useState(false);

    // Fetch billing statuses on component mount
    useEffect(() => {
        const fetchBillingStatuses = async () => {
            try {
                setLoadingStatuses(true);
                const response = await billingStatusesService.getAll();
                let statuses = [];
                
                if (response && response.data) {
                    if (Array.isArray(response.data)) {
                        statuses = response.data;
                    } else if (response.data.data && Array.isArray(response.data.data)) {
                        statuses = response.data.data;
                    }
                }
                
                // Sort by display_order
                statuses.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
                setBillingStatuses(statuses);
            } catch (error) {
                console.error('Failed to fetch billing statuses:', error);
                // Fallback to default statuses if API fails
                setBillingStatuses([
                    { id: 'default-billing', name: 'Billing', color: '#52c41a' },
                    { id: 'default-non-billing', name: 'Non-Billing', color: '#faad14' },
                    { id: 'default-bench', name: 'Bench', color: '#1890ff' },
                    { id: 'default-training', name: 'Training', color: '#722ed1' },
                    { id: 'default-presale', name: 'Presale', color: '#eb2f96' },
                ]);
            } finally {
                setLoadingStatuses(false);
            }
        };

        if (visible) {
            fetchBillingStatuses();
        }
    }, [visible]);

    // Build initial form values from allocations list
    const getInitialValues = () => {
        if (allocationsList.length === 0) {
            return { allocations: {} };
        }
        
        const formValues = {
            allocations: {}
        };
        
        allocationsList.forEach((allocation) => {
            formValues.allocations[allocation.key] = {
                projectName: allocation.projectName || undefined,
                allocatedDate: allocation.allocatedDate || undefined,
                deallocatedDate: allocation.deallocatedDate || undefined,
                billing_status_id: allocation.billing_status_id || allocation.billingStatusId || undefined,
                billingStatus: allocation.billingStatus || allocation.billing_status_name || 'Billing', // Keep for display
                billingPercentage: allocation.billingPercentage !== undefined ? allocation.billingPercentage : 0,
                projectAllocation: allocation.projectAllocation !== undefined ? allocation.projectAllocation : 0,
                duration: allocation.duration !== undefined ? allocation.duration : 0,
                status: allocation.status || 'Active',
            };
        });
        
        return formValues;
    };

    // Update form values when modal opens or allocations list changes
    useEffect(() => {
        if (visible) {
            if (allocationsList.length > 0) {
                const formValues = getInitialValues();
                
                // Set form values with proper timing
                const timer = setTimeout(() => {
                    try {
                        form.setFieldsValue(formValues);
                    } catch (error) {
                        console.error('Error setting form values:', error);
                    }
                }, 500);
                
                return () => clearTimeout(timer);
            } else {
                form.resetFields();
            }
        }
    }, [visible, allocationsList, form]);

    return (
        <CustomModal
            title={`${selectedEmployee ? selectedEmployee + "'s" : "User"} Project Allocations`}
            open={visible}
            onClose={onCancel}
            width={1200}
            buttons={[
                {
                    text: 'Cancel',
                    type: 'default',
                    onClick: onCancel,
                },
                {
                    text: 'Save',
                    type: 'primary',
                    onClick: onSubmit,
                },
            ]}
        >
            <Form 
                form={form} 
                layout="vertical"
                preserve={false}
            >
                <div style={{ marginBottom: 16 }}>
                    <strong>Employee:</strong> {selectedEmployee || ''} | 
                    <strong style={{ marginLeft: 16 }}>Total Allocations:</strong> {allocationsList.length}
                </div>

                <Form.Item noStyle shouldUpdate>
                    {() => (
                        <>
                            {allocationsList.map((allocation, index) => (
                                <div key={allocation.key} style={{ marginBottom: 24, padding: 16, border: '1px solid #f0f0f0', borderRadius: 4 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <strong>Allocation {index + 1}</strong>
                                        {!allocation.isExisting && (
                                            <Button
                                                type="link"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => onRemoveRow(allocation.key)}
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                    <Row gutter={16}>
                            <Col xs={24} sm={12} md={8}>
                                <Form.Item
                                    label="Project Name"
                                    name={[`allocations`, allocation.key, 'projectName']}
                                    rules={[{ required: true, message: 'Project name is required' }]}
                                >
                                    <Select
                                        placeholder="Select project"
                                        showSearch
                                        onChange={(value) => onFieldChange(allocation.key, 'projectName', value)}
                                        disabled={allocation.isExisting}
                                        filterOption={(input, option) =>
                                            (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                    >
                                        {projectOptions.length > 0 ? (
                                            projectOptions.map(project => (
                                                <Option key={project} value={project}>{project}</Option>
                                            ))
                                        ) : (
                                            <>
                                                <Option value="Bench">Bench</Option>
                                                <Option value="DXC">DXC</Option>
                                                <Option value="Healthfinder">Healthfinder</Option>
                                                <Option value="Ideapoint">Ideapoint</Option>
                                                <Option value="MillionSpaces">MillionSpaces</Option>
                                                <Option value="Presale">Presale</Option>
                                            </>
                                        )}
                                    </Select>
                                </Form.Item>
                            </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        label="Project Allocated Date"
                                        name={[`allocations`, allocation.key, 'allocatedDate']}
                                        rules={[{ required: true, message: 'Allocated date is required' }]}
                                    >
                                        <DatePicker 
                                            style={{ width: '100%' }} 
                                            placeholder="Select allocated date"
                                            onChange={(date) => onFieldChange(allocation.key, 'allocatedDate', date)}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        label="Project Deallocated Date"
                                        name={[`allocations`, allocation.key, 'deallocatedDate']}
                                    >
                                        <DatePicker 
                                            style={{ width: '100%' }} 
                                            placeholder="Select deallocated date"
                                            onChange={(date) => onFieldChange(allocation.key, 'deallocatedDate', date)}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        label="Billing Status"
                                        name={[`allocations`, allocation.key, 'billing_status_id']}
                                        rules={[{ required: true, message: 'Billing status is required' }]}
                                    >
                                        <Select
                                            placeholder="Select billing status"
                                            loading={loadingStatuses}
                                            onChange={(value) => {
                                                onFieldChange(allocation.key, 'billing_status_id', value);
                                                // Also update billingStatus for display
                                                const selectedStatus = billingStatuses.find(s => s.id === value);
                                                if (selectedStatus) {
                                                    onFieldChange(allocation.key, 'billingStatus', selectedStatus.name);
                                                }
                                            }}
                                        >
                                            {billingStatuses.map((status) => (
                                                <Option key={status.id} value={status.id}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span
                                                            style={{
                                                                display: 'inline-block',
                                                                width: 12,
                                                                height: 12,
                                                                borderRadius: '50%',
                                                                backgroundColor: status.color || '#1890ff',
                                                            }}
                                                        />
                                                        {status.name}
                                                    </span>
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        label="Billing Percentage"
                                        name={[`allocations`, allocation.key, 'billingPercentage']}
                                        rules={[
                                            { required: true, message: 'Billing percentage is required' },
                                            { type: 'number', min: 0, max: 100, message: 'Must be between 0 and 100' },
                                        ]}
                                    >
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            placeholder="Enter billing percentage"
                                            min={0}
                                            max={100}
                                            onChange={(value) => onFieldChange(allocation.key, 'billingPercentage', value)}
                                            formatter={value => `${value}%`}
                                            parser={value => value.replace('%', '')}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        label="Project Allocation"
                                        name={[`allocations`, allocation.key, 'projectAllocation']}
                                        rules={[
                                            { required: true, message: 'Project allocation is required' },
                                            { type: 'number', min: 0, max: 100, message: 'Must be between 0 and 100' },
                                        ]}
                                    >
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            placeholder="Enter project allocation"
                                            min={0}
                                            max={100}
                                            onChange={(value) => onFieldChange(allocation.key, 'projectAllocation', value)}
                                            formatter={value => `${value}%`}
                                            parser={value => value.replace('%', '')}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        label="Duration (Days)"
                                        name={[`allocations`, allocation.key, 'duration']}
                                        rules={[
                                            { required: true, message: 'Duration is required' },
                                            { type: 'number', min: 0, message: 'Must be a positive number' },
                                        ]}
                                    >
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            placeholder="Enter duration in days"
                                            min={0}
                                            onChange={(value) => onFieldChange(allocation.key, 'duration', value)}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        label="Status"
                                        name={[`allocations`, allocation.key, 'status']}
                                    >
                                        <Select
                                            placeholder="Select status"
                                            onChange={(value) => onFieldChange(allocation.key, 'status', value)}
                                        >
                                            <Option value="Active">Active</Option>
                                            <Option value="Inactive">Inactive</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                    </Row>
                                </div>
                            ))}
                        </>
                    )}
                </Form.Item>

                <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={onAddRow}
                    block
                    style={{ marginTop: 16 }}
                >
                    Add New Allocation
                </Button>
            </Form>
        </CustomModal>
    );
};

export default UserAllocationModal;
