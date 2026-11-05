import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Bookmark, Star, Trash2, Plus, Minus, Edit3, Check } from 'lucide-react';
import {
  fetchWatchlist,
  updateWatchlistEntry,
  deleteWatchlistEntry,
  setWatchlistFilter,
} from '../store/slices/watchlistSlice';
import LoadingSpinner from '../components/LoadingSpinner';

const TABS = ['All', 'Plan to Watch', 'Watching', 'Completed', 'On Hold', 'Dropped'];
const STATUS_OPTIONS = ['Plan to Watch', 'Watching', 'Completed', 'On Hold', 'Dropped'];

export default function WatchlistPage() {
  const dispatch = useDispatch();
  const { items, selectedFilter, loading } = useSelector((state) => state.watchlist);
  const [editingId, setEditingId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [scoreDraft, setScoreDraft] = useState('');

  useEffect(() => {
    dispatch(fetchWatchlist());
  }, [dispatch]);

  const filteredItems =
    selectedFilter === 'All'
      ? items
      : items.filter((item) => item.status === selectedFilter);

  const handleStatusChange = (item, newStatus) => {
    const nextEpisode =
      newStatus === 'Completed' && item.totalEpisodes
        ? item.totalEpisodes
        : item.currentEpisode;
    dispatch(
      updateWatchlistEntry({
        id: item.id,
        updates: { status: newStatus, currentEpisode: nextEpisode },
      })
    );
  };

  const handleEpisodeStep = (item, delta) => {
    const nextEp = Math.max(0, (item.currentEpisode || 0) + delta);
    const cappedEp = item.totalEpisodes ? Math.min(nextEp, item.totalEpisodes) : nextEp;
    dispatch(
      updateWatchlistEntry({
        id: item.id,
        updates: { currentEpisode: cappedEp },
      })
    );
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setNoteDraft(item.notes || '');
    setScoreDraft(item.score || '');
  };

  const saveEdit = (id) => {
    dispatch(
      updateWatchlistEntry({
        id,
        updates: {
          notes: noteDraft,
          score: scoreDraft === '' ? null : Number(scoreDraft),
        },
      })
    );
    setEditingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-cyan-400">
          <Bookmark className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Personal Collection</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Personal Watchlist</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Track your movies & series, update episode progress, rate titles, and keep personal notes.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => dispatch(setWatchlistFilter(tab))}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              selectedFilter === tab
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
        <LoadingSpinner text="Loading your watchlist..." />
      ) : filteredItems.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <p className="text-sm text-slate-400">No titles in &quot;{selectedFilter}&quot; category yet.</p>
          <p className="text-xs text-slate-500">
            Explore titles in Discovery or use MoodSync AI to add movies & series to your watchlist.
          </p>
          <Link
            to="/"
            className="inline-block mt-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition"
          >
            Browse Movies & Series
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-4 hover:border-slate-700 transition"
            >
              <div className="flex gap-4">
                <Link to={`/anime/${item.animeId}`} className="shrink-0">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-20 h-28 object-cover rounded-xl bg-slate-950 border border-slate-800"
                  />
                </Link>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={`/anime/${item.animeId}`}
                      className="text-sm font-bold text-white hover:text-cyan-300 truncate block"
                    >
                      {item.title}
                    </Link>
                    <button
                      onClick={() => dispatch(deleteWatchlistEntry(item.id))}
                      className="text-slate-500 hover:text-rose-400 transition p-1 cursor-pointer"
                      title="Remove from Watchlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item, e.target.value)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/40 focus:outline-none cursor-pointer"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st} className="bg-slate-900 text-white">
                        {st}
                      </option>
                    ))}
                  </select>

                  {/* Episode Counter & Score */}
                  <div className="flex items-center justify-between pt-1 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEpisodeStep(item, -1)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                        title="Decrease Episode"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-semibold text-[11px] px-1">
                        Ep {item.currentEpisode || 0} / {item.totalEpisodes || '?'}
                      </span>
                      <button
                        onClick={() => handleEpisodeStep(item, 1)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 cursor-pointer"
                        title="Increment Episode"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {item.score && (
                      <span className="flex items-center gap-1 text-amber-300 font-bold text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-300" /> {item.score}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Review / Notes Section */}
              {editingId === item.id ? (
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-slate-400">Score:</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      step="0.5"
                      value={scoreDraft}
                      onChange={(e) => setScoreDraft(e.target.value)}
                      className="w-20 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-white"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Add your personal review note..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white resize-none"
                  />
                  <button
                    onClick={() => saveEdit(item.id)}
                    className="w-full py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Save Changes
                  </button>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span className="truncate italic">
                    {item.notes ? `"${item.notes}"` : 'No review note added yet.'}
                  </span>
                  <button
                    onClick={() => startEditing(item)}
                    className="inline-flex items-center gap-1 text-cyan-400 hover:underline shrink-0 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

