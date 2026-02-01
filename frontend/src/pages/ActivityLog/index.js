import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Row,
  Col,
  Card,
  Select,
  DatePicker,
  Input,
  Button,
  Modal,
  Badge,
  Space,
  Descriptions,
  Tag,
  Tabs,
  App,
  Tooltip,
} from 'antd';
import {
  FilterOutlined,
  UpOutlined,
  DownOutlined,
  ReloadOutlined,
  EyeOutlined,
  HistoryOutlined,
  BarChartOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import CustomTable from '@components/Table';
import { auditLogsService } from '@api';
import { showErrorToast, showSuccessToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import '@styles/pages/ActivityLog.scss';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const ActivityLog = () => {
  const { message } = App.useApp();
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [dlqData, setDlqData] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingDLQ, setLoadingDLQ] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState('logs');
  const fetchInProgressRef = useRef(false);
  const fetchStatsInProgressRef = useRef(false);
  const fetchDLQInProgressRef = useRef(false);

  const [filters, setFilters] = useState({
    action: undefined,
    entityType: undefined,
    entityId: undefined,
    userId: undefined,
    startDate: undefined,
    endDate: undefined,
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Default filter values
  const defaultFilters = {
    action: undefined,
    entityType: undefined,
    entityId: undefined,
    userId: undefined,
    startDate: undefined,
    endDate: undefined,
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== defaultFilters[key] && filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
        count++;
      }
    });
    return count;
  }, [filters]);

  // Reset filters
  const handleResetFilters = (e) => {
    e.stopPropagation();
    setFilters({ ...defaultFilters });
    setPagination({ ...pagination, current: 1 });
  };

  // Fetch audit logs
  const fetchAuditLogs = async (page = 1, limit = 10) => {
    if (fetchInProgressRef.current) {
      return;
    }

    try {
      fetchInProgressRef.current = true;
      setLoading(true);

      const params = {
        page: page || pagination.current,
        limit: limit || pagination.pageSize,
      };

      // Add filters
      if (filters.action) params.action = filters.action;
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.entityId) params.entityId = filters.entityId;
      if (filters.userId) params.userId = filters.userId;
      if (filters.startDate) params.startDate = filters.startDate.format('YYYY-MM-DD');
      if (filters.endDate) params.endDate = filters.endDate.format('YYYY-MM-DD');

      const response = await auditLogsService.getAll(params);

      let logsData = [];
      let paginationData = {};

      if (response) {
        if (Array.isArray(response.data)) {
          logsData = response.data;
          paginationData = response.pagination || {};
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          logsData = response.data.data;
          paginationData = response.data.pagination || {};
        } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
          logsData = response.data.items || [];
          paginationData = response.data.pagination || {};
        }
      }

      const transformedData = logsData.map((log, index) => ({
        key: log.id || `log-${index}`,
        id: log.id,
        timestamp: log.timestamp,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        userName: log.userName || log.userEmail || 'Unknown',
        userEmail: log.userEmail,
        entityName: log.entityName || log.entityId,
        changedFields: log.changedFields || [],
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
      }));

      setAuditLogs(transformedData);
      setPagination({
        current: paginationData.page || page || 1,
        pageSize: paginationData.limit || limit || 10,
        total: paginationData.total || 0,
      });
    } catch (error) {
      logger.error('Failed to fetch audit logs:', error);
      showErrorToast('Failed to load audit logs');
      setAuditLogs([]);
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    if (fetchStatsInProgressRef.current) {
      return;
    }

    try {
      fetchStatsInProgressRef.current = true;
      setLoadingStats(true);

      const response = await auditLogsService.getStats({ days: 7 });

      let statsData = null;
      if (response) {
        if (response.data) {
          statsData = response.data;
        } else if (typeof response === 'object' && !Array.isArray(response)) {
          statsData = response;
        }
      }

      setStats(statsData);
    } catch (error) {
      logger.error('Failed to fetch statistics:', error);
      showErrorToast('Failed to load statistics');
    } finally {
      setLoadingStats(false);
      fetchStatsInProgressRef.current = false;
    }
  };

  // Fetch DLQ data (Admin only)
  const fetchDLQ = async () => {
    if (fetchDLQInProgressRef.current) {
      return;
    }

    try {
      fetchDLQInProgressRef.current = true;
      setLoadingDLQ(true);

      const response = await auditLogsService.getDLQ();

      let dlqArray = [];
      if (response) {
        if (Array.isArray(response.data)) {
          dlqArray = response.data;
        } else if (response.data && Array.isArray(response.data)) {
          dlqArray = response.data;
        }
      }

      setDlqData(dlqArray);
    } catch (error) {
      logger.error('Failed to fetch DLQ:', error);
      showErrorToast('Failed to load failed messages');
      setDlqData([]);
    } finally {
      setLoadingDLQ(false);
      fetchDLQInProgressRef.current = false;
    }
  };

  // Fetch audit log detail
  const fetchLogDetail = async (logId) => {
    try {
      setLoadingDetail(true);
      const response = await auditLogsService.getById(logId);

      let logData = null;
      if (response) {
        if (response.data) {
          logData = response.data;
        } else if (typeof response === 'object' && !Array.isArray(response)) {
          logData = response;
        }
      }

      setSelectedLog(logData);
    } catch (error) {
      logger.error('Failed to fetch log detail:', error);
      showErrorToast('Failed to load log details');
      setSelectedLog(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Handle view detail
  const handleViewDetail = (record) => {
    setDetailModalVisible(true);
    fetchLogDetail(record.id);
  };

  // Handle reprocess DLQ message
  const handleReprocessDLQ = async (messageId) => {
    try {
      await auditLogsService.reprocessDLQ(messageId);
      showSuccessToast('Message requeued for processing');
      fetchDLQ(); // Refresh DLQ list
    } catch (error) {
      logger.error('Failed to reprocess message:', error);
      showErrorToast('Failed to reprocess message');
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
  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
    fetchAuditLogs(newPagination.current, newPagination.pageSize);
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

  // Get action badge
  const getActionBadge = (action) => {
    const actionConfig = {
      CREATE: { color: 'success', icon: <CheckCircleOutlined /> },
      UPDATE: { color: 'processing', icon: <BarChartOutlined /> },
      DELETE: { color: 'error', icon: <CloseCircleOutlined /> },
    };

    const config = actionConfig[action] || { color: 'default', icon: null };
    return (
      <Badge
        status={config.color}
        text={action}
        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
      >
        {config.icon}
      </Badge>
    );
  };

  // Table columns
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
      render: (action) => getActionBadge(action),
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
          <Tooltip title={fields.join(', ')}>
            <span>{fields.length} field{fields.length > 1 ? 's' : ''}</span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          View
        </Button>
      ),
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

  return (
    <div className="activity-log-page">
      {/* Header Section */}
      <div className="report-header">
        <h1 className="report-title">ACTIVITY LOG</h1>
      </div>

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
                {/* Filters Section */}
                <Card className="filters-card">
                  <div
                    className="filters-header"
                    onClick={() => setFiltersExpanded(!filtersExpanded)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="filters-header-left">
                      <FilterOutlined className="filter-icon" />
                      <span className="filters-title">Filters</span>
                      {activeFiltersCount > 0 && (
                        <>
                          <Badge count={activeFiltersCount} showZero={false} className="active-filters-badge">
                            <span></span>
                          </Badge>
                          <Button
                            type="text"
                            size="small"
                            icon={<ReloadOutlined />}
                            onClick={handleResetFilters}
                            className="reset-filters-btn"
                          >
                            Reset
                          </Button>
                        </>
                      )}
                    </div>
                    {filtersExpanded ? (
                      <UpOutlined className="collapse-icon" />
                    ) : (
                      <DownOutlined className="collapse-icon" />
                    )}
                  </div>
                  {filtersExpanded && (
                    <div className="filters-content">
                      <Row gutter={[16, 16]} className="filters-row">
                        <Col xs={24} sm={12} md={8} lg={6}>
                          <div className="filter-item">
                            <label>Action</label>
                            <Select
                              placeholder="Select Action"
                              allowClear
                              style={{ width: '100%' }}
                              value={filters.action}
                              onChange={(value) => setFilters({ ...filters, action: value })}
                            >
                              <Option value="CREATE">CREATE</Option>
                              <Option value="UPDATE">UPDATE</Option>
                              <Option value="DELETE">DELETE</Option>
                            </Select>
                          </div>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={6}>
                          <div className="filter-item">
                            <label>Entity Type</label>
                            <Select
                              placeholder="Select Entity Type"
                              allowClear
                              style={{ width: '100%' }}
                              value={filters.entityType}
                              onChange={(value) => setFilters({ ...filters, entityType: value })}
                            >
                              <Option value="resource">Resource</Option>
                              <Option value="project">Project</Option>
                              <Option value="allocation">Allocation</Option>
                              <Option value="client">Client</Option>
                              <Option value="track">Track</Option>
                              <Option value="designation">Designation</Option>
                            </Select>
                          </div>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={6}>
                          <div className="filter-item">
                            <label>Entity ID</label>
                            <Input
                              placeholder="Enter Entity ID"
                              value={filters.entityId}
                              onChange={(e) => setFilters({ ...filters, entityId: e.target.value || undefined })}
                              allowClear
                            />
                          </div>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={6}>
                          <div className="filter-item">
                            <label>User ID</label>
                            <Input
                              placeholder="Enter User ID"
                              value={filters.userId}
                              onChange={(e) => setFilters({ ...filters, userId: e.target.value || undefined })}
                              allowClear
                            />
                          </div>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={12}>
                          <div className="filter-item">
                            <label>Date Range</label>
                            <RangePicker
                              style={{ width: '100%' }}
                              value={filters.startDate && filters.endDate ? [filters.startDate, filters.endDate] : null}
                              onChange={handleDateRangeChange}
                              format="DD/MM/YYYY"
                            />
                          </div>
                        </Col>
                      </Row>
                    </div>
                  )}
                </Card>

                {/* KPI Cards Section */}
                <Row gutter={[16, 16]} className="kpi-section">
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Card className="kpi-card">
                      <div className="kpi-value">{totalEvents}</div>
                      <div className="kpi-label">TOTAL EVENTS</div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Card className="kpi-card">
                      <div className="kpi-value" style={{ color: '#52c41a' }}>{createdCount}</div>
                      <div className="kpi-label">CREATED</div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Card className="kpi-card">
                      <div className="kpi-value" style={{ color: '#1890ff' }}>{updatedCount}</div>
                      <div className="kpi-label">UPDATED</div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Card className="kpi-card">
                      <div className="kpi-value" style={{ color: '#ff4d4f' }}>{deletedCount}</div>
                      <div className="kpi-label">DELETED</div>
                    </Card>
                  </Col>
                </Row>

                {/* Table Section */}
                <Card className="table-card" title="Audit Logs">
                  <CustomTable
                    columns={columns}
                    dataSource={auditLogs}
                    pagination={{
                      current: pagination.current,
                      pageSize: pagination.pageSize,
                      total: pagination.total,
                      showSizeChanger: true,
                      showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                      pageSizeOptions: ['10', '20', '50', '100'],
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1200 }}
                    size="small"
                    loading={loading}
                  />
                </Card>
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
      <Modal
        title="Audit Log Details"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedLog(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setDetailModalVisible(false);
            setSelectedLog(null);
          }}>
            Close
          </Button>,
        ]}
        width={800}
      >
        {loadingDetail ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : selectedLog ? (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="ID">{selectedLog.id}</Descriptions.Item>
            <Descriptions.Item label="Timestamp">
              {selectedLog.timestamp
                ? dayjs(selectedLog.timestamp).format('DD MMM YYYY HH:mm:ss')
                : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Action">
              {getActionBadge(selectedLog.action)}
            </Descriptions.Item>
            <Descriptions.Item label="Entity Type">
              <Tag>{selectedLog.entityType || 'N/A'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Entity ID">{selectedLog.entityId || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="User ID">{selectedLog.userId || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="User Email">{selectedLog.userEmail || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="IP Address">{selectedLog.ipAddress || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="User Agent">
              <TextArea
                value={selectedLog.userAgent || 'N/A'}
                autoSize
                readOnly
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Service Name">{selectedLog.serviceName || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="API Endpoint">{selectedLog.apiEndpoint || 'N/A'}</Descriptions.Item>
            {selectedLog.changedFields && selectedLog.changedFields.length > 0 && (
              <Descriptions.Item label="Changed Fields">
                <Space wrap>
                  {selectedLog.changedFields.map((field) => (
                    <Tag key={field}>{field}</Tag>
                  ))}
                </Space>
              </Descriptions.Item>
            )}
            {selectedLog.oldValues && Object.keys(selectedLog.oldValues).length > 0 && (
              <Descriptions.Item label="Old Values">
                <TextArea
                  value={JSON.stringify(selectedLog.oldValues, null, 2)}
                  autoSize={{ minRows: 3, maxRows: 10 }}
                  readOnly
                  style={{ fontFamily: 'monospace', fontSize: '12px' }}
                />
              </Descriptions.Item>
            )}
            {selectedLog.newValues && Object.keys(selectedLog.newValues).length > 0 && (
              <Descriptions.Item label="New Values">
                <TextArea
                  value={JSON.stringify(selectedLog.newValues, null, 2)}
                  autoSize={{ minRows: 3, maxRows: 10 }}
                  readOnly
                  style={{ fontFamily: 'monospace', fontSize: '12px' }}
                />
              </Descriptions.Item>
            )}
            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <Descriptions.Item label="Metadata">
                <TextArea
                  value={JSON.stringify(selectedLog.metadata, null, 2)}
                  autoSize={{ minRows: 2, maxRows: 6 }}
                  readOnly
                  style={{ fontFamily: 'monospace', fontSize: '12px' }}
                />
              </Descriptions.Item>
            )}
          </Descriptions>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>No data available</div>
        )}
      </Modal>
    </div>
  );
};

export default ActivityLog;
