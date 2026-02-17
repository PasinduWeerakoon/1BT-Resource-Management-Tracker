/**
 * configSlice
 * Redux slice for managing all configuration data from unified /api/v1/configs endpoint
 * These are fetched once on login and cached in Redux, only refetched on CRUD operations
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import logger from '@utils/logger';

// Helper to create initial state for a config type
const createConfigState = () => ({
  data: [],
  loading: false,
  error: null,
  lastFetched: null,
});

const initialState = {
  // Config-based (hardcoded)
  tracks: createConfigState(),
  techStacks: createConfigState(),
  tiers: createConfigState(),
  employeeStatuses: createConfigState(),
  projectStatuses: createConfigState(),
  accountTypes: createConfigState(),
  userRoles: createConfigState(),
  userStatuses: createConfigState(),

  // Database-managed
  designations: createConfigState(),
  billingStatuses: createConfigState(),
  projectTypes: createConfigState(),
  employeeTypes: createConfigState(),
  tags: createConfigState(),
  universities: createConfigState(),
};

// Transform item: label -> name for display consistency
const transformItem = (item) => ({
  ...item,
  name: item.label || item.name,
});

// Async thunk to fetch all configuration data from unified endpoint
export const fetchAllConfigData = createAsyncThunk(
  'config/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      // Use dynamic import to avoid circular dependency
      const { configsService } = await import('@api');
      const response = await configsService.getAll();

      // Extract data from response
      const configs = response?.data?.data || response?.data || {};

      // Transform all config arrays
      return {
        tracks: (configs.tracks || []).map(transformItem),
        techStacks: (configs.techStacks || []).map(transformItem),
        tiers: (configs.tiers || []).map(transformItem),
        employeeStatuses: (configs.employeeStatuses || []).map(transformItem),
        projectStatuses: (configs.projectStatuses || []).map(transformItem),
        accountTypes: (configs.accountTypes || []).map(transformItem),
        userRoles: (configs.userRoles || []).map(transformItem),
        userStatuses: (configs.userStatuses || []).map(transformItem),
        designations: (configs.designations || []).map(transformItem),
        billingStatuses: (configs.billingStatuses || []).map(transformItem),
        projectTypes: (configs.projectTypes || []).map(transformItem),
        employeeTypes: (configs.employeeTypes || []).map(transformItem),
        tags: (configs.tags || []).map(transformItem),
        universities: (configs.universities || []).map(transformItem),
      };
    } catch (error) {
      logger.error('Failed to fetch configuration data:', error);
      return rejectWithValue(error.message || 'Failed to fetch configuration data');
    }
  }
);

// Helper to create async thunk for individual config refetch (after CRUD)
const createConfigFetchThunk = (name, serviceCall) =>
  createAsyncThunk(
    `config/fetch${name.charAt(0).toUpperCase() + name.slice(1)}`,
    async ({ force = false }, { getState, rejectWithValue }) => {
      const state = getState();
      const configState = state.config[name];

      // Only fetch if not loading, no data, or force refresh
      if (!force && configState.data.length > 0 && configState.lastFetched &&
        (Date.now() - configState.lastFetched < 5 * 60 * 1000)) {
        return configState.data; // Return cached data if not forced and recently fetched
      }

      try {
        // Dynamic import to break circular dependency
        const { [serviceCall]: service } = await import('@api');
        const response = await service.getAll();

        // Extract data array
        let items = [];
        if (response && response.data) {
          if (Array.isArray(response.data)) {
            items = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            items = response.data.data;
          }
        }

        return items.map(transformItem);
      } catch (error) {
        logger.error(`Failed to fetch ${name} data:`, error);
        return rejectWithValue(error.message || `Failed to fetch ${name}`);
      }
    }
  );

// Individual fetch thunks for CRUD operations (refetch after create/update/delete)
export const fetchTiersData = createConfigFetchThunk('tiers', 'tiersService');
export const fetchTracksData = createConfigFetchThunk('tracks', 'tracksService');
export const fetchProjectTypesData = createConfigFetchThunk('projectTypes', 'projectTypesService');
export const fetchBillingStatusesData = createConfigFetchThunk('billingStatuses', 'billingStatusesService');
export const fetchTagsData = createConfigFetchThunk('tags', 'tagsService');
export const fetchDesignationsData = createConfigFetchThunk('designations', 'designationsService');

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    // Clear all config data (on logout)
    clearConfigData: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch all config data
    builder
      .addCase(fetchAllConfigData.pending, (state) => {
        // Set loading for all configs
        Object.keys(state).forEach(key => {
          if (state[key] && typeof state[key] === 'object' && 'loading' in state[key]) {
            state[key].loading = true;
            state[key].error = null;
          }
        });
      })
      .addCase(fetchAllConfigData.fulfilled, (state, action) => {
        const now = Date.now();
        // Update all configs with fetched data
        Object.keys(action.payload).forEach(key => {
          if (state[key]) {
            state[key].data = action.payload[key];
            state[key].loading = false;
            state[key].lastFetched = now;
            state[key].error = null;
          }
        });
      })
      .addCase(fetchAllConfigData.rejected, (state, action) => {
        // Set error for all configs
        Object.keys(state).forEach(key => {
          if (state[key] && typeof state[key] === 'object' && 'loading' in state[key]) {
            state[key].loading = false;
            state[key].error = action.payload;
          }
        });
      });

    // Individual fetch handlers for CRUD refetch
    const createFetchHandlers = (name) => {
      builder
        .addCase(createConfigFetchThunk(name, '').pending, (state) => {
          state[name].loading = true;
          state[name].error = null;
        })
        .addCase(createConfigFetchThunk(name, '').fulfilled, (state, action) => {
          state[name].data = action.payload;
          state[name].loading = false;
          state[name].lastFetched = Date.now();
        })
        .addCase(createConfigFetchThunk(name, '').rejected, (state, action) => {
          state[name].loading = false;
          state[name].error = action.payload;
        });
    };

    // Handle fetchTiersData
    builder
      .addCase(fetchTiersData.pending, (state) => { state.tiers.loading = true; state.tiers.error = null; })
      .addCase(fetchTiersData.fulfilled, (state, action) => {
        state.tiers.loading = false;
        state.tiers.data = action.payload;
        state.tiers.lastFetched = Date.now();
      })
      .addCase(fetchTiersData.rejected, (state, action) => { state.tiers.loading = false; state.tiers.error = action.payload; });

    // Handle fetchTracksData
    builder
      .addCase(fetchTracksData.pending, (state) => { state.tracks.loading = true; state.tracks.error = null; })
      .addCase(fetchTracksData.fulfilled, (state, action) => {
        state.tracks.loading = false;
        state.tracks.data = action.payload;
        state.tracks.lastFetched = Date.now();
      })
      .addCase(fetchTracksData.rejected, (state, action) => { state.tracks.loading = false; state.tracks.error = action.payload; });

    // Handle fetchProjectTypesData
    builder
      .addCase(fetchProjectTypesData.pending, (state) => { state.projectTypes.loading = true; state.projectTypes.error = null; })
      .addCase(fetchProjectTypesData.fulfilled, (state, action) => {
        state.projectTypes.loading = false;
        state.projectTypes.data = action.payload;
        state.projectTypes.lastFetched = Date.now();
      })
      .addCase(fetchProjectTypesData.rejected, (state, action) => { state.projectTypes.loading = false; state.projectTypes.error = action.payload; });

    // Handle fetchBillingStatusesData
    builder
      .addCase(fetchBillingStatusesData.pending, (state) => { state.billingStatuses.loading = true; state.billingStatuses.error = null; })
      .addCase(fetchBillingStatusesData.fulfilled, (state, action) => {
        state.billingStatuses.loading = false;
        state.billingStatuses.data = action.payload;
        state.billingStatuses.lastFetched = Date.now();
      })
      .addCase(fetchBillingStatusesData.rejected, (state, action) => { state.billingStatuses.loading = false; state.billingStatuses.error = action.payload; });

    // Handle fetchTagsData
    builder
      .addCase(fetchTagsData.pending, (state) => { state.tags.loading = true; state.tags.error = null; })
      .addCase(fetchTagsData.fulfilled, (state, action) => {
        state.tags.loading = false;
        state.tags.data = action.payload;
        state.tags.lastFetched = Date.now();
      })
      .addCase(fetchTagsData.rejected, (state, action) => { state.tags.loading = false; state.tags.error = action.payload; });

    // Handle fetchDesignationsData
    builder
      .addCase(fetchDesignationsData.pending, (state) => { state.designations.loading = true; state.designations.error = null; })
      .addCase(fetchDesignationsData.fulfilled, (state, action) => {
        state.designations.loading = false;
        state.designations.data = action.payload;
        state.designations.lastFetched = Date.now();
      })
      .addCase(fetchDesignationsData.rejected, (state, action) => { state.designations.loading = false; state.designations.error = action.payload; });

    // Clear config data on logout (using action type string to avoid circular dependency)
    builder
      .addCase('auth/logoutUser/fulfilled', () => initialState)
      .addCase('auth/logoutUser/rejected', () => initialState);
  },
});

export const { clearConfigData } = configSlice.actions;

// Selectors for all config types
export const selectTracks = (state) => state.config.tracks.data;
export const selectTechStacks = (state) => state.config.techStacks.data;
export const selectTiers = (state) => state.config.tiers.data;
export const selectEmployeeStatuses = (state) => state.config.employeeStatuses.data;
export const selectProjectStatuses = (state) => state.config.projectStatuses.data;
export const selectAccountTypes = (state) => state.config.accountTypes.data;
export const selectUserRoles = (state) => state.config.userRoles.data;
export const selectUserStatuses = (state) => state.config.userStatuses.data;
export const selectDesignations = (state) => state.config.designations.data;
export const selectBillingStatuses = (state) => state.config.billingStatuses.data;
export const selectProjectTypes = (state) => state.config.projectTypes.data;
export const selectEmployeeTypes = (state) => state.config.employeeTypes.data;
export const selectTags = (state) => state.config.tags.data;
export const selectUniversities = (state) => state.config.universities.data;

// Loading selectors
export const selectTracksLoading = (state) => state.config.tracks.loading;
export const selectTechStacksLoading = (state) => state.config.techStacks.loading;
export const selectTiersLoading = (state) => state.config.tiers.loading;
export const selectDesignationsLoading = (state) => state.config.designations.loading;
export const selectBillingStatusesLoading = (state) => state.config.billingStatuses.loading;
export const selectProjectTypesLoading = (state) => state.config.projectTypes.loading;
export const selectEmployeeTypesLoading = (state) => state.config.employeeTypes.loading;
export const selectTagsLoading = (state) => state.config.tags.loading;
export const selectUniversitiesLoading = (state) => state.config.universities.loading;

export default configSlice.reducer;
