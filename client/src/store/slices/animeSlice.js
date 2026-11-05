import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  popularAnime: [],
  searchResults: [],
  selectedAnime: null,
  genres: [],
  pagination: {
    currentPage: 1,
    hasNextPage: false,
    lastVisiblePage: 1,
  },
  loading: false,
  error: null,
};

const animeSlice = createSlice({
  name: 'anime',
  initialState,
  reducers: {
    setAnimeLoading: (state, action) => {
      state.loading = action.payload;
    },
    setPopularAnime: (state, action) => {
      state.popularAnime = action.payload.data || [];
      if (action.payload.pagination) {
        state.pagination = {
          currentPage: action.payload.pagination.current_page,
          hasNextPage: action.payload.pagination.has_next_page,
          lastVisiblePage: action.payload.pagination.last_visible_page,
        };
      }
      state.loading = false;
      state.error = null;
    },
    setSearchResults: (state, action) => {
      state.searchResults = action.payload.data || [];
      if (action.payload.pagination) {
        state.pagination = {
          currentPage: action.payload.pagination.current_page,
          hasNextPage: action.payload.pagination.has_next_page,
          lastVisiblePage: action.payload.pagination.last_visible_page,
        };
      }
      state.loading = false;
      state.error = null;
    },
    setSelectedAnime: (state, action) => {
      state.selectedAnime = action.payload;
      state.loading = false;
      state.error = null;
    },
    setGenres: (state, action) => {
      state.genres = action.payload;
    },
    setAnimeError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearSelectedAnime: (state) => {
      state.selectedAnime = null;
    },
  },
});

export const {
  setAnimeLoading,
  setPopularAnime,
  setSearchResults,
  setSelectedAnime,
  setGenres,
  setAnimeError,
  clearSelectedAnime,
} = animeSlice.actions;

export default animeSlice.reducer;

