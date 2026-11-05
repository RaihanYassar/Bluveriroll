process.env.NODE_ENV = 'test';

const MoodSyncController = require('../controllers/moodSyncController');
const openaiService = require('../services/openaiService');
const jikanService = require('../services/jikanService');

jest.mock('../services/openaiService');
jest.mock('../services/jikanService');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('MoodSyncController Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('harus menolak request jika mood kosong dengan status 400', async () => {
    const next = jest.fn();
    await MoodSyncController.getRecommendations({ body: { mood: '   ' } }, createMockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });

  it('harus mengembalikan hasil analisis OpenAI, Pollinations bannerUrl, dan rekomendasi Jikan', async () => {
    openaiService.generateMoodRecommendation.mockResolvedValueOnce({
      moodAnalysis: 'Cozy slice of life mood',
      recommendedGenres: ['Slice of Life'],
      keywords: ['iyashikei'],
      vibeDescription: 'Warm relaxing stories'
    });
    jikanService.searchAnime.mockResolvedValueOnce({
      data: [{ mal_id: 1, title: 'Yuru Camp' }]
    });

    const res = createMockRes();
    await MoodSyncController.getRecommendations(
      { body: { mood: 'I want to relax', type: 'movie' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.moodAnalysis.bannerUrl).toContain('pollinations.ai');
    expect(payload.recommendations).toHaveLength(1);
  });

  it('harus tetap berjalan dengan fallback jika OpenAI sedang error dan memfilter judul dari franchise yang sama', async () => {
    openaiService.generateMoodRecommendation.mockRejectedValueOnce(new Error('OpenAI quota'));
    jikanService.searchAnime.mockResolvedValueOnce({
      data: [
        { mal_id: 16498, title: 'Shingeki no Kyojin' },
        { mal_id: 25777, title: 'Shingeki no Kyojin Season 2' },
        { mal_id: 40748, title: 'Jujutsu Kaisen' }
      ]
    });

    const res = createMockRes();
    await MoodSyncController.getRecommendations(
      { body: { mood: 'action hype', excludeIds: [], excludeTitles: [] } },
      res,
      jest.fn()
    );
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    // Shingeki no Kyojin Season 2 harus otomatis difilter karena satu franchise dengan Shingeki no Kyojin!
    expect(payload.recommendations).toHaveLength(2);
    expect(payload.recommendations.map((r) => r.title)).toEqual([
      'Shingeki no Kyojin',
      'Jujutsu Kaisen'
    ]);
  });
});

