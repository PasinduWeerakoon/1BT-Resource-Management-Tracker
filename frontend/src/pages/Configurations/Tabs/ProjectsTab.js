/**
 * Projects Tab Component
 * Most complex tab with pagination, filters, and complex form
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useConfigCRUD } from '../hooks/useConfigCRUD';
import ConfigTable from '../components/ConfigTable';
import ConfigModal from '../components/ConfigModal';
import ProjectForm from './ProjectsTab/components/ProjectForm';
import { projectsService } from '@api';
import { showErrorToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import dayjs from 'dayjs';
import { PAGINATION } from '@constants/app';
import useProjectData from './ProjectsTab/hooks/useProjectData';
import useProjectForm from './ProjectsTab/hooks/useProjectForm';
import { getProjectColumns } from './ProjectsTab/utils/tableColumns';
import { selectProjectTypes, selectBillingStatuses, selectAccountTypes, selectProjectStatuses } from '@redux/slices/configSlice';

const ProjectsTab = () => {
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
        total: 0,
    });

    // Get config data from Redux
    const projectTypesForModal = useSelector(selectProjectTypes);
    const billingStatusesForModal = useSelector(selectBillingStatuses);
    const accountTypesForModal = useSelector(selectAccountTypes);
    const projectStatusesForModal = useSelector(selectProjectStatuses);

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
    const projectBillingStatusesForModal = useMemo(() => {
        const filtered = billingStatusesForModal.filter((status) => {
            const billingType = status?.billingType || [];
            return Array.isArray(billingType) && billingType.includes('project');
        });
        return filtered.length > 0 ? filtered : billingStatusesForModal;
    }, [billingStatusesForModal]);

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
        projectTypesForModal,
        billingStatusesForModal: projectBillingStatusesForModal,
        accountTypesForModal,
        projectStatusesForModal,
        onCloseModal: handleCloseModal,
    });

    // Store the record to edit in a ref so we can access it in useEffect
    const recordToEditRef = useRef(null);

    // Set form values when modal opens and we have a record to edit
    useEffect(() => {
        if (isModalVisible && isEditMode && recordToEditRef.current) {
            const record = recordToEditRef.current;

            // Wait for all required options to be loaded (accountManagersList is optional)
            if (accountTypesForModal.length === 0 ||
                projectStatusesForModal.length === 0 ||
                projectTypesForModal.length === 0) {
                return; // Options not loaded yet, wait for next render
            }

            // Convert account_type string to ID
            const accountTypeId = accountTypesForModal.find(at => at.name === record.account_type)?.id ||
                accountTypesForModal.find(at => at.name === 'External')?.id;
            // Convert status string to ID
            const statusId = projectStatusesForModal.find(ps => ps.name === record.status)?.id ||
                projectStatusesForModal.find(ps => ps.name === 'Active')?.id;

            setAccountType(accountTypeId);

            // Reset form first to clear any previous values
            form.resetFields();

            // Set form values after a delay to ensure form and all Select options are ready
            const timer = setTimeout(() => {
                const formValues = {
                    project_name: record.project_name || '',
                    project_code: record.project_code || '',
                    client_id: record.client_id || null,
                    project_type: record.project_type_id || null,
                    account_type: accountTypeId,
                    status: statusId,
                    account_manager: record.account_manager_id || null,
                    billing_type: record.billing_status_id || null,
                    team_size: record.team_size !== undefined && record.team_size !== null ? record.team_size : 1,
                    account_reg_sales_owner: record.account_reg_sales_owner || '',
                    budget: record.budget !== undefined && record.budget !== null ? record.budget : 0,
                    start_date: record.project_start_date ? dayjs(record.project_start_date) : null,
                    end_date: record.project_end_date ? dayjs(record.project_end_date) : null,
                    description: record.description || '',
                };

                // Set form values
                form.setFieldsValue(formValues);
            }, 400);

            return () => clearTimeout(timer);
        }
    }, [isModalVisible, isEditMode, accountTypesForModal, projectStatusesForModal, projectTypesForModal, form, setAccountType]);

    // Custom submit handler
    const handleSubmit = () => {
        handleFormSubmit(isEditMode, selectedItem, setPagination, pagination);
    };

    // Custom add handler
    const handleAddProject = () => {
        // Clear the edit record ref
        recordToEditRef.current = null;
        const externalAccountTypeId = accountTypesForModal.find(at => at.name === 'External')?.id;
        const activeStatusId = projectStatusesForModal.find(ps => ps.name === 'Active')?.id;
        setAccountType(externalAccountTypeId);
        form.resetFields();
        form.setFieldsValue({
            account_type: externalAccountTypeId,
            status: activeStatusId,
            billing_type: projectBillingStatusesForModal.find(bs => bs.name === 'Billing')?.id,
            team_size: 1,
        });
        handleAdd();
    };

    // Custom edit handler
    const handleEditProject = (record) => {
        // Store the record in ref for useEffect to use
        recordToEditRef.current = record;
        // Open the modal first
        handleEdit(record);
        // Reset form after modal opens to clear any previous values
        // The useEffect will set the new values after options are loaded
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
                isEditDisabled={(record) => record.is_default === true || record.isDefault === true}
                isDeleteDisabled={(record) => record.is_default === true || record.isDefault === true}
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
                    accountTypeId={accountType}
                    setAccountTypeId={setAccountType}
                    clients={clients}
                    accountManagersList={accountManagersList}
                    projectTypesForModal={projectTypesForModal}
                    billingStatusesForModal={projectBillingStatusesForModal}
                    accountTypesForModal={accountTypesForModal}
                    projectStatusesForModal={projectStatusesForModal}
                    loadingConfigForModal={false}
                    loadingAccountManagers={loadingAccountManagers}
                />
            </ConfigModal>
        </>
    );
};

export default ProjectsTab;
