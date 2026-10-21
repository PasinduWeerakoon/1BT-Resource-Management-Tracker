/**
 * useTrainingData Hook
 * Manages training report data fetching and state
 */

import { useState, useMemo } from 'react';
import { reportsService } from '@api';
import { showErrorToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import {
  transformDesignationTableData,
  transformAllocationTableData,
} from '../utils/trainingTransformers';

/**
 * useTrainingData Hook
 * @param {Object} filters - Current filters
 * @returns {Object} Training data state and handlers
 */
export const useTrainingData = (filters) => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Fetch training report data
  const fetchTrainingReport = async () => {
    try {
      setLoading(true);

      const queryParams = {};

      // Add filters to query params
      if (filters.track && filters.track !== 'All') {
        queryParams.track = filters.track;
      }
      if (filters.techStack && filters.techStack !== 'All') {
        queryParams.tech_stack = filters.techStack;
      }

      const response = await reportsService.getTraining(queryParams);

      if (response && response.success !== false) {
        // API returns { success, data: { summary, charts, tables, generatedAt } }
        const payload = response.data != null ? response.data : response;
        setReportData(payload);
      } else {
        showErrorToast('Failed to load training report');
        setReportData(null);
      }
    } catch (error) {
      logger.error('Failed to fetch training report', error);
      showErrorToast('Failed to load training report');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  // Calculate KPIs from report data
  const kpiData = useMemo(() => {
    if (!reportData) {
      return {
        totalEmployeesInTraining: 0,
        totalEmployees: 0,
        trainingPercentage: '0.00',
      };
    }

    const totalEmployeesInTraining = reportData.summary?.totalEmployeesInTraining || 0;
    const totalEmployees = reportData.summary?.totalEmployees || 0;
    const trainingPercentage = totalEmployees > 0
      ? ((totalEmployeesInTraining / totalEmployees) * 100).toFixed(2)
      : '0.00';

    return {
      totalEmployeesInTraining,
      totalEmployees,
      trainingPercentage,
    };
  }, [reportData]);

  // Extract chart data
  const trackData = useMemo(() => {
    return reportData?.charts?.trackDistribution || [];
  }, [reportData]);

  const techStackData = useMemo(() => {
    return reportData?.charts?.techStackDistribution || [];
  }, [reportData]);

  const designationData = useMemo(() => {
    return reportData?.charts?.designationDistribution || [];
  }, [reportData]);

  // Extract and transform table data to match column dataIndex (flat rows, camelCase)
  const designationTableData = useMemo(() => {
    const raw = reportData?.tables?.byDesignation || [];
    return transformDesignationTableData(raw);
  }, [reportData]);

  const allocationTableData = useMemo(() => {
    const raw = reportData?.tables?.byAllocation || [];
    return transformAllocationTableData(raw);
  }, [reportData]);

  return {
    loading,
    reportData,
    fetchTrainingReport,
    kpiData,
    trackData,
    techStackData,
    designationData,
    designationTableData,
    allocationTableData,
  };
};

export default useTrainingData;
