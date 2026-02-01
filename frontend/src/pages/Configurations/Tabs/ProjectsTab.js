/**
 * Projects Tab Component
 * Most complex tab with pagination, filters, and complex form
 */

import React, { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, InputNumber, Row, Col, Badge } from 'antd';
import { useConfigCRUD } from '../hooks/useConfigCRUD';
import ConfigTable from '../components/ConfigTable';
import ConfigModal from '../components/ConfigModal';
import { projectsService, clientsService, accountManagersService, projectTypesService, accountTypesService, projectStatusesService, billingStatusesService } from '@api';
import { showErrorToast, showSuccessToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import dayjs from 'dayjs';
import { PAGINATION } from '@constants/app';

const { Option } = Select;

const ProjectsTab = () => {
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
        total: 0,
    });
    const [projects, setProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [clients, setClients] = useState([]);
    const [accountManagersList, setAccountManagersList] = useState([]);
    const [projectTypesForModal, setProjectTypesForModal] = useState([]);
    const [accountTypesForModal, setAccountTypesForModal] = useState([]);
    const [projectStatusesForModal, setProjectStatusesForModal] = useState([]);
    const [billingStatusesForModal, setBillingStatusesForModal] = useState([]);
    const [loadingConfigForModal, setLoadingConfigForModal] = useState(false);
    const [loadingAccountManagers, setLoadingAccountManagers] = useState(false);
    const [accountType, setAccountType] = useState('External');

    // Fetch all configuration data for Projects modal
    useEffect(() => {
        const fetchConfigurationsForModal = async () => {
            try {
                setLoadingConfigForModal(true);
                const [projectTypesRes, accountTypesRes, projectStatusesRes, billingStatusesRes] = await Promise.all([
                    projectTypesService.getAll(),
                    accountTypesService.getAll(),
                    projectStatusesService.getAll(),
                    billingStatusesService.getAll(),
                ]);

                const extractData = (response) => {
                    if (Array.isArray(response?.data)) return response.data;
                    if (Array.isArray(response?.data?.data)) return response.data.data;
                    if (Array.isArray(response)) return response;
                    return [];
                };

                setProjectTypesForModal(extractData(projectTypesRes));
                setAccountTypesForModal(extractData(accountTypesRes));
                setProjectStatusesForModal(extractData(projectStatusesRes));
                setBillingStatusesForModal(extractData(billingStatusesRes));
            } catch (error) {
                logger.error('Failed to fetch configurations for Projects modal:', error);
                showErrorToast('Failed to load configuration data');
            } finally {
                setLoadingConfigForModal(false);
            }
        };

        fetchConfigurationsForModal();
    }, []);

    // Fetch clients for dropdown
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const response = await clientsService.getAll({ limit: 1000 });
                let clientsData = [];

                if (response) {
                    if (Array.isArray(response.data)) {
                        clientsData = response.data;
                    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
                        clientsData = response.data.data;
                    } else if (response.data && Array.isArray(response.data)) {
                        clientsData = response.data;
                    }
                }

                setClients(clientsData.map(client => ({
                    id: client.id,
                    name: client.client_name || client.name,
                })));
            } catch (error) {
                logger.error('Failed to fetch clients:', error);
            }
        };

        fetchClients();
    }, []);

    // Fetch account managers
    useEffect(() => {
        const fetchAccountManagers = async () => {
            try {
                setLoadingAccountManagers(true);
                const response = await accountManagersService.getAll();
                let accountManagersData = [];

                if (response) {
                    if (Array.isArray(response.data)) {
                        accountManagersData = response.data;
                    } else if (response.data && Array.isArray(response.data)) {
                        accountManagersData = response.data;
                    } else if (Array.isArray(response)) {
                        accountManagersData = response;
                    }
                }

                const accountManagers = accountManagersData
                    .filter(am => am.id && am.name)
                    .map(am => ({
                        id: am.id,
                        name: am.name,
                    }));

                setAccountManagersList(accountManagers);
            } catch (error) {
                logger.error('Failed to fetch account managers:', error);
                showErrorToast('Failed to load account managers');
            } finally {
                setLoadingAccountManagers(false);
            }
        };

        fetchAccountManagers();
    }, []);

    // Fetch projects
    const fetchProjects = async (page = 1, limit = PAGINATION.DEFAULT_PAGE_SIZE) => {
        try {
            setLoadingProjects(true);
            const response = await projectsService.getAll({ page, limit });

            let projectsData = [];
            let paginationData = {};

            if (response) {
                if (Array.isArray(response.data)) {
                    projectsData = response.data;
                    paginationData = response.pagination || {};
                } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
                    projectsData = response.data.data;
                    paginationData = response.data.pagination || {};
                } else if (response.pagination && response.data && Array.isArray(response.data)) {
                    projectsData = response.data;
                    paginationData = response.pagination;
                } else if (Array.isArray(response)) {
                    projectsData = response;
                    paginationData = {};
                }
            }

            paginationData = {
                total: paginationData.total || 0,
                page: paginationData.page || page,
                limit: paginationData.limit || limit,
                totalPages: paginationData.totalPages || 0,
            };

            const transformed = projectsData.map((project) => ({
                key: project.id,
                id: project.id,
                project_name: project.project_name,
                project_code: project.project_code,
                client_id: project.client_id,
                client_name: project.client_name,
                project_type: project.project_type,
                is_billable: project.is_billable,
                status: project.status,
                start_date: project.start_date,
                end_date: project.end_date,
                description: project.description,
            }));

            setProjects(transformed);
            setPagination({
                current: paginationData.page || page,
                pageSize: paginationData.limit || limit,
                total: paginationData.total || 0,
            });
        } catch (error) {
            logger.error('Failed to fetch projects:', error);
            showErrorToast('Failed to load projects');
        } finally {
            setLoadingProjects(false);
        }
    };

    useEffect(() => {
        fetchProjects(1, PAGINATION.DEFAULT_PAGE_SIZE);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // CRUD operations with custom submit handler
    const {
        form,
        isModalVisible,
        isEditMode,
        selectedItem,
        loading,
        handleAdd,
        handleEdit,
        handleCloseModal,
        handleDelete,
    } = useConfigCRUD({
        service: projectsService,
        onFetch: () => fetchProjects(pagination.current, pagination.pageSize),
    });

    // Custom submit handler for projects
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            if (!values.project_name) {
                showErrorToast('Project name is required');
                return;
            }

            if (!values.account_manager) {
                showErrorToast('Account manager is required');
                return;
            }

            let client_id = null;
            const accountTypeObj = accountTypesForModal.find(at => at.id === values.account_type);
            if (accountTypeObj?.name === 'External') {
                if (values.client_id) {
                    client_id = values.client_id;
                } else {
                    showErrorToast('Client is required for External projects');
                    return;
                }
            }

            const projectTypeObj = projectTypesForModal.find(pt => pt.id === values.project_type);
            const project_type = projectTypeObj?.name || 'Client';

            const statusObj = projectStatusesForModal.find(ps => ps.id === values.status);
            const status = statusObj?.name || 'Active';

            if (isEditMode) {
                const updatePayload = {
                    project_name: values.project_name,
                    client_id: client_id,
                    status: status,
                    description: values.description || '',
                };

                const response = await projectsService.update(selectedItem.id, updatePayload);
                if (response && (response.success !== false || response.data)) {
                    showSuccessToast('Project updated successfully');
                    await fetchProjects(pagination.current, pagination.pageSize);
                    handleCloseModal();
                } else {
                    showErrorToast(response?.message || 'Failed to update project');
                }
            } else {
                const billingTypeObj = billingStatusesForModal.find(bs => bs.id === values.billing_type);
                const billing_type = billingTypeObj?.name || 'Billing';

                const projectPayload = {
                    project_name: values.project_name,
                    project_code: values.project_code || '',
                    client_id: client_id,
                    project_type: project_type,
                    account_type: accountTypeObj?.name || 'External',
                    account_manager: values.account_manager,
                    account_reg_sales_owner: values.account_reg_sales_owner || '',
                    team_size: values.team_size || 1,
                    billing_type: billing_type,
                    budget: values.budget || 0,
                    status: status,
                    start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
                    end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
                    description: values.description || '',
                };

                const cleanedPayload = { ...projectPayload };
                if (!cleanedPayload.project_code || cleanedPayload.project_code === '') {
                    delete cleanedPayload.project_code;
                }
                if (!cleanedPayload.account_reg_sales_owner || cleanedPayload.account_reg_sales_owner === '') {
                    delete cleanedPayload.account_reg_sales_owner;
                }
                if (!cleanedPayload.description || cleanedPayload.description === '') {
                    delete cleanedPayload.description;
                }
                if (!cleanedPayload.start_date) {
                    delete cleanedPayload.start_date;
                }
                if (!cleanedPayload.end_date) {
                    delete cleanedPayload.end_date;
                }
                if (cleanedPayload.account_type === 'Internal') {
                    delete cleanedPayload.client_id;
                }

                const response = await projectsService.create(cleanedPayload);
                if (response && (response.success !== false || response.data)) {
                    showSuccessToast('Project created successfully');
                    await fetchProjects(pagination.current, pagination.pageSize);
                    handleCloseModal();
                } else {
                    showErrorToast(response?.message || 'Failed to create project');
                }
            }
        } catch (error) {
            logger.error('Project submit error:', error);
            showErrorToast(error?.message || 'Failed to save project');
        }
    };

    // Custom add handler
    const handleAddProject = () => {
        setAccountType('External');
        form.resetFields();
        form.setFieldsValue({
            account_type: accountTypesForModal.find(at => at.name === 'External')?.id,
            status: projectStatusesForModal.find(ps => ps.name === 'Active')?.id,
            billing_type: billingStatusesForModal.find(bs => bs.name === 'Billing')?.id,
            team_size: 1,
        });
        handleAdd();
    };

    // Custom edit handler
    const handleEditProject = (record) => {
        const accountTypeObj = accountTypesForModal.find(at => at.name === (record.account_type || 'External'));
        setAccountType(accountTypeObj?.name || 'External');

        form.setFieldsValue({
            project_name: record.project_name,
            project_code: record.project_code,
            client_id: record.client_id,
            project_type: projectTypesForModal.find(pt => pt.name === record.project_type)?.id,
            is_billable: record.is_billable !== undefined ? record.is_billable : true,
            status: projectStatusesForModal.find(ps => ps.name === record.status)?.id,
            start_date: record.start_date ? dayjs(record.start_date) : null,
            end_date: record.end_date ? dayjs(record.end_date) : null,
            description: record.description,
        });
        handleEdit(record);
    };

    // Columns
    const columns = [
        {
            title: 'Project Name',
            dataIndex: 'project_name',
            key: 'project_name',
            width: 200,
            fixed: 'left',
        },
        {
            title: 'Project Code',
            dataIndex: 'project_code',
            key: 'project_code',
            width: 150,
        },
        {
            title: 'Client',
            dataIndex: 'client_name',
            key: 'client_name',
            width: 200,
        },
        {
            title: 'Type',
            dataIndex: 'project_type',
            key: 'project_type',
            width: 120,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => {
                const colorMap = {
                    'Active': 'green',
                    'On Hold': 'orange',
                    'Completed': 'blue',
                    'Cancelled': 'red',
                };
                return <Badge status={colorMap[status] || 'default'} text={status} />;
            },
        },
        {
            title: 'Billable',
            dataIndex: 'is_billable',
            key: 'is_billable',
            width: 100,
            render: (isBillable) => (isBillable ? 'Yes' : 'No'),
        },
        {
            title: 'Start Date',
            dataIndex: 'start_date',
            key: 'start_date',
            width: 120,
            render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
        },
        {
            title: 'End Date',
            dataIndex: 'end_date',
            key: 'end_date',
            width: 120,
            render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
        },
    ];

    return (
        <>
            <ConfigTable
                columns={columns}
                dataSource={projects}
                loading={loadingProjects}
                onEdit={handleEditProject}
                onDelete={(record) => handleDelete(record, {
                    title: 'Delete Project',
                    content: `Are you sure you want to delete "${record.project_name}"? This action cannot be undone.`,
                })}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} projects`,
                    onChange: (page, pageSize) => {
                        setPagination(prev => ({ ...prev, current: page, pageSize }));
                        fetchProjects(page, pageSize);
                    },
                    onShowSizeChange: (current, size) => {
                        setPagination(prev => ({ ...prev, current: 1, pageSize: size }));
                        fetchProjects(1, size);
                    },
                }}
                scroll={{ x: 1200 }}
                title="Project Types"
                addButtonText="Add New Project"
                onAdd={handleAddProject}
            />

            <ConfigModal
                title={isEditMode ? 'Edit Project' : 'Add New Project'}
                open={isModalVisible}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                loading={loading}
                isEditMode={isEditMode}
                form={form}
                width={800}
            >
                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="Project Name"
                            name="project_name"
                            rules={[{ required: true, message: 'Project name is required' }]}
                        >
                            <Input placeholder="Enter project name" />
                        </Form.Item>
                    </Col>
                    {!isEditMode && (
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Project Code"
                                name="project_code"
                            >
                                <Input placeholder="Enter project code (optional)" />
                            </Form.Item>
                        </Col>
                    )}
                </Row>

                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="Project Type"
                            name="project_type"
                            rules={[{ required: true, message: 'Project type is required' }]}
                        >
                            <Select placeholder="Select project type" loading={loadingConfigForModal}>
                                {projectTypesForModal.map((type) => (
                                    <Option key={type.id} value={type.id}>
                                        {type.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="Account Type"
                            name="account_type"
                            rules={[{ required: true, message: 'Account type is required' }]}
                        >
                            <Select
                                placeholder="Select account type"
                                onChange={(value) => {
                                    const selectedAccountType = accountTypesForModal.find(at => at.id === value);
                                    setAccountType(selectedAccountType?.name || 'External');
                                }}
                                loading={loadingConfigForModal}
                            >
                                {accountTypesForModal.map((type) => (
                                    <Option key={type.id} value={type.id}>
                                        {type.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="Client Name"
                            name="client_id"
                            rules={[
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        const accountTypeId = getFieldValue('account_type');
                                        const accountTypeObj = accountTypesForModal.find(at => at.id === accountTypeId);
                                        if (accountTypeObj?.name === 'External' && !value) {
                                            return Promise.reject(new Error('Client is required for External projects'));
                                        }
                                        return Promise.resolve();
                                    },
                                }),
                            ]}
                        >
                            <Select
                                placeholder="Select client"
                                showSearch
                                allowClear
                                disabled={accountType === 'Internal'}
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                            >
                                {clients.map((client) => (
                                    <Option key={client.id} value={client.id} label={client.name}>
                                        {client.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="Status"
                            name="status"
                            rules={[{ required: true, message: 'Status is required' }]}
                        >
                            <Select placeholder="Select status" loading={loadingConfigForModal}>
                                {projectStatusesForModal.map((status) => (
                                    <Option key={status.id} value={status.id}>
                                        {status.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="Account Manager"
                            name="account_manager"
                            rules={[{ required: true, message: 'Account manager is required' }]}
                        >
                            <Select
                                placeholder="Select account manager"
                                showSearch
                                allowClear
                                loading={loadingAccountManagers}
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                            >
                                {accountManagersList.map((am) => (
                                    <Option key={am.id} value={am.name} label={am.name}>
                                        {am.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    {!isEditMode && (
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Billing Type"
                                name="billing_type"
                                rules={[{ required: true, message: 'Billing type is required' }]}
                            >
                                <Select placeholder="Select billing type" loading={loadingConfigForModal}>
                                    {billingStatusesForModal.map((billing) => (
                                        <Option key={billing.id} value={billing.id}>
                                            {billing.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    )}
                </Row>

                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="Team Size"
                            name="team_size"
                            rules={[
                                { required: true, message: 'Team size is required' },
                                { type: 'number', min: 1, message: 'Team size must be at least 1' },
                            ]}
                        >
                            <InputNumber
                                style={{ width: '100%' }}
                                placeholder="Enter team size"
                                min={1}
                            />
                        </Form.Item>
                    </Col>
                    {!isEditMode && (
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Budget"
                                name="budget"
                                rules={[
                                    { type: 'number', min: 0, message: 'Budget must be 0 or greater' },
                                ]}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    placeholder="Enter budget (optional)"
                                    min={0}
                                    formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                />
                            </Form.Item>
                        </Col>
                    )}
                </Row>

                {!isEditMode && (
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Account Reg/Sales Owner"
                                name="account_reg_sales_owner"
                            >
                                <Input placeholder="Enter account reg/sales owner (optional)" />
                            </Form.Item>
                        </Col>
                    </Row>
                )}

                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="Start Date"
                            name="start_date"
                        >
                            <DatePicker style={{ width: '100%' }} placeholder="Select start date" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="End Date"
                            name="end_date"
                            dependencies={['start_date']}
                            rules={[
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        const startDate = getFieldValue('start_date');
                                        if (!value || !startDate || value >= startDate) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('End date must be greater than or equal to start date'));
                                    },
                                }),
                            ]}
                        >
                            <DatePicker style={{ width: '100%' }} placeholder="Select end date" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24}>
                        <Form.Item
                            label="Description"
                            name="description"
                        >
                            <Input.TextArea rows={3} placeholder="Enter project description (optional)" />
                        </Form.Item>
                    </Col>
                </Row>
            </ConfigModal>
        </>
    );
};

export default ProjectsTab;
