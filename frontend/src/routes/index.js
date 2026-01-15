import Login from '@pages/Auth/Login';
import Dashboard from '@pages/Dashboard';
import Resources from '@pages/Resources';
import Projects from '@pages/Projects';
import Allocations from '@pages/Allocations';
import Billing from '@pages/Billing';
import Users from '@pages/Users';
import AccountManagerReport from '@pages/AccountManagerReport';
import BenchReport from '@pages/BenchReport';
import NonBillingReport from '@pages/NonBillingReport';
import TierBreakdownReport from '@pages/TierBreakdownReport';
import ExceptionAllocationReport from '@pages/ExceptionAllocationReport';
import InternReport from '@pages/InternReport';
import AllocationHistory from '@pages/AllocationHistory';
import TrainingReport from '@pages/TrainingReport';
import ExternalConsultantsReport from '@pages/ExternalConsultantsReport';
import EmployeeReport from '@pages/EmployeeReport';
import MonthlyAllocationReport from '@pages/MonthlyAllocationReport';
import PreSaleReport from '@pages/PreSaleReport';

export const routes = [
  {
    path: '/login',
    component: Login,
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
];
