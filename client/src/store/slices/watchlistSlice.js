import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  selectedFilter: 'All', // 'All', 'Plan to Watch', 'Watching', 'Completed', 'On Hold', 'Dropped'
  loading: false,
  error: null,
};

const watchlistSlice = createSlice({
  name: 'watchlist',
  initialState,
  reducers: {
    setWatchlistLoading: (state, action) => {
      state.loading = action.payload;
    },
    setWatchlistItems: (state, action) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    addWatchlistItem: (state, action) => {
      state.items.unshift(action.payload);
    },
    updateWatchlistItem: (state, action) => {
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload };
      }
    },
    removeWatchlistItem: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    setWatchlistFilter: (state, action) => {
      state.selectedFilter = action.payload;
    },
    setWatchlistError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setWatchlistLoading,
  setWatchlistItems,
  addWatchlistItem,
  updateWatchlistItem,
  removeWatchlistItem,
  setWatchlistFilter,
  setWatchlistError,
} = watchlistSlice.actions;

export default watchlistSlice.reducer;

