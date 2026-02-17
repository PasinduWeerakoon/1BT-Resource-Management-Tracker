/**
 * uiSlice
 * UI state management (modals, sidebars, notifications, etc.)
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Modal states
  modals: {
    // Resource modals
    addResourceModal: false,
    editResourceModal: false,
    resourceProfileModal: false,
    // Project modals
    addProjectModal: false,
    editProjectModal: false,
    // Configuration modals
    addConfigurationModal: false,
    editConfigurationModal: false,
    // Allocation modals
    addAllocationModal: false,
    editAllocationModal: false,
    // Team member modals
    addTeamMemberModal: false,
    // User allocation modals
    userAllocationModal: false,
    // Resource allocation modals
    resourceAllocationModal: false,
  },
  // Sidebar state (can be moved from layoutSlice if needed)
  sidebar: {
    collapsed: false,
  },
  // Notification state
  notifications: {
    queue: [],
    maxVisible: 5,
  },
  // Loading states for different sections
  loading: {
    global: false,
    resources: false,
    projects: false,
    allocations: false,
    reports: false,
  },
  // Drawer states
  drawers: {
    filters: false,
    settings: false,
  },
  // Toast notifications queue
  toasts: {
    queue: [],
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Modal actions
    openModal: (state, action) => {
      const { modalName } = action.payload;
      if (state.modals[modalName] !== undefined) {
        state.modals[modalName] = true;
      }
    },
    closeModal: (state, action) => {
      const { modalName } = action.payload;
      if (state.modals[modalName] !== undefined) {
        state.modals[modalName] = false;
      }
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach((key) => {
        state.modals[key] = false;
      });
    },
    // Sidebar actions
    toggleSidebar: (state) => {
      state.sidebar.collapsed = !state.sidebar.collapsed;
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebar.collapsed = action.payload;
    },
    // Loading actions
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload;
    },
    setResourceLoading: (state, action) => {
      state.loading.resources = action.payload;
    },
    setProjectLoading: (state, action) => {
      state.loading.projects = action.payload;
    },
    setAllocationLoading: (state, action) => {
      state.loading.allocations = action.payload;
    },
    setReportLoading: (state, action) => {
      state.loading.reports = action.payload;
    },
    // Drawer actions
    openDrawer: (state, action) => {
      const { drawerName } = action.payload;
      if (state.drawers[drawerName] !== undefined) {
        state.drawers[drawerName] = true;
      }
    },
    closeDrawer: (state, action) => {
      const { drawerName } = action.payload;
      if (state.drawers[drawerName] !== undefined) {
        state.drawers[drawerName] = false;
      }
    },
    // Notification actions
    addNotification: (state, action) => {
      const notification = {
        id: Date.now(),
        ...action.payload,
      };
      state.notifications.queue.push(notification);
      // Keep only maxVisible notifications
      if (state.notifications.queue.length > state.notifications.maxVisible) {
        state.notifications.queue.shift();
      }
    },
    removeNotification: (state, action) => {
      const { id } = action.payload;
      state.notifications.queue = state.notifications.queue.filter(
        (n) => n.id !== id
      );
    },
    clearNotifications: (state) => {
      state.notifications.queue = [];
    },
  },
});

export const {
  openModal,
  closeModal,
  closeAllModals,
  toggleSidebar,
  setSidebarCollapsed,
  setGlobalLoading,
  setResourceLoading,
  setProjectLoading,
  setAllocationLoading,
  setReportLoading,
  openDrawer,
  closeDrawer,
  addNotification,
  removeNotification,
  clearNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;
