/**
 * SummaryCards Component
 * KPI cards for AccountManagerReport
 */

import React from 'react';
import { Card } from 'antd';

const SummaryCards = ({ kpiData }) => {
  return (
    <div className="kpi-section">
      <div className="kpi-grid">
        <Card className="kpi-card">
          <div className="kpi-value">{kpiData.billableResources}</div>
          <div className="kpi-label">BILLABLE RESOURCES</div>
        </Card>
        <Card className="kpi-card">
          <div className="kpi-value">{kpiData.allocatedCount}</div>
          <div className="kpi-label">ALLOCATED COUNT</div>
        </Card>
        <Card className="kpi-card">
          <div className="kpi-value">{kpiData.billableCount}</div>
          <div className="kpi-label">BILLABLE COUNT</div>
        </Card>
        <Card className="kpi-card">
          <div className="kpi-value">{kpiData.avgProjectAllocation}%</div>
          <div className="kpi-label">Average Project Allocation</div>
        </Card>
        <Card className="kpi-card">
          <div className="kpi-value">{kpiData.avgBillingPercentage}%</div>
          <div className="kpi-label">Average Billing Percentage</div>
        </Card>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(SummaryCards);
