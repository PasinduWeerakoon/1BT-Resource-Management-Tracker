import React, { useEffect } from 'react';
import { Row, Col, Form, Input, InputNumber, Select, DatePicker, Button } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import CustomModal from '@components/Modal';
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
                billingStatus: allocation.billingStatus || 'Billing',
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
                                        name={[`allocations`, allocation.key, 'billingStatus']}
                                    >
                                        <Select
                                            placeholder="Select billing status"
                                            onChange={(value) => onFieldChange(allocation.key, 'billingStatus', value)}
                                        >
                                            <Option value="Billing">Billing</Option>
                                            <Option value="Non-Billing">Non-Billing</Option>
                                            <Option value="Bench">Bench</Option>
                                            <Option value="Training">Training</Option>
                                            <Option value="Presale">Presale</Option>
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
