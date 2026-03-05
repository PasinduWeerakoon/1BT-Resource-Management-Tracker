import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useUserAllocationModal } from '@hooks/useUserAllocationModal';
import UserAllocationModal from '@components/UserAllocationModal';
import { useReportFilters } from '@hooks/reports';
import { FilterSection, ReportHeader } from '@components/ReportLayout';
import { selectTracks, selectTechStacks } from '@redux/slices/configSlice';
import TrainingReportFilters from './components/TrainingReportFilters';
import TrainingCharts from './components/TrainingCharts';
import TrainingTable from './components/TrainingTable';
import useTrainingData from './hooks/useTrainingData';
import {
  getDesignationColumns,
  getAllocationColumns,
} from './utils/tableColumns';
import '@styles/pages/TrainingReport.scss';

const TrainingReport = () => {
  const defaultFilters = {
    track: 'All',
    techStack: 'All',
  };

  // Get configuration data from Redux (cached on login)
  const tracks = useSelector(selectTracks);
  const techStacks = useSelector(selectTechStacks);

  // Use shared hooks
  const {
    filters,
    setFilters,
    activeFiltersCount,
    handleResetFilters,
    filtersExpanded,
    toggleFiltersExpanded,
  } = useReportFilters(defaultFilters);

  // Use training data hook (table data is already transformed in the hook)
  const {
    loading,
    kpiData,
    trackData,
    techStackData,
    designationData,
    designationTableData,
    allocationTableData,
    fetchTrainingReport,
  } = useTrainingData(filters);

  // Table columns
  const designationColumns = useMemo(() => getDesignationColumns(), []);
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
  } = useUserAllocationModal(allocationTableData);

  // Fetch data on mount and filter changes
  useEffect(() => {
    fetchTrainingReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return (
    <div className="training-report-page">
      <ReportHeader title="TRAINING REPORT" />

      <FilterSection
        expanded={filtersExpanded}
        onToggle={toggleFiltersExpanded}
        activeFiltersCount={activeFiltersCount}
        onReset={handleResetFilters}
        title="Slicers"
      >
        <TrainingReportFilters
          filters={filters}
          setFilters={setFilters}
          tracks={tracks}
          techStacks={techStacks}
        />
      </FilterSection>

      {/* Charts Section */}
      <TrainingCharts
        trackData={trackData}
        techStackData={techStackData}
        designationData={designationData}
        totalEmployeesInTraining={kpiData.totalEmployeesInTraining}
        trainingPercentage={kpiData.trainingPercentage}
      />

      {/* Tables Section */}
      <TrainingTable
        designationTableData={designationTableData}
        allocationTableData={allocationTableData}
        designationColumns={designationColumns}
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

export default TrainingReport;
