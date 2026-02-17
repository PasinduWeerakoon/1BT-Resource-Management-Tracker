/**
 * LoadingState Component
 * Consistent loading UI component
 * 
 * @param {Object} props
 * @param {string} props.message - Loading message (default: "Loading...")
 * @param {string} props.size - Spinner size: "small" | "default" | "large" (default: "default")
 * @param {string} props.className - Additional CSS classes
 * 
 * @example
 * <LoadingState message="Loading data..." size="large" />
 */
import React from 'react';
import { Spin } from 'antd';
import '@styles/components/LoadingState.scss';

const LoadingState = ({
  message = 'Loading...',
  size = 'default',
  className = '',
}) => {
  return (
    <div className={`loading-state ${className}`}>
      <Spin size={size} />
      {message && <div className="loading-message">{message}</div>}
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(LoadingState);
