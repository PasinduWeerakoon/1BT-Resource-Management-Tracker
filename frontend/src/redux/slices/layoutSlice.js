import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarCollapsed: false,
  isMobile: false,
};

const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
    },
    setMobile: (state, action) => {
      state.isMobile = action.payload;
      if (action.payload) {
        state.sidebarCollapsed = true;
      }
    },
  },
});

export const { toggleSidebar, setSidebarCollapsed, setMobile } = layoutSlice.actions;
export default layoutSlice.reducer;
