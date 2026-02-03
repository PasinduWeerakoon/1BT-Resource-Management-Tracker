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
 * Handles data fetching, tier distribution, and tech stack extraction
 */
export const useTierBreakdownData = (filters, setTechStacks) => {
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

        // Build query params from filters
        const params = {};
        if (filters.tier && filters.tier !== 'All') {
          params.tier = filters.tier;
        }
        if (filters.projectName && filters.projectName !== 'All') {
          params.project_name = filters.projectName;
        }
        if (filters.accountManager && filters.accountManager !== 'All') {
          params.account_manager = filters.accountManager;
        }
        if (filters.track && filters.track !== 'All') {
          params.track = filters.track;
        }
        if (filters.techStack && filters.techStack !== 'All') {
          params.tech_stack = filters.techStack;
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

            // Extract unique tech stacks from employee details for filter dropdown
            const hasNoFilters = filters.projectName === 'All' &&
              filters.tier === 'All' &&
              filters.accountManager === 'All' &&
              filters.track === 'All' &&
              filters.techStack === 'All';

            if (hasNoFilters && reportData.employeeDetails.length > 0) {
              const uniqueTechStacks = [...new Set(
                reportData.employeeDetails
                  .map((employee) => employee.techStack || employee.tech_stack)
                  .filter((techStack) => techStack && techStack.trim() !== '')
              )].sort();

              if (uniqueTechStacks.length > 0) {
                setTechStacks(uniqueTechStacks.map((techStack) => ({ name: techStack })));
              }
            }
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
  }, [filters.tier, filters.projectName, filters.accountManager, filters.track, filters.techStack, setTechStacks]);

  return {
    tierData,
    employeeData,
    totalEmployees,
    loadingReport,
  };
};

export default useTierBreakdownData;
