import React, { useState } from 'react';
import { Row, Col, Card, Select, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import CustomTable from '@components/Table';
import { reportsService, documentsService } from '@api';
import { selectTracks, selectTechStacks } from '@redux/slices/configSlice';
import { useReportFilters, useReportData } from '@hooks/reports';
import { FilterSection, ReportHeader, SummaryCards } from '@components/ReportLayout';
import { showSuccessToast, showErrorToast } from '@utils/toast.utils';
import NonBillingCharts from './components/NonBillingCharts';
import '@styles/pages/NonBillingReport.scss';

const { Option } = Select;

const NonBillingReport = () => {
  const defaultFilters = {
    track_id: undefined,
    tech_stack_id: undefined,
  };

  // Use shared hooks
  const {
    filters,
    setFilters,
    activeFiltersCount,
    handleResetFilters,
    filtersExpanded,
    toggleFiltersExpanded,
  } = useReportFilters(defaultFilters);

  // Get tracks and tech stacks from Redux (cached on login)
  const tracksList = useSelector(selectTracks);
  const techStacksList = useSelector(selectTechStacks);

  // Store chart data from API response
  const [chartData, setChartData] = useState({
    nonBillingResourcesByTrack: [],
    nonBillingResourcesByTechStack: [],
  });

  // Transform function for report data
  const transformReportData = (item, index) => {
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
      techStack: item.tech_stack || 'N/A',
      projectName: item.project_name || 'N/A',
      allocationPercentage: allocationPercentage,
      allocationPercentageFormatted: `${allocationPercentage.toFixed(2)}%`,
      billingPercentage: billingPercentage,
      billingPercentageFormatted: `${billingPercentage.toFixed(2)}%`,
      startDate: item.allocated_date ? new Date(item.allocated_date).toLocaleDateString() : 'N/A',
      endDate: item.deallocated_date ? new Date(item.deallocated_date).toLocaleDateString() : 'Ongoing',
    };
  };

  // Fetch report data
  const { data: reportData, loading } = useReportData(
    async () => {
      const queryParams = {};
      if (filters.track_id) {
        queryParams.track_id = filters.track_id;
      }
      if (filters.tech_stack_id) {
        queryParams.tech_stack_id = filters.tech_stack_id;
      }
      const response = await reportsService.getNonBilling(queryParams);

      // Extract chart data from API response
      // Backend returns: { success: true, data: { data: [...], charts: {...}, total: number } }
      // reportsService.getNonBilling returns: response.data || response
      // So response structure is: { data: [...], charts: {...}, total: number }
      if (response?.charts) {
        setChartData({
          nonBillingResourcesByTrack: response.charts.nonBillingResourcesByTrack || [],
          nonBillingResourcesByTechStack: response.charts.nonBillingResourcesByTechStack || [],
        });
      } else {
        // Reset charts if not available
        setChartData({
          nonBillingResourcesByTrack: [],
          nonBillingResourcesByTechStack: [],
        });
      }

      return response;
    },
    transformReportData,
    {
      autoFetch: true,
      dependencies: [filters.track_id, filters.tech_stack_id],
    }
  );

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
      title: 'Tech Stack',
      dataIndex: 'techStack',
      key: 'techStack',
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

  // Summary cards data
  const summaryCards = [
    { value: reportData.length, label: 'TOTAL NON-BILLING RESOURCES' },
  ];

  // Excel download handler
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadExcel = async () => {
    setIsDownloading(true);
    try {
      // Pass current filters to the download
      const params = {};
      if (filters.track_id) {
        params.track_id = filters.track_id;
      }

      await documentsService.downloadNonBillingExcel(params);
      showSuccessToast('Excel report downloaded successfully');
    } catch (error) {
      console.error('Failed to download Excel:', error);
      showErrorToast('Failed to download Excel report');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="non-billing-report-page">
      <ReportHeader
        title="NON-BILLING REPORT"
        extra={
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownloadExcel}
            loading={isDownloading}
          >
            Download Excel
          </Button>
        }
      />

      <FilterSection
        expanded={filtersExpanded}
        onToggle={toggleFiltersExpanded}
        activeFiltersCount={activeFiltersCount}
        onReset={handleResetFilters}
      >
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
          <Col xs={24} sm={12} md={8} lg={6}>
            <div className="filter-item">
              <label>Tech Stack</label>
              <Select
                value={filters.tech_stack_id}
                onChange={(value) => setFilters({ ...filters, tech_stack_id: value || undefined })}
                style={{ width: '100%' }}
                allowClear
                placeholder="All Tech Stacks"
              >
                {techStacksList.map((techStack) => (
                  <Option key={techStack.id} value={techStack.id}>
                    {techStack.name || techStack.label}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
        </Row>
      </FilterSection>

      <SummaryCards cards={summaryCards} />

      {/* Charts Section */}
      <NonBillingCharts
        trackData={chartData.nonBillingResourcesByTrack}
        techStackData={chartData.nonBillingResourcesByTechStack}
      />

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
