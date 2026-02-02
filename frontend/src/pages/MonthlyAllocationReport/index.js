import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Table, Radio } from 'antd';
import CustomTable from '@components/Table';
import { tracksService } from '@api';
import { useReportFilters } from '@hooks/reports';
import { FilterSection, ReportHeader } from '@components/ReportLayout';
import MonthlyAllocationFilters from './components/MonthlyAllocationFilters';
import { useMonthlyAllocationData } from './hooks/useMonthlyAllocationData';
import logger from '@utils/logger';
import dayjs from 'dayjs';
import '@styles/pages/MonthlyAllocationReport.scss';

const MonthlyAllocationReport = () => {
  const currentDate = dayjs();
  const defaultFilters = {
    year: currentDate.year(),
    month: currentDate.month() + 1, // dayjs months are 0-indexed
    track_id: undefined,
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

  const [viewMode, setViewMode] = useState('detailed'); // 'detailed' or 'grouped'
  const [tracksList, setTracksList] = useState([]);

  // Use custom hook for data fetching
  const { loading, reportData, groupedData, periodInfo } = useMonthlyAllocationData(filters);

  // Generate month options for period info display
  const monthOptions = useMemo(() => [
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
  ], []);

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
      <ReportHeader title="MONTHLY ALLOCATION REPORT" />

      <FilterSection
        expanded={filtersExpanded}
        onToggle={toggleFiltersExpanded}
        activeFiltersCount={activeFiltersCount}
        onReset={handleResetFilters}
      >
        <MonthlyAllocationFilters
          filters={filters}
          setFilters={setFilters}
          tracksList={tracksList}
        />
      </FilterSection>

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
