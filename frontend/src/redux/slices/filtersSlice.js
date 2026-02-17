/**
 * filtersSlice
 * Global filter state management
 * Used for sharing filter state across multiple pages if needed
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Resource/Employee filters
  resources: {
    tier: 'All',
    status: 'All',
    employeeNumber: '',
    name: '',
    track_id: undefined,
    designation_id: undefined,
  },
  // Account Manager Report filters
  accountManagerReport: {
    accountManager: 'All',
    projectName: 'All',
    projectStatus: 'Active',
    allocationStatus: 'Active',
    clientName: 'All',
    billingStatus: 'All',
  },
  // Dashboard filters (if any)
  dashboard: {},
  // Generic filters for other pages
  generic: {},
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setResourceFilters: (state, action) => {
      state.resources = { ...state.resources, ...action.payload };
    },
    resetResourceFilters: (state) => {
      state.resources = initialState.resources;
    },
    setAccountManagerReportFilters: (state, action) => {
      state.accountManagerReport = { ...state.accountManagerReport, ...action.payload };
    },
    resetAccountManagerReportFilters: (state) => {
      state.accountManagerReport = initialState.accountManagerReport;
    },
    setDashboardFilters: (state, action) => {
      state.dashboard = { ...state.dashboard, ...action.payload };
    },
    resetDashboardFilters: (state) => {
      state.dashboard = initialState.dashboard;
    },
    setGenericFilters: (state, action) => {
      const { key, filters } = action.payload;
      state.generic[key] = { ...state.generic[key], ...filters };
    },
    resetGenericFilters: (state, action) => {
      const { key } = action.payload;
      if (state.generic[key]) {
        delete state.generic[key];
      }
    },
    resetAllFilters: (state) => {
      return initialState;
    },
  },
});

export const {
  setResourceFilters,
  resetResourceFilters,
  setAccountManagerReportFilters,
  resetAccountManagerReportFilters,
  setDashboardFilters,
  resetDashboardFilters,
  setGenericFilters,
  resetGenericFilters,
  resetAllFilters,
} = filtersSlice.actions;

export default filtersSlice.reducer;
