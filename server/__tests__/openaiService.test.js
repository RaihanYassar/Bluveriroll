process.env.NODE_ENV = 'test';

const mockCreateCompletion = jest.fn();

jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreateCompletion
      }
    }
  }))
}));

describe('OpenAI Service Unit Tests', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('harus melempar error 503 jika OPENAI_API_KEY tidak tersedia', async () => {
    const savedKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const openaiService = require('../services/openaiService');

    await expect(openaiService.generateMoodRecommendation('happy')).rejects.toMatchObject({
      status: 503
    });

    process.env.OPENAI_API_KEY = savedKey;
  });

  it('harus mengembalikan hasil parsing JSON dari OpenAI', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    const openaiService = require('../services/openaiService');

    mockCreateCompletion.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              moodAnalysis: 'Warm and relaxing vibe',
              recommendedGenres: ['Slice of Life'],
              keywords: ['healing'],
              vibeDescription: 'Comforting stories'
            })
          }
        }
      ]
    });

    const res = await openaiService.generateMoodRecommendation('healing');
    expect(res.moodAnalysis).toBe('Warm and relaxing vibe');
    expect(res.keywords).toContain('healing');
  });
});

