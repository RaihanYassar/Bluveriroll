import { createSlice } from '@reduxjs/toolkit';

const token = localStorage.getItem('access_token') || null;

const initialState = {
  token,
  user: null,
  isAuthenticated: !!token,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthLoading: (state, action) => {
      state.loading = action.payload;
    },
    setAuthSuccess: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      if (action.payload.token) {
        localStorage.setItem('access_token', action.payload.token);
      }
    },
    setAuthError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setUserProfile: (state, action) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('access_token');
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setAuthLoading,
  setAuthSuccess,
  setAuthError,
  setUserProfile,
  logout,
  clearAuthError,
} = authSlice.actions;

export default authSlice.reducer;

