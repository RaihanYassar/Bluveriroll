const { OpenAI } = require('openai');

let openaiInstance = null;

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openaiInstance;
};

const SYSTEM_PROMPT = `You are BLUVERIROLL's curator for anime and movies.
Analyze the user's current mood, situation, or what kind of story they feel like watching.
Write in the SAME LANGUAGE as the user's prompt. If the user writes in Indonesian, use natural, conversational Indonesian (like a knowledgeable friend recommending a show, not stiff textbook translation). Do not use emojis.

Guidelines:
1. Recommend 6 real, well-known Anime or Anime Movies available on MyAnimeList (Jikan API) and explain simply and naturally why each title fits what the user is looking for.
2. Never recommend two titles from the same franchise (for example, do not list both "Attack on Titan" and "Attack on Titan Season 2"). Every pick must be from a different franchise.
3. If "excludedTitles" is provided in Preferences, do not recommend any title or franchise in that list.

Map genres to official MyAnimeList Genre IDs in "jikanGenreIds":
1=Action, 2=Adventure, 4=Comedy, 7=Mystery, 8=Drama, 10=Fantasy, 14=Horror, 22=Romance, 24=Sci-Fi, 30=Sports, 36=Slice of Life, 37=Supernatural, 41=Suspense.

Respond ONLY with a valid JSON object matching this exact schema:
{
  "moodAnalysis": "Natural, relatable reading of what the user feels like watching right now (2 sentences, no emojis)",
  "emotionalTone": "Short 2-4 word tone label (e.g. 'Tenang & Hangat', 'Intens & Penuh Aksi', 'Cerita Misteri Padat')",
  "vibeDescription": "1-2 sentences describing the pacing, atmosphere, and story tone that fits right now",
  "recommendedGenres": ["Genre1", "Genre2", "Genre3"],
  "jikanGenreIds": [8, 36],
  "keywords": ["Exact Anime Title 1", "Exact Anime Title 2", "Exact Anime Title 3"],
  "curatedPicks": [
    {
      "title": "Exact canonical anime/movie title (e.g. 'Sousou no Frieren', 'Kimi no Na wa.', 'Bocchi the Rock!', 'Haikyuu!!', 'Violet Evergarden')",
      "matchScore": 98,
      "moodTag": "Short 2-3 word label (e.g. 'Tempo Tenang', 'Aksi Cepat')",
      "aiReason": "1-2 natural sentences explaining why this title fits the user's current mood"
    }
  ]
}`;

const openaiService = {
  generateMoodRecommendation: async (moodPrompt, userPreferences = {}) => {
    const openai = getOpenAIClient();
    if (!openai) {
      throw {
        name: 'ServiceUnavailable',
        status: 503,
        message: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in the server environment.'
      };
    }

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: `User Mood / Request: "${moodPrompt}". Preferences & Context: ${JSON.stringify(userPreferences)}`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    return parsed;
  },

  SYSTEM_PROMPT
};

module.exports = openaiService;
