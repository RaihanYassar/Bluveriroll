import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search,
  Sparkles,
  Star,
  Bookmark,
  Flame,
  Film,
  Tv,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Play,
  PlusCircle,
  Clock,
  Award,
  Heart,
  LayoutGrid,
  SlidersHorizontal,
  X,
  Calendar,
  Compass,
} from 'lucide-react';
import {
  fetchPopularAnime,
  searchAnimeCatalog,
  fetchAnimeGenres,
  setActiveType,
  setActiveFilter,
  setSelectedGenre,
  setSearchQuery,
  setCurrentPage,
  resetSearch,
} from '../store/slices/animeSlice';
import LoadingSpinner from '../components/LoadingSpinner';
import { resolveAnimeImage, handleAnimeImageError } from '../utils/imageHelper';

const FORMAT_TABS = [
  { id: 'all', label: 'All Formats', icon: Flame },
  { id: 'tv', label: 'TV Series', icon: Tv },
  { id: 'movie', label: 'Movies', icon: Film },
  { id: 'ova', label: 'OVA', icon: Sparkles },
  { id: 'ona', label: 'ONA (Web)', icon: Play },
  { id: 'special', label: 'Specials', icon: Star },
];

const RANKING_FILTERS = [
  { id: '', label: 'Top Score', icon: Award },
  { id: 'bypopularity', label: 'Most Popular', icon: Flame },
  { id: 'airing', label: 'Currently Airing', icon: Tv },
  { id: 'upcoming', label: 'Upcoming', icon: Clock },
  { id: 'favorite', label: 'Most Favorited', icon: Heart },
];

const QUICK_TAGS = ['One Piece', 'Frieren', 'Your Name', 'Naruto', 'Attack on Titan', 'Suzume'];

export default function HomePage() {
  const dispatch = useDispatch();
  const genreScrollRef = useRef(null);
  const [showAllGenres, setShowAllGenres] = useState(false);

  const {
    popularList,
    searchResults,
    isSearchActive,
    genres,
    activeType,
    activeFilter,
    selectedGenre,
    searchQuery,
    currentPage,
    hasNextPage,
    loading,
    loadingMore,
    error,
  } = useSelector((state) => state.anime);

  useEffect(() => {
    dispatch(fetchAnimeGenres());
  }, [dispatch]);

  useEffect(() => {
    if (searchQuery.trim() || selectedGenre) {
      dispatch(
        searchAnimeCatalog({
          q: searchQuery,
          type: activeType,
          genres: selectedGenre,
          page: 1,
          limit: 25,
          append: false,
        })
      );
    } else {
      dispatch(
        fetchPopularAnime({
          type: activeType,
          filter: activeFilter,
          page: 1,
          limit: 25,
          append: false,
        })
      );
    }
  }, [dispatch, activeType, activeFilter, selectedGenre]);

  const scrollGenres = (direction) => {
    if (!genreScrollRef.current) return;
    const scrollAmount = direction === 'left' ? -320 : 320;
    genreScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    dispatch(setCurrentPage(1));
    if (!searchQuery.trim() && !selectedGenre) {
      dispatch(
        fetchPopularAnime({
          type: activeType,
          filter: activeFilter,
          page: 1,
          limit: 25,
          append: false,
        })
      );
      return;
    }
    dispatch(
      searchAnimeCatalog({
        q: searchQuery,
        type: activeType,
        genres: selectedGenre,
        page: 1,
        limit: 25,
        append: false,
      })
    );
  };

  const handleQuickTagClick = (tag) => {
    dispatch(setSearchQuery(tag));
    dispatch(setCurrentPage(1));
    dispatch(
      searchAnimeCatalog({
        q: tag,
        type: activeType,
        genres: selectedGenre,
        page: 1,
        limit: 25,
        append: false,
      })
    );
  };

  const handleResetFilters = () => {
    dispatch(resetSearch());
    dispatch(setActiveType('all'));
    dispatch(fetchPopularAnime({ type: 'all', filter: '', page: 1, limit: 25, append: false }));
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    dispatch(setCurrentPage(newPage));
    if (searchQuery.trim() || selectedGenre) {
      dispatch(
        searchAnimeCatalog({
          q: searchQuery,
          type: activeType,
          genres: selectedGenre,
          page: newPage,
          limit: 25,
          append: false,
        })
      );
    } else {
      dispatch(
        fetchPopularAnime({
          type: activeType,
          filter: activeFilter,
          page: newPage,
          limit: 25,
          append: false,
        })
      );
    }
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    dispatch(setCurrentPage(nextPage));
    if (searchQuery.trim() || selectedGenre) {
      dispatch(
        searchAnimeCatalog({
          q: searchQuery,
          type: activeType,
          genres: selectedGenre,
          page: nextPage,
          limit: 25,
          append: true,
        })
      );
    } else {
      dispatch(
        fetchPopularAnime({
          type: activeType,
          filter: activeFilter,
          page: nextPage,
          limit: 25,
          append: true,
        })
      );
    }
  };

  const displayedItems = isSearchActive ? searchResults : popularList;
  const spotlightItem = displayedItems[0] || null;
  const activeGenreObj = genres.find((g) => String(g.mal_id) === String(selectedGenre));

  return (
    <div className="space-y-8 sm:space-y-10 pb-20">
      {/* ================================================================== */}
      {/* HERO & SPOTLIGHT SECTION                                           */}
      {/* ================================================================== */}
      <section className="relative overflow-hidden pt-6 sm:pt-10 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8 border-b border-slate-900/90">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/25 via-slate-950 to-slate-950" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 -z-10 w-full max-w-2xl h-64 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
          {/* Left Column: Headline, Search & Quick Tags */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-800/50 text-cyan-300 text-xs font-semibold shadow-sm">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Curated Movie & Anime Discovery Hub</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
              Discover Cinema. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
                25,000+ Anime & Movies.
              </span>
            </h1>

            <p className="text-slate-400 text-xs sm:text-base max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Explore the complete catalog across every genre, season, and format with trailers, episode guides, and personalized MoodSync recommendations.
            </p>

            {/* Flexible Search Bar (Adapts cleanly on mobile and desktop) */}
            <form
              onSubmit={handleSearchSubmit}
              className="max-w-xl mx-auto lg:mx-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
            >
              <div className="relative flex-1 flex items-center group">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 group-focus-within:text-cyan-400 transition absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                  placeholder="Search titles (One Piece, Frieren, Suzume...)"
                  className="w-full pl-11 pr-10 py-3.5 sm:py-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-xs sm:text-sm shadow-xl transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      dispatch(setSearchQuery(''));
                      handleResetFilters();
                    }}
                    className="absolute right-3 p-1.5 text-slate-400 hover:text-white cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 text-xs sm:text-sm font-extrabold transition shadow-lg shadow-cyan-500/20 cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </form>

            {/* Trending Quick Search Pills */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2 pt-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Popular:</span>
              </span>
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleQuickTagClick(tag)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-[11px] text-slate-300 hover:text-cyan-300 transition cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-wrap justify-center lg:justify-start items-center gap-2.5 sm:gap-3 pt-1">
              <Link
                to="/moodsync"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-xs font-bold transition"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Ask MoodSync</span>
              </Link>
              <Link
                to="/watchlist"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-bold transition"
              >
                <Bookmark className="w-4 h-4 text-sky-400" />
                <span>Personal Watchlist</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Featured Spotlight Card */}
          {spotlightItem && (
            <div className="lg:col-span-5">
              <Link
                to={`/anime/${spotlightItem.mal_id}`}
                className="group relative block rounded-3xl overflow-hidden bg-slate-900/90 border border-slate-800/90 hover:border-cyan-500/50 shadow-2xl transition"
              >
                <div className="relative h-64 sm:h-80 overflow-hidden bg-slate-950">
                  <img
                    src={resolveAnimeImage(spotlightItem)}
                    alt={spotlightItem.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => handleAnimeImageError(e, spotlightItem)}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-500 opacity-75"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500 text-slate-950 text-[11px] font-black uppercase tracking-wide shadow-lg">
                      <Award className="w-3.5 h-3.5" />
                      <span>Featured #1</span>
                    </span>
                    {spotlightItem.score && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/90 backdrop-blur-md border border-amber-500/40 text-xs font-extrabold text-amber-300">
                        <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                        <span>{spotlightItem.score}</span>
                      </span>
                    )}
                  </div>

                  {/* Bottom Spotlight Details */}
                  <div className="absolute bottom-4 left-4 right-4 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-cyan-300">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-700/50 uppercase">
                        <Tv className="w-3 h-3" />
                        <span>{spotlightItem.type || 'TV'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-200">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>
                          {spotlightItem.episodes
                            ? `${spotlightItem.episodes} Episodes`
                            : spotlightItem.duration || 'Feature'}
                        </span>
                      </span>
                      {spotlightItem.year && (
                        <span className="inline-flex items-center gap-1 text-slate-300">
                          <Calendar className="w-3 h-3 text-sky-400" />
                          <span>{spotlightItem.year}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg sm:text-2xl font-black text-white line-clamp-1 group-hover:text-cyan-300 transition">
                      {spotlightItem.title}
                    </h3>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {spotlightItem.synopsis || 'Watch the official trailer, browse episodes, and add to your watchlist.'}
                    </p>

                    <div className="pt-1 inline-flex items-center gap-2 text-xs font-extrabold text-cyan-400">
                      <Play className="w-4 h-4 fill-cyan-400" />
                      <span>Watch Trailer & Episodes</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================== */}
      {/* CATALOG FILTER DECK & GENRE CAROUSEL                               */}
      {/* ================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-xl">
          {/* Row 1: Format Tabs + Reset Button */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              {FORMAT_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeType === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => dispatch(setActiveType(tab.id))}
                    className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                        : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800/90 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {(isSearchActive || selectedGenre || activeType !== 'all' || activeFilter !== '' || currentPage > 1) && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Row 2: Ranking / Category Filter Tabs */}
          {!selectedGenre && !searchQuery.trim() && (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sort:</span>
              </span>
              {RANKING_FILTERS.map((rf) => {
                const Icon = rf.icon;
                const isActive = activeFilter === rf.id;
                return (
                  <button
                    key={rf.id || 'top'}
                    onClick={() => dispatch(setActiveFilter(rf.id))}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 border border-slate-800/80 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{rf.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Row 3: Genre Bar */}
          {genres.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Genres ({genres.length})
                  </span>
                  {activeGenreObj && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-[11px] font-bold text-cyan-300">
                      <span>{activeGenreObj.name}</span>
                      <button
                        type="button"
                        onClick={() => dispatch(setSelectedGenre(''))}
                        className="hover:text-white cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {!showAllGenres && (
                    <>
                      <button
                        type="button"
                        onClick={() => scrollGenres('left')}
                        className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition cursor-pointer"
                        title="Scroll genres left"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollGenres('right')}
                        className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition cursor-pointer"
                        title="Scroll genres right"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowAllGenres((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer ${
                      showAllGenres
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>{showAllGenres ? 'Collapse' : 'All Genres'}</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <div
                  ref={genreScrollRef}
                  className={
                    showAllGenres
                      ? 'flex flex-wrap gap-1.5 sm:gap-2 pt-1'
                      : 'flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 pr-8'
                  }
                >
                  <button
                    type="button"
                    onClick={() => dispatch(setSelectedGenre(''))}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                      selectedGenre === ''
                        ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-950/90 text-slate-400 border border-slate-800/90 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    All Genres
                  </button>
                  {genres.map((g) => {
                    const isSelected = selectedGenre === String(g.mal_id);
                    return (
                      <button
                        type="button"
                        key={g.mal_id}
                        onClick={() => dispatch(setSelectedGenre(isSelected ? '' : String(g.mal_id)))}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                            : 'bg-slate-950/90 text-slate-300 border border-slate-800/90 hover:text-cyan-300 hover:border-cyan-500/40'
                        }`}
                      >
                        {g.name}
                      </button>
                    );
                  })}
                </div>

                {!showAllGenres && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-slate-900/90 to-transparent" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Section Title Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">
                {activeGenreObj
                  ? `${activeGenreObj.name} Anime & Movies`
                  : isSearchActive
                    ? `Search Results ${searchQuery ? `for "${searchQuery}"` : ''}`
                    : RANKING_FILTERS.find((r) => r.id === activeFilter)?.label || 'Top Rated Movies & Series'}
              </h2>
              <p className="text-xs text-slate-400">
                Showing {displayedItems.length} titles (Page {currentPage})
              </p>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* CATALOG GRID                                                     */}
        {/* ================================================================ */}
        {loading ? (
          <LoadingSpinner text="Loading catalog..." />
        ) : error ? (
          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-2">
            <p className="text-sm font-semibold text-rose-400">{error}</p>
            <p className="text-xs text-slate-500">Make sure the backend server is running on port 3000.</p>
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-300">No movies or series matched your filter.</p>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset All Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
              {displayedItems.map((item) => (
                <Link
                  key={item.mal_id}
                  to={`/anime/${item.mal_id}`}
                  className="group relative rounded-2xl overflow-hidden bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/60 hover:-translate-y-1 transition duration-300 flex flex-col shadow-lg"
                >
                  <div className="aspect-[3/4] overflow-hidden bg-slate-950 relative">
                    <img
                      src={resolveAnimeImage(item)}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => handleAnimeImageError(e, item)}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                    {/* Hover Play Overlay */}
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-xl shadow-cyan-500/40 transform scale-90 group-hover:scale-100 transition">
                        <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                      </div>
                    </div>

                    {item.score && (
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-slate-950/90 backdrop-blur-md border border-amber-500/30 text-[11px] font-extrabold text-amber-300 flex items-center gap-1 shadow">
                        <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                        <span>{item.score}</span>
                      </div>
                    )}

                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/90 border border-cyan-700/50 text-[10px] font-bold text-cyan-300 uppercase">
                        {item.type === 'Movie' ? (
                          <Film className="w-2.5 h-2.5" />
                        ) : (
                          <Tv className="w-2.5 h-2.5" />
                        )}
                        <span>{item.type || 'TV'}</span>
                      </span>
                      {item.year && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-950/80 text-[10px] font-medium text-slate-300">
                          {item.year}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2">
                    <div className="space-y-1">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-100 line-clamp-2 group-hover:text-cyan-300 transition leading-snug">
                        {item.title}
                      </h3>
                      {item.genres && item.genres.length > 0 && (
                        <p className="text-[10px] text-slate-500 line-clamp-1">
                          {item.genres.slice(0, 3).map((g) => g.name).join(', ')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/60">
                      <span className="inline-flex items-center gap-1 truncate">
                        <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">
                          {item.type === 'Movie'
                            ? item.duration || 'Movie'
                            : item.episodes
                              ? `${item.episodes} Eps`
                              : 'Ongoing'}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-cyan-400 font-bold shrink-0">
                        <Play className="w-3 h-3 fill-cyan-400" />
                        <span>Watch</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Load More + Multi-Page Controls */}
            <div className="flex flex-col items-center gap-4 pt-8">
              {hasNextPage && (
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-6 sm:px-7 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-cyan-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{loadingMore ? 'Loading More Titles...' : 'Load More (+25 Titles)'}</span>
                </button>
              )}

              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prev</span>
                </button>

                {[1, 2, 3, 4, 5].map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                {currentPage > 5 && (
                  <span className="px-3 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold">
                    Page {currentPage}
                  </span>
                )}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasNextPage}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-40 transition cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
