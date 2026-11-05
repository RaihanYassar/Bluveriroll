import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Send, Star, Compass, Bot } from 'lucide-react';
import api from '../api/axiosInstance';
import LoadingSpinner from '../components/LoadingSpinner';

const MOOD_SUGGESTIONS = [
  'Feeling stressed and want a wholesome slice-of-life to unwind',
  'Need high octane hype and epic battle shonen',
  'Melancholic late night longing for deep psychological mystery',
  'Want a funny rom-com with enemies-to-lovers dynamic',
  'Rainy day cyberpunk dystopian adventure'
];

export default function MoodSyncPage() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRecommend = async (queryToUse) => {
    const q = queryToUse || prompt;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/moodsync/recommend', { mood: q });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get recommendations. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>MoodSync AI Engine</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Anime Recommendations by Vibe
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto">
          Tell us how you feel or what aesthetic you crave. MoodSync AI will translate your mood into verified anime picks.
        </p>
      </div>

      {/* Input box */}
      <div className="space-y-4">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="e.g. I had an exhausting week at work and just want something heartwarming with cute characters cooking or relaxing..."
            className="w-full p-4 pr-14 rounded-2xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 resize-none shadow-xl"
          />
          <button
            onClick={() => handleRecommend()}
            disabled={loading || !prompt.trim()}
            className="absolute bottom-4 right-4 p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 hover:brightness-110 text-white disabled:opacity-40 transition shadow-lg shadow-cyan-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Quick prompt chips */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Try an inspiration:</span>
          <div className="flex flex-wrap gap-2">
            {MOOD_SUGGESTIONS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(item);
                  handleRecommend(item);
                }}
                className="text-[11px] px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800/80 text-slate-400 hover:text-cyan-300 hover:border-cyan-800/60 transition text-left"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && <LoadingSpinner text="MoodSync AI is analyzing your mood and querying Jikan database..." />}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs text-center">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* AI Mood Breakdown Card */}
          {result.moodAnalysis && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-cyan-950/30 border border-cyan-800/40 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <Bot className="w-4 h-4" />
                <span>AI Mood Analysis</span>
              </div>
              <p className="text-sm font-semibold text-white">
                {result.moodAnalysis.moodAnalysis}
              </p>
              {result.moodAnalysis.vibeDescription && (
                <p className="text-xs text-slate-300 leading-relaxed">
                  {result.moodAnalysis.vibeDescription}
                </p>
              )}
            </div>
          )}

          {/* Anime Grid */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Matching Anime Recommendations</span>
            </h3>

            {result.recommendations?.length === 0 ? (
              <p className="text-xs text-slate-500">No matching anime found for this mood query.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {result.recommendations?.map((item) => (
                  <Link
                    key={item.mal_id}
                    to={`/anime/${item.mal_id}`}
                    className="group rounded-xl overflow-hidden bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition flex flex-col"
                  >
                    <div className="aspect-[3/4] overflow-hidden bg-slate-950 relative">
                      <img
                        src={item.images?.jpg?.large_image_url || item.images?.jpg?.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                        loading="lazy"
                      />
                      {item.score && (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-slate-950/80 text-[10px] font-bold text-amber-300 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-300" />
                          <span>{item.score}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 flex-1 flex flex-col justify-between">
                      <h4 className="text-xs font-bold text-slate-200 line-clamp-2 group-hover:text-cyan-300 transition">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1">{item.type || 'TV'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

