import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Sparkles,
  Send,
  Star,
  Compass,
  Bot,
  Film,
  Tv,
  Play,
  Bookmark,
  Check,
  Flame,
  Brain,
  Heart,
  Coffee,
  CloudRain,
  Smile,
  Sliders,
  Users,
  User,
  RotateCcw,
  RefreshCw,
  Image as ImageIcon,
  Layers,
  Skull,
} from 'lucide-react';
import {
  generateMoodRecommendations,
  setMoodPrompt,
  setMoodTypeFilter,
  setMoodIntensity,
  setMoodCompanion,
  clearMoodSync,
} from '../store/slices/moodSyncSlice';
import { addWatchlistEntry } from '../store/slices/watchlistSlice';
import LoadingSpinner from '../components/LoadingSpinner';
import { resolveAnimeImage, handleAnimeImageError } from '../utils/imageHelper';

const MOOD_CARDS = [
  {
    id: 'healing',
    title: 'Capek & Pengen Santai',
    subtitle: 'Alur tenang, nyaman ditonton',
    icon: Coffee,
    color: 'from-emerald-500/20 to-teal-500/5 border-emerald-500/30 text-emerald-300',
    prompt:
      'Baru pulang kerja/kuliah capek, pengen tontonan yang alurnya tenang, visualnya enak dilihat, dan tanpa konflik berat.',
  },
  {
    id: 'hype',
    title: 'Butuh Aksi & Tensi Tinggi',
    subtitle: 'Pertarungan seru & tempo cepat',
    icon: Flame,
    color: 'from-amber-500/20 to-orange-500/5 border-amber-500/30 text-amber-300',
    prompt:
      'Lagi pengen nonton anime action dengan koreografi pertarungan yang rapi, musik pengiring seru, dan cerita yang bikin betah maraton.',
  },
  {
    id: 'cathartic',
    title: 'Drama yang Menyentuh',
    subtitle: 'Cerita emosional & berbekas',
    icon: CloudRain,
    color: 'from-sky-500/20 to-blue-500/5 border-sky-500/30 text-sky-300',
    prompt:
      'Lagi suasana malam hening dan galau, pengen nonton film atau anime drama emosional yang sedih dan menyentuh hati.',
  },
  {
    id: 'mystery',
    title: 'Misteri & Adu Strategi',
    subtitle: 'Sci-Fi, investigasi & plot twist',
    icon: Brain,
    color: 'from-purple-500/20 to-indigo-500/5 border-purple-500/30 text-purple-300',
    prompt:
      'Pengen cerita misteri, perjalanan waktu, atau thriller psikologis yang penuh teka-teki dan adu strategi di tiap babak.',
  },
  {
    id: 'comedy',
    title: 'Komedi Buat Hiburan',
    subtitle: 'Ringan, kocak & lepas penat',
    icon: Smile,
    color: 'from-yellow-500/20 to-amber-500/5 border-yellow-500/30 text-yellow-300',
    prompt:
      'Lagi butuh hiburan segar, pengen anime komedi yang karakternya kocak, absurd, dan langsung bikin ketawa ngakak.',
  },
  {
    id: 'romance',
    title: 'Romansa yang Hangat',
    subtitle: 'Interaksi manis & natural',
    icon: Heart,
    color: 'from-rose-500/20 to-pink-500/5 border-rose-500/30 text-rose-300',
    prompt:
      'Pengen tontonan romantis tentang kisah cinta yang manis, chemistry karakter yang gemes, dan bikin senyum sendiri.',
  },
  {
    id: 'horror',
    title: 'Horor & Atmosfer Mencekam',
    subtitle: 'Teror mistis, kutukan & gelap',
    icon: Skull,
    color: 'from-red-500/20 to-rose-900/10 border-red-500/30 text-red-300',
    prompt:
      'Lagi pengen banget nonton anime horror yang serem, punya atmosfer mencekam, kutukan, dan teror supernatural.',
  },
  {
    id: 'fantasy',
    title: 'Petualangan Dunia Fantasi',
    subtitle: 'Dunia sihir & perjalanan jauh',
    icon: Compass,
    color: 'from-cyan-500/20 to-teal-500/5 border-cyan-500/30 text-cyan-300',
    prompt:
      'Pengen ngikutin cerita petualangan di dunia fantasi yang luas, penuh sihir, dan punya pembangunan dunia yang megah.',
  },
];

function getFranchiseStem(rawTitle) {
  if (!rawTitle || typeof rawTitle !== 'string') return '';
  const stem = rawTitle
    .toLowerCase()
    .split(':')[0]
    .split(' - ')[0]
    .replace(/\(.*?\)/g, '')
    .replace(/\b(season|part|cour|stage|movie|film|ova|special|the final|final|chapter|arc)\b.*$/i, '')
    .replace(/\b(\d+(st|nd|rd|th))\b.*$/i, '')
    .replace(/\b(ii|iii|iv|v|vi)\b$/i, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return stem.split(' ').filter(Boolean).slice(0, 3).join(' ');
}

export default function MoodSyncPage() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { items: watchlistItems } = useSelector((state) => state.watchlist);
  const {
    moodPrompt,
    moodTypeFilter,
    moodIntensity,
    moodCompanion,
    moodAnalysis,
    recommendations,
    seenIds,
    seenTitles,
    loading,
    error,
  } = useSelector((state) => state.moodSync);

  const [savedIds, setSavedIds] = useState({});

  const uniqueRecommendations = useMemo(() => {
    const usedIds = new Set();
    const usedStems = new Set();
    const result = [];

    for (const item of recommendations) {
      if (!item || !item.mal_id || usedIds.has(item.mal_id)) continue;
      const stem = getFranchiseStem(item.title);
      if (stem && usedStems.has(stem)) continue;

      usedIds.add(item.mal_id);
      if (stem) usedStems.add(stem);
      result.push(item);
    }
    return result;
  }, [recommendations]);

  const handleRecommend = (customPrompt, excludePreviouslyShown = false) => {
    const query = customPrompt !== undefined ? customPrompt : moodPrompt;
    if (!query.trim()) return;

    const watchlistAnimeIds = (watchlistItems || []).map((w) => w.animeId).filter(Boolean);
    const watchlistTitles = (watchlistItems || []).map((w) => w.title).filter(Boolean);

    const excludeIds = excludePreviouslyShown
      ? Array.from(new Set([...seenIds, ...watchlistAnimeIds]))
      : watchlistAnimeIds;

    const excludeTitles = excludePreviouslyShown
      ? Array.from(new Set([...seenTitles, ...watchlistTitles]))
      : watchlistTitles;

    dispatch(
      generateMoodRecommendations({
        mood: query,
        type: moodTypeFilter,
        intensity: moodIntensity,
        companion: moodCompanion,
        excludeIds,
        excludeTitles,
      })
    );
  };

  const handleQuickSave = async (item) => {
    if (!isAuthenticated) return;
    const payload = {
      animeId: item.mal_id,
      title: item.title,
      imageUrl: resolveAnimeImage(item),
      status: 'Plan to Watch',
      score: item.score || null,
      currentEpisode: 0,
      totalEpisodes: item.episodes || 1,
      genres: item.genres?.map((g) => g.name) || [],
      notes: item.aiReason || 'Disimpan dari rekomendasi MoodSync',
    };
    const res = await dispatch(addWatchlistEntry(payload));
    if (addWatchlistEntry.fulfilled.match(res)) {
      setSavedIds((prev) => ({ ...prev, [item.mal_id]: true }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-10 pb-20">
      {/* ================================================================== */}
      {/* HEADER                                                             */}
      {/* ================================================================== */}
      <div className="text-center space-y-3 sm:space-y-4 relative">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 -z-10 w-full max-w-xl h-48 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-800/50 text-cyan-300 text-xs font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Kurasi Tontonan Sesuai Suasana Hati</span>
        </div>

        <h1 className="text-2xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Lagi Pengen Nonton Apa? <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
            Ceritain Suasana Hati Lo.
          </span>
        </h1>

        <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
          Tulis aja lagi pengen suasana cerita yang kayak gimana, entah itu buat nemenin istirahat malam, butuh tontonan komedi santai, atau pengen cerita misteri yang padat.
        </p>
      </div>

      {/* ================================================================== */}
      {/* INTERACTIVE MOOD TUNING & PROMPT CONSOLE                           */}
      {/* ================================================================== */}
      <div className="rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/90 p-4 sm:p-7 space-y-5 sm:space-y-6 shadow-2xl">
        {/* Top Tuning Controls: Format + Intensity + Companion */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-800/80 pb-5">
          {/* Format Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-cyan-400" /> Format Tontonan
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'Semua', icon: Layers },
                { id: 'movie', label: 'Movie', icon: Film },
                { id: 'tv', label: 'Series', icon: Tv },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => dispatch(setMoodTypeFilter(t.id))}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      moodTypeFilter === t.id
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Emotional Intensity */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-400" /> Bobot Cerita
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'light', label: 'Ringan', icon: Coffee },
                { id: 'balanced', label: 'Seimbang', icon: Compass },
                { id: 'intense', label: 'Serius & Dalam', icon: Flame },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => dispatch(setMoodIntensity(item.id))}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      moodIntensity === item.id
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Watching Companion */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" /> Nonton Bareng
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'solo', label: 'Sendiri', icon: User },
                { id: 'partner', label: 'Pasangan', icon: Heart },
                { id: 'friends', label: 'Teman-teman', icon: Users },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => dispatch(setMoodCompanion(item.id))}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      moodCompanion === item.id
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Flexible Prompt Box (No button overlapping text on mobile) */}
        <div className="rounded-2xl bg-slate-950/90 border border-slate-800 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 transition overflow-hidden">
          <textarea
            value={moodPrompt}
            onChange={(e) => dispatch(setMoodPrompt(e.target.value))}
            rows={3}
            placeholder="Tulis suasana yang lagi lo cari... (Contoh: 'Abis lembur pengen tontonan yang tenang dan visualnya adem' atau 'Lagi pengen anime misteri yang penuh teka-teki')"
            className="w-full p-4 bg-transparent text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none resize-none"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-900/60 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Bisa ditulis pakai Bahasa Indonesia atau Inggris
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {moodPrompt && (
                <button
                  type="button"
                  onClick={() => dispatch(clearMoodSync())}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                  title="Bersihkan"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRecommend(undefined, false)}
                disabled={loading || !moodPrompt.trim()}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black disabled:opacity-40 transition shadow-lg shadow-cyan-500/25 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Cari Rekomendasi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Visual Mood Preset Cards */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Atau Pilih Langsung Suasana di Bawah Ini:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {MOOD_CARDS.map((card) => {
              const Icon = card.icon;
              const isSelected = moodPrompt === card.prompt;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => {
                    dispatch(setMoodPrompt(card.prompt));
                    handleRecommend(card.prompt, false);
                  }}
                  className={`text-left p-3.5 rounded-2xl bg-gradient-to-br border transition cursor-pointer flex items-start gap-3 hover:-translate-y-0.5 ${
                    isSelected
                      ? 'ring-2 ring-cyan-400 border-cyan-400 bg-cyan-950/40'
                      : `${card.color} hover:border-slate-600`
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-xs font-extrabold text-white truncate">{card.title}</h4>
                    <p className="text-[10px] opacity-80 font-medium truncate">{card.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* LOADING & ERROR STATES                                             */}
      {/* ================================================================== */}
      {loading && (
        <LoadingSpinner text="Lagi nyariin daftar tontonan yang paling pas buat lo..." />
      )}

      {error && (
        <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs text-center">
          {error}
        </div>
      )}

      {/* ================================================================== */}
      {/* AI ANALYSIS & PERSONALIZED RECOMMENDATIONS                         */}
      {/* ================================================================== */}
      {moodAnalysis && !loading && (
        <div className="space-y-8 sm:space-y-10">
          {/* Mood Breakdown + Visual Banner */}
          <div className="rounded-3xl overflow-hidden bg-slate-900/90 border border-cyan-800/50 shadow-2xl">
            {moodAnalysis.bannerUrl && (
              <div className="h-44 sm:h-64 w-full overflow-hidden relative bg-slate-950">
                <img
                  src={moodAnalysis.bannerUrl}
                  alt="Mood Visual"
                  className="w-full h-full object-cover opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-950/50 to-transparent" />

                <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 flex flex-wrap items-center gap-2">
                  {moodAnalysis.emotionalTone && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500 text-slate-950 text-[11px] sm:text-xs font-black uppercase tracking-wide shadow-lg">
                      <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                      <span>{moodAnalysis.emotionalTone}</span>
                    </span>
                  )}
                </div>

                <span className="absolute bottom-3 right-3.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/85 border border-slate-700 text-[10px] text-slate-300 font-medium">
                  <ImageIcon className="w-3 h-3 text-cyan-400" />
                  <span>Ilustrasi Suasana</span>
                </span>
              </div>
            )}

            <div className="p-5 sm:p-8 space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-extrabold uppercase tracking-wider">
                  <Bot className="w-4 h-4" />
                  <span>Catatan Kurasi</span>
                </div>
                <p className="text-sm sm:text-lg font-extrabold text-white leading-snug">
                  {moodAnalysis.moodAnalysis}
                </p>
                {moodAnalysis.vibeDescription && (
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {moodAnalysis.vibeDescription}
                  </p>
                )}
              </div>

              {/* Recommended Genres */}
              {moodAnalysis.recommendedGenres?.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Genre Terkait:
                  </span>
                  {moodAnalysis.recommendedGenres.map((g, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-xl bg-cyan-950/90 text-cyan-300 border border-cyan-800/60 text-xs font-bold"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recommendations Grid */}
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-xl font-extrabold text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-cyan-400 shrink-0" />
                  <span>Pilihan Tontonan Buat Lo ({uniqueRecommendations.length} Judul)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Kalau pengen lihat daftar judul yang lain dengan suasana serupa, klik tombol ganti di kanan.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleRecommend(undefined, true)}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-xs font-extrabold text-cyan-300 transition cursor-pointer shadow-md shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ganti Pilihan Lain</span>
              </button>
            </div>

            {uniqueRecommendations.length === 0 ? (
              <p className="text-xs text-slate-500">Belum ada judul yang cocok buat kata kunci tersebut.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {uniqueRecommendations.map((item) => {
                  const isSaved = Boolean(savedIds[item.mal_id]);
                  return (
                    <div
                      key={item.mal_id}
                      className="group rounded-2xl overflow-hidden bg-slate-900/90 border border-slate-800/90 hover:border-cyan-500/60 transition flex flex-col justify-between shadow-xl"
                    >
                      <div>
                        {/* Top Poster & Badges */}
                        <Link to={`/anime/${item.mal_id}`} className="block relative h-52 sm:h-56 overflow-hidden bg-slate-950">
                          <img
                            src={resolveAnimeImage(item)}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            onError={(e) => handleAnimeImageError(e, item)}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-950/30 to-transparent" />

                          {/* Match Score Badge */}
                          <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 text-[11px] font-black shadow-lg">
                            <Sparkles className="w-3 h-3 fill-slate-950" />
                            <span>{item.matchScore || 96}% Cocok</span>
                          </div>

                          {/* MAL Score Badge */}
                          {item.score && (
                            <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-slate-950/90 border border-amber-500/40 text-xs font-extrabold text-amber-300 flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-300" />
                              <span>{item.score}</span>
                            </div>
                          )}

                          {/* Bottom Poster Tag */}
                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-cyan-950/90 border border-cyan-700/60 text-[10px] font-bold text-cyan-300 uppercase truncate">
                              {item.moodTag || item.type || 'Pilihan'}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/85 text-[10px] font-semibold text-slate-300 shrink-0">
                              {item.type === 'Movie' ? (
                                <Film className="w-2.5 h-2.5 text-cyan-400" />
                              ) : (
                                <Tv className="w-2.5 h-2.5 text-cyan-400" />
                              )}
                              <span>
                                {item.type || 'TV'} ({item.episodes ? `${item.episodes} Ep` : 'Movie'})
                              </span>
                            </span>
                          </div>
                        </Link>

                        {/* Title & Curator Note */}
                        <div className="p-4 space-y-3">
                          <Link to={`/anime/${item.mal_id}`}>
                            <h4 className="text-sm sm:text-base font-extrabold text-white line-clamp-1 group-hover:text-cyan-300 transition">
                              {item.title}
                            </h4>
                          </Link>

                          <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-900/40 space-y-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-cyan-400">
                              <Compass className="w-3.5 h-3.5" />
                              <span>Kenapa Pas Ditonton:</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {item.aiReason ||
                                'Suasana cerita dan visualnya sejalan sama yang lagi lo cari sekarang.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="px-4 pb-4 pt-1 flex items-center gap-2">
                        <Link
                          to={`/anime/${item.mal_id}`}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold transition flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-slate-950" />
                          <span>Lihat Detail & Trailer</span>
                        </Link>

                        {isAuthenticated && (
                          <button
                            type="button"
                            onClick={() => handleQuickSave(item)}
                            disabled={isSaved}
                            className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                              isSaved
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40'
                            }`}
                            title="Simpan ke Watchlist"
                          >
                            {isSaved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
