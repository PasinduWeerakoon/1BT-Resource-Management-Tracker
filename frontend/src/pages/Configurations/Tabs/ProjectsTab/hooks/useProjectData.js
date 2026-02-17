/**
 * useProjectData Hook
 * Manages project data fetching and state
 */

import { useState, useEffect } from 'react';
import { projectsService, clientsService, accountManagersService } from '@api';
import { showErrorToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import { PAGINATION } from '@constants/app';

/**
 * useProjectData Hook
 * @param {Object} pagination - Current pagination state
 * @returns {Object} Project data state and handlers
 */
export const useProjectData = (pagination) => {
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [clients, setClients] = useState([]);
  const [accountManagersList, setAccountManagersList] = useState([]);
  const [loadingAccountManagers, setLoadingAccountManagers] = useState(false);

  // Fetch clients for dropdown
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await clientsService.getAll({ limit: 1000 });
        let clientsData = [];

        if (response) {
          if (Array.isArray(response.data)) {
            clientsData = response.data;
          } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
            clientsData = response.data.data;
          } else if (response.data && Array.isArray(response.data)) {
            clientsData = response.data;
          }
        }

        setClients(clientsData.map(client => ({
          id: client.id,
          name: client.client_name || client.name,
        })));
      } catch (error) {
        logger.error('Failed to fetch clients:', error);
      }
    };

    fetchClients();
  }, []);

  // Fetch account managers
  useEffect(() => {
    const fetchAccountManagers = async () => {
      try {
        setLoadingAccountManagers(true);
        const response = await accountManagersService.getAll();
        let accountManagersData = [];

        if (response) {
          if (Array.isArray(response.data)) {
            accountManagersData = response.data;
          } else if (response.data && Array.isArray(response.data)) {
            accountManagersData = response.data;
          } else if (Array.isArray(response)) {
            accountManagersData = response;
          }
        }

        const accountManagers = accountManagersData
          .filter(am => am.id && am.name)
          .map(am => ({
            id: am.id,
            name: am.name,
          }));

        setAccountManagersList(accountManagers);
      } catch (error) {
        logger.error('Failed to fetch account managers:', error);
        showErrorToast('Failed to load account managers');
      } finally {
        setLoadingAccountManagers(false);
      }
    };

    fetchAccountManagers();
  }, []);

  /**
   * Fetch projects
   * @param {number} page - Page number
   * @param {number} limit - Page size
   * @returns {Object} Projects data and pagination
   */
  const fetchProjects = async (page = 1, limit = PAGINATION.DEFAULT_PAGE_SIZE) => {
    try {
      setLoadingProjects(true);
      const response = await projectsService.getAll({ page, limit });

      let projectsData = [];
      let paginationData = {};

      if (response) {
        if (Array.isArray(response.data)) {
          projectsData = response.data;
          paginationData = response.pagination || {};
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          projectsData = response.data.data;
          paginationData = response.data.pagination || {};
        } else if (response.pagination && response.data && Array.isArray(response.data)) {
          projectsData = response.data;
          paginationData = response.pagination;
        } else if (Array.isArray(response)) {
          projectsData = response;
          paginationData = {};
        }
      }

      paginationData = {
        total: paginationData.total || 0,
        page: paginationData.page || page,
        limit: paginationData.limit || limit,
        totalPages: paginationData.totalPages || 0,
      };

      const transformed = projectsData.map((project) => ({
        key: project.id,
        id: project.id,
        project_name: project.project_name,
        project_code: project.project_code,
        client_id: project.client_id,
        client_name: project.client_name,
        // For table display (keep existing fields)
        project_type: project.project_type || project.project_type_name,
        account_manager_name: project.account_manager_name || null,
        is_billable: project.is_billable,
        status: project.status,
        start_date: project.start_date || project.project_start_date,
        end_date: project.end_date || project.project_end_date,
        description: project.description,
        is_default: project.isDefault ?? project.is_default ?? false,
        // For form editing (add new fields)
        project_type_id: project.project_type_id || null,
        account_type: project.account_type || project.accountType || null,
        account_manager_id: project.account_manager_id || project.accountManagerId || null,
        billing_status_id: project.billing_status_id || project.billingStatusId || null,
        team_size: project.team_size !== undefined && project.team_size !== null ? project.team_size : (project.teamSize !== undefined && project.teamSize !== null ? project.teamSize : 1),
        account_reg_sales_owner: project.account_reg_sales_owner || project.accountRegSalesOwner || '',
        budget: project.budget !== undefined && project.budget !== null ? parseFloat(project.budget) : 0,
        project_start_date: project.project_start_date || project.projectStartDate || project.start_date || null,
        project_end_date: project.project_end_date || project.projectEndDate || project.end_date || null,
      }));

      setProjects(transformed);

      return {
        projects: transformed,
        pagination: paginationData,
      };
    } catch (error) {
      logger.error('Failed to fetch projects:', error);
      showErrorToast('Failed to load projects');
      throw error;
    } finally {
      setLoadingProjects(false);
    }
  };

  return {
    projects,
    setProjects,
    loadingProjects,
    clients,
    accountManagersList,
    loadingAccountManagers,
    fetchProjects,
  };
};

export default useProjectData;
