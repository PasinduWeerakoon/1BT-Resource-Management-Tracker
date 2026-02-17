/**
 * ErrorState Component
 * Consistent error UI component
 * 
 * @param {Object} props
 * @param {string|Error} props.error - Error message or Error object
 * @param {string} props.title - Error title (default: "Error")
 * @param {Function} props.onRetry - Retry handler (optional)
 * @param {string} props.className - Additional CSS classes
 * 
 * @example
 * <ErrorState
 *   error="Failed to load data"
 *   onRetry={() => fetchData()}
 * />
 */
import React from 'react';
import { Result, Button } from 'antd';
import { CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import '@styles/components/ErrorState.scss';

const ErrorState = ({
  error,
  title = 'Error',
  onRetry,
  className = '',
}) => {
  const errorMessage = error?.message || error || 'An error occurred';

  return (
    <div className={`error-state ${className}`}>
      <Result
        status="error"
        title={title}
        subTitle={errorMessage}
        icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
        extra={
          onRetry && (
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={onRetry}
            >
              Retry
            </Button>
          )
        }
      />
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(ErrorState);
