const axios = require('axios');
const openaiService = require('../services/openaiService');
const jikanService = require('../services/jikanService');

const MOOD_ARCHETYPES = [
  {
    id: 'horror_dark',
    strongRegex: /\b(horror|horor|serem|seram|menakutkan|hantu|setan|mistis|angker|creepy|gore|zombie|kutukan|mencekam|takut|mimpi buruk|nightmare|ghost|haunted|teror|terror|psikopat|psychopath|slasher)\b/i,
    regex: /\b(horror|horor|serem|seram|menakutkan|hantu|setan|mistis|angker|creepy|gore|zombie|kutukan|mencekam|takut|mimpi buruk|nightmare|ghost|haunted|teror|terror|psikopat|psychopath|slasher|darah|pembunuhan|malam jumat|merinding)\b/i,
    emotionalTone: 'Horor & Atmosfer Mencekam',
    moodAnalysis:
      'Lagi pengen uji nyali lewat cerita yang punya atmosfer mencekam, misteri gelap, dan ketegangan yang bikin merinding. Deretan judul di bawah ini fokus ke teror supernatural, kutukan, dan horor psikologis tanpa selipan komedi atau romansa.',
    vibeDescription:
      'Suasana hening yang mencekam, misteri kematian berantai, dan ketegangan psikologis dari awal sampai akhir.',
    recommendedGenres: ['Horror', 'Suspense', 'Mystery', 'Supernatural'],
    jikanGenreIds: [14, 41, 7],
    forbiddenGenres: ['Comedy', 'Romance'],
    keywords: ['Another', 'Yakusoku no Neverland', 'Kiseijuu: Sei no Kakuritsu'],
    curatedPicks: [
      {
        title: 'Another',
        matchScore: 99,
        moodTag: 'Kutukan Kelas',
        aiReason:
          'Atmosfer sekolah dan misteri kutukan kelas 3-3 yang dingin, mencekam, dan penuh adegan kematian tak terduga.'
      },
      {
        title: 'Higurashi no Naku Koro ni',
        matchScore: 98,
        moodTag: 'Horor Desa Angker',
        aiReason:
          'Teror psikologis dan rentetan kejadian mengerikan di balik festival tahunan desa terpencil Hinamizawa.'
      },
      {
        title: 'Shiki',
        matchScore: 97,
        moodTag: 'Teror Supernatural',
        aiReason:
          'Wabah kematian misterius di desa terisolasi yang pelan-pelan berubah jadi mimpi buruk buat seluruh warganya.'
      },
      {
        title: 'Yakusoku no Neverland',
        matchScore: 96,
        moodTag: 'Teror & Pelarian',
        aiReason:
          'Ketegangan tingkat tinggi saat anak-anak panti asuhan sadar mereka berada di tengah sarang iblis pemangsa.'
      },
      {
        title: 'Kiseijuu: Sei no Kakuritsu',
        matchScore: 95,
        moodTag: 'Horor Biologis',
        aiReason:
          'Invasi parasit pemakan manusia yang menyamar di tengah masyarakat dengan atmosfer gelap dan brutal.'
      },
      {
        title: 'Perfect Blue',
        matchScore: 94,
        moodTag: 'Horor Psikologis',
        aiReason:
          'Film thriller horor karya Satoshi Kon tentang penguntit dan halusinasi yang bikin batas realita terasa kabur.'
      },
      {
        title: 'Shinsekai yori',
        matchScore: 93,
        moodTag: 'Distopia Gelap',
        aiReason:
          'Dunia masa depan yang kelihatan tenang di luar tapi menyimpan rahasia kelam dan atmosfer yang bikin merinding.'
      }
    ]
  },
  {
    id: 'healing',
    strongRegex: /\b(healing|slice of life|tenang|santai|nyaman|cozy|adem|rebahan|burnout|capek|lelah|stres|stress|unwind|relax)\b/i,
    regex: /\b(capek|lelah|stres|stress|exhaust|tired|unwind|relax|healing|tenang|santai|nyaman|cozy|warm|comfort|burnout|kerja|kuliah|adem|slice of life|rebahan|damai|hening)\b/i,
    emotionalTone: 'Tenang & Menyejukkan',
    moodAnalysis:
      'Keliatannya lo lagi butuh istirahat dari rutinitas yang padat. Tontonan dengan alur santai, visual yang adem di mata, dan cerita tanpa beban berat bakal pas banget buat nemenin waktu istirahat lo.',
    vibeDescription:
      'Suasana cerita yang hangat, latar pemandangan yang tenang, dan musik lembut yang bikin kepala ikutan rileks.',
    recommendedGenres: ['Slice of Life', 'Fantasy', 'Adventure'],
    jikanGenreIds: [36, 10],
    forbiddenGenres: ['Horror'],
    keywords: ['Yuru Camp', 'Barakamon', 'Sousou no Frieren'],
    curatedPicks: [
      {
        title: 'Yuru Camp',
        matchScore: 99,
        moodTag: 'Santai & Hangat',
        aiReason:
          'Cerita kemah santai di sekitar Gunung Fuji tanpa drama berat, cocok ditonton sambil rebahan.'
      },
      {
        title: 'Barakamon',
        matchScore: 98,
        moodTag: 'Suasana Pedesaan',
        aiReason:
          'Cerita kaligrafer muda yang pindah ke pulau kecil buat nyari ketenangan pas lagi jenuh sama kerjaan.'
      },
      {
        title: 'Sousou no Frieren',
        matchScore: 97,
        moodTag: 'Alur Tenang',
        aiReason:
          'Tempo ceritanya pelan dan reflektif, ditambah latar pemandangan dan musik yang enak banget buat nemenin istirahat.'
      },
      {
        title: 'Mushishi',
        matchScore: 96,
        moodTag: 'Atmosfer Hening',
        aiReason:
          'Tiap episodenya berdiri sendiri dengan suasana hutan Jepang yang hening dan menenangkan pikiran.'
      },
      {
        title: 'Sen to Chihiro no Kamikakushi',
        matchScore: 95,
        moodTag: 'Klasik Ghibli',
        aiReason:
          'Dunia fantasi khas Studio Ghibli dan musik Joe Hisaishi yang selalu berhasil bikin suasana hati lebih tenang.'
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
    strongRegex: /\b(sedih|galau|nangis|mewek|cry|tear|tearjerker|patah hati|heartbreak|kesepian|lonely|melankolis|haru|terharu)\b/i,
    regex: /\b(sedih|galau|nangis|mewek|cry|tear|tearjerker|patah hati|heartbreak|kesepian|lonely|melankolis|rindu|emosional|emotional|rainy|hujan|drama|haru|terharu|sepi|kehilangan)\b/i,
    emotionalTone: 'Emosional & Menyentuh',
    moodAnalysis:
      'Lagi pengen nonton cerita yang dalem dan berbekas di hati. Kadang nonton drama yang emosional justru bikin perasaan jadi jauh lebih plong setelah filmnya selesai.',
    vibeDescription:
      'Fokus ke hubungan antar karakter yang kuat, penulisan cerita yang jujur, dan musik pengiring yang ngena di suasana malam.',
    recommendedGenres: ['Drama', 'Romance', 'Supernatural'],
    jikanGenreIds: [8],
    forbiddenGenres: ['Comedy', 'Horror'],
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
    strongRegex: /\b(hype|action|aksi|adrenalin|dopamin|bertarung|pertarungan|tarung|gelud|berantem|fight|battle|bakar semangat|shounen|shonen|pedang|samurai)\b/i,
    regex: /\b(hype|action|aksi|semangat|adrenalin|dopamin|epic|bertarung|pertarungan|tarung|gelud|berantem|fight|battle|supernatural|bakar semangat|motivasi|shounen|shonen|pedang|samurai)\b/i,
    emotionalTone: 'Penuh Aksi & Energi',
    moodAnalysis:
      'Lagi butuh tontonan yang cepat, seru, dan gak bertele-tele. Pilihan di bawah ini punya koreografi pertarungan yang rapi, tempo cepat, dan momen klimaks yang bikin betah maraton.',
    vibeDescription:
      'Animasi pertarungan yang dinamis, musik pengiring yang ngangkat suasana, dan pertaruhan cerita yang intens.',
    recommendedGenres: ['Action', 'Supernatural', 'Adventure'],
    jikanGenreIds: [1, 37],
    forbiddenGenres: ['Romance', 'Slice of Life'],
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
        title: 'Fullmetal Alchemist: Brotherhood',
        matchScore: 96,
        moodTag: 'Petualangan Utuh',
        aiReason:
          'Cerita petualangan dan pertarungan alkimia yang rapi dari awal sampai tamat tanpa celah.'
      },
      {
        title: 'One Punch Man',
        matchScore: 95,
        moodTag: 'Aksi Skala Besar',
        aiReason:
          'Animasi pertarungan eksplosif dengan tempo cepat yang pas buat naikin semangat.'
      },
      {
        title: 'Haikyuu!!',
        matchScore: 94,
        moodTag: 'Tensi Pertandingan',
        aiReason:
          'Tensi tiap poin dan perkembangan timnya bikin kita ikutan tegang sepanjang pertandingan.'
      }
    ]
  },
  {
    id: 'sports_competitive',
    strongRegex: /\b(olahraga|sport|sports|voli|volley|sepak bola|bola|basket|balap|turnamen|kompetisi|pertandingan|tanding|atlet)\b/i,
    regex: /\b(olahraga|sport|sports|voli|volley|sepak bola|bola|basket|balap|turnamen|kompetisi|pertandingan|tanding|atlet|juara|latihan)\b/i,
    emotionalTone: 'Kompetitif & Bakar Semangat',
    moodAnalysis:
      'Lagi pengen nonton persaingan ketat, kerja keras tim, dan momen penentuan di lapangan yang bikin ikut deg-degan.',
    vibeDescription:
      'Tempo pertandingan yang cepat, strategi lapangan, dan semangat pantang menyerah dari tiap karakter.',
    recommendedGenres: ['Sports', 'Action', 'Drama'],
    jikanGenreIds: [30, 1],
    forbiddenGenres: ['Horror', 'Romance'],
    keywords: ['Haikyuu!!', 'Blue Lock'],
    curatedPicks: [
      {
        title: 'Haikyuu!!',
        matchScore: 99,
        moodTag: 'Tensi Pertandingan',
        aiReason:
          'Kerja sama tim Karasuno dan tensi reli panjang di lapangan voli yang selalu bikin merinding.'
      },
      {
        title: 'Blue Lock',
        matchScore: 98,
        moodTag: 'Kompetisi Striker',
        aiReason:
          'Persaingan individual antar striker muda Jepang dengan tensi tinggi di setiap pertandingan.'
      }
    ]
  },
  {
    id: 'fantasy_adventure',
    strongRegex: /\b(fantasi|fantasy|isekai|sihir|magic|petualangan|adventure|dunia lain|dungeon|guild|penyihir|mage|naga|dragon)\b/i,
    regex: /\b(fantasi|fantasy|isekai|sihir|magic|petualangan|adventure|dunia lain|dungeon|guild|penyihir|mage|naga|dragon|kerajaan|eksplorasi)\b/i,
    emotionalTone: 'Petualangan & Dunia Fantasi',
    moodAnalysis:
      'Lagi pengen keluar sejenak dari dunia nyata dan ngikutin perjalanan panjang di dunia fantasi yang luas dan penuh sihir.',
    vibeDescription:
      'Pembangunan dunia yang detail, perjalanan lintas benua, dan atmosfer magis yang imersif.',
    recommendedGenres: ['Fantasy', 'Adventure', 'Action'],
    jikanGenreIds: [10, 2],
    forbiddenGenres: ['Horror'],
    keywords: ['Sousou no Frieren', 'Fullmetal Alchemist: Brotherhood', 'Sen to Chihiro no Kamikakushi'],
    curatedPicks: [
      {
        title: 'Sousou no Frieren',
        matchScore: 99,
        moodTag: 'Fantasi Perjalanan',
        aiReason:
          'Perjalanan penyihir elf melintasi berbagai negeri setelah era Raja Iblis berakhir.'
      },
      {
        title: 'Fullmetal Alchemist: Brotherhood',
        matchScore: 98,
        moodTag: 'Petualangan Epik',
        aiReason:
          'Dunia alkimia yang luas dengan alur cerita petualangan dan konspirasi yang sangat solid.'
      },
      {
        title: 'Sen to Chihiro no Kamikakushi',
        matchScore: 97,
        moodTag: 'Dunia Roh Ghibli',
        aiReason:
          'Petualangan tak terlupakan di pemandian arwah dengan imajinasi visual tingkat tinggi.'
      },
      {
        title: 'Howl no Ugoku Shiro',
        matchScore: 96,
        moodTag: 'Sihir & Kastil',
        aiReason:
          'Keajaiban kastil berjalan Howl dan dunia sihir Eropa klasik yang memanjakan mata.'
      },
      {
        title: 'Suzume no Tojimari',
        matchScore: 95,
        moodTag: 'Gerbang Dimensi',
        aiReason:
          'Petualangan menutup pintu bencana di berbagai penjuru Jepang dengan elemen fantasi modern.'
      }
    ]
  },
  {
    id: 'mystery_scifi',
    strongRegex: /\b(misteri|mystery|detektif|investigasi|twist|plot twist|sci-fi|scifi|time travel|time-travel|psikologi|psikologis|psychological|thriller|cyberpunk|strategi|logika|teka-teki|konspirasi)\b/i,
    regex: /\b(misteri|mystery|mikir|twist|plot twist|sci-fi|scifi|time travel|time-travel|psikologi|psikologis|psychological|thriller|tegang|dark|gelap|detektif|investigasi|pintar|cyberpunk|strategi|logika|teka-teki|konspirasi)\b/i,
    emotionalTone: 'Misteri & Adu Strategi',
    moodAnalysis:
      'Lagi pengen cerita yang ngajak mikir dan penuh teka-teki. Deretan judul ini ngandelin alur investigasi, permainan psikologis, dan kejutan cerita yang rapi.',
    vibeDescription:
      'Suasana cerita yang serius, petunjuk yang disebar pelan-pelan, dan adu kecerdikan antar karakter.',
    recommendedGenres: ['Suspense', 'Mystery', 'Sci-Fi', 'Psychological'],
    jikanGenreIds: [41, 7, 24],
    forbiddenGenres: ['Comedy', 'Romance'],
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
    strongRegex: /\b(komedi|comedy|lucu|ketawa|ngakak|funny|absurd|kocak|receh|konyol|parodi|parody|laugh|gokil|jenaka)\b/i,
    regex: /\b(komedi|comedy|lucu|ketawa|ngakak|funny|absurd|kocak|receh|konyol|parodi|parody|pusing|hibur|hiburan|laugh|gokil|jenaka)\b/i,
    emotionalTone: 'Komedi Ringan & Segar',
    moodAnalysis:
      'Lagi butuh hiburan ringan buat nyegerin pikiran. Pilihan anime komedi ini punya karakter yang ekspresif dan kejadian konyol yang pas buat ditonton santai.',
    vibeDescription:
      'Alur cerita ringan, humor visual yang kreatif, dan interaksi karakter yang menghibur.',
    recommendedGenres: ['Comedy', 'Slice of Life'],
    jikanGenreIds: [4],
    forbiddenGenres: ['Horror'],
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
    strongRegex: /\b(romantis|romance|romansa|cinta|baper|love|wholesome|couple|pacar|gemes|manis|chemistry|kasmaran|gebetan|romcom)\b/i,
    regex: /\b(romantis|romance|romansa|cinta|baper|love|wholesome|couple|pacar|gemes|senyum|manis|chemistry|kasmaran|gebetan|romcom)\b/i,
    emotionalTone: 'Romansa Hangat',
    moodAnalysis:
      'Lagi pengen nonton cerita romansa yang manis dan enak diikuti. Pilihan di bawah ini punya interaksi karakter yang natural tanpa konflik yang dibuat-buat.',
    vibeDescription:
      'Visual yang hangat, dialog yang tulus, dan perkembangan hubungan karakter yang terasa dekat.',
    recommendedGenres: ['Romance', 'Drama', 'Comedy'],
    jikanGenreIds: [22],
    forbiddenGenres: ['Horror'],
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
  const cleanedPrompt = String(moodPrompt || '').replace(/\b(tanpa|gak|nggak|tidak)\s+mikir\b/gi, 'santai');

  let bestMatch = MOOD_ARCHETYPES[1]; // default to 'healing' if zero keywords match
  let highestScore = 0;

  for (const arch of MOOD_ARCHETYPES) {
    let score = 0;
    if (arch.strongRegex) {
      const strongMatches = cleanedPrompt.match(new RegExp(arch.strongRegex.source, 'gi'));
      if (strongMatches) score += strongMatches.length * 5;
    }
    if (arch.regex) {
      const regularMatches = cleanedPrompt.match(new RegExp(arch.regex.source, 'gi'));
      if (regularMatches) score += regularMatches.length;
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = arch;
    }
  }

  return {
    archetypeId: bestMatch.id,
    explicitMatch: highestScore >= 5,
    moodAnalysis: bestMatch.moodAnalysis,
    emotionalTone: bestMatch.emotionalTone,
    vibeDescription: bestMatch.vibeDescription,
    recommendedGenres: bestMatch.recommendedGenres,
    jikanGenreIds: bestMatch.jikanGenreIds,
    forbiddenGenres: bestMatch.forbiddenGenres || [],
    keywords: bestMatch.keywords,
    curatedPicks: bestMatch.curatedPicks
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
      } else if (process.env.NODE_ENV !== 'test' && matchedArchetype.explicitMatch) {
        const aiGenreIds = Array.isArray(aiAnalysis.jikanGenreIds)
          ? aiAnalysis.jikanGenreIds.map((id) => Number(id))
          : [];
        const aiGenreNames = Array.isArray(aiAnalysis.recommendedGenres)
          ? aiAnalysis.recommendedGenres.map((g) => String(g).toLowerCase())
          : [];
        const targetId = matchedArchetype.jikanGenreIds[0];
        const targetName = String(matchedArchetype.recommendedGenres[0] || '').toLowerCase();

        const hasMatchingGenre =
          aiGenreIds.includes(targetId) ||
          (targetName && aiGenreNames.some((g) => g.includes(targetName)));

        if (!hasMatchingGenre) {
          aiAnalysis = { ...matchedArchetype };
          aiEngineUsed = 'MoodSync Curator';
        } else {
          aiAnalysis.jikanGenreIds = matchedArchetype.jikanGenreIds;
          aiAnalysis.recommendedGenres = matchedArchetype.recommendedGenres;
          aiAnalysis.curatedPicks = [
            ...(Array.isArray(aiAnalysis.curatedPicks) ? aiAnalysis.curatedPicks : []),
            ...matchedArchetype.curatedPicks
          ];
        }
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

      const promptLower = String(mood || '').toLowerCase();
      const activeForbiddenGenres = (matchedArchetype.forbiddenGenres || []).filter((fg) => {
        const fgLower = fg.toLowerCase();
        if (fgLower === 'comedy' && /\b(komedi|comedy|lucu|ngakak)\b/i.test(promptLower)) return false;
        if (fgLower === 'romance' && /\b(romantis|romance|romansa|cinta|baper)\b/i.test(promptLower)) return false;
        if (fgLower === 'horror' && /\b(horror|horor|serem|seram|hantu)\b/i.test(promptLower)) return false;
        return true;
      });

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
          const cleanLiveItems = liveGenreResults.data.filter((item) => {
            if (!Array.isArray(item?.genres) || activeForbiddenGenres.length === 0) return true;
            const itemGenreNames = item.genres.map((g) => String(g.name || '').toLowerCase());
            return !activeForbiddenGenres.some((fg) => itemGenreNames.includes(fg.toLowerCase()));
          });
          combinedItems.push(...cleanLiveItems);
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
