import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Row, Col, Card, Badge, Button, App } from 'antd';
import { FilterOutlined, UpOutlined, DownOutlined, ReloadOutlined } from '@ant-design/icons';
import CustomTable from '@components/Table';
import { reportsService } from '@api';
import { showErrorToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import '@styles/pages/NonBillingReport.scss';

const NonBillingReport = () => {
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

  // Fetch non-billing report data
  const fetchNonBillingReport = async () => {
    // Prevent duplicate calls
    if (fetchInProgressRef.current) {
      return;
    }
    
    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      
      const response = await reportsService.getNonBilling(filters);
      
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
        const allocationPercentage = parseFloat(item.allocation_percentage || 0);
        const billingPercentage = parseFloat(item.billing_percentage || 0);
        
        return {
          key: item.id || `non-billing-${index}`,
          id: item.id,
          employeeId: item.employee_id || 'N/A',
          employeeName: item.name || 'N/A',
          email: item.email || 'N/A',
          designation: item.designation || 'N/A',
          track: item.track || 'N/A',
          projectName: item.project_name || 'N/A',
          allocationPercentage: allocationPercentage,
          allocationPercentageFormatted: `${allocationPercentage.toFixed(2)}%`,
          billingPercentage: billingPercentage,
          billingPercentageFormatted: `${billingPercentage.toFixed(2)}%`,
          startDate: item.start_date ? new Date(item.start_date).toLocaleDateString() : 'N/A',
          endDate: item.end_date ? new Date(item.end_date).toLocaleDateString() : 'Ongoing',
        };
      });
      
      setReportData(transformedData);
    } catch (error) {
      logger.error('Failed to fetch non-billing report', error);
      showErrorToast('Failed to load non-billing report');
      setReportData([]);
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchNonBillingReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      title: 'Project Name',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 180,
      sorter: (a, b) => a.projectName.localeCompare(b.projectName),
    },
    {
      title: 'Allocation Percentage',
      dataIndex: 'allocationPercentageFormatted',
      key: 'allocationPercentage',
      width: 160,
      sorter: (a, b) => a.allocationPercentage - b.allocationPercentage,
      render: (text) => (
        <span style={{ color: '#1890ff' }}>
          {text}
        </span>
      ),
    },
    {
      title: 'Billing Percentage',
      dataIndex: 'billingPercentageFormatted',
      key: 'billingPercentage',
      width: 150,
      sorter: (a, b) => a.billingPercentage - b.billingPercentage,
      render: (text, record) => (
        <span style={{ 
          color: record.billingPercentage === 0 ? '#ff4d4f' : '#999',
          fontWeight: record.billingPercentage === 0 ? 'bold' : 'normal'
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

  // Calculate KPI
  const totalNonBillingCount = reportData.length;

  return (
    <div className="non-billing-report-page">
      {/* Header Section */}
      <div className="report-header">
        <h1 className="report-title">NON-BILLING REPORT</h1>
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
            {/* No filters for non-billing report currently */}
            <p style={{ padding: '16px', color: '#999' }}>No filters available for this report</p>
          </div>
        )}
      </Card>

      {/* KPI Cards Section */}
      <Row gutter={[16, 16]} className="kpi-section">
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="kpi-card">
            <div className="kpi-value">{totalNonBillingCount}</div>
            <div className="kpi-label">TOTAL NON-BILLING RESOURCES</div>
          </Card>
        </Col>
      </Row>

      {/* Table Section */}
      <Card className="table-card" title="Non-Billing Resources">
        <CustomTable
          columns={columns}
          dataSource={reportData}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1500 }}
          size="small"
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default NonBillingReport;
