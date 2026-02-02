/**
 * Projects Tab Component
 * Most complex tab with pagination, filters, and complex form
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useConfigCRUD } from '../hooks/useConfigCRUD';
import ConfigTable from '../components/ConfigTable';
import ConfigModal from '../components/ConfigModal';
import ProjectForm from './ProjectsTab/components/ProjectForm';
import { projectsService, projectTypesService, accountTypesService, projectStatusesService, billingStatusesService } from '@api';
import { showErrorToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import dayjs from 'dayjs';
import { PAGINATION } from '@constants/app';
import useProjectData from './ProjectsTab/hooks/useProjectData';
import useProjectForm from './ProjectsTab/hooks/useProjectForm';
import { getProjectColumns } from './ProjectsTab/utils/tableColumns';

const ProjectsTab = () => {
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
        total: 0,
    });
    const [projectTypesForModal, setProjectTypesForModal] = useState([]);
    const [accountTypesForModal, setAccountTypesForModal] = useState([]);
    const [projectStatusesForModal, setProjectStatusesForModal] = useState([]);
    const [billingStatusesForModal, setBillingStatusesForModal] = useState([]);
    const [loadingConfigForModal, setLoadingConfigForModal] = useState(false);

    // Use project data hook
    const {
        projects,
        setProjects,
        loadingProjects,
        clients,
        accountManagersList,
        loadingAccountManagers,
        fetchProjects,
    } = useProjectData(pagination);

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

    // Fetch projects on mount
    useEffect(() => {
        const loadProjects = async () => {
            try {
                const result = await fetchProjects(1, PAGINATION.DEFAULT_PAGE_SIZE);
                if (result && result.pagination) {
                    setPagination({
                        current: result.pagination.page || 1,
                        pageSize: result.pagination.limit || PAGINATION.DEFAULT_PAGE_SIZE,
                        total: result.pagination.total || 0,
                    });
                }
            } catch (error) {
                // Error already handled in hook
            }
        };
        loadProjects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchProjects(1, PAGINATION.DEFAULT_PAGE_SIZE);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // CRUD operations
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
        onFetch: async () => {
            try {
                const result = await fetchProjects(pagination.current, pagination.pageSize);
                if (result && result.pagination) {
                    setPagination({
                        current: result.pagination.page || pagination.current,
                        pageSize: result.pagination.limit || pagination.pageSize,
                        total: result.pagination.total || 0,
                    });
                }
            } catch (error) {
                // Error already handled in hook
            }
        },
    });

    // Use project form hook
    const {
        accountType,
        setAccountType,
        handleSubmit: handleFormSubmit,
    } = useProjectForm({
        form,
        onFetch: async () => {
            try {
                const result = await fetchProjects(pagination.current, pagination.pageSize);
                if (result && result.pagination) {
                    setPagination({
                        current: result.pagination.page || pagination.current,
                        pageSize: result.pagination.limit || pagination.pageSize,
                        total: result.pagination.total || 0,
                    });
                }
            } catch (error) {
                // Error already handled in hook
            }
        },
        accountTypesForModal,
        projectTypesForModal,
        projectStatusesForModal,
        billingStatusesForModal,
        onCloseModal: handleCloseModal,
    });

    // Custom submit handler
    const handleSubmit = () => {
        handleFormSubmit(isEditMode, selectedItem, setPagination, pagination);
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

    // Table columns
    const columns = useMemo(() => getProjectColumns(), []);

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
                <ProjectForm
                    form={form}
                    isEditMode={isEditMode}
                    accountType={accountType}
                    setAccountType={setAccountType}
                    clients={clients}
                    accountManagersList={accountManagersList}
                    projectTypesForModal={projectTypesForModal}
                    accountTypesForModal={accountTypesForModal}
                    projectStatusesForModal={projectStatusesForModal}
                    billingStatusesForModal={billingStatusesForModal}
                    loadingConfigForModal={loadingConfigForModal}
                    loadingAccountManagers={loadingAccountManagers}
                />
            </ConfigModal>
        </>
    );
};

export default ProjectsTab;
