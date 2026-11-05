process.env.NODE_ENV = 'test';

const axios = require('axios');

jest.mock('axios', () => {
  const mockGet = jest.fn();
  const mockPost = jest.fn();
  return {
    create: jest.fn(() => ({ get: mockGet })),
    post: mockPost,
    __mockGet: mockGet,
    __mockPost: mockPost
  };
});

const jikanService = require('../services/jikanService');

describe('Jikan Service Unit Tests', () => {
  const mockGet = axios.__mockGet;
  const mockPost = axios.__mockPost;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('harus memanggil endpoint Jikan API dengan benar saat sukses', async () => {
    mockGet.mockResolvedValue({ data: { data: [{ mal_id: 32281, title: 'Your Name', episodes: 1 }] } });

    const top = await jikanService.getTopAnime({ page: 1, limit: 30, type: 'movie' });
    expect(top.data[0].title).toBe('Your Name');

    const search = await jikanService.searchAnime({ q: 'Suzume', limit: 30 });
    expect(search.data).toHaveLength(1);

    const detail = await jikanService.getAnimeById(32281);
    expect(detail.data).toBeDefined();

    const episodes = await jikanService.getAnimeEpisodes(32281, 1);
    expect(episodes.data).toBeDefined();

    const genres = await jikanService.getAnimeGenres();
    expect(genres.data).toBeDefined();
  });

  it('harus menggunakan fallback catalog secara otomatis jika Jikan & AniList API timeout', async () => {
    mockGet.mockRejectedValue(new Error('ETIMEDOUT'));
    mockPost.mockRejectedValue(new Error('ETIMEDOUT'));

    const topMovies = await jikanService.getTopAnime({ type: 'movie', limit: 5 });
    expect(topMovies.data.length).toBeGreaterThan(0);

    const searchRes = await jikanService.searchAnime({ q: 'Your Name', type: 'movie', genres: '8' });
    expect(searchRes.data[0].title).toMatch(/Your Name/i);

    const detailRes = await jikanService.getAnimeById(32281);
    expect(detailRes.data.mal_id).toBe(32281);

    const epRes = await jikanService.getAnimeEpisodes(52991, 1);
    expect(epRes.data.length).toBeGreaterThan(0);

    const genreRes = await jikanService.getAnimeGenres();
    expect(genreRes.data.length).toBeGreaterThan(0);
  });
});
