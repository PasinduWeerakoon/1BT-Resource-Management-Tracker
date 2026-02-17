import React from 'react';
import { Card } from 'antd';

const MetricCard = ({ icon, value, label, className = '' }) => (
  <Card className={`metric-card ${className}`}>
    {icon && <div className="metric-icon-wrapper">{icon}</div>}
    <div className="metric-value">{value}</div>
    <div className="metric-label">{label}</div>
  </Card>
);

export default MetricCard;
