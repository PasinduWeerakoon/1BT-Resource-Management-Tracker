import React from 'react';
import { Card } from 'antd';
import CustomTable from '@components/Table';
import { reportsService } from '@api';
import { useReportFilters, useReportData } from '@hooks/reports';
import { FilterSection, ReportHeader, SummaryCards } from '@components/ReportLayout';
import '@styles/pages/NonBillingReport.scss';

const NonBillingReport = () => {
  const defaultFilters = {};
  
  // Use shared hooks
  const {
    activeFiltersCount,
    handleResetFilters,
    filtersExpanded,
    toggleFiltersExpanded,
  } = useReportFilters(defaultFilters);

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
      projectName: item.project_name || 'N/A',
      allocationPercentage: allocationPercentage,
      allocationPercentageFormatted: `${allocationPercentage.toFixed(2)}%`,
      billingPercentage: billingPercentage,
      billingPercentageFormatted: `${billingPercentage.toFixed(2)}%`,
      startDate: item.start_date ? new Date(item.start_date).toLocaleDateString() : 'N/A',
      endDate: item.end_date ? new Date(item.end_date).toLocaleDateString() : 'Ongoing',
    };
  };

  // Fetch report data
  const { data: reportData, loading } = useReportData(
    () => reportsService.getNonBilling(defaultFilters),
    transformReportData,
    { autoFetch: true }
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

  return (
    <div className="non-billing-report-page">
      <ReportHeader title="NON-BILLING REPORT" />

      <FilterSection
        expanded={filtersExpanded}
        onToggle={toggleFiltersExpanded}
        activeFiltersCount={activeFiltersCount}
        onReset={handleResetFilters}
      />

      <SummaryCards cards={summaryCards} />

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
