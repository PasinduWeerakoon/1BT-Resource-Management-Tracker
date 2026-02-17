/**
 * ResourceCharts Component
 * Charts for resource profile
 */

import React from 'react';
import { Card, Row, Col } from 'antd';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { commonOptions, colors } from '@utils/chartConfig';

/**
 * Get allocation data for charts (mock data - replace with API data)
 */
export const getAllocationData = (employeeKey) => {
  return [
    { month: 'Jan 2024', billing: 100, nonBilling: 0, training: 0 },
    { month: 'Feb 2024', billing: 95, nonBilling: 5, training: 0 },
    { month: 'Mar 2024', billing: 90, nonBilling: 10, training: 0 },
    { month: 'Apr 2024', billing: 85, nonBilling: 15, training: 0 },
    { month: 'May 2024', billing: 80, nonBilling: 20, training: 0 },
    { month: 'Jun 2024', billing: 75, nonBilling: 25, training: 0 },
  ];
};

/**
 * Get chart data for profile
 */
export const getProfileChartData = (employeeKey) => {
  const allocationData = getAllocationData(employeeKey);

  return {
    allocationHistory: {
      labels: allocationData.map(d => d.month),
      datasets: [
        {
          label: 'Billing',
          data: allocationData.map(d => d.billing),
          borderColor: colors.primary,
          backgroundColor: colors.primary,
          tension: 0.1,
        },
        {
          label: 'Non-Billing',
          data: allocationData.map(d => d.nonBilling),
          borderColor: colors.secondary,
          backgroundColor: colors.secondary,
          tension: 0.1,
        },
        {
          label: 'Training',
          data: allocationData.map(d => d.training),
          borderColor: colors.pink,
          backgroundColor: colors.pink,
          tension: 0.1,
        },
      ],
    },
    projectDistribution: {
      labels: ['Billing', 'Non-Billing', 'Training', 'Bench'],
      datasets: [{
        data: [60, 20, 10, 10],
        backgroundColor: [
          colors.primary,
          colors.secondary,
          colors.pink,
          colors.gray,
        ],
      }],
    },
    allocationByProject: {
      labels: ['Project A', 'Project B', 'Project C', 'Bench'],
      datasets: [{
        label: 'Allocation %',
        data: [50, 30, 20, 0],
        backgroundColor: colors.primary,
      }],
    },
  };
};

const ResourceCharts = ({ employeeKey }) => {
  const chartData = getProfileChartData(employeeKey);

  return (
    <>
      <Card title="Allocation History" style={{ marginBottom: 16 }}>
        <div style={{ height: 300 }}>
          <Line
            data={chartData.allocationHistory}
            options={{
              ...commonOptions,
              maintainAspectRatio: false,
              scales: {
                y: {
                  ...commonOptions.scales.y,
                  min: 0,
                  max: 100,
                  ticks: {
                    ...commonOptions.scales.y.ticks,
                    callback: (value) => value + '%',
                  },
                },
              },
            }}
          />
        </div>
      </Card>
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Card title="Project Distribution">
            <div style={{ height: 250 }}>
              <Doughnut
                data={chartData.projectDistribution}
                options={{
                  ...commonOptions,
                  maintainAspectRatio: false,
                }}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card title="Allocation by Project">
            <div style={{ height: 250 }}>
              <Bar
                data={chartData.allocationByProject}
                options={{
                  ...commonOptions,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      ...commonOptions.scales.y,
                      min: 0,
                      max: 100,
                      ticks: {
                        ...commonOptions.scales.y.ticks,
                        callback: (value) => value + '%',
                      },
                    },
                  },
                }}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default ResourceCharts;
