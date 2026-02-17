import React, { useMemo } from 'react';
import { useUserAllocationModal } from '@hooks/useUserAllocationModal';
import UserAllocationModal from '@components/UserAllocationModal';
import { useReportFilters } from '@hooks/reports';
import { FilterSection, ReportHeader } from '@components/ReportLayout';
import ExternalConsultantsFilters from './components/ExternalConsultantsFilters';
import ExternalConsultantsCharts from './components/ExternalConsultantsCharts';
import ConsultantsTable from './components/ConsultantsTable';
import useConsultantsData from './hooks/useConsultantsData';
import {
  getProjectColumns,
  getAllocationColumns,
} from './utils/tableColumns';
import '@styles/pages/ExternalConsultantsReport.scss';

const ExternalConsultantsReport = () => {
  const defaultFilters = {
    track_id: undefined,
    tech_stack: undefined,
    project_id: undefined,
    start_date: undefined,
    end_date: undefined,
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

  // Use consultants data hook
  const {
    loading,
    tracksList,
    projectsList,
    totalExternalConsultants,
    externalConsultantsPercentage,
    trackData,
    techStackDistribution,
    projectData,
    allocationData,
    uniqueTechStacks,
  } = useConsultantsData(filters);

  const projectColumns = useMemo(() => getProjectColumns(), []);
  const allocationColumns = useMemo(() => getAllocationColumns(), []);

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
  } = useUserAllocationModal(allocationData);

  return (
    <div className="external-consultants-report-page">
      <ReportHeader title="EXTERNAL CONSULTANTS REPORT" />

      <FilterSection
        expanded={filtersExpanded}
        onToggle={toggleFiltersExpanded}
        activeFiltersCount={activeFiltersCount}
        onReset={handleResetFilters}
      >
        <ExternalConsultantsFilters
          filters={filters}
          setFilters={setFilters}
          tracksList={tracksList}
          projectsList={projectsList}
          uniqueTechStacks={uniqueTechStacks}
        />
      </FilterSection>

      <ExternalConsultantsCharts
        trackData={trackData}
        techStackDistribution={techStackDistribution}
        totalExternalConsultants={totalExternalConsultants}
        externalConsultantsPercentage={externalConsultantsPercentage}
        loading={loading}
      />

      {/* Tables Section */}
      <ConsultantsTable
        projectData={projectData}
        allocationData={allocationData}
        projectColumns={projectColumns}
        allocationColumns={allocationColumns}
        loading={loading}
        onRowClick={handleRowClick}
      />

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

export default ExternalConsultantsReport;
