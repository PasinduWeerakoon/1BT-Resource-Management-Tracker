/**
 * ProjectsTable Component
 * Table component for displaying projects in Account Manager Report
 */

import React from 'react';
import { Card, Button } from 'antd';
import { PlusOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import CustomTable from '@components/Table';
import PropTypes from 'prop-types';

/**
 * ProjectsTable Component
 * @param {Object} props
 * @param {Array} props.projectData - Project data array
 * @param {Array} props.projectColumns - Table column definitions
 * @param {Object} props.projectPagination - Pagination state
 * @param {Function} props.onPaginationChange - Pagination change handler
 * @param {boolean} props.loadingProjects - Loading state
 * @param {number} props.selectedProjectId - Currently selected project ID
 * @param {Function} props.onProjectClick - Project row click handler
 * @param {Function} props.onCreateProject - Create project button handler
 * @param {boolean} props.projectOverviewExpanded - Whether table is expanded
 * @param {Function} props.onToggleExpanded - Toggle expanded state
 * @param {string} props.selectedAccountManagerName - Selected account manager name for display
 * @param {boolean} props.isAdmin - Whether user is Admin (controls button visibility)
 */
const ProjectsTable = ({
  projectData,
  projectColumns,
  projectPagination,
  onPaginationChange,
  loadingProjects,
  selectedProjectId,
  onProjectClick,
  onCreateProject,
  projectOverviewExpanded,
  onToggleExpanded,
  selectedAccountManagerName,
  isAdmin = false,
}) => {
  return (
    <Card
      className="table-card"
      title={
        <div className="project-overview-header">
          <span className="project-overview-title">
            Project Overview
            {selectedAccountManagerName && (
              <span style={{ marginLeft: '8px', color: '#1890ff', fontWeight: 'normal' }}>
                - {selectedAccountManagerName}
              </span>
            )}
          </span>
          <div className="project-overview-actions">
            {projectOverviewExpanded && isAdmin && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onCreateProject}
                className="create-project-btn"
              >
                Create New Project
              </Button>
            )}
            <div
              className="collapsible-icon"
              onClick={onToggleExpanded}
            >
              {projectOverviewExpanded ? <UpOutlined /> : <DownOutlined />}
            </div>
          </div>
        </div>
      }
    >
      {projectOverviewExpanded && (
        <CustomTable
          columns={projectColumns}
          dataSource={projectData}
          pagination={{
            current: projectPagination.current,
            pageSize: projectPagination.pageSize,
            total: projectPagination.total,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} projects`,
            onChange: (page, pageSize) => {
              onPaginationChange({ current: page, pageSize });
            },
            onShowSizeChange: (current, size) => {
              onPaginationChange({ current: 1, pageSize: size });
            },
          }}
          size="small"
          scroll={{ x: 800 }}
          loading={loadingProjects}
          onRow={(record) => ({
            onClick: () => onProjectClick(record),
            style: {
              cursor: 'pointer',
              backgroundColor: selectedProjectId === record.id ? '#e6f7ff' : 'transparent',
            },
          })}
          rowClassName={(record) => selectedProjectId === record.id ? 'selected-project-row' : ''}
        />
      )}
    </Card>
  );
};

ProjectsTable.propTypes = {
  projectData: PropTypes.array.isRequired,
  projectColumns: PropTypes.array.isRequired,
  projectPagination: PropTypes.object.isRequired,
  onPaginationChange: PropTypes.func.isRequired,
  loadingProjects: PropTypes.bool,
  selectedProjectId: PropTypes.number,
  onProjectClick: PropTypes.func.isRequired,
  onCreateProject: PropTypes.func.isRequired,
  projectOverviewExpanded: PropTypes.bool.isRequired,
  onToggleExpanded: PropTypes.func.isRequired,
  selectedAccountManagerName: PropTypes.string,
  isAdmin: PropTypes.bool,
};

export default ProjectsTable;
