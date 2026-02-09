/**
 * Chart Configuration for AccountManagerReport
 * Builds Chart.js data and options from report data
 */

import { commonOptions, colors } from '@utils/chartConfig';

/**
 * Build billing status donut chart data from report data
 * @param {Object} allocationsByBillingStatus - { statusName: count, ... }
 */
export const buildBillingStatusDonutData = (allocationsByBillingStatus = {}) => {
  const labels = Object.keys(allocationsByBillingStatus);
  const data = Object.values(allocationsByBillingStatus);

  const colorMap = {
    'Bench': colors.error,
    'Non-Billing': colors.warning,
    'Training': colors.success,
    'Presale': colors.info,
    'Billing': colors.purple,
  };

  const backgroundColors = labels.map(label => colorMap[label] || colors.primary);

  return {
    labels: labels.length > 0 ? labels : ['No Data'],
    datasets: [
      {
        data: data.length > 0 ? data : [0],
        backgroundColor: backgroundColors.length > 0 ? backgroundColors : [colors.gray],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };
};

/**
 * Billing status donut chart options
 */
export const billingStatusDonutOptions = {
  ...commonOptions,
  plugins: {
    ...commonOptions.plugins,
    legend: {
      ...commonOptions.plugins.legend,
      position: 'bottom',
    },
    tooltip: {
      ...commonOptions.plugins.tooltip,
      callbacks: {
        label: function (context) {
          const label = context.label || '';
          const value = context.parsed || 0;
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(2);
          return `${label}: ${value} (${percentage}%)`;
        },
      },
    },
  },
};

/**
 * Build employees by tier bar chart data from report data
 * @param {Object} employeesByTier - { tierName: count, ... }
 */
export const buildEmployeesByTierBarData = (employeesByTier = {}) => {
  const labels = Object.keys(employeesByTier);
  const data = Object.values(employeesByTier);

  return {
    labels: labels.length > 0 ? labels : ['No Data'],
    datasets: [
      {
        label: 'Number of Employees',
        data: data.length > 0 ? data : [0],
        backgroundColor: colors.primary,
        borderRadius: 4,
      },
    ],
  };
};

/**
 * Employees by tier bar chart options
 */
export const employeesByTierBarOptions = {
  ...commonOptions,
  indexAxis: 'y',
  scales: {
    ...commonOptions.scales,
    x: {
      ...commonOptions.scales.x,
      beginAtZero: true,
    },
    y: {
      ...commonOptions.scales.y,
      grid: {
        display: false,
      },
    },
  },
  plugins: {
    ...commonOptions.plugins,
    legend: {
      display: false,
    },
  },
};
