/**
 * TrainingTable Component
 * Tables for displaying training report data
 */

import React from 'react';
import { Row, Col, Card } from 'antd';
import CustomTable from '@components/Table';
import PropTypes from 'prop-types';

/**
 * TrainingTable Component
 * @param {Object} props
 * @param {Array} props.designationTableData - Designation table data
 * @param {Array} props.allocationTableData - Allocation table data
 * @param {Array} props.designationColumns - Designation table columns
 * @param {Array} props.allocationColumns - Allocation table columns
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onRowClick - Row click handler for allocation table
 */
const TrainingTable = ({
  designationTableData,
  allocationTableData,
  designationColumns,
  allocationColumns,
  loading,
  onRowClick,
}) => {
  return (
    <Row gutter={[16, 16]} className="tables-section">
      {/* Top Table - BY DESIGNATION */}
      <Col xs={24}>
        <Card className="table-card" title="BY DESIGNATION" loading={loading}>
          <CustomTable
            columns={designationColumns}
            dataSource={designationTableData}
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
            dataSource={allocationTableData}
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

TrainingTable.propTypes = {
  designationTableData: PropTypes.array.isRequired,
  allocationTableData: PropTypes.array.isRequired,
  designationColumns: PropTypes.array.isRequired,
  allocationColumns: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onRowClick: PropTypes.func,
};

export default TrainingTable;
