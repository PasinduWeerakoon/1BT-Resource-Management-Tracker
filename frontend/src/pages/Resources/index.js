/**
 * Resources Page
 * Main page for employee/resource management
 * Refactored from 1516 lines to ~200 lines using hooks and components
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Form, Card, Button, Modal, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useResourceFilters } from './hooks/useResourceFilters';
import { useResourceData } from './hooks/useResourceData';
import { useResourceCRUD } from './hooks/useResourceCRUD';
import ResourceFilters from './components/ResourceFilters';
import ResourceTable from './components/ResourceTable';
import ResourceModal from './components/ResourceModal';
import ResourceProfile from './components/ResourceProfile';
import '@styles/pages/Resources.scss';

const { Option } = Select;

const Resources = () => {
  const [form] = Form.useForm();
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [selectedEmployeeForProfile, setSelectedEmployeeForProfile] = useState(null);

  // Use custom hooks
  const {
    filters,
    setFilters,
    debouncedSearch,
    activeFiltersCount,
    handleResetFilters,
  } = useResourceFilters();

  const {
    employees,
    setEmployees,
    fetchingEmployees,
    designations,
    tracks,
    tags,
    tiers,
    fetchEmployees,
  } = useResourceData({
    filters,
    debouncedSearch,
    pagination,
    setPagination,
  });

  const {
    loading,
    isEditMode,
    selectedEmployee,
    isAddEmployeeModalVisible,
    updatingAccountManager,
    updatingTier,
    updatingTechStack,
    handleAddEmployee,
    handleEditEmployee,
    handleCancel,
    handleEmployeeSubmit,
    handleToggleAccountManager,
    handleUpdateTier,
    handleUpdateTechStack,
    setIsAddEmployeeModalVisible,
    setSelectedEmployee,
  } = useResourceCRUD({
    form,
    fetchEmployees,
    pagination,
    tiers,
  });

  // Handle View Profile - memoized with useCallback
  const handleViewProfile = useCallback((record) => {
    setSelectedEmployeeForProfile(record);
    setIsProfileModalVisible(true);
  }, []);

  // Handle Quick Actions (Tier and Tech Stack updates) - memoized with useCallback
  const handleQuickActions = useCallback((record) => {
    Modal.confirm({
      title: 'Quick Actions',
      width: 500,
      content: (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Update Tier:</label>
            <Select
              style={{ width: '100%' }}
              defaultValue={record.tier}
              onChange={(value) => {
                handleUpdateTier(record, value);
                Modal.destroyAll();
              }}
            >
              {tiers.map((tier) => (
                <Option key={tier.id} value={tier.name}>
                  {tier.name}
                </Option>
              ))}
            </Select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Update Tech Stack:</label>
            <Select
              style={{ width: '100%' }}
              defaultValue={record.tech_stack}
              placeholder="Select tech stack"
              allowClear
              onChange={(value) => {
                if (value !== undefined) {
                  handleUpdateTechStack(record, value);
                  Modal.destroyAll();
                }
              }}
            >
              <Option value=".NET">.NET</Option>
              <Option value="Full Stack">Full Stack</Option>
              <Option value="QA">QA</Option>
              <Option value="BA/PM">BA/PM</Option>
              <Option value="Data Science">Data Science</Option>
              <Option value="Java">Java</Option>
              <Option value="React">React</Option>
            </Select>
          </div>
        </div>
      ),
      okText: 'Close',
      cancelButtonProps: { style: { display: 'none' } },
    });
  }, [handleUpdateTier, handleUpdateTechStack, tiers]);

  // Handle filter change - memoized with useCallback
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, [setFilters]);

  // Handle pagination change - memoized with useCallback
  const handlePaginationChange = useCallback((page, pageSize) => {
    setPagination(prev => ({ ...prev, current: page, pageSize }));
    fetchEmployees(page, pageSize);
  }, [fetchEmployees]);

  // Memoize toggle filters handler
  const handleToggleFilters = useCallback(() => {
    setFiltersExpanded(prev => !prev);
  }, []);

  // Memoize profile modal close handler
  const handleCloseProfile = useCallback(() => {
    setIsProfileModalVisible(false);
    setSelectedEmployeeForProfile(null);
  }, []);

  return (
    <div className="resources-page">
      <div className="resources-header">
        <h1 className="page-title">EMPLOYEE MANAGEMENT</h1>
      </div>

      {/* Filters Section */}
      <ResourceFilters
        filters={filters}
        filtersExpanded={filtersExpanded}
        activeFiltersCount={activeFiltersCount}
        onToggleExpanded={handleToggleFilters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        tiers={tiers}
        designations={designations}
        tracks={tracks}
      />

      {/* Employees Table */}
      <Card className="employees-table-card">
        <div className="employees-table-header">
          <div className="table-header-left">
            <span className="table-title">Employee List</span>
          </div>
          <div className="table-header-actions">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddEmployee}
            >
              Add New Employee
            </Button>
          </div>
        </div>
        <ResourceTable
          employees={employees}
          loading={fetchingEmployees}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          onEdit={handleEditEmployee}
          onViewProfile={handleViewProfile}
          onQuickActions={handleQuickActions}
          onToggleAccountManager={handleToggleAccountManager}
          updatingAccountManager={updatingAccountManager}
        />
      </Card>

      {/* Add/Edit Employee Modal */}
      <ResourceModal
        isVisible={isAddEmployeeModalVisible}
        isEditMode={isEditMode}
        loading={loading}
        form={form}
        onClose={handleCancel}
        onSubmit={handleEmployeeSubmit}
        tiers={tiers}
        designations={designations}
        tracks={tracks}
        tags={tags}
      />

      {/* Employee Profile Modal */}
      <ResourceProfile
        selectedEmployee={selectedEmployeeForProfile}
        isVisible={isProfileModalVisible}
        onClose={handleCloseProfile}
      />
    </div>
  );
};

export default Resources;
