/**
 * useReportData Hook
 * Handles fetching and managing account manager report data
 */

import { useState, useRef, useEffect } from 'react';
import { reportsService } from '@api';
import { showErrorToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import { transformProjectData, transformAllocationData, extractResponseData, extractPagination } from '../utils/dataTransformers';

export const useReportData = ({
  filters,
  accountManagersList,
  projectsForFilter,
  clientsList,
  selectedProjectId,
  projectPagination,
  allocationPagination,
  setProjectData,
  setProjectPagination,
  setAllocationData,
  setAllocationPagination,
  setLoadingProjects,
  setLoadingAllocations,
}) => {
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
  const fetchReportInProgressRef = useRef(false);

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

          const transformedProjects = transformProjectData(data.projects.data, allocationsData);

          setProjectData(transformedProjects);
          setProjectPagination({
            current: data.projects.pagination?.page || projectPagination.current,
            pageSize: data.projects.pagination?.limit || projectPagination.pageSize,
            total: data.projects.pagination?.total || 0,
          });
        }

        // Update allocation data
        if (data.allocations && data.allocations.data) {
          const transformedAllocations = transformAllocationData(data.allocations.data);

          setAllocationData(transformedAllocations);
          setAllocationPagination({
            current: data.allocations.pagination?.page || allocationPagination.current,
            pageSize: data.allocations.pagination?.limit || allocationPagination.pageSize,
            total: data.allocations.pagination?.total || 0,
          });
        } else {
          // Clear allocation data if no data available
          setAllocationData([]);
          setAllocationPagination({
            current: 1,
            pageSize: allocationPagination.pageSize,
            total: 0,
          });
        }
      }
    } catch (error) {
      logger.error('Failed to fetch account manager report:', error);
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
    projectPagination.current,
    projectPagination.pageSize,
  ]);

  return {
    reportData,
    loadingReport,
    fetchAccountManagerReport,
  };
};
