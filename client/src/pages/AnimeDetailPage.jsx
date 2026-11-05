import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Star,
  Bookmark,
  ArrowLeft,
  Check,
  Calendar,
  Tv,
  Clock,
  Play,
  Film,
  ExternalLink,
  CheckCircle2,
  ListVideo,
  Sparkles,
} from 'lucide-react';
import { fetchAnimeDetail, fetchAnimeEpisodes } from '../store/slices/animeSlice';
import { addWatchlistEntry } from '../store/slices/watchlistSlice';
import LoadingSpinner from '../components/LoadingSpinner';
import { resolveAnimeImage, handleAnimeImageError } from '../utils/imageHelper';

export default function AnimeDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const {
    currentAnime: anime,
    episodes,
    episodesPagination,
    episodesLoading,
    detailLoading,
    error,
  } = useSelector((state) => state.anime);
  const { actionLoading } = useSelector((state) => state.watchlist);

  const [status, setStatus] = useState('Plan to Watch');
  const [personalScore, setPersonalScore] = useState('');
  const [notes, setNotes] = useState('');
  const [added, setAdded] = useState(false);
  const [episodeSynced, setEpisodeSynced] = useState(false);

  // Video & Episode Player state
  const [playerMode, setPlayerMode] = useState('trailer'); // 'trailer' | 'episode'
  const [selectedEp, setSelectedEp] = useState(1);
  const [epPage, setEpPage] = useState(1);

  useEffect(() => {
    if (id) {
      setSelectedEp(1);
      setEpPage(1);
      setPlayerMode('trailer');
      dispatch(fetchAnimeDetail(id));
      dispatch(fetchAnimeEpisodes({ id, page: 1 }));
    }
  }, [dispatch, id]);

  const handleEpisodePageChange = (newPage) => {
    setEpPage(newPage);
    dispatch(fetchAnimeEpisodes({ id, page: newPage }));
  };

  const handleSelectEpisode = (epNum) => {
    setSelectedEp(epNum);
    setPlayerMode('episode');
  };

  const extractGenres = (animeData) => {
    const raw = [...(animeData?.genres || []), ...(animeData?.themes || [])];
    return Array.from(
      new Set(raw.map((g) => (typeof g === 'string' ? g.trim() : g?.name?.trim())).filter(Boolean))
    );
  };

  const handleAddToWatchlist = async () => {
    if (!isAuthenticated || !anime) return;
    const payload = {
      animeId: anime.mal_id,
      title: anime.title,
      imageUrl: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
      status,
      score: personalScore ? Number(personalScore) : anime.score || null,
      currentEpisode: status === 'Completed' ? anime.episodes || 1 : selectedEp || 0,
      totalEpisodes: anime.episodes || 1,
      genres: extractGenres(anime),
      notes: notes.trim() || null,
    };

    const resultAction = await dispatch(addWatchlistEntry(payload));
    if (addWatchlistEntry.fulfilled.match(resultAction)) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    }
  };

  const handleMarkEpisodeWatched = async (epNumber) => {
    if (!isAuthenticated || !anime) return;
    const totalEps = anime.episodes || 1;
    const newStatus = epNumber >= totalEps ? 'Completed' : 'Watching';
    setStatus(newStatus);
    const payload = {
      animeId: anime.mal_id,
      title: anime.title,
      imageUrl: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
      status: newStatus,
      score: personalScore ? Number(personalScore) : anime.score || null,
      currentEpisode: epNumber,
      totalEpisodes: totalEps,
      genres: extractGenres(anime),
      notes: notes.trim() || `Watched up to Episode ${epNumber}`,
    };

    const resultAction = await dispatch(addWatchlistEntry(payload));
    if (addWatchlistEntry.fulfilled.match(resultAction)) {
      setEpisodeSynced(true);
      setTimeout(() => setEpisodeSynced(false), 2500);
    }
  };

  if (detailLoading) return <LoadingSpinner text="Loading movie/anime details & episode stream..." />;
  if (error || !anime) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <p className="text-rose-400 text-sm">{error || 'Title not found'}</p>
        <Link to="/" className="inline-flex items-center gap-2 text-cyan-400 text-xs hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Discovery
        </Link>
      </div>
    );
  }

  const currentEpObj =
    episodes.find((ep) => ep.mal_id === selectedEp) || {
      mal_id: selectedEp,
      title: anime.type === 'Movie' ? `${anime.title} (Full Movie)` : `Episode ${selectedEp}`,
    };

  const trailerEmbedUrl = anime.trailer?.embed_url || null;
  const epSearchQuery = encodeURIComponent(
    anime.type === 'Movie'
      ? `${anime.title} full movie sub indo`
      : `${anime.title} episode ${selectedEp} sub indo`
  );

  const episodeStreamProviders = [
    {
      name: 'YouTube (Muse ID / Ani-One)',
      url: `https://www.youtube.com/results?search_query=${epSearchQuery}`,
      badge: 'Free Legal HD',
      color: 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25',
    },
    {
      name: 'Bstation (Bilibili)',
      url: `https://www.bilibili.tv/id/search-result?q=${encodeURIComponent(`${anime.title} episode ${selectedEp}`)}`,
      badge: 'Sub Indo',
      color: 'bg-sky-500/15 border-sky-500/40 text-sky-300 hover:bg-sky-500/25',
    },
    {
      name: 'Crunchyroll',
      url: `https://www.crunchyroll.com/search?q=${encodeURIComponent(anime.title)}`,
      badge: 'Simulcast',
      color: 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25',
    },
    {
      name: 'iQIYI Anime',
      url: `https://www.iq.com/search?query=${encodeURIComponent(anime.title)}`,
      badge: '1080p Stream',
      color: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25',
    },
    {
      name: 'Netflix',
      url: `https://www.netflix.com/search?q=${encodeURIComponent(anime.title)}`,
      badge: 'Official',
      color: 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <Link to="/" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" /> Back to Discovery Catalog
      </Link>

      {/* Top Info & Watchlist Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Poster & Watchlist Action Card */}
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900">
            <img
              src={resolveAnimeImage(anime)}
              alt={anime.title}
              referrerPolicy="no-referrer"
              onError={(e) => handleAnimeImageError(e, anime)}
              className="w-full object-cover"
            />
          </div>

          {/* Add to Watchlist Widget */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-cyan-400" />
              <span>Add to Personal Watchlist</span>
            </h4>

            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Watch Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Plan to Watch">Plan to Watch</option>
                    <option value="Watching">Watching</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Dropped">Dropped</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Your Score (1 - 10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    value={personalScore}
                    onChange={(e) => setPersonalScore(e.target.value)}
                    placeholder={`Default: ${anime.score || '9.0'}`}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Personal Review / Notes</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Write your thoughts or favorite episode..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>

                <button
                  onClick={handleAddToWatchlist}
                  disabled={actionLoading}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Saved to Watchlist!</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4" />
                      <span>{actionLoading ? 'Saving...' : 'Save to Watchlist'}</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-2 space-y-2">
                <p className="text-[11px] text-slate-400">Sign in to save this title & track watched episodes.</p>
                <Link
                  to="/login"
                  className="inline-block px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 transition"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Info, Synopsis & Cinema Video Player */}
        <div className="md:col-span-2 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">{anime.title}</h1>
            {anime.title_japanese && (
              <p className="text-xs text-slate-400 font-medium">{anime.title_japanese}</p>
            )}
          </div>

          {/* Quick Badges */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {anime.score && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-300" />
                <span>{anime.score} / 10</span>
              </div>
            )}

            <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800/80 text-slate-300">
              <Tv className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {anime.type || 'TV'} ({anime.episodes ? `${anime.episodes} eps` : 'Ongoing / Movie'})
              </span>
            </div>

            {anime.duration && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800/80 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{anime.duration}</span>
              </div>
            )}

            <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800/80 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <span>{anime.year || anime.status || 'Released'}</span>
            </div>
          </div>

          {/* Genres */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Genres</h3>
            <div className="flex flex-wrap gap-1.5">
              {anime.genres?.map((g) => (
                <span
                  key={g.mal_id}
                  className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-cyan-300"
                >
                  {g.name}
                </span>
              ))}
            </div>
          </div>

          {/* Synopsis */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Synopsis</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed whitespace-pre-line">
              {anime.synopsis || 'No synopsis provided.'}
            </p>
          </div>

          {/* ============================================================== */}
          {/* CINEMA VIDEO & EPISODE STREAMING HUB                           */}
          {/* ============================================================== */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-2xl space-y-0">
            {/* Player Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3.5 bg-slate-950/90 border-b border-slate-800">
              <div className="flex items-center gap-2 min-w-0">
                <Play className="w-4 h-4 text-cyan-400 fill-cyan-400 shrink-0" />
                <span className="text-xs font-bold text-white truncate">
                  {playerMode === 'trailer'
                    ? `${anime.title} (Official Trailer)`
                    : `Episode ${selectedEp}: ${currentEpObj.title}`}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setPlayerMode('trailer')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    playerMode === 'trailer'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span className="inline-flex items-center justify-center gap-1">
                    <Film className="w-3 h-3" /> Official Trailer
                  </span>
                </button>
                <button
                  onClick={() => setPlayerMode('episode')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    playerMode === 'episode'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span className="inline-flex items-center justify-center gap-1">
                    <ListVideo className="w-3 h-3" /> Watch Episode {selectedEp}
                  </span>
                </button>
              </div>
            </div>

            {/* Video Screen Area */}
            {playerMode === 'trailer' && trailerEmbedUrl ? (
              <div className="aspect-video w-full bg-black relative">
                <iframe
                  src={trailerEmbedUrl}
                  title={`${anime.title} Trailer`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/30 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-bold text-cyan-300 uppercase">
                      <Sparkles className="w-3 h-3" /> Episode {selectedEp} Stream Hub
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-white">
                      Ep {selectedEp}: {currentEpObj.title}
                    </h3>
                    {currentEpObj.title_japanese && (
                      <p className="text-xs text-slate-400">{currentEpObj.title_japanese}</p>
                    )}
                  </div>

                  {isAuthenticated && (
                    <button
                      onClick={() => handleMarkEpisodeWatched(selectedEp)}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition cursor-pointer shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {episodeSynced
                          ? `Ep ${selectedEp} Saved to Watchlist!`
                          : `Mark Ep ${selectedEp} as Watched`}
                      </span>
                    </button>
                  )}
                </div>

                {/* If trailer exists, allow previewing while choosing episode */}
                {trailerEmbedUrl && (
                  <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-800 bg-black">
                    <iframe
                      src={trailerEmbedUrl}
                      title={`${anime.title} Episode ${selectedEp} Preview`}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                {/* Direct Episode Streaming Links */}
                <div className="space-y-2.5">
                  <p className="text-xs font-semibold text-slate-300">
                    Stream <span className="text-cyan-300 font-bold">{anime.title} (Episode {selectedEp})</span> on official platforms:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {episodeStreamProviders.map((provider) => (
                      <a
                        key={provider.name}
                        href={provider.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-bold transition ${provider.color}`}
                      >
                        <div className="flex flex-col">
                          <span>{provider.name}</span>
                          <span className="text-[10px] opacity-75 font-normal">
                            {provider.badge} (Ep {selectedEp})
                          </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Episode List Selector Grid */}
            <div className="p-5 bg-slate-950/60 border-t border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ListVideo className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Episodes List ({episodes.length} Loaded)
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400">
                  Click any episode to stream or track watch progress
                </span>
              </div>

              {episodesLoading ? (
                <p className="text-xs text-slate-400 py-4 text-center">Loading episode list from Jikan API...</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
                    {episodes.map((ep) => {
                      const isSelected = selectedEp === ep.mal_id;
                      return (
                        <button
                          key={ep.mal_id}
                          onClick={() => handleSelectEpisode(ep.mal_id)}
                          className={`text-left p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-1 ${
                            isSelected
                              ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/10'
                              : 'bg-slate-900/90 border-slate-800/90 text-slate-300 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-extrabold text-cyan-400">
                              EP {ep.mal_id}
                            </span>
                            {ep.filler && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                                Filler
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-medium line-clamp-1">{ep.title}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Episode Pagination for long-running anime (100+ eps) */}
                  {(epPage > 1 || episodesPagination?.has_next_page) && (
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => handleEpisodePageChange(epPage - 1)}
                        disabled={epPage <= 1}
                        className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 disabled:opacity-40 cursor-pointer"
                      >
                        Prev 100 Eps
                      </button>
                      <span className="text-[11px] text-slate-400">Batch {epPage}</span>
                      <button
                        onClick={() => handleEpisodePageChange(epPage + 1)}
                        disabled={!episodesPagination?.has_next_page}
                        className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 disabled:opacity-40 cursor-pointer"
                      >
                        Next 100 Eps
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
