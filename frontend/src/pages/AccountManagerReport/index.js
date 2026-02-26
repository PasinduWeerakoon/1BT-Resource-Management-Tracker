import React, { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { FilterSection, ReportHeader, SummaryCards } from '@components/ReportLayout';
import AccountManagerFilters from './components/AccountManagerFilters';
import ChartsSection from './components/ChartsSection';
import ProjectsTable from './components/ProjectsTable';
import AllocationsTable from './components/AllocationsTable';
import ProjectModal from './components/ProjectModal';
import TeamMembersModal from './components/TeamMembersModal';
import UserAllocationsModal from './components/UserAllocationsModal';
import AllocationFormModal from './components/AllocationFormModal';
import DeleteAllocationModal from './components/DeleteAllocationModal';
import ResourceAllocationsModal from './components/ResourceAllocationsModal';
import TechStackChart from './components/TechStackChart';
import useAccountManagerData from './hooks/useAccountManagerData';
import useProjectManagement from './hooks/useProjectManagement';
import useTeamManagement from './hooks/useTeamManagement';
import useAllocationManagement from './hooks/useAllocationManagement';
import useResourceAllocations from './hooks/useResourceAllocations';
import { getProjectColumns, getAllocationColumns } from './utils/columnDefinitions';
import {
  buildBillingStatusDonutData,
  billingStatusDonutOptions,
  buildEmployeesByTierBarData,
  employeesByTierBarOptions,
} from './utils/chartHelpers';
import { parseGroups } from '@pages/Auth/Login/utils/authHelpers';
import '@styles/pages/AccountManagerReport.scss';

const AccountManagerReport = () => {
  // ─── Get user from Redux to check Admin role ───
  const user = useSelector((state) => state.auth.user);
  const isAdmin = useMemo(() => {
    if (!user) return false;
    const groups = parseGroups(user.groups);
    return groups.some(group => group === 'Admin' || group === 'SuperAdmin');
  }, [user]);

  // ─── UI toggle state ───
  const [billingStatusExpanded, setBillingStatusExpanded] = useState(true);
  const [employeesByTierExpanded, setEmployeesByTierExpanded] = useState(true);
  const [projectOverviewExpanded, setProjectOverviewExpanded] = useState(true);
  const [byAllocationExpanded, setByAllocationExpanded] = useState(true);

  // ─── Data hook ───
  const data = useAccountManagerData();

  // ─── Project management hook ───
  const projectMgmt = useProjectManagement({
    filters: data.filters,
    accountTypesList: data.accountTypesList,
    projectStatusesList: data.projectStatusesList,
    billingStatusesList: data.billingStatusesList,
    clientsList: data.clientsList,
    accountManagersList: data.accountManagersList,
    onSuccess: data.fetchAccountManagerReport,
    onProjectCreated: data.refetchProjectsForFilter,
  });

  // ─── Team management hook ───
  const teamMgmt = useTeamManagement({
    resourcesList: data.resourcesList,
  });

  // ─── Allocation management hook ───
  const allocationMgmt = useAllocationManagement({
    resourcesList: data.resourcesList,
    projectsForFilter: data.projectsForFilter,
    onSuccess: data.fetchAccountManagerReport,
  });

  // ─── Resource allocations hook ───
  const resourceAlloc = useResourceAllocations();

  // ─── Chart data (memoized) ───
  const billingStatusDonutData = useMemo(
    () => buildBillingStatusDonutData(data.reportData.charts.allocationsByBillingStatus),
    [data.reportData.charts.allocationsByBillingStatus]
  );

  const employeesByTierBarData = useMemo(
    () => buildEmployeesByTierBarData(data.reportData.charts.employeesByTier),
    [data.reportData.charts.employeesByTier]
  );

  // ─── Column definitions (memoized) ───
  const projectColumns = useMemo(
    () =>
      getProjectColumns({
        onEdit: projectMgmt.handleEditProject,
        onAddTeamMembers: teamMgmt.handleAddTeamMembers,
        isAdmin,
      }),
    [projectMgmt.handleEditProject, teamMgmt.handleAddTeamMembers, isAdmin]
  );

  const allocationColumns = useMemo(
    () =>
      getAllocationColumns({
        onView: resourceAlloc.handleViewResourceAllocations,
        onEdit: allocationMgmt.handleEditAllocation,
        onDelete: allocationMgmt.handleDeleteAllocation,
        isAdmin,
      }),
    [resourceAlloc.handleViewResourceAllocations, allocationMgmt.handleEditAllocation, allocationMgmt.handleDeleteAllocation, isAdmin]
  );

  // ─── Allocation pagination handler ───
  const handleAllocationPaginationChange = useCallback(
    (page, pageSize) => {
      data.setAllocationPagination((prev) => ({ ...prev, current: page, pageSize }));
      data.fetchProjectAllocations(undefined, page, pageSize);
    },
    [data.setAllocationPagination, data.fetchProjectAllocations]
  );

  return (
    <div className="account-manager-report-page">
      <ReportHeader title="ACCOUNT MANAGER REPORT" />

      <FilterSection
        expanded={data.filtersExpanded}
        onToggle={data.toggleFiltersExpanded}
        activeFiltersCount={data.activeFiltersCount}
        onReset={data.handleResetFilters}
      >
        <AccountManagerFilters
          filters={data.filters}
          setFilters={data.setFilters}
          accountManagersList={data.accountManagersList}
          projectsForFilter={data.projectsForFilter}
          clientsList={data.clientsList}
          techStacksList={data.techStacksList}
          projectStatusesList={data.projectStatusesList}
          billingStatusesList={data.billingStatusesList}
          loadingAccountManagers={data.loadingAccountManagers}
          loadingProjectsForFilter={data.loadingProjectsForFilter}
        />
      </FilterSection>

      <SummaryCards cards={data.summaryCards} />

      <ChartsSection
        billingStatusExpanded={billingStatusExpanded}
        employeesByTierExpanded={employeesByTierExpanded}
        onToggleBillingStatus={() => setBillingStatusExpanded((e) => !e)}
        onToggleEmployeesByTier={() => setEmployeesByTierExpanded((e) => !e)}
        billingStatusDonutData={billingStatusDonutData}
        billingStatusDonutOptions={billingStatusDonutOptions}
        employeesByTierBarData={employeesByTierBarData}
        employeesByTierBarOptions={employeesByTierBarOptions}
      />

      <ProjectsTable
        projectData={data.projectData}
        projectColumns={projectColumns}
        projectPagination={data.projectPagination}
        onPaginationChange={(newPagination) =>
          data.setProjectPagination((prev) => ({ ...prev, ...newPagination }))
        }
        loadingProjects={data.loadingProjects}
        selectedProjectId={data.selectedProjectId}
        onProjectClick={data.handleProjectClick}
        onCreateProject={projectMgmt.handleCreateProject}
        projectOverviewExpanded={projectOverviewExpanded}
        onToggleExpanded={() => setProjectOverviewExpanded((e) => !e)}
        selectedAccountManagerName={data.selectedAccountManagerName}
        isAdmin={isAdmin}
      />

      <AllocationsTable
        allocationData={data.allocationData}
        allocationColumns={allocationColumns}
        allocationPagination={data.allocationPagination}
        loadingAllocations={data.loadingAllocations}
        expanded={byAllocationExpanded}
        onToggleExpanded={() => setByAllocationExpanded((e) => !e)}
        onAddAllocation={allocationMgmt.handleAddAllocation}
        onRowClick={resourceAlloc.handleRowClick}
        onPaginationChange={handleAllocationPaginationChange}
        displayProjectName={data.displayProjectName}
        isAdmin={isAdmin}
      />

      {/* Tech Stack Chart - positioned after BY ALLOCATION table */}
      <TechStackChart
        techStackData={data.reportData.charts.employeesByTechStack}
      />

      {/* ─── Modals ─── */}
      <ProjectModal
        visible={projectMgmt.isCreateProjectModalVisible}
        isEditMode={projectMgmt.isEditMode}
        onCancel={projectMgmt.handleCreateProjectCancel}
        onSubmit={projectMgmt.handleCreateProjectSubmit}
        form={projectMgmt.form}
        isSubmitting={projectMgmt.isSubmittingProject}
        billingType={projectMgmt.billingType}
        setBillingType={projectMgmt.setBillingType}
        accountType={projectMgmt.accountType}
        setAccountType={projectMgmt.setAccountType}
        clientsList={data.clientsList}
        accountManagersList={data.accountManagersList}
        projectTypesList={data.projectTypesList}
        projectBillingStatuses={data.projectBillingStatuses}
        accountTypesList={data.accountTypesList}
        projectStatusesList={data.projectStatusesList}
        loadingAccountManagers={data.loadingAccountManagers}
      />

      <TeamMembersModal
        visible={teamMgmt.isAddTeamMembersModalVisible}
        onCancel={teamMgmt.handleAddTeamMembersCancel}
        onSubmit={teamMgmt.handleTeamMembersSubmit}
        selectedProject={teamMgmt.selectedProjectForTeam}
        teamMembersList={teamMgmt.teamMembersList}
        form={teamMgmt.teamMembersForm}
        resourcesList={data.resourcesList}
        onAddRow={teamMgmt.handleAddTeamMemberRow}
        onRemoveRow={teamMgmt.handleRemoveTeamMemberRow}
        onFieldChange={teamMgmt.handleMemberFieldChange}
      />

      <UserAllocationsModal
        visible={resourceAlloc.isUserAllocationModalVisible}
        onCancel={resourceAlloc.handleUserAllocationCancel}
        onSubmit={resourceAlloc.handleUserAllocationsSubmit}
        selectedEmployee={resourceAlloc.selectedEmployee}
        allocationsList={resourceAlloc.userAllocationsList}
        form={resourceAlloc.userAllocationsForm}
        resourceBillingStatuses={data.resourceBillingStatuses}
        onAddRow={resourceAlloc.handleAddUserAllocationRow}
        onRemoveRow={resourceAlloc.handleRemoveUserAllocationRow}
        onFieldChange={resourceAlloc.handleUserAllocationFieldChange}
      />

      <AllocationFormModal
        visible={allocationMgmt.isAllocationModalVisible}
        isEditMode={allocationMgmt.isEditAllocationMode}
        onCancel={allocationMgmt.handleAllocationModalCancel}
        onSubmit={allocationMgmt.handleAllocationSubmit}
        form={allocationMgmt.allocationForm}
        isSubmitting={allocationMgmt.isSubmittingAllocation}
        resourcesList={data.resourcesList}
        projectsForFilter={data.projectsForFilter}
        resourceBillingStatuses={data.resourceBillingStatuses}
      />

      <DeleteAllocationModal
        visible={allocationMgmt.isDeleteAllocationModalVisible}
        onCancel={allocationMgmt.handleDeleteAllocationModalCancel}
        onSubmit={allocationMgmt.handleDeleteAllocationSubmit}
        form={allocationMgmt.deleteAllocationForm}
        isSubmitting={allocationMgmt.isDeletingAllocation}
        allocationRecord={allocationMgmt.allocationToDelete}
      />

      <ResourceAllocationsModal
        visible={resourceAlloc.isResourceAllocationsModalVisible}
        onClose={resourceAlloc.handleCloseResourceAllocations}
        selectedResourceName={resourceAlloc.selectedResourceName}
        selectedResourceTotalAllocation={resourceAlloc.selectedResourceTotalAllocation}
        selectedResourceTotalBilling={resourceAlloc.selectedResourceTotalBilling}
        resourceAllocationsData={resourceAlloc.resourceAllocationsData}
        loadingResourceAllocations={resourceAlloc.loadingResourceAllocations}
        billingStatusesList={data.resourceBillingStatuses}
      />
    </div>
  );
};

export default AccountManagerReport;
