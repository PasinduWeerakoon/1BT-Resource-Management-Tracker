/**
 * configSlice
 * Redux slice for managing configuration data (tiers, tracks, project types, billing statuses)
 * These are fetched once on login and cached in Redux, only refetched on CRUD operations
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import logger from '@utils/logger';

const initialState = {
  tiers: {
    data: [],
    loading: false,
    error: null,
    lastFetched: null,
  },
  tracks: {
    data: [],
    loading: false,
    error: null,
    lastFetched: null,
  },
  projectTypes: {
    data: [],
    loading: false,
    error: null,
    lastFetched: null,
  },
  billingStatuses: {
    data: [],
    loading: false,
    error: null,
    lastFetched: null,
  },
};

// Transform API response to extract data array
const extractDataArray = (response) => {
  if (!response) return [];
  if (Array.isArray(response.data)) return response.data;
  if (response.data && response.data.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  if (Array.isArray(response)) return response;
  return [];
};

// Transform item: label -> name for display
const transformItem = (item) => ({
  ...item,
  name: item.label || item.name,
});

// Async thunk to fetch all configuration data
export const fetchAllConfigData = createAsyncThunk(
  'config/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      // Use dynamic imports to avoid circular dependency
      const { tiersService, tracksService, projectTypesService, billingStatusesService } = await import('@api');
      
      const [tiersRes, tracksRes, projectTypesRes, billingStatusesRes] = await Promise.all([
        tiersService.getAll(),
        tracksService.getAll(),
        projectTypesService.getAll(),
        billingStatusesService.getAll(),
      ]);

      return {
        tiers: extractDataArray(tiersRes).map(transformItem),
        tracks: extractDataArray(tracksRes).map(transformItem),
        projectTypes: extractDataArray(projectTypesRes).map(transformItem),
        billingStatuses: extractDataArray(billingStatusesRes).map(transformItem),
      };
    } catch (error) {
      logger.error('Failed to fetch configuration data:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to fetch tiers
export const fetchTiers = createAsyncThunk(
  'config/fetchTiers',
  async (_, { rejectWithValue }) => {
    try {
      // Use dynamic import to avoid circular dependency
      const { tiersService } = await import('@api');
      const response = await tiersService.getAll();
      return extractDataArray(response).map(transformItem);
    } catch (error) {
      logger.error('Failed to fetch tiers:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to fetch tracks
export const fetchTracks = createAsyncThunk(
  'config/fetchTracks',
  async (_, { rejectWithValue }) => {
    try {
      // Use dynamic import to avoid circular dependency
      const { tracksService } = await import('@api');
      const response = await tracksService.getAll();
      return extractDataArray(response).map(transformItem);
    } catch (error) {
      logger.error('Failed to fetch tracks:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to fetch project types
export const fetchProjectTypes = createAsyncThunk(
  'config/fetchProjectTypes',
  async (_, { rejectWithValue }) => {
    try {
      // Use dynamic import to avoid circular dependency
      const { projectTypesService } = await import('@api');
      const response = await projectTypesService.getAll();
      return extractDataArray(response).map(transformItem);
    } catch (error) {
      logger.error('Failed to fetch project types:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to fetch billing statuses
export const fetchBillingStatuses = createAsyncThunk(
  'config/fetchBillingStatuses',
  async (_, { rejectWithValue }) => {
    try {
      // Use dynamic import to avoid circular dependency
      const { billingStatusesService } = await import('@api');
      const response = await billingStatusesService.getAll();
      return extractDataArray(response).map(transformItem);
    } catch (error) {
      logger.error('Failed to fetch billing statuses:', error);
      return rejectWithValue(error.message);
    }
  }
);

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    // Clear all config data (on logout)
    clearConfigData: (state) => {
      return initialState;
    },
    // Update tiers data (after create/update/delete)
    updateTiers: (state, action) => {
      state.tiers.data = action.payload;
      state.tiers.lastFetched = Date.now();
    },
    // Update tracks data (after create/update/delete)
    updateTracks: (state, action) => {
      state.tracks.data = action.payload;
      state.tracks.lastFetched = Date.now();
    },
    // Update project types data (after create/update/delete)
    updateProjectTypes: (state, action) => {
      state.projectTypes.data = action.payload;
      state.projectTypes.lastFetched = Date.now();
    },
    // Update billing statuses data (after create/update/delete)
    updateBillingStatuses: (state, action) => {
      state.billingStatuses.data = action.payload;
      state.billingStatuses.lastFetched = Date.now();
    },
  },
  extraReducers: (builder) => {
    // Fetch all config data
    builder
      .addCase(fetchAllConfigData.pending, (state) => {
        state.tiers.loading = true;
        state.tracks.loading = true;
        state.projectTypes.loading = true;
        state.billingStatuses.loading = true;
        state.tiers.error = null;
        state.tracks.error = null;
        state.projectTypes.error = null;
        state.billingStatuses.error = null;
      })
      .addCase(fetchAllConfigData.fulfilled, (state, action) => {
        state.tiers.data = action.payload.tiers;
        state.tiers.loading = false;
        state.tiers.lastFetched = Date.now();
        state.tracks.data = action.payload.tracks;
        state.tracks.loading = false;
        state.tracks.lastFetched = Date.now();
        state.projectTypes.data = action.payload.projectTypes;
        state.projectTypes.loading = false;
        state.projectTypes.lastFetched = Date.now();
        state.billingStatuses.data = action.payload.billingStatuses;
        state.billingStatuses.loading = false;
        state.billingStatuses.lastFetched = Date.now();
      })
      .addCase(fetchAllConfigData.rejected, (state, action) => {
        state.tiers.loading = false;
        state.tiers.error = action.payload;
        state.tracks.loading = false;
        state.tracks.error = action.payload;
        state.projectTypes.loading = false;
        state.projectTypes.error = action.payload;
        state.billingStatuses.loading = false;
        state.billingStatuses.error = action.payload;
      });

    // Fetch tiers
    builder
      .addCase(fetchTiers.pending, (state) => {
        state.tiers.loading = true;
        state.tiers.error = null;
      })
      .addCase(fetchTiers.fulfilled, (state, action) => {
        state.tiers.data = action.payload;
        state.tiers.loading = false;
        state.tiers.lastFetched = Date.now();
      })
      .addCase(fetchTiers.rejected, (state, action) => {
        state.tiers.loading = false;
        state.tiers.error = action.payload;
      });

    // Fetch tracks
    builder
      .addCase(fetchTracks.pending, (state) => {
        state.tracks.loading = true;
        state.tracks.error = null;
      })
      .addCase(fetchTracks.fulfilled, (state, action) => {
        state.tracks.data = action.payload;
        state.tracks.loading = false;
        state.tracks.lastFetched = Date.now();
      })
      .addCase(fetchTracks.rejected, (state, action) => {
        state.tracks.loading = false;
        state.tracks.error = action.payload;
      });

    // Fetch project types
    builder
      .addCase(fetchProjectTypes.pending, (state) => {
        state.projectTypes.loading = true;
        state.projectTypes.error = null;
      })
      .addCase(fetchProjectTypes.fulfilled, (state, action) => {
        state.projectTypes.data = action.payload;
        state.projectTypes.loading = false;
        state.projectTypes.lastFetched = Date.now();
      })
      .addCase(fetchProjectTypes.rejected, (state, action) => {
        state.projectTypes.loading = false;
        state.projectTypes.error = action.payload;
      });

    // Fetch billing statuses
    builder
      .addCase(fetchBillingStatuses.pending, (state) => {
        state.billingStatuses.loading = true;
        state.billingStatuses.error = null;
      })
      .addCase(fetchBillingStatuses.fulfilled, (state, action) => {
        state.billingStatuses.data = action.payload;
        state.billingStatuses.loading = false;
        state.billingStatuses.lastFetched = Date.now();
      })
      .addCase(fetchBillingStatuses.rejected, (state, action) => {
        state.billingStatuses.loading = false;
        state.billingStatuses.error = action.payload;
      });

    // Clear config data on logout (using action type string to avoid circular dependency)
    builder
      .addCase('auth/logoutUser/fulfilled', () => initialState)
      .addCase('auth/logoutUser/rejected', () => initialState);
  },
});

export const {
  clearConfigData,
  updateTiers,
  updateTracks,
  updateProjectTypes,
  updateBillingStatuses,
} = configSlice.actions;

// Selectors
export const selectTiers = (state) => state.config.tiers.data;
export const selectTracks = (state) => state.config.tracks.data;
export const selectProjectTypes = (state) => state.config.projectTypes.data;
export const selectBillingStatuses = (state) => state.config.billingStatuses.data;

export const selectTiersLoading = (state) => state.config.tiers.loading;
export const selectTracksLoading = (state) => state.config.tracks.loading;
export const selectProjectTypesLoading = (state) => state.config.projectTypes.loading;
export const selectBillingStatusesLoading = (state) => state.config.billingStatuses.loading;

export default configSlice.reducer;
