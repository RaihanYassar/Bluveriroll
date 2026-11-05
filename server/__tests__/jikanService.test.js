process.env.NODE_ENV = 'test';

/**
 * Unit test untuk jikanService
 * Mocking axios.create agar tidak melakukan HTTP call nyata ke Jikan API.
 */

// Mock axios sebelum require modul apapun
const mockGet = jest.fn();

jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: mockGet
  }))
}));

const jikanService = require('../services/jikanService');

describe('jikanService unit tests', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  describe('getTopAnime()', () => {
    it('harus mengembalikan data top anime saat request berhasil', async () => {
      const mockResponse = {
        data: {
          data: [
            { mal_id: 1, title: 'Fullmetal Alchemist: Brotherhood', score: 9.1 },
            { mal_id: 5114, title: 'Steins;Gate', score: 9.0 }
          ],
          pagination: { last_visible_page: 1, has_next_page: false }
        }
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await jikanService.getTopAnime({ page: 1, limit: 25 });

      expect(mockGet).toHaveBeenCalledWith('/top/anime', { params: { page: 1, limit: 25 } });
      expect(result).toEqual(mockResponse.data);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].title).toBe('Fullmetal Alchemist: Brotherhood');
    });

    it('harus menggunakan params kosong secara default jika tidak ada argumen', async () => {
      const mockResponse = { data: { data: [] } };
      mockGet.mockResolvedValue(mockResponse);

      await jikanService.getTopAnime();

      expect(mockGet).toHaveBeenCalledWith('/top/anime', { params: {} });
    });

    it('harus melempar error jika request gagal', async () => {
      const networkError = new Error('Network Error');
      mockGet.mockRejectedValue(networkError);

      await expect(jikanService.getTopAnime()).rejects.toThrow('Network Error');
    });
  });

  describe('searchAnime()', () => {
    it('harus mengembalikan hasil pencarian anime saat request berhasil', async () => {
      const mockResponse = {
        data: {
          data: [
            { mal_id: 21, title: 'One Piece', score: 8.7, genres: [{ name: 'Action' }] }
          ],
          pagination: { has_next_page: false }
        }
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await jikanService.searchAnime({ q: 'One Piece', limit: 10 });

      expect(mockGet).toHaveBeenCalledWith('/anime', { params: { q: 'One Piece', limit: 10 } });
      expect(result).toEqual(mockResponse.data);
      expect(result.data[0].title).toBe('One Piece');
    });

    it('harus mengembalikan array kosong jika tidak ada hasil ditemukan', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });

      const result = await jikanService.searchAnime({ q: 'animeyangpastitidakada12345' });

      expect(result.data).toHaveLength(0);
    });

    it('harus melempar error jika searchAnime gagal', async () => {
      mockGet.mockRejectedValue(new Error('Request timeout'));

      await expect(jikanService.searchAnime({ q: 'test' })).rejects.toThrow('Request timeout');
    });
  });

  describe('getAnimeById()', () => {
    it('harus mengembalikan detail anime berdasarkan ID yang valid', async () => {
      const mockResponse = {
        data: {
          data: {
            mal_id: 1,
            title: 'Cowboy Bebop',
            score: 8.75,
            synopsis: 'Follow the adventures of Spike Spiegel...',
            genres: [{ name: 'Action' }, { name: 'Sci-Fi' }],
            episodes: 26
          }
        }
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await jikanService.getAnimeById(1);

      expect(mockGet).toHaveBeenCalledWith('/anime/1/full');
      expect(result).toEqual(mockResponse.data);
      expect(result.data.title).toBe('Cowboy Bebop');
      expect(result.data.mal_id).toBe(1);
    });

    it('harus melempar error jika anime ID tidak ditemukan (404)', async () => {
      const notFoundError = new Error('Request failed with status code 404');
      notFoundError.response = { status: 404 };
      mockGet.mockRejectedValue(notFoundError);

      await expect(jikanService.getAnimeById(999999)).rejects.toThrow('Request failed with status code 404');
    });
  });

  describe('getAnimeGenres()', () => {
    it('harus mengembalikan daftar genre anime saat request berhasil', async () => {
      const mockResponse = {
        data: {
          data: [
            { mal_id: 1, name: 'Action', count: 5000 },
            { mal_id: 2, name: 'Adventure', count: 3500 },
            { mal_id: 4, name: 'Comedy', count: 6000 }
          ]
        }
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await jikanService.getAnimeGenres();

      expect(mockGet).toHaveBeenCalledWith('/genres/anime');
      expect(result).toEqual(mockResponse.data);
      expect(result.data).toHaveLength(3);
      expect(result.data[0].name).toBe('Action');
    });

    it('harus melempar error jika request genre gagal', async () => {
      mockGet.mockRejectedValue(new Error('Service unavailable'));

      await expect(jikanService.getAnimeGenres()).rejects.toThrow('Service unavailable');
    });
  });
});

