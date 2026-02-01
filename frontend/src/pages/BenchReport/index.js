import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Row, Col, Card, Select, Badge, Button, App } from 'antd';
import { FilterOutlined, UpOutlined, DownOutlined, ReloadOutlined } from '@ant-design/icons';
import CustomTable from '@components/Table';
import { reportsService, tracksService } from '@api';
import { showErrorToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import '@styles/pages/BenchReport.scss';

const { Option } = Select;

const BenchReport = () => {
  const { message } = App.useApp();
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [benchData, setBenchData] = useState([]);
  const [tracksList, setTracksList] = useState([]);
  const [filters, setFilters] = useState({
    track_id: undefined, // Changed from 'track: All' to track_id for API
  });
  const fetchInProgressRef = useRef(false);

  // Default filter values for comparison
  const defaultFilters = {
    track_id: undefined,
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

  // Fetch bench report data
  const fetchBenchReport = async () => {
    // Prevent duplicate calls
    if (fetchInProgressRef.current) {
      return;
    }
    
    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      const queryParams = {};
      
      // Add track_id filter if selected
      if (filters.track_id) {
        queryParams.track_id = filters.track_id;
      }
      
      const response = await reportsService.getBench(queryParams);
      
      // Handle response structure
      let reportData = [];
      if (response) {
        if (Array.isArray(response.data)) {
          reportData = response.data;
        } else if (response.data && Array.isArray(response.data)) {
          reportData = response.data;
        } else if (Array.isArray(response)) {
          reportData = response;
        }
      }
      
      // Transform API data to table format
      const transformedData = reportData.map((item, index) => ({
        key: item.id || `bench-${index}`,
        id: item.id,
        employeeName: item.name || 'N/A',
        designation: item.designation || 'N/A',
        track: item.track || 'N/A',
        daysOnBench: item.days_on_bench || 0,
        benchAllocationPercentage: item.bench_allocation_percentage || 0,
        project: 'Bench', // All bench resources are on Bench project
        allocatedDate: '', // Can be calculated if needed
        deallocatedDate: '',
        billingStatus: 'Bench',
        billingPercentage: '0.00%',
        projectAllocation: '100.00%', // Default for bench
        duration: item.days_on_bench || 0,
        status: 'Active',
      }));
      
      setBenchData(transformedData);
    } catch (error) {
      logger.error('Failed to fetch bench report', error);
      showErrorToast('Failed to load bench report');
      setBenchData([]);
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  // Fetch data when filters change
  useEffect(() => {
    fetchBenchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.track_id]);

  // KPI Data - Calculate from actual data
  const totalBenchCount = benchData.length;
  const totalEmployees = 114; // This might need to come from another API
  const benchPercentage = totalEmployees > 0 ? ((totalBenchCount / totalEmployees) * 100).toFixed(1) : '0.0';

  // Table Columns for Bench Report
  const benchColumns = [
    {
      title: 'Employee Name',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 180,
      sorter: (a, b) => a.employeeName.localeCompare(b.employeeName),
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
      title: 'Bench Allocation %',
      dataIndex: 'benchAllocationPercentage',
      key: 'benchAllocationPercentage',
      width: 150,
      sorter: (a, b) => a.benchAllocationPercentage - b.benchAllocationPercentage,
      render: (percentage) => `${parseFloat(percentage || 0).toFixed(2)}%`,
    },
    {
      title: 'Days on Bench',
      dataIndex: 'daysOnBench',
      key: 'daysOnBench',
      width: 130,
      sorter: (a, b) => a.daysOnBench - b.daysOnBench,
      render: (days) => `${days} days`,
    },
  ];


  return (
    <div className="bench-report-page">
      {/* Header Section */}
      <div className="report-header">
        <h1 className="report-title">BENCH REPORT</h1>
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

      {/* KPI Cards Section */}
      <Row gutter={[16, 16]} className="kpi-section">
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="kpi-card">
            <div className="kpi-value">{totalBenchCount}</div>
            <div className="kpi-label">TOTAL BENCH COUNT</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="kpi-card">
            <div className="kpi-value">{benchPercentage}%</div>
            <div className="kpi-label">BENCH PERCENTAGE</div>
          </Card>
        </Col>
      </Row>

      {/* Table Section */}
      <Card className="table-card" title="Bench Resources">
        <CustomTable
          columns={benchColumns}
          dataSource={benchData}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
          size="small"
          loading={loading}
        />
      </Card>

    </div>
  );
};

export default BenchReport;
