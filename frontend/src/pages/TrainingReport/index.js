import React, { useEffect, useMemo } from 'react';
import { useUserAllocationModal } from '@hooks/useUserAllocationModal';
import UserAllocationModal from '@components/UserAllocationModal';
import { useReportFilters } from '@hooks/reports';
import { FilterSection, ReportHeader } from '@components/ReportLayout';
import TrainingReportFilters from './components/TrainingReportFilters';
import TrainingCharts from './components/TrainingCharts';
import TrainingTable from './components/TrainingTable';
import useTrainingData from './hooks/useTrainingData';
import {
  transformDesignationTableData,
  transformAllocationTableData,
} from './utils/trainingTransformers';
import {
  getDesignationColumns,
  getAllocationColumns,
} from './utils/tableColumns';
import '@styles/pages/TrainingReport.scss';

const TrainingReport = () => {
  const defaultFilters = {
    designation: 'All',
    track: 'All',
    techStack: 'All',
    dateRange: null,
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

  // Use training data hook
  const {
    loading,
    kpiData,
    trackData,
    techStackData,
    designationData,
    designationTableData: rawDesignationTableData,
    allocationTableData: rawAllocationTableData,
    fetchTrainingReport,
  } = useTrainingData(filters);

  // Transform table data
  const designationTableData = useMemo(
    () => transformDesignationTableData(rawDesignationTableData),
    [rawDesignationTableData]
  );
  const allocationTableData = useMemo(
    () => transformAllocationTableData(rawAllocationTableData),
    [rawAllocationTableData]
  );

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
