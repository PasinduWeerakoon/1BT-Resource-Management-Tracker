import React, { useState, useMemo, useEffect } from 'react';
import { Row, Col, Card, Select, DatePicker, Table, Button, Space, Badge, Form, Input, InputNumber, Divider, Tooltip } from 'antd';
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
    DeleteOutlined
} from '@ant-design/icons';
import { Doughnut, Bar } from 'react-chartjs-2';
import { commonOptions, colors } from '@utils/chartConfig';
import CustomTable from '@components/Table';
import CustomModal from '@components/Modal';
import '@styles/pages/AccountManagerReport.scss';

const { Option } = Select;
const { RangePicker } = DatePicker;

const AccountManagerReport = () => {
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

    // Reset filters to default values
    const handleResetFilters = (e) => {
        e.stopPropagation(); // Prevent collapsing/expanding when clicking reset
        setFilters({ ...defaultFilters });
    };

    // Handle create new project modal
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

        // Map project data to form fields
        const formValues = {
            projectName: project.project,
            status: project.status || 'Active',
            projectType: project.projectType,
            accountType: project.accountType || 'External',
            clientName: project.customer,
            projectStartDate: project.projectStartDate ? dayjs(project.projectStartDate) : undefined,
            projectEndDate: project.projectEndDate ? dayjs(project.projectEndDate) : undefined,
            accountManager: project.accountManager || filters.accountManager,
            billingType: project.billingType || 'Billing',
            budget: project.budget,
            teamSize: project.teamSize,
            description: project.description,
            clientContact: project.clientContact,
            clientEmail: project.clientEmail,
            clientPhone: project.clientPhone,
            clientAddress: project.clientAddress,
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
        const employeeName = record.employeeName;
        setSelectedEmployee(employeeName);

        // Get all allocations for this employee
        const employeeAllocations = allocationData.filter(item => item.employeeName === employeeName);

        // Transform to modal format
        const allocationsList = employeeAllocations.map((allocation, index) => {
            let allocatedDate = undefined;
            let deallocatedDate = undefined;
            if (allocation.allocatedDate) {
                allocatedDate = dayjs(allocation.allocatedDate, 'DD MMM YYYY');
            }
            if (allocation.deallocatedDate) {
                deallocatedDate = dayjs(allocation.deallocatedDate, 'DD MMM YYYY');
            }

            return {
                key: `existing-${allocation.key}`,
                projectName: allocation.project,
                allocatedDate: allocatedDate,
                deallocatedDate: deallocatedDate,
                billingStatus: allocation.billingStatus,
                billingPercentage: parseFloat(allocation.billingPercentage.replace('%', '')) || 0,
                projectAllocation: parseFloat(allocation.projectAllocation.replace('%', '')) || 0,
                duration: allocation.duration || 0,
                status: allocation.status,
                isExisting: true,
            };
        });

        setUserAllocationsList(allocationsList);
        setIsUserAllocationModalVisible(true);
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
            if (isEditMode && selectedProject) {
                // Update existing project
                console.log('Updating project with values:', values);
                // TODO: Add API call to update project
                // await updateProject(selectedProject.key, values);
            } else {
                // Create new project
                console.log('Creating project with values:', values);
                // TODO: Add API call to create project
                // await createProject(values);
            }

            // Close modal and reset form on success
            setIsCreateProjectModalVisible(false);
            setIsEditMode(false);
            setSelectedProject(null);
            form.resetFields();
            setBillingType(null);
            setAccountType('External');

            // TODO: Refresh project list or show success message
            // message.success('Project created successfully');
        } catch (error) {
            console.error('Error creating project:', error);
            // TODO: Show error message
            // message.error('Failed to create project');
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
    ];

    const allocationData = [
        {
            key: '1',
            employeeName: 'Akeel Aliyar',
            project: 'Healthfinder',
            allocatedDate: '13 Oct 2025',
            deallocatedDate: '',
            billingStatus: 'Non-Billing',
            billingPercentage: '0.00%',
            projectAllocation: '100.00%',
            duration: 1,
            status: 'Active',
        },
        {
            key: '2',
            employeeName: 'Amaniya Faizal',
            project: 'Bench',
            allocatedDate: '02 Sep 2025',
            deallocatedDate: '',
            billingStatus: 'Bench',
            billingPercentage: '0.00%',
            projectAllocation: '100.00%',
            duration: 1,
            status: 'Active',
        },
        {
            key: '3',
            employeeName: 'Anushka Wickramaratne',
            project: 'Presale',
            allocatedDate: '01 Nov 2025',
            deallocatedDate: '',
            billingStatus: 'Presale',
            billingPercentage: '0.00%',
            projectAllocation: '100.00%',
            duration: 1,
            status: 'Active',
        },
        {
            key: '4',
            employeeName: 'Avanthi Amunugama',
            project: 'Ideapoint',
            allocatedDate: '01 Apr 2022',
            deallocatedDate: '',
            billingStatus: 'Billing',
            billingPercentage: '100.00%',
            projectAllocation: '100.00%',
            duration: 1,
            status: 'Active',
        },
        {
            key: '5',
            employeeName: 'Chaminda Pragnarathne',
            project: 'MillionSpaces',
            allocatedDate: '04 Aug 2025',
            deallocatedDate: '',
            billingStatus: 'Training',
            billingPercentage: '0.00%',
            projectAllocation: '80.00%',
            duration: 1,
            status: 'Active',
        },
        {
            key: '6',
            employeeName: 'Chanka Sonnadara',
            project: 'Support AI Model',
            allocatedDate: '10 Nov 2025',
            deallocatedDate: '',
            billingStatus: 'Training',
            billingPercentage: '0.00%',
            projectAllocation: '100.00%',
            duration: 1,
            status: 'Active',
        },
        {
            key: '7',
            employeeName: 'Charith Bandara',
            project: 'MillionSpaces',
            allocatedDate: '22 Jan 2025',
            deallocatedDate: '',
            billingStatus: 'Training',
            billingPercentage: '0.00%',
            projectAllocation: '50.00%',
            duration: 1,
            status: 'Active',
        },
        {
            key: '8',
            employeeName: 'Charith Bandara',
            project: 'Bench',
            allocatedDate: '13 Oct 2025',
            deallocatedDate: '',
            billingStatus: 'Bench',
            billingPercentage: '0.00%',
            projectAllocation: '50.00%',
            duration: 1,
            status: 'Active',
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
                            onClick={() => handleEditProject(record)}
                            size="small"
                            className="action-icon-btn"
                        />
                    </Tooltip>
                    <Tooltip title="Add Members">
                        <Button
                            type="default"
                            icon={<UserAddOutlined />}
                            onClick={() => handleAddTeamMembers(record)}
                            size="small"
                            className="action-icon-btn"
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const projectData = [
        {
            key: '1',
            project: 'Bench',
            customer: '1BT',
            projectType: 'Bench',
            teamSize: 19,
        },
        {
            key: '2',
            project: 'DXC',
            customer: 'DXC',
            projectType: 'Client',
            teamSize: 2,
        },
        {
            key: '3',
            project: 'Healthfinder',
            customer: 'Healthfinder',
            projectType: 'Client',
            teamSize: 17,
        },
        {
            key: '4',
            project: 'Ideapoint',
            customer: 'Ideapoint',
            projectType: 'Client',
            teamSize: 4,
        },
        {
            key: '5',
            project: 'MillionSpaces',
            customer: 'MillionSpaces',
            projectType: 'Client',
            teamSize: 10,
        },
        {
            key: '6',
            project: 'Presale',
            customer: '1BT',
            projectType: 'Client',
            teamSize: 6,
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
                        pagination={false}
                        size="small"
                        scroll={{ x: 800 }}
                    />
                )}
            </Card>

            {/* BY ALLOCATION Table */}
            <Card
                className="table-card"
                title={
                    <div
                        className="collapsible-header"
                        onClick={() => setByAllocationExpanded(!byAllocationExpanded)}
                    >
                        <span>BY ALLOCATION</span>
                        {byAllocationExpanded ? <UpOutlined /> : <DownOutlined />}
                    </div>
                }
            >
                {byAllocationExpanded && (
                    <CustomTable
                        columns={allocationColumns}
                        dataSource={allocationData}
                        pagination={{ pageSize: 10 }}
                        scroll={{ x: 1200 }}
                        size="small"
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
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Budget"
                                name="budget"
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    placeholder="Enter budget"
                                    min={0}
                                    disabled={billingType === 'Non-Billing'}
                                    formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                />
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
        </div>
    );
};

export default AccountManagerReport;
