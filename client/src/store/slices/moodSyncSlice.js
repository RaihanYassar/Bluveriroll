import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

export const generateMoodRecommendations = createAsyncThunk(
  'moodSync/generateMoodRecommendations',
  async (
    { mood, type = 'all', intensity = 'balanced', companion = 'solo', excludeIds = [], excludeTitles = [] },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.post('/moodsync/recommend', {
        mood,
        type,
        intensity,
        companion,
        excludeIds,
        excludeTitles,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to get AI recommendations.');
    }
  }
);

export const fetchProfileAnalytics = createAsyncThunk(
  'moodSync/fetchProfileAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const [dnaRes, journeyRes] = await Promise.all([
        api.get('/profile/dna'),
        api.get('/profile/journey'),
      ]);
      return {
        dna: dnaRes.data.dna,
        journey: journeyRes.data.history || [],
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load profile analytics.');
    }
  }
);

const DESTINED_POOL = [
  { mal_id: 9253, title: 'Steins;Gate', genre: 'Sci-Fi, Suspense', score: 9.07 },
  { mal_id: 33352, title: 'Violet Evergarden', genre: 'Drama, Fantasy', score: 8.68 },
  { mal_id: 19, title: 'Monster', genre: 'Mystery, Psychological', score: 8.88 },
  { mal_id: 34798, title: 'Yuru Camp (Laid-Back Camp)', genre: 'Slice of Life, Healing', score: 8.25 },
  { mal_id: 23273, title: 'Shigatsu wa Kimi no Uso (Your Lie in April)', genre: 'Drama, Romance', score: 8.64 },
  { mal_id: 42310, title: 'Cyberpunk: Edgerunners', genre: 'Sci-Fi, Action', score: 8.61 },
  { mal_id: 20583, title: 'Haikyuu!!', genre: 'Sports, Drama', score: 8.44 },
  { mal_id: 42897, title: 'Horimiya', genre: 'Romance, Comedy', score: 8.19 },
];

function buildLocalTarotFallback({ titles = [], topGenres = [], averageRating = 9.0, totalLogged = 0 }) {
  const mainGenre = topGenres[0] || 'Fantasy';
  const recentGenre = topGenres[1] || mainGenre;
  const oldestTitle = titles[titles.length - 1] || titles[0] || 'Kimi no Na wa.';
  const newestTitle = titles[0] || 'Sousou no Frieren';

  const unwatchedPool = DESTINED_POOL.filter(
    (c) => !titles.some((t) => t.toLowerCase().includes(c.title.toLowerCase().split(' ')[0]))
  );
  const randomIdx = Math.floor(Math.random() * Math.max(unwatchedPool.length, 1));
  const destined = unwatchedPool[randomIdx] || DESTINED_POOL[0];

  return {
    soulArcana: `Arcana XXI - ${mainGenre} Reader`,
    fortuneSummary: `Dirangkum dari ${totalLogged} judul di daftar tontonan lo dengan dominasi genre ${mainGenre} dan ${recentGenre}.`,
    wrappedTagline: `Arcana: ${mainGenre} Reader - Rekomendasi: ${destined.title}`,
    cards: [
      {
        position: 'THE PAST',
        roman: 'I',
        arcanaName: `Akar Cerita ${mainGenre}`,
        subtitle: 'Awal Selera Tontonan',
        linkedTitle: oldestTitle,
        reading: `Selera tontonan lo berawal dari ketertarikan sama elemen ${mainGenre} seperti di "${oldestTitle}". Lo cenderung suka cerita yang punya pembangunan dunia kuat dan karakter yang berkesan.`,
        keyword: `Fondasi: ${mainGenre}`,
      },
      {
        position: 'THE PRESENT',
        roman: 'XIV',
        arcanaName: `Fase ${recentGenre}`,
        subtitle: 'Selera Saat Ini',
        linkedTitle: newestTitle,
        reading: `Lewat catatan terbaru lo di "${newestTitle}" (rata-rata skor ${averageRating}/10), kelihatan kalau sekarang lo lagi seneng nyari cerita yang temponya matang dan punya atmosfer yang khas.`,
        keyword: `Fokus Sekarang: ${recentGenre}`,
      },
      {
        position: 'THE FUTURE',
        roman: 'XXI',
        arcanaName: 'Tontonan Berikutnya',
        subtitle: 'Rekomendasi Paling Pas',
        linkedTitle: destined.title,
        destinedMalId: destined.mal_id,
        destinedScore: destined.score,
        reading: `Melihat perpaduan genre ${mainGenre} dan ${recentGenre} yang paling sering lo tonton, "${destined.title}" (${destined.genre}) pas banget buat masuk antrean tontonan lo berikutnya.`,
        keyword: 'Kecocokan: 98%',
      },
    ],
  };
}

export const generateTarotReading = createAsyncThunk(
  'moodSync/generateTarotReading',
  async ({ fallbackData = {} } = {}) => {
    try {
      const res = await api.post('/profile/tarot', {});
      if (res.data?.tarot?.cards?.length >= 3) {
        return res.data.tarot;
      }
      return buildLocalTarotFallback(fallbackData);
    } catch (_) {
      return buildLocalTarotFallback(fallbackData);
    }
  }
);

const initialState = {
  moodPrompt: '',
  moodTypeFilter: 'all',
  moodIntensity: 'balanced',
  moodCompanion: 'solo',
  moodAnalysis: null,
  recommendations: [],
  seenIds: [],
  seenTitles: [],
  dna: null,
  journey: [],
  tarotReading: null,
  tarotLoading: false,
  loading: false,
  profileLoading: false,
  error: null,
};

const moodSyncSlice = createSlice({
  name: 'moodSync',
  initialState,
  reducers: {
    setMoodPrompt: (state, action) => {
      state.moodPrompt = action.payload;
    },
    setMoodTypeFilter: (state, action) => {
      state.moodTypeFilter = action.payload;
    },
    setMoodIntensity: (state, action) => {
      state.moodIntensity = action.payload;
    },
    setMoodCompanion: (state, action) => {
      state.moodCompanion = action.payload;
    },
    clearMoodSync: (state) => {
      state.moodPrompt = '';
      state.moodAnalysis = null;
      state.recommendations = [];
      state.seenIds = [];
      state.seenTitles = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateMoodRecommendations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateMoodRecommendations.fulfilled, (state, action) => {
        state.loading = false;
        state.moodAnalysis = action.payload.moodAnalysis;
        const recs = action.payload.recommendations || [];
        state.recommendations = recs;
        const newIds = recs.map((r) => r.mal_id).filter(Boolean);
        const newTitles = recs.map((r) => r.title).filter(Boolean);
        state.seenIds = Array.from(new Set([...state.seenIds, ...newIds]));
        state.seenTitles = Array.from(new Set([...state.seenTitles, ...newTitles]));
      })
      .addCase(generateMoodRecommendations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchProfileAnalytics.pending, (state) => {
        state.profileLoading = true;
      })
      .addCase(fetchProfileAnalytics.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.dna = action.payload.dna;
        state.journey = action.payload.journey;
      })
      .addCase(fetchProfileAnalytics.rejected, (state) => {
        state.profileLoading = false;
      })
      .addCase(generateTarotReading.pending, (state) => {
        state.tarotLoading = true;
      })
      .addCase(generateTarotReading.fulfilled, (state, action) => {
        state.tarotLoading = false;
        state.tarotReading = action.payload;
      })
      .addCase(generateTarotReading.rejected, (state) => {
        state.tarotLoading = false;
      });
  },
});

export const {
  setMoodPrompt,
  setMoodTypeFilter,
  setMoodIntensity,
  setMoodCompanion,
  clearMoodSync,
} = moodSyncSlice.actions;
export default moodSyncSlice.reducer;
