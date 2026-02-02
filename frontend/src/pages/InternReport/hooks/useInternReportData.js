/**
 * useInternReportData Hook
 * Custom hook for Intern Report data fetching and processing
 */

import { useState, useEffect, useRef } from 'react';
import { reportsService } from '@api';
import { showErrorToast } from '@utils/toast.utils';
import logger from '@utils/logger';

/**
 * Custom hook for Intern Report
 * Handles data fetching, summary extraction, and tech stack extraction
 */
export const useInternReportData = (filters, setTechStacks) => {
  const [internData, setInternData] = useState([]);
  const [totalInternCount, setTotalInternCount] = useState(0);
  const [internPercentage, setInternPercentage] = useState('0.0');
  const [loadingReport, setLoadingReport] = useState(false);
  const fetchReportInProgressRef = useRef(false);

  useEffect(() => {
    const fetchInternReport = async () => {
      if (fetchReportInProgressRef.current) {
        return;
      }

      try {
        fetchReportInProgressRef.current = true;
        setLoadingReport(true);

        // Build query params from filters
        const params = {};
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

        const response = await reportsService.getIntern(params);

        // Handle response structure
        let reportData = null;
        if (response) {
          if (response.data) {
            reportData = response.data;
          } else if (response.summary || response.data) {
            reportData = response;
          }
        }

        if (reportData) {
          // Update summary data
          if (reportData.summary) {
            setTotalInternCount(reportData.summary.totalInternCount || 0);
            setInternPercentage(reportData.summary.internPercentage?.toFixed(1) || '0.0');
          }

          // Update intern data for table
          if (reportData.data && Array.isArray(reportData.data)) {
            setInternData(reportData.data);

            // Extract unique tech stacks from intern data for filter dropdown
            const hasNoFilters = filters.projectName === 'All' &&
              filters.accountManager === 'All' &&
              filters.track === 'All' &&
              filters.techStack === 'All';

            if (hasNoFilters && reportData.data.length > 0) {
              // Get unique tech stacks from the intern data
              const uniqueInterns = new Map();
              reportData.data.forEach((row) => {
                if (!uniqueInterns.has(row.employeeName)) {
                  uniqueInterns.set(row.employeeName, row);
                }
              });

              const uniqueTechStacks = [...new Set(
                Array.from(uniqueInterns.values())
                  .map((intern) => intern.techStack || intern.tech_stack)
                  .filter((techStack) => techStack && techStack.trim() !== '')
              )].sort();

              if (uniqueTechStacks.length > 0) {
                setTechStacks(uniqueTechStacks.map((techStack) => ({ name: techStack })));
              }
            }
          }
        }
      } catch (error) {
        logger.error('Failed to fetch intern report', error);
        showErrorToast(error?.response?.data?.message || error?.message || 'Failed to load intern report');
      } finally {
        setLoadingReport(false);
        fetchReportInProgressRef.current = false;
      }
    };

    fetchInternReport();
  }, [filters.projectName, filters.accountManager, filters.track, filters.techStack, setTechStacks]);

  return {
    internData,
    totalInternCount,
    internPercentage,
    loadingReport,
  };
};

export default useInternReportData;
