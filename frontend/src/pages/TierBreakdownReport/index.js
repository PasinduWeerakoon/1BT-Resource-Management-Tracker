import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card } from 'antd';
import { Bar } from 'react-chartjs-2';
import { useSelector } from 'react-redux';
import { commonOptions, colors } from '@utils/chartConfig';
import CustomTable from '@components/Table';
import { accountManagersService, projectsService } from '@api';
import { selectTiers, selectTracks } from '@redux/slices/configSlice';
import { useReportFilters } from '@hooks/reports';
import { FilterSection, ReportHeader, SummaryCards } from '@components/ReportLayout';
import TierBreakdownFilters from './components/TierBreakdownFilters';
import { useTierBreakdownData } from './hooks/useTierBreakdownData';
import logger from '@utils/logger';
import '@styles/pages/TierBreakdownReport.scss';

const TierBreakdownReport = () => {
  const defaultFilters = {
    projectName: 'All',
    tier: 'All',
    accountManager: 'All',
    track: 'All',
    techStack: 'All',
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

  // Get configuration data from Redux (cached on login)
  const tracks = useSelector(selectTracks);
  const tiers = useSelector(selectTiers);

  // Filter options for dropdowns
  const [accountManagers, setAccountManagers] = useState([]);
  const [loadingAccountManagers, setLoadingAccountManagers] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [techStacks, setTechStacks] = useState([]);

  // Report data - using custom hook
  const { tierData, employeeData, totalEmployees, loadingReport } = useTierBreakdownData(filters, setTechStacks);

  // Fetch filter options on mount
  useEffect(() => {
    const fetchAccountManagers = async () => {
      try {
        setLoadingAccountManagers(true);
        const response = await accountManagersService.getAll();
        const data = response.data || response || [];
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
            ? data.data
            : [];
        const formatted = list
          .map((am) => ({
            id: am.id,
            name: am.name,
          }))
          .filter((am) => am.id && am.name);
        setAccountManagers(formatted);
      } catch (error) {
        // silent fail; filters remain usable
        logger.error('Failed to fetch account managers', error);
      } finally {
        setLoadingAccountManagers(false);
      }
    };

    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const response = await projectsService.getAll({ limit: 100 });
        let projectsData = [];

        if (response) {
          if (Array.isArray(response.data)) {
            projectsData = response.data;
          } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
            projectsData = response.data.data;
          } else if (response.data && Array.isArray(response.data)) {
            projectsData = response.data;
          }
        }

        const formatted = projectsData
          .map((project) => ({
            id: project.id,
            name: project.project_name || project.name,
          }))
          .filter((project) => project.id && project.name);

        setProjects(formatted);
      } catch (error) {
        logger.error('Failed to fetch projects', error);
      } finally {
        setLoadingProjects(false);
      }
    };

    // Tracks and Tiers are now loaded from Redux (cached on login)
    // No need to fetch them here

    fetchAccountManagers();
    fetchProjects();
  }, []);


  // Employee Details Table Columns
  const employeeColumns = [
    {
      title: 'Employee Name',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 200,
    },
    {
      title: 'Tier',
      dataIndex: 'tier',
      key: 'tier',
      width: 120,
    },
    {
      title: 'Project',
      dataIndex: 'project',
      key: 'project',
      width: 180,
    },
    {
      title: 'Billing Status',
      dataIndex: 'billingStatus',
      key: 'billingStatus',
      width: 150,
    },
    {
      title: 'Billing Percentage',
      dataIndex: 'billingPercentage',
      key: 'billingPercentage',
      width: 160,
    },
    {
      title: 'Project Allocation',
      dataIndex: 'projectAllocation',
      key: 'projectAllocation',
      width: 160,
    },
  ];

  // Chart.js data for bar chart
  const barChartData = {
    labels: tierData.map(item => `Tier ${item.tier}`),
    datasets: [
      {
        label: 'Number of Employees',
        data: tierData.map(item => item.count),
        backgroundColor: colors.primary,
        borderRadius: 4,
      },
    ],
  };

  const barChartOptions = {
    ...commonOptions,
    indexAxis: 'y',
    scales: {
      ...commonOptions.scales,
      x: {
        ...commonOptions.scales.x,
        beginAtZero: true,
        ticks: {
          ...commonOptions.scales.x.ticks,
          stepSize: 5,
        },
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

  return (
    <div className="tier-breakdown-report-page">
      <ReportHeader title="TIER BREAKDOWN REPORT" />

      <FilterSection
        expanded={filtersExpanded}
        onToggle={toggleFiltersExpanded}
        activeFiltersCount={activeFiltersCount}
        onReset={handleResetFilters}
      >
        <TierBreakdownFilters
          filters={filters}
          setFilters={setFilters}
          projects={projects}
          accountManagers={accountManagers}
          tracks={tracks}
          tiers={tiers}
          techStacks={techStacks}
          loadingProjects={loadingProjects}
          loadingAccountManagers={loadingAccountManagers}
        />
      </FilterSection>

      {/* Summary Cards */}
      <SummaryCards cards={[
        { value: totalEmployees, label: 'TOTAL EMPLOYEE' },
      ]} />

      {/* Chart and Table Section */}
      <Row gutter={[16, 16]} className="charts-tables-section">
        {/* Left Column - Tier Chart */}
        <Col xs={24} lg={12}>
          <Card
            className="chart-card"
            title="No Of Employees by Tier"
            loading={loadingReport}
          >
            <div className="chart-container">
              {tierData.length > 0 ? (
                <Bar data={barChartData} options={barChartOptions} />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  No data available
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* Right Column - Employee Details Table */}
        <Col xs={24} lg={12}>
          <Card className="table-card" title="Employee Details" loading={loadingReport}>
            <CustomTable
              columns={employeeColumns}
              dataSource={employeeData}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800, y: 400 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TierBreakdownReport;
