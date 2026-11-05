process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const openaiService = require('../services/openaiService');
const jikanService = require('../services/jikanService');

describe('MoodSync AI & OpenAI Service API Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/moodsync/recommend', () => {
    it('harus menolak request dengan status 400 jika mood kosong', async () => {
      const res = await request(app)
        .post('/api/moodsync/recommend')
        .send({ mood: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Mood prompt is required/i);
    });

    it('harus mengembalikan rekomendasi moodsync dengan status 200 saat AI dan Jikan berhasil', async () => {
      const mockAiAnalysis = {
        moodAnalysis: 'Feeling energetic and ready for an adventure',
        recommendedGenres: ['Action', 'Adventure'],
        keywords: ['One Piece'],
        vibeDescription: 'Grand high-seas epic'
      };
      const mockJikanResults = {
        data: [{ mal_id: 21, title: 'One Piece', score: 8.7 }]
      };

      jest.spyOn(openaiService, 'generateMoodRecommendation').mockResolvedValue(mockAiAnalysis);
      jest.spyOn(jikanService, 'searchAnime').mockResolvedValue(mockJikanResults);

      const res = await request(app)
        .post('/api/moodsync/recommend')
        .send({ mood: 'energetic shonen adventure' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('moodAnalysis');
      expect(res.body.moodAnalysis.moodAnalysis).toBe(mockAiAnalysis.moodAnalysis);
      expect(res.body.recommendations).toHaveLength(1);
      expect(res.body.recommendations[0].title).toBe('One Piece');
    });

    it('harus tetap mengembalikan rekomendasi fallback jika OpenAI melempar error', async () => {
      jest.spyOn(openaiService, 'generateMoodRecommendation').mockRejectedValue(new Error('OpenAI unavailable'));
      jest.spyOn(jikanService, 'searchAnime').mockResolvedValue({
        data: [{ mal_id: 1, title: 'Cowboy Bebop' }]
      });

      const res = await request(app)
        .post('/api/moodsync/recommend')
        .send({ mood: 'relaxing jazz vibe' });

      expect(res.status).toBe(200);
      expect(res.body.moodAnalysis.moodAnalysis).toMatch(/relaxing jazz vibe/i);
      expect(res.body.recommendations).toHaveLength(1);
    });

    it('harus menangani error saat pencarian jikan gagal', async () => {
      jest.spyOn(openaiService, 'generateMoodRecommendation').mockResolvedValue({
        moodAnalysis: 'test',
        keywords: ['test']
      });
      jest.spyOn(jikanService, 'searchAnime').mockRejectedValue(new Error('Jikan failed'));

      const res = await request(app)
        .post('/api/moodsync/recommend')
        .send({ mood: 'some mood' });

      expect(res.status).toBe(500);
    });

    it('harus menggunakan mood sebagai searchQuery jika AI tidak mengembalikan keywords (array kosong)', async () => {
      // Branch: (aiAnalysis.keywords && aiAnalysis.keywords[0]) || mood
      // Ketika keywords adalah array kosong, keywords[0] = undefined (falsy) → pakai mood
      jest.spyOn(openaiService, 'generateMoodRecommendation').mockResolvedValue({
        moodAnalysis: 'Feeling bored and need something new',
        recommendedGenres: ['Drama'],
        keywords: [], // empty array → keywords[0] is undefined → falsy → gunakan mood
        vibeDescription: 'Something interesting'
      });

      jest.spyOn(jikanService, 'searchAnime').mockResolvedValue({
        data: [{ mal_id: 10, title: 'Death Note', score: 8.6 }]
      });

      const res = await request(app)
        .post('/api/moodsync/recommend')
        .send({ mood: 'bored and need something new' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('moodAnalysis');
      expect(res.body.recommendations).toHaveLength(1);
      // searchAnime dipanggil dengan mood sebagai query (bukan keywords[0])
      expect(jikanService.searchAnime).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'bored and need something new' })
      );
    });

    it('harus menggunakan mood sebagai searchQuery jika AI tidak mengembalikan keywords sama sekali (undefined)', async () => {
      // Branch: keywords undefined → (undefined && ...) = false → pakai mood
      jest.spyOn(openaiService, 'generateMoodRecommendation').mockResolvedValue({
        moodAnalysis: 'Generic analysis',
        recommendedGenres: ['Action'],
        // keywords tidak ada dalam response
        vibeDescription: 'Some vibe'
      });

      jest.spyOn(jikanService, 'searchAnime').mockResolvedValue({
        data: [{ mal_id: 20, title: 'Naruto', score: 7.9 }]
      });

      const res = await request(app)
        .post('/api/moodsync/recommend')
        .send({ mood: 'samurai battles' });

      expect(res.status).toBe(200);
      expect(jikanService.searchAnime).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'samurai battles' })
      );
    });
  });

  describe('openaiService unit test', () => {
    it('harus melempar error 503 jika OPENAI_API_KEY tidak dikonfigurasi', async () => {
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      await expect(
        openaiService.generateMoodRecommendation('chill')
      ).rejects.toMatchObject({
        status: 503,
        message: expect.stringMatching(/OpenAI API key is not configured/i)
      });

      process.env.OPENAI_API_KEY = originalKey;
    });
  });
});

