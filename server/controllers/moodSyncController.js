const openaiService = require('../services/openaiService');
const jikanService = require('../services/jikanService');

class MoodSyncController {
  static async getRecommendations(req, res, next) {
    try {
      const { mood } = req.body;
      if (!mood || mood.trim().length === 0) {
        throw { name: 'BadRequest', status: 400, message: 'Mood prompt is required' };
      }

      // 1. Analyze mood with OpenAI
      let aiAnalysis;
      try {
        aiAnalysis = await openaiService.generateMoodRecommendation(mood);
      } catch (aiErr) {
        // Fallback gracefully if AI is unavailable
        aiAnalysis = {
          moodAnalysis: `Finding anime matching: "${mood}"`,
          recommendedGenres: [],
          keywords: [mood],
          vibeDescription: 'Curated based on your search query'
        };
      }

      // 2. Fetch real anime from Jikan based on keywords or genres
      const searchQuery = (aiAnalysis.keywords && aiAnalysis.keywords[0]) || mood;
      const animeResults = await jikanService.searchAnime({
        q: searchQuery,
        limit: 10,
        order_by: 'score',
        sort: 'desc'
      });

      res.status(200).json({
        moodAnalysis: aiAnalysis,
        recommendations: animeResults.data || []
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = MoodSyncController;

