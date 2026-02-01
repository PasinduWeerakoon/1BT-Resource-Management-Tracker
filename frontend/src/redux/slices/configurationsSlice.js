import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk to fetch all configurations
// Using dynamic imports to avoid circular dependency with @api -> client -> store
export const fetchAllConfigurations = createAsyncThunk(
  'configurations/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      // Dynamically import services to break circular dependency
      const {
        projectsService,
        clientsService,
        designationsService,
        tracksService,
        tagsService,
        billingStatusesService,
        projectTypesService,
        accountManagersService,
      } = await import('@api');

      // Fetch all configuration data in parallel
      const [
        projectsResponse,
        clientsResponse,
        designationsResponse,
        tracksResponse,
        tagsResponse,
        billingStatusesResponse,
        projectTypesResponse,
        accountManagersResponse,
      ] = await Promise.allSettled([
        projectsService.getAll({ page: 1, limit: 1000 }),
        clientsService.getAll({ page: 1, limit: 1000 }),
        designationsService.getAll({ page: 1, limit: 1000 }),
        tracksService.getAll({ page: 1, limit: 1000 }),
        tagsService.getAll({ page: 1, limit: 1000 }),
        billingStatusesService.getAll({ page: 1, limit: 1000 }),
        projectTypesService.getAll({ page: 1, limit: 1000 }),
        accountManagersService.getAll(),
      ]);

      // Extract data from responses, handling different response structures
      const extractData = (response) => {
        if (response.status === 'rejected') {
          console.error('Configuration fetch error:', response.reason);
          return [];
        }

        const data = response.value;
        if (!data) return [];

        // Handle different response structures
        if (Array.isArray(data)) {
          return data;
        }
        if (data.data) {
          if (Array.isArray(data.data)) {
            return data.data;
          }
          if (data.data.data && Array.isArray(data.data.data)) {
            return data.data.data;
          }
        }
        return [];
      };

      return {
        projects: extractData(projectsResponse),
        clients: extractData(clientsResponse),
        designations: extractData(designationsResponse),
        tracks: extractData(tracksResponse),
        tags: extractData(tagsResponse),
        billingStatuses: extractData(billingStatusesResponse),
        projectTypes: extractData(projectTypesResponse),
        accountManagers: extractData(accountManagersResponse),
      };
    } catch (error) {
      console.error('Failed to fetch configurations:', error);
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  projects: [],
  clients: [],
  designations: [],
  tracks: [],
  tags: [],
  billingStatuses: [],
  projectTypes: [],
  accountManagers: [],
  loading: false,
  error: null,
  lastFetched: null,
};

const configurationsSlice = createSlice({
  name: 'configurations',
  initialState,
  reducers: {
    clearConfigurations: (state) => {
      state.projects = [];
      state.clients = [];
      state.designations = [];
      state.tracks = [];
      state.tags = [];
      state.billingStatuses = [];
      state.projectTypes = [];
      state.accountManagers = [];
      state.lastFetched = null;
      state.error = null;
    },
    updateProject: (state, action) => {
      const index = state.projects.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = { ...state.projects[index], ...action.payload };
      }
    },
    addProject: (state, action) => {
      state.projects.push(action.payload);
    },
    removeProject: (state, action) => {
      state.projects = state.projects.filter((p) => p.id !== action.payload);
    },
    updateClient: (state, action) => {
      const index = state.clients.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.clients[index] = { ...state.clients[index], ...action.payload };
      }
    },
    addClient: (state, action) => {
      state.clients.push(action.payload);
    },
    removeClient: (state, action) => {
      state.clients = state.clients.filter((c) => c.id !== action.payload);
    },
    updateDesignation: (state, action) => {
      const index = state.designations.findIndex((d) => d.id === action.payload.id);
      if (index !== -1) {
        state.designations[index] = { ...state.designations[index], ...action.payload };
      }
    },
    addDesignation: (state, action) => {
      state.designations.push(action.payload);
    },
    removeDesignation: (state, action) => {
      state.designations = state.designations.filter((d) => d.id !== action.payload);
    },
    updateTrack: (state, action) => {
      const index = state.tracks.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.tracks[index] = { ...state.tracks[index], ...action.payload };
      }
    },
    addTrack: (state, action) => {
      state.tracks.push(action.payload);
    },
    removeTrack: (state, action) => {
      state.tracks = state.tracks.filter((t) => t.id !== action.payload);
    },
    updateTag: (state, action) => {
      const index = state.tags.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.tags[index] = { ...state.tags[index], ...action.payload };
      }
    },
    addTag: (state, action) => {
      state.tags.push(action.payload);
    },
    removeTag: (state, action) => {
      state.tags = state.tags.filter((t) => t.id !== action.payload);
    },
    updateBillingStatus: (state, action) => {
      const index = state.billingStatuses.findIndex((b) => b.id === action.payload.id);
      if (index !== -1) {
        state.billingStatuses[index] = { ...state.billingStatuses[index], ...action.payload };
      }
    },
    addBillingStatus: (state, action) => {
      state.billingStatuses.push(action.payload);
    },
    removeBillingStatus: (state, action) => {
      state.billingStatuses = state.billingStatuses.filter((b) => b.id !== action.payload);
    },
    updateProjectType: (state, action) => {
      const index = state.projectTypes.findIndex((pt) => pt.id === action.payload.id);
      if (index !== -1) {
        state.projectTypes[index] = { ...state.projectTypes[index], ...action.payload };
      }
    },
    addProjectType: (state, action) => {
      state.projectTypes.push(action.payload);
    },
    removeProjectType: (state, action) => {
      state.projectTypes = state.projectTypes.filter((pt) => pt.id !== action.payload);
    },
    updateAccountManager: (state, action) => {
      const index = state.accountManagers.findIndex((am) => am.id === action.payload.id);
      if (index !== -1) {
        state.accountManagers[index] = { ...state.accountManagers[index], ...action.payload };
      }
    },
    addAccountManager: (state, action) => {
      state.accountManagers.push(action.payload);
    },
    removeAccountManager: (state, action) => {
      state.accountManagers = state.accountManagers.filter((am) => am.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllConfigurations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllConfigurations.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.projects = action.payload.projects || [];
        state.clients = action.payload.clients || [];
        state.designations = action.payload.designations || [];
        state.tracks = action.payload.tracks || [];
        state.tags = action.payload.tags || [];
        state.billingStatuses = action.payload.billingStatuses || [];
        state.projectTypes = action.payload.projectTypes || [];
        state.accountManagers = action.payload.accountManagers || [];
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchAllConfigurations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch configurations';
      });
  },
});

export const {
  clearConfigurations,
  updateProject,
  addProject,
  removeProject,
  updateClient,
  addClient,
  removeClient,
  updateDesignation,
  addDesignation,
  removeDesignation,
  updateTrack,
  addTrack,
  removeTrack,
  updateTag,
  addTag,
  removeTag,
  updateBillingStatus,
  addBillingStatus,
  removeBillingStatus,
  updateProjectType,
  addProjectType,
  removeProjectType,
  updateAccountManager,
  addAccountManager,
  removeAccountManager,
} = configurationsSlice.actions;

export default configurationsSlice.reducer;

