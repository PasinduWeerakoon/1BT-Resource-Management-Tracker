import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { storeAuth, clearAuth, getStoredAuth } from '@utils/auth.utils';
import { getUserFromToken } from '@utils/jwt.utils';

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  idToken: null,
  token: null, // For backward compatibility
  isAuthenticated: false,
  role: null,
  logoutLoading: false,
};

// Async thunk for logout API call
// Using dynamic import to avoid circular dependency
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const accessToken = state.auth.accessToken || state.auth.token;
      
      // Call logout API if we have an access token
      // Use dynamic import to avoid circular dependency
      if (accessToken) {
        try {
          const { authService } = await import('@api/services/auth.service');
          await authService.logout(accessToken);
        } catch (error) {
          // Even if API call fails, we still want to logout locally
          console.error('Logout API call failed:', error);
          // Don't throw - we'll still logout locally
        }
      }
      
      // Always return success to proceed with local logout
      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { 
        user, 
        accessToken, 
        refreshToken, 
        idToken, 
        role,
        token // For backward compatibility
      } = action.payload;
      
      state.user = user;
      state.accessToken = accessToken || token;
      state.refreshToken = refreshToken;
      state.idToken = idToken;
      state.token = accessToken || token; // For backward compatibility
      state.role = role;
      state.isAuthenticated = true;
      
      // Store in localStorage using utility function
      storeAuth({
        accessToken: accessToken || token,
        refreshToken,
        idToken,
        user,
        role,
      });
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.idToken = null;
      state.token = null;
      state.role = null;
      state.isAuthenticated = false;
      state.logoutLoading = false;
      
      // Clear from localStorage using utility function
      clearAuth();
    },
    initializeAuth: (state) => {
      const auth = getStoredAuth();
      
      if (auth && (auth.accessToken || auth.token)) {
        state.accessToken = auth.accessToken || auth.token;
        state.refreshToken = auth.refreshToken;
        state.idToken = auth.idToken;
        state.token = auth.accessToken || auth.token; // For backward compatibility
        
        // Decode user info from ID token if available
        if (auth.idToken) {
          const userInfo = getUserFromToken(auth.idToken);
          if (userInfo) {
            state.user = userInfo;
            state.role = userInfo.role || auth.role;
          } else {
            state.user = auth.user;
            state.role = auth.role;
          }
        } else {
          state.user = auth.user;
          state.role = auth.role;
        }
        
        state.isAuthenticated = true;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logoutUser.pending, (state) => {
        state.logoutLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.idToken = null;
        state.token = null;
        state.role = null;
        state.isAuthenticated = false;
        state.logoutLoading = false;
        
        // Clear from localStorage
        clearAuth();
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even if API call fails, logout locally
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.idToken = null;
        state.token = null;
        state.role = null;
        state.isAuthenticated = false;
        state.logoutLoading = false;
        
        // Clear from localStorage
        clearAuth();
      });
  },
});

export const { setCredentials, logout, initializeAuth } = authSlice.actions;
export default authSlice.reducer;
