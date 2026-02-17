/**
 * Chart Configuration for External Consultants Report
 */

import { commonOptions, colors } from '@utils/chartConfig';

/**
 * Get donut chart data for track distribution
 */
export const getDonutChartData = (trackData) => {
  return {
    labels: trackData.map(item => item.track || 'Unassigned'),
    datasets: [
      {
        data: trackData.map(item => item.count),
        backgroundColor: [
          colors.secondary,
          colors.primary,
          colors.pink,
          colors.error,
          colors.warning,
          colors.info,
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };
};

/**
 * Get donut chart options
 */
export const getDonutChartOptions = () => {
  return {
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
            const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : '0.00';
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };
};

/**
 * Get bar chart data for tech stack distribution
 */
export const getBarChartData = (techStackDistribution) => {
  return {
    labels: techStackDistribution.map(item => item.techStack),
    datasets: [
      {
        label: 'Number of Consultants',
        data: techStackDistribution.map(item => item.count),
        backgroundColor: techStackDistribution.map((item, index) =>
          index < 2 ? colors.secondary : colors.primary
        ),
        borderRadius: 4,
      },
    ],
  };
};

/**
 * Get bar chart options
 */
export const getBarChartOptions = () => {
  return {
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
};
