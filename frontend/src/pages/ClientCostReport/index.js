import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Input,
  InputNumber,
  Row,
  Select,
  Segmented,
  Space,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import CustomTable from '@components/Table';
import { ReportHeader } from '@components/ReportLayout';
import { projectsService, reportsService } from '@api';
import { selectTracks } from '@redux/slices/configSlice';
import logger from '@utils/logger';
import { showErrorToast } from '@utils/toast.utils';
import '@styles/pages/ClientCostReport.scss';

const { Text } = Typography;

const BILLING_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'billing', label: 'Billing' },
  { value: 'non_billing', label: 'Non-Billing' },
];

const FORMULA_MODE_OPTIONS = [
  { label: 'Billing % Only', value: 'billing_only' },
  { label: 'Billing % x Allocation %', value: 'billing_allocation' },
];

const getWorkingDaysInMonth = (year, month) => {
  const start = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
  const daysInMonth = start.daysInMonth();
  let weekdays = 0;

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = dayjs(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    const dayOfWeek = date.day();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      weekdays += 1;
    }
  }

  return weekdays;
};

const parseEmployeesFromResponse = (response) => {
  const payload = response?.data ? response.data : response;
  return payload?.employees || [];
};

const parsePaginationFromResponse = (response) => {
  const payload = response?.data ? response.data : response;
  return payload?.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 };
};

const parseProjectsFromResponse = (response) => {
  const data = response?.data || response;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.data?.data)) return data.data.data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const formatMoney = (value) => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const ClientCostReport = () => {
  const tracksList = useSelector(selectTracks);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [salaryByEmployee, setSalaryByEmployee] = useState({});
  const [daysByAllocation, setDaysByAllocation] = useState({});
  const [projectsCatalog, setProjectsCatalog] = useState([]);
  const [formulaMode, setFormulaMode] = useState('billing_only');
  const [dRefFormulaOpenKeys, setDRefFormulaOpenKeys] = useState([]);
  const [filters, setFilters] = useState({
    q: '',
    billing_filter: 'all',
    project_ids: [],
    track_ids: [],
  });

  // D_ref: weekdays in the current calendar month (updates when the month changes).
  const monthKey = dayjs().format('YYYY-MM');
  const workingDays = useMemo(
    () => getWorkingDaysInMonth(dayjs().year(), dayjs().month() + 1),
    [monthKey]
  );

  const trackOptions = useMemo(
    () =>
      (tracksList || []).map((t) => ({
        value: t.id,
        label: t.name || t.label || `Track ${t.id}`,
      })),
    [tracksList]
  );

  const projectOptions = useMemo(() => {
    const map = new Map();
    projectsCatalog.forEach((p) => {
      const id = p.id;
      if (id == null) return;
      map.set(id, {
        value: id,
        label: p.project_name || p.name || `Project ${id}`,
      });
    });
    employees.forEach((emp) => {
      (emp.allocations || []).forEach((a) => {
        if (a.project_id != null && !map.has(a.project_id)) {
          map.set(a.project_id, {
            value: a.project_id,
            label: a.project_name || `Project ${a.project_id}`,
          });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [projectsCatalog, employees]);

  const getEmployeeDailyRate = useCallback((employeeId) => {
    const salary = Number(salaryByEmployee[employeeId] || 0);
    if (!salary || !workingDays) return 0;
    return salary / workingDays;
  }, [salaryByEmployee, workingDays]);

  const getRowCost = useCallback((employeeId, allocation) => {
    const dailyRate = getEmployeeDailyRate(employeeId);
    const days = Number(daysByAllocation[allocation.allocation_id] || 0);
    const billingPct = Number(allocation.billing_percentage || 0) / 100;
    const allocationPct = Number(allocation.allocation_percentage || 0) / 100;

    if (formulaMode === 'billing_allocation') {
      return dailyRate * days * billingPct * allocationPct;
    }
    return dailyRate * days * billingPct;
  }, [daysByAllocation, formulaMode, getEmployeeDailyRate]);

  const getEmployeeTotals = useCallback((employee) => {
    const totalDays = (employee.allocations || []).reduce(
      (sum, item) => sum + Number(daysByAllocation[item.allocation_id] || 0),
      0
    );
    const totalCost = (employee.allocations || []).reduce(
      (sum, item) => sum + getRowCost(employee.employee_id, item),
      0
    );
    return { totalDays, totalCost };
  }, [daysByAllocation, getRowCost]);

  useEffect(() => {
    let cancelled = false;
    const loadProjects = async () => {
      try {
        const response = await projectsService.getAll({ page: 1, limit: 1000 });
        const projects = parseProjectsFromResponse(response);
        if (!cancelled) {
          setProjectsCatalog(projects);
        }
      } catch (err) {
        logger.error('Failed to load project list for filters', err);
      }
    };
    loadProjects();
    return () => {
      cancelled = true;
    };
  }, []);

  // Do not depend on pagination.page here: when the page changes, this callback must keep the
  // same identity so the "filter changed" effect does not re-run and reset to page 1.
  const fetchData = useCallback(async (nextPage, nextLimit) => {
    const page = nextPage ?? 1;
    const limit = nextLimit ?? pagination.limit;
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        billing_filter: filters.billing_filter,
      };
      if (filters.q) params.q = filters.q;
      if (filters.project_ids.length > 0) params.project_ids = filters.project_ids.join(',');
      if (filters.track_ids.length > 0) params.track_ids = filters.track_ids.join(',');

      const response = await reportsService.getClientCostSnapshot(params);
      setEmployees(parseEmployeesFromResponse(response));
      setPagination(parsePaginationFromResponse(response));
    } catch (err) {
      logger.error('Failed to load client cost snapshot', err);
      showErrorToast('Failed to load client cost data');
      setEmployees([]);
      setPagination((prev) => ({ ...prev, total: 0, totalPages: 1 }));
    } finally {
      setLoading(false);
    }
  }, [filters.billing_filter, filters.project_ids, filters.q, filters.track_ids, pagination.limit]);

  // When filters change, reset to page 1. Omit pagination.limit from deps so changing page size
  // via the table only runs fetch from onChange (avoids double request).
  useEffect(() => {
    fetchData(1, pagination.limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-fetch when filters change
  }, [filters.q, filters.billing_filter, filters.project_ids, filters.track_ids]);

  const invalidEmployeeRows = useMemo(
    () => employees.filter((employee) => getEmployeeTotals(employee).totalDays > workingDays),
    [employees, getEmployeeTotals, workingDays]
  );

  const handleDaysChange = useCallback((allocationId, value) => {
    const normalized = Math.max(0, Math.min(workingDays, Number(value || 0)));
    setDaysByAllocation((prev) => ({
      ...prev,
      [allocationId]: normalized,
    }));
  }, [workingDays]);

  const handleSalaryChange = useCallback((employeeId, value) => {
    const normalized = Math.max(0, Number(value || 0));
    setSalaryByEmployee((prev) => ({
      ...prev,
      [employeeId]: normalized,
    }));
  }, []);

  const employeeColumns = useMemo(() => [
    {
      title: 'Employee',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.name}</Text>
          <Text type="secondary">{record.designation || 'N/A'}</Text>
        </Space>
      ),
    },
    {
      title: 'Track',
      dataIndex: 'track',
      key: 'track',
      width: 140,
      render: (value) => value || 'N/A',
    },
    {
      title: 'Monthly Salary',
      key: 'monthlySalary',
      width: 170,
      render: (_, record) => (
        <InputNumber
          min={0}
          step={1000}
          style={{ width: '100%' }}
          placeholder="Enter salary"
          value={salaryByEmployee[record.employee_id]}
          onChange={(value) => handleSalaryChange(record.employee_id, value)}
        />
      ),
    },
    {
      title: 'Projects',
      key: 'projectCount',
      width: 100,
      render: (_, record) => (record.allocations || []).length,
    },
    {
      title: 'Total Days',
      key: 'totalDays',
      width: 120,
      render: (_, record) => {
        const { totalDays } = getEmployeeTotals(record);
        if (totalDays > workingDays) {
          return <Tag color="error">{totalDays.toFixed(2)}</Tag>;
        }
        return totalDays.toFixed(2);
      },
    },
    {
      title: 'Total Cost',
      key: 'totalCost',
      width: 160,
      render: (_, record) => {
        const { totalCost } = getEmployeeTotals(record);
        return formatMoney(totalCost);
      },
    },
  ], [getEmployeeTotals, handleSalaryChange, salaryByEmployee, workingDays]);

  const expandedRowRender = useCallback((employee) => {
    const columns = [
      {
        title: 'Project',
        dataIndex: 'project_name',
        key: 'project_name',
        width: 220,
      },
      {
        title: 'Client',
        dataIndex: 'client_name',
        key: 'client_name',
        width: 180,
        render: (value) => value || 'N/A',
      },
      {
        title: 'Allocation %',
        dataIndex: 'allocation_percentage',
        key: 'allocation_percentage',
        width: 120,
        render: (value) => `${Number(value || 0).toFixed(2)}%`,
      },
      {
        title: 'Billing %',
        dataIndex: 'billing_percentage',
        key: 'billing_percentage',
        width: 110,
        render: (value) => `${Number(value || 0).toFixed(2)}%`,
      },
      {
        title: 'Billing Type',
        key: 'is_billable',
        width: 130,
        render: (_, record) => (record.is_billable ? <Tag color="green">Billing</Tag> : <Tag>Non-Billing</Tag>),
      },
      {
        title: 'Days',
        key: 'days',
        width: 110,
        render: (_, record) => (
          <InputNumber
            min={0}
            max={workingDays}
            step={0.5}
            style={{ width: '100%' }}
            placeholder="0"
            value={daysByAllocation[record.allocation_id]}
            onChange={(value) => handleDaysChange(record.allocation_id, value)}
          />
        ),
      },
      {
        title: 'Line Cost',
        key: 'line_cost',
        width: 150,
        render: (_, record) => {
          const cost = getRowCost(employee.employee_id, record);
          return formatMoney(cost);
        },
      },
    ];

    return (
      <CustomTable
        columns={columns}
        dataSource={employee.allocations || []}
        pagination={false}
        rowKey="allocation_id"
        size="small"
      />
    );
  }, [daysByAllocation, getRowCost, handleDaysChange, workingDays]);

  return (
    <div className="client-cost-report-page">
      <ReportHeader title="COST REPORT" />

      <Card className="filters-card">
        <Row gutter={[12, 12]}>
          <Col xs={24} md={6}>
            <Input
              allowClear
              placeholder="Search employee name / email / EPF"
              value={filters.q}
              onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
            />
          </Col>
          <Col xs={24} md={4}>
            <Select
              style={{ width: '100%' }}
              options={BILLING_FILTER_OPTIONS}
              value={filters.billing_filter}
              onChange={(value) => setFilters((prev) => ({ ...prev, billing_filter: value }))}
            />
          </Col>
          <Col xs={24} md={7}>
            <Select
              mode="multiple"
              allowClear
              showSearch
              optionFilterProp="label"
              style={{ width: '100%' }}
              placeholder="Filter by project"
              options={projectOptions}
              value={filters.project_ids}
              onChange={(value) => setFilters((prev) => ({ ...prev, project_ids: value || [] }))}
              maxTagCount={2}
            />
          </Col>
          <Col xs={24} md={7}>
            <Select
              mode="multiple"
              allowClear
              showSearch
              optionFilterProp="label"
              style={{ width: '100%' }}
              placeholder="Filter by track (from config)"
              options={trackOptions}
              value={filters.track_ids}
              onChange={(value) => setFilters((prev) => ({ ...prev, track_ids: value || [] }))}
              maxTagCount={2}
            />
          </Col>
        </Row>
        <Row gutter={[12, 12]} className="formula-row">
          <Col xs={24} md={14}>
            <Space direction="vertical" size={2}>
              <Text strong>Cost Formula Mode</Text>
              <Segmented
                options={FORMULA_MODE_OPTIONS}
                value={formulaMode}
                onChange={(value) => setFormulaMode(value)}
              />
            </Space>
          </Col>
          <Col xs={24} md={10} className="filters-actions">
            <Space>
              <Button onClick={() => fetchData(1, pagination.limit)}>Refresh</Button>
              <Button
                onClick={() => {
                  setSalaryByEmployee({});
                  setDaysByAllocation({});
                }}
              >
                Clear Inputs
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Collapse
        bordered={false}
        className="d-ref-formula-collapse"
        activeKey={dRefFormulaOpenKeys}
        onChange={setDRefFormulaOpenKeys}
        expandIconPosition="end"
        size="small"
        items={[
          {
            key: 'dref-formula',
            label: (
              <Space size={8} wrap className="d-ref-formula-collapse__label">
                <Text className="d-ref-formula-collapse__kicker">D_ref</Text>
                <Tag className="d-ref-formula-collapse__value">{workingDays}</Tag>
                <Text type="secondary" className="d-ref-formula-collapse__month">
                  {dayjs().format('MMMM YYYY')}
                </Text>
                <Text type="secondary" className="d-ref-formula-collapse__hint">
                  weekdays · tap to expand
                </Text>
              </Space>
            ),
            children: (
              <div className="d-ref-formula-collapse__body">
                <Text type="secondary" className="d-ref-formula-collapse__line">
                  <Text strong>D_ref</Text> is the weekday count (Mon–Fri) in the current calendar month.
                  Salary is entered in the browser only and is not saved to the server.
                </Text>
                <Text code className="d-ref-formula-collapse__formula">
                  {formulaMode === 'billing_allocation'
                    ? '(Salary / D_ref) × Days × (Billing% / 100) × (Allocation% / 100)'
                    : '(Salary / D_ref) × Days × (Billing% / 100)'}
                </Text>
              </div>
            ),
          },
        ]}
      />

      {invalidEmployeeRows.length > 0 && (
        <Alert
          className="validation-alert"
          type="warning"
          showIcon
          message={`Validation warning: ${invalidEmployeeRows.length} employee(s) exceed D_ref`}
          description="Total entered days under an employee are greater than working days (D_ref) for the current calendar month."
        />
      )}

      <Card
        className="table-card"
        title="Employees and Current Allocations"
        extra={
          <Text type="secondary">Total Employees: {pagination.total}</Text>
        }
      >
        <CustomTable
          columns={employeeColumns}
          dataSource={employees}
          loading={loading}
          rowKey="employee_id"
          expandable={{ expandedRowRender }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (page, pageSize) => fetchData(page, pageSize),
          }}
          scroll={{ x: 1000 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default ClientCostReport;
