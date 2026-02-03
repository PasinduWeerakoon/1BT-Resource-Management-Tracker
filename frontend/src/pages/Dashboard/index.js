import React, { useState, useMemo } from 'react';
import { Card } from 'antd';
import { commonOptions, colors } from '@utils/chartConfig';
import { reportsService, summaryService } from '@api';
import { showErrorToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import { COLUMN_WIDTHS, LABELS } from '@constants/dashboard';
import { COMMON, UI } from '@constants/app';
import { ReportHeader } from '@components/ReportLayout';
import CustomTable from '@components/Table';
import { useFetchData } from '@hooks';
import BottomSection from './components/BottomSection';
import ResourceCountsSection from './components/ResourceCountsSection';
import PercentagesSection from './components/PercentagesSection';
import '@styles/pages/Dashboard.scss';

const Dashboard = () => {
  const [reportData, setReportData] = useState({
    charts: {
      employeesByTrack: {},
      employeesByTechStack: {},
    },
    designations: { data: [] },
  });
  const [summaryData, setSummaryData] = useState({
    resourceCounts: {},
    percentages: {},
    charts: {
      accountsByTrack: [],
      accountsByTechStack: [],
    },
  });

  const {
    loading: reportLoading,
  } = useFetchData(
    () => reportsService.getAccountManager({}),
    {
      autoFetch: true,
      onSuccess: (response) => {
        if (!response) return;
        const data = response.data || response;
        setReportData({
          charts: data.charts || {
            employeesByTrack: {},
            employeesByTechStack: {},
          },
          designations: data.designations || { data: [] },
        });
      },
      onError: (error) => {
        logger.error('Failed to fetch account manager report', error);
        showErrorToast('Failed to load account manager report data');
      },
    }
  );

  const {
    loading: summaryLoading,
  } = useFetchData(
    async () => {
      const [resourceCountsRes, percentagesRes, chartsRes] = await Promise.all([
        summaryService.getResourceCounts(),
        summaryService.getPercentages(),
        summaryService.getCharts(),
      ]);

      return {
        resourceCounts: resourceCountsRes?.data || resourceCountsRes || {},
        percentages: percentagesRes?.data || percentagesRes || {},
        charts: chartsRes?.data || chartsRes || {
          accountsByTrack: [],
          accountsByTechStack: [],
        },
      };
    },
    {
      autoFetch: true,
      onSuccess: (data) => {
        if (!data) return;
        setSummaryData(data);
      },
      onError: (error) => {
        logger.error('Failed to fetch dashboard summary data', error);
        showErrorToast('Failed to load dashboard summary data');
      },
    }
  );

  // Chart.js data for track donut chart
  const trackDonutData = useMemo(() => {
    const accountsByTrack = summaryData.charts.accountsByTrack || [];
    const labels = accountsByTrack.map((item) => item.track);
    const data = accountsByTrack.map((item) => item.count);

    const colorPalette = [
      colors.primary,
      colors.error,
      colors.warning,
      colors.success,
      colors.info,
      colors.purple,
      colors.cyan,
    ];

    const backgroundColors = labels.map((_, index) => colorPalette[index % colorPalette.length]);

    return {
      labels: labels.length > 0 ? labels : [COMMON.NO_DATA_LABEL],
      datasets: [
        {
          data: data.length > 0 ? data : [0],
          backgroundColor: backgroundColors.length > 0 ? backgroundColors : [colors.gray],
          borderWidth: UI.CHART_BORDER_WIDTH,
          borderColor: UI.CHART_BORDER_COLOR,
        },
      ],
    };
  }, [summaryData.charts.accountsByTrack]);

  const trackDonutOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      legend: {
        ...commonOptions.plugins.legend,
        position: 'bottom',
      },
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(2);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Chart.js data for tech stack bar chart
  const techStackBarData = useMemo(() => {
    const accountsByTechStack = summaryData.charts.accountsByTechStack || [];
    const labels = accountsByTechStack.map((item) => item.techStack);
    const data = accountsByTechStack.map((item) => item.count);

    return {
      labels: labels.length > 0 ? labels : [COMMON.NO_DATA_LABEL],
      datasets: [
        {
          label: 'Number of Employees',
          data: data.length > 0 ? data : [0],
          backgroundColor: colors.primary,
          borderRadius: UI.CHART_BORDER_RADIUS,
        },
      ],
    };
  }, [summaryData.charts.accountsByTechStack]);

  const techStackBarOptions = {
    ...commonOptions,
    indexAxis: 'y',
    scales: {
      ...commonOptions.scales,
      x: {
        ...commonOptions.scales.x,
        beginAtZero: true,
      },
      y: {
        ...commonOptions.scales.y,
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      ...commonOptions.plugins,
      legend: {
        display: false,
      },
    },
  };

  // Designation columns
  const designationColumns = [
    {
      title: LABELS.EMPLOYEE_NAME,
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: COLUMN_WIDTHS.EMPLOYEE_NAME,
    },
    {
      title: LABELS.TRACK,
      dataIndex: 'track',
      key: 'track',
      width: COLUMN_WIDTHS.TRACK,
    },
    {
      title: LABELS.TECH_STACK,
      dataIndex: 'techStack',
      key: 'techStack',
      width: COLUMN_WIDTHS.TECH_STACK,
    },
    {
      title: LABELS.TIER,
      dataIndex: 'tier',
      key: 'tier',
      width: COLUMN_WIDTHS.TIER,
    },
    {
      title: LABELS.DESIGNATION,
      dataIndex: 'designation',
      key: 'designation',
      width: COLUMN_WIDTHS.DESIGNATION,
    },
    {
      title: LABELS.ALLOCATION_COUNT,
      dataIndex: 'allocationCount',
      key: 'allocationCount',
      width: COLUMN_WIDTHS.ALLOCATION_COUNT,
    },
  ];

  // Designation data
  const designationData = useMemo(() => {
    const designations = reportData.designations.data || [];
    return designations.map((item, index) => {
      // Create a unique key using id if available, otherwise use a combination of properties and index
      const uniqueKey = item.id
        ? `designation-${item.id}`
        : `designation-${index}-${item.employee_name || item.name || ''}-${item.track || ''}`;

      return {
        key: uniqueKey,
        employeeName: item.employee_name || item.name || COMMON.N_A_LABEL,
        track: item.track || COMMON.N_A_LABEL,
        techStack: item.tech_stack || COMMON.N_A_LABEL,
        tier: item.tier || COMMON.N_A_LABEL,
        designation: item.designation || COMMON.N_A_LABEL,
        allocationCount: item.allocation_count || 0,
      };
    });
  }, [reportData.designations.data]);

  return (
    <div className="dashboard-page">
      <ReportHeader title={LABELS.SUMMARY_VIEW} className="dashboard-header" />

      <div className="dashboard-content">
        <ResourceCountsSection counts={summaryData.resourceCounts} labels={LABELS} />

        <PercentagesSection percentages={summaryData.percentages} labels={LABELS} />

        <BottomSection
          designationColumns={designationColumns}
          designationData={designationData}
          loading={reportLoading || summaryLoading}
          trackDonutData={trackDonutData}
          trackDonutOptions={trackDonutOptions}
          techStackBarData={techStackBarData}
          techStackBarOptions={techStackBarOptions}
          labels={LABELS}
        />

        <div className="dashboard-section">
          <Card className="table-card" title="By Future Allocation">
            <CustomTable
              emptyText="No data"
              columns={[]}
              dataSource={[]}
              pagination={false}
              size="small"
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
