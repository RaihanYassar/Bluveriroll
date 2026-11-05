import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Lock, Mail, Film, AlertCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { loginUser, googleLoginUser, clearAuthError } from '../store/slices/authSlice';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resultAction = await dispatch(loginUser(formData));
    if (loginUser.fulfilled.match(resultAction)) {
      navigate('/');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const resultAction = await dispatch(googleLoginUser(credentialResponse.credential));
    if (googleLoginUser.fulfilled.match(resultAction)) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-12 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-96 h-64 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/85 border border-slate-800/90 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25 text-slate-950 mb-1">
            <Film className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Welcome to BLUVERIROLL</h2>
          <p className="text-xs text-slate-400">Discover Movies & Anime. Find Your Next Favorite.</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/50 flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Email Address</label>
            <div className="relative">
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 transition"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Password</label>
            <div className="relative">
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 transition"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 text-xs font-extrabold transition disabled:opacity-50 shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative flex items-center justify-center py-1">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider absolute">
            Or continue with
          </span>
        </div>

        {/* Clean Google OAuth Wrapper with colorScheme: 'light' to eliminate white corners on dark mode */}
        <div className="flex justify-center">
          <div
            className="google-oauth-wrapper inline-flex items-center justify-center rounded-full overflow-hidden bg-[#131314] p-[1px] shadow-lg"
            style={{ colorScheme: 'light' }}
          >
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {}}
              theme="filled_black"
              shape="pill"
              size="large"
              text="signin_with"
              width="300"
            />
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-cyan-400 hover:underline font-bold">
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
}
