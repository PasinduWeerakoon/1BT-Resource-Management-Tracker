import React, { useState, useMemo, useEffect } from 'react';
import { Card, Badge } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import CustomTable from '@components/Table';
import { reportsService } from '@api';
import { useReportFilters, useReportData } from '@hooks/reports';
import { FilterSection, ReportHeader, SummaryCards } from '@components/ReportLayout';
import '@styles/pages/ExceptionAllocationReport.scss';

const ExceptionAllocationReport = () => {
  const defaultFilters = {};
  
  // Use shared hooks
  const {
    filters,
    setFilters,
    activeFiltersCount,
    handleResetFilters,
    filtersExpanded,
    toggleFiltersExpanded,
  } = useReportFilters(defaultFilters);

  const [summary, setSummary] = useState({
    total: 0,
    overAllocated: 0,
    underAllocated: 0,
    unallocated: 0,
  });

  // Transform function for report data
  const transformReportData = (item, index) => {
    const totalAllocation = parseFloat(item.total_allocation || 0);
    const exceptionType = item.exception_type || 'Normal';
    const isOverAllocated = exceptionType === 'Over-allocated' || totalAllocation > 100;
    
    return {
      key: item.id || `exception-${index}`,
      id: item.id,
      employeeName: item.name || 'N/A',
      employeeId: item.employee_id || '',
      email: item.email || '',
      designation: item.designation || '',
      track: item.track || '',
      totalAllocation: totalAllocation,
      totalAllocationFormatted: `${totalAllocation.toFixed(2)}%`,
      isOverAllocated: isOverAllocated,
      exceptionType: exceptionType,
    };
  };

  // Fetch report data
  const { data: reportData, loading, fetchData } = useReportData(
    async () => {
      const response = await reportsService.getException(filters);
      
      // Update summary from API response if available
      if (response && response.data && response.data.summary) {
        setSummary({
          total: response.data.summary.total || 0,
          overAllocated: response.data.summary.overAllocated || 0,
          underAllocated: response.data.summary.underAllocated || 0,
          unallocated: response.data.summary.unallocated || 0,
        });
      }
      
      return response;
    },
    transformReportData,
    {
      autoFetch: true,
      dependencies: [filters],
    }
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
      dataIndex: 'exceptionType',
      key: 'status',
      width: 150,
      render: (exceptionType, record) => {
        let badgeStatus = 'warning';
        let badgeText = 'Anomaly';
        
        if (exceptionType === 'Over-allocated') {
          badgeStatus = 'error';
          badgeText = 'Over Allocated';
        } else if (exceptionType === 'Under-allocated') {
          badgeStatus = 'warning';
          badgeText = 'Under Allocated';
        } else if (exceptionType === 'Unallocated') {
          badgeStatus = 'default';
          badgeText = 'Unallocated';
        }
        
        return (
          <Badge
            status={badgeStatus}
            text={badgeText}
          />
        );
      },
    },
  ];

  // Calculate KPIs - use summary from API if available, otherwise calculate from data
  const totalExceptions = summary.total > 0 ? summary.total : reportData.length;
  const overAllocatedCount = summary.overAllocated > 0 ? summary.overAllocated : reportData.filter(item => item.isOverAllocated).length;
  const anomalyCount = summary.underAllocated > 0 || summary.unallocated > 0 
    ? (summary.underAllocated + summary.unallocated)
    : (totalExceptions - overAllocatedCount);

  // Summary cards data
  const summaryCards = [
    { value: totalExceptions, label: 'TOTAL EXCEPTIONS' },
    { value: overAllocatedCount, label: 'OVER ALLOCATED', color: '#ff4d4f' },
    { value: anomalyCount, label: 'ANOMALIES', color: '#faad14' },
  ];

  return (
    <div className="exception-allocation-report-page">
      <ReportHeader title="EXCEPTION-ALLOCATION REPORT" />

      <FilterSection
        expanded={filtersExpanded}
        onToggle={toggleFiltersExpanded}
        activeFiltersCount={activeFiltersCount}
        onReset={handleResetFilters}
      />

      <SummaryCards cards={summaryCards} />

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
