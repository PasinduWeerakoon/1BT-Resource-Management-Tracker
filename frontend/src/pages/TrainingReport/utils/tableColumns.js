/**
 * Training Report Table Column Definitions
 */

/**
 * BY DESIGNATION Table Columns
 */
export const getDesignationColumns = () => [
  {
    title: 'Employee Name',
    dataIndex: 'employeeName',
    key: 'employeeName',
    width: 200,
  },
  {
    title: 'Track',
    dataIndex: 'track',
    key: 'track',
    width: 120,
  },
  {
    title: 'Tech Stack',
    dataIndex: 'techStack',
    key: 'techStack',
    width: 150,
  },
  {
    title: 'Designation',
    dataIndex: 'designation',
    key: 'designation',
    width: 300,
  },
];

/**
 * BY ALLOCATION Table Columns
 */
export const getAllocationColumns = () => [
  {
    title: 'Employee Name',
    dataIndex: 'employeeName',
    key: 'employeeName',
    width: 200,
  },
  {
    title: 'Project Allocated Date',
    dataIndex: 'allocatedDate',
    key: 'allocatedDate',
    width: 180,
  },
  {
    title: 'Project Deallocated Date',
    dataIndex: 'deallocatedDate',
    key: 'deallocatedDate',
    width: 180,
  },
  {
    title: 'Project Allocation',
    dataIndex: 'projectAllocation',
    key: 'projectAllocation',
    width: 150,
  },
  {
    title: 'Duration (Days)',
    dataIndex: 'duration',
    key: 'duration',
    width: 150,
  },
];
