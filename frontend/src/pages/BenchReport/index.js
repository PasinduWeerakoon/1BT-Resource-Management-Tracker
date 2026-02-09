import React, { useState } from 'react';
import { Row, Col, Card, Select } from 'antd';
import { useSelector } from 'react-redux';
import CustomTable from '@components/Table';
import { reportsService } from '@api';
import { selectTracks } from '@redux/slices/configSlice';
import { useReportFilters, useReportData } from '@hooks/reports';
import { FilterSection, ReportHeader, SummaryCards } from '@components/ReportLayout';
import { createNumberColumn, commonColumns } from '@utils/tableColumnFactories';
import BenchCharts from './components/BenchCharts';
import '@styles/pages/BenchReport.scss';

const { Option } = Select;

const BenchReport = () => {
  const defaultFilters = {
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

  // Get tracks from Redux (cached on login)
  const tracksList = useSelector(selectTracks);

  // Store chart data from API response
  const [chartData, setChartData] = useState({
    benchResourcesByTrack: [],
    benchResourcesByTechStack: [],
  });

  // Transform function for report data
  const transformReportData = (item, index) => ({
    key: item.id || `bench-${index}`,
    id: item.id,
    employeeName: item.name || 'N/A',
    designation: item.designation || 'N/A',
    track: item.track || 'N/A',
    daysOnBench: item.days_on_bench || 0,
    benchAllocationPercentage: item.bench_allocation_percentage || 0,
    project: 'Bench',
    allocatedDate: '',
    deallocatedDate: '',
    billingStatus: 'Bench',
    billingPercentage: '0.00%',
    projectAllocation: '100.00%',
    duration: item.days_on_bench || 0,
    status: 'Active',
  });

  // Fetch report data
  const { data: benchData, loading } = useReportData(
    async () => {
      const queryParams = {};
      if (filters.track_id) {
        queryParams.track_id = filters.track_id;
      }
      const response = await reportsService.getBench(queryParams);

      // Extract chart data from API response
      // Backend returns: { success: true, data: { data: [...], charts: {...}, summary: {...} } }
      // reportsService.getBench returns: response.data || response
      // So response structure is: { data: [...], charts: {...}, summary: {...} }
      if (response?.charts) {
        setChartData({
          benchResourcesByTrack: response.charts.benchResourcesByTrack || [],
          benchResourcesByTechStack: response.charts.benchResourcesByTechStack || [],
        });
      } else {
        // Reset charts if not available
        setChartData({
          benchResourcesByTrack: [],
          benchResourcesByTechStack: [],
        });
      }

      return response;
    },
    transformReportData,
    {
      autoFetch: true,
      dependencies: [filters.track_id],
    }
  );

  // KPI Data - Calculate from actual data
  const totalBenchCount = benchData.length;
  const totalEmployees = 114; // This might need to come from another API
  const benchPercentage = totalEmployees > 0 ? ((totalBenchCount / totalEmployees) * 100).toFixed(1) : '0.0';

  // Summary cards data
  const summaryCards = [
    { value: totalBenchCount, label: 'TOTAL BENCH COUNT' },
    { value: `${benchPercentage}%`, label: 'BENCH PERCENTAGE' },
  ];

  // Table Columns using column factories
  const benchColumns = [
    commonColumns.employeeName(180),
    commonColumns.designation(150),
    commonColumns.track(120),
    createNumberColumn({
      title: 'Bench Allocation %',
      dataIndex: 'benchAllocationPercentage',
      key: 'benchAllocationPercentage',
      width: 150,
      format: (percentage) => `${parseFloat(percentage || 0).toFixed(2)}%`,
    }),
    createNumberColumn({
      title: 'Days on Bench',
      dataIndex: 'daysOnBench',
      key: 'daysOnBench',
      width: 130,
      format: (days) => `${days} days`,
    }),
  ];


  return (
    <div className="bench-report-page">
      <ReportHeader title="BENCH REPORT" />

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
        </Row>
      </FilterSection>

      <SummaryCards cards={summaryCards} />

      {/* Charts Section */}
      <BenchCharts
        trackData={chartData.benchResourcesByTrack}
        techStackData={chartData.benchResourcesByTechStack}
      />

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
