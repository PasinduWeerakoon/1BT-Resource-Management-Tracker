/**
 * ConsultantsTable Component
 * Tables for displaying external consultants data
 */

import React from 'react';
import { Row, Col, Card } from 'antd';
import CustomTable from '@components/Table';
import PropTypes from 'prop-types';

/**
 * ConsultantsTable Component
 * @param {Object} props
 * @param {Array} props.projectData - Project data array
 * @param {Array} props.allocationData - Allocation data array
 * @param {Array} props.projectColumns - Project table columns
 * @param {Array} props.allocationColumns - Allocation table columns
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onRowClick - Row click handler for allocation table
 */
const ConsultantsTable = ({
  projectData,
  allocationData,
  projectColumns,
  allocationColumns,
  loading,
  onRowClick,
}) => {
  return (
    <Row gutter={[16, 16]} className="tables-section">
      {/* Top Table - BY PROJECT */}
      <Col xs={24}>
        <Card className="table-card" title="BY PROJECT" loading={loading}>
          <CustomTable
            columns={projectColumns}
            dataSource={projectData}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 800 }}
            size="small"
          />
        </Card>
      </Col>

      {/* Bottom Table - BY ALLOCATION */}
      <Col xs={24}>
        <Card className="table-card" title="BY ALLOCATION" loading={loading}>
          <CustomTable
            columns={allocationColumns}
            dataSource={allocationData}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 900 }}
            size="small"
            onRow={onRowClick ? (record) => ({
              onClick: () => onRowClick(record),
              style: { cursor: 'pointer' },
            }) : undefined}
          />
        </Card>
      </Col>
    </Row>
  );
};

ConsultantsTable.propTypes = {
  projectData: PropTypes.array.isRequired,
  allocationData: PropTypes.array.isRequired,
  projectColumns: PropTypes.array.isRequired,
  allocationColumns: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onRowClick: PropTypes.func,
};

export default ConsultantsTable;
