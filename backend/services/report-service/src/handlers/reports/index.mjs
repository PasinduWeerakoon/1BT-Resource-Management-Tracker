/**
 * Reports Handlers Index
 * 
 * Re-exports all report handlers for serverless.yml compatibility.
 * This allows the serverless config to reference handlers as:
 *   src/handlers/reports.getDashboard
 * which resolves to:
 *   src/handlers/reports/index.js -> getDashboard
 */

// Dashboard
export {
    getDashboardResourceCounts,
    getDashboardPercentages,
    getDashboardCharts
} from './dashboard.mjs';

// Allocation Reports
export { getMonthlyAllocationReport } from './allocation.mjs';

// Resource Reports
export {
    getBenchReport,
    getInternReport,
    getExternalConsultantsReport,
    getTrainingReport
} from './resource.mjs';

// Account Manager Reports
export { getAccountManagers, getAccountManagerReport } from './accountManager.mjs';

// Employee Reports
export { getEmployeeReport, getExceptionReport } from './employee.mjs';

// Billing Reports
export { getNonBillingReport, getPreSaleReport, getTierBreakdownReport } from './billing.mjs';
