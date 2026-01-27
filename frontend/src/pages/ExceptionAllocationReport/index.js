import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Row, Col, Card, Badge, Button, App } from 'antd';
import { FilterOutlined, UpOutlined, DownOutlined, ReloadOutlined, WarningOutlined } from '@ant-design/icons';
import CustomTable from '@components/Table';
import { reportsService } from '@api';
import { showErrorToast } from '@utils/toast.utils';
import '@styles/pages/ExceptionAllocationReport.scss';

const ExceptionAllocationReport = () => {
  const { message } = App.useApp();
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [filters, setFilters] = useState({});
  const fetchInProgressRef = useRef(false);

  // Default filter values for comparison
  const defaultFilters = {};

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

  // Fetch exception allocation report data
  const fetchExceptionReport = async () => {
    // Prevent duplicate calls
    if (fetchInProgressRef.current) {
      return;
    }
    
    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      
      const response = await reportsService.getException(filters);
      
      // Handle response structure
      let reportDataArray = [];
      if (response) {
        if (Array.isArray(response.data)) {
          reportDataArray = response.data;
        } else if (response.data && Array.isArray(response.data)) {
          reportDataArray = response.data;
        } else if (Array.isArray(response)) {
          reportDataArray = response;
        }
      }
      
      // Transform API data to table format
      const transformedData = reportDataArray.map((item, index) => ({
        key: item.id || `exception-${index}`,
        id: item.id,
        employeeName: item.name || 'N/A',
        totalAllocation: item.total_allocation || 0,
        totalAllocationFormatted: `${(item.total_allocation || 0).toFixed(2)}%`,
        isOverAllocated: item.is_over_allocated || false,
      }));
      
      setReportData(transformedData);
    } catch (error) {
      console.error('Failed to fetch exception allocation report:', error);
      showErrorToast('Failed to load exception allocation report');
      setReportData([]);
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchExceptionReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Table columns
  const columns = [
    {
      title: 'Employee Name',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 200,
      sorter: (a, b) => a.employeeName.localeCompare(b.employeeName),
    },
    {
      title: 'Total Allocation',
      dataIndex: 'totalAllocationFormatted',
      key: 'totalAllocation',
      width: 200,
      sorter: (a, b) => a.totalAllocation - b.totalAllocation,
      render: (text, record) => (
        <span style={{ 
          color: record.isOverAllocated ? '#ff4d4f' : '#faad14',
          fontWeight: record.isOverAllocated ? 'bold' : 'normal'
        }}>
          {text}
          {record.isOverAllocated && (
            <WarningOutlined style={{ marginLeft: 8, color: '#ff4d4f' }} />
          )}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isOverAllocated',
      key: 'status',
      width: 150,
      render: (isOverAllocated) => (
        <Badge
          status={isOverAllocated ? 'error' : 'warning'}
          text={isOverAllocated ? 'Over Allocated' : 'Anomaly'}
        />
      ),
    },
  ];

  // Calculate KPIs
  const totalExceptions = reportData.length;
  const overAllocatedCount = reportData.filter(item => item.isOverAllocated).length;
  const anomalyCount = totalExceptions - overAllocatedCount;

  return (
    <div className="exception-allocation-report-page">
      {/* Header Section */}
      <div className="report-header">
        <h1 className="report-title">EXCEPTION-ALLOCATION REPORT</h1>
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
            {/* No filters for exception report currently */}
            <p style={{ padding: '16px', color: '#999' }}>No filters available for this report</p>
          </div>
        )}
      </Card>

      {/* KPI Cards Section */}
      <Row gutter={[16, 16]} className="kpi-section">
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="kpi-card">
            <div className="kpi-value">{totalExceptions}</div>
            <div className="kpi-label">TOTAL EXCEPTIONS</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="kpi-card">
            <div className="kpi-value" style={{ color: '#ff4d4f' }}>{overAllocatedCount}</div>
            <div className="kpi-label">OVER ALLOCATED</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="kpi-card">
            <div className="kpi-value" style={{ color: '#faad14' }}>{anomalyCount}</div>
            <div className="kpi-label">ANOMALIES</div>
          </Card>
        </Col>
      </Row>

      {/* Table Section */}
      <Card className="table-card" title="Exception Allocations">
        <CustomTable
          columns={columns}
          dataSource={reportData}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
          size="small"
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default ExceptionAllocationReport;
