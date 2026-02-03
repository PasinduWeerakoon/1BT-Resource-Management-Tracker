/**
 * Designations Tab Component
 */

import React, { useEffect, useMemo } from 'react';
import { Form, Input, Select, Switch } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useConfigCRUD } from '../hooks/useConfigCRUD';
import ConfigTable from '../components/ConfigTable';
import ConfigModal from '../components/ConfigModal';
import { designationsService } from '@api';
import { selectDesignations, selectDesignationsLoading, fetchDesignationsData } from '@redux/slices/configSlice';

const { Option } = Select;

const DesignationsTab = () => {
    const dispatch = useDispatch();
    // Get data from Redux
    const designationsData = useSelector(selectDesignations);
    const loadingDesignations = useSelector(selectDesignationsLoading);

    // Transform data for table display
    const designations = useMemo(() => {
        return designationsData.map((item, index) => ({
            key: item.id || `designation-${index}`,
            id: item.id,
            name: item.label || item.name, // Use label from API response as name
            level: item.level,
            tier: item.level ? `Tier ${String(item.level).padStart(2, '0')}` : null,
            is_active: item.isActive !== undefined ? item.isActive : (item.is_active !== undefined ? item.is_active : true),
            description: item.description || '',
            category: item.category || '',
            isDefault: item.isDefault !== undefined ? item.isDefault : (item.is_default !== undefined ? item.is_default : false),
            is_default: item.isDefault !== undefined ? item.isDefault : (item.is_default !== undefined ? item.is_default : false),
            isInternRole: item.isInternRole || false,
            displayOrder: item.displayOrder || 0,
        }));
    }, [designationsData]);

    useEffect(() => {
        // Fetch data if not already loaded
        if (!designationsData.length && !loadingDesignations) {
            dispatch(fetchDesignationsData({ force: false }));
        }
    }, [dispatch, designationsData.length, loadingDesignations]);

    // Refetch function for after CRUD operations
    const refetchDesignations = async () => {
        await dispatch(fetchDesignationsData({ force: true })).unwrap();
    };

    // CRUD operations
    const {
        form,
        isModalVisible,
        isEditMode,
        loading,
        handleAdd,
        handleEdit,
        handleCloseModal,
        handleSubmit,
        handleDelete,
    } = useConfigCRUD({
        service: designationsService,
        onFetch: refetchDesignations,
        transformPayload: (values) => {
            // Convert tier string (Tier 01) to level number (1)
            const level = values.tier ? Number.parseInt(values.tier.replace('Tier ', ''), 10) : 1;
            return {
                name: values.name,
                level: level,
                is_active: values.is_active !== undefined ? values.is_active : true,
            };
        },
        deleteConfig: {
            method: 'update',
            payload: { is_active: false },
        },
    });

    // Columns
    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            width: 150,
            fixed: 'left',
        },
        {
            title: 'Tier',
            dataIndex: 'tier',
            key: 'tier',
            width: 120,
        },
        {
            title: 'Level',
            dataIndex: 'level',
            key: 'level',
            width: 100,
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            width: 100,
            render: (isActive) => (
                <span style={{ color: isActive ? '#52c41a' : '#ff4d4f' }}>
                    {isActive ? 'Active' : 'Inactive'}
                </span>
            ),
        },
    ];

    // Tier options
    const tierOptions = [
        { value: 'Tier 01', label: 'Tier 01' },
        { value: 'Tier 02', label: 'Tier 02' },
        { value: 'Tier 03', label: 'Tier 03' },
        { value: 'Tier 04', label: 'Tier 04' },
    ];

    return (
        <>
            <ConfigTable
                columns={columns}
                dataSource={designations}
                loading={loadingDesignations}
                onEdit={handleEdit}
                onDelete={(record) => handleDelete(record, {
                    title: 'Delete Designation',
                    content: `Are you sure you want to delete "${record.name}"? This action cannot be undone.`,
                })}
                isEditDisabled={(record) => record.isDefault === true || record.is_default === true}
                isDeleteDisabled={(record) => record.isDefault === true || record.is_default === true}
                pagination={{ pageSize: 20 }}
                scroll={{ x: 600 }}
                title="Designations"
                addButtonText="Add Designation"
                onAdd={handleAdd}
            />

            <ConfigModal
                title={isEditMode ? 'Edit Designation' : 'Add New Designation'}
                open={isModalVisible}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                loading={loading}
                isEditMode={isEditMode}
                form={form}
            >
                <Form.Item
                    label="Name"
                    name="name"
                    rules={[
                        { required: true, message: 'Name is required' },
                        { max: 100, message: 'Name must be less than 100 characters' },
                    ]}
                >
                    <Input placeholder="Enter designation name" />
                </Form.Item>
                <Form.Item
                    label="Tier"
                    name="tier"
                    rules={[{ required: true, message: 'Tier is required' }]}
                >
                    <Select placeholder="Select tier">
                        {tierOptions.map((tier) => (
                            <Option key={tier.value} value={tier.value}>
                                {tier.label}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item
                    label="Active"
                    name="is_active"
                    valuePropName="checked"
                    initialValue={true}
                >
                    <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                </Form.Item>
            </ConfigModal>
        </>
    );
};

export default DesignationsTab;
