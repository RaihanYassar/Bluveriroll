import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

export const fetchWatchlist = createAsyncThunk(
  'watchlist/fetchWatchlist',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/watchlist');
      return res.data.data || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load watchlist.');
    }
  }
);

export const addWatchlistEntry = createAsyncThunk(
  'watchlist/addWatchlistEntry',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post('/watchlist', payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add to watchlist.');
    }
  }
);

export const updateWatchlistEntry = createAsyncThunk(
  'watchlist/updateWatchlistEntry',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/watchlist/${id}`, updates);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update watchlist item.');
    }
  }
);

export const deleteWatchlistEntry = createAsyncThunk(
  'watchlist/deleteWatchlistEntry',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/watchlist/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to remove item from watchlist.');
    }
  }
);

const initialState = {
  items: [],
  selectedFilter: 'All', // 'All', 'Plan to Watch', 'Watching', 'Completed', 'On Hold', 'Dropped'
  loading: false,
  actionLoading: false,
  error: null,
};

const watchlistSlice = createSlice({
  name: 'watchlist',
  initialState,
  reducers: {
    setWatchlistFilter: (state, action) => {
      state.selectedFilter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWatchlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWatchlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchWatchlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addWatchlistEntry.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(addWatchlistEntry.fulfilled, (state, action) => {
        state.actionLoading = false;
        const existingIndex = state.items.findIndex((i) => i.id === action.payload.id);
        if (existingIndex !== -1) {
          state.items[existingIndex] = action.payload;
        } else {
          state.items.unshift(action.payload);
        }
      })
      .addCase(addWatchlistEntry.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(updateWatchlistEntry.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteWatchlistEntry.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export const { setWatchlistFilter } = watchlistSlice.actions;
export default watchlistSlice.reducer;

