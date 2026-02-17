/**
 * Routes Configuration
 * All routes with lazy loading for better performance
 */

import React, { lazy } from 'react';

// Lazy load all page components for code splitting
const Login = lazy(() => import('@pages/Auth/Login'));
const ResetPassword = lazy(() => import('@pages/Auth/ResetPassword'));
const Dashboard = lazy(() => import('@pages/Dashboard'));
const Resources = lazy(() => import('@pages/Resources'));
const Projects = lazy(() => import('@pages/Projects'));
const Allocations = lazy(() => import('@pages/Allocations'));
const Billing = lazy(() => import('@pages/Billing'));
const Users = lazy(() => import('@pages/Users'));
const AccountManagerReport = lazy(() => import('@pages/AccountManagerReport'));
const BenchReport = lazy(() => import('@pages/BenchReport'));
const NonBillingReport = lazy(() => import('@pages/NonBillingReport'));
const TierBreakdownReport = lazy(() => import('@pages/TierBreakdownReport'));
const ExceptionAllocationReport = lazy(() => import('@pages/ExceptionAllocationReport'));
const InternReport = lazy(() => import('@pages/InternReport'));
const AllocationHistory = lazy(() => import('@pages/AllocationHistory'));
const TrainingReport = lazy(() => import('@pages/TrainingReport'));
const ExternalConsultantsReport = lazy(() => import('@pages/ExternalConsultantsReport'));
const EmployeeReport = lazy(() => import('@pages/EmployeeReport'));
const MonthlyAllocationReport = lazy(() => import('@pages/MonthlyAllocationReport'));
const PreSaleReport = lazy(() => import('@pages/PreSaleReport'));
const Settings = lazy(() => import('@pages/Settings'));
const Configurations = lazy(() => import('@pages/Configurations'));
const ActivityLog = lazy(() => import('@pages/ActivityLog'));
const SystemUsers = lazy(() => import('@pages/SystemUsers'));

export const routes = [
  {
    path: '/login',
    component: Login,
    isPublic: true,
  },
  {
    path: '/reset-password',
    component: ResetPassword,
    isPublic: true,
  },
  {
    path: '/dashboard',
    component: Dashboard,
    isPrivate: true,
  },
  {
    path: '/account-manager-report',
    component: AccountManagerReport,
    isPrivate: true,
  },
  {
    path: '/bench-report',
    component: BenchReport,
    isPrivate: true,
  },
  {
    path: '/non-billing-report',
    component: NonBillingReport,
    isPrivate: true,
  },
  {
    path: '/tier-breakdown-report',
    component: TierBreakdownReport,
    isPrivate: true,
  },
  {
    path: '/exception-allocation-report',
    component: ExceptionAllocationReport,
    isPrivate: true,
  },
  {
    path: '/intern-report',
    component: InternReport,
    isPrivate: true,
  },
  {
    path: '/allocation-history',
    component: AllocationHistory,
    isPrivate: true,
  },
  {
    path: '/training-report',
    component: TrainingReport,
    isPrivate: true,
  },
  {
    path: '/external-consultants-report',
    component: ExternalConsultantsReport,
    isPrivate: true,
  },
  {
    path: '/employee-report',
    component: EmployeeReport,
    isPrivate: true,
  },
  {
    path: '/monthly-allocation-report',
    component: MonthlyAllocationReport,
    isPrivate: true,
  },
  {
    path: '/presale-report',
    component: PreSaleReport,
    isPrivate: true,
  },
  {
    path: '/resources',
    component: Resources,
    isPrivate: true,
  },
  {
    path: '/projects',
    component: Projects,
    isPrivate: true,
  },
  {
    path: '/allocations',
    component: Allocations,
    isPrivate: true,
  },
  {
    path: '/billing',
    component: Billing,
    isPrivate: true,
  },
  {
    path: '/users',
    component: Users,
    isPrivate: true,
  },
  {
    path: '/settings',
    component: Settings,
    isPrivate: true,
  },
  {
    path: '/configurations',
    component: Configurations,
    isPrivate: true,
  },
  {
    path: '/activity-log',
    component: ActivityLog,
    isPrivate: true,
  },
  {
    path: '/employee-management',
    component: Resources,
    isPrivate: true,
  },
  {
    path: '/system-users',
    component: SystemUsers,
    isPrivate: true,
  },
];
