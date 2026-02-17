/**
 * useMonthlyAllocationData Hook
 * Custom hook for Monthly Allocation Report data fetching and processing
 */

import { useState, useEffect, useRef } from 'react';
import { reportsService } from '@api';
import { showErrorToast } from '@utils/toast.utils';
import logger from '@utils/logger';

/**
 * Custom hook for Monthly Allocation Report
 * Handles data fetching, transformation, and grouping
 */
export const useMonthlyAllocationData = (filters) => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [groupedData, setGroupedData] = useState([]);
  const [periodInfo, setPeriodInfo] = useState(null);
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    const fetchMonthlyAllocationReport = async () => {
      if (!filters.year || !filters.month) {
        return;
      }

      if (fetchInProgressRef.current) {
        return;
      }
      
      try {
        fetchInProgressRef.current = true;
        setLoading(true);
        const queryParams = {
          year: filters.year,
          month: filters.month,
        };
        
        if (filters.track_id) {
          queryParams.track_id = filters.track_id;
        }
        
        const response = await reportsService.getMonthlyAllocation(queryParams);
        
        // Handle response structure
        let reportDataArray = [];
        let periodInfo = null;
        
        if (response) {
          if (response.data) {
            if (response.data.data && Array.isArray(response.data.data)) {
              reportDataArray = response.data.data;
              periodInfo = response.data.period || null;
            } else if (Array.isArray(response.data)) {
              reportDataArray = response.data;
            }
          } else if (Array.isArray(response)) {
            reportDataArray = response;
          }
        }
        
        // Transform API data to table format
        const transformedData = reportDataArray.map((item, index) => {
          const allocationPercentage = parseFloat(item.allocation_percentage || 0);
          
          return {
            key: `${item.resource_name}-${item.project_name}-${index}`,
            resourceName: item.resource_name || 'N/A',
            email: item.email || 'N/A',
            designation: item.designation || 'N/A',
            track: item.track || 'N/A',
            projectName: item.project_name || 'N/A',
            clientName: item.client_name || 'N/A',
            allocationPercentage: allocationPercentage,
            allocationPercentageFormatted: `${allocationPercentage.toFixed(2)}%`,
            startDate: item.start_date ? new Date(item.start_date).toLocaleDateString() : 'N/A',
            endDate: item.end_date ? new Date(item.end_date).toLocaleDateString() : 'Ongoing',
            source: item.source || 'Current',
          };
        });
        
        // Calculate total allocation per resource
        const resourceTotals = {};
        transformedData.forEach((item) => {
          if (!resourceTotals[item.resourceName]) {
            resourceTotals[item.resourceName] = {
              resourceName: item.resourceName,
              email: item.email,
              designation: item.designation,
              track: item.track,
              totalAllocation: 0,
              allocations: [],
            };
          }
          resourceTotals[item.resourceName].totalAllocation += item.allocationPercentage;
          resourceTotals[item.resourceName].allocations.push(item);
        });
        
        setPeriodInfo(periodInfo);
        setReportData(transformedData);
        setGroupedData(Object.values(resourceTotals));
      } catch (error) {
        logger.error('Failed to fetch monthly allocation report', error);
        showErrorToast('Failed to load monthly allocation report');
        setReportData([]);
        setGroupedData([]);
      } finally {
        setLoading(false);
        fetchInProgressRef.current = false;
      }
    };

    fetchMonthlyAllocationReport();
  }, [filters.year, filters.month, filters.track_id]);

  return {
    loading,
    reportData,
    groupedData,
    periodInfo,
  };
};

export default useMonthlyAllocationData;
