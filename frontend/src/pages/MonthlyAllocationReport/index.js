import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Row, Col, Card, Select, Badge, Button, App, Table, Radio } from 'antd';
import { FilterOutlined, UpOutlined, DownOutlined, ReloadOutlined } from '@ant-design/icons';
import CustomTable from '@components/Table';
import { reportsService, tracksService } from '@api';
import { showErrorToast } from '@utils/toast.utils';
import dayjs from 'dayjs';
import '@styles/pages/MonthlyAllocationReport.scss';

const { Option } = Select;

const MonthlyAllocationReport = () => {
  const { message } = App.useApp();
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [groupedData, setGroupedData] = useState([]);
  const [periodInfo, setPeriodInfo] = useState(null);
  const [viewMode, setViewMode] = useState('detailed'); // 'detailed' or 'grouped'
  const [tracksList, setTracksList] = useState([]);
  const currentDate = dayjs();
  const [filters, setFilters] = useState({
    year: currentDate.year(),
    month: currentDate.month() + 1, // dayjs months are 0-indexed
    track_id: undefined,
  });
  const fetchInProgressRef = useRef(false);

  // Default filter values for comparison
  const defaultFilters = {
    year: currentDate.year(),
    month: currentDate.month() + 1,
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

  // Generate year options (current year and previous 5 years)
  const yearOptions = useMemo(() => {
    const years = [];
    const currentYear = currentDate.year();
    for (let i = 0; i < 6; i++) {
      years.push(currentYear - i);
    }
    return years;
  }, []);

  // Generate month options
  const monthOptions = useMemo(() => {
    return [
      { value: 1, label: 'January' },
      { value: 2, label: 'February' },
      { value: 3, label: 'March' },
      { value: 4, label: 'April' },
      { value: 5, label: 'May' },
      { value: 6, label: 'June' },
      { value: 7, label: 'July' },
      { value: 8, label: 'August' },
      { value: 9, label: 'September' },
      { value: 10, label: 'October' },
      { value: 11, label: 'November' },
      { value: 12, label: 'December' },
    ];
  }, []);

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
        console.error('Failed to fetch tracks:', error);
      }
    };
    
    fetchTracks();
  }, []);

  // Fetch monthly allocation report data
  const fetchMonthlyAllocationReport = async () => {
    // Prevent duplicate calls
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
      
      // Add track_id filter if selected
      if (filters.track_id) {
        queryParams.track_id = filters.track_id;
      }
      
      const response = await reportsService.getMonthlyAllocation(queryParams);
      
      // Handle response structure - API returns { success: true, data: { data: [...], total, period, generatedAt } }
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
      
      // Store period info for display
      setPeriodInfo(periodInfo);
      
      // Store both detailed data and grouped data
      setReportData(transformedData);
      setGroupedData(Object.values(resourceTotals));
    } catch (error) {
      console.error('Failed to fetch monthly allocation report:', error);
      showErrorToast('Failed to load monthly allocation report');
      setReportData([]);
      setGroupedData([]);
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  // Fetch data when filters change
  useEffect(() => {
    if (filters.year && filters.month) {
      fetchMonthlyAllocationReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.year, filters.month, filters.track_id]);

  // Expand allocations column renderer for grouped view
  const expandedRowRender = (record) => {
    const columns = [
      {
        title: 'Project Name',
        dataIndex: 'projectName',
        key: 'projectName',
        width: 200,
      },
      {
        title: 'Client Name',
        dataIndex: 'clientName',
        key: 'clientName',
        width: 200,
        render: (text) => text || <span style={{ color: '#999' }}>N/A</span>,
      },
      {
        title: 'Allocation Percentage',
        dataIndex: 'allocationPercentageFormatted',
        key: 'allocationPercentage',
        width: 150,
        sorter: (a, b) => a.allocationPercentage - b.allocationPercentage,
      },
      {
        title: 'Start Date',
        dataIndex: 'startDate',
        key: 'startDate',
        width: 120,
      },
      {
        title: 'End Date',
        dataIndex: 'endDate',
        key: 'endDate',
        width: 120,
        render: (text) => (
          <span style={{ color: text === 'Ongoing' ? '#52c41a' : '#262626' }}>
            {text}
          </span>
        ),
      },
    ];

    return (
      <Table
        columns={columns}
        dataSource={record.allocations.map((alloc, idx) => ({
          key: alloc.key || `alloc-${idx}`,
          ...alloc,
        }))}
        pagination={false}
        size="small"
      />
    );
  };

  // Table columns for detailed view
  const detailedColumns = [
    {
      title: 'Resource Name',
      dataIndex: 'resourceName',
      key: 'resourceName',
      width: 150,
      fixed: 'left',
      sorter: (a, b) => a.resourceName.localeCompare(b.resourceName),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 180,
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
      title: 'Project Name',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 180,
      sorter: (a, b) => a.projectName.localeCompare(b.projectName),
    },
    {
      title: 'Client Name',
      dataIndex: 'clientName',
      key: 'clientName',
      width: 180,
      render: (text) => text || <span style={{ color: '#999' }}>N/A</span>,
    },
    {
      title: 'Allocation Percentage',
      dataIndex: 'allocationPercentageFormatted',
      key: 'allocationPercentage',
      width: 150,
      sorter: (a, b) => a.allocationPercentage - b.allocationPercentage,
      render: (text, record) => (
        <span style={{ 
          color: record.allocationPercentage > 100 ? '#ff4d4f' : '#1890ff',
          fontWeight: record.allocationPercentage > 100 ? 'bold' : 'normal'
        }}>
          {text}
        </span>
      ),
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
      render: (text) => (
        <span style={{ color: text === 'Ongoing' ? '#52c41a' : '#262626' }}>
          {text}
        </span>
      ),
    },
  ];

  // Table columns for grouped view
  const groupedColumns = [
    {
      title: 'Resource Name',
      dataIndex: 'resourceName',
      key: 'resourceName',
      width: 180,
      sorter: (a, b) => a.resourceName.localeCompare(b.resourceName),
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
      title: 'Total Allocation',
      dataIndex: 'totalAllocation',
      key: 'totalAllocation',
      width: 150,
      sorter: (a, b) => a.totalAllocation - b.totalAllocation,
      render: (total, record) => {
        const formatted = `${total.toFixed(2)}%`;
        return (
          <span style={{ 
            color: total > 100 ? '#ff4d4f' : total < 100 ? '#52c41a' : '#1890ff',
            fontWeight: total > 100 ? 'bold' : 'normal'
          }}>
            {formatted}
          </span>
        );
      },
    },
    {
      title: 'Number of Projects',
      dataIndex: 'allocations',
      key: 'allocationCount',
      width: 150,
      render: (allocations) => allocations?.length || 0,
    },
  ];

  return (
    <div className="monthly-allocation-report-page">
      {/* Header Section */}
      <div className="report-header">
        <h1 className="report-title">MONTHLY ALLOCATION REPORT</h1>
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
                  <label>Year</label>
                  <Select
                    value={filters.year}
                    onChange={(value) => setFilters({ ...filters, year: value })}
                    style={{ width: '100%' }}
                  >
                    {yearOptions.map((year) => (
                      <Option key={year} value={year}>
                        {year}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div className="filter-item">
                  <label>Month</label>
                  <Select
                    value={filters.month}
                    onChange={(value) => setFilters({ ...filters, month: value })}
                    style={{ width: '100%' }}
                  >
                    {monthOptions.map((month) => (
                      <Option key={month.value} value={month.value}>
                        {month.label}
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

      {/* Period Info Section */}
      {periodInfo && (
        <Card className="period-info-card" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: 4 }}>Period</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {monthOptions.find(m => m.value === filters.month)?.label} {filters.year}
                </div>
              </div>
            </Col>
            <Col span={9}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: 4 }}>Start Date</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {periodInfo.startDate ? new Date(periodInfo.startDate).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </Col>
            <Col span={9}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: 4 }}>End Date</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {periodInfo.endDate ? new Date(periodInfo.endDate).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* Table Section */}
      <Card 
        className="table-card" 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Monthly Allocation Report</span>
            <Radio.Group 
              value={viewMode} 
              onChange={(e) => setViewMode(e.target.value)}
              size="small"
            >
              <Radio.Button value="detailed">Detailed View</Radio.Button>
              <Radio.Button value="grouped">Grouped by Resource</Radio.Button>
            </Radio.Group>
          </div>
        }
      >
        <CustomTable
          columns={viewMode === 'detailed' ? detailedColumns : groupedColumns}
          dataSource={viewMode === 'detailed' ? reportData : groupedData}
          pagination={{ pageSize: 10 }}
          scroll={{ x: viewMode === 'detailed' ? 1500 : 1000 }}
          size="small"
          loading={loading}
          expandable={
            viewMode === 'grouped'
              ? {
                  expandedRowRender,
                  rowExpandable: (record) => record.allocations && record.allocations.length > 0,
                }
              : undefined
          }
        />
      </Card>
    </div>
  );
};

export default MonthlyAllocationReport;
