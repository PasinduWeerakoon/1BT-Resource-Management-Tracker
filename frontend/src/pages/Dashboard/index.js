import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, Spin, Button } from 'antd';
import { DownOutlined, UpOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { commonOptions, colors } from '@utils/chartConfig';
import { futureAllocationsService, reportsService, summaryService, documentsService } from '@api';
import { showErrorToast, showSuccessToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import { COLUMN_WIDTHS, LABELS } from '@constants/dashboard';
import { COMMON, PAGINATION, TABLE, UI } from '@constants/app';
import { ReportHeader } from '@components/ReportLayout';
import CustomTable from '@components/Table';
import { useFetchData } from '@hooks';
import { useSelector } from 'react-redux';
import { selectDesignations, selectTechStacks, selectTiers, selectTracks } from '@redux/slices/configSlice';
import { buildIdLabelMap, getLabelFromMap } from '@utils/configMappings';
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
  const [designationExpanded, setDesignationExpanded] = useState(true);
  const [futureAllocationsExpanded, setFutureAllocationsExpanded] = useState(true);
  const [allocationPagination, setAllocationPagination] = useState({
    current: PAGINATION.DEFAULT_PAGE,
    pageSize: PAGINATION.DEFAULT_PAGE_SIZE_SMALL,
    total: 0,
  });

  const tracksList = useSelector(selectTracks);
  const techStacksList = useSelector(selectTechStacks);
  const tiersList = useSelector(selectTiers);
  const designationsList = useSelector(selectDesignations);

  const fetchAccountManagerReport = useCallback(() => {
    return reportsService.getAccountManager({
      page: allocationPagination.current,
      limit: allocationPagination.pageSize,
    });
  }, [allocationPagination.current, allocationPagination.pageSize]);

  const {
    loading: reportLoading,
  } = useFetchData(
    fetchAccountManagerReport,
    {
      autoFetch: true,
      dependencies: [allocationPagination.current, allocationPagination.pageSize],
      onSuccess: (response) => {
        if (!response) return;
        const data = response.data || response;
        const designationsPayload = data.designations || { data: [] };
        const allocationsPayload = data.allocations || { data: [] };
        const allocationsPagination = allocationsPayload.pagination || {};

        setReportData({
          charts: data.charts || {
            employeesByTrack: {},
            employeesByTechStack: {},
          },
          designations: designationsPayload,
          allocations: allocationsPayload,
        });

        setAllocationPagination((prev) => ({
          current: allocationsPagination.page ?? prev.current,
          pageSize: allocationsPagination.limit ?? prev.pageSize,
          total: allocationsPagination.total
            ?? allocationsPayload.total
            ?? (allocationsPayload.data ? allocationsPayload.data.length : 0),
        }));
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

  const designationsByResourceId = useMemo(() => {
    const map = new Map();
    (reportData.designations.data || []).forEach((item) => {
      const key = item.resource_id ?? item.id;
      if (key !== undefined && key !== null) {
        map.set(key, item);
      }
    });
    return map;
  }, [reportData.designations.data]);

  const designationsByEmployeeName = useMemo(() => {
    const map = new Map();
    (reportData.designations.data || []).forEach((item) => {
      if (item?.employee_name) {
        map.set(item.employee_name, item);
      }
    });
    return map;
  }, [reportData.designations.data]);

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

  // Designation table data (from allocations, enriched by designations lookup)
  const designationData = useMemo(() => {
    const allocations = reportData.allocations.data || [];
    return allocations.map((allocation, index) => {
      const resourceId = allocation.resource_id ?? allocation.id;
      const designationRecord = (resourceId !== undefined && designationsByResourceId.get(resourceId))
        || designationsByEmployeeName.get(allocation.employee_name);

      const trackLabel = getLabelFromMap(trackIdToLabel, designationRecord?.track_id)
        || designationRecord?.track
        || designationRecord?.track_name;
      const techStackLabel = getLabelFromMap(techStackIdToLabel, designationRecord?.tech_stack_id)
        || designationRecord?.tech_stack
        || designationRecord?.tech_stack_name;
      const tierLabel = getLabelFromMap(tierIdToLabel, designationRecord?.tier_id)
        || designationRecord?.tier
        || designationRecord?.tier_name;
      const designationLabel = getLabelFromMap(designationIdToLabel, designationRecord?.designation_id)
        || designationRecord?.designation
        || designationRecord?.designation_name;

      return {
        key: allocation.id || `allocation-${index}`,
        employeeName: allocation.employee_name || allocation.resource_name || COMMON.N_A_LABEL,
        track: trackLabel || COMMON.N_A_LABEL,
        techStack: techStackLabel || COMMON.N_A_LABEL,
        tier: tierLabel || COMMON.N_A_LABEL,
        designation: designationLabel || COMMON.N_A_LABEL,
        allocationCount: allocation.total_allocation ?? allocation.project_allocation ?? 0,
      };
    });
  }, [
    reportData.allocations.data,
    designationsByResourceId,
    designationsByEmployeeName,
    trackIdToLabel,
    techStackIdToLabel,
    tierIdToLabel,
    designationIdToLabel,
  ]);

  useEffect(() => {
    if (allocationPagination.current > 1 && designationData.length === 0) {
      setAllocationPagination((prev) => ({ ...prev, current: 1 }));
    }
  }, [designationData.length, allocationPagination.current]);

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

  const [downloading, setDownloading] = useState(false);
  const [downloadingProjects, setDownloadingProjects] = useState(false);
  const [downloadingCriticalShadows, setDownloadingCriticalShadows] = useState(false);

  const handleDownloadExcel = useCallback(async () => {
    try {
      setDownloading(true);
      await documentsService.downloadSummaryExcel();
      showSuccessToast('Summary report downloaded successfully');
    } catch (error) {
      logger.error('Failed to download summary Excel', error);
      showErrorToast('Failed to download summary report');
    } finally {
      setDownloading(false);
    }
  }, []);

  const handleDownloadProjectsExcel = useCallback(async () => {
    try {
      setDownloadingProjects(true);
      await documentsService.downloadProjectsExcel();
      showSuccessToast('Projects report downloaded successfully');
    } catch (error) {
      logger.error('Failed to download projects Excel', error);
      showErrorToast('Failed to download projects report');
    } finally {
      setDownloadingProjects(false);
    }
  }, []);

  const handleDownloadCriticalShadowsExcel = useCallback(async () => {
    try {
      setDownloadingCriticalShadows(true);
      await documentsService.downloadNonBillingExcel();
      showSuccessToast('Critical Shadows report downloaded successfully');
    } catch (error) {
      logger.error('Failed to download critical shadows Excel', error);
      showErrorToast('Failed to download critical shadows report');
    } finally {
      setDownloadingCriticalShadows(false);
    }
  }, []);

  const downloadButtons = (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Button
        type="primary"
        icon={<DownloadOutlined />}
        onClick={handleDownloadExcel}
        loading={downloading}
      >
        Download Summary
      </Button>
      <Button
        type="default"
        icon={<DownloadOutlined />}
        onClick={handleDownloadProjectsExcel}
        loading={downloadingProjects}
      >
        Download Projects
      </Button>
      <Button
        type="default"
        icon={<DownloadOutlined />}
        onClick={handleDownloadCriticalShadowsExcel}
        loading={downloadingCriticalShadows}
        danger
      >
        Download Critical Shadows
      </Button>
    </div>
  );

  return (
    <div className="dashboard-page">
      <ReportHeader 
        title={LABELS.SUMMARY_VIEW} 
        className="dashboard-header"
        extra={downloadButtons}
      />

      <div className="dashboard-content">
        <Spin spinning={summaryLoading}>
          <ResourceCountsSection counts={summaryData.resourceCounts} labels={LABELS} />
        </Spin>

        <Spin spinning={summaryLoading}>
          <PercentagesSection percentages={summaryData.percentages} labels={LABELS} />
        </Spin>

        <BottomSection
          trackDonutData={trackDonutData}
          trackDonutOptions={trackDonutOptions}
          techStackBarData={techStackBarData}
          techStackBarOptions={techStackBarOptions}
          labels={LABELS}
        />

        <div className="dashboard-section">
          <Card
            className="table-card"
            title={(
              <div className="project-overview-header">
                <span className="project-overview-title">{LABELS.BY_DESIGNATION}</span>
                <div className="project-overview-actions">
                  <div
                    className="collapsible-icon"
                    onClick={() => setDesignationExpanded(!designationExpanded)}
                  >
                    {designationExpanded ? <UpOutlined /> : <DownOutlined />}
                  </div>
                </div>
              </div>
            )}
          >
            {designationExpanded && (
              <CustomTable
                columns={designationColumns}
                dataSource={designationData}
                pagination={{
                  current: allocationPagination.current,
                  pageSize: allocationPagination.pageSize,
                  total: allocationPagination.total,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} allocations`,
                  onChange: (page, pageSize) => {
                    setAllocationPagination((prev) => ({
                      ...prev,
                      current: page,
                      pageSize,
                    }));
                  },
                  onShowSizeChange: (_, size) => {
                    setAllocationPagination((prev) => ({
                      ...prev,
                      current: 1,
                      pageSize: size,
                    }));
                  },
                }}
                size={TABLE.SIZE_SMALL}
                scroll={{ x: TABLE.DEFAULT_SCROLL_X }}
                loading={reportLoading || summaryLoading}
              />
            )}
          </Card>
        </div>

        <div className="dashboard-section">
          <Card
            className="table-card"
            title={(
              <div className="project-overview-header">
                <span className="project-overview-title">By Future Allocation</span>
                <div className="project-overview-actions">
                  <div
                    className="collapsible-icon"
                    onClick={() => setFutureAllocationsExpanded(!futureAllocationsExpanded)}
                  >
                    {futureAllocationsExpanded ? <UpOutlined /> : <DownOutlined />}
                  </div>
                </div>
              </div>
            )}
          >
            {futureAllocationsExpanded && (
              <CustomTable
                emptyText="No data"
                columns={futureAllocationColumns}
                dataSource={futureAllocationData}
                pagination={false}
                size="small"
                loading={futureAllocationsLoading}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
