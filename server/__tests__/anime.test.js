process.env.NODE_ENV = 'test';

const jikanService = require('../services/jikanService');
const AnimeController = require('../controllers/animeController');

jest.mock('../services/jikanService');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('AnimeController Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getPopular harus mengambil daftar movie/anime populer dan menangani filter type & filter ranking', async () => {
    jikanService.getTopAnime.mockResolvedValueOnce({ data: [{ mal_id: 1, title: 'Your Name' }] });
    const res = createMockRes();
    await AnimeController.getPopular(
      { query: { page: 1, limit: 12, type: 'movie', filter: 'bypopularity' } },
      res,
      jest.fn()
    );

    expect(jikanService.getTopAnime).toHaveBeenCalledWith({
      page: 1,
      limit: 12,
      type: 'movie',
      filter: 'bypopularity'
    });
    expect(res.status).toHaveBeenCalledWith(200);

    jikanService.getTopAnime.mockRejectedValueOnce(new Error('Jikan error'));
    const next = jest.fn();
    await AnimeController.getPopular({ query: {} }, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('search harus meneruskan parameter filter ke jikanService', async () => {
    jikanService.searchAnime.mockResolvedValueOnce({ data: [] });
    const res = createMockRes();
    await AnimeController.search(
      {
        query: {
          q: 'Frieren',
          type: 'tv',
          genres: '1',
          status: 'complete',
          rating: 'pg13',
          order_by: 'score',
          sort: 'desc'
        }
      },
      res,
      jest.fn()
    );

    expect(jikanService.searchAnime).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'Frieren', type: 'tv', genres: '1' })
    );
    expect(res.status).toHaveBeenCalledWith(200);

    jikanService.searchAnime.mockRejectedValueOnce(new Error('Search fail'));
    const next = jest.fn();
    await AnimeController.search({ query: {} }, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('getDetail, getEpisodes, dan getGenres harus mengembalikan data dengan status 200', async () => {
    const res = createMockRes();
    jikanService.getAnimeById.mockResolvedValueOnce({ data: { mal_id: 52991 } });
    await AnimeController.getDetail({ params: { id: '52991' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);

    jikanService.getAnimeEpisodes.mockResolvedValueOnce({
      data: [{ mal_id: 1, title: 'Episode 1' }],
      pagination: { current_page: 1, has_next_page: false }
    });
    await AnimeController.getEpisodes({ params: { id: '52991' }, query: { page: 1 } }, res, jest.fn());
    expect(jikanService.getAnimeEpisodes).toHaveBeenCalledWith('52991', 1);
    expect(res.status).toHaveBeenCalledWith(200);

    jikanService.getAnimeGenres.mockResolvedValueOnce({ data: [{ mal_id: 1, name: 'Action' }] });
    await AnimeController.getGenres({}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
