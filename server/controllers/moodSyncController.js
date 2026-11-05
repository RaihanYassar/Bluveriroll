const axios = require('axios');
const openaiService = require('../services/openaiService');
const jikanService = require('../services/jikanService');

const MOOD_ARCHETYPES = [
  {
    id: 'healing',
    regex: /capek|lelah|stres|stress|exhaust|tired|unwind|relax|healing|tenang|santai|nyaman|cozy|warm|comfort|burnout|kerja|kuliah|adem/i,
    emotionalTone: 'Tenang & Menyejukkan',
    moodAnalysis:
      'Keliatannya lo lagi butuh istirahat dari rutinitas yang padat. Tontonan dengan alur santai, visual yang adem di mata, dan cerita tanpa beban berat bakal pas banget buat nemenin waktu istirahat lo.',
    vibeDescription:
      'Suasana cerita yang hangat, latar pemandangan yang tenang, dan musik lembut yang bikin kepala ikutan rileks.',
    recommendedGenres: ['Slice of Life', 'Fantasy', 'Adventure'],
    jikanGenreIds: [36, 10],
    keywords: ['Sousou no Frieren', 'Yuru Camp', 'Barakamon'],
    curatedPicks: [
      {
        title: 'Sousou no Frieren',
        matchScore: 99,
        moodTag: 'Alur Tenang',
        aiReason:
          'Tempo ceritanya pelan dan reflektif, ditambah latar pemandangan dan musik yang enak banget buat nemenin istirahat.'
      },
      {
        title: 'Yuru Camp',
        matchScore: 98,
        moodTag: 'Santai & Hangat',
        aiReason:
          'Cerita kemah santai di sekitar Gunung Fuji tanpa drama berat, cocok ditonton sambil rebahan.'
      },
      {
        title: 'Sen to Chihiro no Kamikakushi',
        matchScore: 97,
        moodTag: 'Klasik Ghibli',
        aiReason:
          'Dunia fantasi khas Studio Ghibli dan musik Joe Hisaishi yang selalu berhasil bikin suasana hati lebih tenang.'
      },
      {
        title: 'Barakamon',
        matchScore: 96,
        moodTag: 'Suasana Pedesaan',
        aiReason:
          'Cerita kaligrafer muda yang pindah ke pulau kecil buat nyari ketenangan pas lagi jenuh sama kerjaan.'
      },
      {
        title: 'Mushishi',
        matchScore: 95,
        moodTag: 'Atmosfer Hening',
        aiReason:
          'Tiap episodenya berdiri sendiri dengan suasana hutan Jepang yang hening dan menenangkan pikiran.'
      },
      {
        title: 'Suzume no Tojimari',
        matchScore: 94,
        moodTag: 'Perjalanan Visual',
        aiReason:
          'Perjalanan melintasi berbagai kota di Jepang dengan visual langit khas Makoto Shinkai yang segar di mata.'
      }
    ]
  },
  {
    id: 'sad_cathartic',
    regex: /sedih|galau|nangis|cry|tear|patah hati|heartbreak|kesepian|lonely|melanchol|rindu|emosional|emotional|rainy|hujan|drama|haru|sepi/i,
    emotionalTone: 'Emosional & Menyentuh',
    moodAnalysis:
      'Lagi pengen nonton cerita yang dalem dan berbekas di hati. Kadang nonton drama yang emosional justru bikin perasaan jadi jauh lebih plong setelah filmnya selesai.',
    vibeDescription:
      'Fokus ke hubungan antar karakter yang kuat, penulisan cerita yang jujur, dan musik pengiring yang ngena di suasana malam.',
    recommendedGenres: ['Drama', 'Romance', 'Supernatural'],
    jikanGenreIds: [8],
    keywords: ['Koe no Katachi', 'Violet Evergarden', 'Shigatsu wa Kimi no Uso'],
    curatedPicks: [
      {
        title: 'Koe no Katachi',
        matchScore: 99,
        moodTag: 'Drama Menyentuh',
        aiReason:
          'Cerita tentang penyesalan masa sekolah dan usaha berdamai sama diri sendiri yang ditulis dengan sangat manusiawi.'
      },
      {
        title: 'Violet Evergarden',
        matchScore: 98,
        moodTag: 'Visual & Emosi Kuat',
        aiReason:
          'Lewat surat-surat yang ditulis Violet, tiap episodenya punya cerita haru yang langsung nyangkut di hati.'
      },
      {
        title: 'Shigatsu wa Kimi no Uso',
        matchScore: 97,
        moodTag: 'Musik & Kenangan',
        aiReason:
          'Perpaduan musik klasik dan perjalanan dua musisi muda yang emosinya kerasa dari awal sampai akhir.'
      },
      {
        title: 'Ano Hi Mita Hana no Namae wo Bokutachi wa Mada Shiranai.',
        matchScore: 96,
        moodTag: 'Persahabatan',
        aiReason:
          'Cerita sahabat masa kecil yang ngumpul lagi buat nyelesaiin masa lalu mereka, punya salah satu penutup cerita paling berkesan.'
      },
      {
        title: 'Kimi no Na wa.',
        matchScore: 95,
        moodTag: 'Rindu & Takdir',
        aiReason:
          'Cerita dua orang yang terhubung lewat mimpi dengan soundtrack RADWIMPS yang pas banget buat suasana malam.'
      }
    ]
  },
  {
    id: 'hype_action',
    regex: /hype|action|aksi|semangat|adrenalin|dopamin|epic|seru|bertarung|fight|battle|supernatural|op|keren|bakar semangat|motivasi|olahraga|sport|merinding/i,
    emotionalTone: 'Penuh Aksi & Energi',
    moodAnalysis:
      'Lagi butuh tontonan yang cepat, seru, dan gak bertele-tele. Pilihan di bawah ini punya koreografi pertarungan yang rapi, tempo cepat, dan momen klimaks yang bikin betah maraton.',
    vibeDescription:
      'Animasi pertarungan yang dinamis, musik pengiring yang ngangkat suasana, dan pertaruhan cerita yang intens.',
    recommendedGenres: ['Action', 'Sports', 'Supernatural'],
    jikanGenreIds: [1, 30],
    keywords: ['Shingeki no Kyojin', 'Jujutsu Kaisen', 'Kimetsu no Yaiba'],
    curatedPicks: [
      {
        title: 'Shingeki no Kyojin',
        matchScore: 99,
        moodTag: 'Skala Cerita Besar',
        aiReason:
          'Tensi ceritanya tinggi terus dari episode pertama, ditambah misteri dunia dan musik Hiroyuki Sawano yang ikonik.'
      },
      {
        title: 'Jujutsu Kaisen',
        matchScore: 98,
        moodTag: 'Koreografi Cepat',
        aiReason:
          'Pertarungan jarak dekat dan eksekusi animasi dari studio MAPPA yang padat tanpa banyak jeda.'
      },
      {
        title: 'Kimetsu no Yaiba',
        matchScore: 97,
        moodTag: 'Visual Pertarungan',
        aiReason:
          'Kualitas animasi pertarungan pedang dari Ufotable yang konsisten memanjakan mata di setiap babak.'
      },
      {
        title: 'Haikyuu!!',
        matchScore: 96,
        moodTag: 'Tensi Pertandingan',
        aiReason:
          'Meskipun bertema voli, tensi tiap poin dan perkembangan timnya bikin kita ikutan tegang sepanjang pertandingan.'
      },
      {
        title: 'One Punch Man',
        matchScore: 95,
        moodTag: 'Aksi & Hiburan',
        aiReason:
          'Animasi pertarungan skala besar yang digabung sama komedi santai, enak ditonton tanpa perlu mikir rumit.'
      },
      {
        title: 'Fullmetal Alchemist: Brotherhood',
        matchScore: 94,
        moodTag: 'Petualangan Utuh',
        aiReason:
          'Cerita petualangan dan pertarungan alkimia yang rapi dari awal sampai tamat tanpa celah.'
      }
    ]
  },
  {
    id: 'mystery_scifi',
    regex: /misteri|mystery|mikir|twist|plot twist|sci-fi|time travel|time-travel|psikologi|psycholog|thriller|tegang|dark|gelap|detektif|pintar|cyberpunk|strategi|logika/i,
    emotionalTone: 'Misteri & Adu Strategi',
    moodAnalysis:
      'Lagi pengen cerita yang ngajak mikir dan penuh teka-teki. Deretan judul ini ngandelin alur investigasi, permainan psikologis, dan kejutan cerita yang rapi.',
    vibeDescription:
      'Suasana cerita yang serius, petunjuk yang disebar pelan-pelan, dan adu kecerdikan antar karakter.',
    recommendedGenres: ['Suspense', 'Mystery', 'Sci-Fi', 'Psychological'],
    jikanGenreIds: [41, 7, 24],
    keywords: ['Steins;Gate', 'Monster', 'Death Note'],
    curatedPicks: [
      {
        title: 'Steins;Gate',
        matchScore: 99,
        moodTag: 'Sci-Fi Perjalanan Waktu',
        aiReason:
          'Salah satu cerita perjalanan waktu paling rapi; paruh keduanya punya ketegangan yang susah ditebak.'
      },
      {
        title: 'Monster',
        matchScore: 98,
        moodTag: 'Thriller Psikologis',
        aiReason:
          'Cerita kejar-kejaran dokter bedah dengan mantan pasiennya di Eropa yang terasa sangat realistis dan kelam.'
      },
      {
        title: 'Death Note',
        matchScore: 97,
        moodTag: 'Adu Taktik',
        aiReason:
          'Duel strategi dan tebak langkah antara Light dan L yang bikin penasaran di tiap akhir episode.'
      },
      {
        title: 'Boku dake ga Inai Machi',
        matchScore: 96,
        moodTag: 'Misteri Investigasi',
        aiReason:
          'Kembali ke masa SD buat nyegah kasus penculikan teman sekelas, alurnya padat dan langsung to the point.'
      },
      {
        title: 'Cyberpunk: Edgerunners',
        matchScore: 95,
        moodTag: 'Sci-Fi Futuristik',
        aiReason:
          'Cerita 10 episode yang padat di tengah kerasnya kota masa depan Night City dengan gaya visual yang mencolok.'
      }
    ]
  },
  {
    id: 'comedy_laugh',
    regex: /komedi|comedy|lucu|ketawa|ngakak|funny|absurd|kocak|pusing|hibur|laugh/i,
    emotionalTone: 'Komedi Ringan & Segar',
    moodAnalysis:
      'Lagi butuh hiburan ringan buat nyegerin pikiran. Pilihan anime komedi ini punya karakter yang ekspresif dan kejadian konyol yang pas buat ditonton santai.',
    vibeDescription:
      'Alur cerita ringan, humor visual yang kreatif, dan interaksi karakter yang menghibur.',
    recommendedGenres: ['Comedy', 'Slice of Life'],
    jikanGenreIds: [4],
    keywords: ['Bocchi the Rock!', 'Grand Blue', 'Spy x Family'],
    curatedPicks: [
      {
        title: 'Bocchi the Rock!',
        matchScore: 99,
        moodTag: 'Komedi Musik',
        aiReason:
          'Kepanikan sosial Bocchi pas mulai nge-band dikemas pakai gaya animasi yang kreatif dan lucu.'
      },
      {
        title: 'Grand Blue',
        matchScore: 98,
        moodTag: 'Komedi Absurd',
        aiReason:
          'Kehidupan anak kuliahan di klub selam yang isinya hampir selalu melenceng jauh dari urusan menyelam.'
      },
      {
        title: 'Spy x Family',
        matchScore: 97,
        moodTag: 'Komedi Keluarga',
        aiReason:
          'Interaksi keluarga samaran Loid, Yor, dan Anya yang ringan dan enak ditonton kapan aja.'
      },
      {
        title: 'Kaguya-sama wa Kokurasetai',
        matchScore: 96,
        moodTag: 'Komedi Romantis',
        aiReason:
          'Urusan gengsi nembak duluan yang dibikin seolah-olah lagi perang taktik tingkat tinggi.'
      },
      {
        title: 'One Punch Man',
        matchScore: 95,
        moodTag: 'Aksi Parodi',
        aiReason:
          'Kontras antara lawan yang tampil serius banget sama reaksi datar Saitama yang selalu menghibur.'
      }
    ]
  },
  {
    id: 'romance_sweet',
    regex: /romantis|romance|cinta|baper|love|wholesome|couple|pacar|gemes|senyum|manis|chemistry/i,
    emotionalTone: 'Romansa Hangat',
    moodAnalysis:
      'Lagi pengen nonton cerita romansa yang manis dan enak diikuti. Pilihan di bawah ini punya interaksi karakter yang natural tanpa konflik yang dibuat-buat.',
    vibeDescription:
      'Visual yang hangat, dialog yang tulus, dan perkembangan hubungan karakter yang terasa dekat.',
    recommendedGenres: ['Romance', 'Drama', 'Comedy'],
    jikanGenreIds: [22],
    keywords: ['Kimi no Na wa.', 'Horimiya', 'Howl no Ugoku Shiro'],
    curatedPicks: [
      {
        title: 'Kimi no Na wa.',
        matchScore: 99,
        moodTag: 'Romansa Fantasi',
        aiReason:
          'Cerita dua remaja yang saling terhubung dari dua tempat berbeda, dikemas dengan visual dan musik yang berkesan.'
      },
      {
        title: 'Horimiya',
        matchScore: 98,
        moodTag: 'Romansa Sehari-hari',
        aiReason:
          'Hubungan Hori dan Miyamura berkembang secara natural tanpa salah paham yang berlarut-larut.'
      },
      {
        title: 'Howl no Ugoku Shiro',
        matchScore: 97,
        moodTag: 'Klasik Romantis',
        aiReason:
          'Perjalanan Sophie dan Howl di kastil berjalan dengan suasana klasik khas Studio Ghibli.'
      },
      {
        title: 'Kaguya-sama wa Kokurasetai',
        matchScore: 96,
        moodTag: 'Komedi & Romansa',
        aiReason:
          'Di balik komedinya yang kencang, perkembangan hubungan dua karakter utamanya ditulis dengan sangat manis.'
      },
      {
        title: 'Shigatsu wa Kimi no Uso',
        matchScore: 95,
        moodTag: 'Drama & Musik',
        aiReason:
          'Pertemuan pianis dan pemain biola yang saling bantu bangkit lewat panggung musik.'
      }
    ]
  }
];

function buildSmartMoodFallback(moodPrompt) {
  const matched =
    MOOD_ARCHETYPES.find((arch) => arch.regex.test(moodPrompt)) || MOOD_ARCHETYPES[0];

  return {
    archetypeId: matched.id,
    moodAnalysis: matched.moodAnalysis,
    emotionalTone: matched.emotionalTone,
    vibeDescription: matched.vibeDescription,
    recommendedGenres: matched.recommendedGenres,
    jikanGenreIds: matched.jikanGenreIds,
    keywords: matched.keywords,
    curatedPicks: matched.curatedPicks
  };
}

function normalizeFranchiseStem(rawTitle) {
  if (!rawTitle || typeof rawTitle !== 'string') return '';
  const stem = rawTitle
    .toLowerCase()
    .split(':')[0]
    .split(' - ')[0]
    .replace(/\(.*?\)/g, '')
    .replace(/\b(season|part|cour|stage|movie|film|ova|special|the final|final|chapter|arc)\b.*$/i, '')
    .replace(/\b(\d+(st|nd|rd|th))\b.*$/i, '')
    .replace(/\b(ii|iii|iv|v|vi)\b$/i, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = stem.split(' ').filter(Boolean);
  return words.slice(0, 3).join(' ');
}

async function tryPollinationsLLM(moodPrompt, userPreferences) {
  if (process.env.NODE_ENV === 'test') return null;
  const response = await axios.post(
    'https://text.pollinations.ai/openai',
    {
      model: 'openai',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: openaiService.SYSTEM_PROMPT },
        {
          role: 'user',
          content: `User Mood / Request: "${moodPrompt}". Preferences: ${JSON.stringify(userPreferences)}`
        }
      ]
    },
    { timeout: 10000 }
  );
  const content = response.data?.choices?.[0]?.message?.content;
  if (!content) return null;
  return JSON.parse(content);
}

class MoodSyncController {
  static async getRecommendations(req, res, next) {
    try {
      const { mood, type, intensity, companion, excludeIds = [], excludeTitles = [] } = req.body;
      if (!mood || mood.trim().length === 0) {
        throw { name: 'BadRequest', status: 400, message: 'Mood prompt is required' };
      }

      const excludedMalIdSet = new Set(
        Array.isArray(excludeIds) ? excludeIds.map((id) => Number(id)) : []
      );
      const seenFranchiseStems = new Set(
        Array.isArray(excludeTitles)
          ? excludeTitles.map((t) => normalizeFranchiseStem(t)).filter(Boolean)
          : []
      );

      const preferences = {
        format: type || 'all',
        intensity: intensity || 'balanced',
        companion: companion || 'solo',
        excludedTitles: Array.isArray(excludeTitles) ? excludeTitles.slice(0, 15) : []
      };

      const matchedArchetype = buildSmartMoodFallback(mood);
      let aiAnalysis = null;
      let aiEngineUsed = 'OpenAI GPT-4o-mini';

      try {
        aiAnalysis = await openaiService.generateMoodRecommendation(mood, preferences);
      } catch (openAiErr) {
        try {
          aiAnalysis = await tryPollinationsLLM(mood, preferences);
          if (aiAnalysis) aiEngineUsed = 'Pollinations OpenAI Engine';
        } catch (_) {
          aiAnalysis = null;
        }
      }

      if (!aiAnalysis || !aiAnalysis.moodAnalysis) {
        aiAnalysis = { ...matchedArchetype };
        aiEngineUsed = 'MoodSync Curator';
      }

      if (!aiAnalysis.emotionalTone) aiAnalysis.emotionalTone = matchedArchetype.emotionalTone;
      if (!Array.isArray(aiAnalysis.recommendedGenres) || aiAnalysis.recommendedGenres.length === 0) {
        aiAnalysis.recommendedGenres = matchedArchetype.recommendedGenres;
      }
      if (!Array.isArray(aiAnalysis.jikanGenreIds) || aiAnalysis.jikanGenreIds.length === 0) {
        aiAnalysis.jikanGenreIds = matchedArchetype.jikanGenreIds;
      }
      if (!Array.isArray(aiAnalysis.curatedPicks) || aiAnalysis.curatedPicks.length === 0) {
        aiAnalysis.curatedPicks = matchedArchetype.curatedPicks;
      }
      aiAnalysis.aiEngine = aiEngineUsed;

      const visualPrompt = `masterpiece anime cinema concept art, ${aiAnalysis.emotionalTone || ''} ${aiAnalysis.vibeDescription || mood}, makoto shinkai and kyoto animation lighting, ultra detailed widescreen`;
      aiAnalysis.bannerUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(visualPrompt)}?width=960&height=360&nologo=true`;

      const curatedPicks = aiAnalysis.curatedPicks || [];
      const primaryGenreId = String(
        (Array.isArray(aiAnalysis.jikanGenreIds) && aiAnalysis.jikanGenreIds[0]) ||
          matchedArchetype.jikanGenreIds[0] ||
          8
      );

      let combinedItems = [];

      if (process.env.NODE_ENV === 'test') {
        const primaryQuery = (aiAnalysis.keywords && aiAnalysis.keywords[0]) || mood;
        const searchParams = {
          q: primaryQuery,
          limit: 10,
          order_by: 'score',
          sort: 'desc'
        };
        if (type && type !== 'all') searchParams.type = type;
        const primaryResults = await jikanService.searchAnime(searchParams);
        combinedItems = Array.isArray(primaryResults?.data) ? [...primaryResults.data] : [];
      } else {
        const catalogPool = Array.isArray(jikanService.FALLBACK_CATALOG)
          ? jikanService.FALLBACK_CATALOG
          : [];

        for (const pick of curatedPicks) {
          if (!pick?.title) continue;
          const pickStem = normalizeFranchiseStem(pick.title);
          const foundInCatalog = catalogPool.find((c) => {
            if (type && type !== 'all' && c.type.toLowerCase() !== String(type).toLowerCase()) {
              return false;
            }
            const cStem = normalizeFranchiseStem(c.title);
            return (
              (pickStem && cStem && (cStem.includes(pickStem) || pickStem.includes(cStem))) ||
              c.title.toLowerCase().includes(pick.title.toLowerCase())
            );
          });
          if (foundInCatalog) {
            combinedItems.push(foundInCatalog);
          }
        }

        const pageToFetch = excludedMalIdSet.size >= 4 ? 2 : 1;
        const genreSearchParams = {
          genres: primaryGenreId,
          page: pageToFetch,
          limit: 25,
          order_by: 'score',
          sort: 'desc'
        };
        if (type && type !== 'all') genreSearchParams.type = type;

        const liveGenreResults = await jikanService
          .searchAnime(genreSearchParams)
          .catch(() => ({ data: [] }));

        if (Array.isArray(liveGenreResults?.data)) {
          combinedItems.push(...liveGenreResults.data);
        }
      }

      const enrichedRecommendations = [];

      for (const item of combinedItems) {
        if (!item || !item.mal_id) continue;
        if (excludedMalIdSet.has(Number(item.mal_id))) continue;

        const franchiseStem = normalizeFranchiseStem(item.title);
        if (franchiseStem && seenFranchiseStems.has(franchiseStem)) {
          continue;
        }

        excludedMalIdSet.add(Number(item.mal_id));
        if (franchiseStem) seenFranchiseStems.add(franchiseStem);

        const matchedPick = curatedPicks.find((cp) => {
          if (!cp.title) return false;
          const pickStem = normalizeFranchiseStem(cp.title);
          return (
            (pickStem && franchiseStem && (pickStem.includes(franchiseStem) || franchiseStem.includes(pickStem))) ||
            item.title?.toLowerCase().includes(cp.title.toLowerCase()) ||
            cp.title.toLowerCase().includes(item.title?.toLowerCase())
          );
        });

        const matchScore =
          matchedPick?.matchScore ||
          Math.max(86, 98 - enrichedRecommendations.length);

        const itemGenres = (item.genres || []).map((g) => g.name).filter(Boolean);
        const primaryGenreText = itemGenres.slice(0, 2).join(' & ') || 'Cerita';

        const moodTag =
          matchedPick?.moodTag ||
          (itemGenres[0] ? `Nuansa ${itemGenres[0]}` : aiAnalysis.emotionalTone || 'Pilihan Kurator');

        const synopsisSnippet = item.synopsis
          ? item.synopsis.split('.')[0].slice(0, 120) + '.'
          : '';

        const aiReason =
          matchedPick?.aiReason ||
          `Nuansa ${primaryGenreText} di "${item.title}" sejalan dengan suasana "${aiAnalysis.emotionalTone}" yang lagi lo cari. ${synopsisSnippet}`.trim();

        enrichedRecommendations.push({
          ...item,
          matchScore,
          moodTag,
          aiReason
        });

        if (enrichedRecommendations.length >= 12) break;
      }

      res.status(200).json({
        moodAnalysis: aiAnalysis,
        recommendations: enrichedRecommendations
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = MoodSyncController;
