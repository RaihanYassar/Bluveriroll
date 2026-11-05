const axios = require('axios');
const { Watchlist } = require('../models');

const ARCHETYPE_TITLES = {
  Action: 'Action Enthusiast',
  Adventure: 'World Explorer',
  Comedy: 'Lighthearted Seeker',
  Drama: 'Story & Drama Connoisseur',
  Fantasy: 'Fantasy Realm Explorer',
  Horror: 'Dark Fiction Watcher',
  Mystery: 'Mystery & Puzzle Solver',
  Romance: 'Romance Storyteller',
  'Sci-Fi': 'Sci-Fi & Future Watcher',
  'Slice of Life': 'Slow-Pace & Comfort Seeker',
  Sports: 'Competitive Spirit',
  Supernatural: 'Supernatural Seeker',
  Suspense: 'Thriller & Mind-Game Fan',
  Psychological: 'Psychological Analyst'
};

const DESTINED_RECOMMENDATIONS = {
  Action: { mal_id: 40748, title: 'Jujutsu Kaisen', genre: 'Action, Supernatural', score: 8.63 },
  Adventure: { mal_id: 5114, title: 'Fullmetal Alchemist: Brotherhood', genre: 'Adventure, Fantasy', score: 9.10 },
  Comedy: { mal_id: 37105, title: 'Grand Blue', genre: 'Comedy, Slice of Life', score: 8.43 },
  Drama: { mal_id: 33352, title: 'Violet Evergarden', genre: 'Drama, Fantasy', score: 8.68 },
  Fantasy: { mal_id: 52991, title: 'Sousou no Frieren', genre: 'Fantasy, Adventure', score: 9.31 },
  Mystery: { mal_id: 19, title: 'Monster', genre: 'Mystery, Psychological', score: 8.88 },
  Romance: { mal_id: 42897, title: 'Horimiya', genre: 'Romance, Comedy', score: 8.19 },
  'Sci-Fi': { mal_id: 9253, title: 'Steins;Gate', genre: 'Sci-Fi, Suspense', score: 9.07 },
  'Slice of Life': { mal_id: 34798, title: 'Yuru Camp (Laid-Back Camp)', genre: 'Slice of Life, Healing', score: 8.25 },
  Suspense: { mal_id: 1535, title: 'Death Note', genre: 'Suspense, Supernatural', score: 8.62 }
};

function buildTarotDeck({ titles = [], topGenres = [], averageRating = 9.0, totalLogged = 0 }) {
  const mainGenre = topGenres[0] || 'Fantasy';
  const recentGenre = topGenres[1] || mainGenre;
  const oldestTitle = titles[titles.length - 1] || titles[0] || 'Kimi no Na wa.';
  const newestTitle = titles[0] || 'Sousou no Frieren';

  const candidatePool = Object.values(DESTINED_RECOMMENDATIONS);
  const destinedAnime =
    candidatePool.find(
      (c) => !titles.some((t) => t.toLowerCase().includes(c.title.toLowerCase().split(' ')[0]))
    ) || DESTINED_RECOMMENDATIONS[mainGenre] || DESTINED_RECOMMENDATIONS.Fantasy;

  return {
    soulArcana: `Arcana ${ARCHETYPE_TITLES[mainGenre] || 'The Star Reader'}`,
    fortuneSummary: `Disusun dari ${totalLogged} judul di daftar tontonan lo dengan kecenderungan genre ${mainGenre} dan ${recentGenre}.`,
    wrappedTagline: `Arcana: ${ARCHETYPE_TITLES[mainGenre] || 'Star Reader'} - Rekomendasi: ${destinedAnime.title}`,
    cards: [
      {
        position: 'THE PAST',
        roman: 'I',
        arcanaName: `Akar Cerita ${mainGenre}`,
        subtitle: 'Awal Selera Tontonan',
        linkedTitle: oldestTitle,
        reading: `Selera tontonan lo banyak dipengaruhi sama elemen ${mainGenre} seperti di "${oldestTitle}". Dari awal, lo memang lebih suka cerita yang punya dunia kuat dan karakter yang gampang diingat.`,
        keyword: `Fondasi: ${mainGenre}`
      },
      {
        position: 'THE PRESENT',
        roman: 'XIV',
        arcanaName: `Fase ${recentGenre}`,
        subtitle: 'Selera Saat Ini',
        linkedTitle: newestTitle,
        reading: `Lewat tambahan terbaru lo di "${newestTitle}" dan rata-rata skor ${averageRating}/10, kelihatan kalau sekarang lo lagi pilih-pilih tontonan yang punya penulisan cerita matang dan atmosfer yang jelas.`,
        keyword: `Fokus Sekarang: ${recentGenre}`
      },
      {
        position: 'THE FUTURE',
        roman: 'XXI',
        arcanaName: 'Tontonan Berikutnya',
        subtitle: 'Rekomendasi Paling Pas',
        linkedTitle: destinedAnime.title,
        destinedMalId: destinedAnime.mal_id,
        destinedScore: destinedAnime.score,
        reading: `Kalau ngelihat kombinasi ${mainGenre} dan ${recentGenre} di daftar lo, "${destinedAnime.title}" (${destinedAnime.genre}) bakal cocok banget buat masuk antrean tontonan lo berikutnya.`,
        keyword: 'Kecocokan: 98%'
      }
    ]
  };
}

const CANONICAL_TITLE_GENRES = [
  { match: /sousou no frieren|frieren/i, genres: ['Adventure', 'Drama', 'Fantasy'] },
  { match: /sen to chihiro|spirited away/i, genres: ['Adventure', 'Fantasy', 'Supernatural'] },
  { match: /suzume no tojimari|\bsuzume\b/i, genres: ['Adventure', 'Fantasy', 'Mystery'] },
  { match: /howl no ugoku shiro|howl's moving castle/i, genres: ['Adventure', 'Drama', 'Fantasy', 'Romance'] }
];

function parseAndNormalizeGenres(item) {
  const title = String(item?.title || '');
  for (const rule of CANONICAL_TITLE_GENRES) {
    if (rule.match.test(title)) {
      return [...rule.genres];
    }
  }
  if (!item?.genres) return [];
  return String(item.genres)
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean);
}

class ProfileController {
  static async getAnimeDNA(req, res, next) {
    try {
      const userId = req.user.id;
      const items = await Watchlist.findAll({
        where: { userId },
        order: [['updatedAt', 'DESC']]
      });

      const totalLogged = items.length;
      const minimumRequired = 5;
      const hasEnoughData = totalLogged >= minimumRequired;

      const scoredItems = items.filter((i) => typeof i.score === 'number' && i.score > 0);
      const averageRating =
        scoredItems.length > 0
          ? Number((scoredItems.reduce((sum, i) => sum + i.score, 0) / scoredItems.length).toFixed(2))
          : 0;

      const genreCounts = {};
      const weightedScores = {};
      const latestItem = items[0] || null;
      const latestItemGenres = latestItem ? parseAndNormalizeGenres(latestItem) : [];

      items.forEach((item, index) => {
        const gList = parseAndNormalizeGenres(item);
        const recencyWeight = index === 0 ? 1.35 : index === 1 ? 1.2 : index === 2 ? 1.1 : 1.0;
        gList.forEach((g) => {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
          weightedScores[g] = (weightedScores[g] || 0) + recencyWeight;
        });
      });

      const sortedGenres = Object.keys(genreCounts).sort((a, b) => {
        if (genreCounts[b] !== genreCounts[a]) {
          return genreCounts[b] - genreCounts[a];
        }
        return (weightedScores[b] || 0) - (weightedScores[a] || 0);
      });

      const favoriteGenres = sortedGenres;

      const genreBreakdown = sortedGenres.map((genre) => ({
        name: genre,
        count: genreCounts[genre],
        percentage: totalLogged > 0 ? Math.round((genreCounts[genre] / totalLogged) * 100) : 0,
        isRecent: latestItemGenres.includes(genre)
      }));

      const primaryGenre = favoriteGenres[0] || null;
      const candidateSecondary = favoriteGenres[1] || null;
      const primaryCount = primaryGenre ? genreCounts[primaryGenre] || 0 : 0;
      const secondaryCount = candidateSecondary ? genreCounts[candidateSecondary] || 0 : 0;
      const secondaryGenre =
        candidateSecondary &&
        candidateSecondary !== primaryGenre &&
        (secondaryCount >= 2 || primaryCount <= 1)
          ? candidateSecondary
          : null;

      let dominantVibe = 'New Watcher';
      if (totalLogged > 0) {
        const baseTitle = ARCHETYPE_TITLES[primaryGenre] || `${primaryGenre || 'Cinema'} Watcher`;
        if (secondaryGenre) {
          dominantVibe = `${primaryGenre} & ${secondaryGenre} (${totalLogged} Titles)`;
        } else if (primaryGenre) {
          dominantVibe = `${primaryGenre} - ${baseTitle} (${totalLogged} Titles)`;
        } else if (averageRating >= 8.5) {
          dominantVibe = `Selective Curator (${totalLogged} Titles)`;
        } else {
          dominantVibe = `Active Watcher (${totalLogged} Titles)`;
        }
      }

      res.status(200).json({
        message: 'Anime DNA profile retrieved successfully',
        userId,
        dna: {
          hasEnoughData,
          minimumRequired,
          totalLogged,
          favoriteGenres,
          genreBreakdown,
          latestTitle: latestItem ? latestItem.title : null,
          latestGenres: latestItemGenres,
          averageRating,
          dominantVibe
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getWatchJourney(req, res, next) {
    try {
      const userId = req.user.id;
      const items = await Watchlist.findAll({
        where: { userId },
        order: [['updatedAt', 'DESC']],
        limit: 15
      });

      const history = items.map((item) => {
        const normalizedGenres = parseAndNormalizeGenres(item);
        return {
          id: item.id,
          animeId: item.animeId,
          title: item.title,
          status: item.status,
          score: item.score,
          genres: normalizedGenres.join(', ') || item.genres,
          currentEpisode: item.currentEpisode,
          totalEpisodes: item.totalEpisodes,
          action: `${item.status}: ${item.title} (Ep ${item.currentEpisode || 0}/${item.totalEpisodes || '?'})`,
          updatedAt: item.updatedAt
        };
      });

      res.status(200).json({
        message: 'Watch Journey history retrieved successfully',
        userId,
        history
      });
    } catch (err) {
      next(err);
    }
  }

  static async getTarotReading(req, res, next) {
    try {
      const userId = req.user.id;
      const items = await Watchlist.findAll({
        where: { userId },
        order: [['updatedAt', 'DESC']]
      });

      const titles = items.map((i) => i.title).filter(Boolean);
      const scored = items.filter((i) => typeof i.score === 'number' && i.score > 0);
      const averageRating =
        scored.length > 0
          ? Number((scored.reduce((s, i) => s + i.score, 0) / scored.length).toFixed(2))
          : 9.0;

      const genreCounts = {};
      items.forEach((item) => {
        if (item.genres) {
          item.genres
            .split(',')
            .map((g) => g.trim())
            .filter(Boolean)
            .forEach((g) => {
              genreCounts[g] = (genreCounts[g] || 0) + 1;
            });
        }
      });
      const topGenres = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]);

      const fallbackTarot = buildTarotDeck({
        titles,
        topGenres,
        averageRating,
        totalLogged: items.length
      });

      if (process.env.NODE_ENV === 'test' || items.length === 0) {
        return res.status(200).json({
          message: 'Anime Tarot Reading generated successfully',
          tarot: fallbackTarot
        });
      }

      const systemPrompt = `Kamu adalah kurator kartu Tarot Anime di BLUVERIROLL.
Berdasarkan daftar tontonan user, susun 3 kartu pembacaan selera (THE PAST, THE PRESENT, THE FUTURE) dalam Bahasa Indonesia yang santai, natural, dan mengalir seperti teman yang ngerti anime (tanpa emoji dan tanpa bahasa terjemahan yang kaku/berlebihan).
Untuk kartu ke-3 (THE FUTURE), rekomendasikan 1 judul anime populer yang BELUM ada di Watchlist user beserta mal_id resminya (contoh: 52991 untuk Sousou no Frieren, 9253 untuk Steins;Gate, 33352 untuk Violet Evergarden, 40748 untuk Jujutsu Kaisen, 19 untuk Monster, 28851 untuk Koe no Katachi).
Balas HANYA dalam JSON valid:
{
  "soulArcana": "Nama Arcana singkat (tanpa emoji)",
  "fortuneSummary": "1 kalimat ringkas tentang pola selera tontonan user",
  "wrappedTagline": "Tagline singkat untuk kartu profil",
  "cards": [
    {
      "position": "THE PAST",
      "roman": "I",
      "arcanaName": "Judul kartu masa lalu",
      "subtitle": "Awal Selera Tontonan",
      "linkedTitle": "Salah satu judul di watchlist user",
      "reading": "2 kalimat santai tentang kenapa user suka tipe cerita di judul tersebut",
      "keyword": "Fondasi Genre"
    },
    {
      "position": "THE PRESENT",
      "roman": "XIV",
      "arcanaName": "Judul kartu masa kini",
      "subtitle": "Selera Saat Ini",
      "linkedTitle": "Judul terbaru di watchlist user",
      "reading": "2 kalimat natural tentang suasana cerita yang lagi dicari user belakangan ini",
      "keyword": "Fokus Sekarang"
    },
    {
      "position": "THE FUTURE",
      "roman": "XXI",
      "arcanaName": "Tontonan Berikutnya",
      "subtitle": "Rekomendasi Paling Pas",
      "linkedTitle": "Judul anime rekomendasi (yang belum ada di watchlist)",
      "destinedMalId": 9253,
      "destinedScore": 9.07,
      "reading": "2 kalimat alasan kenapa anime ini cocok ditonton selanjutnya",
      "keyword": "Kecocokan: 98%"
    }
  ]
}`;

      const userSummary = `Watchlist Titles: ${titles.slice(0, 10).join(', ')}. Top Genres: ${topGenres
        .slice(0, 5)
        .join(', ')}. Avg Score: ${averageRating}/10. Total Logged: ${items.length}.`;

      let tarot = null;
      try {
        const resp = await axios.post(
          'https://text.pollinations.ai/openai',
          {
            model: 'openai',
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userSummary }
            ]
          },
          { timeout: 9000 }
        );
        const content = resp.data?.choices?.[0]?.message?.content;
        if (content) tarot = JSON.parse(content);
      } catch (_) {
        tarot = null;
      }

      if (!tarot || !Array.isArray(tarot.cards) || tarot.cards.length < 3) {
        tarot = fallbackTarot;
      }

      return res.status(200).json({
        message: 'Anime Tarot Reading generated successfully',
        tarot
      });
    } catch (err) {
      next(err);
    }
  }

  static async roastWatchlist(req, res, next) {
    try {
      const { mode = 'roast' } = req.body || {};
      return res.status(200).json({
        message: 'Critique endpoint active',
        critique: { mode, headline: 'Tarot Oracle Active' }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ProfileController;
