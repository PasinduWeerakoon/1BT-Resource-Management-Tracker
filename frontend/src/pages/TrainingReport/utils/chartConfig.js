/**
 * Training Report Chart Configurations
 */

import { commonOptions, colors } from '@utils/chartConfig';

/**
 * Create donut chart data for track distribution
 * @param {Array} trackData - Track distribution data
 * @returns {Object} Chart.js data object
 */
export const createDonutChartData = (trackData) => {
  if (!Array.isArray(trackData) || trackData.length === 0) {
    return {
      labels: ['No Data'],
      datasets: [{
        data: [0],
        backgroundColor: [colors.gray],
        borderWidth: 2,
        borderColor: '#fff',
      }],
    };
  }

  return {
    labels: trackData.map(item => item.track || item.name),
    datasets: [{
      data: trackData.map(item => item.count || 0),
      backgroundColor: [colors.secondary, colors.primary, colors.gray, colors.purple],
      borderWidth: 2,
      borderColor: '#fff',
    }],
  };
};

/**
 * Create donut chart options
 * @returns {Object} Chart.js options object
 */
export const createDonutChartOptions = () => ({
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
});

/**
 * Create bar chart data for tech stack distribution
 * @param {Array} techStackData - Tech stack distribution data
 * @returns {Object} Chart.js data object
 */
export const createTechStackBarChartData = (techStackData) => {
  if (!Array.isArray(techStackData) || techStackData.length === 0) {
    return {
      labels: ['No Data'],
      datasets: [{
        label: 'Number of Employees',
        data: [0],
        backgroundColor: colors.primary,
        borderRadius: 4,
      }],
    };
  }

  return {
    labels: techStackData.map(item => item.techStack || item.name),
    datasets: [{
      label: 'Number of Employees',
      data: techStackData.map(item => item.count || 0),
      backgroundColor: techStackData.map((item, index) =>
        index < 2 ? colors.secondary : colors.primary
      ),
      borderRadius: 4,
    }],
  };
};

/**
 * Create tech stack bar chart options
 * @returns {Object} Chart.js options object
 */
export const createTechStackBarChartOptions = () => ({
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
});

/**
 * Create bar chart data for designation distribution
 * @param {Array} designationData - Designation distribution data
 * @returns {Object} Chart.js data object
 */
export const createDesignationBarChartData = (designationData) => {
  if (!Array.isArray(designationData) || designationData.length === 0) {
    return {
      labels: ['No Data'],
      datasets: [{
        label: 'Number of Employees',
        data: [0],
        backgroundColor: colors.pink,
        borderRadius: 4,
      }],
    };
  }

  return {
    labels: designationData.map(item => item.designation || item.name),
    datasets: [{
      label: 'Number of Employees',
      data: designationData.map(item => item.count || 0),
      backgroundColor: colors.pink,
      borderRadius: 4,
    }],
  };
};

/**
 * Create designation bar chart options
 * @returns {Object} Chart.js options object
 */
export const createDesignationBarChartOptions = () => ({
  ...commonOptions,
  indexAxis: 'y',
  scales: {
    ...commonOptions.scales,
    x: {
      ...commonOptions.scales.x,
      beginAtZero: true,
      ticks: {
        ...commonOptions.scales.x.ticks,
        stepSize: 1,
      },
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
});
