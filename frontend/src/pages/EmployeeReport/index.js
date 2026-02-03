import React, { useState, useEffect } from 'react';
import { Card, Badge } from 'antd';
import { useSelector } from 'react-redux';
import CustomTable from '@components/Table';
import { reportsService, resourcesService } from '@api';
import { selectTracks } from '@redux/slices/configSlice';
import { useReportFilters, useReportData } from '@hooks/reports';
import { FilterSection, ReportHeader } from '@components/ReportLayout';
import EmployeeReportFilters from './components/EmployeeReportFilters';
import logger from '@utils/logger';
import '@styles/pages/EmployeeReport.scss';

const EmployeeReport = () => {
  const defaultFilters = {
    resource_id: undefined,
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
  const [resourcesList, setResourcesList] = useState([]);

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
    const currentProjects = item.current_projects ? item.current_projects.split(',').map(p => p.trim()) : [];
    
    return {
      key: item.id || `employee-${index}`,
      id: item.id,
      employeeId: item.employee_id || 'N/A',
      employeeName: item.name || 'N/A',
      email: item.email || 'N/A',
      designation: item.designation || 'N/A',
      track: item.track || 'N/A',
      status: item.status || 'N/A',
      dateOfJoining: item.date_of_joining ? new Date(item.date_of_joining).toLocaleDateString() : 'N/A',
      totalAllocation: totalAllocation,
      totalAllocationFormatted: `${totalAllocation.toFixed(2)}%`,
      currentProjects: currentProjects,
      currentProjectsString: item.current_projects || 'N/A',
    };
  };

  // Fetch report data
  const { data: reportData, loading } = useReportData(
    async () => {
      const queryParams = {};
      if (filters.resource_id) queryParams.resource_id = filters.resource_id;
      if (filters.track_id) queryParams.track_id = filters.track_id;
      return await reportsService.getEmployee(queryParams);
    },
    transformReportData,
    {
      autoFetch: true,
      dependencies: [filters.resource_id, filters.track_id],
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
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1400 }}
          size="small"
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default EmployeeReport;
