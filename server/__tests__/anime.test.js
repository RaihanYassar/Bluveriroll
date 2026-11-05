process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const jikanService = require('../services/jikanService');

describe('Anime Discovery & Jikan Service API Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/anime/popular', () => {
    it('harus mengembalikan anime populer dengan status 200', async () => {
      const mockData = { data: [{ mal_id: 1, title: 'Cowboy Bebop' }], pagination: {} };
      jest.spyOn(jikanService, 'getTopAnime').mockResolvedValue(mockData);

      const res = await request(app).get('/api/anime/popular?page=1&limit=10');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('Cowboy Bebop');
    });

    it('harus menangani error jika jikanService gagal', async () => {
      jest.spyOn(jikanService, 'getTopAnime').mockRejectedValue(new Error('Jikan API rate limited'));

      const res = await request(app).get('/api/anime/popular');
      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Internal Server Error');
    });
  });

  describe('GET /api/anime/search', () => {
    it('harus mencari anime berdasarkan query dan filter lengkap dengan status 200', async () => {
      const mockData = { data: [{ mal_id: 20, title: 'Naruto' }] };
      const searchSpy = jest.spyOn(jikanService, 'searchAnime').mockResolvedValue(mockData);

      const res = await request(app).get(
        '/api/anime/search?q=Naruto&genres=1,2&status=complete&rating=pg13&order_by=score&sort=desc&page=1&limit=10'
      );

      expect(res.status).toBe(200);
      expect(res.body.data[0].title).toBe('Naruto');
      expect(searchSpy).toHaveBeenCalledWith({
        q: 'Naruto',
        genres: '1,2',
        status: 'complete',
        rating: 'pg13',
        order_by: 'score',
        sort: 'desc',
        page: '1',
        limit: '10'
      });
    });

    it('harus menangani error saat pencarian gagal', async () => {
      jest.spyOn(jikanService, 'searchAnime').mockRejectedValue(new Error('Search failed'));

      const res = await request(app).get('/api/anime/search');
      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/anime/:id', () => {
    it('harus mengembalikan detail anime berdasarkan ID dengan status 200', async () => {
      const mockDetail = { data: { mal_id: 1, title: 'Cowboy Bebop', score: 8.75 } };
      jest.spyOn(jikanService, 'getAnimeById').mockResolvedValue(mockDetail);

      const res = await request(app).get('/api/anime/1');
      expect(res.status).toBe(200);
      expect(res.body.data.mal_id).toBe(1);
      expect(res.body.data.score).toBe(8.75);
    });

    it('harus menangani error saat ID anime tidak ditemukan atau fetch gagal', async () => {
      jest.spyOn(jikanService, 'getAnimeById').mockRejectedValue(new Error('Not found'));

      const res = await request(app).get('/api/anime/9999999');
      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/anime/genres', () => {
    it('harus mengembalikan daftar genre dengan status 200', async () => {
      const mockGenres = { data: [{ mal_id: 1, name: 'Action' }, { mal_id: 2, name: 'Adventure' }] };
      jest.spyOn(jikanService, 'getAnimeGenres').mockResolvedValue(mockGenres);

      const res = await request(app).get('/api/anime/genres');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });

    it('harus menangani error saat fetch genre gagal', async () => {
      jest.spyOn(jikanService, 'getAnimeGenres').mockRejectedValue(new Error('Genres failed'));

      const res = await request(app).get('/api/anime/genres');
      expect(res.status).toBe(500);
    });
  });
});

