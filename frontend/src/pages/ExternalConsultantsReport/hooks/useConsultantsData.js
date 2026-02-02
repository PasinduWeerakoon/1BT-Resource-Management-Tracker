/**
 * useConsultantsData Hook
 * Manages external consultants report data fetching and state
 */

import { useState, useEffect } from 'react';
import { reportsService, tracksService, projectsService, resourcesService } from '@api';
import { showErrorToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import {
  transformProjectData,
  transformAllocationData,
  getUniqueTechStacks,
  calculateTechStackDistribution,
} from '../utils/dataTransformers';

/**
 * useConsultantsData Hook
 * @param {Object} filters - Current filters
 * @returns {Object} Consultants data state and handlers
 */
export const useConsultantsData = (filters) => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [tracksList, setTracksList] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [totalEmployees, setTotalEmployees] = useState(0);

  // Fetch tracks for filter dropdown
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await tracksService.getAll({ limit: 100 });
        let tracksData = [];
        
        if (response) {
          if (Array.isArray(response.data)) {
            tracksData = response.data;
          } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
            tracksData = response.data.data;
          }
        }
        
        setTracksList(tracksData);
      } catch (error) {
        logger.error('Failed to fetch tracks', error);
      }
    };
    
    fetchTracks();
  }, []);

  // Fetch projects for filter dropdown
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectsService.getAll({ limit: 1000 });
        let projectsData = [];
        
        if (response) {
          if (Array.isArray(response.data)) {
            projectsData = response.data;
          } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
            projectsData = response.data.data;
          }
        }
        
        setProjectsList(projectsData);
      } catch (error) {
        logger.error('Failed to fetch projects', error);
      }
    };
    
    fetchProjects();
  }, []);

  // Fetch total employees count for percentage calculation
  useEffect(() => {
    const fetchTotalEmployees = async () => {
      try {
        const response = await resourcesService.getAll({ limit: 1, status: 'Active' });
        if (response && response.data && response.data.pagination) {
          setTotalEmployees(response.data.pagination.total || 0);
        }
      } catch (error) {
        logger.error('Failed to fetch total employees', error);
      }
    };
    
    fetchTotalEmployees();
  }, []);

  // Fetch external consultants report data
  useEffect(() => {
    const fetchExternalConsultantsReport = async () => {
      try {
        setLoading(true);
        
        const queryParams = {};
        
        // Add filters to query params
        if (filters.track_id) queryParams.track_id = filters.track_id;
        if (filters.tech_stack) queryParams.tech_stack = filters.tech_stack;
        if (filters.project_id) queryParams.project_id = filters.project_id;
        if (filters.start_date) queryParams.start_date = filters.start_date;
        if (filters.end_date) queryParams.end_date = filters.end_date;
        
        const response = await reportsService.getExternalConsultants(queryParams);
        
        if (response && response.success !== false) {
          setReportData(response);
        } else {
          showErrorToast('Failed to load external consultants report');
          setReportData(null);
        }
      } catch (error) {
        logger.error('Failed to fetch external consultants report', error);
        showErrorToast('Failed to load external consultants report');
        setReportData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchExternalConsultantsReport();
  }, [filters.track_id, filters.tech_stack, filters.project_id, filters.start_date, filters.end_date]);

  // Calculate derived data
  const totalExternalConsultants = reportData?.summary?.totalConsultants || 0;
  const externalConsultantsPercentage = totalEmployees > 0 
    ? ((totalExternalConsultants / totalEmployees) * 100).toFixed(2) 
    : '0.00';

  const trackData = reportData?.charts?.trackDistribution || [];
  const techStackDistribution = calculateTechStackDistribution(reportData);
  const projectData = transformProjectData(reportData);
  const allocationData = transformAllocationData(reportData);
  const uniqueTechStacks = getUniqueTechStacks(reportData);

  return {
    loading,
    reportData,
    tracksList,
    projectsList,
    totalEmployees,
    totalExternalConsultants,
    externalConsultantsPercentage,
    trackData,
    techStackDistribution,
    projectData,
    allocationData,
    uniqueTechStacks,
  };
};

export default useConsultantsData;
