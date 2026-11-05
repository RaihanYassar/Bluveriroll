const axios = require('axios');
const dns = require('dns');

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const JIKAN_BASE_URL = (process.env.JIKAN_API_BASE_URL || 'https://api.jikan.moe/v4').replace(/\/$/, '');
const ANILIST_GRAPHQL_URL = 'https://graphql.anilist.co';

const jikanClient = axios.create({
  baseURL: JIKAN_BASE_URL,
  timeout: 8000,
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'Bluveriroll-Server/1.0'
  }
});

const GENRE_ID_TO_NAME = {
  1: 'Action',
  2: 'Adventure',
  4: 'Comedy',
  8: 'Drama',
  10: 'Fantasy',
  14: 'Horror',
  7: 'Mystery',
  22: 'Romance',
  24: 'Sci-Fi',
  36: 'Slice of Life',
  30: 'Sports',
  37: 'Supernatural',
  41: 'Suspense',
  46: 'Award Winning',
  47: 'Gourmet',
  18: 'Mecha',
  19: 'Music',
  40: 'Psychological',
  23: 'School'
};

const NAME_TO_GENRE_ID = Object.entries(GENRE_ID_TO_NAME).reduce((acc, [id, name]) => {
  acc[name.toLowerCase()] = Number(id);
  return acc;
}, {});

const FALLBACK_GENRES = Object.entries(GENRE_ID_TO_NAME).map(([id, name]) => ({
  mal_id: Number(id),
  name
}));

const buildStreamingLinks = (title) => {
  const encoded = encodeURIComponent(title);
  return [
    { name: 'YouTube (Muse Indonesia / Ani-One)', url: `https://www.youtube.com/results?search_query=${encoded}+full+episode+sub+indo` },
    { name: 'Bstation (Bilibili)', url: `https://www.bilibili.tv/id/search-result?q=${encoded}` },
    { name: 'Crunchyroll', url: `https://www.crunchyroll.com/search?q=${encoded}` },
    { name: 'Netflix', url: `https://www.netflix.com/search?q=${encoded}` },
    { name: 'iQIYI', url: `https://www.iq.com/search?query=${encoded}` }
  ];
};

const mapAniListToJikan = (item) => {
  const title = item.title?.romaji || item.title?.english || 'Untitled';
  const ytId = item.trailer?.site === 'youtube' ? item.trailer?.id : null;
  return {
    mal_id: item.idMal || item.id,
    title,
    title_japanese: item.title?.native || '',
    type: item.format === 'MOVIE' ? 'Movie' : item.format === 'TV' ? 'TV' : item.format || 'TV',
    episodes: item.episodes || 1,
    status: item.status === 'FINISHED' ? 'Finished Airing' : 'Currently Airing',
    duration: item.duration ? `${item.duration} min` : '24 min per ep',
    score: item.averageScore ? Number((item.averageScore / 10).toFixed(2)) : 8.5,
    year: item.seasonYear || 2023,
    synopsis: item.description ? item.description.replace(/<[^>]*>?/gm, '') : 'No synopsis available.',
    images: {
      jpg: {
        image_url: item.coverImage?.large || item.coverImage?.extraLarge,
        large_image_url: item.coverImage?.extraLarge || item.coverImage?.large
      }
    },
    trailer: {
      youtube_id: ytId,
      url: ytId ? `https://www.youtube.com/watch?v=${ytId}` : null,
      embed_url: ytId ? `https://www.youtube-nocookie.com/embed/${ytId}` : null
    },
    streaming: buildStreamingLinks(title),
    genres: (item.genres || []).map((name, idx) => ({
      mal_id: NAME_TO_GENRE_ID[String(name).toLowerCase()] || idx + 1,
      name
    }))
  };
};

const parseGenreIds = (genresParam) => {
  if (!genresParam) return [];
  return String(genresParam)
    .split(',')
    .map((id) => Number(id.trim()))
    .filter((id) => !Number.isNaN(id) && id > 0);
};

const fetchFromAniList = async (params = {}) => {
  if (typeof axios.post !== 'function') {
    throw new Error('axios.post unavailable in mock environment');
  }

  const page = Number(params.page) || 1;
  const perPage = Math.min(Number(params.limit) || 24, 50);
  const formatMap = {
    movie: 'MOVIE',
    tv: 'TV',
    ova: 'OVA',
    special: 'SPECIAL',
    ona: 'ONA'
  };
  const format = params.type && formatMap[String(params.type).toLowerCase()]
    ? formatMap[String(params.type).toLowerCase()]
    : undefined;

  // Support single or comma-separated genre IDs (e.g. "36,10" or "8")
  const genreIds = parseGenreIds(params.genres);
  const firstGenreId = genreIds.find((id) => GENRE_ID_TO_NAME[id]);
  const genre = firstGenreId ? GENRE_ID_TO_NAME[firstGenreId] : undefined;

  const search = params.q ? String(params.q).trim() : undefined;

  let sort = ['SCORE_DESC', 'POPULARITY_DESC'];
  let status;
  if (params.filter === 'bypopularity') sort = ['POPULARITY_DESC'];
  if (params.filter === 'favorite') sort = ['FAVOURITES_DESC'];
  if (params.filter === 'airing') {
    status = 'RELEASING';
    sort = ['POPULARITY_DESC'];
  }
  if (params.filter === 'upcoming') {
    status = 'NOT_YET_RELEASED';
    sort = ['POPULARITY_DESC'];
  }

  const query = `
    query ($page: Int, $perPage: Int, $search: String, $format: MediaFormat, $genre: String, $status: MediaStatus, $sort: [MediaSort]) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(type: ANIME, sort: $sort, search: $search, format: $format, genre: $genre, status: $status, isAdult: false) {
          id
          idMal
          title {
            romaji
            english
            native
          }
          format
          episodes
          status
          duration
          averageScore
          seasonYear
          description
          coverImage {
            extraLarge
            large
          }
          trailer {
            id
            site
          }
          genres
        }
      }
    }
  `;

  const response = await axios.post(
    ANILIST_GRAPHQL_URL,
    {
      query,
      variables: { page, perPage, search, format, genre, status, sort }
    },
    { timeout: 8000 }
  );

  const pageData = response.data?.data?.Page;
  const list = (pageData?.media || []).map(mapAniListToJikan);

  return {
    data: list,
    pagination: {
      current_page: pageData?.pageInfo?.currentPage || page,
      last_visible_page: pageData?.pageInfo?.lastPage || 100,
      has_next_page: Boolean(pageData?.pageInfo?.hasNextPage)
    }
  };
};

const fetchAniListById = async (id) => {
  if (typeof axios.post !== 'function') {
    throw new Error('axios.post unavailable in mock environment');
  }

  const query = `
    query ($idMal: Int) {
      Media(idMal: $idMal, type: ANIME) {
        id
        idMal
        title { romaji english native }
        format
        episodes
        status
        duration
        averageScore
        seasonYear
        description
        coverImage { extraLarge large }
        trailer { id site }
        genres
      }
    }
  `;

  const response = await axios.post(
    ANILIST_GRAPHQL_URL,
    { query, variables: { idMal: Number(id) } },
    { timeout: 8000 }
  );

  const media = response.data?.data?.Media;
  if (!media) throw new Error('Not found on AniList');
  return { data: mapAniListToJikan(media) };
};

// Comprehensive 24-title fallback catalog spanning all genres & moods:
// Healing/Slice of Life (36), Drama/Tearjerker (8), Action/Hype (1), Sports (30),
// Mystery/Sci-Fi/Suspense (7, 24, 41), Comedy (4), Romance (22)
const FALLBACK_CATALOG = [
  // --- HEALING / SLICE OF LIFE / FANTASY (Genres 36, 10, 2) ---
  {
    mal_id: 52991,
    title: 'Sousou no Frieren (Frieren: Beyond Journey\'s End)',
    title_japanese: '葬送のフリーレン',
    type: 'TV',
    episodes: 28,
    status: 'Finished Airing',
    duration: '24 min per ep',
    score: 9.31,
    year: 2023,
    synopsis: 'Elven mage Frieren embarks on a reflective, soul-soothing journey across a peaceful world to understand humanity and cherish the memories of her former companions.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/1015/138006l.jpg' } },
    trailer: { youtube_id: 'ZEkwCGJ3o7M', url: 'https://www.youtube.com/watch?v=ZEkwCGJ3o7M', embed_url: 'https://www.youtube-nocookie.com/embed/ZEkwCGJ3o7M' },
    streaming: buildStreamingLinks('Sousou no Frieren'),
    genres: [{ mal_id: 2, name: 'Adventure' }, { mal_id: 8, name: 'Drama' }, { mal_id: 10, name: 'Fantasy' }]
  },
  {
    mal_id: 34798,
    title: 'Yuru Camp (Laid-Back Camp)',
    title_japanese: 'ゆるキャン△',
    type: 'TV',
    episodes: 12,
    status: 'Finished Airing',
    duration: '23 min per ep',
    score: 8.25,
    year: 2018,
    synopsis: 'Rin Shima loves camping solo along the scenic lakes of Mount Fuji. When she meets Nadeshiko Kagamihara, their cozy outdoor adventures, warm campfires, and hot food create the ultimate healing experience.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/4/89877.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/4/89877l.jpg' } },
    trailer: { youtube_id: 's9Vc3n99_qx', url: 'https://www.youtube.com/watch?v=s9Vc3n99_qx', embed_url: null },
    streaming: buildStreamingLinks('Yuru Camp Laid Back Camp'),
    genres: [{ mal_id: 36, name: 'Slice of Life' }, { mal_id: 4, name: 'Comedy' }]
  },
  {
    mal_id: 199,
    title: 'Sen to Chihiro no Kamikakushi (Spirited Away)',
    title_japanese: '千と千尋の神隠し',
    type: 'Movie',
    episodes: 1,
    status: 'Finished Airing',
    duration: '2 hr 4 min',
    score: 8.77,
    year: 2001,
    synopsis: 'Ten-year-old Chihiro discovers a magical bathhouse for spirits and embarks on an unforgettable Studio Ghibli journey of courage, wonder, and warmth.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/6/79597.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/6/79597l.jpg' } },
    trailer: { youtube_id: 'ByXuk9QqQkk', url: 'https://www.youtube.com/watch?v=ByXuk9QqQkk', embed_url: 'https://www.youtube-nocookie.com/embed/ByXuk9QqQkk' },
    streaming: buildStreamingLinks('Spirited Away'),
    genres: [{ mal_id: 2, name: 'Adventure' }, { mal_id: 10, name: 'Fantasy' }, { mal_id: 37, name: 'Supernatural' }]
  },
  {
    mal_id: 22789,
    title: 'Barakamon',
    title_japanese: 'ばらかもん',
    type: 'TV',
    episodes: 12,
    status: 'Finished Airing',
    duration: '22 min per ep',
    score: 8.37,
    year: 2014,
    synopsis: 'Stressed calligrapher Seishuu Handa moves to the peaceful Goto Islands, where the carefree islanders and energetic little Naru teach him how to slow down and enjoy life.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/3/64627.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/3/64627l.jpg' } },
    trailer: { youtube_id: null, url: null, embed_url: null },
    streaming: buildStreamingLinks('Barakamon'),
    genres: [{ mal_id: 36, name: 'Slice of Life' }, { mal_id: 4, name: 'Comedy' }]
  },
  {
    mal_id: 457,
    title: 'Mushishi',
    title_japanese: '蟲師',
    type: 'TV',
    episodes: 26,
    status: 'Finished Airing',
    duration: '25 min per ep',
    score: 8.65,
    year: 2005,
    synopsis: 'Ginko wanders through lush forests and quiet mountains investigating ethereal lifeforms called Mushi in a deeply meditative, atmospheric anthology.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/2/73862.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/2/73862l.jpg' } },
    trailer: { youtube_id: null, url: null, embed_url: null },
    streaming: buildStreamingLinks('Mushishi'),
    genres: [{ mal_id: 36, name: 'Slice of Life' }, { mal_id: 7, name: 'Mystery' }, { mal_id: 37, name: 'Supernatural' }]
  },
  {
    mal_id: 50594,
    title: 'Suzume no Tojimari (Suzume)',
    title_japanese: 'すずめの戸締まり',
    type: 'Movie',
    episodes: 1,
    status: 'Finished Airing',
    duration: '2 hr 1 min',
    score: 8.31,
    year: 2022,
    synopsis: '17-year-old Suzume Iwato embarks on a breathtaking roadtrip across Japan with Souta Munakata to lock mysterious doors and heal the scars of the past.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/1598/128450.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/1598/128450l.jpg' } },
    trailer: { youtube_id: '5pTcio2hTSw', url: 'https://www.youtube.com/watch?v=5pTcio2hTSw', embed_url: 'https://www.youtube-nocookie.com/embed/5pTcio2hTSw' },
    streaming: buildStreamingLinks('Suzume no Tojimari'),
    genres: [{ mal_id: 2, name: 'Adventure' }, { mal_id: 10, name: 'Fantasy' }, { mal_id: 7, name: 'Mystery' }]
  },

  // --- CATHARTIC / DRAMA / TEARJERKER (Genre 8) ---
  {
    mal_id: 28851,
    title: 'Koe no Katachi (A Silent Voice)',
    title_japanese: '聲の形',
    type: 'Movie',
    episodes: 1,
    status: 'Finished Airing',
    duration: '2 hr 10 min',
    score: 8.93,
    year: 2016,
    synopsis: 'Haunted by his childhood mistakes, Shouya Ishida sets out on a deeply moving path of redemption to reconnect with Shouko Nishimiya, a deaf girl he once bullied.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/1122/96435.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/1122/96435l.jpg' } },
    trailer: { youtube_id: 'nfK6UgLra7g', url: 'https://www.youtube.com/watch?v=nfK6UgLra7g', embed_url: 'https://www.youtube-nocookie.com/embed/nfK6UgLra7g' },
    streaming: buildStreamingLinks('A Silent Voice Koe no Katachi'),
    genres: [{ mal_id: 8, name: 'Drama' }, { mal_id: 22, name: 'Romance' }, { mal_id: 36, name: 'Slice of Life' }]
  },
  {
    mal_id: 33352,
    title: 'Violet Evergarden',
    title_japanese: 'ヴァイオレット・エヴァーガーデン',
    type: 'TV',
    episodes: 13,
    status: 'Finished Airing',
    duration: '24 min per ep',
    score: 8.68,
    year: 2018,
    synopsis: 'Former child soldier Violet Evergarden becomes an Auto Memory Doll, writing heartfelt letters for people to understand the final words "I love you" left by her major.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/1795/95088.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/1795/95088l.jpg' } },
    trailer: { youtube_id: '0CJeDetA45Q', url: 'https://www.youtube.com/watch?v=0CJeDetA45Q', embed_url: 'https://www.youtube-nocookie.com/embed/0CJeDetA45Q' },
    streaming: buildStreamingLinks('Violet Evergarden'),
    genres: [{ mal_id: 8, name: 'Drama' }, { mal_id: 10, name: 'Fantasy' }]
  },
  {
    mal_id: 23273,
    title: 'Shigatsu wa Kimi no Uso (Your Lie in April)',
    title_japanese: '四月は君の嘘',
    type: 'TV',
    episodes: 22,
    status: 'Finished Airing',
    duration: '22 min per ep',
    score: 8.64,
    year: 2014,
    synopsis: 'Piano prodigy Kousei Arima loses his ability to hear the piano after his mother\'s death, until free-spirited violinist Kaori Miyazono brings music and color back into his world.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/3/67177.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/3/67177l.jpg' } },
    trailer: { youtube_id: '3aL0gDZtFbE', url: 'https://www.youtube.com/watch?v=3aL0gDZtFbE', embed_url: 'https://www.youtube-nocookie.com/embed/3aL0gDZtFbE' },
    streaming: buildStreamingLinks('Your Lie in April'),
    genres: [{ mal_id: 8, name: 'Drama' }, { mal_id: 22, name: 'Romance' }]
  },
  {
    mal_id: 9989,
    title: 'Ano Hi Mita Hana no Namae wo Bokutachi wa Mada Shiranai. (Anohana)',
    title_japanese: 'あの日見た花の名前を僕達はまだ知らない。',
    type: 'TV',
    episodes: 11,
    status: 'Finished Airing',
    duration: '22 min per ep',
    score: 8.30,
    year: 2011,
    synopsis: 'A group of estranged childhood friends reunite when the spirit of their late friend Menma appears, asking them to help fulfill her final forgotten wish.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/5/79697.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/5/79697l.jpg' } },
    trailer: { youtube_id: null, url: null, embed_url: null },
    streaming: buildStreamingLinks('Anohana'),
    genres: [{ mal_id: 8, name: 'Drama' }, { mal_id: 37, name: 'Supernatural' }]
  },

  // --- ACTION / HYPE / SPORTS (Genres 1, 30) ---
  {
    mal_id: 16498,
    title: 'Shingeki no Kyojin (Attack on Titan)',
    title_japanese: '進撃の巨人',
    type: 'TV',
    episodes: 25,
    status: 'Finished Airing',
    duration: '24 min per ep',
    score: 8.55,
    year: 2013,
    synopsis: 'After humanity is pushed to the brink of extinction by giant humanoid Titans, Eren Yeager vows to reclaim the world in an epic battle for survival.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/10/47347l.jpg' } },
    trailer: { youtube_id: 'LHtdKWJdif4', url: 'https://www.youtube.com/watch?v=LHtdKWJdif4', embed_url: 'https://www.youtube-nocookie.com/embed/LHtdKWJdif4' },
    streaming: buildStreamingLinks('Attack on Titan Shingeki no Kyojin'),
    genres: [{ mal_id: 1, name: 'Action' }, { mal_id: 8, name: 'Drama' }, { mal_id: 41, name: 'Suspense' }]
  },
  {
    mal_id: 40748,
    title: 'Jujutsu Kaisen',
    title_japanese: '呪術廻戦',
    type: 'TV',
    episodes: 24,
    status: 'Finished Airing',
    duration: '23 min per ep',
    score: 8.63,
    year: 2020,
    synopsis: 'Yuji Itadori swallows a cursed talisman—the finger of Ryomen Sukuna—and enters Tokyo Jujutsu High School to exorcise lethal curses with explosive martial arts.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/1171/109222l.jpg' } },
    trailer: { youtube_id: '4A_X-Dvl0ws', url: 'https://www.youtube.com/watch?v=4A_X-Dvl0ws', embed_url: 'https://www.youtube-nocookie.com/embed/4A_X-Dvl0ws' },
    streaming: buildStreamingLinks('Jujutsu Kaisen'),
    genres: [{ mal_id: 1, name: 'Action' }, { mal_id: 37, name: 'Supernatural' }]
  },
  {
    mal_id: 38000,
    title: 'Kimetsu no Yaiba (Demon Slayer)',
    title_japanese: '鬼滅の刃',
    type: 'TV',
    episodes: 26,
    status: 'Finished Airing',
    duration: '23 min per ep',
    score: 8.45,
    year: 2019,
    synopsis: 'Tanjiro Kamado joins the Demon Slayer Corps to cure his sister Nezuko and avenge his family in breathtaking sword battles animated by Ufotable.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg' } },
    trailer: { youtube_id: 'VQGCKyvzIM4', url: 'https://www.youtube.com/watch?v=VQGCKyvzIM4', embed_url: 'https://www.youtube-nocookie.com/embed/VQGCKyvzIM4' },
    streaming: buildStreamingLinks('Demon Slayer Kimetsu no Yaiba'),
    genres: [{ mal_id: 1, name: 'Action' }, { mal_id: 37, name: 'Supernatural' }]
  },
  {
    mal_id: 20583,
    title: 'Haikyuu!!',
    title_japanese: 'ハイキュー!!',
    type: 'TV',
    episodes: 25,
    status: 'Finished Airing',
    duration: '24 min per ep',
    score: 8.44,
    year: 2014,
    synopsis: 'Determined to overcome his short stature, Shoyo Hinata teams up with genius setter Tobio Kageyama to take Karasuno High\'s volleyball team to the national stage.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/7/76014.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/7/76014l.jpg' } },
    trailer: { youtube_id: 'JOGp2c7-cKc', url: 'https://www.youtube.com/watch?v=JOGp2c7-cKc', embed_url: 'https://www.youtube-nocookie.com/embed/JOGp2c7-cKc' },
    streaming: buildStreamingLinks('Haikyuu'),
    genres: [{ mal_id: 30, name: 'Sports' }, { mal_id: 1, name: 'Action' }]
  },
  {
    mal_id: 30276,
    title: 'One Punch Man',
    title_japanese: 'ワンパンマン',
    type: 'TV',
    episodes: 12,
    status: 'Finished Airing',
    duration: '24 min per ep',
    score: 8.50,
    year: 2015,
    synopsis: 'Saitama is a hero for fun who can defeat any monster or supervillain with a single punch, leading to explosive action and hilarious deadpan comedy.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/12/76049.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/12/76049l.jpg' } },
    trailer: { youtube_id: 'Poo5lqoWSGw', url: 'https://www.youtube.com/watch?v=Poo5lqoWSGw', embed_url: 'https://www.youtube-nocookie.com/embed/Poo5lqoWSGw' },
    streaming: buildStreamingLinks('One Punch Man'),
    genres: [{ mal_id: 1, name: 'Action' }, { mal_id: 4, name: 'Comedy' }]
  },
  {
    mal_id: 5114,
    title: 'Fullmetal Alchemist: Brotherhood',
    title_japanese: '鋼の錬金術師 FULLMETAL ALCHEMIST',
    type: 'TV',
    episodes: 64,
    status: 'Finished Airing',
    duration: '24 min per ep',
    score: 9.10,
    year: 2009,
    synopsis: 'Brothers Edward and Alphonse Elric search for the Philosopher\'s Stone to restore their bodies after a forbidden alchemy ritual goes terribly wrong.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/1208/94745.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/1208/94745l.jpg' } },
    trailer: { youtube_id: '--IcmZkvL0Q', url: 'https://www.youtube.com/watch?v=--IcmZkvL0Q', embed_url: 'https://www.youtube-nocookie.com/embed/--IcmZkvL0Q' },
    streaming: buildStreamingLinks('Fullmetal Alchemist Brotherhood'),
    genres: [{ mal_id: 1, name: 'Action' }, { mal_id: 2, name: 'Adventure' }, { mal_id: 10, name: 'Fantasy' }]
  },

  // --- MYSTERY / SCI-FI / SUSPENSE / THRILLER (Genres 24, 41, 7) ---
  {
    mal_id: 9253,
    title: 'Steins;Gate',
    title_japanese: 'STEINS;GATE',
    type: 'TV',
    episodes: 24,
    status: 'Finished Airing',
    duration: '24 min per ep',
    score: 9.07,
    year: 2011,
    synopsis: 'Eccentric scientist Rintarou Okabe accidentally invents a device capable of sending messages into the past, triggering a gripping time-travel conspiracy.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/1935/127974.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/1935/127974l.jpg' } },
    trailer: { youtube_id: 'uMYhjVwp0Fk', url: 'https://www.youtube.com/watch?v=uMYhjVwp0Fk', embed_url: 'https://www.youtube-nocookie.com/embed/uMYhjVwp0Fk' },
    streaming: buildStreamingLinks('Steins Gate'),
    genres: [{ mal_id: 24, name: 'Sci-Fi' }, { mal_id: 41, name: 'Suspense' }, { mal_id: 7, name: 'Mystery' }]
  },
  {
    mal_id: 19,
    title: 'Monster',
    title_japanese: 'モンスター',
    type: 'TV',
    episodes: 74,
    status: 'Finished Airing',
    duration: '24 min per ep',
    score: 8.88,
    year: 2004,
    synopsis: 'Brilliant neurosurgeon Dr. Kenzo Tenma saves a young boy\'s life over a politician\'s, only to discover years later that the boy has grown into a manipulative serial killer.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/10/18793.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/10/18793l.jpg' } },
    trailer: { youtube_id: null, url: null, embed_url: null },
    streaming: buildStreamingLinks('Monster Anime'),
    genres: [{ mal_id: 7, name: 'Mystery' }, { mal_id: 41, name: 'Suspense' }, { mal_id: 8, name: 'Drama' }]
  },
  {
    mal_id: 1535,
    title: 'Death Note',
    title_japanese: 'デスノート',
    type: 'TV',
    episodes: 37,
    status: 'Finished Airing',
    duration: '23 min per ep',
    score: 8.62,
    year: 2006,
    synopsis: 'High school genius Light Yagami finds a supernatural notebook that kills anyone whose name is written inside, sparking a high-stakes battle of wits against detective L.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/1079/138100.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/1079/138100l.jpg' } },
    trailer: { youtube_id: 'NlJZ-YgAt-c', url: 'https://www.youtube.com/watch?v=NlJZ-YgAt-c', embed_url: 'https://www.youtube-nocookie.com/embed/NlJZ-YgAt-c' },
    streaming: buildStreamingLinks('Death Note'),
    genres: [{ mal_id: 41, name: 'Suspense' }, { mal_id: 7, name: 'Mystery' }, { mal_id: 37, name: 'Supernatural' }]
  },
  {
    mal_id: 31043,
    title: 'Boku dake ga Inai Machi (Erased)',
    title_japanese: '僕だけがいない街',
    type: 'TV',
    episodes: 12,
    status: 'Finished Airing',
    duration: '23 min per ep',
    score: 8.30,
    year: 2016,
    synopsis: 'Sent back 18 years into the past into his elementary school body, Satoru Fujinuma must uncover the identity of a serial kidnapper to save his classmates and his mother.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/10/77957.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/10/77957l.jpg' } },
    trailer: { youtube_id: 'DwmxEAWjTQQ', url: 'https://www.youtube.com/watch?v=DwmxEAWjTQQ', embed_url: 'https://www.youtube-nocookie.com/embed/DwmxEAWjTQQ' },
    streaming: buildStreamingLinks('Erased Boku dake ga Inai Machi'),
    genres: [{ mal_id: 7, name: 'Mystery' }, { mal_id: 41, name: 'Suspense' }, { mal_id: 24, name: 'Sci-Fi' }]
  },
  {
    mal_id: 42310,
    title: 'Cyberpunk: Edgerunners',
    title_japanese: 'サイバーパンク エッジランナーズ',
    type: 'TV',
    episodes: 10,
    status: 'Finished Airing',
    duration: '25 min per ep',
    score: 8.61,
    year: 2022,
    synopsis: 'In a corrupt, neon-drenched Night City obsessed with cybernetic body modifications, street kid David Martinez risks everything to survive as a mercenary Edgerunner.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/1818/126435.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/1818/126435l.jpg' } },
    trailer: { youtube_id: 'JtqIas3bYhg', url: 'https://www.youtube.com/watch?v=JtqIas3bYhg', embed_url: 'https://www.youtube-nocookie.com/embed/JtqIas3bYhg' },
    streaming: buildStreamingLinks('Cyberpunk Edgerunners'),
    genres: [{ mal_id: 24, name: 'Sci-Fi' }, { mal_id: 1, name: 'Action' }, { mal_id: 41, name: 'Suspense' }]
  },

  // --- ROMANCE / COMEDY (Genres 22, 4) ---
  {
    mal_id: 32281,
    title: 'Kimi no Na wa. (Your Name.)',
    title_japanese: '君の名は。',
    type: 'Movie',
    episodes: 1,
    status: 'Finished Airing',
    duration: '1 hr 46 min',
    score: 8.83,
    year: 2016,
    synopsis: 'Mitsuha Miyamizu, a high school girl living in rural Itomori, and Taki Tachibana, a high school boy in Tokyo, mysteriously begin swapping bodies across time and space.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/5/87048.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/5/87048l.jpg' } },
    trailer: { youtube_id: '3KR8_igDs1Y', url: 'https://www.youtube.com/watch?v=3KR8_igDs1Y', embed_url: 'https://www.youtube-nocookie.com/embed/3KR8_igDs1Y' },
    streaming: buildStreamingLinks('Kimi no Na wa Your Name'),
    genres: [{ mal_id: 22, name: 'Romance' }, { mal_id: 8, name: 'Drama' }, { mal_id: 37, name: 'Supernatural' }]
  },
  {
    mal_id: 37999,
    title: 'Kaguya-sama wa Kokurasetai: Tensai-tachi no Renai Zunousen',
    title_japanese: 'かぐや様は告らせたい～天才たちの恋愛頭脳戦～',
    type: 'TV',
    episodes: 12,
    status: 'Finished Airing',
    duration: '25 min per ep',
    score: 8.40,
    year: 2019,
    synopsis: 'Student council president Miyuki Shirogane and vice-president Kaguya Shinomiya refuse to confess their love first, turning romance into a hilarious psychological war.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/1295/106551.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/1295/106551l.jpg' } },
    trailer: { youtube_id: 'rZ95aZmQu_8', url: 'https://www.youtube.com/watch?v=rZ95aZmQu_8', embed_url: 'https://www.youtube-nocookie.com/embed/rZ95aZmQu_8' },
    streaming: buildStreamingLinks('Kaguya sama Love is War'),
    genres: [{ mal_id: 4, name: 'Comedy' }, { mal_id: 22, name: 'Romance' }]
  },
  {
    mal_id: 50265,
    title: 'Spy x Family',
    title_japanese: 'SPY×FAMILY',
    type: 'TV',
    episodes: 12,
    status: 'Finished Airing',
    duration: '24 min per ep',
    score: 8.50,
    year: 2022,
    synopsis: 'Master spy Twilight forms a fake family with assassin Yor and telepathic girl Anya—none of them knowing each other\'s hilarious secret identities.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/1441/122795.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/1441/122795l.jpg' } },
    trailer: { youtube_id: 'ofXigq9aIpo', url: 'https://www.youtube.com/watch?v=ofXigq9aIpo', embed_url: 'https://www.youtube-nocookie.com/embed/ofXigq9aIpo' },
    streaming: buildStreamingLinks('Spy x Family'),
    genres: [{ mal_id: 4, name: 'Comedy' }, { mal_id: 1, name: 'Action' }]
  },
  {
    mal_id: 47917,
    title: 'Bocchi the Rock!',
    title_japanese: 'ぼっち・ざ・ろっく！',
    type: 'TV',
    episodes: 12,
    status: 'Finished Airing',
    duration: '23 min per ep',
    score: 8.76,
    year: 2022,
    synopsis: 'Socially anxious guitar prodigy Hitori "Bocchi" Gotou joins Kessoku Band in a side-splittingly funny and visually creative musical comedy.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/1448/127956.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/1448/127956l.jpg' } },
    trailer: { youtube_id: 'Fp7ln5jq18M', url: 'https://www.youtube.com/watch?v=Fp7ln5jq18M', embed_url: 'https://www.youtube-nocookie.com/embed/Fp7ln5jq18M' },
    streaming: buildStreamingLinks('Bocchi the Rock'),
    genres: [{ mal_id: 4, name: 'Comedy' }]
  },
  {
    mal_id: 42897,
    title: 'Horimiya',
    title_japanese: 'ホリミヤ',
    type: 'TV',
    episodes: 13,
    status: 'Finished Airing',
    duration: '23 min per ep',
    score: 8.19,
    year: 2021,
    synopsis: 'Popular high schooler Kyouko Hori and quiet, tattooed Izumi Miyamura discover each other\'s hidden sides outside of school, blossoming into a sweet, drama-free romance.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/1695/111486.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/1695/111486l.jpg' } },
    trailer: { youtube_id: 'e4RCugyx5No', url: 'https://www.youtube.com/watch?v=e4RCugyx5No', embed_url: 'https://www.youtube-nocookie.com/embed/e4RCugyx5No' },
    streaming: buildStreamingLinks('Horimiya'),
    genres: [{ mal_id: 22, name: 'Romance' }, { mal_id: 4, name: 'Comedy' }]
  },
  {
    mal_id: 37105,
    title: 'Grand Blue',
    title_japanese: 'ぐらんぶる',
    type: 'TV',
    episodes: 12,
    status: 'Finished Airing',
    duration: '24 min per ep',
    score: 8.43,
    year: 2018,
    synopsis: 'Iori Kitahara moves to a coastal town for college expecting an idyllic life, only to get dragged into the most absurd, laugh-out-loud diving club imaginable.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/1302/94882.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/1302/94882l.jpg' } },
    trailer: { youtube_id: null, url: null, embed_url: null },
    streaming: buildStreamingLinks('Grand Blue Dreaming'),
    genres: [{ mal_id: 4, name: 'Comedy' }]
  },
  {
    mal_id: 431,
    title: 'Howl no Ugoku Shiro (Howl\'s Moving Castle)',
    title_japanese: 'ハウルの動く城',
    type: 'Movie',
    episodes: 1,
    status: 'Finished Airing',
    duration: '1 hr 59 min',
    score: 8.66,
    year: 2004,
    synopsis: 'Transformed into an old woman by a wicked witch\'s curse, young hatmaker Sophie seeks refuge in the magical walking castle of the enigmatic wizard Howl.',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/5/75810.jpg', large_image_url: 'https://cdn.myanimelist.net/images/anime/5/75810l.jpg' } },
    trailer: { youtube_id: 'iwROgK94zcM', url: 'https://www.youtube.com/watch?v=iwROgK94zcM', embed_url: 'https://www.youtube-nocookie.com/embed/iwROgK94zcM' },
    streaming: buildStreamingLinks('Howls Moving Castle'),
    genres: [{ mal_id: 22, name: 'Romance' }, { mal_id: 10, name: 'Fantasy' }, { mal_id: 2, name: 'Adventure' }]
  }
];

const sanitizeJikanParams = (params = {}) => {
  const clean = { ...params };
  if (clean.limit) {
    clean.limit = Math.min(Number(clean.limit) || 24, 25);
  }
  return clean;
};

const filterFallbackCatalog = (params = {}) => {
  let list = [...FALLBACK_CATALOG];
  if (params.type && params.type !== 'all') {
    list = list.filter((item) => item.type.toLowerCase() === String(params.type).toLowerCase());
  }
  if (params.genres) {
    const genreIds = parseGenreIds(params.genres);
    if (genreIds.length > 0) {
      const genreFiltered = list.filter((item) =>
        item.genres.some((g) => genreIds.includes(g.mal_id))
      );
      if (genreFiltered.length > 0) list = genreFiltered;
    }
  }
  if (params.q) {
    const q = String(params.q).toLowerCase().trim();
    const matched = list.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        q.includes(item.title.toLowerCase().split('(')[0].trim()) ||
        item.synopsis.toLowerCase().includes(q) ||
        item.genres.some((g) => g.name.toLowerCase().includes(q))
    );
    if (matched.length > 0) {
      list = matched;
    }
  }
  const limit = Number(params.limit) || 24;
  return {
    data: list.slice(0, limit),
    pagination: { has_next_page: false, current_page: Number(params.page) || 1, last_visible_page: 1 }
  };
};

const jikanService = {
  FALLBACK_CATALOG,
  getTopAnime: async (params = {}) => {
    try {
      const response = await jikanClient.get('/top/anime', { params: sanitizeJikanParams(params) });
      return response.data;
    } catch (jikanErr) {
      try {
        return await fetchFromAniList(params);
      } catch (aniErr) {
        return filterFallbackCatalog(params);
      }
    }
  },

  searchAnime: async (params = {}) => {
    try {
      const response = await jikanClient.get('/anime', { params: sanitizeJikanParams(params) });
      return response.data;
    } catch (jikanErr) {
      try {
        return await fetchFromAniList(params);
      } catch (aniErr) {
        return filterFallbackCatalog(params);
      }
    }
  },

  getAnimeById: async (id) => {
    try {
      const response = await jikanClient.get(`/anime/${id}/full`);
      const data = response.data.data;
      if (data && (!data.streaming || data.streaming.length === 0)) {
        data.streaming = buildStreamingLinks(data.title);
      }
      return { data };
    } catch (jikanErr) {
      try {
        return await fetchAniListById(id);
      } catch (aniErr) {
        const found =
          FALLBACK_CATALOG.find((item) => String(item.mal_id) === String(id)) || FALLBACK_CATALOG[0];
        return { data: found };
      }
    }
  },

  getAnimeEpisodes: async (id, page = 1) => {
    try {
      const response = await jikanClient.get(`/anime/${id}/episodes`, { params: { page } });
      return response.data;
    } catch (err) {
      const fallbackAnime =
        FALLBACK_CATALOG.find((item) => String(item.mal_id) === String(id)) || FALLBACK_CATALOG[0];
      const count = Math.min(fallbackAnime.episodes || 12, 28);
      const episodes = Array.from({ length: count }, (_, idx) => ({
        mal_id: idx + 1,
        title: count === 1 ? `${fallbackAnime.title} (Full Movie)` : `Episode ${idx + 1}`,
        score: fallbackAnime.score || 8.8,
        filler: false,
        recap: false
      }));
      return {
        data: episodes,
        pagination: { last_visible_page: 1, has_next_page: false }
      };
    }
  },

  getAnimeGenres: async () => {
    try {
      const response = await jikanClient.get('/genres/anime');
      return response.data;
    } catch (err) {
      return { data: FALLBACK_GENRES };
    }
  }
};

module.exports = jikanService;
