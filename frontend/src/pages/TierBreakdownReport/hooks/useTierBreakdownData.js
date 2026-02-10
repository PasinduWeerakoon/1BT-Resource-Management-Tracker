/**
 * useTierBreakdownData Hook
 * Custom hook for Tier Breakdown Report data fetching and processing
 */

import { useState, useEffect, useRef } from 'react';
import { reportsService } from '@api';
import { showErrorToast } from '@utils/toast.utils';
import logger from '@utils/logger';

/**
 * Custom hook for Tier Breakdown Report
 * Handles data fetching and tier distribution
 */
export const useTierBreakdownData = (filters) => {
  const [tierData, setTierData] = useState([]);
  const [employeeData, setEmployeeData] = useState([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [loadingReport, setLoadingReport] = useState(false);
  const fetchReportInProgressRef = useRef(false);

  useEffect(() => {
    const fetchTierBreakdownReport = async () => {
      if (fetchReportInProgressRef.current) {
        return;
      }

      try {
        fetchReportInProgressRef.current = true;
        setLoadingReport(true);

        // Build query params from filters - send IDs to backend
        const params = {};
        if (filters.tier && filters.tier !== 'All') {
          params.tier_id = filters.tier;
        }
        if (filters.projectName && filters.projectName !== 'All') {
          params.project_id = filters.projectName;
        }
        if (filters.accountManager && filters.accountManager !== 'All') {
          params.account_manager_id = filters.accountManager;
        }
        if (filters.track && filters.track !== 'All') {
          params.track_id = filters.track;
        }
        if (filters.techStack && filters.techStack !== 'All') {
          params.tech_stack_id = filters.techStack;
        }

        const response = await reportsService.getTierBreakdown(params);

        // Handle response structure
        let reportData = null;
        if (response) {
          if (response.data) {
            reportData = response.data;
          } else if (response.summary || response.tierDistribution) {
            reportData = response;
          }
        }

        if (reportData) {
          // Update tier distribution for chart
          if (reportData.tierDistribution && Array.isArray(reportData.tierDistribution)) {
            setTierData(reportData.tierDistribution);
          }

          // Update employee details for table
          if (reportData.employeeDetails && Array.isArray(reportData.employeeDetails)) {
            setEmployeeData(reportData.employeeDetails);
          }

          // Update total employees
          if (reportData.summary && reportData.summary.totalEmployees !== undefined) {
            setTotalEmployees(reportData.summary.totalEmployees);
          }
        }
      } catch (error) {
        logger.error('Failed to fetch tier breakdown report', error);
        showErrorToast(error?.response?.data?.message || error?.message || 'Failed to load tier breakdown report');
      } finally {
        setLoadingReport(false);
        fetchReportInProgressRef.current = false;
      }
    };

    fetchTierBreakdownReport();
  }, [filters.tier, filters.projectName, filters.accountManager, filters.track, filters.techStack]);

  return {
    tierData,
    employeeData,
    totalEmployees,
    loadingReport,
  };
};

export default useTierBreakdownData;
