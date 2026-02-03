import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import layoutReducer from './slices/layoutSlice';
import filtersReducer from './slices/filtersSlice';
import uiReducer from './slices/uiSlice';
import cacheReducer from './slices/cacheSlice';
import configReducer from './slices/configSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    layout: layoutReducer,
    filters: filtersReducer,
    ui: uiReducer,
    cache: cacheReducer,
    config: configReducer,
  },
  // Enable Redux DevTools in development
  devTools: process.env.NODE_ENV !== 'production',
});
