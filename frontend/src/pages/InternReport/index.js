import React, { useState, useEffect } from 'react';
import { Row, Col, Card } from 'antd';
import { useSelector } from 'react-redux';
import CustomTable from '@components/Table';
import { accountManagersService, projectsService } from '@api';
import { selectTracks } from '@redux/slices/configSlice';
import { useUserAllocationModal } from '@hooks/useUserAllocationModal';
import UserAllocationModal from '@components/UserAllocationModal';
import { useReportFilters } from '@hooks/reports';
import { FilterSection, ReportHeader, SummaryCards } from '@components/ReportLayout';
import InternReportFilters from './components/InternReportFilters';
import { useInternReportData } from './hooks/useInternReportData';
import logger from '@utils/logger';
import '@styles/pages/InternReport.scss';

const InternReport = () => {
  const defaultFilters = {
    projectName: 'All',
    accountManager: 'All',
    track: 'All',
    techStack: 'All',
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

  // Get configuration data from Redux (cached on login)
  const tracks = useSelector(selectTracks);

  // Filter options for dropdowns
  const [accountManagers, setAccountManagers] = useState([]);
  const [loadingAccountManagers, setLoadingAccountManagers] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [techStacks, setTechStacks] = useState([]);

  // Report data - using custom hook
  const { internData, totalInternCount, internPercentage, loadingReport } = useInternReportData(filters, setTechStacks);

  // Fetch filter options on mount
  useEffect(() => {
    const fetchAccountManagers = async () => {
      try {
        setLoadingAccountManagers(true);
        const response = await accountManagersService.getAll();
        const data = response.data || response || [];
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
            ? data.data
            : [];
        const formatted = list
          .map((am) => ({
            id: am.id,
            name: am.name,
          }))
          .filter((am) => am.id && am.name);
        setAccountManagers(formatted);
      } catch (error) {
        logger.error('Failed to fetch account managers', error);
      } finally {
        setLoadingAccountManagers(false);
      }
    };

    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const response = await projectsService.getAll({ limit: 100 });
        let projectsData = [];

        if (response) {
          if (Array.isArray(response.data)) {
            projectsData = response.data;
          } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
            projectsData = response.data.data;
          } else if (response.data && Array.isArray(response.data)) {
            projectsData = response.data;
          }
        }

        const formatted = projectsData
          .map((project) => ({
            id: project.id,
            name: project.project_name || project.name,
          }))
          .filter((project) => project.id && project.name);

        setProjects(formatted);
      } catch (error) {
        logger.error('Failed to fetch projects', error);
      } finally {
        setLoadingProjects(false);
      }
    };

    // Tracks are now loaded from Redux (cached on login)
    // No need to fetch them here

    fetchAccountManagers();
    fetchProjects();
  }, []);


  // User allocation modal hook
  const {
    isUserAllocationModalVisible,
    selectedEmployee,
    userAllocationsList,
    userAllocationsForm,
    handleRowClick,
    handleUserAllocationCancel,
    handleAddUserAllocationRow,
    handleRemoveUserAllocationRow,
    handleUserAllocationFieldChange,
    handleUserAllocationsSubmit,
  } = useUserAllocationModal(internData);

  // Table Columns - Same as BY ALLOCATION
  const allocationColumns = [
    {
      title: 'Employee Name',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 180,
      sorter: (a, b) => a.employeeName.localeCompare(b.employeeName),
    },
    {
      title: 'Project',
      dataIndex: 'project',
      key: 'project',
      width: 150,
    },
    {
      title: 'Project Allocated Date',
      dataIndex: 'allocatedDate',
      key: 'allocatedDate',
      width: 160,
    },
    {
      title: 'Project Deallocated Date',
      dataIndex: 'deallocatedDate',
      key: 'deallocatedDate',
      width: 180,
    },
    {
      title: 'Billing Status',
      dataIndex: 'billingStatus',
      key: 'billingStatus',
      width: 130,
    },
    {
      title: 'Billing Percentage',
      dataIndex: 'billingPercentage',
      key: 'billingPercentage',
      width: 140,
    },
    {
      title: 'Project Allocation',
      dataIndex: 'projectAllocation',
      key: 'projectAllocation',
      width: 140,
    },
    {
      title: 'Duration (Days)',
      dataIndex: 'duration',
      key: 'duration',
      width: 130,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
    },
  ];


  // Summary cards data
  const summaryCards = [
    { value: totalInternCount, label: 'TOTAL INTERN COUNT' },
    { value: `${internPercentage}%`, label: 'INTERN PERCENTAGE' },
  ];

  return (
    <div className="intern-report-page">
      <ReportHeader title="INTERN REPORT" />

      <FilterSection
        expanded={filtersExpanded}
        onToggle={toggleFiltersExpanded}
        activeFiltersCount={activeFiltersCount}
        onReset={handleResetFilters}
      >
        <InternReportFilters
          filters={filters}
          setFilters={setFilters}
          projects={projects}
          accountManagers={accountManagers}
          tracks={tracks}
          techStacks={techStacks}
          loadingProjects={loadingProjects}
          loadingAccountManagers={loadingAccountManagers}
        />
      </FilterSection>

      <SummaryCards cards={summaryCards} />

      {/* Table Section */}
      <Card className="table-card" title="BY ALLOCATION" loading={loadingReport}>
        <CustomTable
          columns={allocationColumns}
          dataSource={internData}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
          size="small"
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      {/* User Allocations Modal */}
      <UserAllocationModal
        visible={isUserAllocationModalVisible}
        selectedEmployee={selectedEmployee}
        allocationsList={userAllocationsList}
        form={userAllocationsForm}
        onCancel={handleUserAllocationCancel}
        onAddRow={handleAddUserAllocationRow}
        onRemoveRow={handleRemoveUserAllocationRow}
        onFieldChange={handleUserAllocationFieldChange}
        onSubmit={handleUserAllocationsSubmit}
      />
    </div>
  );
};

export default InternReport;
