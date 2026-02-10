/**
 * TechStackChart Component
 * Pie chart showing tech stack distribution for Account Manager Report
 * Positioned after the BY ALLOCATION table
 */

import React, { useState } from 'react';
import { Card } from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';
import { Pie } from 'react-chartjs-2';
import PropTypes from 'prop-types';
import {
  buildTechStackPieData,
  techStackPieOptions,
} from '../utils/chartHelpers';

const TechStackChart = ({
  techStackData,
  expanded: initialExpanded = true,
}) => {
  const [expanded, setExpanded] = useState(initialExpanded);

  const pieData = buildTechStackPieData(techStackData);
  const pieOptions = techStackPieOptions;

  return (
    <Card
      className="chart-card"
      title={
        <div
          className="collapsible-header"
          onClick={() => setExpanded((prev) => !prev)}
          style={{ cursor: 'pointer' }}
        >
          <span>No. of Employees by Tech Stack</span>
          {expanded ? <UpOutlined /> : <DownOutlined />}
        </div>
      }
      style={{ marginTop: 24 }}
    >
      {expanded && (
        <div className="chart-container" style={{ height: 300, position: 'relative' }}>
          <Pie data={pieData} options={pieOptions} />
        </div>
      )}
    </Card>
  );
};

TechStackChart.propTypes = {
  techStackData: PropTypes.object,
  expanded: PropTypes.bool,
};

TechStackChart.defaultProps = {
  techStackData: {},
  expanded: true,
};

export default React.memo(TechStackChart);
