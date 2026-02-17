import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Row, Col, Form, Input, InputNumber, Select, DatePicker, Button, Tag, Tooltip, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined, ClockCircleOutlined, CheckCircleOutlined, HistoryOutlined } from '@ant-design/icons';
import CustomModal from '@components/Modal';
import { selectBillingStatuses } from '@redux/slices/configSlice';
import logger from '@utils/logger';
import dayjs from 'dayjs';

const { useWatch } = Form;

const { Option } = Select;

/**
 * Determine allocation status based on effective date
 * @param {dayjs} effectiveDate - The allocation's effective date
 * @returns {{status: string, color: string, icon: JSX.Element, tooltip: string}}
 */
const getAllocationScheduleStatus = (effectiveDate) => {
    if (!effectiveDate || !effectiveDate.isValid()) {
        return { status: 'Unknown', color: 'default', icon: null, tooltip: 'No date set' };
    }

    const today = dayjs().startOf('day');
    const effDate = effectiveDate.startOf('day');

    if (effDate.isAfter(today)) {
        const daysUntil = effDate.diff(today, 'day');
        return {
            status: 'Scheduled',
            color: 'blue',
            icon: <ClockCircleOutlined />,
            tooltip: `Will be activated in ${daysUntil} day${daysUntil > 1 ? 's' : ''} (${effDate.format('DD MMM YYYY')})`
        };
    } else if (effDate.isSame(today)) {
        return {
            status: 'Active Today',
            color: 'green',
            icon: <CheckCircleOutlined />,
            tooltip: 'Allocation effective from today'
        };
    } else {
        return {
            status: 'Active',
            color: 'green',
            icon: <CheckCircleOutlined />,
            tooltip: `Active since ${effDate.format('DD MMM YYYY')}`
        };
    }
};

/**
 * Component to handle billing percentage based on billing status
 * Automatically sets billing percentage to 0 and disables field when "Non-Billing" is selected
 */
const AllocationBillingController = ({ allocationKey, form, onFieldChange }) => {
    // Watch the billing status for this specific allocation
    const billingStatus = useWatch(['allocations', allocationKey, 'billingStatus'], form);
    
    // Effect to auto-set billing percentage to 0 when Non-Billing is selected
    useEffect(() => {
        if (billingStatus === 'Non-Billing') {
            const currentBillingPercentage = form.getFieldValue(['allocations', allocationKey, 'billingPercentage']);
            if (currentBillingPercentage !== 0) {
                form.setFieldValue(['allocations', allocationKey, 'billingPercentage'], 0);
                onFieldChange(allocationKey, 'billingPercentage', 0);
            }
        }
    }, [billingStatus, allocationKey, form, onFieldChange]);
    
    return null; // This is a controller component, no UI
};

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
    // Get billing statuses from Redux and filter for resource billing
    // ONLY allow "Billing" and "Non-Billing" for resource allocations
    const billingStatusesList = useSelector(selectBillingStatuses);
    const resourceBillingStatuses = useMemo(() => {
        const filtered = billingStatusesList.filter((status) => {
            const billingType = status?.billingType || [];
            const isResourceBilling = Array.isArray(billingType) && billingType.includes('resource');
            // Only show "Billing" and "Non-Billing" statuses
            const isAllowedStatus = status.name === 'Billing' || status.name === 'Non-Billing';
            return isResourceBilling && isAllowedStatus;
        });
        // Fallback: if no filtered results, show only Billing and Non-Billing from all statuses
        if (filtered.length === 0) {
            return billingStatusesList.filter(s => s.name === 'Billing' || s.name === 'Non-Billing');
        }
        return filtered;
    }, [billingStatusesList]);

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
                        logger.error('Error setting form values:', error);
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

                {/* Check if any allocations are scheduled for future */}
                {allocationsList.some(a => {
                    if (!a.allocatedDate || !a.allocatedDate.isValid()) return false;
                    return a.allocatedDate.startOf('day').isAfter(dayjs().startOf('day'));
                }) && (
                        <Alert
                            message="Scheduled Allocations"
                            description="One or more allocations have future effective dates. These will be automatically activated on their scheduled dates."
                            type="info"
                            showIcon
                            icon={<ClockCircleOutlined />}
                            style={{ marginBottom: 16 }}
                        />
                    )}

                <Form.Item noStyle shouldUpdate>
                    {() => (
                        <>
                            {allocationsList.map((allocation, index) => {
                                // Get schedule status for this allocation
                                const scheduleStatus = getAllocationScheduleStatus(allocation.allocatedDate);
                                
                                // Get current billing status for this allocation to determine if billing percentage should be disabled
                                const currentBillingStatus = form.getFieldValue(['allocations', allocation.key, 'billingStatus']);
                                const isBillingDisabled = currentBillingStatus === 'Non-Billing';

                                return (
                                    <div key={allocation.key} style={{ marginBottom: 24, padding: 16, border: '1px solid #f0f0f0', borderRadius: 4 }}>
                                        {/* Add controller to manage billing percentage based on billing status */}
                                        <AllocationBillingController 
                                            allocationKey={allocation.key} 
                                            form={form} 
                                            onFieldChange={onFieldChange}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <strong>Allocation {index + 1}</strong>
                                                {allocation.allocatedDate && (
                                                    <Tooltip title={scheduleStatus.tooltip}>
                                                        <Tag color={scheduleStatus.color} icon={scheduleStatus.icon}>
                                                            {scheduleStatus.status}
                                                        </Tag>
                                                    </Tooltip>
                                                )}
                                                {allocation.isFutureAllocation && (
                                                    <Tag color="blue" icon={<ClockCircleOutlined />}>Future</Tag>
                                                )}
                                            </div>
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
                                                    label={
                                                        <span>
                                                            Effective Date{' '}
                                                            <Tooltip title="When the allocation takes effect. Future dates will be scheduled for automatic activation.">
                                                                <ClockCircleOutlined style={{ color: '#1890ff', cursor: 'help' }} />
                                                            </Tooltip>
                                                        </span>
                                                    }
                                                    name={[`allocations`, allocation.key, 'allocatedDate']}
                                                    rules={[{ required: true, message: 'Effective date is required' }]}
                                                >
                                                    <DatePicker
                                                        style={{ width: '100%' }}
                                                        placeholder="Select effective date"
                                                        onChange={(date) => onFieldChange(allocation.key, 'allocatedDate', date)}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} sm={12} md={8}>
                                                <Form.Item
                                                    label="Deallocated Date"
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
                                                        {resourceBillingStatuses.map((status) => (
                                                            <Option key={status.id} value={status.name}>
                                                                {status.name}
                                                            </Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} sm={12} md={8}>
                                                <Form.Item
                                                    label={
                                                        <span>
                                                            Billing Percentage
                                                            {isBillingDisabled && (
                                                                <span style={{ marginLeft: 8, color: '#999', fontSize: '12px' }}>
                                                                    (Auto-set to 0% for Non-Billing)
                                                                </span>
                                                            )}
                                                        </span>
                                                    }
                                                    name={[`allocations`, allocation.key, 'billingPercentage']}
                                                    rules={[
                                                        { required: true, message: 'Billing percentage is required' },
                                                        { type: 'number', min: 0, max: 100, message: 'Must be between 0 and 100' },
                                                    ]}
                                                >
                                                    <InputNumber
                                                        style={{ width: '100%' }}
                                                        placeholder={isBillingDisabled ? 'Auto-set to 0%' : 'Enter billing percentage'}
                                                        min={0}
                                                        max={100}
                                                        onChange={(value) => onFieldChange(allocation.key, 'billingPercentage', value)}
                                                        formatter={value => `${value}%`}
                                                        parser={value => value.replace('%', '')}
                                                        disabled={isBillingDisabled}
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
                                );
                            })}
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
