import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Sparkles,
  Bookmark,
  Compass,
  Dna,
  LogOut,
  LogIn,
  UserPlus,
  Film,
  UserCheck,
} from 'lucide-react';
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
    `inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
      isActive
        ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
        : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
    }`;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/90 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Row: Brand, Desktop Nav, Auth Controls */}
        <div className="h-16 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform border border-white/15">
              <Film className="w-5 h-5 text-slate-950 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-base sm:text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
                BLUVERIROLL
              </span>
              <span className="text-[10px] text-slate-400 tracking-tight -mt-1 hidden sm:block">
                Discover Movies & Anime
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <NavLink to="/" className={navLinkClass}>
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Discover</span>
            </NavLink>

            <NavLink to="/moodsync" className={navLinkClass}>
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>MoodSync</span>
            </NavLink>

            {isAuthenticated && (
              <>
                <NavLink to="/watchlist" className={navLinkClass}>
                  <Bookmark className="w-4 h-4 text-emerald-400" />
                  <span>Watchlist</span>
                </NavLink>

                <NavLink to="/profile" className={navLinkClass}>
                  <Dna className="w-4 h-4 text-purple-400" />
                  <span>Profile & DNA</span>
                </NavLink>
              </>
            )}
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isAuthenticated ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/profile"
                  className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 font-semibold hover:border-cyan-500/40 transition"
                >
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="max-w-[130px] truncate">
                    {user?.username || user?.email?.split('@')[0] || 'Watcher'}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 border border-slate-800 hover:border-rose-500/40 transition cursor-pointer"
                  title="Log Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition"
                >
                  <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20 hover:brightness-110 transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar (Flexible & Scrollable for any screen width) */}
        <nav className="flex md:hidden items-center gap-1.5 overflow-x-auto no-scrollbar py-2 border-t border-slate-900">
          <NavLink to="/" className={navLinkClass}>
            <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Discover</span>
          </NavLink>

          <NavLink to="/moodsync" className={navLinkClass}>
            <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>MoodSync</span>
          </NavLink>

          {isAuthenticated && (
            <>
              <NavLink to="/watchlist" className={navLinkClass}>
                <Bookmark className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Watchlist</span>
              </NavLink>

              <NavLink to="/profile" className={navLinkClass}>
                <Dna className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Profile</span>
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
