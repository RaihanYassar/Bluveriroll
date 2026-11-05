import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

export const fetchPopularAnime = createAsyncThunk(
  'anime/fetchPopularAnime',
  async ({ page = 1, limit = 25, type = 'all', filter = '', append = false } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (type && type !== 'all') params.type = type;
      if (filter) params.filter = filter;
      const res = await api.get('/anime/popular', { params });
      return {
        data: res.data.data || [],
        pagination: res.data.pagination || { current_page: page, has_next_page: true },
        append,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load movies & anime from server.');
    }
  }
);

export const searchAnimeCatalog = createAsyncThunk(
  'anime/searchAnimeCatalog',
  async (
    { q = '', type = 'all', genres = '', page = 1, limit = 25, order_by = 'score', sort = 'desc', append = false } = {},
    { rejectWithValue }
  ) => {
    try {
      const params = { page, limit, order_by, sort };
      if (q) params.q = q;
      if (type && type !== 'all') params.type = type;
      if (genres) params.genres = genres;

      const res = await api.get('/anime/search', { params });
      return {
        data: res.data.data || [],
        pagination: res.data.pagination || { current_page: page, has_next_page: false },
        append,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Search failed. Please try again.');
    }
  }
);

export const fetchAnimeDetail = createAsyncThunk(
  'anime/fetchAnimeDetail',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/anime/${id}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch movie/anime details.');
    }
  }
);

export const fetchAnimeEpisodes = createAsyncThunk(
  'anime/fetchAnimeEpisodes',
  async ({ id, page = 1 }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/anime/${id}/episodes`, { params: { page } });
      return {
        data: res.data.data || [],
        pagination: res.data.pagination || { current_page: page, has_next_page: false },
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch episode list.');
    }
  }
);

export const fetchAnimeGenres = createAsyncThunk(
  'anime/fetchAnimeGenres',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/anime/genres');
      return res.data.data || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load genres');
    }
  }
);

function deduplicateByMalId(existingList, newList) {
  const seen = new Set(existingList.map((item) => item.mal_id));
  const merged = [...existingList];
  for (const item of newList) {
    if (!seen.has(item.mal_id)) {
      seen.add(item.mal_id);
      merged.push(item);
    }
  }
  return merged;
}

const initialState = {
  popularList: [],
  searchResults: [],
  isSearchActive: false,
  currentAnime: null,
  episodes: [],
  episodesPagination: { current_page: 1, has_next_page: false },
  episodesLoading: false,
  genres: [],
  activeType: 'all', // 'all', 'movie', 'tv', 'ova', 'special', 'ona'
  activeFilter: '', // '' (Top Score), 'bypopularity', 'airing', 'upcoming', 'favorite'
  selectedGenre: '',
  searchQuery: '',
  currentPage: 1,
  loadedSignature: null,
  hasNextPage: true,
  loading: false,
  loadingMore: false,
  detailLoading: false,
  error: null,
};

const animeSlice = createSlice({
  name: 'anime',
  initialState,
  reducers: {
    setActiveType: (state, action) => {
      state.activeType = action.payload;
      state.currentPage = 1;
    },
    setActiveFilter: (state, action) => {
      state.activeFilter = action.payload;
      state.currentPage = 1;
    },
    setSelectedGenre: (state, action) => {
      state.selectedGenre = action.payload;
      state.currentPage = 1;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    resetSearch: (state) => {
      state.isSearchActive = false;
      state.searchResults = [];
      state.searchQuery = '';
      state.selectedGenre = '';
      state.activeFilter = '';
      state.currentPage = 1;
      state.loadedSignature = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPopularAnime.pending, (state, action) => {
        if (action.meta.arg?.append) {
          state.loadingMore = true;
        } else {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchPopularAnime.fulfilled, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        const resolvedPage = Number(action.meta.arg?.page) || 1;
        state.currentPage = resolvedPage;
        if (action.payload.append) {
          state.popularList = deduplicateByMalId(state.popularList, action.payload.data);
        } else {
          state.popularList = action.payload.data;
        }
        state.hasNextPage = Boolean(action.payload.pagination?.has_next_page);
        state.isSearchActive = false;
        state.loadedSignature = `popular|${state.activeType}|${state.activeFilter}|${resolvedPage}`;
      })
      .addCase(fetchPopularAnime.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.payload;
      })
      .addCase(searchAnimeCatalog.pending, (state, action) => {
        if (action.meta.arg?.append) {
          state.loadingMore = true;
        } else {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(searchAnimeCatalog.fulfilled, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        const resolvedPage = Number(action.meta.arg?.page) || 1;
        state.currentPage = resolvedPage;
        if (action.payload.append) {
          state.searchResults = deduplicateByMalId(state.searchResults, action.payload.data);
        } else {
          state.searchResults = action.payload.data;
        }
        state.hasNextPage = Boolean(action.payload.pagination?.has_next_page);
        state.isSearchActive = true;
        state.loadedSignature = `search|${state.activeType}|${state.selectedGenre}|${state.searchQuery.trim()}|${resolvedPage}`;
      })
      .addCase(searchAnimeCatalog.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.payload;
      })
      .addCase(fetchAnimeDetail.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
        state.currentAnime = null;
      })
      .addCase(fetchAnimeDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.currentAnime = action.payload;
      })
      .addCase(fetchAnimeDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchAnimeEpisodes.pending, (state) => {
        state.episodesLoading = true;
      })
      .addCase(fetchAnimeEpisodes.fulfilled, (state, action) => {
        state.episodesLoading = false;
        state.episodes = action.payload.data;
        state.episodesPagination = action.payload.pagination;
      })
      .addCase(fetchAnimeEpisodes.rejected, (state) => {
        state.episodesLoading = false;
        state.episodes = [];
      })
      .addCase(fetchAnimeGenres.fulfilled, (state, action) => {
        state.genres = action.payload;
      });
  },
});

export const {
  setActiveType,
  setActiveFilter,
  setSelectedGenre,
  setSearchQuery,
  setCurrentPage,
  resetSearch,
} = animeSlice.actions;
export default animeSlice.reducer;
