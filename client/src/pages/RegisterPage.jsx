import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Lock, Mail, User, Film, AlertCircle, CheckCircle } from 'lucide-react';
import { setAuthLoading, setAuthError } from '../store/slices/authSlice';
import api from '../api/axiosInstance';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [successMsg, setSuccessMsg] = useState(null);
  const { loading, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(setAuthLoading(true));
    try {
      await api.post('/auth/register', formData);
      setSuccessMsg('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      dispatch(
        setAuthError(err.response?.data?.message || 'Registration failed. Please try again.')
      );
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 text-white mb-2">
            <Film className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Create BLUVERIROLL Account</h2>
          <p className="text-xs text-slate-400">Join the next generation anime discovery platform</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 flex items-center gap-2 text-emerald-300 text-xs">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Username</label>
            <div className="relative">
              <input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="RaihanYassar"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="otaku@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold hover:brightness-110 transition disabled:opacity-50 shadow-md shadow-cyan-500/20"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-cyan-400 hover:underline font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

