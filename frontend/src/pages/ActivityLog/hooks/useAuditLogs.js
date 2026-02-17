/**
 * useAuditLogs Hook
 * Manages audit logs fetching and state
 */

import { useState, useRef } from 'react';
import { auditLogsService } from '@api';
import { showErrorToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import { transformLogsData, normalizeLogsResponse } from '../utils/logTransformers';

/**
 * useAuditLogs Hook
 * @param {Object} filters - Current filters
 * @param {Object} pagination - Current pagination state
 * @returns {Object} Audit logs state and handlers
 */
export const useAuditLogs = (filters, pagination) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const fetchInProgressRef = useRef(false);

  /**
   * Fetch audit logs
   * @param {number} page - Page number
   * @param {number} limit - Page size
   */
  const fetchAuditLogs = async (page = 1, limit = 10) => {
    if (fetchInProgressRef.current) {
      return;
    }

    try {
      fetchInProgressRef.current = true;
      setLoading(true);

      const params = {
        page: page || pagination.current,
        limit: limit || pagination.pageSize,
      };

      // Add filters
      if (filters.action) params.action = filters.action;
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.entityId) params.entityId = filters.entityId;
      if (filters.userId) params.userId = filters.userId;
      if (filters.startDate) params.startDate = filters.startDate.format('YYYY-MM-DD');
      if (filters.endDate) params.endDate = filters.endDate.format('YYYY-MM-DD');

      const response = await auditLogsService.getAll(params);
      const { logsData, paginationData } = normalizeLogsResponse(response);
      const transformedData = transformLogsData(logsData);

      setAuditLogs(transformedData);

      return {
        logs: transformedData,
        pagination: paginationData,
      };
    } catch (error) {
      logger.error('Failed to fetch audit logs:', error);
      showErrorToast('Failed to load audit logs');
      setAuditLogs([]);
      throw error;
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  /**
   * Fetch audit log detail
   * @param {string} logId - Log ID
   * @returns {Object|null} Log detail data
   */
  const fetchLogDetail = async (logId) => {
    try {
      const response = await auditLogsService.getById(logId);

      let logData = null;
      if (response) {
        if (response.data) {
          logData = response.data;
        } else if (typeof response === 'object' && !Array.isArray(response)) {
          logData = response;
        }
      }

      return logData;
    } catch (error) {
      logger.error('Failed to fetch log detail:', error);
      showErrorToast('Failed to load log details');
      throw error;
    }
  };

  return {
    auditLogs,
    setAuditLogs,
    loading,
    fetchAuditLogs,
    fetchLogDetail,
  };
};

export default useAuditLogs;
