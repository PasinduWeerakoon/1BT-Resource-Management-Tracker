import React, { useState, useMemo } from 'react';
import { Card } from 'antd';
import dayjs from 'dayjs';
import { commonOptions, colors } from '@utils/chartConfig';
import { futureAllocationsService, reportsService, summaryService } from '@api';
import { showErrorToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import { COLUMN_WIDTHS, LABELS } from '@constants/dashboard';
import { COMMON, UI } from '@constants/app';
import { ReportHeader } from '@components/ReportLayout';
import CustomTable from '@components/Table';
import { useFetchData } from '@hooks';
import { useSelector } from 'react-redux';
import { selectDesignations, selectTechStacks, selectTiers, selectTracks } from '@redux/slices/configSlice';
import {
  buildAllocationsByEmployeeName,
  buildAllocationsByResourceId,
  buildIdLabelMap,
  getLabelFromMap,
} from '@utils/configMappings';
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
    allocations: { data: [] },
  });
  const [summaryData, setSummaryData] = useState({
    resourceCounts: {},
    percentages: {},
    charts: {
      accountsByTrack: [],
      accountsByTechStack: [],
    },
  });
  const [futureAllocations, setFutureAllocations] = useState([]);

  const tracksList = useSelector(selectTracks);
  const techStacksList = useSelector(selectTechStacks);
  const tiersList = useSelector(selectTiers);
  const designationsList = useSelector(selectDesignations);

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
          allocations: data.allocations || { data: [] },
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

  const {
    loading: futureAllocationsLoading,
  } = useFetchData(
    () => futureAllocationsService.getAll({ limit: 10, offset: 0 }),
    {
      autoFetch: true,
      onSuccess: (response) => {
        if (!response) return;
        const data = response.data || response;
        const payload = data.data || data;
        const list = payload.futureAllocations || [];
        setFutureAllocations(list);
      },
      onError: (error) => {
        logger.error('Failed to fetch future allocations', error);
        showErrorToast('Failed to load future allocations');
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

  const trackIdToLabel = useMemo(() => buildIdLabelMap(tracksList), [tracksList]);
  const techStackIdToLabel = useMemo(() => buildIdLabelMap(techStacksList), [techStacksList]);
  const tierIdToLabel = useMemo(() => buildIdLabelMap(tiersList), [tiersList]);
  const designationIdToLabel = useMemo(() => buildIdLabelMap(designationsList), [designationsList]);

  const allocationsByResourceId = useMemo(
    () => buildAllocationsByResourceId(reportData.allocations.data || []),
    [reportData.allocations.data]
  );
  const allocationsByEmployeeName = useMemo(
    () => buildAllocationsByEmployeeName(reportData.allocations.data || []),
    [reportData.allocations.data]
  );

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

      const trackLabel = getLabelFromMap(trackIdToLabel, item.track_id)
        || item.track
        || item.track_name;
      const techStackLabel = getLabelFromMap(techStackIdToLabel, item.tech_stack_id)
        || item.tech_stack
        || item.tech_stack_name;
      const tierLabel = getLabelFromMap(tierIdToLabel, item.tier_id)
        || item.tier
        || item.tier_name;
      const designationLabel = getLabelFromMap(designationIdToLabel, item.id)
        || item.designation
        || item.designation_name;

      const resourceId = item.resource_id ?? item.id;
      const allocation = (resourceId !== undefined && allocationsByResourceId.get(resourceId))
        || allocationsByEmployeeName.get(item.employee_name);

      return {
        key: uniqueKey,
        employeeName: item.employee_name || item.name || COMMON.N_A_LABEL,
        track: trackLabel || COMMON.N_A_LABEL,
        techStack: techStackLabel || COMMON.N_A_LABEL,
        tier: tierLabel || COMMON.N_A_LABEL,
        designation: designationLabel || COMMON.N_A_LABEL,
        allocationCount: allocation?.total_allocation ?? 0,
      };
    });
  }, [
    reportData.designations.data,
    trackIdToLabel,
    techStackIdToLabel,
    tierIdToLabel,
    designationIdToLabel,
    allocationsByResourceId,
    allocationsByEmployeeName,
  ]);

  const futureAllocationColumns = [
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 180,
    },
    {
      title: 'Project',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 180,
    },
    {
      title: 'Allocation %',
      dataIndex: 'allocationPercentage',
      key: 'allocationPercentage',
      width: 140,
    },
    {
      title: 'Billing %',
      dataIndex: 'billingPercentage',
      key: 'billingPercentage',
      width: 120,
    },
    {
      title: 'Effective Date',
      dataIndex: 'effectiveDate',
      key: 'effectiveDate',
      width: 140,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
    },
    {
      title: 'Change Type',
      dataIndex: 'changeType',
      key: 'changeType',
      width: 160,
    },
  ];

  const futureAllocationData = useMemo(() => {
    return (futureAllocations || []).map((item, index) => ({
      key: item.id || `future-allocation-${index}`,
      employeeName: item.resource_name || item.employee_name || COMMON.N_A_LABEL,
      projectName: item.project_name || item.project || COMMON.N_A_LABEL,
      allocationPercentage: item.allocation_percentage !== undefined && item.allocation_percentage !== null
        ? `${Number(item.allocation_percentage).toFixed(0)}%`
        : '0%',
      billingPercentage: item.billing_percentage !== undefined && item.billing_percentage !== null
        ? `${Number(item.billing_percentage).toFixed(0)}%`
        : '0%',
      effectiveDate: item.effective_date
        ? dayjs(item.effective_date).format('DD MMM YYYY')
        : (item.allocated_date ? dayjs(item.allocated_date).format('DD MMM YYYY') : ''),
      status: item.status || COMMON.N_A_LABEL,
      changeType: item.change_type || COMMON.N_A_LABEL,
    }));
  }, [futureAllocations]);

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
              columns={futureAllocationColumns}
              dataSource={futureAllocationData}
              pagination={false}
              size="small"
              loading={futureAllocationsLoading}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
