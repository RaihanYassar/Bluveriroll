import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Dna, Clock, BarChart3, AlertCircle, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ProfilePage() {
  const { user } = useSelector((state) => state.auth);
  const [dna, setDna] = useState(null);
  const [journey, setJourney] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const [dnaRes, journeyRes] = await Promise.allSettled([
          api.get('/profile/dna'),
          api.get('/profile/journey'),
        ]);

        if (dnaRes.status === 'fulfilled') setDna(dnaRes.value.data.dna);
        if (journeyRes.status === 'fulfilled') setJourney(journeyRes.value.data.history || []);
      } catch (err) {
        console.error('Error fetching profile analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-cyan-950/40 border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            {user?.username || user?.email || 'Otaku Profile'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Anime DNA Analysis & Watch Journey Timeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950 border border-cyan-800/60 text-cyan-300">
            Explorer Level 1
          </span>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Computing Anime DNA profile..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Anime DNA Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Dna className="w-5 h-5" />
                  <h2 className="text-base font-bold text-white">Anime DNA Profile</h2>
                </div>
                <BarChart3 className="w-4 h-4 text-slate-500" />
              </div>

              {!dna?.hasEnoughData ? (
                <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
                  <AlertCircle className="w-6 h-6 text-cyan-400 mx-auto" />
                  <h3 className="text-sm font-semibold text-white">
                    Need More Watch Activity
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    To generate your unique Anime DNA Profile, please rate or log at least{' '}
                    <span className="text-cyan-300 font-bold">5 anime titles</span> in your watchlist.
                  </p>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition mt-2"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Discover Anime to Add</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/40">
                    <span className="text-xs text-slate-400">Dominant Vibe</span>
                    <h4 className="text-lg font-bold text-cyan-300">{dna.dominantVibe}</h4>
                  </div>
                  {/* Additional charts & genre analytics */}
                </div>
              )}
            </div>
          </div>

          {/* Watch Journey Timeline */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-cyan-400">
                <Clock className="w-5 h-5" />
                <h2 className="text-base font-bold text-white">Watch Journey</h2>
              </div>

              {journey.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                  <p>No recent activity logged.</p>
                  <p className="text-[11px] text-slate-600">Your episode updates will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {journey.map((j, i) => (
                    <div key={i} className="text-xs text-slate-300 border-l-2 border-cyan-500 pl-3 py-1">
                      {j.action}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

