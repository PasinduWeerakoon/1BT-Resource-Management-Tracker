import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, Badge, Row, Col, Select } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import CustomTable from '@components/Table';
import { reportsService, projectsService, resourcesService } from '@api';
import { useReportFilters, useReportData } from '@hooks/reports';
import { useFetchData } from '@hooks';
import { FilterSection, ReportHeader, SummaryCards } from '@components/ReportLayout';
import ResourceAllocationsModal from '@pages/AccountManagerReport/components/ResourceAllocationsModal';
import { transformResourceAllocationsData } from '@pages/AccountManagerReport/utils/dataTransformers';
import { showErrorToast, showWarningToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import '@styles/pages/ExceptionAllocationReport.scss';

const { Option } = Select;

const ExceptionAllocationReport = () => {
  const defaultFilters = {
    project_id: undefined,
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

  const [summary, setSummary] = useState({
    total: 0,
    overAllocated: 0,
    underAllocated: 0,
    unallocated: 0,
  });

  // Resource allocations modal state
  const [isResourceAllocationsModalVisible, setIsResourceAllocationsModalVisible] = useState(false);
  const [resourceAllocationsData, setResourceAllocationsData] = useState([]);
  const [loadingResourceAllocations, setLoadingResourceAllocations] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [selectedResourceName, setSelectedResourceName] = useState('');
  const [selectedResourceTotalAllocation, setSelectedResourceTotalAllocation] = useState(0);
  const [selectedResourceTotalBilling, setSelectedResourceTotalBilling] = useState(0);

  // Fetch projects for filter dropdown (only active projects)
  const { data: projectsListData, loading: loadingProjects } = useFetchData(
    async () => {
      const response = await projectsService.getAll({ 
        limit: 1000,
        status: 'Active' // Only fetch active projects
      });
      
      logger.debug('Projects API response:', response);
      
      // Handle nested data structure: response.data.data
      let projects = [];
      if (response?.data?.data && Array.isArray(response.data.data)) {
        projects = response.data.data;
      } else if (response?.data?.items && Array.isArray(response.data.items)) {
        projects = response.data.items;
      } else if (Array.isArray(response?.data)) {
        projects = response.data;
      } else if (Array.isArray(response)) {
        projects = response;
      }
      
      logger.debug('Extracted projects:', projects);
      return projects;
    },
    {
      autoFetch: true,
      dependencies: [],
    }
  );

  // Ensure projectsList is always an array
  const projectsList = projectsListData || [];
  
  // Log projects list for debugging
  useEffect(() => {
    logger.debug('Projects list updated:', projectsList, 'Count:', projectsList.length);
  }, [projectsList]);

  // Transform function for report data
  const transformReportData = (item, index) => {
    const totalAllocation = parseFloat(item.total_allocation || 0);
    const totalBilling = parseFloat(item.total_resource_billing || 0);
    const exceptionType = item.exception_type || 'Normal';
    const isOverAllocated = exceptionType === 'Over-allocated' || totalAllocation > 100;
    
    return {
      key: item.id || `exception-${index}`,
      id: item.id,
      resourceId: item.id, // For allocation modal
      employeeName: item.name || 'N/A',
      employeeId: item.employee_id || '',
      email: item.email || '',
      designation: item.designation || '',
      track: item.track || '',
      totalAllocation: totalAllocation,
      totalBilling: totalBilling,
      totalAllocationFormatted: `${totalAllocation.toFixed(2)}%`,
      isOverAllocated: isOverAllocated,
      exceptionType: exceptionType,
    };
  };

  // Handle row click to view allocations
  const handleRowClick = useCallback(async (record) => {
    if (!record.resourceId) {
      showWarningToast('Resource ID not found');
      return;
    }

    setSelectedResourceId(record.resourceId);
    setSelectedResourceName(record.employeeName || 'N/A');
    setSelectedResourceTotalAllocation(record.totalAllocation);
    setSelectedResourceTotalBilling(record.totalBilling || 0);
    setIsResourceAllocationsModalVisible(true);

    try {
      setLoadingResourceAllocations(true);
      const response = await resourcesService.getAllocations(record.resourceId);

      let allocationsData = [];
      if (response) {
        if (response.allocations && Array.isArray(response.allocations)) {
          allocationsData = response.allocations;
        } else if (response.data?.allocations && Array.isArray(response.data.allocations)) {
          allocationsData = response.data.allocations;
        } else if (Array.isArray(response.data)) {
          allocationsData = response.data;
        } else if (Array.isArray(response)) {
          allocationsData = response;
        }
      }

      const transformed = transformResourceAllocationsData(allocationsData);
      setResourceAllocationsData(transformed);

      if (transformed.length === 0 && allocationsData.length === 0) {
        showWarningToast('No allocations found for this resource');
      }
    } catch (error) {
      logger.error('Failed to fetch resource allocations:', error);
      showErrorToast(error?.response?.data?.message || error?.message || 'Failed to load resource allocations');
      setResourceAllocationsData([]);
    } finally {
      setLoadingResourceAllocations(false);
    }
  }, []);

  // Close resource allocations modal
  const handleCloseResourceAllocations = useCallback(() => {
    setIsResourceAllocationsModalVisible(false);
    setResourceAllocationsData([]);
    setSelectedResourceId(null);
    setSelectedResourceName('');
    setSelectedResourceTotalAllocation(0);
    setSelectedResourceTotalBilling(0);
  }, []);

  // Fetch report data
  const { data: reportData, loading, fetchData } = useReportData(
    async () => {
      // Build query parameters
      const queryParams = {};
      if (filters.project_id) {
        queryParams.project_id = filters.project_id;
      }
      
      const response = await reportsService.getException(queryParams);
      
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
      dependencies: [filters.project_id],
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
      >
        <Row gutter={[16, 16]} className="filters-row">
          <Col xs={24} sm={12} md={8} lg={6}>
            <div className="filter-item">
              <label>Project Name</label>
              <Select
                value={filters.project_id}
                onChange={(value) => setFilters({ ...filters, project_id: value })}
                style={{ width: '100%' }}
                loading={loadingProjects}
                showSearch
                allowClear
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                placeholder="All Projects"
              >
                {projectsList.map((project) => (
                  <Option 
                    key={project.id} 
                    value={project.id} 
                    label={project.project_name || project.name}
                  >
                    {project.project_name || project.name}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
        </Row>
      </FilterSection>

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
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      {/* Resource Allocations Modal */}
      <ResourceAllocationsModal
        visible={isResourceAllocationsModalVisible}
        onClose={handleCloseResourceAllocations}
        selectedResourceName={selectedResourceName}
        selectedResourceTotalAllocation={selectedResourceTotalAllocation}
        selectedResourceTotalBilling={selectedResourceTotalBilling}
        resourceAllocationsData={resourceAllocationsData}
        loadingResourceAllocations={loadingResourceAllocations}
      />
    </div>
  );
};

export default ExceptionAllocationReport;
