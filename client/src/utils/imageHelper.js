const CACHE_KEY = 'bluveriroll_poster_cache_v1';

function getPosterCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function setPosterCache(malId, url) {
  try {
    const cache = getPosterCache();
    cache[String(malId)] = url;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage errors
  }
}

function createPlaceholderDataUri(title = 'Anime') {
  const safeTitle = String(title)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .slice(0, 32);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="680" viewBox="0 0 480 680">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#083344"/>
        <stop offset="50%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#1e1b4b"/>
      </linearGradient>
    </defs>
    <rect width="480" height="680" fill="url(#g)"/>
    <circle cx="240" cy="270" r="54" fill="#06b6d4" fill-opacity="0.15" stroke="#22d3ee" stroke-width="2"/>
    <polygon points="228,248 228,292 264,270" fill="#22d3ee"/>
    <text x="240" y="380" text-anchor="middle" fill="#f8fafc" font-family="system-ui, sans-serif" font-weight="800" font-size="22">${safeTitle}</text>
    <text x="240" y="412" text-anchor="middle" fill="#38bdf8" font-family="system-ui, sans-serif" font-weight="600" font-size="14">BLUVERIROLL CATALOG</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function resolveAnimeImage(item) {
  if (!item) return createPlaceholderDataUri();
  const malId = Number(item.mal_id || item.animeId);
  if (malId) {
    const cached = getPosterCache()[String(malId)];
    if (cached) return cached;
  }

  const rawUrl =
    item.imageUrl ||
    item.images?.jpg?.large_image_url ||
    item.images?.jpg?.image_url ||
    '';

  return rawUrl || createPlaceholderDataUri(item.title);
}

export async function handleAnimeImageError(e, itemOrTitle) {
  const img = e.currentTarget;
  if (!img || img.dataset.healing === 'done') return;

  const title =
    typeof itemOrTitle === 'string'
      ? itemOrTitle
      : itemOrTitle?.title || 'Anime';
  const malId =
    typeof itemOrTitle === 'object'
      ? Number(itemOrTitle?.mal_id || itemOrTitle?.animeId)
      : null;

  // Immediately replace ugly broken image icon with sleek SVG card while fetching real cover
  img.src = createPlaceholderDataUri(title);
  img.dataset.healing = 'done';

  if (!malId) return;

  // 1. Try AniList GraphQL by idMal (Fast, CORS-enabled, no strict rate limit)
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        query: `query ($idMal: Int) { Media(idMal: $idMal, type: ANIME) { coverImage { extraLarge large } } }`,
        variables: { idMal: malId },
      }),
    });
    const json = await res.json();
    const cover =
      json?.data?.Media?.coverImage?.extraLarge ||
      json?.data?.Media?.coverImage?.large;
    if (cover) {
      setPosterCache(malId, cover);
      img.src = cover;
      return;
    }
  } catch {
    // fallback to Jikan below
  }

  // 2. Fallback to Jikan v4 by mal_id
  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime/${malId}`);
    const json = await res.json();
    const cover =
      json?.data?.images?.jpg?.large_image_url ||
      json?.data?.images?.jpg?.image_url;
    if (cover) {
      setPosterCache(malId, cover);
      img.src = cover;
    }
  } catch {
    // Keep clean SVG poster placeholder
  }
}
