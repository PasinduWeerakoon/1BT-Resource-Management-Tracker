import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Common chart options
export const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        font: {
          family: 'Poppins',
          size: 12,
        },
        padding: 12,
        usePointStyle: true,
      },
    },
    tooltip: {
      font: {
        family: 'Poppins',
        size: 12,
      },
    },
  },
  scales: {
    x: {
      ticks: {
        font: {
          family: 'Poppins',
          size: 11,
        },
        color: '#595959',
      },
      grid: {
        display: false,
      },
    },
    y: {
      ticks: {
        font: {
          family: 'Poppins',
          size: 11,
        },
        color: '#595959',
      },
      grid: {
        color: '#f0f0f0',
        lineWidth: 1,
      },
    },
  },
};

// Color palette
export const colors = {
  primary: '#97230C',
  secondary: '#595959',
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1890ff',
  purple: '#722ed1',
  cyan: '#13c2c2',
  pink: '#ff7875',
  gray: '#8c8c8c',
};

export default ChartJS;
