import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sparkles, Star, TrendingUp, Flame } from 'lucide-react';
import api from '../api/axiosInstance';
import LoadingSpinner from '../components/LoadingSpinner';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [popularAnime, setPopularAnime] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPopular = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/anime/popular?limit=12');
        setPopularAnime(res.data.data || []);
      } catch (err) {
        console.warn('Backend not running or offline:', err.message);
        setError('Backend is connecting or offline. Start the server on port 3000.');
      } finally {
        setLoading(false);
      }
    };
    fetchPopular();
  }, []);

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 text-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/30 via-slate-950 to-slate-950" />
        
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Anime Discovery Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
            Discover Anime. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
              Find Your Next Favorite.
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            BLUVERIROLL matches your current mood, tastes, and watching habits with verified anime recommendations powered by AI and comprehensive watch analytics.
          </p>

          {/* Quick Search Bar */}
          <div className="max-w-xl mx-auto relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search anime by title, genre, or keyword..."
              className="w-full pl-11 pr-28 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm shadow-xl"
            />
            <Search className="w-5 h-5 text-slate-500 absolute left-3.5 pointer-events-none" />
            <button className="absolute right-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition">
              Search
            </button>
          </div>

          {/* Feature Highlights */}
          <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
            <Link
              to="/moodsync"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/40 text-xs font-semibold transition"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Try MoodSync AI</span>
            </Link>
            <Link
              to="/watchlist"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
            >
              <TrendingUp className="w-4 h-4 text-sky-400" />
              <span>Personal Watchlist</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Anime Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">Popular Anime</h2>
          </div>
          <span className="text-xs text-slate-400">Top Rated & Trending</span>
        </div>

        {loading ? (
          <LoadingSpinner text="Fetching popular anime from Jikan..." />
        ) : error ? (
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-400">{error}</p>
            <p className="text-[11px] text-slate-500">Backend API will serve live Jikan data when running.</p>
          </div>
        ) : popularAnime.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
            No anime found. Make sure backend is running to fetch live data.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {popularAnime.map((item) => (
              <Link
                key={item.mal_id}
                to={`/anime/${item.mal_id}`}
                className="group relative rounded-xl overflow-hidden bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/50 transition flex flex-col"
              >
                <div className="aspect-[3/4] overflow-hidden bg-slate-950 relative">
                  <img
                    src={item.images?.jpg?.large_image_url || item.images?.jpg?.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                  {item.score && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-sm border border-slate-700/50 text-[10px] font-bold text-amber-300 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                      <span>{item.score}</span>
                    </div>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <h3 className="text-xs font-semibold text-slate-200 line-clamp-2 group-hover:text-cyan-300 transition">
                    {item.title}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {item.type || 'TV'} • {item.episodes ? `${item.episodes} eps` : 'Ongoing'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

