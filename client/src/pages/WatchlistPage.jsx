import { useState, useEffect } from 'react';
import { Bookmark, Star } from 'lucide-react';
import api from '../api/axiosInstance';
import LoadingSpinner from '../components/LoadingSpinner';

const TABS = ['All', 'Plan to Watch', 'Watching', 'Completed', 'On Hold', 'Dropped'];

export default function WatchlistPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWatchlist = async () => {
      setLoading(true);
      try {
        const res = await api.get('/watchlist');
        setItems(res.data.data || []);
      } catch (err) {
        console.error('Error fetching watchlist:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWatchlist();
  }, []);

  const filteredItems = activeTab === 'All'
    ? items
    : items.filter((item) => item.status === activeTab);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-cyan-400">
          <Bookmark className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Library</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Personal Watchlist</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Manage your anime journey, episode counters, and personal scores.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === tab
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Loading watchlist..." />
      ) : filteredItems.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <p className="text-sm text-slate-400">No anime in &quot;{activeTab}&quot; category yet.</p>
          <p className="text-xs text-slate-500">
            Explore anime in Discovery or use MoodSync AI to add titles to your watchlist.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id || item.animeId}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex gap-4 items-center"
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-16 h-22 object-cover rounded-lg shrink-0 bg-slate-950"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="text-xs font-bold text-white truncate">{item.title}</h3>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">
                  {item.status}
                </span>
                <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                  <span>Ep: {item.currentEpisode || 0} / {item.totalEpisodes || '?'}</span>
                  {item.score && (
                    <span className="flex items-center gap-1 text-amber-300">
                      <Star className="w-3 h-3 fill-amber-300" /> {item.score}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
