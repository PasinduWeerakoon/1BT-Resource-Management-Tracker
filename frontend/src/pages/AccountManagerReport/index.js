import React, { useState, useMemo, useEffect } from 'react';
import { Row, Col, Card, Select, DatePicker, Table, Button, Space, Badge, Form, Input, InputNumber, Divider, Tooltip, App, Switch } from 'antd';
import dayjs from 'dayjs';
import {
    UserOutlined,
    TeamOutlined,
    DollarOutlined,
    PercentageOutlined,
    FilterOutlined,
    UpOutlined,
    DownOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    UserAddOutlined,
    DeleteOutlined,
    EyeOutlined
} from '@ant-design/icons';
import { Doughnut, Bar } from 'react-chartjs-2';
import { commonOptions, colors } from '@utils/chartConfig';
import CustomTable from '@components/Table';
import CustomModal from '@components/Modal';
import { projectsService, clientsService, allocationsService, resourcesService } from '@api';
import { showErrorToast, showSuccessToast, showWarningToast } from '@utils/toast.utils';
import '@styles/pages/AccountManagerReport.scss';

const { Option } = Select;
const { RangePicker } = DatePicker;

const AccountManagerReport = () => {
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const [billingType, setBillingType] = useState(null);
    const [accountType, setAccountType] = useState('External');
    const [filtersExpanded, setFiltersExpanded] = useState(false);
    const [billingStatusExpanded, setBillingStatusExpanded] = useState(true);
    const [employeesByTierExpanded, setEmployeesByTierExpanded] = useState(true);
    const [projectOverviewExpanded, setProjectOverviewExpanded] = useState(true);
    const [byAllocationExpanded, setByAllocationExpanded] = useState(true);
    const [isCreateProjectModalVisible, setIsCreateProjectModalVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [isAddTeamMembersModalVisible, setIsAddTeamMembersModalVisible] = useState(false);
    const [selectedProjectForTeam, setSelectedProjectForTeam] = useState(null);
    const [teamMembersForm] = Form.useForm();
    const [teamMembersList, setTeamMembersList] = useState([]);
    const [isUserAllocationModalVisible, setIsUserAllocationModalVisible] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [userAllocationsList, setUserAllocationsList] = useState([]);
    const [userAllocationsForm] = Form.useForm();
    const [isSubmittingProject, setIsSubmittingProject] = useState(false);
    const [clientsList, setClientsList] = useState([]);
    const [projectData, setProjectData] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [projectPagination, setProjectPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [allocationData, setAllocationData] = useState([]);
    const [loadingAllocations, setLoadingAllocations] = useState(false);
    const [allocationPagination, setAllocationPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [isAllocationModalVisible, setIsAllocationModalVisible] = useState(false);
    const [isEditAllocationMode, setIsEditAllocationMode] = useState(false);
    const [selectedAllocation, setSelectedAllocation] = useState(null);
    const [allocationForm] = Form.useForm();
    const [isSubmittingAllocation, setIsSubmittingAllocation] = useState(false);
    const [resourcesList, setResourcesList] = useState([]);
    const [isResourceAllocationsModalVisible, setIsResourceAllocationsModalVisible] = useState(false);
    const [resourceAllocationsData, setResourceAllocationsData] = useState([]);
    const [loadingResourceAllocations, setLoadingResourceAllocations] = useState(false);
    const [selectedResourceId, setSelectedResourceId] = useState(null);
    const [selectedResourceName, setSelectedResourceName] = useState('');
    const [filters, setFilters] = useState({
        accountManager: 'Randika Swaris',
        projectName: 'All',
        projectStatus: 'Active',
        allocationStatus: 'Active',
        clientName: 'All',
        billingStatus: 'All',
        year: '2025',
        month: 'All',
        employeeStatus: 'Active',
    });

    // Default filter values for comparison
    const defaultFilters = {
        accountManager: 'Randika Swaris',
        projectName: 'All',
        projectStatus: 'Active',
        allocationStatus: 'Active',
        clientName: 'All',
        billingStatus: 'All',
        year: '2025',
        month: 'All',
        employeeStatus: 'Active',
    };

    // Count active filters (filters that differ from defaults)
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        Object.keys(filters).forEach((key) => {
            if (filters[key] !== defaultFilters[key] && filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
                count++;
            }
        });
        return count;
    }, [filters]);

    // Fetch clients list for client lookup
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const response = await clientsService.getAll({ limit: 10 });
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

                setClientsList(clientsData);
            } catch (error) {
                console.error('Failed to fetch clients:', error);
            }
        };

        fetchClients();
    }, []);

    // Fetch projects from API
    const fetchProjects = async (page = 1, limit = 10) => {
        try {
            setLoadingProjects(true);

            // Build query parameters from filters
            const queryParams = {
                page: page || projectPagination.current,
                limit: limit || projectPagination.pageSize,
            };

            // Add filters if they're set and not "All"
            if (filters.projectName && filters.projectName !== 'All') {
                queryParams.search = filters.projectName;
            }

            if (filters.projectStatus && filters.projectStatus !== 'All') {
                queryParams.status = filters.projectStatus;
            }

            // Note: client_id and project_type filters can be added here if needed
            // if (filters.clientName && filters.clientName !== 'All') {
            //     queryParams.client_id = filters.clientName;
            // }

            const response = await projectsService.getAll(queryParams);

            // Handle response structure after interceptor transformation
            let projectsData = [];

            if (response) {
                // Check if response has data array directly (after interceptor transformation)
                if (Array.isArray(response.data)) {
                    projectsData = response.data;
                }
                // Check if response has nested data structure
                else if (response.data && response.data.data && Array.isArray(response.data.data)) {
                    projectsData = response.data.data;
                }
                // Check if response is the data object directly
                else if (response.data && Array.isArray(response.data)) {
                    projectsData = response.data;
                }
                // Fallback: response is an array
                else if (Array.isArray(response)) {
                    projectsData = response;
                }
            }

            // Get pagination info from response
            let paginationData = {};
            if (response) {
                if (response.pagination) {
                    paginationData = response.pagination;
                } else if (response.data && response.data.pagination) {
                    paginationData = response.data.pagination;
                }
            }

            // Transform projects data to match table format
            const transformedProjects = projectsData.map((project) => ({
                key: project.id,
                id: project.id,
                project: project.project_name || project.name,
                customer: project.client_name || 'N/A',
                projectType: project.project_type || 'N/A',
                teamSize: 0, // TODO: Calculate from allocations if needed
                status: project.status,
                project_name: project.project_name,
                project_code: project.project_code,
                client_id: project.client_id,
                is_billable: project.is_billable,
                start_date: project.start_date,
                end_date: project.end_date,
                description: project.description,
                project_type: project.project_type,
            }));

            setProjectData(transformedProjects);

            // Update pagination state
            setProjectPagination({
                current: paginationData.page || page || 1,
                pageSize: paginationData.limit || limit || 10,
                total: paginationData.total || 0,
            });

            // Auto-select first project and fetch its allocations (only on initial load)
            if (transformedProjects.length > 0 && !selectedProjectId && page === 1) {
                const firstProject = transformedProjects[0];
                setSelectedProjectId(firstProject.id);
                fetchProjectAllocations(firstProject.id, 1, allocationPagination.pageSize);
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error);
            showErrorToast('Failed to load projects');
        } finally {
            setLoadingProjects(false);
        }
    };

    // Fetch projects on component mount and when filters change
    useEffect(() => {
        fetchProjects(projectPagination.current, projectPagination.pageSize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.projectName, filters.projectStatus]);

    // Reset filters to default values
    const handleResetFilters = (e) => {
        e.stopPropagation(); // Prevent collapsing/expanding when clicking reset
        setFilters({ ...defaultFilters });
    };

    // Fetch clients list for client lookup
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const response = await clientsService.getAll({ limit: 10 });
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

                setClientsList(clientsData);
            } catch (error) {
                console.error('Failed to fetch clients:', error);
            }
        };

        fetchClients();
    }, []);

    const handleCreateProject = () => {
        // Set initial form values including account manager from filters
        const accountManagerValue = filters.accountManager && filters.accountManager !== 'All'
            ? filters.accountManager
            : undefined;

        form.setFieldsValue({
            accountManager: accountManagerValue,
            status: 'Active',
            billingType: undefined,
            accountType: 'External',
        });
        setBillingType(null);
        setAccountType('External');
        setIsCreateProjectModalVisible(true);
    };

    const handleCreateProjectCancel = () => {
        setIsCreateProjectModalVisible(false);
        setIsEditMode(false);
        setSelectedProject(null);
        form.resetFields();
        setBillingType(null);
        setAccountType('External');
    };

    // Handle edit project
    const handleEditProject = (project) => {
        setSelectedProject(project);
        setIsEditMode(true);

        // Determine account type based on project_type
        let accountType = 'External';
        let projectType = project.projectType;

        if (project.project_type === 'Internal') {
            accountType = 'Internal';
            projectType = 'Internal';
        } else {
            // Map project_type back to form projectType
            const projectTypeReverseMap = {
                'Client': 'Client',
                'Bench': 'Bench',
                'Training': 'Training',
                'Pre-Sales': 'Presale',
            };
            projectType = projectTypeReverseMap[project.project_type] || project.projectType;
        }

        // Map project data to form fields
        const formValues = {
            projectName: project.project_name || project.project,
            status: project.status || 'Active',
            projectType: projectType,
            accountType: accountType,
            clientName: project.customer || '',
            projectStartDate: project.start_date ? dayjs(project.start_date) : undefined,
            projectEndDate: project.end_date ? dayjs(project.end_date) : undefined,
            accountManager: filters.accountManager,
            billingType: project.is_billable ? 'Billing' : 'Non-Billing',
            teamSize: project.teamSize || 0,
            description: project.description || '',
            clientContact: '',
            clientEmail: '',
            clientPhone: '',
            clientAddress: '',
        };

        form.setFieldsValue(formValues);
        setBillingType(formValues.billingType);
        setAccountType(formValues.accountType);
        setIsCreateProjectModalVisible(true);
    };

    // Handle add team members
    const handleAddTeamMembers = (project) => {
        setSelectedProjectForTeam(project);

        // Load existing team members for this project
        // TODO: Replace with actual API call
        const existingMembers = allocationData.filter(item => item.project === project.project);
        setTeamMembersList(existingMembers.length > 0 ? existingMembers.map((member, index) => {
            // Parse date strings like "13 Oct 2025" to dayjs
            let allocatedDate = undefined;
            let deallocatedDate = undefined;
            if (member.allocatedDate) {
                allocatedDate = dayjs(member.allocatedDate, 'DD MMM YYYY');
            }
            if (member.deallocatedDate) {
                deallocatedDate = dayjs(member.deallocatedDate, 'DD MMM YYYY');
            }

            return {
                key: `existing-${index}`,
                employeeName: member.employeeName,
                projectName: project.project,
                allocatedDate: allocatedDate,
                deallocatedDate: deallocatedDate,
                billingStatus: member.billingStatus,
                billingPercentage: parseFloat(member.billingPercentage.replace('%', '')) || 0,
                projectAllocation: parseFloat(member.projectAllocation.replace('%', '')) || 0,
                duration: member.duration || 0,
                status: member.status,
            };
        }) : []);

        setIsAddTeamMembersModalVisible(true);
    };

    const handleAddTeamMembersCancel = () => {
        setIsAddTeamMembersModalVisible(false);
        setSelectedProjectForTeam(null);
        setTeamMembersList([]);
        teamMembersForm.resetFields();
    };

    const handleAddTeamMemberRow = () => {
        // Check if team size limit is reached
        if (teamMembersList.length >= (selectedProjectForTeam?.teamSize || 0)) {
            // TODO: Show warning message
            console.warn('Team size limit reached');
            return;
        }

        const newMember = {
            key: `new-${Date.now()}`,
            employeeName: undefined,
            projectName: selectedProjectForTeam?.project || '',
            allocatedDate: undefined,
            deallocatedDate: undefined,
            billingStatus: selectedProjectForTeam?.billingType || 'Billing',
            billingPercentage: 0,
            projectAllocation: 0,
            duration: 0,
            status: selectedProjectForTeam?.status || 'Active',
        };
        setTeamMembersList([...teamMembersList, newMember]);
    };

    const handleMemberFieldChange = (memberKey, field, value) => {
        setTeamMembersList(teamMembersList.map(member =>
            member.key === memberKey ? { ...member, [field]: value } : member
        ));
    };

    const handleRemoveTeamMemberRow = (key) => {
        setTeamMembersList(teamMembersList.filter(member => member.key !== key));
    };

    const handleTeamMembersSubmit = async () => {
        try {
            // Validate all member forms
            const formValues = await teamMembersForm.getFieldsValue();
            const errors = [];

            teamMembersList.forEach((member, index) => {
                if (!member.employeeName) {
                    errors.push(`Member ${index + 1}: Employee name is required`);
                }
                if (!member.allocatedDate) {
                    errors.push(`Member ${index + 1}: Allocated date is required`);
                }
                if (member.billingPercentage === undefined || member.billingPercentage === null) {
                    errors.push(`Member ${index + 1}: Billing percentage is required`);
                }
                if (member.projectAllocation === undefined || member.projectAllocation === null) {
                    errors.push(`Member ${index + 1}: Project allocation is required`);
                }
                if (member.duration === undefined || member.duration === null) {
                    errors.push(`Member ${index + 1}: Duration is required`);
                }
            });

            if (errors.length > 0) {
                console.error('Validation errors:', errors);
                // TODO: Show error message to user
                return;
            }

            // Get form values and merge with teamMembersList
            const membersToSave = teamMembersList.map((member, index) => {
                const memberFormData = formValues.members?.[member.key] || {};
                return {
                    ...member,
                    ...memberFormData,
                };
            });

            console.log('Saving team members:', membersToSave);
            // TODO: Add API call to save team members
            // await saveTeamMembers(selectedProjectForTeam.key, membersToSave);

            setIsAddTeamMembersModalVisible(false);
            setSelectedProjectForTeam(null);
            setTeamMembersList([]);
            teamMembersForm.resetFields();

            // TODO: Show success message and refresh data
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    // Set form values when team members modal opens
    useEffect(() => {
        if (isAddTeamMembersModalVisible && teamMembersList.length > 0) {
            const formValues = {
                members: {}
            };

            teamMembersList.forEach((member) => {
                formValues.members[member.key] = {
                    employeeName: member.employeeName,
                    projectName: member.projectName,
                    allocatedDate: member.allocatedDate,
                    deallocatedDate: member.deallocatedDate,
                    billingStatus: member.billingStatus,
                    billingPercentage: member.billingPercentage,
                    projectAllocation: member.projectAllocation,
                    duration: member.duration,
                    status: member.status,
                };
            });

            const timer = setTimeout(() => {
                try {
                    teamMembersForm.setFieldsValue(formValues);
                } catch (error) {
                    console.error('Error setting team members form values:', error);
                }
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [isAddTeamMembersModalVisible, teamMembersList, teamMembersForm]);

    // Handle user allocation modal
    const handleRowClick = (record) => {
        // When clicking on a row in BY ALLOCATION table, show resource allocations from API
        console.log('Row clicked:', record);
        if (record.resource_id) {
            handleViewResourceAllocations(record);
        } else {
            console.warn('Resource ID not found in record:', record);
            showWarningToast('Resource ID not found for this allocation');
        }
    };

    const handleUserAllocationCancel = () => {
        setIsUserAllocationModalVisible(false);
        setSelectedEmployee(null);
        setUserAllocationsList([]);
        userAllocationsForm.resetFields();
    };

    const handleAddUserAllocationRow = () => {
        const newAllocation = {
            key: `new-${Date.now()}`,
            projectName: undefined,
            allocatedDate: undefined,
            deallocatedDate: undefined,
            billingStatus: 'Billing',
            billingPercentage: 0,
            projectAllocation: 0,
            duration: 0,
            status: 'Active',
            isExisting: false,
        };
        setUserAllocationsList([...userAllocationsList, newAllocation]);
    };

    const handleRemoveUserAllocationRow = (key) => {
        setUserAllocationsList(userAllocationsList.filter(allocation => allocation.key !== key));
    };

    const handleUserAllocationFieldChange = (allocationKey, field, value) => {
        setUserAllocationsList(userAllocationsList.map(allocation =>
            allocation.key === allocationKey ? { ...allocation, [field]: value } : allocation
        ));
    };

    const handleUserAllocationsSubmit = async () => {
        try {
            const formValues = await userAllocationsForm.getFieldsValue();
            const errors = [];

            userAllocationsList.forEach((allocation, index) => {
                if (!allocation.projectName) {
                    errors.push(`Allocation ${index + 1}: Project name is required`);
                }
                if (!allocation.allocatedDate) {
                    errors.push(`Allocation ${index + 1}: Allocated date is required`);
                }
                if (allocation.billingPercentage === undefined || allocation.billingPercentage === null) {
                    errors.push(`Allocation ${index + 1}: Billing percentage is required`);
                }
                if (allocation.projectAllocation === undefined || allocation.projectAllocation === null) {
                    errors.push(`Allocation ${index + 1}: Project allocation is required`);
                }
                if (allocation.duration === undefined || allocation.duration === null) {
                    errors.push(`Allocation ${index + 1}: Duration is required`);
                }
            });

            if (errors.length > 0) {
                console.error('Validation errors:', errors);
                return;
            }

            // Get form values and merge with userAllocationsList
            const allocationsToSave = userAllocationsList.map((allocation) => {
                const allocationFormData = formValues.allocations?.[allocation.key] || {};
                return {
                    employeeName: selectedEmployee,
                    ...allocation,
                    ...allocationFormData,
                };
            });

            console.log('Saving user allocations:', allocationsToSave);
            // TODO: Add API call to save user allocations
            // await saveUserAllocations(selectedEmployee, allocationsToSave);

            setIsUserAllocationModalVisible(false);
            setSelectedEmployee(null);
            setUserAllocationsList([]);
            userAllocationsForm.resetFields();

            // TODO: Show success message and refresh data
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const handleCreateProjectSubmit = async (values) => {
        try {
            setIsSubmittingProject(true);

            // Map project type from form to API format
            const projectTypeMap = {
                'Client': 'Client',
                'Bench': 'Bench',
                'Training': 'Training',
                'POC': 'Client', // POC maps to Client
                'Presale': 'Pre-Sales',
            };

            // Determine project_type based on accountType
            let project_type;
            if (values.accountType === 'Internal') {
                project_type = 'Internal';
            } else {
                project_type = projectTypeMap[values.projectType] || 'Client';
            }

            // Handle client_id - if External and clientName provided, try to find or create client
            let client_id = null;
            if (values.accountType === 'External' && values.clientName) {
                // Try to find existing client by name
                const existingClient = clientsList.find(
                    client => client.client_name?.toLowerCase() === values.clientName?.toLowerCase()
                );

                if (existingClient) {
                    client_id = existingClient.id;
                } else {
                    // Create new client if not found
                    try {
                        const newClientResponse = await clientsService.create({
                            client_name: values.clientName,
                            contact_person: values.clientContact || '',
                            contact_email: values.clientEmail || '',
                            contact_phone: values.clientPhone || '',
                            address: values.clientAddress || '',
                            is_active: true,
                        });

                        if (newClientResponse && newClientResponse.data) {
                            client_id = newClientResponse.data.id;
                            // Update clients list
                            setClientsList(prev => [...prev, newClientResponse.data]);
                        }
                    } catch (clientError) {
                        console.error('Failed to create client:', clientError);
                        // Continue without client_id if client creation fails
                    }
                }
            }

            // Map billing type to is_billable
            const is_billable = values.billingType === 'Billing';

            // Prepare API payload
            const projectPayload = {
                project_name: values.projectName,
                project_code: '', // Optional, can be generated by backend
                client_id: client_id,
                project_type: project_type,
                is_billable: is_billable,
                status: values.status === 'Active' ? 'Active' : 'On Hold', // Map status
                start_date: values.projectStartDate ? values.projectStartDate.format('YYYY-MM-DD') : null,
                end_date: values.projectEndDate ? values.projectEndDate.format('YYYY-MM-DD') : null,
                description: values.description || '',
            };

            if (isEditMode && selectedProject) {
                // Update existing project
                const updatePayload = {
                    project_name: values.projectName,
                    client_id: client_id,
                    status: values.status === 'Active' ? 'Active' : 'On Hold',
                    description: values.description || '',
                };

                const response = await projectsService.update(selectedProject.key || selectedProject.id, updatePayload);

                if (response && (response.success !== false || response.data)) {
                    showSuccessToast('Project updated successfully');
                    // Close modal and reset form on success
                    setIsCreateProjectModalVisible(false);
                    setIsEditMode(false);
                    setSelectedProject(null);
                    form.resetFields();
                    setBillingType(null);
                    setAccountType('External');
                    // Refresh project list
                    await fetchProjects();
                } else {
                    showErrorToast(response?.message || 'Failed to update project');
                }
            } else {
                // Create new project
                const response = await projectsService.create(projectPayload);

                if (response && (response.success !== false || response.data)) {
                    showSuccessToast('Project created successfully');
                    // Close modal and reset form on success
                    setIsCreateProjectModalVisible(false);
                    setIsEditMode(false);
                    setSelectedProject(null);
                    form.resetFields();
                    setBillingType(null);
                    setAccountType('External');
                    // Refresh project list
                    await fetchProjects();
                } else {
                    showErrorToast(response?.message || 'Failed to create project');
                }
            }
        } catch (error) {
            console.error('Error creating/updating project:', error);
            showErrorToast(error?.response?.data?.message || error?.message || 'Failed to save project');
        } finally {
            setIsSubmittingProject(false);
        }
    };

    // KPI Data
    const kpiData = {
        billableResources: 52,
        allocatedCount: 48.2,
        billableCount: 5.0,
        avgProjectAllocation: 92.6,
        avgBillingPercentage: 29.2,
    };

    // Chart.js data for billing status donut chart
    const billingStatusDonutData = {
        labels: ['Bench', 'Non-Billing', 'Training', 'Presale', 'Billing'],
        datasets: [
            {
                data: [19, 15, 14, 6, 6],
                backgroundColor: [colors.error, colors.warning, colors.success, colors.info, colors.purple],
                borderWidth: 2,
                borderColor: '#fff',
            },
        ],
    };

    const billingStatusDonutOptions = {
        ...commonOptions,
        plugins: {
            ...commonOptions.plugins,
            legend: {
                ...commonOptions.plugins.legend,
                position: 'bottom',
            },
            tooltip: {
                ...commonOptions.plugins.tooltip,
                callbacks: {
                    label: function (context) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(2);
                        return `${label}: ${value} (${percentage}%)`;
                    },
                },
            },
        },
    };

    // Chart.js data for employees by tier bar chart
    const employeesByTierBarData = {
        labels: ['Synergy', 'Tier - 1', 'Tier - 2', 'Tier - 3', 'Tier - 4', 'Intern'],
        datasets: [
            {
                label: 'Number of Employees',
                data: [4, 2, 11, 4, 14, 16],
                backgroundColor: colors.primary,
                borderRadius: 4,
            },
        ],
    };

    const employeesByTierBarOptions = {
        ...commonOptions,
        indexAxis: 'y',
        scales: {
            ...commonOptions.scales,
            x: {
                ...commonOptions.scales.x,
                beginAtZero: true,
            },
            y: {
                ...commonOptions.scales.y,
                grid: {
                    display: false,
                },
            },
        },
        plugins: {
            ...commonOptions.plugins,
            legend: {
                display: false,
            },
        },
    };

    // Chart.js data for track donut chart
    const trackDonutData = {
        labels: ['Dev', 'QA', 'Delivery', 'PM', 'BA', 'UX', 'UI'],
        datasets: [
            {
                data: [29, 7, 4, 4, 3, 3, 2],
                backgroundColor: [
                    colors.primary,
                    colors.error,
                    colors.warning,
                    colors.success,
                    colors.info,
                    colors.purple,
                    colors.cyan,
                ],
                borderWidth: 2,
                borderColor: '#fff',
            },
        ],
    };

    const trackDonutOptions = {
        ...commonOptions,
        plugins: {
            ...commonOptions.plugins,
            legend: {
                ...commonOptions.plugins.legend,
                position: 'bottom',
            },
            tooltip: {
                ...commonOptions.plugins.tooltip,
                callbacks: {
                    label: function (context) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(2);
                        return `${label}: ${value} (${percentage}%)`;
                    },
                },
            },
        },
    };

    // Chart.js data for tech stack bar chart
    const techStackBarData = {
        labels: ['.NET', 'Full Stack', 'QA', 'BA/PM', 'Data Science'],
        datasets: [
            {
                label: 'Number of Employees',
                data: [13, 10, 8, 5, 3],
                backgroundColor: colors.primary,
                borderRadius: 4,
            },
        ],
    };

    const techStackBarOptions = {
        ...commonOptions,
        indexAxis: 'y',
        scales: {
            ...commonOptions.scales,
            x: {
                ...commonOptions.scales.x,
                beginAtZero: true,
            },
            y: {
                ...commonOptions.scales.y,
                grid: {
                    display: false,
                },
            },
        },
        plugins: {
            ...commonOptions.plugins,
            legend: {
                display: false,
            },
        },
    };

    // Mock data for tables
    // Fetch resources list for allocation form
    useEffect(() => {
        const fetchResources = async () => {
            try {
                const response = await resourcesService.getAll({ limit: 10 });
                let resourcesData = [];

                if (response) {
                    // Handle different response structures
                    if (Array.isArray(response.data)) {
                        resourcesData = response.data;
                    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
                        resourcesData = response.data.data;
                    } else if (response.data && Array.isArray(response.data)) {
                        resourcesData = response.data;
                    } else if (Array.isArray(response)) {
                        resourcesData = response;
                    }
                }

                // Ensure we have the correct structure with id and name
                const formattedResources = resourcesData.map((resource) => ({
                    id: resource.id,
                    name: resource.name, // API returns 'name' field
                    email: resource.email,
                    status: resource.status,
                })).filter(resource => resource.id && resource.name); // Filter out invalid entries

                setResourcesList(formattedResources);
            } catch (error) {
                console.error('Failed to fetch resources:', error);
                showErrorToast('Failed to load resources');
            }
        };

        fetchResources();
    }, []);

    // Handle add allocation
    const handleAddAllocation = () => {
        setIsEditAllocationMode(false);
        setSelectedAllocation(null);
        allocationForm.resetFields();
        allocationForm.setFieldsValue({
            project_id: undefined, // Don't pre-select project, let user choose
            allocation_percentage: 100,
            billing_percentage: 100,
            is_active: true,
        });
        setIsAllocationModalVisible(true);
    };

    // Handle edit allocation
    const handleEditAllocation = (record) => {
        setIsEditAllocationMode(true);
        setSelectedAllocation(record);

        // Find the resource ID from the resource name
        const resource = resourcesList.find(r => r.name === record.employeeName);

        allocationForm.setFieldsValue({
            resource_id: resource?.id,
            project_id: selectedProjectId,
            allocation_percentage: parseFloat(record.projectAllocation?.replace('%', '') || '0'),
            billing_percentage: parseFloat(record.billingPercentage?.replace('%', '') || '0'),
            start_date: record.allocatedDate ? dayjs(record.allocatedDate, 'DD MMM YYYY') : null,
            end_date: record.deallocatedDate ? dayjs(record.deallocatedDate, 'DD MMM YYYY') : null,
            is_active: record.status === 'Active',
            notes: '',
        });
        setIsAllocationModalVisible(true);
    };

    // Handle delete allocation
    const handleDeleteAllocation = (record) => {
        Modal.confirm({
            title: 'Delete Allocation',
            content: `Are you sure you want to delete the allocation for "${record.employeeName}"? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    setLoadingAllocations(true);
                    const response = await allocationsService.delete(record.id);

                    if (response && (response.success !== false || response.message)) {
                        showSuccessToast('Allocation deleted successfully');
                        // Refresh allocations for the selected project
                        await fetchProjectAllocations(selectedProjectId, allocationPagination.current, allocationPagination.pageSize);
                    } else {
                        showErrorToast(response?.message || 'Failed to delete allocation');
                    }
                } catch (error) {
                    console.error('Failed to delete allocation:', error);
                    showErrorToast(error?.response?.data?.message || error?.message || 'Failed to delete allocation');
                } finally {
                    setLoadingAllocations(false);
                }
            },
        });
    };

    // Handle allocation form submit
    const handleAllocationSubmit = async () => {
        try {
            setIsSubmittingAllocation(true);
            const values = await allocationForm.validateFields();

            // Prepare API payload
            const allocationPayload = {
                resource_id: values.resource_id,
                project_id: values.project_id,
                allocation_percentage: values.allocation_percentage,
                billing_percentage: values.billing_percentage,
                start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
                end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
                notes: values.notes || '',
            };

            if (isEditAllocationMode && selectedAllocation) {
                // Update allocation
                const updatePayload = {
                    allocation_percentage: values.allocation_percentage,
                    billing_percentage: values.billing_percentage,
                    start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
                    end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
                    is_active: values.is_active !== undefined ? values.is_active : true,
                    notes: values.notes || '',
                };

                const response = await allocationsService.update(selectedAllocation.id, updatePayload);

                if (response && (response.success !== false || response.data)) {
                    showSuccessToast('Allocation updated successfully');
                    setIsAllocationModalVisible(false);
                    allocationForm.resetFields();
                    setSelectedAllocation(null);
                    setIsEditAllocationMode(false);
                    // Refresh allocations
                    await fetchProjectAllocations(selectedProjectId, allocationPagination.current, allocationPagination.pageSize);
                } else {
                    showErrorToast(response?.message || 'Failed to update allocation');
                }
            } else {
                // Create allocation
                const response = await allocationsService.create(allocationPayload);

                if (response && (response.success !== false || response.data)) {
                    showSuccessToast('Allocation created successfully');
                    setIsAllocationModalVisible(false);
                    allocationForm.resetFields();
                    setSelectedAllocation(null);
                    setIsEditAllocationMode(false);
                    // Refresh allocations
                    await fetchProjectAllocations(selectedProjectId, allocationPagination.current, allocationPagination.pageSize);
                } else {
                    showErrorToast(response?.message || 'Failed to create allocation');
                }
            }
        } catch (error) {
            console.error('Allocation submit error:', error);
            if (error.errorFields) {
                // Form validation errors
                return;
            }
            showErrorToast(error?.response?.data?.message || error?.message || 'Failed to save allocation');
        } finally {
            setIsSubmittingAllocation(false);
        }
    };

    // Handle view resource allocations
    const handleViewResourceAllocations = async (record) => {
        console.log('handleViewResourceAllocations called with record:', record);
        if (!record.resource_id) {
            console.error('Resource ID not found in record:', record);
            showWarningToast('Resource ID not found');
            return;
        }

        setSelectedResourceId(record.resource_id);
        setSelectedResourceName(record.employeeName || 'N/A');
        setIsResourceAllocationsModalVisible(true);

        try {
            setLoadingResourceAllocations(true);
            console.log('Fetching allocations for resource_id:', record.resource_id);
            const response = await resourcesService.getAllocations(record.resource_id);
            console.log('Resource allocations API response:', response);

            // Handle response structure after interceptor transformation
            let allocationsData = [];

            if (response) {
                // Check if response is an array directly
                if (Array.isArray(response)) {
                    allocationsData = response;
                }
                // Check if response has data array
                else if (Array.isArray(response.data)) {
                    allocationsData = response.data;
                }
                // Check if response.data is a single object (wrap it in array)
                else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data) && response.data.id) {
                    allocationsData = [response.data];
                }
            }

            // Transform allocations data to match table format
            const transformedAllocations = allocationsData.map((allocation, index) => {
                // Calculate duration in days
                let duration = 0;
                if (allocation.start_date) {
                    const startDate = dayjs(allocation.start_date);
                    const endDate = allocation.end_date ? dayjs(allocation.end_date) : dayjs();
                    duration = endDate.diff(startDate, 'day');
                }

                // Handle allocation_percentage and billing_percentage as strings or numbers
                const allocationPercentage = typeof allocation.allocation_percentage === 'string'
                    ? parseFloat(allocation.allocation_percentage)
                    : (allocation.allocation_percentage || 0);
                const billingPercentage = typeof allocation.billing_percentage === 'string'
                    ? parseFloat(allocation.billing_percentage)
                    : (allocation.billing_percentage || 0);

                // Determine billing status
                let billingStatus = 'Non-Billing';
                if (allocation.project_is_billable) {
                    billingStatus = 'Billing';
                } else if (allocation.project_type === 'Bench') {
                    billingStatus = 'Bench';
                } else if (allocation.project_type === 'Pre-Sales' || allocation.project_type === 'Presale') {
                    billingStatus = 'Presale';
                } else if (allocation.project_type === 'Training') {
                    billingStatus = 'Training';
                }

                return {
                    key: allocation.id || `allocation-${index}`,
                    id: allocation.id,
                    project: allocation.project_name || 'N/A',
                    allocatedDate: allocation.start_date ? dayjs(allocation.start_date).format('DD MMM YYYY') : '',
                    deallocatedDate: allocation.end_date ? dayjs(allocation.end_date).format('DD MMM YYYY') : '',
                    billingStatus: billingStatus,
                    billingPercentage: billingPercentage ? `${billingPercentage.toFixed(2)}%` : '0.00%',
                    projectAllocation: allocationPercentage ? `${allocationPercentage.toFixed(2)}%` : '0.00%',
                    duration: duration,
                    status: allocation.is_active !== undefined ? (allocation.is_active ? 'Active' : 'Inactive') : (allocation.status || 'Active'),
                    project_id: allocation.project_id,
                };
            });

            setResourceAllocationsData(transformedAllocations);
        } catch (error) {
            console.error('Failed to fetch resource allocations:', error);
            setResourceAllocationsData([]);
        } finally {
            setLoadingResourceAllocations(false);
        }
    };

    const allocationColumns = [
        {
            title: 'Employee Name',
            dataIndex: 'employeeName',
            key: 'employeeName',
            width: 180,
        },
        {
            title: 'Project',
            dataIndex: 'project',
            key: 'project',
            width: 150,
        },
        {
            title: 'Project Allocated Date',
            dataIndex: 'allocatedDate',
            key: 'allocatedDate',
            width: 160,
        },
        {
            title: 'Project Deallocated Date',
            dataIndex: 'deallocatedDate',
            key: 'deallocatedDate',
            width: 180,
        },
        {
            title: 'Billing Status',
            dataIndex: 'billingStatus',
            key: 'billingStatus',
            width: 130,
        },
        {
            title: 'Billing Percentage',
            dataIndex: 'billingPercentage',
            key: 'billingPercentage',
            width: 140,
        },
        {
            title: 'Project Allocation',
            dataIndex: 'projectAllocation',
            key: 'projectAllocation',
            width: 140,
        },
        {
            title: 'Duration (Days)',
            dataIndex: 'duration',
            key: 'duration',
            width: 130,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            fixed: 'right',
            align: 'center',
            render: (_, record) => (
                <Space size="small" style={{ justifyContent: 'center', width: '100%' }}>
                    <Tooltip title="View Allocations">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleViewResourceAllocations(record);
                            }}
                            className="action-icon-btn"
                            size="small"
                        />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEditAllocation(record);
                            }}
                            className="action-icon-btn"
                            size="small"
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAllocation(record);
                            }}
                            className="action-icon-btn"
                            danger
                            size="small"
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const designationColumns = [
        {
            title: 'Employee Name',
            dataIndex: 'employeeName',
            key: 'employeeName',
            width: 200,
        },
        {
            title: 'Track',
            dataIndex: 'track',
            key: 'track',
            width: 120,
        },
        {
            title: 'Tech Stack',
            dataIndex: 'techStack',
            key: 'techStack',
            width: 150,
        },
        {
            title: 'Tier',
            dataIndex: 'tier',
            key: 'tier',
            width: 120,
        },
        {
            title: 'Designation',
            dataIndex: 'designation',
            key: 'designation',
            width: 250,
        },
        {
            title: 'Allocation Count',
            dataIndex: 'allocationCount',
            key: 'allocationCount',
            width: 140,
        },
    ];

    const designationData = [
        {
            key: '1',
            employeeName: 'Akeel Aliyar',
            track: 'Dev',
            techStack: 'Full Stack',
            tier: 'Tier - 4',
            designation: 'ASE',
            allocationCount: 1,
        },
        {
            key: '2',
            employeeName: 'Amaniya Faizal',
            track: 'UI',
            techStack: 'UI',
            tier: 'Tier - 4',
            designation: 'SE - UI',
            allocationCount: 1,
        },
        {
            key: '3',
            employeeName: 'Anushka Wickramaratne',
            track: 'Delivery',
            techStack: 'QA',
            tier: 'Synergy',
            designation: 'Senior Manager - QA',
            allocationCount: 1,
        },
        {
            key: '4',
            employeeName: 'Avanthi Amunugama',
            track: 'Delivery',
            techStack: 'BA/PM',
            tier: 'Synergy',
            designation: 'Associate Director - Project Management and Business Consulting',
            allocationCount: 2,
        },
        {
            key: '5',
            employeeName: 'Chaminda Pragnarathne',
            track: 'Dev',
            techStack: '.NET',
            tier: 'Tier - 2',
            designation: 'STL',
            allocationCount: 1,
        },
        {
            key: '6',
            employeeName: 'Chanka Sonnadara',
            track: 'Dev',
            techStack: 'Full Stack',
            tier: 'Tier - 4',
            designation: 'ASE',
            allocationCount: 1,
        },
        {
            key: '7',
            employeeName: 'Charith Bandara',
            track: 'QA',
            techStack: 'QA',
            tier: 'Tier - 4',
            designation: 'QAE',
            allocationCount: 2,
        },
    ];

    // Fetch allocations for a project
    const fetchProjectAllocations = async (projectId, page = 1, limit = 10) => {
        if (!projectId) return;

        try {
            setLoadingAllocations(true);
            // Note: projectsService.getAllocations doesn't support pagination directly
            // We'll fetch all and paginate client-side, or use allocationsService.getAll with project_id filter
            const response = await allocationsService.getAll({
                project_id: projectId,
                page: page || allocationPagination.current,
                limit: limit || allocationPagination.pageSize,
            });

            console.log('Allocations API response:', response);

            // Handle response structure after interceptor transformation
            let allocationsData = [];
            let paginationData = {};

            if (response) {
                // Check if response itself is an array (after interceptor transformation)
                if (Array.isArray(response)) {
                    allocationsData = response;
                    paginationData = {};
                }
                // Check if response has data array directly (after interceptor transformation)
                else if (Array.isArray(response.data)) {
                    allocationsData = response.data;
                    paginationData = response.pagination || {};
                }
                // Check if response has nested data structure with data array
                else if (response.data && response.data.data && Array.isArray(response.data.data)) {
                    allocationsData = response.data.data;
                    paginationData = response.data.pagination || {};
                }
                // Check if response.data is a single object (wrap it in array)
                else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data) && response.data.id) {
                    // Single allocation object - wrap in array
                    allocationsData = [response.data];
                    paginationData = response.pagination || { total: 1, page: 1, limit: 10 };
                }
                // Check if response itself is a single allocation object (after interceptor transformation)
                else if (typeof response === 'object' && !Array.isArray(response) && response.id && response.resource_id) {
                    // Single allocation object after interceptor - wrap in array
                    allocationsData = [response];
                    paginationData = { total: 1, page: 1, limit: 10 };
                }
                // Check if response is the data object directly with array
                else if (response.data && Array.isArray(response.data)) {
                    allocationsData = response.data;
                    paginationData = response.pagination || {};
                }
            }

            // Transform allocations data to match table format
            const transformedAllocations = await Promise.all(allocationsData.map(async (allocation, index) => {
                // Calculate duration in days
                let duration = 0;
                if (allocation.start_date) {
                    const startDate = dayjs(allocation.start_date);
                    const endDate = allocation.end_date ? dayjs(allocation.end_date) : dayjs();
                    duration = endDate.diff(startDate, 'day');
                }

                // Get resource name if not provided
                let resourceName = allocation.resource_name || allocation.employee_name || 'N/A';
                if (!resourceName && allocation.resource_id) {
                    const resource = resourcesList.find(r => r.id === allocation.resource_id);
                    if (resource) {
                        resourceName = resource.name;
                    } else {
                        // Try to fetch resource if not in list
                        try {
                            const resourceResponse = await resourcesService.getById(allocation.resource_id);
                            if (resourceResponse && resourceResponse.data) {
                                resourceName = resourceResponse.data.name || 'N/A';
                            }
                        } catch (error) {
                            console.error('Failed to fetch resource:', error);
                        }
                    }
                }

                // Get project name if not provided
                let projectName = allocation.project_name || 'N/A';
                if (!projectName && allocation.project_id) {
                    const project = projectData.find(p => p.id === allocation.project_id);
                    if (project) {
                        projectName = project.project_name || project.project || 'N/A';
                    } else {
                        // Try to fetch project if not in list
                        try {
                            const projectResponse = await projectsService.getById(allocation.project_id);
                            if (projectResponse && projectResponse.data) {
                                projectName = projectResponse.data.project_name || 'N/A';
                            }
                        } catch (error) {
                            console.error('Failed to fetch project:', error);
                        }
                    }
                }

                // Determine billing status based on project type and allocation
                let billingStatus = 'Non-Billing';
                if (allocation.project_is_billable) {
                    billingStatus = 'Billing';
                } else if (allocation.project_type === 'Bench') {
                    billingStatus = 'Bench';
                } else if (allocation.project_type === 'Pre-Sales' || allocation.project_type === 'Presale') {
                    billingStatus = 'Presale';
                } else if (allocation.project_type === 'Training') {
                    billingStatus = 'Training';
                }

                // Handle allocation_percentage and billing_percentage as strings or numbers
                const allocationPercentage = typeof allocation.allocation_percentage === 'string'
                    ? parseFloat(allocation.allocation_percentage)
                    : (allocation.allocation_percentage || 0);
                const billingPercentage = typeof allocation.billing_percentage === 'string'
                    ? parseFloat(allocation.billing_percentage)
                    : (allocation.billing_percentage || 0);

                return {
                    key: allocation.id || `allocation-${index}`,
                    id: allocation.id,
                    employeeName: resourceName,
                    project: projectName,
                    allocatedDate: allocation.start_date ? dayjs(allocation.start_date).format('DD MMM YYYY') : '',
                    deallocatedDate: allocation.end_date ? dayjs(allocation.end_date).format('DD MMM YYYY') : '',
                    billingStatus: billingStatus,
                    billingPercentage: billingPercentage ? `${billingPercentage.toFixed(2)}%` : '0.00%',
                    projectAllocation: allocationPercentage ? `${allocationPercentage.toFixed(2)}%` : '0.00%',
                    duration: duration,
                    status: allocation.is_active !== undefined ? (allocation.is_active ? 'Active' : 'Inactive') : (allocation.status || 'Active'),
                    resource_id: allocation.resource_id,
                    project_id: allocation.project_id,
                };
            }));

            setAllocationData(transformedAllocations);

            // Update pagination state
            setAllocationPagination({
                current: paginationData.page || page || 1,
                pageSize: paginationData.limit || limit || 10,
                total: paginationData.total || 0,
            });
        } catch (error) {
            console.error('Failed to fetch project allocations:', error);
            showErrorToast('Failed to load allocations');
            setAllocationData([]);
        } finally {
            setLoadingAllocations(false);
        }
    };

    // Handle project row click
    const handleProjectClick = (project) => {
        setSelectedProjectId(project.id);
        fetchProjectAllocations(project.id, 1, allocationPagination.pageSize);
    };

    const projectColumns = [
        {
            title: 'Project',
            dataIndex: 'project',
            key: 'project',
            width: 150,
        },
        {
            title: 'Customer',
            dataIndex: 'customer',
            key: 'customer',
            width: 150,
        },
        {
            title: 'Project Type',
            dataIndex: 'projectType',
            key: 'projectType',
            width: 150,
        },
        {
            title: 'Team Size',
            dataIndex: 'teamSize',
            key: 'teamSize',
            width: 120,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            fixed: 'right',
            align: 'center',
            render: (_, record) => (
                <Space size="small" style={{ justifyContent: 'center', width: '100%' }}>
                    <Tooltip title="Edit">
                        <Button
                            type="default"
                            icon={<EditOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEditProject(record);
                            }}
                            size="small"
                            className="action-icon-btn"
                        />
                    </Tooltip>
                    <Tooltip title="Add Members">
                        <Button
                            type="default"
                            icon={<UserAddOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAddTeamMembers(record);
                            }}
                            size="small"
                            className="action-icon-btn"
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];


    return (
        <div className="account-manager-report-page">
            {/* Header Section */}
            <div className="report-header">
                <h1 className="report-title">ACCOUNT MANAGER REPORT</h1>
            </div>

            {/* Filters Section */}
            <Card className="filters-card">
                <div
                    className="filters-header"
                    onClick={() => setFiltersExpanded(!filtersExpanded)}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="filters-header-left">
                        <FilterOutlined className="filter-icon" />
                        <span className="filters-title">Filters</span>
                        {activeFiltersCount > 0 && (
                            <>
                                <Badge count={activeFiltersCount} showZero={false} className="active-filters-badge">
                                    <span></span>
                                </Badge>
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<ReloadOutlined />}
                                    onClick={handleResetFilters}
                                    className="reset-filters-btn"
                                >
                                    Reset
                                </Button>
                            </>
                        )}
                    </div>
                    {filtersExpanded ? (
                        <UpOutlined className="collapse-icon" />
                    ) : (
                        <DownOutlined className="collapse-icon" />
                    )}
                </div>
                {filtersExpanded && (
                    <div className="filters-content">
                        <Row gutter={[16, 16]} className="filters-row">
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <div className="filter-item">
                                    <label>Account Manager</label>
                                    <Select
                                        value={filters.accountManager}
                                        onChange={(value) => setFilters({ ...filters, accountManager: value })}
                                        style={{ width: '100%' }}
                                    >
                                        <Option value="Randika Swaris">Randika Swaris</Option>
                                        <Option value="All">All</Option>
                                    </Select>
                                </div>
                            </Col>
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <div className="filter-item">
                                    <label>Project Name</label>
                                    <Select
                                        value={filters.projectName}
                                        onChange={(value) => setFilters({ ...filters, projectName: value })}
                                        style={{ width: '100%' }}
                                    >
                                        <Option value="All">All</Option>
                                        <Option value="Healthfinder">Healthfinder</Option>
                                        <Option value="MillionSpaces">MillionSpaces</Option>
                                    </Select>
                                </div>
                            </Col>
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <div className="filter-item">
                                    <label>Project Status</label>
                                    <Select
                                        value={filters.projectStatus}
                                        onChange={(value) => setFilters({ ...filters, projectStatus: value })}
                                        style={{ width: '100%' }}
                                    >
                                        <Option value="Active">Active</Option>
                                        <Option value="Inactive">Inactive</Option>
                                    </Select>
                                </div>
                            </Col>
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <div className="filter-item">
                                    <label>Allocation Status</label>
                                    <Select
                                        value={filters.allocationStatus}
                                        onChange={(value) => setFilters({ ...filters, allocationStatus: value })}
                                        style={{ width: '100%' }}
                                    >
                                        <Option value="Active">Active</Option>
                                        <Option value="Inactive">Inactive</Option>
                                    </Select>
                                </div>
                            </Col>
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <div className="filter-item">
                                    <label>Client Name</label>
                                    <Select
                                        value={filters.clientName}
                                        onChange={(value) => setFilters({ ...filters, clientName: value })}
                                        style={{ width: '100%' }}
                                    >
                                        <Option value="All">All</Option>
                                        <Option value="Healthfinder">Healthfinder</Option>
                                        <Option value="DXC">DXC</Option>
                                    </Select>
                                </div>
                            </Col>
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <div className="filter-item">
                                    <label>Billing Status</label>
                                    <Select
                                        value={filters.billingStatus}
                                        onChange={(value) => setFilters({ ...filters, billingStatus: value })}
                                        style={{ width: '100%' }}
                                    >
                                        <Option value="All">All</Option>
                                        <Option value="Billing">Billing</Option>
                                        <Option value="Non-Billing">Non-Billing</Option>
                                        <Option value="Bench">Bench</Option>
                                        <Option value="Training">Training</Option>
                                        <Option value="Presale">Presale</Option>
                                    </Select>
                                </div>
                            </Col>
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <div className="filter-item">
                                    <label>Year</label>
                                    <Select
                                        value={filters.year}
                                        onChange={(value) => setFilters({ ...filters, year: value })}
                                        style={{ width: '100%' }}
                                    >
                                        <Option value="2025">2025</Option>
                                        <Option value="2024">2024</Option>
                                    </Select>
                                </div>
                            </Col>
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <div className="filter-item">
                                    <label>Month</label>
                                    <Select
                                        value={filters.month}
                                        onChange={(value) => setFilters({ ...filters, month: value })}
                                        style={{ width: '100%' }}
                                    >
                                        <Option value="All">All</Option>
                                        <Option value="January">January</Option>
                                        <Option value="February">February</Option>
                                    </Select>
                                </div>
                            </Col>
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <div className="filter-item">
                                    <label>Employee Status</label>
                                    <Select
                                        value={filters.employeeStatus}
                                        onChange={(value) => setFilters({ ...filters, employeeStatus: value })}
                                        style={{ width: '100%' }}
                                    >
                                        <Option value="Active">Active</Option>
                                        <Option value="Inactive">Inactive</Option>
                                    </Select>
                                </div>
                            </Col>
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <div className="filter-item">
                                    <label>Duration</label>
                                    <RangePicker style={{ width: '100%' }} />
                                </div>
                            </Col>
                        </Row>
                    </div>
                )}
            </Card>

            {/* KPI Cards */}
            <div className="kpi-section">
                <div className="kpi-grid">
                    <Card className="kpi-card">
                        <div className="kpi-value">{kpiData.billableResources}</div>
                        <div className="kpi-label">BILLABLE RESOURCES</div>
                    </Card>
                    <Card className="kpi-card">
                        <div className="kpi-value">{kpiData.allocatedCount}</div>
                        <div className="kpi-label">ALLOCATED COUNT</div>
                    </Card>
                    <Card className="kpi-card">
                        <div className="kpi-value">{kpiData.billableCount}</div>
                        <div className="kpi-label">BILLABLE COUNT</div>
                    </Card>
                    <Card className="kpi-card">
                        <div className="kpi-value">{kpiData.avgProjectAllocation}%</div>
                        <div className="kpi-label">Average Project Allocation</div>
                    </Card>
                    <Card className="kpi-card">
                        <div className="kpi-value">{kpiData.avgBillingPercentage}%</div>
                        <div className="kpi-label">Average Billing Percentage</div>
                    </Card>
                </div>
            </div>

            {/* Charts and Tables Section */}
            <Row gutter={[16, 16]} className="charts-tables-section">
                {/* Left Column - Charts */}
                <Col xs={24} lg={12}>
                    <Card
                        className="chart-card"
                        title={
                            <div
                                className="collapsible-header"
                                onClick={() => setBillingStatusExpanded(!billingStatusExpanded)}
                            >
                                <span>No. of Allocations by Billing Status</span>
                                {billingStatusExpanded ? <UpOutlined /> : <DownOutlined />}
                            </div>
                        }
                    >
                        {billingStatusExpanded && (
                            <div className="chart-container">
                                <Doughnut data={billingStatusDonutData} options={billingStatusDonutOptions} />
                            </div>
                        )}
                    </Card>
                </Col>

                {/* Right Column - Bar Chart */}
                <Col xs={24} lg={12}>
                    <Card
                        className="chart-card"
                        title={
                            <div
                                className="collapsible-header"
                                onClick={() => setEmployeesByTierExpanded(!employeesByTierExpanded)}
                            >
                                <span>No. of Employees by Tier</span>
                                {employeesByTierExpanded ? <UpOutlined /> : <DownOutlined />}
                            </div>
                        }
                    >
                        {employeesByTierExpanded && (
                            <div className="chart-container">
                                <Bar data={employeesByTierBarData} options={employeesByTierBarOptions} />
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Project Table */}
            <Card
                className="table-card"
                title={
                    <div className="project-overview-header">
                        <span className="project-overview-title">Project Overview</span>
                        <div className="project-overview-actions">
                            {projectOverviewExpanded && (
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={handleCreateProject}
                                    className="create-project-btn"
                                >
                                    Create New Project
                                </Button>
                            )}
                            <div
                                className="collapsible-icon"
                                onClick={() => setProjectOverviewExpanded(!projectOverviewExpanded)}
                            >
                                {projectOverviewExpanded ? <UpOutlined /> : <DownOutlined />}
                            </div>
                        </div>
                    </div>
                }
            >
                {projectOverviewExpanded && (
                    <CustomTable
                        columns={projectColumns}
                        dataSource={projectData}
                        pagination={{
                            current: projectPagination.current,
                            pageSize: projectPagination.pageSize,
                            total: projectPagination.total,
                            showSizeChanger: true,
                            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} projects`,
                            onChange: (page, pageSize) => {
                                setProjectPagination(prev => ({ ...prev, current: page, pageSize }));
                                fetchProjects(page, pageSize);
                            },
                            onShowSizeChange: (current, size) => {
                                setProjectPagination(prev => ({ ...prev, current: 1, pageSize: size }));
                                fetchProjects(1, size);
                            },
                        }}
                        size="small"
                        scroll={{ x: 800 }}
                        loading={loadingProjects}
                        onRow={(record) => ({
                            onClick: () => handleProjectClick(record),
                            style: {
                                cursor: 'pointer',
                                backgroundColor: selectedProjectId === record.id ? '#e6f7ff' : 'transparent',
                            },
                        })}
                        rowClassName={(record) => selectedProjectId === record.id ? 'selected-project-row' : ''}
                    />
                )}
            </Card>

            {/* BY ALLOCATION Table */}
            <Card
                className="table-card"
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div
                            className="collapsible-header"
                            onClick={() => setByAllocationExpanded(!byAllocationExpanded)}
                            style={{ flex: 1 }}
                        >
                            <span>BY ALLOCATION</span>
                            {byAllocationExpanded ? <UpOutlined /> : <DownOutlined />}
                        </div>
                        {byAllocationExpanded && (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleAddAllocation}
                                size="small"
                                style={{ marginLeft: 16 }}
                            >
                                Add Allocation
                            </Button>
                        )}
                    </div>
                }
            >
                {byAllocationExpanded && (
                    <CustomTable
                        columns={allocationColumns}
                        dataSource={allocationData}
                        pagination={{
                            current: allocationPagination.current,
                            pageSize: allocationPagination.pageSize,
                            total: allocationPagination.total,
                            showSizeChanger: true,
                            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} allocations`,
                            onChange: (page, pageSize) => {
                                setAllocationPagination(prev => ({ ...prev, current: page, pageSize }));
                                if (selectedProjectId) {
                                    fetchProjectAllocations(selectedProjectId, page, pageSize);
                                }
                            },
                            onShowSizeChange: (current, size) => {
                                setAllocationPagination(prev => ({ ...prev, current: 1, pageSize: size }));
                                if (selectedProjectId) {
                                    fetchProjectAllocations(selectedProjectId, 1, size);
                                }
                            },
                        }}
                        scroll={{ x: 1200 }}
                        size="small"
                        loading={loadingAllocations}
                        onRow={(record) => ({
                            onClick: () => handleRowClick(record),
                            style: { cursor: 'pointer' },
                        })}
                    />
                )}
            </Card>

            {/* Bottom Section - Three Columns */}
            <Row gutter={[16, 16]} className="bottom-section">
                <Col xs={24} lg={8}>
                    <Card className="table-card" title="BY DESIGNATION">
                        <CustomTable
                            columns={designationColumns}
                            dataSource={designationData}
                            pagination={false}
                            size="small"
                            scroll={{ x: 800 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card className="chart-card" title="No. of Employee Accounts Managed by Track">
                        <div className="chart-container">
                            <Doughnut data={trackDonutData} options={trackDonutOptions} />
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card className="chart-card" title="No. of Employee Accounts Managed by Tech Stack">
                        <div className="chart-container">
                            <Bar data={techStackBarData} options={techStackBarOptions} />
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Create/Edit Project Modal */}
            <CustomModal
                title={isEditMode ? "Edit Project Details" : "Create New Project"}
                open={isCreateProjectModalVisible}
                onClose={handleCreateProjectCancel}
                width={800}
                buttons={[
                    {
                        text: 'Cancel',
                        type: 'default',
                        onClick: handleCreateProjectCancel,
                    },
                    {
                        text: isEditMode ? 'Update Details' : 'Create Project',
                        type: 'primary',
                        htmlType: 'submit',
                        onClick: () => {
                            form.submit();
                        },
                        loading: isSubmittingProject,
                    },
                ]}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateProjectSubmit}
                    initialValues={{
                        accountManager: filters.accountManager && filters.accountManager !== 'All'
                            ? filters.accountManager
                            : undefined,
                        status: 'Active',
                        billingType: undefined,
                        accountType: 'External',
                    }}
                >
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Project Name"
                                name="projectName"
                                rules={[
                                    { required: true, message: 'Project name is required' },
                                    { min: 3, message: 'Project name must be at least 3 characters' },
                                    { max: 200, message: 'Project name must not exceed 200 characters' },
                                ]}
                            >
                                <Input placeholder="Enter project name" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Status"
                                name="status"
                                rules={[{ required: true, message: 'Status is required' }]}
                            >
                                <Select placeholder="Select status">
                                    <Option value="Active">Active</Option>
                                    <Option value="Inactive">Inactive</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Project Type"
                                name="projectType"
                                rules={[{ required: true, message: 'Project type is required' }]}
                            >
                                <Select placeholder="Select project type">
                                    <Option value="Client">Client</Option>
                                    <Option value="Bench">Bench</Option>
                                    <Option value="Training">Training</Option>
                                    <Option value="POC">POC</Option>
                                    <Option value="Presale">Presale</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Account Type"
                                name="accountType"
                                rules={[{ required: true, message: 'Account type is required' }]}
                            >
                                <Select
                                    placeholder="Select account type"
                                    onChange={(value) => setAccountType(value)}
                                >
                                    <Option value="Internal">Internal</Option>
                                    <Option value="External">External</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Client Name"
                                name="clientName"
                                rules={[
                                    { min: 2, message: 'Client name must be at least 2 characters' },
                                    { max: 100, message: 'Client name must not exceed 100 characters' },
                                ]}
                            >
                                <Input placeholder="Enter client name" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Project End Date"
                                name="projectEndDate"
                                dependencies={['projectStartDate']}
                                rules={[
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            const startDate = getFieldValue('projectStartDate');
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
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Project Start Date"
                                name="projectStartDate"
                            >
                                <DatePicker style={{ width: '100%' }} placeholder="Select start date" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Billing"
                                name="billingType"
                                rules={[{ required: true, message: 'Billing type is required' }]}
                            >
                                <Select
                                    placeholder="Select billing type"
                                    onChange={(value) => setBillingType(value)}
                                >
                                    <Option value="Billing">Billing</Option>
                                    <Option value="Non-Billing">Non-Billing</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Account Manager"
                                name="accountManager"
                                rules={[{ required: true, message: 'Account manager is required' }]}
                            >
                                <Select placeholder="Select account manager" showSearch allowClear>
                                    <Option value="Randika Swaris">Randika Swaris</Option>
                                    {/* Add more account managers as needed */}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Team Size"
                                name="teamSize"
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
                    </Row>

                    {accountType === 'External' && (
                        <>
                            <Divider style={{ margin: '24px 0' }} />
                            <div style={{ marginBottom: 16, marginTop: 8 }}>
                                <h4 style={{ marginBottom: 16, fontFamily: 'Poppins', fontWeight: 600 }}>Client Details (Optional)</h4>
                            </div>

                            <Row gutter={16}>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        label="Client Contact Person"
                                        name="clientContact"
                                        rules={[
                                            { max: 100, message: 'Client contact must not exceed 100 characters' },
                                        ]}
                                    >
                                        <Input placeholder="Enter client contact person" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        label="Client Email"
                                        name="clientEmail"
                                        rules={[
                                            { type: 'email', message: 'Please enter a valid email address' },
                                        ]}
                                    >
                                        <Input placeholder="Enter client email" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        label="Client Phone"
                                        name="clientPhone"
                                    >
                                        <Input placeholder="Enter client phone number" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        label="Client Address"
                                        name="clientAddress"
                                        rules={[
                                            { max: 500, message: 'Client address must not exceed 500 characters' },
                                        ]}
                                    >
                                        <Input.TextArea rows={2} placeholder="Enter client address" />
                                    </Form.Item>
                                </Col>
                            </Row>

                        </>
                    )}

                    <Form.Item
                        label="Project Description"
                        name="description"
                    >
                        <Input.TextArea rows={4} placeholder="Enter project description" />
                    </Form.Item>
                </Form>
            </CustomModal>

            {/* Add Team Members Modal */}
            <CustomModal
                title="Add Team Members"
                open={isAddTeamMembersModalVisible}
                onClose={handleAddTeamMembersCancel}
                width={1200}
                buttons={[
                    {
                        text: 'Cancel',
                        type: 'default',
                        onClick: handleAddTeamMembersCancel,
                    },
                    {
                        text: 'Save',
                        type: 'primary',
                        onClick: handleTeamMembersSubmit,
                    },
                ]}
            >
                <Form form={teamMembersForm} layout="vertical">
                    <div style={{ marginBottom: 16 }}>
                        <strong>Project:</strong> {selectedProjectForTeam?.project || ''} |
                        <strong style={{ marginLeft: 16 }}>Team Size:</strong> {selectedProjectForTeam?.teamSize || 0} |
                        <strong style={{ marginLeft: 16 }}>Current Members:</strong> {teamMembersList.length}
                    </div>

                    {teamMembersList.map((member, index) => (
                        <div key={member.key} style={{ marginBottom: 24, padding: 16, border: '1px solid #f0f0f0', borderRadius: 4 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <strong>Member {index + 1}</strong>
                                {member.key.startsWith('new-') && (
                                    <Button
                                        type="link"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleRemoveTeamMemberRow(member.key)}
                                    >
                                        Remove
                                    </Button>
                                )}
                            </div>
                            <Row gutter={16}>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        label="Employee Name"
                                        name={[`members`, member.key, 'employeeName']}
                                        rules={[{ required: true, message: 'Employee name is required' }]}
                                        initialValue={member.employeeName}
                                    >
                                        <Select
                                            placeholder="Select employee"
                                            showSearch
                                            value={member.employeeName}
                                            onChange={(value) => handleMemberFieldChange(member.key, 'employeeName', value)}
                                            filterOption={(input, option) =>
                                                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                            }
                                        >
                                            {/* TODO: Replace with actual employee list from API */}
                                            <Option value="Akeel Aliyar">Akeel Aliyar</Option>
                                            <Option value="Amaniya Faizal">Amaniya Faizal</Option>
                                            <Option value="Anushka Wickramaratne">Anushka Wickramaratne</Option>
                                            <Option value="Avanthi Amunugama">Avanthi Amunugama</Option>
                                            <Option value="Chaminda Pragnarathne">Chaminda Pragnarathne</Option>
                                            <Option value="Chanka Sonnadara">Chanka Sonnadara</Option>
                                            <Option value="Charith Bandara">Charith Bandara</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        label="Project Name"
                                        name={[`members`, member.key, 'projectName']}
                                        initialValue={member.projectName}
                                    >
                                        <Input disabled />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        label="Project Allocated Date"
                                        name={[`members`, member.key, 'allocatedDate']}
                                        rules={[{ required: true, message: 'Allocated date is required' }]}
                                        initialValue={member.allocatedDate}
                                    >
                                        <DatePicker
                                            style={{ width: '100%' }}
                                            placeholder="Select allocated date"
                                            value={member.allocatedDate}
                                            onChange={(date) => handleMemberFieldChange(member.key, 'allocatedDate', date)}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        label="Project Deallocated Date"
                                        name={[`members`, member.key, 'deallocatedDate']}
                                        initialValue={member.deallocatedDate}
                                    >
                                        <DatePicker
                                            style={{ width: '100%' }}
                                            placeholder="Select deallocated date"
                                            value={member.deallocatedDate}
                                            onChange={(date) => handleMemberFieldChange(member.key, 'deallocatedDate', date)}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        label="Billing Status"
                                        name={[`members`, member.key, 'billingStatus']}
                                        initialValue={member.billingStatus}
                                    >
                                        <Select
                                            placeholder="Select billing status"
                                            onChange={(value) => handleMemberFieldChange(member.key, 'billingStatus', value)}
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
                                        name={[`members`, member.key, 'billingPercentage']}
                                        rules={[
                                            { required: true, message: 'Billing percentage is required' },
                                            { type: 'number', min: 0, max: 100, message: 'Must be between 0 and 100' },
                                        ]}
                                        initialValue={member.billingPercentage}
                                    >
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            placeholder="Enter billing percentage"
                                            min={0}
                                            max={100}
                                            onChange={(value) => handleMemberFieldChange(member.key, 'billingPercentage', value)}
                                            formatter={value => `${value}%`}
                                            parser={value => value.replace('%', '')}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        label="Project Allocation"
                                        name={[`members`, member.key, 'projectAllocation']}
                                        rules={[
                                            { required: true, message: 'Project allocation is required' },
                                            { type: 'number', min: 0, max: 100, message: 'Must be between 0 and 100' },
                                        ]}
                                        initialValue={member.projectAllocation}
                                    >
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            placeholder="Enter project allocation"
                                            min={0}
                                            max={100}
                                            value={member.projectAllocation}
                                            onChange={(value) => handleMemberFieldChange(member.key, 'projectAllocation', value)}
                                            formatter={value => `${value}%`}
                                            parser={value => value.replace('%', '')}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        label="Duration (Days)"
                                        name={[`members`, member.key, 'duration']}
                                        rules={[
                                            { required: true, message: 'Duration is required' },
                                            { type: 'number', min: 0, message: 'Must be a positive number' },
                                        ]}
                                        initialValue={member.duration}
                                    >
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            placeholder="Enter duration in days"
                                            min={0}
                                            value={member.duration}
                                            onChange={(value) => handleMemberFieldChange(member.key, 'duration', value)}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        label="Status"
                                        name={[`members`, member.key, 'status']}
                                        initialValue={member.status}
                                    >
                                        <Select
                                            placeholder="Select status"
                                            onChange={(value) => handleMemberFieldChange(member.key, 'status', value)}
                                        >
                                            <Option value="Active">Active</Option>
                                            <Option value="Inactive">Inactive</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>
                    ))}

                    <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={handleAddTeamMemberRow}
                        block
                        style={{ marginTop: 16 }}
                    >
                        Add Member
                    </Button>
                </Form>
            </CustomModal>

            {/* User Allocations Modal */}
            <CustomModal
                title={`${selectedEmployee ? selectedEmployee + "'s" : "User"} Project Allocations`}
                open={isUserAllocationModalVisible}
                onClose={handleUserAllocationCancel}
                width={1200}
                buttons={[
                    {
                        text: 'Cancel',
                        type: 'default',
                        onClick: handleUserAllocationCancel,
                    },
                    {
                        text: 'Save',
                        type: 'primary',
                        onClick: handleUserAllocationsSubmit,
                    },
                ]}
            >
                <Form form={userAllocationsForm} layout="vertical">
                    <div style={{ marginBottom: 16 }}>
                        <strong>Employee:</strong> {selectedEmployee || ''} |
                        <strong style={{ marginLeft: 16 }}>Total Allocations:</strong> {userAllocationsList.length}
                    </div>

                    {userAllocationsList.map((allocation, index) => (
                        <div key={allocation.key} style={{ marginBottom: 24, padding: 16, border: '1px solid #f0f0f0', borderRadius: 4 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <strong>Allocation {index + 1}</strong>
                                {!allocation.isExisting && (
                                    <Button
                                        type="link"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleRemoveUserAllocationRow(allocation.key)}
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
                                        initialValue={allocation.projectName}
                                    >
                                        <Select
                                            placeholder="Select project"
                                            showSearch
                                            value={allocation.projectName}
                                            onChange={(value) => handleUserAllocationFieldChange(allocation.key, 'projectName', value)}
                                            disabled={allocation.isExisting}
                                            filterOption={(input, option) =>
                                                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                            }
                                        >
                                            {/* TODO: Replace with actual project list from API */}
                                            <Option value="Bench">Bench</Option>
                                            <Option value="DXC">DXC</Option>
                                            <Option value="Healthfinder">Healthfinder</Option>
                                            <Option value="Ideapoint">Ideapoint</Option>
                                            <Option value="MillionSpaces">MillionSpaces</Option>
                                            <Option value="Presale">Presale</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        label="Project Allocated Date"
                                        name={[`allocations`, allocation.key, 'allocatedDate']}
                                        rules={[{ required: true, message: 'Allocated date is required' }]}
                                        initialValue={allocation.allocatedDate}
                                    >
                                        <DatePicker
                                            style={{ width: '100%' }}
                                            placeholder="Select allocated date"
                                            value={allocation.allocatedDate}
                                            onChange={(date) => handleUserAllocationFieldChange(allocation.key, 'allocatedDate', date)}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        label="Project Deallocated Date"
                                        name={[`allocations`, allocation.key, 'deallocatedDate']}
                                        initialValue={allocation.deallocatedDate}
                                    >
                                        <DatePicker
                                            style={{ width: '100%' }}
                                            placeholder="Select deallocated date"
                                            value={allocation.deallocatedDate}
                                            onChange={(date) => handleUserAllocationFieldChange(allocation.key, 'deallocatedDate', date)}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        label="Billing Status"
                                        name={[`allocations`, allocation.key, 'billingStatus']}
                                        initialValue={allocation.billingStatus}
                                    >
                                        <Select
                                            placeholder="Select billing status"
                                            value={allocation.billingStatus}
                                            onChange={(value) => handleUserAllocationFieldChange(allocation.key, 'billingStatus', value)}
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
                                        initialValue={allocation.billingPercentage}
                                    >
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            placeholder="Enter billing percentage"
                                            min={0}
                                            max={100}
                                            value={allocation.billingPercentage}
                                            onChange={(value) => handleUserAllocationFieldChange(allocation.key, 'billingPercentage', value)}
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
                                        initialValue={allocation.projectAllocation}
                                    >
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            placeholder="Enter project allocation"
                                            min={0}
                                            max={100}
                                            value={allocation.projectAllocation}
                                            onChange={(value) => handleUserAllocationFieldChange(allocation.key, 'projectAllocation', value)}
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
                                        initialValue={allocation.duration}
                                    >
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            placeholder="Enter duration in days"
                                            min={0}
                                            value={allocation.duration}
                                            onChange={(value) => handleUserAllocationFieldChange(allocation.key, 'duration', value)}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        label="Status"
                                        name={[`allocations`, allocation.key, 'status']}
                                        initialValue={allocation.status}
                                    >
                                        <Select
                                            placeholder="Select status"
                                            value={allocation.status}
                                            onChange={(value) => handleUserAllocationFieldChange(allocation.key, 'status', value)}
                                        >
                                            <Option value="Active">Active</Option>
                                            <Option value="Inactive">Inactive</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>
                    ))}

                    <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={handleAddUserAllocationRow}
                        block
                        style={{ marginTop: 16 }}
                    >
                        Add New Allocation
                    </Button>
                </Form>
            </CustomModal>

            {/* Add/Edit Allocation Modal */}
            <CustomModal
                title={isEditAllocationMode ? 'Edit Allocation' : 'Add New Allocation'}
                open={isAllocationModalVisible}
                onClose={() => {
                    setIsAllocationModalVisible(false);
                    allocationForm.resetFields();
                    setSelectedAllocation(null);
                    setIsEditAllocationMode(false);
                }}
                width={700}
                buttons={[
                    {
                        text: 'Cancel',
                        type: 'default',
                        onClick: () => {
                            setIsAllocationModalVisible(false);
                            allocationForm.resetFields();
                            setSelectedAllocation(null);
                            setIsEditAllocationMode(false);
                        },
                    },
                    {
                        text: isEditAllocationMode ? 'Update' : 'Add',
                        type: 'primary',
                        onClick: handleAllocationSubmit,
                        loading: isSubmittingAllocation,
                    },
                ]}
            >
                <Form form={allocationForm} layout="vertical">
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Resource (Employee)"
                                name="resource_id"
                                rules={[{ required: true, message: 'Resource is required' }]}
                            >
                                <Select
                                    placeholder="Select resource"
                                    showSearch
                                    optionFilterProp="children"
                                    disabled={isEditAllocationMode}
                                    filterOption={(input, option) =>
                                        (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                >
                                    {resourcesList.length > 0 ? (
                                        resourcesList.map((resource) => (
                                            <Option key={resource.id} value={resource.id}>
                                                {resource.name}
                                            </Option>
                                        ))
                                    ) : (
                                        <Option disabled value="">
                                            Loading resources...
                                        </Option>
                                    )}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Project"
                                name="project_id"
                                rules={[{ required: true, message: 'Project is required' }]}
                            >
                                <Select
                                    placeholder="Select project"
                                    showSearch
                                    optionFilterProp="children"
                                    allowClear
                                    disabled={isEditAllocationMode}
                                    filterOption={(input, option) =>
                                        (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                >
                                    {projectData.length > 0 ? (
                                        projectData.map((project) => (
                                            <Option key={project.id} value={project.id}>
                                                {project.project_name || project.project}
                                            </Option>
                                        ))
                                    ) : (
                                        <Option disabled value="">
                                            Loading projects...
                                        </Option>
                                    )}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Allocation Percentage"
                                name="allocation_percentage"
                                rules={[
                                    { required: true, message: 'Allocation percentage is required' },
                                    { type: 'number', min: 0, max: 100, message: 'Must be between 0 and 100' },
                                ]}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    placeholder="Enter allocation percentage"
                                    min={0}
                                    max={100}
                                    formatter={value => `${value}%`}
                                    parser={value => value.replace('%', '')}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Billing Percentage"
                                name="billing_percentage"
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
                                    formatter={value => `${value}%`}
                                    parser={value => value.replace('%', '')}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Start Date"
                                name="start_date"
                                rules={[{ required: true, message: 'Start date is required' }]}
                            >
                                <DatePicker
                                    style={{ width: '100%' }}
                                    placeholder="Select start date"
                                    format="YYYY-MM-DD"
                                />
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
                                <DatePicker
                                    style={{ width: '100%' }}
                                    placeholder="Select end date (optional)"
                                    format="YYYY-MM-DD"
                                />
                            </Form.Item>
                        </Col>
                        {isEditAllocationMode && (
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    label="Active"
                                    name="is_active"
                                    valuePropName="checked"
                                    initialValue={true}
                                >
                                    <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                                </Form.Item>
                            </Col>
                        )}
                        <Col xs={24}>
                            <Form.Item
                                label="Notes"
                                name="notes"
                            >
                                <Input.TextArea
                                    rows={3}
                                    placeholder="Enter allocation notes (optional)"
                                    maxLength={500}
                                    showCount
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </CustomModal>

            {/* Resource Allocations Modal */}
            <CustomModal
                title={`Project Allocations - ${selectedResourceName}`}
                open={isResourceAllocationsModalVisible}
                onClose={() => {
                    setIsResourceAllocationsModalVisible(false);
                    setResourceAllocationsData([]);
                    setSelectedResourceId(null);
                    setSelectedResourceName('');
                }}
                width={1200}
                footer={null}
            >
                <CustomTable
                    columns={[
                        {
                            title: 'Project',
                            dataIndex: 'project',
                            key: 'project',
                            width: 200,
                        },
                        {
                            title: 'Project Allocated Date',
                            dataIndex: 'allocatedDate',
                            key: 'allocatedDate',
                            width: 160,
                        },
                        {
                            title: 'Project Deallocated Date',
                            dataIndex: 'deallocatedDate',
                            key: 'deallocatedDate',
                            width: 180,
                        },
                        {
                            title: 'Billing Status',
                            dataIndex: 'billingStatus',
                            key: 'billingStatus',
                            width: 130,
                        },
                        {
                            title: 'Billing Percentage',
                            dataIndex: 'billingPercentage',
                            key: 'billingPercentage',
                            width: 140,
                        },
                        {
                            title: 'Project Allocation',
                            dataIndex: 'projectAllocation',
                            key: 'projectAllocation',
                            width: 140,
                        },
                        {
                            title: 'Duration (Days)',
                            dataIndex: 'duration',
                            key: 'duration',
                            width: 130,
                        },
                        {
                            title: 'Status',
                            dataIndex: 'status',
                            key: 'status',
                            width: 100,
                        },
                    ]}
                    dataSource={resourceAllocationsData}
                    pagination={false}
                    scroll={{ x: 1000 }}
                    size="small"
                    loading={loadingResourceAllocations}
                />
            </CustomModal>
        </div>
    );
};

export default AccountManagerReport;
