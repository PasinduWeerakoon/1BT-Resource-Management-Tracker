/**
 * EmptyState Component
 * Consistent empty state UI component
 * 
 * @param {Object} props
 * @param {string} props.message - Empty state message (default: "No data available")
 * @param {ReactNode} props.icon - Custom icon (optional)
 * @param {ReactNode} props.extra - Extra content (optional)
 * @param {string} props.className - Additional CSS classes
 * 
 * @example
 * <EmptyState
 *   message="No resources found"
 *   extra={<Button onClick={handleAdd}>Add Resource</Button>}
 * />
 */
import React from 'react';
import { Empty } from 'antd';
import '@styles/components/EmptyState.scss';

const EmptyState = ({
  message = 'No data available',
  icon,
  extra,
  className = '',
}) => {
  return (
    <div className={`empty-state ${className}`}>
      <Empty
        description={message}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        imageStyle={{ height: 60 }}
        {...(icon && { icon })}
        {...(extra && { children: extra })}
      />
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(EmptyState);
