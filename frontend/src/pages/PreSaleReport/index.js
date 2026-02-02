import React from 'react';
import { Card } from 'antd';
import CustomTable from '@components/Table';
import { reportsService } from '@api';
import { useReportFilters, useReportData } from '@hooks/reports';
import { FilterSection, ReportHeader, SummaryCards } from '@components/ReportLayout';
import '@styles/pages/PreSaleReport.scss';

const PreSaleReport = () => {
  const defaultFilters = {};
  
  // Use shared hooks
  const {
    activeFiltersCount,
    handleResetFilters,
    filtersExpanded,
    toggleFiltersExpanded,
  } = useReportFilters(defaultFilters);

  // Transform function for report data
  const transformReportData = (item, index) => ({
    key: item.id || `presale-${index}`,
    id: item.id,
    employeeName: item.name || 'N/A',
    projectName: item.project_name || 'N/A',
    clientName: item.client_name || 'N/A',
  });

  // Fetch report data
  const { data: reportData, loading } = useReportData(
    () => reportsService.getPreSale(defaultFilters),
    transformReportData,
    { autoFetch: true }
  );

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

  // Summary cards data
  const summaryCards = [
    { value: reportData.length, label: 'TOTAL PRE-SALE RESOURCES' },
  ];

  return (
    <div className="presale-report-page">
      <ReportHeader title="PRE-SALE REPORT" />

      <FilterSection
        expanded={filtersExpanded}
        onToggle={toggleFiltersExpanded}
        activeFiltersCount={activeFiltersCount}
        onReset={handleResetFilters}
      />

      <SummaryCards cards={summaryCards} />

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
