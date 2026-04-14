import React, { useState, useEffect } from 'react';
import { Card, Badge, Row, Col, Tooltip } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, DollarOutlined, EyeOutlined, HistoryOutlined, PercentageOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import CustomTable from '@components/Table';
import CustomModal from '@components/Modal';
import { reportsService, resourcesService, allocationsService } from '@api';
import { selectTracks } from '@redux/slices/configSlice';
import { useReportFilters, useReportData } from '@hooks/reports';
import { FilterSection, ReportHeader } from '@components/ReportLayout';
import EmployeeReportFilters from './components/EmployeeReportFilters';
import logger from '@utils/logger';
import { showErrorToast, showWarningToast } from '@utils/toast.utils';
import dayjs from 'dayjs';
import '@styles/pages/EmployeeReport.scss';

const getBillingStatusFromAllocation = (allocation) => {
  if (allocation.billing_status) {
    return allocation.billing_status;
  }

  if (allocation.project_type === 'Client' || allocation.project_is_billable) {
    return 'Billing';
  }
  if (allocation.project_type === 'Bench') {
    return 'Bench';
  }
  if (allocation.project_type === 'Pre-Sales' || allocation.project_type === 'Presale' || allocation.project_type === 'Pre-Sale') {
    return 'Presale';
  }
  if (allocation.project_type === 'Training') {
    return 'Training';
  }

  return 'Non-Billing';
};

const getDisplayAllocationStatus = (allocation, fallback = 'Active') => {
  if (allocation.allocation_status) {
    if (allocation.allocation_status === 'future') {
      return 'Scheduled';
    }

    return allocation.allocation_status
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  if (allocation.is_active !== undefined) {
    return allocation.is_active ? 'Active' : 'Inactive';
  }

  return allocation.status || fallback;
};

const EmployeeReport = () => {
  const defaultFilters = {
    resource_id: undefined,
    track_id: undefined,
  };

  // Use shared hooks
  const {
    filters,
    setFilters: setReportFilters,
    activeFiltersCount,
    handleResetFilters,
    filtersExpanded,
    toggleFiltersExpanded,
  } = useReportFilters(defaultFilters);

  // Get tracks from Redux (cached on login)
  const tracksList = useSelector(selectTracks);
  const [resourcesList, setResourcesList] = useState([]);
  const [isResourceAllocationsModalVisible, setIsResourceAllocationsModalVisible] = useState(false);
  const [resourceAllocationsData, setResourceAllocationsData] = useState([]);
  const [allocationHistoryData, setAllocationHistoryData] = useState([]);
  const [loadingResourceAllocations, setLoadingResourceAllocations] = useState(false);
  const [loadingAllocationHistory, setLoadingAllocationHistory] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [selectedResourceName, setSelectedResourceName] = useState('');
  const [selectedResourceTotalAllocation, setSelectedResourceTotalAllocation] = useState(0);
  const [selectedResourceTotalBilling, setSelectedResourceTotalBilling] = useState(0);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const setFilters = (nextFilters) => {
    // Reset to first page before fetching filtered data
    setPagination((prev) => ({ ...prev, current: 1 }));
    setReportFilters(nextFilters);
  };

  // Fetch resources for filter dropdown
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await resourcesService.getAll({ limit: 100 });
        let resourcesData = [];
        
        if (response) {
          if (Array.isArray(response.data)) {
            resourcesData = response.data;
          } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
            resourcesData = response.data.data;
          }
        }
        
        setResourcesList(resourcesData);
      } catch (error) {
        logger.error('Failed to fetch resources', error);
      }
    };
    
    fetchResources();
  }, []);

  // Transform function for report data
  const transformReportData = (item, index) => {
    const totalAllocation = parseFloat(item.total_allocation || 0);
    const totalBilling = parseFloat(item.total_billing || 0);
    const currentProjects = item.current_projects ? item.current_projects.split(',').map(p => p.trim()) : [];
    const tags = Array.isArray(item.tags) ? item.tags : [];
    
    return {
      key: item.id || `employee-${index}`,
      id: item.id,
      employeeNumber: item.emp_no || '-',
      employeeName: item.name || 'N/A',
      email: item.email || 'N/A',
      designation: item.designation || 'N/A',
      track: item.track || 'N/A',
      status: item.status || 'N/A',
      dateOfJoining: item.joined_date ? new Date(item.joined_date).toLocaleDateString() : 'N/A',
      totalAllocation: totalAllocation,
      totalAllocationFormatted: `${totalAllocation.toFixed(2)}%`,
      totalBilling: totalBilling,
      totalBillingFormatted: `${totalBilling.toFixed(2)}%`,
      currentProjects: currentProjects,
      currentProjectsString: item.current_projects || 'N/A',
      tags,
    };
  };

  const handleViewResourceAllocations = async (record) => {
    if (!record?.id) {
      showWarningToast('Resource ID not found');
      return;
    }

    setSelectedResourceId(record.id);
    setSelectedResourceName(record.employeeName || 'N/A');
    setSelectedResourceTotalAllocation(parseFloat(record.totalAllocation || 0));
    setSelectedResourceTotalBilling(parseFloat(record.totalBilling || 0));
    setIsResourceAllocationsModalVisible(true);

    try {
      setLoadingResourceAllocations(true);
      const response = await resourcesService.getAllocations(record.id);

      let allocationsData = [];
      if (response) {
        if (response.allocations && Array.isArray(response.allocations)) {
          allocationsData = response.allocations;
        } else if (response.data && response.data.allocations && Array.isArray(response.data.allocations)) {
          allocationsData = response.data.allocations;
        } else if (Array.isArray(response.data)) {
          allocationsData = response.data;
        } else if (Array.isArray(response)) {
          allocationsData = response;
        } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
          if (response.data.allocations && Array.isArray(response.data.allocations)) {
            allocationsData = response.data.allocations;
          } else if (response.data.id) {
            allocationsData = [response.data];
          }
        }
      }

      const activeAllocations = allocationsData.filter(a => a.allocation_status !== 'future');
      const futureAllocations = allocationsData.filter(a => a.allocation_status === 'future');

      const transformedActiveAllocations = activeAllocations.map((allocation, index) => {
        let duration = 0;
        if (allocation.allocated_date) {
          const startDate = dayjs(allocation.allocated_date);
          const endDate = allocation.deallocated_date ? dayjs(allocation.deallocated_date) : dayjs();
          duration = endDate.diff(startDate, 'day');
        }

        const allocationPercentage = typeof allocation.allocation_percentage === 'string'
          ? parseFloat(allocation.allocation_percentage)
          : (allocation.allocation_percentage || 0);
        const billingPercentage = typeof allocation.billing_percentage === 'string'
          ? parseFloat(allocation.billing_percentage)
          : (allocation.billing_percentage || 0);

        return {
          key: allocation.id || `allocation-${index}`,
          id: allocation.id,
          project: allocation.project_name || 'N/A',
          allocatedDate: allocation.allocated_date ? dayjs(allocation.allocated_date).format('YYYY-MM-DD') : '-',
          deallocatedDate: allocation.deallocated_date ? dayjs(allocation.deallocated_date).format('YYYY-MM-DD') : '-',
          billingStatus: getBillingStatusFromAllocation(allocation),
          billingPercentage: billingPercentage ? `${billingPercentage.toFixed(0)}%` : '0%',
          projectAllocation: allocationPercentage ? `${allocationPercentage.toFixed(0)}%` : '0%',
          duration: duration,
          status: getDisplayAllocationStatus(allocation),
          project_id: allocation.project_id,
          allocationType: 'active'
        };
      });

      const transformedFutureAllocations = futureAllocations.map((allocation, index) => {
        let duration = 0;
        if (allocation.allocated_date) {
          const startDate = dayjs(allocation.allocated_date);
          const endDate = allocation.deallocated_date ? dayjs(allocation.deallocated_date) : dayjs();
          duration = endDate.diff(startDate, 'day');
        }

        const daysUntilActivation = allocation.effective_date
          ? dayjs(allocation.effective_date).diff(dayjs(), 'day')
          : 0;

        const allocationPercentage = typeof allocation.allocation_percentage === 'string'
          ? parseFloat(allocation.allocation_percentage)
          : (allocation.allocation_percentage || 0);
        const billingPercentage = typeof allocation.billing_percentage === 'string'
          ? parseFloat(allocation.billing_percentage)
          : (allocation.billing_percentage || 0);

        return {
          key: allocation.id || `future-allocation-${index}`,
          id: allocation.id,
          project: allocation.project_name || 'N/A',
          allocatedDate: allocation.allocated_date ? dayjs(allocation.allocated_date).format('YYYY-MM-DD') : '-',
          deallocatedDate: allocation.deallocated_date ? dayjs(allocation.deallocated_date).format('YYYY-MM-DD') : '-',
          effectiveDate: allocation.effective_date ? dayjs(allocation.effective_date).format('YYYY-MM-DD') : '-',
          daysUntilActivation: daysUntilActivation,
          billingStatus: getBillingStatusFromAllocation(allocation),
          billingPercentage: billingPercentage ? `${billingPercentage.toFixed(0)}%` : '0%',
          projectAllocation: allocationPercentage ? `${allocationPercentage.toFixed(0)}%` : '0%',
          duration: duration,
          status: getDisplayAllocationStatus(allocation, 'Scheduled'),
          changeType: allocation.change_type || 'new',
          project_id: allocation.project_id,
          allocationType: 'future'
        };
      });

      const transformedAllocations = [...transformedActiveAllocations, ...transformedFutureAllocations];
      setResourceAllocationsData(transformedAllocations);

      if (transformedAllocations.length === 0 && allocationsData.length === 0) {
        showWarningToast('No allocations found for this resource');
      } else if (transformedAllocations.length === 0 && allocationsData.length > 0) {
        showWarningToast('Failed to process allocation data');
      }
    } catch (error) {
      logger.error('Failed to fetch resource allocations:', error);
      showErrorToast(error?.response?.data?.message || error?.message || 'Failed to load resource allocations');
      setResourceAllocationsData([]);
    } finally {
      setLoadingResourceAllocations(false);
    }

    // Fetch allocation history (GET /api/v1/allocations/history/{resourceId})
    try {
      setLoadingAllocationHistory(true);
      const historyResponse = await allocationsService.getHistory(record.id);
      let historyList = [];
      if (historyResponse) {
        if (historyResponse.history && Array.isArray(historyResponse.history)) {
          historyList = historyResponse.history;
        } else if (historyResponse.data && historyResponse.data.history && Array.isArray(historyResponse.data.history)) {
          historyList = historyResponse.data.history;
        } else if (Array.isArray(historyResponse.data)) {
          historyList = historyResponse.data;
        } else if (Array.isArray(historyResponse)) {
          historyList = historyResponse;
        }
      }
      const transformedHistory = historyList
        .filter((item) => item.project_name != null || item.allocated_date != null || item.allocation_percentage != null)
        .map((allocation, index) => {
          let duration = 0;
          if (allocation.allocated_date) {
            const startDate = dayjs(allocation.allocated_date);
            const endDate = allocation.deallocated_date ? dayjs(allocation.deallocated_date) : dayjs();
            duration = endDate.diff(startDate, 'day');
          }
          const allocationPercentage = typeof allocation.allocation_percentage === 'string'
            ? parseFloat(allocation.allocation_percentage)
            : (allocation.allocation_percentage ?? 0);
          const billingPercentage = typeof allocation.billing_percentage === 'string'
            ? parseFloat(allocation.billing_percentage)
            : (allocation.billing_percentage ?? 0);
          return {
            key: allocation.id || `history-${index}`,
            id: allocation.id,
            project: allocation.project_name || 'N/A',
            allocatedDate: allocation.allocated_date ? dayjs(allocation.allocated_date).format('YYYY-MM-DD') : '-',
            deallocatedDate: allocation.deallocated_date ? dayjs(allocation.deallocated_date).format('YYYY-MM-DD') : '-',
            billingStatus: getBillingStatusFromAllocation(allocation),
            billingPercentage: billingPercentage ? `${billingPercentage.toFixed(0)}%` : '0%',
            projectAllocation: allocationPercentage ? `${allocationPercentage.toFixed(0)}%` : '0%',
            duration,
            status: 'Ended',
          };
        });
      setAllocationHistoryData(transformedHistory);
    } catch (historyError) {
      logger.error('Failed to fetch allocation history:', historyError);
      setAllocationHistoryData([]);
    } finally {
      setLoadingAllocationHistory(false);
    }
  };

  // Fetch report data
  const { data: reportData, loading } = useReportData(
    async () => {
      const queryParams = {};
      if (filters.resource_id) queryParams.resource_id = filters.resource_id;
      if (filters.track_id) queryParams.track_id = filters.track_id;
      queryParams.page = pagination.current;
      queryParams.limit = pagination.pageSize;
      return await reportsService.getEmployee(queryParams);
    },
    transformReportData,
    {
      autoFetch: true,
      dependencies: [filters.resource_id, filters.track_id, pagination.current, pagination.pageSize],
      onSuccess: (_transformedData, response) => {
        const total = response?.total;
        if (Number.isFinite(total)) {
          setPagination((prev) => ({ ...prev, total }));
        }
      },
    }
  );


  // Table columns
  const columns = [
    {
      title: 'Employee Number',
      dataIndex: 'employeeNumber',
      key: 'employeeNumber',
      width: 120,
      sorter: (a, b) => {
        const aVal = a.employeeNumber || '';
        const bVal = b.employeeNumber || '';
        return aVal.localeCompare(bVal);
      },
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Badge
          status={status === 'Active' ? 'success' : status === 'Bench' ? 'default' : 'error'}
          text={status}
        />
      ),
    },
    {
      title: 'Date of Joining',
      dataIndex: 'dateOfJoining',
      key: 'dateOfJoining',
      width: 130,
    },
    {
      title: 'Total Allocation',
      dataIndex: 'totalAllocationFormatted',
      key: 'totalAllocation',
      width: 130,
      sorter: (a, b) => a.totalAllocation - b.totalAllocation,
      render: (text, record) => (
        <span style={{ 
          color: record.totalAllocation > 100 ? '#ff4d4f' : record.totalAllocation < 100 ? '#52c41a' : '#1890ff',
          fontWeight: record.totalAllocation > 100 ? 'bold' : 'normal'
        }}>
          {text}
        </span>
      ),
    },
    {
      title: 'Total Billing',
      dataIndex: 'totalBillingFormatted',
      key: 'totalBilling',
      width: 130,
      sorter: (a, b) => a.totalBilling - b.totalBilling,
      render: (text, record) => (
        <span style={{ 
          color: record.totalBilling > 100 ? '#ff4d4f' : record.totalBilling < 100 ? '#52c41a' : '#1890ff',
          fontWeight: record.totalBilling > 100 ? 'bold' : 'normal'
        }}>
          {text}
        </span>
      ),
    },
    
    {
      title: 'Current Projects',
      dataIndex: 'currentProjectsString',
      key: 'currentProjects',
      width: 250,
      render: (text, record) => (
        <div>
          {record.currentProjects && record.currentProjects.length > 0 ? (
            <div>
              {record.currentProjects.map((project, idx) => (
                <Badge
                  key={idx}
                  count={project}
                  style={{ 
                    backgroundColor: project === 'Bench' ? '#999' : '#1890ff',
                    marginRight: 8,
                    marginBottom: 4
                  }}
                />
              ))}
            </div>
          ) : (
            <span style={{ color: '#999' }}>No projects</span>
          )}
        </div>
      ),
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags) => (
        <div>
          {Array.isArray(tags) && tags.length > 0 ? (
            tags.map((tag, idx) => (
              <Badge
                key={`${tag}-${idx}`}
                count={tag}
                style={{ 
                  backgroundColor: '#722ed1',
                  marginRight: 8,
                  marginBottom: 4
                }}
              />
            ))
          ) : (
            <span style={{ color: '#999' }}>No tags</span>
          )}
        </div>
      ),
    },
    // {
    //   title: 'Actions',
    //   key: 'actions',
    //   width: 90,
    //   fixed: 'right',
    //   render: (_, record) => (
    //     <Tooltip title="View Allocations">
    //       <EyeOutlined
    //         style={{ cursor: 'pointer', color: '#1890ff' }}
    //         onClick={(event) => {
    //           event.stopPropagation();
    //           handleViewResourceAllocations(record);
    //         }}
    //       />
    //     </Tooltip>
    //   ),
    // },
  ];

  return (
    <div className="employee-report-page">
      <ReportHeader title="EMPLOYEE REPORT" />

      <FilterSection
        expanded={filtersExpanded}
        onToggle={toggleFiltersExpanded}
        activeFiltersCount={activeFiltersCount}
        onReset={handleResetFilters}
      >
        <EmployeeReportFilters
          filters={filters}
          setFilters={setFilters}
          tracksList={tracksList}
          resourcesList={resourcesList}
        />
      </FilterSection>

      {/* Table Section */}
      <Card className="table-card" title="Employee Report">
        <CustomTable
          columns={columns}
          dataSource={reportData}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} employees`,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({ ...prev, current: page, pageSize }));
            },
            onShowSizeChange: (_current, size) => {
              setPagination((prev) => ({ ...prev, current: 1, pageSize: size }));
            },
          }}
          scroll={{ x: 1400 }}
          size="small"
          loading={loading}
          onRow={(record) => ({
            onClick: () => handleViewResourceAllocations(record),
          })}
        />
      </Card>

      {/* Resource Allocations Modal */}
      <CustomModal
        title={`Project Allocations - ${selectedResourceName}`}
        open={isResourceAllocationsModalVisible}
        onClose={() => {
          setIsResourceAllocationsModalVisible(false);
          setResourceAllocationsData([]);
          setAllocationHistoryData([]);
          setSelectedResourceId(null);
          setSelectedResourceName('');
          setSelectedResourceTotalAllocation(0);
          setSelectedResourceTotalBilling(0);
        }}
        width={1400}
        footer={null}
      >
        <div style={{
          marginBottom: 20,
          padding: '16px 20px',
          backgroundColor: '#fafafa',
          borderRadius: 8,
          border: '1px solid #d9d9d9'
        }}>
          <Row gutter={24}>
            <Col span={12}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <PercentageOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: 12 }} />
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>Total Allocation</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#262626' }}>
                    {selectedResourceTotalAllocation.toFixed(0)}%
                  </div>
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <DollarOutlined style={{ fontSize: 24, color: '#52c41a', marginRight: 12 }} />
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>Total Billing</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#262626' }}>
                    {selectedResourceTotalBilling.toFixed(0)}%
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 12,
            padding: '8px 12px',
            backgroundColor: '#f0f5ff',
            borderLeft: '4px solid #1890ff',
            borderRadius: 4
          }}>
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18, marginRight: 8 }} />
            <span style={{ fontSize: 16, fontWeight: 600, color: '#262626' }}>
              Current Allocations
            </span>
            <span style={{
              marginLeft: 8,
              padding: '2px 8px',
              backgroundColor: '#52c41a',
              color: 'white',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 500
            }}>
              {resourceAllocationsData.filter(a => a.allocationType === 'active').length}
            </span>
          </div>
          <CustomTable
            columns={[
              {
                title: 'Project',
                dataIndex: 'project',
                key: 'project',
                width: 200,
                ellipsis: true,
              },
              {
                title: 'Allocated Date',
                dataIndex: 'allocatedDate',
                key: 'allocatedDate',
                width: 140,
              },
              {
                title: 'Deallocated Date',
                dataIndex: 'deallocatedDate',
                key: 'deallocatedDate',
                width: 150,
              },
              {
                title: 'Billing Status',
                dataIndex: 'billingStatus',
                key: 'billingStatus',
                width: 120,
                render: (text) => (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 500,
                    backgroundColor: text === 'Billing' ? '#e6f7ff' :
                      text === 'Bench' ? '#fff7e6' :
                        text === 'Presale' ? '#f9f0ff' : '#f0f0f0',
                    color: text === 'Billing' ? '#1890ff' :
                      text === 'Bench' ? '#fa8c16' :
                        text === 'Presale' ? '#722ed1' : '#595959'
                  }}>
                    {text}
                  </span>
                ),
              },
              {
                title: 'Billing %',
                dataIndex: 'billingPercentage',
                key: 'billingPercentage',
                width: 100,
                align: 'center',
              },
              {
                title: 'Allocation %',
                dataIndex: 'projectAllocation',
                key: 'projectAllocation',
                width: 110,
                align: 'center',
              },
              {
                title: 'Duration',
                dataIndex: 'duration',
                key: 'duration',
                width: 90,
                align: 'center',
                render: (days) => `${days} days`,
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                width: 90,
                align: 'center',
                render: (text) => (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 500,
                    backgroundColor: text === 'Active' ? '#f6ffed' : '#fff1f0',
                    color: text === 'Active' ? '#52c41a' : '#ff4d4f'
                  }}>
                    {text}
                  </span>
                ),
              },
            ]}
            dataSource={resourceAllocationsData.filter(a => a.allocationType === 'active')}
            pagination={false}
            scroll={{ x: 1100 }}
            size="small"
            loading={loadingResourceAllocations}
            locale={{
              emptyText: 'No current allocations'
            }}
          />
        </div>

        {/* Allocation History - GET /api/v1/allocations/history/{resourceId} */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 12,
            padding: '8px 12px',
            backgroundColor: '#f9f9f9',
            borderLeft: '4px solid #8c8c8c',
            borderRadius: 4
          }}>
            <HistoryOutlined style={{ color: '#8c8c8c', fontSize: 18, marginRight: 8 }} />
            <span style={{ fontSize: 16, fontWeight: 600, color: '#262626' }}>
              Allocation History
            </span>
            <span style={{
              marginLeft: 8,
              padding: '2px 8px',
              backgroundColor: '#8c8c8c',
              color: 'white',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 500
            }}>
              {allocationHistoryData.length}
            </span>
          </div>
          <CustomTable
            columns={[
              {
                title: 'Project',
                dataIndex: 'project',
                key: 'project',
                width: 200,
                ellipsis: true,
              },
              {
                title: 'Allocated Date',
                dataIndex: 'allocatedDate',
                key: 'allocatedDate',
                width: 140,
              },
              {
                title: 'Deallocated Date',
                dataIndex: 'deallocatedDate',
                key: 'deallocatedDate',
                width: 150,
              },
              {
                title: 'Billing Status',
                dataIndex: 'billingStatus',
                key: 'billingStatus',
                width: 120,
                render: (text) => (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 500,
                    backgroundColor: text === 'Billing' ? '#e6f7ff' :
                      text === 'Bench' ? '#fff7e6' :
                        text === 'Presale' ? '#f9f0ff' : '#f0f0f0',
                    color: text === 'Billing' ? '#1890ff' :
                      text === 'Bench' ? '#fa8c16' :
                        text === 'Presale' ? '#722ed1' : '#595959'
                  }}>
                    {text}
                  </span>
                ),
              },
              {
                title: 'Billing %',
                dataIndex: 'billingPercentage',
                key: 'billingPercentage',
                width: 100,
                align: 'center',
              },
              {
                title: 'Allocation %',
                dataIndex: 'projectAllocation',
                key: 'projectAllocation',
                width: 110,
                align: 'center',
              },
              {
                title: 'Duration',
                dataIndex: 'duration',
                key: 'duration',
                width: 90,
                align: 'center',
                render: (days) => `${days} days`,
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                width: 90,
                align: 'center',
                render: (text) => (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 500,
                    backgroundColor: '#f0f0f0',
                    color: '#595959'
                  }}>
                    {text}
                  </span>
                ),
              },
            ]}
            dataSource={allocationHistoryData}
            pagination={false}
            scroll={{ x: 1100 }}
            size="small"
            loading={loadingAllocationHistory}
            locale={{
              emptyText: 'No allocation history'
            }}
          />
        </div>

        {resourceAllocationsData.filter(a => a.allocationType === 'future').length > 0 && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 12,
              padding: '8px 12px',
              backgroundColor: '#fff7e6',
              borderLeft: '4px solid #faad14',
              borderRadius: 4
            }}>
              <ClockCircleOutlined style={{ color: '#faad14', fontSize: 18, marginRight: 8 }} />
              <span style={{ fontSize: 16, fontWeight: 600, color: '#262626' }}>
                Future Allocations
              </span>
              <span style={{
                marginLeft: 8,
                padding: '2px 8px',
                backgroundColor: '#faad14',
                color: 'white',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 500
              }}>
                {resourceAllocationsData.filter(a => a.allocationType === 'future').length}
              </span>
            </div>
            <CustomTable
              columns={[
                {
                  title: 'Project',
                  dataIndex: 'project',
                  key: 'project',
                  width: 180,
                  ellipsis: true,
                },
                {
                  title: 'Effective Date',
                  dataIndex: 'effectiveDate',
                  key: 'effectiveDate',
                  width: 130,
                  render: (text, record) => (
                    <div>
                      <div style={{ fontWeight: 500 }}>{text}</div>
                      <div style={{
                        fontSize: 11,
                        color: '#8c8c8c',
                        fontStyle: 'italic'
                      }}>
                        {record.daysUntilActivation > 0 ?
                          `in ${record.daysUntilActivation} days` :
                          'activates today'}
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Allocated Date',
                  dataIndex: 'allocatedDate',
                  key: 'allocatedDate',
                  width: 130,
                },
                {
                  title: 'Deallocated Date',
                  dataIndex: 'deallocatedDate',
                  key: 'deallocatedDate',
                  width: 140,
                },
                {
                  title: 'Billing Status',
                  dataIndex: 'billingStatus',
                  key: 'billingStatus',
                  width: 120,
                  render: (text) => (
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 500,
                      backgroundColor: text === 'Billing' ? '#e6f7ff' :
                        text === 'Bench' ? '#fff7e6' :
                          text === 'Presale' ? '#f9f0ff' : '#f0f0f0',
                      color: text === 'Billing' ? '#1890ff' :
                        text === 'Bench' ? '#fa8c16' :
                          text === 'Presale' ? '#722ed1' : '#595959'
                    }}>
                      {text}
                    </span>
                  ),
                },
                {
                  title: 'Allocation %',
                  dataIndex: 'projectAllocation',
                  key: 'projectAllocation',
                  width: 110,
                  align: 'center',
                },
                {
                  title: 'Duration',
                  dataIndex: 'duration',
                  key: 'duration',
                  width: 90,
                  align: 'center',
                  render: (days) => `${days} days`,
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  width: 100,
                  align: 'center',
                  render: (text) => (
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 500,
                      backgroundColor: '#fffbe6',
                      color: '#faad14'
                    }}>
                      {text}
                    </span>
                  ),
                },
              ]}
              dataSource={resourceAllocationsData.filter(a => a.allocationType === 'future')}
              pagination={false}
              scroll={{ x: 1100 }}
              size="small"
              loading={loadingResourceAllocations}
              locale={{
                emptyText: 'No future allocations'
              }}
            />
          </div>
        )}
      </CustomModal>
    </div>
  );
};

export default EmployeeReport;
