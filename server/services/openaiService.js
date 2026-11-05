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

const openaiService = {
  // Analyze user mood / prompt and extract anime search criteria and reasoning
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
          content: `You are BLUVERIROLL's MoodSync AI anime recommendation assistant. 
Your goal is to parse the user's mood, emotional state, or scenario and recommend suitable anime themes, genres, and specific search keywords.
Respond ONLY with a valid JSON object matching this schema:
{
  "moodAnalysis": "brief empathetic analysis of user's current mood",
  "recommendedGenres": ["Genre1", "Genre2"],
  "keywords": ["keyword1", "keyword2"],
  "vibeDescription": "why these types of anime match the mood"
}`
        },
        {
          role: 'user',
          content: `User Mood / Request: "${moodPrompt}". Preferences: ${JSON.stringify(userPreferences)}`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    return parsed;
  }
};

module.exports = openaiService;

