import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  InputNumber,
  Row,
  Select,
  Segmented,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import CustomTable from '@components/Table';
import { ReportHeader } from '@components/ReportLayout';
import { projectsService, reportsService } from '@api';
import logger from '@utils/logger';
import { showErrorToast, showSuccessToast } from '@utils/toast.utils';
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
  const now = dayjs();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [salaryByEmployee, setSalaryByEmployee] = useState({});
  const [daysByAllocation, setDaysByAllocation] = useState({});
  const [projectOptions, setProjectOptions] = useState([]);
  const [formulaMode, setFormulaMode] = useState('billing_only');
  const [filters, setFilters] = useState({
    q: '',
    billing_filter: 'all',
    project_ids: [],
    month: now.month() + 1,
    year: now.year(),
  });

  const workingDays = useMemo(
    () => getWorkingDaysInMonth(filters.year, filters.month),
    [filters.year, filters.month]
  );

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

  const fetchProjects = useCallback(async () => {
    try {
      const response = await projectsService.getAll({ page: 1, limit: 300 });
      const projects = parseProjectsFromResponse(response);
      const options = projects.map((project) => ({
        value: project.id,
        label: project.project_name || project.name || `Project ${project.id}`,
      }));
      setProjectOptions(options);
    } catch (err) {
      logger.error('Failed to load project options', err);
    }
  }, []);

  const fetchData = useCallback(async (nextPage = pagination.page, nextLimit = pagination.limit) => {
    try {
      setLoading(true);
      const params = {
        page: nextPage,
        limit: nextLimit,
        billing_filter: filters.billing_filter,
      };
      if (filters.q) params.q = filters.q;
      if (filters.project_ids.length > 0) params.project_ids = filters.project_ids.join(',');

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
  }, [filters, pagination.limit, pagination.page]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchData(1, pagination.limit);
  }, [filters.q, filters.billing_filter, filters.project_ids, fetchData, pagination.limit]);

  const summary = useMemo(() => {
    const totalEmployees = employees.length;
    const totalProjects = employees.reduce((sum, employee) => sum + (employee.allocations || []).length, 0);
    const totalCost = employees.reduce((sum, employee) => sum + getEmployeeTotals(employee).totalCost, 0);
    return { totalEmployees, totalProjects, totalCost };
  }, [employees, getEmployeeTotals]);

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

  const buildCsvRows = useCallback(() => {
    const rows = [
      [
        'Employee ID',
        'Employee Name',
        'Project ID',
        'Project Name',
        'Client Name',
        'Monthly Salary',
        'Working Days (D_ref)',
        'Entered Days',
        'Allocation %',
        'Billing %',
        'Formula Mode',
        'Line Cost',
      ],
    ];

    employees.forEach((employee) => {
      const salary = Number(salaryByEmployee[employee.employee_id] || 0);
      (employee.allocations || []).forEach((allocation) => {
        const enteredDays = Number(daysByAllocation[allocation.allocation_id] || 0);
        const lineCost = getRowCost(employee.employee_id, allocation);
        rows.push([
          employee.employee_id,
          employee.name || '',
          allocation.project_id,
          allocation.project_name || '',
          allocation.client_name || '',
          salary,
          workingDays,
          enteredDays,
          Number(allocation.allocation_percentage || 0),
          Number(allocation.billing_percentage || 0),
          formulaMode,
          lineCost.toFixed(2),
        ]);
      });
    });

    return rows;
  }, [daysByAllocation, employees, formulaMode, getRowCost, salaryByEmployee, workingDays]);

  const handleExportCsv = useCallback(() => {
    const rows = buildCsvRows();
    if (rows.length <= 1) {
      showErrorToast('No allocation rows available for export');
      return;
    }

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = globalThis.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `client_cost_report_${filters.year}_${filters.month}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    globalThis.URL.revokeObjectURL(url);
    showSuccessToast('Client cost CSV exported');
  }, [buildCsvRows, filters.month, filters.year]);

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
            max={31}
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
      <ReportHeader title="CLIENT COST REPORT" />

      <Card className="filters-card">
        <Row gutter={[12, 12]}>
          <Col xs={24} md={7}>
            <Input
              allowClear
              placeholder="Search employee name / email / EPF"
              value={filters.q}
              onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
            />
          </Col>
          <Col xs={24} md={5}>
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
              style={{ width: '100%' }}
              placeholder="Filter by project"
              options={projectOptions}
              value={filters.project_ids}
              onChange={(value) => setFilters((prev) => ({ ...prev, project_ids: value || [] }))}
              maxTagCount={2}
            />
          </Col>
          <Col xs={12} md={2}>
            <InputNumber
              min={1}
              max={12}
              style={{ width: '100%' }}
              value={filters.month}
              onChange={(value) => setFilters((prev) => ({ ...prev, month: value || prev.month }))}
            />
          </Col>
          <Col xs={12} md={3}>
            <InputNumber
              min={2000}
              max={2100}
              style={{ width: '100%' }}
              value={filters.year}
              onChange={(value) => setFilters((prev) => ({ ...prev, year: value || prev.year }))}
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
              <Button onClick={handleExportCsv}>Export CSV</Button>
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

      <Alert
        className="formula-alert"
        type="info"
        showIcon
        message={`Working days (D_ref): ${workingDays}`}
        description={
          formulaMode === 'billing_allocation'
            ? 'Formula: (Monthly Salary / D_ref) x Days x (Billing % / 100) x (Allocation % / 100). Salary is frontend-only and not persisted.'
            : 'Formula: (Monthly Salary / D_ref) x Days x (Billing % / 100). Salary is frontend-only and not persisted.'
        }
      />

      {invalidEmployeeRows.length > 0 && (
        <Alert
          className="validation-alert"
          type="warning"
          showIcon
          message={`Validation warning: ${invalidEmployeeRows.length} employee(s) exceed D_ref`}
          description="Total entered days under an employee are greater than working days for the selected month."
        />
      )}

      <Row gutter={[12, 12]} className="summary-row">
        <Col xs={24} md={8}>
          <Card size="small">
            <Statistic title="Loaded Employees" value={summary.totalEmployees} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small">
            <Statistic title="Allocation Rows" value={summary.totalProjects} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small">
            <Statistic title="Total Cost" value={summary.totalCost} precision={2} />
          </Card>
        </Col>
      </Row>

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
