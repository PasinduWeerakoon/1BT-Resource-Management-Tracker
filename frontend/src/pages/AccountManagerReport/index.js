import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { projectsService, clientsService, allocationsService, resourcesService, accountManagersService, reportsService } from '@api';
import { showErrorToast, showSuccessToast, showWarningToast } from '@utils/toast.utils';
import '@styles/pages/AccountManagerReport.scss';

const { Option } = Select;

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
    const [accountManagersList, setAccountManagersList] = useState([]);
    const [loadingAccountManagers, setLoadingAccountManagers] = useState(false);
    const [projectsForFilter, setProjectsForFilter] = useState([]);
    const [loadingProjectsForFilter, setLoadingProjectsForFilter] = useState(false);
    const [reportData, setReportData] = useState({
        summary: {
            billableResources: 0,
            allocatedCount: 0,
            billableCount: 0,
            averageProjectAllocation: 0,
            averageBillingPercentage: 0,
        },
        charts: {
            allocationsByBillingStatus: {},
            employeesByTier: {},
            employeesByTrack: {},
            employeesByTechStack: {},
        },
        projects: { data: [], pagination: {} },
        allocations: { data: [], pagination: {} },
        designations: { data: [] },
    });
    const [loadingReport, setLoadingReport] = useState(false);

    // Refs to prevent duplicate API calls
    const fetchProjectsInProgressRef = useRef(false);
    const fetchClientsInProgressRef = useRef(false);
    const fetchResourcesInProgressRef = useRef(false);
    const fetchAllocationsInProgressRef = useRef(false);
    const fetchAccountManagersInProgressRef = useRef(false);
    const fetchProjectsForFilterInProgressRef = useRef(false);
    const fetchReportInProgressRef = useRef(false);

    const [filters, setFilters] = useState({
        accountManager: 'All',
        projectName: 'All',
        projectStatus: 'Active',
        allocationStatus: 'Active',
        clientName: 'All',
        billingStatus: 'All',
    });

    // Default filter values for comparison
    const defaultFilters = {
        accountManager: 'All',
        projectName: 'All',
        projectStatus: 'Active',
        allocationStatus: 'Active',
        clientName: 'All',
        billingStatus: 'All',
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

    // Get selected Account Manager name for display
    const selectedAccountManagerName = useMemo(() => {
        if (filters.accountManager) {
            return filters.accountManager; // Returns "All" or the actual Account Manager name
        }
        return null;
    }, [filters.accountManager]);

    // Get selected project name for display
    const displayProjectName = useMemo(() => {
        if (selectedProjectId) {
            const project = projectData.find(p => p.id === selectedProjectId);
            return project ? (project.project || project.project_name || 'N/A') : null;
        }
        return null;
    }, [selectedProjectId, projectData]);

    // Fetch clients list for client lookup and filters
    useEffect(() => {
        const fetchClients = async () => {
            // Prevent duplicate calls
            if (fetchClientsInProgressRef.current) {
                return;
            }

            try {
                fetchClientsInProgressRef.current = true;
                const response = await clientsService.getAll({ limit: 100 });
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
            } finally {
                fetchClientsInProgressRef.current = false;
            }
        };

        fetchClients();
    }, []);

    // Fetch account managers from dedicated API
    useEffect(() => {
        const fetchAccountManagers = async () => {
            // Prevent duplicate calls
            if (fetchAccountManagersInProgressRef.current) {
                return;
            }

            try {
                fetchAccountManagersInProgressRef.current = true;
                setLoadingAccountManagers(true);
                const response = await accountManagersService.getAll();
                let accountManagersData = [];

                if (response) {
                    // Handle different response structures
                    if (Array.isArray(response.data)) {
                        accountManagersData = response.data;
                    } else if (response.data && Array.isArray(response.data)) {
                        accountManagersData = response.data;
                    } else if (Array.isArray(response)) {
                        accountManagersData = response;
                    }
                }

                // Transform to simple list for filter dropdown
                // API returns: {id, employee_id, name, email, designation, track, tier, project_count, resource_count}
                const accountManagers = accountManagersData
                    .map(am => ({
                        id: am.id,
                        name: am.name,
                        email: am.email,
                        employee_id: am.employee_id,
                        designation: am.designation,
                        track: am.track,
                        tier: am.tier,
                        project_count: am.project_count,
                        resource_count: am.resource_count,
                    }))
                    .filter(am => am.id && am.name); // Filter out invalid entries

                setAccountManagersList(accountManagers);
            } catch (error) {
                console.error('Failed to fetch account managers:', error);
                showErrorToast('Failed to load account managers');
            } finally {
                setLoadingAccountManagers(false);
                fetchAccountManagersInProgressRef.current = false;
            }
        };

        fetchAccountManagers();
    }, []);

    // Fetch projects for filter dropdown
    useEffect(() => {
        const fetchProjectsForFilter = async () => {
            // Prevent duplicate calls
            if (fetchProjectsForFilterInProgressRef.current) {
                return;
            }

            try {
                fetchProjectsForFilterInProgressRef.current = true;
                setLoadingProjectsForFilter(true);
                const response = await projectsService.getAll({ limit: 100 });
                let projectsData = [];

                if (response) {
                    // Handle different response structures
                    if (Array.isArray(response.data)) {
                        projectsData = response.data;
                    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
                        projectsData = response.data.data;
                    } else if (response.data && Array.isArray(response.data)) {
                        projectsData = response.data;
                    } else if (Array.isArray(response)) {
                        projectsData = response;
                    }
                }

                // Transform to simple list for filter dropdown
                const projectsList = projectsData
                    .map(project => ({
                        id: project.id,
                        name: project.project_name || project.name,
                    }))
                    .filter(project => project.id && project.name); // Filter out invalid entries

                setProjectsForFilter(projectsList);
            } catch (error) {
                console.error('Failed to fetch projects for filter:', error);
                showErrorToast('Failed to load projects');
            } finally {
                setLoadingProjectsForFilter(false);
                fetchProjectsForFilterInProgressRef.current = false;
            }
        };

        fetchProjectsForFilter();
    }, []);

    // Fetch comprehensive account manager report
    const fetchAccountManagerReport = async () => {
        // Prevent duplicate calls
        if (fetchReportInProgressRef.current) {
            return;
        }

        try {
            fetchReportInProgressRef.current = true;
            setLoadingReport(true);
            setLoadingProjects(true);
            setLoadingAllocations(true);

            // Build query parameters from filters
            const queryParams = {};

            // Account Manager ID
            if (filters.accountManager && filters.accountManager !== 'All') {
                const selectedAM = accountManagersList.find(am => am.name === filters.accountManager);
                if (selectedAM) {
                    queryParams.account_manager_id = selectedAM.id;
                }
            }

            // Project ID (from filter or selected project)
            if (selectedProjectId) {
                queryParams.project_id = selectedProjectId;
            } else if (filters.projectName && filters.projectName !== 'All') {
                const selectedProject = projectsForFilter.find(p => p.name === filters.projectName);
                if (selectedProject) {
                    queryParams.project_id = selectedProject.id;
                }
            }

            // Project Status
            if (filters.projectStatus && filters.projectStatus !== 'All') {
                queryParams.project_status = filters.projectStatus;
            }

            // Allocation Status
            if (filters.allocationStatus && filters.allocationStatus !== 'All') {
                queryParams.allocation_status = filters.allocationStatus;
            }

            // Client ID
            if (filters.clientName && filters.clientName !== 'All') {
                const selectedClient = clientsList.find(c => c.client_name === filters.clientName);
                if (selectedClient) {
                    queryParams.client_id = selectedClient.id;
                }
            }

            // Billing Status
            if (filters.billingStatus && filters.billingStatus !== 'All') {
                queryParams.billing_status = filters.billingStatus;
            }

            // Pagination (use allocation pagination if project is selected, otherwise project pagination)
            if (selectedProjectId) {
                queryParams.page = allocationPagination.current;
                queryParams.limit = allocationPagination.pageSize;
            } else {
                queryParams.page = projectPagination.current;
                queryParams.limit = projectPagination.pageSize;
            }

            const response = await reportsService.getAccountManager(queryParams);

            if (response) {
                // Handle response structure
                const data = response.data || response;

                setReportData({
                    summary: data.summary || {
                        billableResources: 0,
                        allocatedCount: 0,
                        billableCount: 0,
                        averageProjectAllocation: 0,
                        averageBillingPercentage: 0,
                    },
                    charts: data.charts || {
                        allocationsByBillingStatus: {},
                        employeesByTier: {},
                        employeesByTrack: {},
                        employeesByTechStack: {},
                    },
                    projects: data.projects || { data: [], pagination: {} },
                    allocations: data.allocations || { data: [], pagination: {} },
                    designations: data.designations || { data: [] },
                });

                // Update project data and pagination
                if (data.projects && data.projects.data) {
                    // Get allocations data to calculate counts
                    const allocationsData = data.allocations?.data || [];

                    const transformedProjects = data.projects.data.map((project) => {
                        // Calculate allocated resource count (unique resources allocated to this project)
                        const projectAllocations = allocationsData.filter(alloc => alloc.project_id === project.id);
                        const uniqueResourceIds = new Set(projectAllocations.map(alloc => alloc.resource_id).filter(Boolean));
                        const allocatedResourceCount = uniqueResourceIds.size;

                        // Calculate billing count (resources with billing_percentage > 0)
                        const billingResources = projectAllocations.filter(alloc => {
                            const billingPct = parseFloat(alloc.billing_percentage) || 0;
                            return billingPct > 0;
                        });
                        const uniqueBillingResourceIds = new Set(billingResources.map(alloc => alloc.resource_id).filter(Boolean));
                        const billingCount = uniqueBillingResourceIds.size;

                        return {
                            key: project.id,
                            id: project.id,
                            project: project.project || project.project_name || project.name || 'N/A',
                            customer: project.customer || project.client_name || 'N/A',
                            projectType: project.project_type || 'N/A',
                            teamSize: project.team_size ? (typeof project.team_size === 'string' ? parseInt(project.team_size, 10) : project.team_size) : 0,
                            status: project.status || 'N/A',
                            billingStatus: project.billing_status || 'N/A',
                            accountManagerId: project.account_manager_id,
                            accountManagerName: project.account_manager_name || 'N/A',
                            // New fields
                            allocatedResourceCount: project.allocated_resource_count !== undefined ? project.allocated_resource_count : allocatedResourceCount,
                            billingCount: project.billing_count !== undefined ? project.billing_count : billingCount,
                            // Keep additional fields for edit functionality
                            project_name: project.project || project.project_name,
                            project_code: project.project_code,
                            client_id: project.client_id,
                            is_billable: project.billing_status === 'Billing',
                            start_date: project.start_date,
                            end_date: project.end_date,
                            description: project.description,
                            project_type: project.project_type,
                        };
                    });

                    setProjectData(transformedProjects);
                    setProjectPagination({
                        current: data.projects.pagination?.page || projectPagination.current,
                        pageSize: data.projects.pagination?.limit || projectPagination.pageSize,
                        total: data.projects.pagination?.total || 0,
                    });
                }

                // Update allocation data and pagination ONLY if a project is selected
                // If no project is selected, clear the allocation data
                if (selectedProjectId && data.allocations && data.allocations.data) {
                    const transformedAllocations = data.allocations.data.map((allocation) => {
                        const allocationPercentage = parseFloat(allocation.allocation_percentage) || 0;
                        const billingPercentage = parseFloat(allocation.billing_percentage) || 0;
                        const billingStatus = billingPercentage > 0 ? 'Billing' : 'Non-Billing';

                        return {
                            key: allocation.id,
                            id: allocation.id,
                            resource_id: allocation.resource_id,
                            resource_name: allocation.resource_name || 'N/A',
                            project_id: allocation.project_id,
                            project_name: allocation.project_name || 'N/A',
                            project: allocation.project_name || 'N/A',
                            allocatedDate: allocation.start_date ? dayjs(allocation.start_date).format('DD MMM YYYY') : '',
                            deallocatedDate: allocation.end_date ? dayjs(allocation.end_date).format('DD MMM YYYY') : '',
                            billingStatus: billingStatus,
                            billingPercentage: billingPercentage ? `${billingPercentage.toFixed(2)}%` : '0.00%',
                            projectAllocation: allocationPercentage ? `${allocationPercentage.toFixed(2)}%` : '0.00%',
                            duration: allocation.duration || 0,
                            status: allocation.is_active ? 'Active' : 'Inactive',
                        };
                    });

                    setAllocationData(transformedAllocations);
                    setAllocationPagination({
                        current: data.allocations.pagination?.page || allocationPagination.current,
                        pageSize: data.allocations.pagination?.limit || allocationPagination.pageSize,
                        total: data.allocations.pagination?.total || 0,
                    });
                } else {
                    // Clear allocation data when no project is selected
                    setAllocationData([]);
                    setAllocationPagination({
                        current: 1,
                        pageSize: allocationPagination.pageSize,
                        total: 0,
                    });
                }
            }
        } catch (error) {
            console.error('Failed to fetch account manager report:', error);
            showErrorToast('Failed to load account manager report');
        } finally {
            setLoadingReport(false);
            setLoadingProjects(false);
            setLoadingAllocations(false);
            fetchReportInProgressRef.current = false;
        }
    };

    // Fetch report when filters change
    useEffect(() => {
        fetchAccountManagerReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        filters.accountManager,
        filters.projectName,
        filters.projectStatus,
        filters.allocationStatus,
        filters.clientName,
        filters.billingStatus,
        // Removed selectedProjectId - don't refetch report when project is selected
        // Allocations are fetched separately via fetchProjectAllocations when clicking a project row
        projectPagination.current,
        projectPagination.pageSize,
        // Removed allocationPagination - allocations pagination is handled separately
    ]);

    // Fetch projects from API
    const fetchProjects = async (page = 1, limit = 10) => {
        // Prevent duplicate calls
        if (fetchProjectsInProgressRef.current) {
            return;
        }

        try {
            fetchProjectsInProgressRef.current = true;
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
            fetchProjectsInProgressRef.current = false;
        }
    };

    // Note: Projects are now fetched via fetchAccountManagerReport which is called when filters change

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
    const handleAddTeamMembers = async (project) => {
        setSelectedProjectForTeam(project);
        setIsAddTeamMembersModalVisible(true);

        // Show loading state
        setTeamMembersList([]);

        try {
            // Call the allocations API with project_id
            const response = await allocationsService.getAll({
                project_id: project.id,
                page: 1,
                limit: 100, // Get all allocations for this project
            });

            console.log('Allocations API response for project:', response);

            // Handle response structure after interceptor transformation
            let allocationsData = [];

            if (response) {
                // Check if response.data has data array (pagination format)
                if (response.data && Array.isArray(response.data)) {
                    allocationsData = response.data;
                }
                // Check if response.data has nested data structure
                else if (response.data && response.data.data && Array.isArray(response.data.data)) {
                    allocationsData = response.data.data;
                }
                // Check if response is directly an array
                else if (Array.isArray(response)) {
                    allocationsData = response;
                }
                // Check if response.data is a single object (wrap it in array)
                else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data) && response.data.id) {
                    allocationsData = [response.data];
                }
            }

            console.log('Parsed allocations data:', allocationsData);

            // Transform allocations data to match modal format
            // First, fetch resource names if missing
            const transformedMembers = await Promise.all(allocationsData.map(async (allocation, index) => {
                // Parse dates
                let allocatedDate = undefined;
                let deallocatedDate = undefined;
                if (allocation.start_date) {
                    allocatedDate = dayjs(allocation.start_date);
                }
                if (allocation.end_date) {
                    deallocatedDate = dayjs(allocation.end_date);
                }

                // Handle allocation_percentage and billing_percentage as strings or numbers
                const allocationPercentage = typeof allocation.allocation_percentage === 'string'
                    ? parseFloat(allocation.allocation_percentage)
                    : (allocation.allocation_percentage || 0);
                const billingPercentage = typeof allocation.billing_percentage === 'string'
                    ? parseFloat(allocation.billing_percentage)
                    : (allocation.billing_percentage || 0);

                // Determine billing status based on project_type
                let billingStatus = 'Non-Billing';
                if (allocation.project_type === 'Client' || allocation.project_is_billable) {
                    billingStatus = 'Billing';
                } else if (allocation.project_type === 'Bench') {
                    billingStatus = 'Bench';
                } else if (allocation.project_type === 'Pre-Sales' || allocation.project_type === 'Presale' || allocation.project_type === 'Pre-Sale') {
                    billingStatus = 'Presale';
                } else if (allocation.project_type === 'Training') {
                    billingStatus = 'Training';
                }

                // Calculate duration in days
                let duration = 0;
                if (allocation.start_date) {
                    const startDate = dayjs(allocation.start_date);
                    const endDate = allocation.end_date ? dayjs(allocation.end_date) : dayjs();
                    duration = endDate.diff(startDate, 'day');
                }

                // Get resource name - try multiple sources, or fetch if missing
                let resourceName = allocation.resource_name ||
                    allocation.employeeName ||
                    allocation.name;

                // If resource name is missing and we have resource_id, try to fetch it
                if (!resourceName && allocation.resource_id) {
                    // First check if it's in the resourcesList
                    const resource = resourcesList.find(r => r.id === allocation.resource_id);
                    if (resource) {
                        resourceName = resource.name;
                    } else {
                        // Try to fetch from API
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

                resourceName = resourceName || 'N/A';

                return {
                    key: `existing-${allocation.id || index}`,
                    id: allocation.id,
                    resource_id: allocation.resource_id,
                    employeeName: resourceName,
                    employeeId: allocation.resource_id, // Store resource ID for Select value
                    projectName: allocation.project_name || project.project,
                    allocatedDate: allocatedDate,
                    deallocatedDate: deallocatedDate,
                    billingStatus: billingStatus,
                    billingPercentage: billingPercentage,
                    projectAllocation: allocationPercentage,
                    duration: duration,
                    status: allocation.is_active !== undefined ? (allocation.is_active ? 'Active' : 'Inactive') : (allocation.status || 'Active'),
                    isExisting: true, // Mark as existing allocation
                };
            }));

            setTeamMembersList(transformedMembers);

            if (transformedMembers.length === 0) {
                showWarningToast('No allocations found for this project');
            }
        } catch (error) {
            console.error('Failed to fetch project allocations:', error);
            showErrorToast(error?.response?.data?.message || error?.message || 'Failed to load project allocations');
            setTeamMembersList([]);
        }
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
            id: undefined,
            resource_id: undefined,
            employeeId: undefined, // For Select value
            employeeName: undefined,
            projectName: selectedProjectForTeam?.project || '',
            allocatedDate: undefined,
            deallocatedDate: undefined,
            billingStatus: 'Billing',
            billingPercentage: 0,
            projectAllocation: 0,
            duration: 0,
            status: 'Active',
            isExisting: false, // Mark as new member
        };
        setTeamMembersList([...teamMembersList, newMember]);
    };

    const handleMemberFieldChange = (memberKey, field, value) => {
        setTeamMembersList(teamMembersList.map(member => {
            if (member.key === memberKey) {
                const updatedMember = { ...member, [field]: value };

                // If employeeName is changed (value is resource_id), also update resource_id and employeeName
                if (field === 'employeeName' && value) {
                    const selectedResource = resourcesList.find(r => r.id === value);
                    if (selectedResource) {
                        updatedMember.resource_id = selectedResource.id;
                        updatedMember.employeeId = selectedResource.id;
                        updatedMember.employeeName = selectedResource.name;
                    }
                }

                // Recalculate duration if dates change
                if (field === 'allocatedDate' || field === 'deallocatedDate') {
                    if (updatedMember.allocatedDate) {
                        const startDate = dayjs(updatedMember.allocatedDate);
                        const endDate = updatedMember.deallocatedDate ? dayjs(updatedMember.deallocatedDate) : dayjs();
                        updatedMember.duration = endDate.diff(startDate, 'day');
                    }
                }

                return updatedMember;
            }
            return member;
        }));
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

            // Validate required fields
            if (!values.projectName) {
                showErrorToast('Project name is required');
                setIsSubmittingProject(false);
                return;
            }

            if (!values.accountManager) {
                showErrorToast('Account manager is required');
                setIsSubmittingProject(false);
                return;
            }

            // Handle client_id - required only for External projects
            let client_id = null;
            if (values.accountType === 'External') {
                if (values.clientName) {
                    // clientName is now the client ID from the dropdown
                    client_id = values.clientName;

                    // Verify client exists in the list
                    const selectedClient = clientsList.find(client => client.id === client_id);
                    if (!selectedClient) {
                        showErrorToast('Selected client not found');
                        setIsSubmittingProject(false);
                        return;
                    }
                } else {
                    showErrorToast('Client is required for External projects');
                    setIsSubmittingProject(false);
                    return;
                }
            }

            // Map project type - API expects: Client|Bench|Training|POC|Presale|Research
            const projectTypeMap = {
                'Client': 'Client',
                'Bench': 'Bench',
                'Training': 'Training',
                'POC': 'POC',
                'Presale': 'Presale',
            };

            const project_type = projectTypeMap[values.projectType] || 'Client';

            // Map status - API expects: Active|On Hold|Completed|Cancelled
            const statusMap = {
                'Active': 'Active',
                'Inactive': 'On Hold',
                'On Hold': 'On Hold',
                'Completed': 'Completed',
                'Cancelled': 'Cancelled',
            };
            const status = statusMap[values.status] || 'Active';

            // Prepare API payload according to API specification
            const projectPayload = {
                project_name: values.projectName,
                project_code: values.projectCode || '', // Optional
                client_id: client_id, // Required only for External projects
                project_type: project_type, // Client|Bench|Training|POC|Presale|Research
                account_type: values.accountType || 'External', // Internal|External
                account_manager: values.accountManager, // Required string
                account_reg_sales_owner: values.accountRegSalesOwner || '', // Optional string
                team_size: values.teamSize || 1, // Number, default 1
                billing_type: values.billingType || 'Billing', // Billing|Non-Billing
                budget: values.budget || 0, // Number, default 0
                status: status, // Active|On Hold|Completed|Cancelled
                start_date: values.projectStartDate ? values.projectStartDate.format('YYYY-MM-DD') : null,
                end_date: values.projectEndDate ? values.projectEndDate.format('YYYY-MM-DD') : null,
                description: values.description || '',
            };

            // Clean up payload: remove empty optional fields, but keep required fields
            // Required: project_name, account_manager
            // client_id is required only for External projects (already validated above)
            const cleanedPayload = { ...projectPayload };

            // Remove empty optional string fields
            if (!cleanedPayload.project_code || cleanedPayload.project_code === '') {
                delete cleanedPayload.project_code;
            }
            if (!cleanedPayload.account_reg_sales_owner || cleanedPayload.account_reg_sales_owner === '') {
                delete cleanedPayload.account_reg_sales_owner;
            }
            if (!cleanedPayload.description || cleanedPayload.description === '') {
                delete cleanedPayload.description;
            }

            // Remove null dates
            if (!cleanedPayload.start_date) {
                delete cleanedPayload.start_date;
            }
            if (!cleanedPayload.end_date) {
                delete cleanedPayload.end_date;
            }

            // Remove client_id if Internal project
            if (cleanedPayload.account_type === 'Internal') {
                delete cleanedPayload.client_id;
            }

            // Use cleaned payload
            const finalPayload = cleanedPayload;

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
                    // Refresh comprehensive report
                    await fetchAccountManagerReport();
                } else {
                    showErrorToast(response?.message || 'Failed to update project');
                }
            } else {
                // Create new project
                const response = await projectsService.create(finalPayload);

                if (response && (response.success !== false || response.data)) {
                    showSuccessToast('Project created successfully');
                    // Close modal and reset form on success
                    setIsCreateProjectModalVisible(false);
                    setIsEditMode(false);
                    setSelectedProject(null);
                    form.resetFields();
                    setBillingType(null);
                    setAccountType('External');
                    // Refresh comprehensive report
                    await fetchAccountManagerReport();
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

    // KPI Data from API
    const kpiData = useMemo(() => ({
        billableResources: reportData.summary.billableResources || 0,
        allocatedCount: reportData.summary.allocatedCount || 0,
        billableCount: reportData.summary.billableCount || 0,
        avgProjectAllocation: reportData.summary.averageProjectAllocation || 0,
        avgBillingPercentage: reportData.summary.averageBillingPercentage || 0,
    }), [reportData.summary]);

    // Chart.js data for billing status donut chart from API
    const billingStatusDonutData = useMemo(() => {
        const allocationsByBillingStatus = reportData.charts.allocationsByBillingStatus || {};
        const labels = Object.keys(allocationsByBillingStatus);
        const data = Object.values(allocationsByBillingStatus);

        // Default color mapping for billing statuses
        const colorMap = {
            'Bench': colors.error,
            'Non-Billing': colors.warning,
            'Training': colors.success,
            'Presale': colors.info,
            'Billing': colors.purple,
        };

        const backgroundColors = labels.map(label => colorMap[label] || colors.primary);

        return {
            labels: labels.length > 0 ? labels : ['No Data'],
            datasets: [
                {
                    data: data.length > 0 ? data : [0],
                    backgroundColor: backgroundColors.length > 0 ? backgroundColors : [colors.gray],
                    borderWidth: 2,
                    borderColor: '#fff',
                },
            ],
        };
    }, [reportData.charts.allocationsByBillingStatus]);

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

    // Chart.js data for employees by tier bar chart from API
    const employeesByTierBarData = useMemo(() => {
        const employeesByTier = reportData.charts.employeesByTier || {};
        const labels = Object.keys(employeesByTier);
        const data = Object.values(employeesByTier);

        return {
            labels: labels.length > 0 ? labels : ['No Data'],
            datasets: [
                {
                    label: 'Number of Employees',
                    data: data.length > 0 ? data : [0],
                    backgroundColor: colors.primary,
                    borderRadius: 4,
                },
            ],
        };
    }, [reportData.charts.employeesByTier]);

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

    // Mock data for tables
    // Fetch resources list for allocation form
    useEffect(() => {
        const fetchResources = async () => {
            // Prevent duplicate calls
            if (fetchResourcesInProgressRef.current) {
                return;
            }

            try {
                fetchResourcesInProgressRef.current = true;
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
        const modal = Modal.confirm({
            title: 'Delete Allocation',
            content: `Are you sure you want to delete the allocation for "${record.employeeName}"? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            okButtonProps: {
                loading: false,
            },
            onOk: async () => {
                try {
                    isDeleting = true;
                    modal.update({
                        okButtonProps: {
                            loading: true,
                            disabled: true,
                        },
                        cancelButtonProps: {
                            disabled: true,
                        },
                    });
                    const response = await allocationsService.delete(record.id);

                    if (response && (response.success !== false || response.message)) {
                        showSuccessToast('Allocation deleted successfully');
                        // Refresh allocations for the selected project
                        await fetchAccountManagerReport();
                        modal.destroy();
                    } else {
                        showErrorToast(response?.message || 'Failed to delete allocation');
                        modal.update({
                            okButtonProps: {
                                loading: false,
                                disabled: false,
                            },
                            cancelButtonProps: {
                                disabled: false,
                            },
                        });
                    }
                } catch (error) {
                    console.error('Failed to delete allocation:', error);
                    showErrorToast(error?.response?.data?.message || error?.message || 'Failed to delete allocation');
                    modal.update({
                        okButtonProps: {
                            loading: false,
                            disabled: false,
                        },
                        cancelButtonProps: {
                            disabled: false,
                        },
                    });
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
                    await fetchAccountManagerReport();
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
                    await fetchAccountManagerReport();
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
            // API returns: {success: true, data: {resource_id: "...", allocations: [...], total: 1}}
            // After interceptor: response.data = {resource_id: "...", allocations: [...], total: 1}
            // Service returns: response.data (which is the transformed object)
            // So in component: response = {resource_id: "...", allocations: [...], total: 1}
            let allocationsData = [];

            if (response) {
                console.log('Full response object:', response);

                // Check if response has allocations array directly (after service returns response.data)
                if (response.allocations && Array.isArray(response.allocations)) {
                    allocationsData = response.allocations;
                    console.log('Found allocations in response.allocations:', allocationsData.length);
                }
                // Check if response.data has allocations array (if service returns full response object)
                else if (response.data && response.data.allocations && Array.isArray(response.data.allocations)) {
                    allocationsData = response.data.allocations;
                    console.log('Found allocations in response.data.allocations:', allocationsData.length);
                }
                // Check if response.data is directly an array (after interceptor transformation)
                else if (Array.isArray(response.data)) {
                    allocationsData = response.data;
                    console.log('Found allocations as direct array:', allocationsData.length);
                }
                // Check if response is an array directly
                else if (Array.isArray(response)) {
                    allocationsData = response;
                    console.log('Found allocations as root array:', allocationsData.length);
                }
                // Check if response.data is a single object with allocations property (nested)
                else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
                    // If it has allocations property, use it
                    if (response.data.allocations && Array.isArray(response.data.allocations)) {
                        allocationsData = response.data.allocations;
                        console.log('Found allocations in nested object:', allocationsData.length);
                    }
                    // Otherwise, if it has id (single allocation), wrap it in array
                    else if (response.data.id) {
                        allocationsData = [response.data];
                        console.log('Found single allocation, wrapped in array');
                    } else {
                        console.warn('Unexpected response.data structure:', response.data);
                    }
                } else {
                    console.warn('Could not parse response structure:', response);
                }
            } else {
                console.warn('Response is null or undefined');
            }

            console.log('Final parsed allocations data:', allocationsData);
            console.log('Allocations count:', allocationsData.length);

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

                // Determine billing status based on project_type
                // API provides: project_type (e.g., "Client", "Bench", "Pre-Sales", "Training")
                let billingStatus = 'Non-Billing';
                if (allocation.project_type === 'Client' || allocation.project_is_billable) {
                    billingStatus = 'Billing';
                } else if (allocation.project_type === 'Bench') {
                    billingStatus = 'Bench';
                } else if (allocation.project_type === 'Pre-Sales' || allocation.project_type === 'Presale' || allocation.project_type === 'Pre-Sale') {
                    billingStatus = 'Presale';
                } else if (allocation.project_type === 'Training') {
                    billingStatus = 'Training';
                }

                return {
                    key: allocation.id || `allocation-${index}`,
                    id: allocation.id,
                    project: allocation.project_name || 'N/A',
                    allocatedDate: allocation.start_date ? dayjs(allocation.start_date).format('YYYY-MM-DD') : '-',
                    deallocatedDate: allocation.end_date ? dayjs(allocation.end_date).format('YYYY-MM-DD') : '-',
                    billingStatus: billingStatus,
                    billingPercentage: billingPercentage ? `${billingPercentage.toFixed(0)}%` : '0%',
                    projectAllocation: allocationPercentage ? `${allocationPercentage.toFixed(0)}%` : '0%',
                    duration: duration,
                    status: allocation.is_active !== undefined ? (allocation.is_active ? 'Active' : 'Inactive') : (allocation.status || 'Active'),
                    project_id: allocation.project_id,
                };
            });

            setResourceAllocationsData(transformedAllocations);

            // Only show warning if we actually parsed data but got empty array
            // Don't show warning if there was a parsing error (that's handled in catch)
            if (transformedAllocations.length === 0 && allocationsData.length === 0) {
                // This means the response structure wasn't recognized
                console.warn('No allocations found - response structure may be unexpected');
                showWarningToast('No allocations found for this resource');
            } else if (transformedAllocations.length === 0 && allocationsData.length > 0) {
                // This means parsing worked but transformation failed
                console.warn('Allocations parsed but transformation failed');
                showWarningToast('Failed to process allocation data');
            }
        } catch (error) {
            console.error('Failed to fetch resource allocations:', error);
            showErrorToast(error?.response?.data?.message || error?.message || 'Failed to load resource allocations');
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

    // Fetch allocations for a project
    const fetchProjectAllocations = async (projectId, page = 1, limit = 10) => {
        if (!projectId) return;

        // Prevent duplicate calls
        if (fetchAllocationsInProgressRef.current) {
            return;
        }

        try {
            fetchAllocationsInProgressRef.current = true;
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
                // Check if response has nested data structure with data array (most common format)
                // API returns: {success: true, data: {data: [], pagination: {...}}}
                if (response.data && response.data.data && Array.isArray(response.data.data)) {
                    allocationsData = response.data.data;
                    paginationData = response.data.pagination || {};
                }
                // Check if response.data is directly an array (after interceptor transformation)
                else if (Array.isArray(response.data)) {
                    allocationsData = response.data;
                    paginationData = response.pagination || {};
                }
                // Check if response itself is an array (after interceptor transformation)
                else if (Array.isArray(response)) {
                    allocationsData = response;
                    paginationData = {};
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
            }

            console.log('Parsed allocations data:', allocationsData);
            console.log('Pagination data:', paginationData);

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
            fetchAllocationsInProgressRef.current = false;
        }
    };

    // Handle project row click - fetch allocations for the selected project
    const handleProjectClick = (project) => {
        // If clicking the same project, don't do anything (prevent duplicate API calls)
        if (selectedProjectId === project.id) {
            return;
        }

        setSelectedProjectId(project.id);
        // Reset allocation pagination to first page when selecting a new project
        setAllocationPagination(prev => ({ ...prev, current: 1 }));
        // Fetch allocations for the selected project using allocations API
        fetchProjectAllocations(project.id, 1, allocationPagination.pageSize);
    };

    // Clear allocation data when no project is selected
    useEffect(() => {
        if (!selectedProjectId) {
            setAllocationData([]);
            setAllocationPagination(prev => ({ ...prev, current: 1, total: 0 }));
        }
    }, [selectedProjectId]);

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
            title: 'Allocated Resource Count',
            dataIndex: 'allocatedResourceCount',
            key: 'allocatedResourceCount',
            width: 180,
            align: 'center',
            render: (count) => count !== undefined && count !== null ? count : 0,
        },
        {
            title: 'Billing Count',
            dataIndex: 'billingCount',
            key: 'billingCount',
            width: 130,
            align: 'center',
            render: (count) => count !== undefined && count !== null ? count : 0,
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
                                        loading={loadingAccountManagers}
                                        showSearch
                                        filterOption={(input, option) =>
                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                        placeholder="Select Account Manager"
                                    >
                                        <Option value="All">All</Option>
                                        {accountManagersList.map((am) => (
                                            <Option key={am.id} value={am.name} label={am.name}>
                                                {am.name}
                                            </Option>
                                        ))}
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
                                        loading={loadingProjectsForFilter}
                                        showSearch
                                        filterOption={(input, option) =>
                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                        placeholder="Select Project"
                                    >
                                        <Option value="All">All</Option>
                                        {projectsForFilter.map((project) => (
                                            <Option key={project.id} value={project.name} label={project.name}>
                                                {project.name}
                                            </Option>
                                        ))}
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
                                        showSearch
                                        filterOption={(input, option) =>
                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                        placeholder="Select Client"
                                    >
                                        <Option value="All">All</Option>
                                        {clientsList.map((client) => (
                                            <Option key={client.id} value={client.client_name} label={client.client_name}>
                                                {client.client_name}
                                            </Option>
                                        ))}
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
                        <span className="project-overview-title">
                            Project Overview
                            {selectedAccountManagerName && (
                                <span style={{ marginLeft: '8px', color: '#1890ff', fontWeight: 'normal' }}>
                                    - {selectedAccountManagerName}
                                </span>
                            )}
                        </span>
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
                                // Report will be refetched via useEffect when pagination changes
                            },
                            onShowSizeChange: (current, size) => {
                                setProjectPagination(prev => ({ ...prev, current: 1, pageSize: size }));
                                // Report will be refetched via useEffect when pagination changes
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
                            <span>
                                BY ALLOCATION
                                {displayProjectName && (
                                    <span style={{ marginLeft: '8px', color: '#1890ff', fontWeight: 'normal' }}>
                                        - {displayProjectName}
                                    </span>
                                )}
                            </span>
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
                                // Fetch allocations directly when pagination changes
                                if (selectedProjectId) {
                                    fetchProjectAllocations(selectedProjectId, page, pageSize);
                                }
                            },
                            onShowSizeChange: (current, size) => {
                                setAllocationPagination(prev => ({ ...prev, current: 1, pageSize: size }));
                                // Fetch allocations directly when page size changes
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
                                    <Option value="On Hold">On Hold</Option>
                                    <Option value="Completed">Completed</Option>
                                    <Option value="Cancelled">Cancelled</Option>
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
                                    <Option value="Research">Research</Option>
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
                                label="Project Code"
                                name="projectCode"
                            >
                                <Input placeholder="Enter project code (optional)" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Client Name"
                                name="clientName"
                                rules={[
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            const accountType = getFieldValue('accountType');
                                            if (accountType === 'External' && !value) {
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
                                    {clientsList.map((client) => (
                                        <Option key={client.id} value={client.id} label={client.client_name}>
                                            {client.client_name}
                                        </Option>
                                    ))}
                                </Select>
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
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Account Reg/Sales Owner"
                                name="accountRegSalesOwner"
                            >
                                <Input placeholder="Enter account reg/sales owner (optional)" />
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
                                            disabled={member.isExisting} // Disable for existing allocations
                                            value={member.resource_id || member.employeeId}
                                            onChange={(value) => handleMemberFieldChange(member.key, 'employeeName', value)}
                                            filterOption={(input, option) =>
                                                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                            }
                                        >
                                            {resourcesList.map(resource => (
                                                <Option key={resource.id} value={resource.id}>
                                                    {resource.name}
                                                </Option>
                                            ))}
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
