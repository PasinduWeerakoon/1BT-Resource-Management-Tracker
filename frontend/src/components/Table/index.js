import React from 'react';
import { Table } from 'antd';
import '@styles/components/Table.scss';

/**
 * Reusable Ant Design Table component
 * Wrapper around Ant Design Table with consistent styling
 * 
 * @param {Array} columns - Table columns configuration
 * @param {Array} dataSource - Table data
 * @param {Boolean} loading - Loading state
 * @param {Object|Boolean} pagination - Pagination configuration
 * @param {String|Function} rowKey - Row key field or function
 * @param {Function} onRow - Row click handler
 * @param {Object} scroll - Scroll configuration
 * @param {String} size - Table size (small, middle, large)
 * @param {Boolean} bordered - Show borders
 */
const CustomTable = ({
  columns,
  dataSource,
  loading,
  pagination,
  rowKey,
  onRow,
  scroll,
  size = 'middle',
  bordered = false,
  fixedFirstColumn = true,
  ...rest
}) => {
  // Make first column fixed if fixedFirstColumn is true
  const processedColumns = fixedFirstColumn && columns && columns.length > 0
    ? columns.map((col, index) => {
        if (index === 0) {
          return {
            ...col,
            fixed: 'left',
          };
        }
        return col;
      })
    : columns;

  // Ensure scroll configuration includes x for horizontal scrolling
  // If scroll.x is provided, use it; otherwise calculate based on columns
  const calculateScrollX = () => {
    if (scroll?.x) {
      return scroll.x;
    }
    // Calculate approximate width based on column widths
    if (processedColumns && processedColumns.length > 0) {
      const totalWidth = processedColumns.reduce((sum, col) => {
        return sum + (col.width || 150);
      }, 0);
      return totalWidth;
    }
    return 'max-content';
  };

  const scrollX = calculateScrollX();
  const scrollConfig = scroll
    ? {
        ...scroll,
        x: scrollX,
      }
    : {
        x: scrollX,
      };

  return (
    <Table
      columns={processedColumns}
      dataSource={dataSource}
      loading={loading}
      pagination={pagination !== false ? {
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} items`,
        pageSizeOptions: ['10', '20', '50', '100'],
        defaultPageSize: 20,
        ...pagination,
      } : false}
      rowKey={rowKey || 'id'}
      onRow={onRow}
      scroll={scrollConfig}
      size={size}
      bordered={bordered}
      className="custom-table"
      {...rest}
    />
  );
};

export default CustomTable;
