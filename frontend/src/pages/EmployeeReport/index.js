import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Row, Col, Card, Select, Badge, Button, App, Table } from 'antd';
import { FilterOutlined, UpOutlined, DownOutlined, ReloadOutlined } from '@ant-design/icons';
import CustomTable from '@components/Table';
import { reportsService, tracksService, resourcesService } from '@api';
import { showErrorToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import '@styles/pages/EmployeeReport.scss';

const { Option } = Select;

const EmployeeReport = () => {
  const { message } = App.useApp();
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [tracksList, setTracksList] = useState([]);
  const [resourcesList, setResourcesList] = useState([]);
  const [filters, setFilters] = useState({
    resource_id: undefined,
    track_id: undefined,
  });
  const fetchInProgressRef = useRef(false);

  // Default filter values for comparison
  const defaultFilters = {
    resource_id: undefined,
    track_id: undefined,
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== defaultFilters[key] && filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
        count++;
      }
    });
    return count;
  }, [filters]);

  // Reset filters to default values
  const handleResetFilters = (e) => {
    e.stopPropagation();
    setFilters({ ...defaultFilters });
  };

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

  // Fetch resources for filter dropdown
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await resourcesService.getAll({ limit: 100 });
        let resourcesData = [];
        
        if (response) {
          if (Array.isArray(response.data)) {
            resourcesData = response.data;
          } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
            resourcesData = response.data.data;
          }
        }
        
        setResourcesList(resourcesData);
      } catch (error) {
        logger.error('Failed to fetch resources', error);
      }
    };
    
    fetchResources();
  }, []);

  // Fetch employee report data
  const fetchEmployeeReport = async () => {
    // Prevent duplicate calls
    if (fetchInProgressRef.current) {
      return;
    }
    
    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      const queryParams = {};
      
      // Add filters if selected
      if (filters.resource_id) {
        queryParams.resource_id = filters.resource_id;
      }
      if (filters.track_id) {
        queryParams.track_id = filters.track_id;
      }
      
      const response = await reportsService.getEmployee(queryParams);
      
      // Handle response structure - API returns { data: [...], total: number, generatedAt: string }
      let reportDataArray = [];
      if (response) {
        if (response.data && Array.isArray(response.data)) {
          reportDataArray = response.data;
        } else if (Array.isArray(response)) {
          reportDataArray = response;
        }
      }
      
      // Transform API data to table format
      const transformedData = reportDataArray.map((item, index) => {
        const totalAllocation = parseFloat(item.total_allocation || 0);
        const currentProjects = item.current_projects ? item.current_projects.split(',').map(p => p.trim()) : [];
        
        return {
          key: item.id || `employee-${index}`,
          id: item.id,
          employeeId: item.employee_id || 'N/A',
          employeeName: item.name || 'N/A',
          email: item.email || 'N/A',
          designation: item.designation || 'N/A',
          track: item.track || 'N/A',
          status: item.status || 'N/A',
          dateOfJoining: item.date_of_joining ? new Date(item.date_of_joining).toLocaleDateString() : 'N/A',
          totalAllocation: totalAllocation,
          totalAllocationFormatted: `${totalAllocation.toFixed(2)}%`,
          currentProjects: currentProjects,
          currentProjectsString: item.current_projects || 'N/A',
        };
      });
      
      setReportData(transformedData);
    } catch (error) {
      logger.error('Failed to fetch employee report', error);
      showErrorToast('Failed to load employee report');
      setReportData([]);
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  // Fetch data when filters change
  useEffect(() => {
    fetchEmployeeReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.resource_id, filters.track_id]);


  // Table columns
  const columns = [
    {
      title: 'Employee ID',
      dataIndex: 'employeeId',
      key: 'employeeId',
      width: 120,
      sorter: (a, b) => a.employeeId.localeCompare(b.employeeId),
    },
    {
      title: 'Employee Name',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 180,
      sorter: (a, b) => a.employeeName.localeCompare(b.employeeName),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
      width: 150,
    },
    {
      title: 'Track',
      dataIndex: 'track',
      key: 'track',
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Badge
          status={status === 'Active' ? 'success' : status === 'Bench' ? 'default' : 'error'}
          text={status}
        />
      ),
    },
    {
      title: 'Date of Joining',
      dataIndex: 'dateOfJoining',
      key: 'dateOfJoining',
      width: 130,
    },
    {
      title: 'Total Allocation',
      dataIndex: 'totalAllocationFormatted',
      key: 'totalAllocation',
      width: 130,
      sorter: (a, b) => a.totalAllocation - b.totalAllocation,
      render: (text, record) => (
        <span style={{ 
          color: record.totalAllocation > 100 ? '#ff4d4f' : record.totalAllocation < 100 ? '#52c41a' : '#1890ff',
          fontWeight: record.totalAllocation > 100 ? 'bold' : 'normal'
        }}>
          {text}
        </span>
      ),
    },
    {
      title: 'Current Projects',
      dataIndex: 'currentProjectsString',
      key: 'currentProjects',
      width: 250,
      render: (text, record) => (
        <div>
          {record.currentProjects && record.currentProjects.length > 0 ? (
            <div>
              {record.currentProjects.map((project, idx) => (
                <Badge
                  key={idx}
                  count={project}
                  style={{ 
                    backgroundColor: project === 'Bench' ? '#999' : '#1890ff',
                    marginRight: 8,
                    marginBottom: 4
                  }}
                />
              ))}
            </div>
          ) : (
            <span style={{ color: '#999' }}>No projects</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="employee-report-page">
      {/* Header Section */}
      <div className="report-header">
        <h1 className="report-title">EMPLOYEE REPORT</h1>
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
                  <label>Employee</label>
                  <Select
                    value={filters.resource_id}
                    onChange={(value) => setFilters({ ...filters, resource_id: value || undefined })}
                    style={{ width: '100%' }}
                    allowClear
                    showSearch
                    placeholder="All Employees"
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {resourcesList.map((resource) => (
                      <Option key={resource.id} value={resource.id}>
                        {resource.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div className="filter-item">
                  <label>Track</label>
                  <Select
                    value={filters.track_id}
                    onChange={(value) => setFilters({ ...filters, track_id: value || undefined })}
                    style={{ width: '100%' }}
                    allowClear
                    placeholder="All Tracks"
                  >
                    {tracksList.map((track) => (
                      <Option key={track.id} value={track.id}>
                        {track.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Card>

      {/* Table Section */}
      <Card className="table-card" title="Employee Report">
        <CustomTable
          columns={columns}
          dataSource={reportData}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1400 }}
          size="small"
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default EmployeeReport;
