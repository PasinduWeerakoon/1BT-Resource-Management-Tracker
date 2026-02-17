/**
 * useLogStats Hook
 * Manages audit log statistics and DLQ data
 */

import { useState, useRef } from 'react';
import { auditLogsService } from '@api';
import { showErrorToast, showSuccessToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import { normalizeStatsResponse, normalizeDLQResponse } from '../utils/logTransformers';

/**
 * useLogStats Hook
 * @returns {Object} Stats state and handlers
 */
export const useLogStats = () => {
  const [stats, setStats] = useState(null);
  const [dlqData, setDlqData] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingDLQ, setLoadingDLQ] = useState(false);
  const fetchStatsInProgressRef = useRef(false);
  const fetchDLQInProgressRef = useRef(false);

  /**
   * Fetch statistics
   */
  const fetchStats = async () => {
    if (fetchStatsInProgressRef.current) {
      return;
    }

    try {
      fetchStatsInProgressRef.current = true;
      setLoadingStats(true);

      const response = await auditLogsService.getStats({ days: 7 });
      const statsData = normalizeStatsResponse(response);

      setStats(statsData);
      return statsData;
    } catch (error) {
      logger.error('Failed to fetch statistics:', error);
      showErrorToast('Failed to load statistics');
      throw error;
    } finally {
      setLoadingStats(false);
      fetchStatsInProgressRef.current = false;
    }
  };

  /**
   * Fetch DLQ data (Admin only)
   */
  const fetchDLQ = async () => {
    if (fetchDLQInProgressRef.current) {
      return;
    }

    try {
      fetchDLQInProgressRef.current = true;
      setLoadingDLQ(true);

      const response = await auditLogsService.getDLQ();
      const dlqArray = normalizeDLQResponse(response);

      setDlqData(dlqArray);
      return dlqArray;
    } catch (error) {
      logger.error('Failed to fetch DLQ:', error);
      showErrorToast('Failed to load failed messages');
      setDlqData([]);
      throw error;
    } finally {
      setLoadingDLQ(false);
      fetchDLQInProgressRef.current = false;
    }
  };

  /**
   * Handle reprocess DLQ message
   * @param {string} messageId - Message ID
   */
  const handleReprocessDLQ = async (messageId) => {
    try {
      await auditLogsService.reprocessDLQ(messageId);
      showSuccessToast('Message requeued for processing');
      await fetchDLQ(); // Refresh DLQ list
    } catch (error) {
      logger.error('Failed to reprocess message:', error);
      showErrorToast('Failed to reprocess message');
      throw error;
    }
  };

  return {
    stats,
    setStats,
    dlqData,
    setDlqData,
    loadingStats,
    loadingDLQ,
    fetchStats,
    fetchDLQ,
    handleReprocessDLQ,
  };
};

export default useLogStats;
