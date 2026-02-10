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
 * Handles data fetching and summary extraction
 */
export const useInternReportData = (filters) => {
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

        // Build query params from filters - send IDs to backend
        const params = {};
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

        const response = await reportsService.getIntern(params);

        // Handle response structure
        // API returns: { success: true, data: { summary: {...}, data: [...], total: number } }
        // reportsService.getIntern returns: response.data || response
        // So response structure is: { summary: {...}, data: [...], total: number }
        let reportData = null;
        if (response) {
          // Check if response has the expected structure
          if (response.summary || (response.data && Array.isArray(response.data))) {
            // Standard structure: { summary: {...}, data: [...], total: number }
            reportData = response;
          } else if (response.data && (response.data.summary || response.data.data)) {
            // Double nested: { data: { summary: {...}, data: [...] } }
            reportData = response.data;
          }
        }

        if (reportData) {
          // Update summary data
          if (reportData.summary) {
            setTotalInternCount(reportData.summary.totalInternCount || 0);
            setInternPercentage(reportData.summary.internPercentage?.toFixed(1) || '0.0');
          }

          // Update intern data for table
          // Data is at reportData.data (array of intern records)
          const tableData = reportData.data && Array.isArray(reportData.data) 
            ? reportData.data 
            : [];

          setInternData(tableData);
        } else {
          // No data received
          setInternData([]);
          setTotalInternCount(0);
          setInternPercentage('0.0');
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
  }, [filters.projectName, filters.accountManager, filters.track, filters.techStack]);

  return {
    internData,
    totalInternCount,
    internPercentage,
    loadingReport,
  };
};

export default useInternReportData;
