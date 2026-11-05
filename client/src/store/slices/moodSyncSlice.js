import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  moodAnalysis: null,
  recommendations: [],
  lastPrompt: '',
  loading: false,
  error: null,
};

const moodSyncSlice = createSlice({
  name: 'moodSync',
  initialState,
  reducers: {
    setMoodSyncLoading: (state, action) => {
      state.loading = action.payload;
    },
    setMoodSyncResults: (state, action) => {
      state.moodAnalysis = action.payload.moodAnalysis;
      state.recommendations = action.payload.recommendations || [];
      state.lastPrompt = action.payload.lastPrompt || '';
      state.loading = false;
      state.error = null;
    },
    setMoodSyncError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearMoodSync: (state) => {
      state.moodAnalysis = null;
      state.recommendations = [];
      state.lastPrompt = '';
      state.error = null;
    },
  },
});

export const {
  setMoodSyncLoading,
  setMoodSyncResults,
  setMoodSyncError,
  clearMoodSync,
} = moodSyncSlice.actions;

export default moodSyncSlice.reducer;

