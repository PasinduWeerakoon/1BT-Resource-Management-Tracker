import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import layoutReducer from './slices/layoutSlice';
import configurationsReducer from './slices/configurationsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    layout: layoutReducer,
    configurations: configurationsReducer,
  },
});
