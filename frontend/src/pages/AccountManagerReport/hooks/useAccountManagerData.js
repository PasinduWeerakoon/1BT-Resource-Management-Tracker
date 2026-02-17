/**
 * useAccountManagerData Hook
 * Consolidates all data fetching for AccountManagerReport:
 * - Clients, Account Managers, Projects (for filter), Resources
 * - Main report data (summary, charts, projects, allocations)
 * - Allocation fetching (BY ALLOCATION table)
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useReportFilters } from '@hooks/reports';
import {
  projectsService,
  clientsService,
  allocationsService,
  resourcesService,
  accountManagersService,
  reportsService,
} from '@api';
import {
  selectProjectTypes,
  selectBillingStatuses,
  selectTiers,
  selectTracks,
  selectAccountTypes,
  selectProjectStatuses,
  selectTechStacks,
} from '@redux/slices/configSlice';
import { showErrorToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import { filterBillableResources } from '@utils/resourceFilters';
import { transformProjectData, transformAllocationData } from '../utils/dataTransformers';

// Default filter values
const DEFAULT_FILTERS = {
  accountManager: 'All',
  projectName: 'All',
  projectStatus: 'All',
  clientName: 'All',
  billingStatus: 'All',
  techStack: 'All',
};

// Default report data shape
const DEFAULT_REPORT_DATA = {
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
};

/**
 * Extract data from various API response structures
 */
const parseResponseData = (response) => {
  if (!response) return [];
  if (Array.isArray(response.data)) return response.data;
  if (response.data?.data && Array.isArray(response.data.data)) return response.data.data;
  if (Array.isArray(response)) return response;
  return [];
};

const useAccountManagerData = () => {
  // ─── Redux Config ───
  const projectTypesList = useSelector(selectProjectTypes);
  const billingStatusesList = useSelector(selectBillingStatuses);
  const tiersList = useSelector(selectTiers);
  const tracksList = useSelector(selectTracks);
  const accountTypesList = useSelector(selectAccountTypes);
  const projectStatusesList = useSelector(selectProjectStatuses);
  const techStacksList = useSelector(selectTechStacks);

  // ─── Billing status filters ───
  const projectBillingStatuses = useMemo(() => {
    const filtered = billingStatusesList.filter((s) => {
      const bt = s?.billingType || [];
      return Array.isArray(bt) && bt.includes('project');
    });
    return filtered.length > 0 ? filtered : billingStatusesList;
  }, [billingStatusesList]);

  const resourceBillingStatuses = useMemo(() => {
    const filtered = billingStatusesList.filter((s) => {
      const bt = s?.billingType || [];
      return Array.isArray(bt) && bt.includes('resource');
    });
    return filtered.length > 0 ? filtered : billingStatusesList;
  }, [billingStatusesList]);

  // ─── Filters ───
  const {
    filters,
    setFilters,
    activeFiltersCount,
    handleResetFilters,
    filtersExpanded,
    toggleFiltersExpanded,
  } = useReportFilters(DEFAULT_FILTERS);

  // ─── Lists state ───
  const [clientsList, setClientsList] = useState([]);
  const [accountManagersList, setAccountManagersList] = useState([]);
  const [loadingAccountManagers, setLoadingAccountManagers] = useState(false);
  const [projectsForFilter, setProjectsForFilter] = useState([]);
  const [loadingProjectsForFilter, setLoadingProjectsForFilter] = useState(false);
  const [resourcesList, setResourcesList] = useState([]);

  // ─── Report state ───
  const [reportData, setReportData] = useState(DEFAULT_REPORT_DATA);
  const [loadingReport, setLoadingReport] = useState(false);

  // ─── Projects table state ───
  const [projectData, setProjectData] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectPagination, setProjectPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // ─── Allocations table state ───
  const [allocationData, setAllocationData] = useState([]);
  const [loadingAllocations, setLoadingAllocations] = useState(false);
  const [allocationPagination, setAllocationPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // ─── Dedup refs ───
  const fetchClientsRef = useRef(false);
  const fetchAMRef = useRef(false);
  const fetchProjectsFilterRef = useRef(false);
  const fetchResourcesRef = useRef(false);
  const fetchReportRef = useRef(false);
  const fetchAllocationsRef = useRef(false);

  // ─── Fetch clients ───
  useEffect(() => {
    if (fetchClientsRef.current) return;
    const fetch = async () => {
      try {
        fetchClientsRef.current = true;
        const response = await clientsService.getAll({ limit: 100 });
        setClientsList(parseResponseData(response));
      } catch (error) {
        logger.error('Failed to fetch clients:', error);
      } finally {
        fetchClientsRef.current = false;
      }
    };
    fetch();
  }, []);

  // ─── Fetch account managers ───
  useEffect(() => {
    if (fetchAMRef.current) return;
    const fetch = async () => {
      try {
        fetchAMRef.current = true;
        setLoadingAccountManagers(true);
        const response = await accountManagersService.getAll();
        let data = parseResponseData(response);
        const ams = data
          .map((am) => ({
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
          .filter((am) => am.id && am.name);
        setAccountManagersList(ams);
      } catch (error) {
        logger.error('Failed to fetch account managers:', error);
        showErrorToast('Failed to load account managers');
      } finally {
        setLoadingAccountManagers(false);
        fetchAMRef.current = false;
      }
    };
    fetch();
  }, []);

  // ─── Fetch projects for filter ───
  const fetchProjectsForFilterFn = useCallback(async () => {
    if (fetchProjectsFilterRef.current) return;
    try {
      fetchProjectsFilterRef.current = true;
      setLoadingProjectsForFilter(true);
      const response = await projectsService.getAll({ limit: 100 });
      const data = parseResponseData(response);
      const projects = data
        .map((p) => ({ id: p.id, name: p.project_name || p.name }))
        .filter((p) => p.id && p.name);
      setProjectsForFilter(projects);
    } catch (error) {
      logger.error('Failed to fetch projects for filter:', error);
      showErrorToast('Failed to load projects');
    } finally {
      setLoadingProjectsForFilter(false);
      fetchProjectsFilterRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchProjectsForFilterFn();
  }, [fetchProjectsForFilterFn]);

  // ─── Refetch projects for filter (for use after CRUD operations) ───
  const refetchProjectsForFilter = useCallback(() => {
    fetchProjectsFilterRef.current = false;
    fetchProjectsForFilterFn();
  }, [fetchProjectsForFilterFn]);

  // ─── Fetch resources ───
  // Filters to billable, active resources for project allocation
  useEffect(() => {
    if (fetchResourcesRef.current) return;
    const fetch = async () => {
      try {
        fetchResourcesRef.current = true;
        const response = await resourcesService.getAll({ limit: 250 });
        const data = parseResponseData(response);
        
        // Apply billable resource filtering for allocation
        // Only Active status, billable tracks (QA, Dev, UI, BA, PM, UX, Delivery, Functional Consultant)
        // Includes interns
        const billableData = filterBillableResources(data);
        
        const resources = billableData
          .map((r) => ({
            id: r.id,
            name: r.name,
            email: r.email,
            status: r.status,
            track_id: r.track_id,
            updated_at: r.updated_at,
            total_allocation: r.total_allocation,
            total_resource_billing: r.total_resource_billing,
          }))
          .filter((r) => r.id && r.name);
        
        setResourcesList(resources);
        logger.info(`Loaded ${resources.length} billable resources for allocation (filtered from ${data.length} total)`);
      } catch (error) {
        logger.error('Failed to fetch resources:', error);
        showErrorToast('Failed to load resources');
      } finally {
        fetchResourcesRef.current = false;
      }
    };
    fetch();
  }, []);

  // ─── Fetch project allocations (BY ALLOCATION table) ───
  const fetchProjectAllocations = useCallback(async (projectId, page = 1, limit = 10) => {
    const effectiveProjectId = projectId
      ?? selectedProjectId
      ?? (filters.projectName !== 'All' ? filters.projectName : null);

    if (fetchAllocationsRef.current) return;

    try {
      fetchAllocationsRef.current = true;
      setLoadingAllocations(true);

      const params = { page, limit };
      if (effectiveProjectId) params.project_id = effectiveProjectId;
      if (filters.accountManager !== 'All') params.account_manager_id = filters.accountManager;
      if (filters.projectStatus !== 'All') params.project_status_id = filters.projectStatus;
      if (filters.clientName !== 'All') params.client_id = filters.clientName;
      if (filters.billingStatus !== 'All') params.billing_status_id = filters.billingStatus;
      if (filters.techStack !== 'All') params.tech_stack_id = filters.techStack;

      const response = await allocationsService.getAll(params);

      let allocationsRaw = [];
      let paginationData = {};

      if (response) {
        if (response.data?.data && Array.isArray(response.data.data)) {
          allocationsRaw = response.data.data;
          paginationData = response.data.pagination || {};
        } else if (Array.isArray(response.data)) {
          allocationsRaw = response.data;
          paginationData = response.pagination || {};
        } else if (Array.isArray(response)) {
          allocationsRaw = response;
        } else if (response.data?.id) {
          allocationsRaw = [response.data];
          paginationData = { total: 1, page: 1, limit: 10 };
        } else if (response.id && response.resource_id) {
          allocationsRaw = [response];
          paginationData = { total: 1, page: 1, limit: 10 };
        }
      }

      setAllocationData(transformAllocationData(allocationsRaw));
      setAllocationPagination({
        current: paginationData.page || page,
        pageSize: paginationData.limit || limit,
        total: paginationData.total || 0,
      });
    } catch (error) {
      logger.error('Failed to fetch project allocations:', error);
      showErrorToast('Failed to load allocations');
      setAllocationData([]);
    } finally {
      setLoadingAllocations(false);
      fetchAllocationsRef.current = false;
    }
  }, [selectedProjectId, filters]);

  // ─── Fetch main report ───
  const fetchAccountManagerReport = useCallback(async () => {
    if (fetchReportRef.current) return;

    try {
      fetchReportRef.current = true;
      setLoadingReport(true);
      setLoadingProjects(true);

      const queryParams = {};
      if (filters.accountManager !== 'All') queryParams.account_manager_id = filters.accountManager;
      if (selectedProjectId) {
        queryParams.project_id = selectedProjectId;
      } else if (filters.projectName !== 'All') {
        queryParams.project_id = filters.projectName;
      }
      if (filters.projectStatus !== 'All') queryParams.project_status_id = filters.projectStatus;
      if (filters.clientName !== 'All') queryParams.client_id = filters.clientName;
      if (filters.billingStatus !== 'All') queryParams.billing_status_id = filters.billingStatus;
      if (filters.techStack !== 'All') queryParams.tech_stack_id = filters.techStack;

      if (selectedProjectId) {
        queryParams.page = allocationPagination.current;
        queryParams.limit = allocationPagination.pageSize;
      } else {
        queryParams.page = projectPagination.current;
        queryParams.limit = projectPagination.pageSize;
      }

      const response = await reportsService.getAccountManager(queryParams);

      if (response) {
        const data = response.data || response;

        setReportData({
          summary: data.summary || DEFAULT_REPORT_DATA.summary,
          charts: data.charts || DEFAULT_REPORT_DATA.charts,
          projects: data.projects || { data: [], pagination: {} },
          allocations: data.allocations || { data: [], pagination: {} },
          designations: data.designations || { data: [] },
        });

        if (data.projects?.data) {
          const allocationsData = data.allocations?.data || [];
          setProjectData(transformProjectData(data.projects.data, allocationsData));
          setProjectPagination({
            current: data.projects.pagination?.page || projectPagination.current,
            pageSize: data.projects.pagination?.limit || projectPagination.pageSize,
            total: data.projects.pagination?.total || 0,
          });
        }

        setAllocationPagination((prev) => ({ ...prev, current: 1 }));
        fetchProjectAllocations(undefined, 1, allocationPagination.pageSize);
      }
    } catch (error) {
      logger.error('Failed to fetch account manager report:', error);
      showErrorToast('Failed to load account manager report');
    } finally {
      setLoadingReport(false);
      setLoadingProjects(false);
      fetchReportRef.current = false;
    }
  }, [filters, selectedProjectId, projectPagination.current, projectPagination.pageSize, allocationPagination, fetchProjectAllocations]);

  // ─── Trigger report fetch on filter / pagination changes ───
  useEffect(() => {
    fetchAccountManagerReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.accountManager,
    filters.projectName,
    filters.projectStatus,
    filters.clientName,
    filters.billingStatus,
    filters.techStack,
    projectPagination.current,
    projectPagination.pageSize,
  ]);

  // ─── Clear allocations when project is deselected ───
  useEffect(() => {
    if (!selectedProjectId) {
      setAllocationData([]);
      setAllocationPagination((prev) => ({ ...prev, current: 1, total: 0 }));
    }
  }, [selectedProjectId]);

  // ─── Derived values ───
  const selectedAccountManagerName = useMemo(() => {
    return filters.accountManager || null;
  }, [filters.accountManager]);

  const displayProjectName = useMemo(() => {
    if (selectedProjectId) {
      const project = projectData.find((p) => p.id === selectedProjectId);
      return project ? (project.project || project.project_name || 'N/A') : null;
    }
    return null;
  }, [selectedProjectId, projectData]);

  const kpiData = useMemo(() => ({
    billableResources: reportData.summary.billableResources || 0,
    allocatedCount: reportData.summary.allocatedCount || 0,
    billableCount: reportData.summary.billableCount || 0,
    avgProjectAllocation: reportData.summary.averageProjectAllocation?.toFixed(1) || 0,
    avgBillingPercentage: reportData.summary.averageBillingPercentage?.toFixed(1) || 0,
  }), [reportData]);

  const summaryCards = useMemo(() => [
    { value: kpiData.billableResources, label: 'BILLABLE RESOURCES' },
    { value: kpiData.allocatedCount, label: 'ALLOCATED COUNT' },
    { value: kpiData.billableCount, label: 'BILLABLE COUNT' },
    { value: `${kpiData.avgProjectAllocation}%`, label: 'Average Project Allocation' },
    { value: `${kpiData.avgBillingPercentage}%`, label: 'Average Billing Percentage' },
  ], [kpiData]);

  // ─── Handle project click ───
  const handleProjectClick = useCallback((project) => {
    if (selectedProjectId === project.id) return;
    setSelectedProjectId(project.id);
    setAllocationPagination((prev) => ({ ...prev, current: 1 }));
    fetchProjectAllocations(project.id, 1, allocationPagination.pageSize);
  }, [selectedProjectId, allocationPagination.pageSize, fetchProjectAllocations]);

  return {
    // Redux config
    projectTypesList,
    billingStatusesList,
    tiersList,
    tracksList,
    accountTypesList,
    projectStatusesList,
    techStacksList,
    projectBillingStatuses,
    resourceBillingStatuses,

    // Filters
    filters,
    setFilters,
    activeFiltersCount,
    handleResetFilters,
    filtersExpanded,
    toggleFiltersExpanded,

    // Lists
    clientsList,
    accountManagersList,
    loadingAccountManagers,
    projectsForFilter,
    loadingProjectsForFilter,
    refetchProjectsForFilter,
    resourcesList,

    // Report
    reportData,
    loadingReport,
    fetchAccountManagerReport,

    // Projects table
    projectData,
    loadingProjects,
    projectPagination,
    setProjectPagination,
    selectedProjectId,
    setSelectedProjectId,
    handleProjectClick,

    // Allocations table
    allocationData,
    loadingAllocations,
    allocationPagination,
    setAllocationPagination,
    fetchProjectAllocations,

    // Derived
    selectedAccountManagerName,
    displayProjectName,
    kpiData,
    summaryCards,
  };
};

export default useAccountManagerData;
