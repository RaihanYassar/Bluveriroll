import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import animeReducer from './slices/animeSlice';
import watchlistReducer from './slices/watchlistSlice';
import moodSyncReducer from './slices/moodSyncSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    anime: animeReducer,
    watchlist: watchlistReducer,
    moodSync: moodSyncReducer,
  },
});

export default store;

