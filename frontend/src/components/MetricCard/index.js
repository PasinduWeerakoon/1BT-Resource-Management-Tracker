/**
 * MetricCard Component
 * Reusable metric card for displaying key metrics with icon and label
 * 
 * @param {Object} props
 * @param {string|number} props.value - Metric value to display
 * @param {string} props.label - Metric label
 * @param {ReactNode} props.icon - Icon component (optional)
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Click handler (optional)
 * 
 * @example
 * <MetricCard
 *   value={37.8}
 *   label="Billing Resource Count"
 *   icon={<UserOutlined />}
 * />
 */
import React from 'react';
import { Card } from 'antd';
import '@styles/components/MetricCard.scss';

const MetricCard = ({
  value,
  label,
  icon,
  className = '',
  onClick,
}) => {
  return (
    <Card
      className={`metric-card ${className}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : {}}
    >
      {icon && (
        <div className="metric-icon-wrapper">
          {React.cloneElement(icon, { className: 'metric-icon' })}
        </div>
      )}
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
    </Card>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(MetricCard);
