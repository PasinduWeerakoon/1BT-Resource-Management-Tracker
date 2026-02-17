/**
 * Table Column Factories
 * Reusable column definitions for common table patterns
 */

import { Badge } from 'antd';

/**
 * Creates a text column with optional sorting
 * @param {Object} config - Column configuration
 * @param {string} config.title - Column title
 * @param {string} config.dataIndex - Data index
 * @param {string} config.key - Column key
 * @param {number} config.width - Column width
 * @param {boolean} config.sortable - Whether column is sortable
 * @param {Function} config.render - Custom render function
 * @returns {Object} Column definition
 */
export const createTextColumn = ({
  title,
  dataIndex,
  key,
  width = 150,
  sortable = false,
  render,
}) => {
  const column = {
    title,
    dataIndex,
    key: key || dataIndex,
    width,
  };

  if (sortable) {
    column.sorter = (a, b) => {
      const aVal = a[dataIndex] || '';
      const bVal = b[dataIndex] || '';
      return String(aVal).localeCompare(String(bVal));
    };
  }

  if (render) {
    column.render = render;
  }

  return column;
};

/**
 * Creates a number column with sorting
 * @param {Object} config - Column configuration
 * @param {string} config.title - Column title
 * @param {string} config.dataIndex - Data index
 * @param {string} config.key - Column key
 * @param {number} config.width - Column width
 * @param {Function} config.format - Format function (e.g., for percentages)
 * @param {Function} config.render - Custom render function
 * @returns {Object} Column definition
 */
export const createNumberColumn = ({
  title,
  dataIndex,
  key,
  width = 120,
  format,
  render,
}) => {
  const column = {
    title,
    dataIndex,
    key: key || dataIndex,
    width,
    sorter: (a, b) => {
      const aVal = parseFloat(a[dataIndex] || 0);
      const bVal = parseFloat(b[dataIndex] || 0);
      return aVal - bVal;
    },
  };

  if (format) {
    column.render = (value) => format(value);
  } else if (render) {
    column.render = render;
  }

  return column;
};

/**
 * Creates a percentage column with color coding
 * @param {Object} config - Column configuration
 * @param {string} config.title - Column title
 * @param {string} config.dataIndex - Data index for formatted value
 * @param {string} config.rawDataIndex - Data index for raw numeric value
 * @param {string} config.key - Column key
 * @param {number} config.width - Column width
 * @param {Function} config.getColor - Function to get color based on value
 * @returns {Object} Column definition
 */
export const createPercentageColumn = ({
  title,
  dataIndex,
  rawDataIndex,
  key,
  width = 150,
  getColor,
}) => {
  return {
    title,
    dataIndex,
    key: key || dataIndex,
    width,
    sorter: (a, b) => {
      const aVal = parseFloat(a[rawDataIndex || dataIndex] || 0);
      const bVal = parseFloat(b[rawDataIndex || dataIndex] || 0);
      return aVal - bVal;
    },
    render: (text, record) => {
      const rawValue = parseFloat(record[rawDataIndex || dataIndex] || 0);
      const color = getColor ? getColor(rawValue, record) : '#1890ff';
      const fontWeight = rawValue > 100 ? 'bold' : 'normal';

      return (
        <span style={{ color, fontWeight }}>
          {text || `${rawValue.toFixed(2)}%`}
        </span>
      );
    },
  };
};

/**
 * Creates a status column with badge rendering
 * @param {Object} config - Column configuration
 * @param {string} config.title - Column title
 * @param {string} config.dataIndex - Data index
 * @param {string} config.key - Column key
 * @param {number} config.width - Column width
 * @param {Function} config.getStatusConfig - Function to get badge config based on status
 * @returns {Object} Column definition
 */
export const createStatusColumn = ({
  title,
  dataIndex,
  key,
  width = 120,
  getStatusConfig,
}) => {
  const defaultGetStatusConfig = (status) => {
    const statusMap = {
      Active: { status: 'success', text: 'Active' },
      Inactive: { status: 'default', text: 'Inactive' },
      Bench: { status: 'default', text: 'Bench' },
      Billing: { status: 'success', text: 'Billing' },
      NonBilling: { status: 'default', text: 'Non-Billing' },
    };
    return statusMap[status] || { status: 'default', text: status || 'N/A' };
  };

  return {
    title,
    dataIndex,
    key: key || dataIndex,
    width,
    render: (status) => {
      const config = (getStatusConfig || defaultGetStatusConfig)(status);
      return <Badge status={config.status} text={config.text} />;
    },
  };
};

/**
 * Creates a date column
 * @param {Object} config - Column configuration
 * @param {string} config.title - Column title
 * @param {string} config.dataIndex - Data index
 * @param {string} config.key - Column key
 * @param {number} config.width - Column width
 * @param {boolean} config.sortable - Whether column is sortable
 * @param {Function} config.format - Date format function
 * @returns {Object} Column definition
 */
export const createDateColumn = ({
  title,
  dataIndex,
  key,
  width = 130,
  sortable = true,
  format,
}) => {
  const column = {
    title,
    dataIndex,
    key: key || dataIndex,
    width,
  };

  if (sortable) {
    column.sorter = (a, b) => {
      const aDate = a[dataIndex] ? new Date(a[dataIndex]) : new Date(0);
      const bDate = b[dataIndex] ? new Date(b[dataIndex]) : new Date(0);
      return aDate - bDate;
    };
  }

  if (format) {
    column.render = (text) => (text ? format(text) : 'N/A');
  }

  return column;
};

/**
 * Creates an action column
 * @param {Object} config - Column configuration
 * @param {string} config.title - Column title (default: 'Actions')
 * @param {string} config.key - Column key (default: 'actions')
 * @param {number} config.width - Column width (default: 100)
 * @param {boolean} config.fixed - Whether column is fixed (default: 'right')
 * @param {Function} config.render - Render function for actions
 * @returns {Object} Column definition
 */
export const createActionColumn = ({
  title = 'Actions',
  key = 'actions',
  width = 100,
  fixed = 'right',
  render,
}) => {
  const column = {
    title,
    key,
    width,
    fixed,
  };

  if (render) {
    column.render = render;
  }

  return column;
};

/**
 * Common column definitions
 */
export const commonColumns = {
  employeeName: (width = 180) => createTextColumn({
    title: 'Employee Name',
    dataIndex: 'employeeName',
    key: 'employeeName',
    width,
    sortable: true,
  }),

  employeeId: (width = 120) => createTextColumn({
    title: 'Employee ID',
    dataIndex: 'employeeId',
    key: 'employeeId',
    width,
    sortable: true,
  }),

  email: (width = 200) => createTextColumn({
    title: 'Email',
    dataIndex: 'email',
    key: 'email',
    width,
  }),

  designation: (width = 150) => createTextColumn({
    title: 'Designation',
    dataIndex: 'designation',
    key: 'designation',
    width,
  }),

  track: (width = 120) => createTextColumn({
    title: 'Track',
    dataIndex: 'track',
    key: 'track',
    width,
  }),

  projectName: (width = 180) => createTextColumn({
    title: 'Project Name',
    dataIndex: 'projectName',
    key: 'projectName',
    width,
    sortable: true,
  }),

  accountManager: (width = 150) => createTextColumn({
    title: 'Account Manager',
    dataIndex: 'accountManager',
    key: 'accountManager',
    width,
  }),

  startDate: (width = 120) => createDateColumn({
    title: 'Start Date',
    dataIndex: 'startDate',
    key: 'startDate',
    width,
  }),

  endDate: (width = 120) => createDateColumn({
    title: 'End Date',
    dataIndex: 'endDate',
    key: 'endDate',
    width,
  }),

  dateOfJoining: (width = 130) => createDateColumn({
    title: 'Date of Joining',
    dataIndex: 'dateOfJoining',
    key: 'dateOfJoining',
    width,
  }),
};

export default {
  createTextColumn,
  createNumberColumn,
  createPercentageColumn,
  createStatusColumn,
  createDateColumn,
  createActionColumn,
  commonColumns,
};
