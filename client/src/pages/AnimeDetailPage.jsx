import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Star, Film, Bookmark, ArrowLeft, Check, Calendar, Tv } from 'lucide-react';
import api from '../api/axiosInstance';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AnimeDetailPage() {
  const { id } = useParams();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Plan to Watch');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/anime/${id}`);
        setAnime(res.data.data);
      } catch (err) {
        console.error('Error fetching anime detail:', err);
        setError('Failed to fetch anime details. Jikan API might be rate-limited.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id]);

  const handleAddToWatchlist = async () => {
    if (!isAuthenticated) return;
    try {
      await api.post('/watchlist', {
        animeId: anime.mal_id,
        title: anime.title,
        imageUrl: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
        status,
        score: anime.score,
        currentEpisode: 0,
        totalEpisodes: anime.episodes || 0,
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingSpinner text="Loading anime details..." />;
  if (error || !anime) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <p className="text-rose-400 text-sm">{error || 'Anime not found'}</p>
        <Link to="/" className="inline-flex items-center gap-2 text-cyan-400 text-xs hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Discover
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link to="/" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" /> Back to Discovery
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Poster & Quick Actions */}
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900">
            <img
              src={anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url}
              alt={anime.title}
              className="w-full object-cover"
            />
          </div>

          {/* Add to Watchlist Widget */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-cyan-400" />
              <span>Personal Watchlist</span>
            </h4>

            {isAuthenticated ? (
              <div className="space-y-2">
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

                <button
                  onClick={handleAddToWatchlist}
                  className="w-full py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Watchlist!</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4" />
                      <span>Save to Watchlist</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-2 space-y-2">
                <p className="text-[11px] text-slate-400">Sign in to add this anime to your personal watchlist.</p>
                <Link
                  to="/login"
                  className="inline-block px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 transition"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Info & Synopsis */}
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
              <span>{anime.type || 'TV'} ({anime.episodes ? `${anime.episodes} eps` : 'Ongoing'})</span>
            </div>

            <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800/80 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <span>{anime.year || anime.season || 'Unknown Year'}</span>
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
        </div>
      </div>
    </div>
  );
}
