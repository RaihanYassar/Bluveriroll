import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dna,
  Clock,
  BarChart3,
  Compass,
  Star,
  Film,
  Sparkles,
  TrendingUp,
  Award,
  CheckCircle2,
  Download,
  Palette,
  Eye,
  Play,
  Wand2,
  Lock,
  Share2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchProfileAnalytics, generateTarotReading } from '../store/slices/moodSyncSlice';
import { fetchWatchlist } from '../store/slices/watchlistSlice';
import LoadingSpinner from '../components/LoadingSpinner';

const ARCHETYPE_TITLES = {
  Action: 'Action Enthusiast',
  Adventure: 'World Explorer',
  Comedy: 'Lighthearted Seeker',
  Drama: 'Drama Connoisseur',
  Fantasy: 'Fantasy Realm Watcher',
  Horror: 'Dark Fiction Watcher',
  Mystery: 'Mystery Solver',
  Romance: 'Romance Storyteller',
  'Sci-Fi': 'Sci-Fi Watcher',
  'Slice of Life': 'Comfort & Slow-Pace Watcher',
  Sports: 'Competitive Spirit',
  Supernatural: 'Supernatural Seeker',
  Suspense: 'Thriller Enthusiast',
  Psychological: 'Psychological Analyst',
};

const WRAPPED_THEMES = [
  {
    id: 'cyber',
    label: 'Midnight Cyan',
    cardClass: 'from-cyan-950 via-slate-950 to-indigo-950 border-cyan-500/40',
    accentText: 'text-cyan-300',
    barClass: 'from-cyan-400 to-blue-500',
    badgeClass: 'bg-cyan-400 text-slate-950',
    bgStops: ['#041f2e', '#020617', '#0f172a', '#1e1b4b'],
    orb1: 'rgba(34, 211, 238, 0.24)',
    orb2: 'rgba(59, 130, 246, 0.2)',
    accentHex: '#22d3ee',
    secondaryHex: '#38bdf8',
  },
  {
    id: 'crimson',
    label: 'Crimson Dusk',
    cardClass: 'from-rose-950 via-slate-950 to-purple-950 border-rose-500/40',
    accentText: 'text-rose-300',
    barClass: 'from-rose-400 to-purple-500',
    badgeClass: 'bg-rose-400 text-slate-950',
    bgStops: ['#3b071e', '#090612', '#130722', '#2e1065'],
    orb1: 'rgba(251, 113, 133, 0.24)',
    orb2: 'rgba(192, 132, 252, 0.2)',
    accentHex: '#fb7185',
    secondaryHex: '#c084fc',
  },
  {
    id: 'aurora',
    label: 'Forest Slate',
    cardClass: 'from-emerald-950 via-slate-950 to-teal-950 border-emerald-500/40',
    accentText: 'text-emerald-300',
    barClass: 'from-emerald-400 to-teal-400',
    badgeClass: 'bg-emerald-400 text-slate-950',
    bgStops: ['#022c22', '#020617', '#042f2e', '#083344'],
    orb1: 'rgba(52, 211, 153, 0.24)',
    orb2: 'rgba(45, 212, 191, 0.2)',
    accentHex: '#34d399',
    secondaryHex: '#2dd4bf',
  },
];

const TAROT_CARD_STYLES = [
  {
    border: 'border-amber-500/40 hover:border-amber-400',
    bg: 'from-amber-950/30 via-slate-950 to-slate-950',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    accent: 'text-amber-300',
  },
  {
    border: 'border-cyan-500/40 hover:border-cyan-400',
    bg: 'from-cyan-950/30 via-slate-950 to-slate-950',
    badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    accent: 'text-cyan-300',
  },
  {
    border: 'border-purple-500/40 hover:border-purple-400',
    bg: 'from-purple-950/30 via-slate-950 to-slate-950',
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    accent: 'text-purple-300',
  },
];

function drawRoundedRect(ctx, x, y, w, h, r, fillStyle, strokeStyle, lineWidth = 2) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function truncateText(ctx, text, maxWidth) {
  if (!text) return '';
  if (ctx.measureText(text).width <= maxWidth) return text;
  let clipped = text;
  while (clipped.length > 0 && ctx.measureText(clipped + '...').width > maxWidth) {
    clipped = clipped.slice(0, -1);
  }
  return clipped + '...';
}

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { dna, journey, tarotReading, tarotLoading, profileLoading } = useSelector(
    (state) => state.moodSync
  );
  const { items: watchlistItems, loading: watchlistLoading } = useSelector((state) => state.watchlist);

  const [wrappedThemeId, setWrappedThemeId] = useState('cyber');
  const [revealedCards, setRevealedCards] = useState({ 0: false, 1: false, 2: false });

  const activeTheme = WRAPPED_THEMES.find((t) => t.id === wrappedThemeId) || WRAPPED_THEMES[0];

  useEffect(() => {
    dispatch(fetchProfileAnalytics());
    dispatch(fetchWatchlist());
  }, [dispatch]);

  const liveDna = useMemo(() => {
    const items = Array.isArray(watchlistItems) && watchlistItems.length > 0 ? watchlistItems : [];
    const totalLogged = items.length || dna?.totalLogged || 0;
    const minimumRequired = dna?.minimumRequired || 5;
    const hasEnoughData = totalLogged >= minimumRequired;

    const totalEpisodesWatched = items.reduce(
      (sum, item) => sum + (Number(item.currentEpisode) || 0),
      0
    );

    if (items.length === 0) {
      return {
        hasEnoughData: Boolean(dna?.hasEnoughData),
        minimumRequired,
        totalLogged,
        totalEpisodesWatched: 0,
        averageRating: dna?.averageRating || 0,
        dominantVibe: dna?.dominantVibe || 'New Watcher',
        latestTitle: dna?.latestTitle || null,
        latestGenres: dna?.latestGenres || [],
        topTitles: [],
        genreBreakdown:
          dna?.genreBreakdown ||
          (dna?.favoriteGenres || []).map((g) => ({
            name: g,
            count: 1,
            percentage: 100,
            isRecent: false,
            titles: [],
          })),
      };
    }

    const scoredItems = items.filter((i) => Number(i.score) > 0);
    const averageRating =
      scoredItems.length > 0
        ? Number((scoredItems.reduce((sum, i) => sum + Number(i.score), 0) / scoredItems.length).toFixed(2))
        : dna?.averageRating || 0;

    const genreCounts = {};
    const genreTitles = {};
    const weightedScores = {};

    const latestItem = items[0];
    const parseItemGenres = (rawGenres) => {
      if (!rawGenres) return [];
      if (Array.isArray(rawGenres)) {
        return rawGenres.map((g) => (typeof g === 'string' ? g.trim() : g?.name?.trim())).filter(Boolean);
      }
      return String(rawGenres)
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean);
    };

    const latestGenres = parseItemGenres(latestItem?.genres);

    items.forEach((item, idx) => {
      const gList = parseItemGenres(item.genres);
      const recencyWeight = idx === 0 ? 3.0 : idx === 1 ? 2.0 : idx === 2 ? 1.5 : 1.0;

      gList.forEach((g) => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
        weightedScores[g] = (weightedScores[g] || 0) + recencyWeight;
        if (!genreTitles[g]) genreTitles[g] = [];
        if (item.title && !genreTitles[g].includes(item.title)) {
          genreTitles[g].push(item.title);
        }
      });
    });

    const sortedGenres = Object.keys(genreCounts).sort((a, b) => {
      if (genreCounts[b] !== genreCounts[a]) {
        return genreCounts[b] - genreCounts[a];
      }
      return (weightedScores[b] || 0) - (weightedScores[a] || 0);
    });

    const genreBreakdown = sortedGenres.map((genre) => ({
      name: genre,
      count: genreCounts[genre],
      percentage: totalLogged > 0 ? Math.round((genreCounts[genre] / totalLogged) * 100) : 0,
      isRecent: latestGenres.includes(genre),
      titles: genreTitles[genre] || [],
    }));

    const weightedTop = Object.keys(weightedScores).sort((a, b) => weightedScores[b] - weightedScores[a]);
    const primaryGenre = weightedTop[0] || sortedGenres[0] || null;
    const recentGenre = latestGenres[0] || weightedTop[1] || null;

    let dominantVibe = 'New Watcher';
    if (totalLogged > 0) {
      const baseArchetype = ARCHETYPE_TITLES[primaryGenre] || `${primaryGenre || 'Cinema'} Watcher`;
      if (recentGenre && recentGenre !== primaryGenre) {
        dominantVibe = `${primaryGenre} & ${recentGenre} (${totalLogged} Titles)`;
      } else if (primaryGenre) {
        dominantVibe = `${baseArchetype} (${totalLogged} Titles)`;
      } else {
        dominantVibe = `Active Watcher (${totalLogged} Titles)`;
      }
    }

    const topTitles = [...items]
      .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0))
      .slice(0, 5)
      .map((i) => ({ title: i.title, score: i.score || '9.0', status: i.status }));

    return {
      hasEnoughData,
      minimumRequired,
      totalLogged,
      totalEpisodesWatched,
      averageRating,
      dominantVibe,
      latestTitle: latestItem?.title || null,
      latestGenres,
      topTitles,
      genreBreakdown,
    };
  }, [watchlistItems, dna]);

  const handleDrawTarot = () => {
    setRevealedCards({ 0: false, 1: false, 2: false });
    dispatch(
      generateTarotReading({
        fallbackData: {
          titles: (watchlistItems || []).map((i) => i.title).filter(Boolean),
          topGenres: liveDna.genreBreakdown.map((g) => g.name),
          averageRating: liveDna.averageRating,
          totalLogged: liveDna.totalLogged,
        },
      })
    );
  };

  const handleRevealCard = (idx) => {
    setRevealedCards((prev) => ({ ...prev, [idx]: true }));
  };

  const handleRevealAll = () => {
    setRevealedCards({ 0: true, 1: true, 2: true });
  };

  // =========================================================================
  // 9:16 STORY WRAPPED POSTER GENERATOR (1080x1920)
  // =========================================================================
  const handleDownloadWrappedCard = () => {
    const W = 1080;
    const H = 1920;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fontStack = '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif';
    const displayName = user?.username || user?.email?.split('@')[0] || 'Watcher';

    // 1. Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, activeTheme.bgStops[0]);
    bgGrad.addColorStop(0.35, activeTheme.bgStops[1]);
    bgGrad.addColorStop(0.7, activeTheme.bgStops[2]);
    bgGrad.addColorStop(1, activeTheme.bgStops[3]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 2. Ambient Glow Orbs
    const drawOrb = (cx, cy, radius, color) => {
      const rad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
      rad.addColorStop(0, color);
      rad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rad;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    };
    drawOrb(180, 220, 480, activeTheme.orb1);
    drawOrb(920, 880, 520, activeTheme.orb2);
    drawOrb(240, 1650, 500, activeTheme.orb1);

    // 3. Subtle Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y <= H; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // 4. Outer Frame Card
    drawRoundedRect(
      ctx,
      44,
      44,
      W - 88,
      H - 88,
      48,
      'rgba(2, 6, 23, 0.58)',
      activeTheme.accentHex,
      2.5
    );

    // 5. Top Brand Pill & Counter Pill
    drawRoundedRect(
      ctx,
      90,
      96,
      430,
      54,
      27,
      'rgba(15, 23, 42, 0.9)',
      'rgba(255, 255, 255, 0.14)',
      1.5
    );
    ctx.fillStyle = activeTheme.accentHex;
    ctx.font = `800 21px ${fontStack}`;
    ctx.fillText('BLUVERIROLL WRAPPED 2026', 120, 130);

    drawRoundedRect(ctx, W - 270, 96, 180, 54, 27, activeTheme.accentHex, null, 0);
    ctx.fillStyle = '#020617';
    ctx.font = `900 21px ${fontStack}`;
    ctx.textAlign = 'center';
    ctx.fillText(`${liveDna.totalLogged} TITLES`, W - 180, 130);
    ctx.textAlign = 'left';

    // 6. User Name & Subtitle
    ctx.fillStyle = '#94a3b8';
    ctx.font = `700 23px ${fontStack}`;
    ctx.fillText('PERSONAL WATCH PROFILE', 90, 210);

    ctx.fillStyle = '#ffffff';
    ctx.font = `900 66px ${fontStack}`;
    ctx.fillText(truncateText(ctx, displayName, 900), 90, 285);

    // 7. Dominant Vibe Archetype Card
    const archGrad = ctx.createLinearGradient(90, 330, W - 90, 540);
    archGrad.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
    archGrad.addColorStop(1, 'rgba(30, 41, 59, 0.85)');
    drawRoundedRect(ctx, 90, 330, W - 180, 215, 36, archGrad, activeTheme.accentHex, 2);

    ctx.fillStyle = activeTheme.accentHex;
    ctx.font = `800 20px ${fontStack}`;
    ctx.fillText('WATCH TASTE PROFILE', 130, 382);

    ctx.fillStyle = '#ffffff';
    ctx.font = `900 44px ${fontStack}`;
    ctx.fillText(truncateText(ctx, liveDna.dominantVibe, 820), 130, 445);

    const subText = tarotReading?.soulArcana
      ? `Tarot Arcana: ${tarotReading.soulArcana}`
      : liveDna.latestTitle
        ? `Recently Added: ${liveDna.latestTitle}`
        : 'Curated Watchlist Summary';
    ctx.fillStyle = '#cbd5e1';
    ctx.font = `600 23px ${fontStack}`;
    ctx.fillText(truncateText(ctx, subText, 820), 130, 505);

    // 8. 3 Bento Stat Cards Row
    const statItems = [
      { label: 'TOTAL LOGGED', value: `${liveDna.totalLogged}`, unit: 'TITLES' },
      { label: 'MEAN SCORE', value: `${liveDna.averageRating}`, unit: 'OUT OF 10' },
      { label: 'WATCHED', value: `${liveDna.totalEpisodesWatched}`, unit: 'EPISODES' },
    ];
    statItems.forEach((st, idx) => {
      const boxW = 284;
      const boxX = 90 + idx * (boxW + 24);
      const boxY = 580;
      drawRoundedRect(
        ctx,
        boxX,
        boxY,
        boxW,
        185,
        28,
        'rgba(15, 23, 42, 0.88)',
        'rgba(255, 255, 255, 0.12)',
        1.5
      );
      drawRoundedRect(ctx, boxX + 28, boxY + 22, 64, 6, 3, activeTheme.accentHex, null, 0);

      ctx.fillStyle = '#94a3b8';
      ctx.font = `800 18px ${fontStack}`;
      ctx.fillText(st.label, boxX + 28, boxY + 62);

      ctx.fillStyle = '#ffffff';
      ctx.font = `900 48px ${fontStack}`;
      ctx.fillText(st.value, boxX + 28, boxY + 122);

      ctx.fillStyle = activeTheme.accentHex;
      ctx.font = `700 17px ${fontStack}`;
      ctx.fillText(st.unit, boxX + 28, boxY + 156);
    });

    // 9. Top Genres Panel
    const genreBoxY = 800;
    drawRoundedRect(
      ctx,
      90,
      genreBoxY,
      W - 180,
      490,
      36,
      'rgba(15, 23, 42, 0.82)',
      'rgba(255, 255, 255, 0.1)',
      1.5
    );

    ctx.fillStyle = '#ffffff';
    ctx.font = `900 28px ${fontStack}`;
    ctx.fillText('MOST WATCHED GENRES', 130, genreBoxY + 56);

    ctx.fillStyle = '#94a3b8';
    ctx.font = `600 20px ${fontStack}`;
    ctx.textAlign = 'right';
    ctx.fillText(`${liveDna.genreBreakdown.length} GENRES TRACKED`, W - 130, genreBoxY + 56);
    ctx.textAlign = 'left';

    const top5Genres = liveDna.genreBreakdown.slice(0, 5);
    top5Genres.forEach((g, i) => {
      const rowY = genreBoxY + 95 + i * 74;

      drawRoundedRect(
        ctx,
        130,
        rowY,
        52,
        36,
        10,
        i === 0 ? activeTheme.accentHex : 'rgba(30, 41, 59, 0.95)',
        null,
        0
      );
      ctx.fillStyle = i === 0 ? '#020617' : activeTheme.accentHex;
      ctx.font = `900 20px ${fontStack}`;
      ctx.textAlign = 'center';
      ctx.fillText(`#${i + 1}`, 156, rowY + 25);
      ctx.textAlign = 'left';

      ctx.fillStyle = '#f8fafc';
      ctx.font = `800 26px ${fontStack}`;
      ctx.fillText(g.name, 200, rowY + 26);

      ctx.fillStyle = activeTheme.accentHex;
      ctx.font = `800 22px ${fontStack}`;
      ctx.textAlign = 'right';
      ctx.fillText(`${g.count} Titles (${g.percentage}%)`, W - 130, rowY + 26);
      ctx.textAlign = 'left';

      const barW = W - 260;
      drawRoundedRect(ctx, 130, rowY + 42, barW, 14, 7, 'rgba(30, 41, 59, 0.95)', null, 0);

      const fillW = Math.max(48, Math.min(barW, (barW * g.percentage) / 100));
      const barGrad = ctx.createLinearGradient(130, 0, 130 + fillW, 0);
      barGrad.addColorStop(0, activeTheme.accentHex);
      barGrad.addColorStop(1, activeTheme.secondaryHex);
      drawRoundedRect(ctx, 130, rowY + 42, fillW, 14, 7, barGrad, null, 0);
    });

    // 10. Top Rated Titles Podium
    const favBoxY = 1325;
    drawRoundedRect(
      ctx,
      90,
      favBoxY,
      W - 180,
      365,
      36,
      'rgba(15, 23, 42, 0.82)',
      'rgba(255, 255, 255, 0.1)',
      1.5
    );

    ctx.fillStyle = '#ffffff';
    ctx.font = `900 28px ${fontStack}`;
    ctx.fillText('HIGHEST RATED IN WATCHLIST', 130, favBoxY + 56);

    const medalColors = ['#fbbf24', '#e2e8f0', '#f59e0b'];
    liveDna.topTitles.slice(0, 3).forEach((t, idx) => {
      const cardY = favBoxY + 84 + idx * 84;
      drawRoundedRect(
        ctx,
        130,
        cardY,
        W - 260,
        68,
        18,
        'rgba(2, 6, 23, 0.75)',
        'rgba(255, 255, 255, 0.07)',
        1
      );

      drawRoundedRect(ctx, 148, cardY + 14, 40, 40, 12, medalColors[idx], null, 0);
      ctx.fillStyle = '#020617';
      ctx.font = `900 22px ${fontStack}`;
      ctx.textAlign = 'center';
      ctx.fillText(`${idx + 1}`, 168, cardY + 42);
      ctx.textAlign = 'left';

      ctx.fillStyle = '#ffffff';
      ctx.font = `800 25px ${fontStack}`;
      ctx.fillText(truncateText(ctx, t.title, 580), 208, cardY + 43);

      drawRoundedRect(ctx, W - 275, cardY + 15, 125, 38, 12, 'rgba(245, 158, 11, 0.18)', '#fbbf24', 1);
      ctx.fillStyle = '#fde68a';
      ctx.font = `900 21px ${fontStack}`;
      ctx.textAlign = 'center';
      ctx.fillText(`${t.score} / 10`, W - 212, cardY + 41);
      ctx.textAlign = 'left';
    });

    // 11. Footer Banner
    const destCard = tarotReading?.cards?.[2];
    const footerHeadline = destCard?.linkedTitle
      ? `NEXT UP TO WATCH: ${destCard.linkedTitle.toUpperCase()}`
      : 'BLUVERIROLL PERSONAL WATCH SUMMARY';

    drawRoundedRect(
      ctx,
      90,
      1720,
      W - 180,
      115,
      28,
      'rgba(15, 23, 42, 0.92)',
      activeTheme.accentHex,
      1.5
    );

    ctx.fillStyle = activeTheme.accentHex;
    ctx.font = `900 23px ${fontStack}`;
    ctx.textAlign = 'center';
    ctx.fillText(truncateText(ctx, footerHeadline, 820), W / 2, 1768);

    ctx.fillStyle = '#94a3b8';
    ctx.font = `700 18px ${fontStack}`;
    ctx.fillText('BLUVERIROLL | ANIME & MOVIE TRACKER', W / 2, 1806);
    ctx.textAlign = 'left';

    const link = document.createElement('a');
    link.download = `bluveriroll-wrapped-${displayName.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const isLoading = profileLoading && watchlistLoading && watchlistItems.length === 0;
  const allRevealed = revealedCards[0] && revealedCards[1] && revealedCards[2];
  const displayName = user?.username || user?.email?.split('@')[0] || 'Watcher';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/50 border border-slate-800 shadow-2xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[11px] font-bold text-cyan-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Profil & Ringkasan Tontonan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {user?.username || user?.email || 'Cinema Watcher'}
          </h1>
          <p className="text-xs text-slate-400">
            Statistik genre dari daftar tontonan lo, kartu Tarot selera anime, dan kartu Wrapped 9:16 siap unduh.
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Profil Selera Saat Ini
          </span>
          <span className="px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20">
            {liveDna.dominantVibe}
          </span>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Memuat statistik tontonan..." />
      ) : (
        <>
          {/* ================================================================ */}
          {/* ANIME TAROT READING (PAST, PRESENT, FUTURE) + WRAPPED CARD        */}
          {/* ================================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column (7 cols): 3-Card Tarot Reading */}
            <div className="lg:col-span-7 p-6 sm:p-7 rounded-3xl bg-slate-900/85 border border-slate-800 space-y-6 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-purple-400">
                    <Wand2 className="w-4 h-4" />
                    <span>Anime Tarot Reading</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-white">
                    Baca Pola Tontonan Lewat 3 Kartu (Past, Present, Future)
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Disusun dari riwayat Watchlist lo buat ngelihat awal mula selera lo (Past), genre yang lagi sering lo cari sekarang (Present), dan 1 judul rekomendasi berikutnya (Future).
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleDrawTarot}
                  disabled={tarotLoading || liveDna.totalLogged === 0}
                  className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-slate-950 text-xs font-black shadow-lg shadow-purple-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>
                    {tarotLoading
                      ? 'Menyusun 3 kartu dari Watchlist...'
                      : tarotReading
                        ? 'Kocok Ulang Kartu Tarot'
                        : 'Tarik 3 Kartu Tarot'}
                  </span>
                </button>

                {tarotReading && !allRevealed && (
                  <button
                    type="button"
                    onClick={handleRevealAll}
                    className="py-3.5 px-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-amber-500/40 text-amber-300 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Buka Semua Kartu</span>
                  </button>
                )}
              </div>

              {/* 3 Tarot Cards Display */}
              {tarotReading && Array.isArray(tarotReading.cards) ? (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-purple-500/30 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-extrabold text-white">
                        {tarotReading.soulArcana}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">{tarotReading.fortuneSummary}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {tarotReading.cards.map((card, idx) => {
                      const isRevealed = Boolean(revealedCards[idx]);
                      const style = TAROT_CARD_STYLES[idx % TAROT_CARD_STYLES.length];

                      if (!isRevealed) {
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleRevealCard(idx)}
                            className={`w-full p-6 rounded-2xl bg-gradient-to-r ${style.bg} border-2 border-dashed ${style.border} transition flex items-center justify-between gap-4 text-left group cursor-pointer`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-16 rounded-xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center shrink-0 group-hover:scale-105 transition">
                                <span className={`text-xs font-black ${style.accent}`}>
                                  {card.roman}
                                </span>
                                <Lock className="w-3.5 h-3.5 text-slate-400 mt-1" />
                              </div>
                              <div className="space-y-1">
                                <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase ${style.badge}`}>
                                  Kartu {card.roman} - {card.position}
                                </span>
                                <h4 className="text-sm sm:text-base font-extrabold text-white group-hover:text-cyan-300 transition">
                                  {card.position} ({card.subtitle})
                                </h4>
                                <p className="text-[11px] text-slate-400">
                                  Klik buat lihat isi kartu ini
                                </p>
                              </div>
                            </div>

                            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white group-hover:bg-cyan-500 group-hover:text-slate-950 transition shrink-0">
                              <Eye className="w-3.5 h-3.5" />
                              <span>Buka Kartu</span>
                            </span>
                          </button>
                        );
                      }

                      return (
                        <div
                          key={idx}
                          className={`p-5 rounded-2xl bg-gradient-to-br ${style.bg} border ${style.border} space-y-3 shadow-xl transition`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase ${style.badge}`}>
                                Arcana {card.roman} - {card.position}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-400">
                                {card.subtitle}
                              </span>
                            </div>
                            <span className={`text-[11px] font-extrabold ${style.accent}`}>
                              {card.keyword}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <h3 className="text-base sm:text-lg font-black text-white">
                              {card.arcanaName}
                            </h3>
                            <p className="text-xs font-bold text-cyan-300">
                              Referensi Judul: &ldquo;{card.linkedTitle}&rdquo;
                              {card.destinedScore && (
                                <span className="ml-2 text-amber-300">({card.destinedScore} / 10)</span>
                              )}
                            </p>
                          </div>

                          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                            {card.reading}
                          </p>

                          {card.destinedMalId && (
                            <div className="pt-1">
                              <Link
                                to={`/anime/${card.destinedMalId}`}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold transition shadow-md"
                              >
                                <Play className="w-3.5 h-3.5 fill-slate-950" />
                                <span>Lihat Detail {card.linkedTitle}</span>
                              </Link>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800/90 text-center space-y-2.5">
                  <Wand2 className="w-8 h-8 text-purple-400 mx-auto" />
                  <p className="text-xs sm:text-sm font-bold text-slate-200">
                    Belum ada kartu yang ditarik. Klik tombol <span className="text-purple-400">Tarik 3 Kartu Tarot</span> di atas buat mulai.
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                    Tiap kartu merangkum pola tontonan lo dan ngasih satu rekomendasi anime yang belum ada di Watchlist lo.
                  </p>
                </div>
              )}
            </div>

            {/* Right Column (5 cols): 9:16 Story Wrapped Card */}
            <div className="lg:col-span-5 space-y-4">
              {/* Theme Switcher Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <Palette className="w-4 h-4 text-cyan-400" />
                  <span>Warna Kartu:</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {WRAPPED_THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setWrappedThemeId(t.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        wrappedThemeId === t.id
                          ? 'bg-cyan-500 text-slate-950 shadow-md'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* On-Screen Story Card Preview */}
              <div
                className={`p-6 sm:p-7 rounded-[2rem] bg-gradient-to-br border-2 shadow-2xl space-y-5 relative overflow-hidden ${activeTheme.cardClass}`}
              >
                <div className="absolute -top-16 -right-16 w-44 h-44 bg-cyan-400/15 blur-3xl rounded-full pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-purple-500/15 blur-3xl rounded-full pointer-events-none" />

                {/* Top Badge Row */}
                <div className="flex items-center justify-between relative z-10">
                  <span className="px-3 py-1 rounded-full bg-slate-950/85 border border-white/15 text-[10px] font-black uppercase tracking-widest text-white">
                    BLUVERIROLL WRAPPED 2026
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${activeTheme.badgeClass}`}>
                    {liveDna.totalLogged} TITLES
                  </span>
                </div>

                {/* User Title */}
                <div className="space-y-0.5 relative z-10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    PERSONAL WATCH PROFILE
                  </p>
                  <h3 className="text-2xl font-black text-white tracking-tight truncate">
                    {displayName}
                  </h3>
                </div>

                {/* Archetype Highlight Box */}
                <div className="p-4 rounded-2xl bg-slate-950/85 border border-white/15 space-y-1 relative z-10">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${activeTheme.accentText}`}>
                    WATCH TASTE PROFILE
                  </span>
                  <p className="text-base sm:text-lg font-black text-white leading-snug">
                    {liveDna.dominantVibe}
                  </p>
                  {tarotReading?.soulArcana && (
                    <p className="text-[11px] font-semibold text-purple-300 pt-0.5">
                      {tarotReading.soulArcana}
                    </p>
                  )}
                </div>

                {/* 3 Bento Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5 relative z-10">
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-950/85 border border-white/10">
                    <p className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      <Film className="w-2.5 h-2.5 text-cyan-400" />
                      <span>LOGGED</span>
                    </p>
                    <p className="text-sm sm:text-base font-black text-white mt-0.5">{liveDna.totalLogged}</p>
                    <p className={`text-[9px] font-bold ${activeTheme.accentText}`}>TITLES</p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-950/85 border border-white/10">
                    <p className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                      <span>MEAN SCORE</span>
                    </p>
                    <p className="text-sm sm:text-base font-black text-amber-300 mt-0.5">
                      {liveDna.averageRating}
                    </p>
                    <p className={`text-[9px] font-bold ${activeTheme.accentText}`}>OUT OF 10</p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-950/85 border border-white/10">
                    <p className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      <Play className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400" />
                      <span>WATCHED</span>
                    </p>
                    <p className="text-sm sm:text-base font-black text-white mt-0.5">
                      {liveDna.totalEpisodesWatched}
                    </p>
                    <p className={`text-[9px] font-bold ${activeTheme.accentText}`}>EPISODES</p>
                  </div>
                </div>

                {/* Top Genres with Progress Bars */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2.5 relative z-10">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-wider text-white">
                      MOST WATCHED GENRES
                    </p>
                    <span className="text-[10px] font-bold text-slate-400">
                      {liveDna.genreBreakdown.length} Genres
                    </span>
                  </div>

                  <div className="space-y-2">
                    {liveDna.genreBreakdown.slice(0, 4).map((g, i) => (
                      <div key={g.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-white">
                            #{i + 1} {g.name}
                          </span>
                          <span className={`text-[11px] font-extrabold ${activeTheme.accentText}`}>
                            {g.count} Titles ({g.percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${activeTheme.barClass}`}
                            style={{ width: `${Math.min(100, Math.max(15, g.percentage))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Rated Podium */}
                {liveDna.topTitles.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2 relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-wider text-white">
                      HIGHEST RATED IN WATCHLIST
                    </p>
                    <div className="space-y-1.5">
                      {liveDna.topTitles.slice(0, 3).map((t, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-white/5 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                                i === 0
                                  ? 'bg-amber-400 text-slate-950'
                                  : i === 1
                                    ? 'bg-slate-200 text-slate-950'
                                    : 'bg-amber-600 text-white'
                              }`}
                            >
                              {i + 1}
                            </span>
                            <span className="font-bold text-white truncate">{t.title}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black shrink-0">
                            {t.score} / 10
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Card Footer Watermark */}
                <div className="pt-1 text-center relative z-10">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${activeTheme.accentText}`}>
                    BLUVERIROLL | PERSONAL WATCH SUMMARY
                  </p>
                </div>
              </div>

              {/* Download High-Res IG Story Poster Button */}
              <button
                type="button"
                onClick={handleDownloadWrappedCard}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 text-xs font-black flex items-center justify-center gap-2 transition shadow-xl shadow-cyan-500/20 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Kartu Wrapped 9:16 (1080×1920 PNG)</span>
              </button>
              <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1">
                <Share2 className="w-3 h-3" /> Ukuran vertikal 9:16 pas buat di-share ke Story atau Status
              </p>
            </div>
          </div>

          {/* ================================================================ */}
          {/* DETAILED GENRE BREAKDOWN & WATCH JOURNEY TIMELINE                */}
          {/* ================================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-cyan-400">
                    <Dna className="w-5 h-5" />
                    <h2 className="text-base sm:text-lg font-extrabold text-white">
                      Sebaran Genre di Watchlist
                    </h2>
                  </div>
                  <BarChart3 className="w-4 h-4 text-slate-500" />
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                      <Film className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Total Judul</span>
                    </div>
                    <p className="text-2xl font-black text-white mt-1">
                      {liveDna.totalLogged} <span className="text-xs font-semibold text-slate-500">Anime</span>
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>Rata-rata Skor</span>
                    </div>
                    <p className="text-2xl font-black text-amber-300 mt-1">
                      {liveDna.averageRating} <span className="text-xs font-semibold text-slate-500">/ 10</span>
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                      <Award className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Status Profil</span>
                    </div>
                    <p className="text-sm font-extrabold text-cyan-300 mt-2 flex items-center gap-1.5">
                      {liveDna.hasEnoughData ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Profil Lengkap</span>
                        </>
                      ) : (
                        <span>
                          {liveDna.totalLogged} / {liveDna.minimumRequired} Judul
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {liveDna.totalLogged === 0 ? (
                  <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
                    <Compass className="w-7 h-7 text-cyan-400 mx-auto" />
                    <h3 className="text-sm font-bold text-white">Watchlist Masih Kosong</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Tambahkan beberapa anime atau film ke Watchlist buat lihat sebaran genre dan ringkasan tontonan lo di halaman ini.
                    </p>
                    <Link
                      to="/"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold transition mt-2"
                    >
                      <Compass className="w-4 h-4" />
                      <span>Jelajahi Katalog</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Dominant Vibe Archetype Box */}
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/50 via-slate-950 to-slate-950 border border-cyan-500/40 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Dominant Vibe Archetype</span>
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[10px] font-bold text-cyan-300">
                          {liveDna.totalLogged} Judul Tercatat
                        </span>
                      </div>

                      <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {liveDna.dominantVibe}
                      </h4>

                      {liveDna.latestTitle && (
                        <p className="text-xs text-slate-300 pt-1">
                          Terakhir ditambahkan:{' '}
                          <span className="font-bold text-cyan-300">{liveDna.latestTitle}</span>
                          {liveDna.latestGenres.length > 0 && (
                            <span className="text-slate-400">
                              {' '}
                              ({liveDna.latestGenres.join(', ')})
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    {/* Top Affinity Genres */}
                    {liveDna.genreBreakdown.length > 0 && (
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                            Top Affinity Genres ({liveDna.genreBreakdown.length} Genre)
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Diurutkan dari isi Watchlist
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {liveDna.genreBreakdown.map((g, idx) => (
                            <div
                              key={g.name}
                              className={`p-3.5 rounded-2xl border transition space-y-2 ${
                                g.isRecent
                                  ? 'bg-cyan-950/30 border-cyan-500/50 shadow-md shadow-cyan-500/5'
                                  : 'bg-slate-950/80 border-slate-800/90'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[10px] font-black text-cyan-400">
                                    #{idx + 1}
                                  </span>
                                  <span className="text-xs sm:text-sm font-extrabold text-white">
                                    {g.name}
                                  </span>
                                  {g.isRecent && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-extrabold text-emerald-300 uppercase">
                                      Baru
                                    </span>
                                  )}
                                </div>

                                <span className="text-xs font-bold text-cyan-300">
                                  {g.count} Judul ({g.percentage}%)
                                </span>
                              </div>

                              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 transition-all duration-500"
                                  style={{ width: `${Math.min(100, Math.max(12, g.percentage))}%` }}
                                />
                              </div>

                              {g.titles && g.titles.length > 0 && (
                                <p className="text-[10px] text-slate-400 line-clamp-1">
                                  Judul: <span className="text-slate-300">{g.titles.join(', ')}</span>
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Watch Journey Timeline */}
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Clock className="w-5 h-5" />
                    <h2 className="text-base font-extrabold text-white">Riwayat Tontonan</h2>
                  </div>
                  <Link to="/watchlist" className="text-[11px] font-bold text-cyan-400 hover:underline">
                    Kelola Watchlist
                  </Link>
                </div>

                {watchlistItems.length === 0 && journey.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                    <p>Belum ada aktivitas tontonan.</p>
                    <p className="text-[11px] text-slate-600">Judul yang lo simpan bakal muncul di sini.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(watchlistItems.length > 0
                      ? watchlistItems.slice(0, 10).map((item) => ({
                          id: item.id,
                          title: item.title,
                          status: item.status,
                          genres: item.genres,
                          action: `${item.status}: ${item.title} (Ep ${item.currentEpisode || 0}/${item.totalEpisodes || '?'})`,
                        }))
                      : journey
                    ).map((j, i) => (
                      <div
                        key={j.id || i}
                        className="text-xs text-slate-300 border-l-2 border-cyan-500 pl-3 py-1.5 space-y-1 bg-slate-950/40 rounded-r-xl pr-3"
                      >
                        <p className="font-bold text-white">{j.action}</p>
                        {j.genres && (
                          <p className="text-[10px] text-cyan-400/90">
                            Genre: {Array.isArray(j.genres) ? j.genres.join(', ') : j.genres}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
