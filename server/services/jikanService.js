const axios = require('axios');

const JIKAN_BASE_URL = process.env.JIKAN_API_BASE_URL || 'https://api.jikan.moe/v4';

const jikanClient = axios.create({
  baseURL: JIKAN_BASE_URL,
  timeout: 10000,
  headers: {
    'Accept': 'application/json'
  }
});

// Helper functions for Jikan API operations
const jikanService = {
  // Get top / popular anime
  getTopAnime: async (params = {}) => {
    const response = await jikanClient.get('/top/anime', { params });
    return response.data;
  },

  // Search anime with query and filters
  searchAnime: async (params = {}) => {
    const response = await jikanClient.get('/anime', { params });
    return response.data;
  },

  // Get anime detail by Jikan / MyAnimeList ID
  getAnimeById: async (id) => {
    const response = await jikanClient.get(`/anime/${id}/full`);
    return response.data;
  },

  // Get anime genres
  getAnimeGenres: async () => {
    const response = await jikanClient.get('/genres/anime');
    return response.data;
  }
};

module.exports = jikanService;

