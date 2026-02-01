import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Row, Col, Card, Badge, Button, App } from 'antd';
import { FilterOutlined, UpOutlined, DownOutlined, ReloadOutlined } from '@ant-design/icons';
import CustomTable from '@components/Table';
import { reportsService } from '@api';
import { showErrorToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import '@styles/pages/PreSaleReport.scss';

const PreSaleReport = () => {
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

  // Fetch pre-sale report data
  const fetchPreSaleReport = async () => {
    // Prevent duplicate calls
    if (fetchInProgressRef.current) {
      return;
    }
    
    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      
      const response = await reportsService.getPreSale(filters);
      
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
        key: item.id || `presale-${index}`,
        id: item.id,
        employeeName: item.name || 'N/A',
        projectName: item.project_name || 'N/A',
        clientName: item.client_name || 'N/A',
      }));
      
      setReportData(transformedData);
    } catch (error) {
      logger.error('Failed to fetch pre-sale report', error);
      showErrorToast('Failed to load pre-sale report');
      setReportData([]);
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchPreSaleReport();
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
      title: 'Project Name',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 200,
      sorter: (a, b) => a.projectName.localeCompare(b.projectName),
    },
    {
      title: 'Client Name',
      dataIndex: 'clientName',
      key: 'clientName',
      width: 200,
      sorter: (a, b) => a.clientName.localeCompare(b.clientName),
    },
  ];

  // Calculate KPI
  const totalPreSaleCount = reportData.length;

  return (
    <div className="presale-report-page">
      {/* Header Section */}
      <div className="report-header">
        <h1 className="report-title">PRE-SALE REPORT</h1>
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
            {/* No filters for pre-sale report currently */}
            <p style={{ padding: '16px', color: '#999' }}>No filters available for this report</p>
          </div>
        )}
      </Card>

      {/* KPI Cards Section */}
      <Row gutter={[16, 16]} className="kpi-section">
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="kpi-card">
            <div className="kpi-value">{totalPreSaleCount}</div>
            <div className="kpi-label">TOTAL PRE-SALE RESOURCES</div>
          </Card>
        </Col>
      </Row>

      {/* Table Section */}
      <Card className="table-card" title="Pre-Sale Activities">
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

export default PreSaleReport;
