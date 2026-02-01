import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Row, Col, Card, Select, Badge, Button } from 'antd';
import { FilterOutlined, UpOutlined, DownOutlined, ReloadOutlined } from '@ant-design/icons';
import CustomTable from '@components/Table';
import { accountManagersService, reportsService, projectsService, tracksService } from '@api';
import { useUserAllocationModal } from '@hooks/useUserAllocationModal';
import UserAllocationModal from '@components/UserAllocationModal';
import { showErrorToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import '@styles/pages/InternReport.scss';

const { Option } = Select;

const InternReport = () => {
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filters, setFilters] = useState({
    projectName: 'All',
    accountManager: 'All',
    track: 'All',
    techStack: 'All',
  });

  // Default filter values for comparison
  const defaultFilters = {
    projectName: 'All',
    accountManager: 'All',
    track: 'All',
    techStack: 'All',
  };

  // Count active filters (filters that differ from defaults)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== defaultFilters[key] && filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
        count++;
      }
    });
    return count;
  }, [filters]);

  // Filter options for dropdowns
  const [accountManagers, setAccountManagers] = useState([]);
  const [loadingAccountManagers, setLoadingAccountManagers] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [techStacks, setTechStacks] = useState([]);

  // Report data
  const [internData, setInternData] = useState([]);
  const [totalInternCount, setTotalInternCount] = useState(0);
  const [internPercentage, setInternPercentage] = useState('0.0');
  const [loadingReport, setLoadingReport] = useState(false);

  // Refs to prevent duplicate API calls
  const fetchReportInProgressRef = useRef(false);

  // Fetch filter options on mount
  useEffect(() => {
    const fetchAccountManagers = async () => {
      try {
        setLoadingAccountManagers(true);
        const response = await accountManagersService.getAll();
        const data = response.data || response || [];
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
            ? data.data
            : [];
        const formatted = list
          .map((am) => ({
            id: am.id,
            name: am.name,
          }))
          .filter((am) => am.id && am.name);
        setAccountManagers(formatted);
      } catch (error) {
        logger.error('Failed to fetch account managers', error);
      } finally {
        setLoadingAccountManagers(false);
      }
    };

    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const response = await projectsService.getAll({ limit: 100 });
        let projectsData = [];

        if (response) {
          if (Array.isArray(response.data)) {
            projectsData = response.data;
          } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
            projectsData = response.data.data;
          } else if (response.data && Array.isArray(response.data)) {
            projectsData = response.data;
          }
        }

        const formatted = projectsData
          .map((project) => ({
            id: project.id,
            name: project.project_name || project.name,
          }))
          .filter((project) => project.id && project.name);

        setProjects(formatted);
      } catch (error) {
        logger.error('Failed to fetch projects', error);
      } finally {
        setLoadingProjects(false);
      }
    };

    const fetchTracks = async () => {
      try {
        setLoadingTracks(true);
        const response = await tracksService.getAll({ limit: 100 });
        let tracksData = [];

        if (response) {
          if (Array.isArray(response.data)) {
            tracksData = response.data;
          } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
            tracksData = response.data.data;
          }
        }

        const formatted = tracksData
          .map((track) => ({
            id: track.id,
            name: track.name,
          }))
          .filter((track) => track.id && track.name);

        setTracks(formatted);
      } catch (error) {
        logger.error('Failed to fetch tracks', error);
      } finally {
        setLoadingTracks(false);
      }
    };

    fetchAccountManagers();
    fetchProjects();
    fetchTracks();
  }, []);

  // Fetch intern report data
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
          // Only extract on initial load (when no filters are applied) to get all available tech stacks
          const hasNoFilters = filters.projectName === 'All' &&
            filters.accountManager === 'All' &&
            filters.track === 'All' &&
            filters.techStack === 'All';

          if (hasNoFilters && reportData.data.length > 0) {
            // Get unique tech stacks from the intern data
            // Since each row represents an intern-project allocation, we need to get unique interns first
            const uniqueInterns = new Map();
            reportData.data.forEach((row) => {
              // Use employeeName as key to get unique interns
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

  // Fetch report on mount and when any filter changes
  useEffect(() => {
    fetchInternReport();
  }, [filters.projectName, filters.accountManager, filters.track, filters.techStack]);

  // Reset filters to default values
  const handleResetFilters = (e) => {
    e.stopPropagation();
    setFilters({ ...defaultFilters });
  };

  // User allocation modal hook
  const {
    isUserAllocationModalVisible,
    selectedEmployee,
    userAllocationsList,
    userAllocationsForm,
    handleRowClick,
    handleUserAllocationCancel,
    handleAddUserAllocationRow,
    handleRemoveUserAllocationRow,
    handleUserAllocationFieldChange,
    handleUserAllocationsSubmit,
  } = useUserAllocationModal(internData);

  // Table Columns - Same as BY ALLOCATION
  const allocationColumns = [
    {
      title: 'Employee Name',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 180,
      sorter: (a, b) => a.employeeName.localeCompare(b.employeeName),
    },
    {
      title: 'Project',
      dataIndex: 'project',
      key: 'project',
      width: 150,
    },
    {
      title: 'Project Allocated Date',
      dataIndex: 'allocatedDate',
      key: 'allocatedDate',
      width: 160,
    },
    {
      title: 'Project Deallocated Date',
      dataIndex: 'deallocatedDate',
      key: 'deallocatedDate',
      width: 180,
    },
    {
      title: 'Billing Status',
      dataIndex: 'billingStatus',
      key: 'billingStatus',
      width: 130,
    },
    {
      title: 'Billing Percentage',
      dataIndex: 'billingPercentage',
      key: 'billingPercentage',
      width: 140,
    },
    {
      title: 'Project Allocation',
      dataIndex: 'projectAllocation',
      key: 'projectAllocation',
      width: 140,
    },
    {
      title: 'Duration (Days)',
      dataIndex: 'duration',
      key: 'duration',
      width: 130,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
    },
  ];


  return (
    <div className="intern-report-page">
      {/* Header Section */}
      <div className="report-header">
        <h1 className="report-title">INTERN REPORT</h1>
      </div>

      {/* Filters Section */}
      <Card className="filters-card">
        <div
          className="filters-header"
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          style={{ cursor: 'pointer' }}
        >
          <div className="filters-header-left">
            <FilterOutlined className="filter-icon" />
            <span className="filters-title">Filters</span>
            {activeFiltersCount > 0 && (
              <>
                <Badge count={activeFiltersCount} showZero={false} className="active-filters-badge">
                  <span></span>
                </Badge>
                <Button
                  type="text"
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={handleResetFilters}
                  className="reset-filters-btn"
                >
                  Reset
                </Button>
              </>
            )}
          </div>
          {filtersExpanded ? (
            <UpOutlined className="collapse-icon" />
          ) : (
            <DownOutlined className="collapse-icon" />
          )}
        </div>
        {filtersExpanded && (
          <div className="filters-content">
            <Row gutter={[16, 16]} className="filters-row">
              <Col xs={24} sm={12} md={8} lg={6}>
                <div className="filter-item">
                  <label>Project Name</label>
                  <Select
                    value={filters.projectName}
                    onChange={(value) => setFilters({ ...filters, projectName: value })}
                    style={{ width: '100%' }}
                    loading={loadingProjects}
                    showSearch
                    allowClear
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    <Option value="All">All</Option>
                    {projects.map((project) => (
                      <Option key={project.id} value={project.name} label={project.name}>
                        {project.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div className="filter-item">
                  <label>Account Manager</label>
                  <Select
                    value={filters.accountManager}
                    onChange={(value) => setFilters({ ...filters, accountManager: value })}
                    style={{ width: '100%' }}
                    loading={loadingAccountManagers}
                    showSearch
                    allowClear
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    <Option value="All">All</Option>
                    {accountManagers.map((am) => (
                      <Option key={am.id} value={am.name} label={am.name}>
                        {am.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div className="filter-item">
                  <label>Track</label>
                  <Select
                    value={filters.track}
                    onChange={(value) => setFilters({ ...filters, track: value })}
                    style={{ width: '100%' }}
                    loading={loadingTracks}
                    showSearch
                    allowClear
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    <Option value="All">All</Option>
                    {tracks.map((track) => (
                      <Option key={track.id} value={track.name} label={track.name}>
                        {track.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div className="filter-item">
                  <label>Tech Stack</label>
                  <Select
                    value={filters.techStack}
                    onChange={(value) => setFilters({ ...filters, techStack: value })}
                    style={{ width: '100%' }}
                    showSearch
                    allowClear
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    <Option value="All">All</Option>
                    {techStacks.map((techStack) => (
                      <Option key={techStack.name} value={techStack.name} label={techStack.name}>
                        {techStack.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Card>

      {/* KPI Cards Section */}
      <Row gutter={[16, 16]} className="kpi-section">
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="kpi-card" loading={loadingReport}>
            <div className="kpi-value">{totalInternCount}</div>
            <div className="kpi-label">TOTAL INTERN COUNT</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="kpi-card" loading={loadingReport}>
            <div className="kpi-value">{internPercentage}%</div>
            <div className="kpi-label">INTERN PERCENTAGE</div>
          </Card>
        </Col>
      </Row>

      {/* Table Section */}
      <Card className="table-card" title="BY ALLOCATION" loading={loadingReport}>
        <CustomTable
          columns={allocationColumns}
          dataSource={internData}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
          size="small"
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      {/* User Allocations Modal */}
      <UserAllocationModal
        visible={isUserAllocationModalVisible}
        selectedEmployee={selectedEmployee}
        allocationsList={userAllocationsList}
        form={userAllocationsForm}
        onCancel={handleUserAllocationCancel}
        onAddRow={handleAddUserAllocationRow}
        onRemoveRow={handleRemoveUserAllocationRow}
        onFieldChange={handleUserAllocationFieldChange}
        onSubmit={handleUserAllocationsSubmit}
      />
    </div>
  );
};

export default InternReport;
