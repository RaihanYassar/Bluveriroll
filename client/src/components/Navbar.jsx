import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Sparkles, Bookmark, Compass, User, LogOut, Film } from 'lucide-react';
import { logout } from '../store/slices/authSlice';

export default function Navbar() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/40'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
    }`;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
              BLUVERIROLL
            </span>
            <span className="text-[10px] text-slate-400 tracking-tight -mt-1 hidden sm:block">
              Discover Anime. Find Your Next Favorite.
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink to="/" className={navLinkClass}>
            <Compass className="w-4 h-4" />
            <span className="hidden md:inline">Discover</span>
          </NavLink>

          <NavLink to="/moodsync" className={navLinkClass}>
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">MoodSync AI</span>
          </NavLink>

          {isAuthenticated && (
            <>
              <NavLink to="/watchlist" className={navLinkClass}>
                <Bookmark className="w-4 h-4" />
                <span className="hidden md:inline">Watchlist</span>
              </NavLink>

              <NavLink to="/profile" className={navLinkClass}>
                <User className="w-4 h-4" />
                <span className="hidden md:inline">Anime DNA</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* Auth Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 hidden lg:inline">
                {user?.username || user?.email || 'Otaku'}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 text-slate-300 border border-slate-700 transition"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 hover:brightness-110 transition"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

