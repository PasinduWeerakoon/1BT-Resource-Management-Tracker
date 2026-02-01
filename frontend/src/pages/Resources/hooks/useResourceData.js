/**
 * useResourceData Hook
 * Handles fetching and managing resource/employee data
 */

import { useState, useEffect, useRef } from 'react';
import { resourcesService, designationsService, tracksService, tagsService, tiersService } from '@api';
import { showErrorToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import dayjs from 'dayjs';
import { App } from 'antd';

export const useResourceData = ({ filters, debouncedSearch, pagination, setPagination }) => {
  const { message } = App.useApp();
  const [employees, setEmployees] = useState([]);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);
  const [designations, setDesignations] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [tags, setTags] = useState([]);
  const [tiers, setTiers] = useState([]);
  const dropdownDataFetched = useRef(false);

  // Fetch designations, tracks, tags, and tiers on component mount
  useEffect(() => {
    const fetchDropdownData = async () => {
      if (dropdownDataFetched.current) return;
      dropdownDataFetched.current = true;

      try {
        const [designationsRes, tracksRes, tagsRes, tiersRes] = await Promise.all([
          designationsService.getAll(),
          tracksService.getAll(),
          tagsService.getAll(),
          tiersService.getAll(),
        ]);

        if (designationsRes && designationsRes.data) {
          setDesignations(designationsRes.data);
        }
        if (tracksRes && tracksRes.data) {
          setTracks(tracksRes.data);
        }
        if (tagsRes && tagsRes.data) {
          let tagsData = [];
          if (Array.isArray(tagsRes.data)) {
            tagsData = tagsRes.data;
          } else if (tagsRes.data && tagsRes.data.data && Array.isArray(tagsRes.data.data)) {
            tagsData = tagsRes.data.data;
          }
          setTags(tagsData);
        }
        if (tiersRes && tiersRes.data) {
          let tiersData = [];
          if (Array.isArray(tiersRes.data)) {
            tiersData = tiersRes.data;
          } else if (tiersRes.data && tiersRes.data.data && Array.isArray(tiersRes.data.data)) {
            tiersData = tiersRes.data.data;
          }
          setTiers(tiersData);
        }
      } catch (error) {
        logger.error('Failed to fetch dropdown data', error);
      }
    };

    fetchDropdownData();
  }, []);

  // Fetch employees from API
  const fetchEmployees = async (page = 1, limit = 20) => {
    if (fetchingEmployees) return;

    try {
      setFetchingEmployees(true);

      const queryParams = {
        page,
        limit,
      };

      // Add search if name or employeeNumber is provided
      const searchValue = debouncedSearch.name || debouncedSearch.employeeNumber;
      if (searchValue) {
        queryParams.search = searchValue.toLowerCase().trim();
      }

      // Add filters
      if (filters.track_id) {
        queryParams.track_id = filters.track_id;
      }
      if (filters.designation_id) {
        queryParams.designation_id = filters.designation_id;
      }
      if (filters.status && filters.status !== 'All') {
        queryParams.status = filters.status;
      }
      if (filters.tier && filters.tier !== 'All') {
        queryParams.tier = filters.tier;
      }
      if (debouncedSearch.employeeNumber) {
        queryParams.employee_number = debouncedSearch.employeeNumber;
      }
      if (debouncedSearch.name) {
        queryParams.name = debouncedSearch.name;
      }

      const response = await resourcesService.getAll(queryParams);

      let employeesData = [];
      let paginationData = {};

      if (response) {
        if (response.data && Array.isArray(response.data) && response.pagination) {
          employeesData = response.data;
          paginationData = response.pagination;
        } else if (Array.isArray(response)) {
          employeesData = response;
          paginationData = {};
        } else if (response.data && Array.isArray(response.data)) {
          employeesData = response.data;
          paginationData = response.pagination || {};
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          employeesData = response.data.data;
          paginationData = response.data.pagination || {};
        } else if (response.success && response.data) {
          if (Array.isArray(response.data)) {
            employeesData = response.data;
            paginationData = response.pagination || {};
          } else if (response.data.data && Array.isArray(response.data.data)) {
            employeesData = response.data.data;
            paginationData = response.data.pagination || {};
          }
        }
      }

      paginationData = {
        total: paginationData.total || 0,
        page: paginationData.page || page,
        limit: paginationData.limit || limit,
        totalPages: paginationData.totalPages || 0,
      };

      // Transform employees data
      const transformedEmployees = employeesData.map((employee) => {
        const tier = employee.tier || (employee.designation_level
          ? `Tier ${String(employee.designation_level).padStart(2, '0')}`
          : null);

        const joinDate = employee.date_of_joining
          ? dayjs(employee.date_of_joining).format('YYYY-MM-DD')
          : null;

        return {
          key: employee.id || employee.employee_number,
          id: employee.id,
          employee_id: employee.employee_id,
          employeeNumber: employee.employee_number || employee.employeeNumber,
          name: employee.name,
          email: employee.email,
          mobile: employee.phone_number || employee.mobile,
          phone_number: employee.phone_number,
          tier: tier,
          position: employee.designation_name || employee.position,
          designation_id: employee.designation_id,
          designation_name: employee.designation_name,
          designation_level: employee.designation_level,
          track_id: employee.track_id,
          track_name: employee.track_name,
          joinDate: joinDate,
          status: employee.status,
          photo: employee.photo,
          photo_url: employee.photo_url || employee.photo,
          nic: employee.nic_passport || employee.nic,
          nic_passport: employee.nic_passport,
          date_of_birth: employee.date_of_birth,
          address: employee.address,
          is_intern: employee.is_intern !== undefined ? employee.is_intern : (employee.intern_classification !== null ? employee.intern_classification : false),
          intern_classification: employee.intern_classification,
          tech_stack: employee.tech_stack,
          skills: employee.skills || [],
          employee_type: employee.employee_type || 'Internal',
          is_account_manager: employee.is_account_manager || false,
          tags: employee.tags || [],
          notice_period_end_date: employee.notice_period_end_date,
          date_of_joining: employee.date_of_joining,
          ...employee,
        };
      });

      setEmployees(transformedEmployees);
      setPagination({
        current: paginationData.page || page,
        pageSize: paginationData.limit || limit,
        total: paginationData.total || 0,
      });
    } catch (error) {
      logger.error('Failed to fetch employees', error);
      message.error(error?.response?.data?.message || error?.message || 'Failed to load employees');
    } finally {
      setFetchingEmployees(false);
    }
  };

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees(1, 20);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch employees when API-supported filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchEmployees(1, pagination.pageSize || 20);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch.name, debouncedSearch.employeeNumber, filters.track_id, filters.designation_id, filters.status, filters.tier]);

  return {
    employees,
    setEmployees,
    fetchingEmployees,
    designations,
    tracks,
    tags,
    tiers,
    fetchEmployees,
  };
};
