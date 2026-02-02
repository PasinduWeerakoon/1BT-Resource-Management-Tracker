import React, { useMemo, memo } from 'react';
import { Table } from 'antd';
import { PAGINATION } from '@constants/app';
import '@styles/components/Table.scss';

/**
 * Reusable Ant Design Table component
 * Wrapper around Ant Design Table with consistent styling
 * Optimized with React.memo and useMemo for better performance
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
  // Memoize processed columns to avoid recalculation on every render
  const processedColumns = useMemo(() => {
    if (fixedFirstColumn && columns && columns.length > 0) {
      return columns.map((col, index) => {
        if (index === 0) {
          return {
            ...col,
            fixed: 'left',
          };
        }
        return col;
      });
    }
    return columns;
  }, [columns, fixedFirstColumn]);

  // Memoize scroll configuration to avoid recalculation
  const scrollConfig = useMemo(() => {
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
    return scroll
      ? {
          ...scroll,
          x: scrollX,
        }
      : {
          x: scrollX,
        };
  }, [scroll, processedColumns]);

  // Memoize pagination configuration
  const paginationConfig = useMemo(() => {
    if (pagination === false) {
      return false;
    }
    return {
      showSizeChanger: true,
      showTotal: (total) => `Total ${total} items`,
      pageSizeOptions: PAGINATION.PAGE_SIZE_OPTIONS,
      defaultPageSize: PAGINATION.DEFAULT_PAGE_SIZE,
      ...pagination,
    };
  }, [pagination]);

  return (
    <Table
      columns={processedColumns}
      dataSource={dataSource}
      loading={loading}
      pagination={paginationConfig}
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

// Memoize component to prevent unnecessary re-renders
// Custom comparison function for better performance
export default memo(CustomTable, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.loading === nextProps.loading &&
    prevProps.size === nextProps.size &&
    prevProps.bordered === nextProps.bordered &&
    prevProps.rowKey === nextProps.rowKey &&
    prevProps.dataSource === nextProps.dataSource &&
    prevProps.columns === nextProps.columns &&
    prevProps.pagination === nextProps.pagination &&
    prevProps.scroll === nextProps.scroll &&
    prevProps.onRow === nextProps.onRow
  );
});
