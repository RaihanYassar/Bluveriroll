process.env.NODE_ENV = 'test';

/**
 * Unit test untuk openaiService
 * Menggunakan jest.mock('openai') untuk mengontrol konstruktor OpenAI
 * tanpa melakukan API call nyata.
 */

// Harus di-define SEBELUM require modul apapun
jest.mock('openai', () => {
  const mockCreate = jest.fn();
  const MockOpenAI = jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate
      }
    }
  }));
  // Simpan referensi ke mockCreate agar test bisa mengaksesnya
  MockOpenAI._mockCreate = mockCreate;
  return { OpenAI: MockOpenAI };
});

describe('openaiService unit tests', () => {
  let openaiService;
  let MockOpenAI;
  let mockCreate;

  beforeEach(() => {
    // Reset module registry agar openaiInstance (singleton) direset tiap test
    jest.resetModules();

    // Re-require modul setelah reset agar dapat fresh instance
    const openaiModule = require('openai');
    MockOpenAI = openaiModule.OpenAI;
    mockCreate = MockOpenAI._mockCreate;
    mockCreate.mockReset();
    MockOpenAI.mockClear();

    openaiService = require('../services/openaiService');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateMoodRecommendation()', () => {
    it('harus melempar error 503 jika OPENAI_API_KEY tidak dikonfigurasi', async () => {
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      await expect(
        openaiService.generateMoodRecommendation('chill')
      ).rejects.toMatchObject({
        status: 503,
        message: expect.stringMatching(/OpenAI API key is not configured/i)
      });

      if (originalKey) process.env.OPENAI_API_KEY = originalKey;
    });

    it('harus membuat instance OpenAI baru saat API key tersedia', async () => {
      process.env.OPENAI_API_KEY = 'sk-test-fake-key-for-bluveriroll';

      const mockParsedResponse = {
        moodAnalysis: 'Feeling adventurous',
        recommendedGenres: ['Action', 'Adventure'],
        keywords: ['shonen', 'adventure'],
        vibeDescription: 'High energy shows with epic journeys'
      };

      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify(mockParsedResponse)
          }
        }]
      });

      const result = await openaiService.generateMoodRecommendation('I want adventure');

      expect(MockOpenAI).toHaveBeenCalledTimes(1);
      expect(MockOpenAI).toHaveBeenCalledWith({ apiKey: 'sk-test-fake-key-for-bluveriroll' });
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockParsedResponse);
      expect(result.moodAnalysis).toBe('Feeling adventurous');
      expect(result.keywords).toContain('shonen');

      delete process.env.OPENAI_API_KEY;
    });

    it('harus menggunakan instance OpenAI yang sudah ada (singleton caching) pada panggilan kedua', async () => {
      process.env.OPENAI_API_KEY = 'sk-test-fake-key-for-caching';

      const mockParsedResponse = {
        moodAnalysis: 'Feeling calm',
        recommendedGenres: ['Slice of Life'],
        keywords: ['calm', 'relaxing'],
        vibeDescription: 'Peaceful and calming shows'
      };

      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify(mockParsedResponse)
          }
        }]
      });

      // Panggil dua kali — instance hanya dibuat sekali (singleton)
      await openaiService.generateMoodRecommendation('I want calm anime');
      await openaiService.generateMoodRecommendation('Something relaxing');

      // Konstruktor hanya dipanggil sekali karena instance di-cache
      expect(MockOpenAI).toHaveBeenCalledTimes(1);
      // Tapi API dipanggil dua kali
      expect(mockCreate).toHaveBeenCalledTimes(2);

      delete process.env.OPENAI_API_KEY;
    });

    it('harus meneruskan userPreferences ke konten pesan AI', async () => {
      process.env.OPENAI_API_KEY = 'sk-test-fake-key-for-prefs';

      const userPrefs = { favoriteGenres: ['Mecha', 'Sci-Fi'], avoidGenres: ['Horror'] };
      const mockParsedResponse = {
        moodAnalysis: 'Into tech and mechs',
        recommendedGenres: ['Mecha'],
        keywords: ['mecha', 'robot'],
        vibeDescription: 'Giant robot battles and future tech'
      };

      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify(mockParsedResponse)
          }
        }]
      });

      await openaiService.generateMoodRecommendation('I love robots', userPrefs);

      const callArgs = mockCreate.mock.calls[0][0];
      const userMessage = callArgs.messages.find(m => m.role === 'user');
      expect(userMessage.content).toContain('I love robots');
      expect(userMessage.content).toContain(JSON.stringify(userPrefs));

      delete process.env.OPENAI_API_KEY;
    });

    it('harus menggunakan model default gpt-4o-mini jika OPENAI_MODEL tidak dikonfigurasi', async () => {
      process.env.OPENAI_API_KEY = 'sk-test-fake-key-for-model';
      const originalModel = process.env.OPENAI_MODEL;
      delete process.env.OPENAI_MODEL;

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ moodAnalysis: 'test', keywords: ['test'] }) } }]
      });

      await openaiService.generateMoodRecommendation('test');

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.model).toBe('gpt-4o-mini');

      delete process.env.OPENAI_API_KEY;
      if (originalModel) process.env.OPENAI_MODEL = originalModel;
    });

    it('harus menggunakan OPENAI_MODEL dari env jika dikonfigurasi', async () => {
      process.env.OPENAI_API_KEY = 'sk-test-fake-key-for-custom-model';
      process.env.OPENAI_MODEL = 'gpt-4o';

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ moodAnalysis: 'test', keywords: ['test'] }) } }]
      });

      await openaiService.generateMoodRecommendation('test');

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.model).toBe('gpt-4o');

      delete process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_MODEL;
    });

    it('harus melempar error jika OpenAI API mengembalikan error', async () => {
      process.env.OPENAI_API_KEY = 'sk-test-fake-key-for-api-error';

      mockCreate.mockRejectedValue(new Error('OpenAI API quota exceeded'));

      await expect(
        openaiService.generateMoodRecommendation('sad mood')
      ).rejects.toThrow('OpenAI API quota exceeded');

      delete process.env.OPENAI_API_KEY;
    });

    it('harus melempar error jika response AI bukan JSON valid', async () => {
      process.env.OPENAI_API_KEY = 'sk-test-fake-key-for-json-error';

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'bukan json valid sama sekali' } }]
      });

      await expect(
        openaiService.generateMoodRecommendation('test')
      ).rejects.toThrow();

      delete process.env.OPENAI_API_KEY;
    });
  });
});

