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
export { getDashboard } from './dashboard.mjs';

// Allocation Reports
export { getAllocationReport, getMonthlyAllocationReport } from './allocation.mjs';

// Resource Reports
export {
    getBenchReport,
    getUtilizationReport,
    getInternReport,
    getExternalConsultantsReport
} from './resource.mjs';

// Account Manager Reports
export { getAccountManagers, getAccountManagerReport } from './accountManager.mjs';

// Employee Reports
export { getEmployeeReport, getExceptionReport } from './employee.mjs';

// Billing Reports
export { getNonBillingReport, getPreSaleReport, getTierBreakdownReport } from './billing.mjs';
