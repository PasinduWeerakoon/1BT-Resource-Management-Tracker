import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Badge,
  Descriptions,
  Tabs,
  Tag,
  Button,
} from 'antd';
import {
  HistoryOutlined,
  BarChartOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import CustomTable from '@components/Table';
import { useReportFilters } from '@hooks/reports';
import { FilterSection, ReportHeader, SummaryCards } from '@components/ReportLayout';
import ActivityLogFilters from './components/ActivityLogFilters';
import LogsTable from './components/LogsTable';
import LogDetailModal from './components/LogDetailModal';
import useAuditLogs from './hooks/useAuditLogs';
import useLogStats from './hooks/useLogStats';
import '@styles/pages/ActivityLog.scss';

const ActivityLog = () => {
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState('logs');

  const defaultFilters = {
    action: undefined,
    entityType: undefined,
    entityId: undefined,
    userId: undefined,
    startDate: undefined,
    endDate: undefined,
  };

  // Use shared hooks
  const {
    filters,
    setFilters,
    activeFiltersCount,
    handleResetFilters,
    filtersExpanded,
    toggleFiltersExpanded,
  } = useReportFilters(defaultFilters);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Use custom hooks
  const {
    auditLogs,
    loading,
    fetchAuditLogs,
    fetchLogDetail: fetchLogDetailFromHook,
  } = useAuditLogs(filters, pagination);

  const {
    stats,
    dlqData,
    loadingStats,
    loadingDLQ,
    fetchStats,
    fetchDLQ,
    handleReprocessDLQ,
  } = useLogStats();

  // Enhanced reset filters to also reset pagination
  const handleResetFiltersWithPagination = (e) => {
    handleResetFilters(e);
    setPagination({ ...pagination, current: 1 });
  };

  // Handle view detail
  const handleViewDetail = async (record) => {
    setDetailModalVisible(true);
    setLoadingDetail(true);
    try {
      const logData = await fetchLogDetailFromHook(record.id);
      setSelectedLog(logData);
    } catch (error) {
      setSelectedLog(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setFilters({
        ...filters,
        startDate: dates[0],
        endDate: dates[1],
      });
    } else {
      setFilters({
        ...filters,
        startDate: undefined,
        endDate: undefined,
      });
    }
  };

  // Handle pagination change
  const handleTableChange = async (newPagination) => {
    setPagination(newPagination);
    try {
      const result = await fetchAuditLogs(newPagination.current, newPagination.pageSize);
      if (result && result.pagination) {
        setPagination({
          current: result.pagination.page || newPagination.current,
          pageSize: result.pagination.limit || newPagination.pageSize,
          total: result.pagination.total || 0,
        });
      }
    } catch (error) {
      // Error already handled in hook
    }
  };

  // Fetch data on mount and filter changes
  useEffect(() => {
    fetchAuditLogs();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch logs when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAuditLogs(1, pagination.pageSize);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Fetch DLQ when tab changes to DLQ
  useEffect(() => {
    if (activeTab === 'dlq') {
      fetchDLQ();
    }
  }, [activeTab]);

  // Table columns (custom for ActivityLog)
  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      render: (text) => (text ? dayjs(text).format('DD MMM YYYY HH:mm:ss') : 'N/A'),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 120,
    },
    {
      title: 'Entity Type',
      dataIndex: 'entityType',
      key: 'entityType',
      width: 150,
      render: (text) => <Tag>{text || 'N/A'}</Tag>,
    },
    {
      title: 'Entity',
      dataIndex: 'entityName',
      key: 'entityName',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'User',
      dataIndex: 'userName',
      key: 'userName',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Changed Fields',
      dataIndex: 'changedFields',
      key: 'changedFields',
      width: 200,
      render: (fields) => {
        if (!fields || fields.length === 0) return 'N/A';
        return (
          <span>{fields.length} field{fields.length > 1 ? 's' : ''}</span>
        );
      },
    },
  ];

  // DLQ columns
  const dlqColumns = [
    {
      title: 'Message ID',
      dataIndex: 'messageId',
      key: 'messageId',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Receive Count',
      dataIndex: 'approximateReceiveCount',
      key: 'approximateReceiveCount',
      width: 120,
      render: (count) => <Badge count={count} showZero />,
    },
    {
      title: 'Sent Timestamp',
      dataIndex: 'sentTimestamp',
      key: 'sentTimestamp',
      width: 180,
      render: (text) => (text ? dayjs(text).format('DD MMM YYYY HH:mm:ss') : 'N/A'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleReprocessDLQ(record.messageId)}
        >
          Reprocess
        </Button>
      ),
    },
  ];

  // Calculate KPIs
  const totalEvents = stats?.totalEvents || 0;
  const createdCount = stats?.byAction?.CREATE || 0;
  const updatedCount = stats?.byAction?.UPDATE || 0;
  const deletedCount = stats?.byAction?.DELETE || 0;

  // Summary cards data
  const summaryCards = [
    { value: totalEvents, label: 'TOTAL EVENTS' },
    { value: createdCount, label: 'CREATED' },
    { value: updatedCount, label: 'UPDATED' },
    { value: deletedCount, label: 'DELETED' },
  ];

  return (
    <div className="activity-log-page">
      <ReportHeader title="ACTIVITY LOG" />

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="activity-log-tabs"
        items={[
          {
            key: 'logs',
            label: (
              <span>
                <HistoryOutlined /> Audit Logs
              </span>
            ),
            children: (
              <>
                <FilterSection
                  expanded={filtersExpanded}
                  onToggle={toggleFiltersExpanded}
                  activeFiltersCount={activeFiltersCount}
                  onReset={handleResetFiltersWithPagination}
                >
                  <ActivityLogFilters
                    filters={filters}
                    setFilters={setFilters}
                    handleDateRangeChange={handleDateRangeChange}
                  />
                </FilterSection>

                <SummaryCards cards={summaryCards} />

                {/* Table Section */}
                <LogsTable
                  auditLogs={auditLogs}
                  columns={columns}
                  pagination={pagination}
                  onPaginationChange={handleTableChange}
                  loading={loading}
                  onViewDetail={handleViewDetail}
                />
              </>
            ),
          },
          {
            key: 'stats',
            label: (
              <span>
                <BarChartOutlined /> Statistics
              </span>
            ),
            children: (
              <Card className="table-card" title="Audit Statistics (Last 7 Days)">
                {stats && (
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Card title="Actions Breakdown" loading={loadingStats}>
                        <Descriptions column={1} bordered>
                          <Descriptions.Item label="Total Events">
                            <strong>{stats.totalEvents || 0}</strong>
                          </Descriptions.Item>
                          <Descriptions.Item label="Created">
                            <Badge status="success" text={stats.byAction?.CREATE || 0} />
                          </Descriptions.Item>
                          <Descriptions.Item label="Updated">
                            <Badge status="processing" text={stats.byAction?.UPDATE || 0} />
                          </Descriptions.Item>
                          <Descriptions.Item label="Deleted">
                            <Badge status="error" text={stats.byAction?.DELETE || 0} />
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>
                    <Col xs={24} md={12}>
                      <Card title="Entity Types Breakdown" loading={loadingStats}>
                        <Descriptions column={1} bordered>
                          {stats.byEntityType &&
                            (Array.isArray(stats.byEntityType)
                              ? stats.byEntityType.map((item, index) => (
                                <Descriptions.Item
                                  key={item.entity_type || item.entityType || index}
                                  label={item.entity_type || item.entityType || 'Unknown'}
                                >
                                  <strong>{item.count || 0}</strong>
                                </Descriptions.Item>
                              ))
                              : Object.entries(stats.byEntityType).map(([entityType, count]) => (
                                <Descriptions.Item key={entityType} label={entityType}>
                                  <strong>{typeof count === 'object' ? (count.count || 0) : count}</strong>
                                </Descriptions.Item>
                              ))
                            )}
                        </Descriptions>
                      </Card>
                    </Col>
                    <Col xs={24}>
                      <Card title="Active Users" loading={loadingStats}>
                        <div className="stat-card">
                          <div className="stat-value">{stats.activeUsers || 0}</div>
                          <div className="stat-label">Active Users (Last 7 Days)</div>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                )}
              </Card>
            ),
          },
          {
            key: 'dlq',
            label: (
              <span>
                <WarningOutlined /> Failed Messages
              </span>
            ),
            children: (
              <Card className="table-card" title="Dead Letter Queue (DLQ)">
                <CustomTable
                  columns={dlqColumns}
                  dataSource={dlqData}
                  pagination={false}
                  size="small"
                  loading={loadingDLQ}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Detail Modal */}
      <LogDetailModal
        visible={detailModalVisible}
        selectedLog={selectedLog}
        loading={loadingDetail}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedLog(null);
        }}
      />
    </div>
  );
};

export default ActivityLog;
