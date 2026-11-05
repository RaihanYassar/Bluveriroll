const jikanService = require('../services/jikanService');

class AnimeController {
  static async getPopular(req, res, next) {
    try {
      const { page = 1, limit = 24, type, filter } = req.query;
      const params = { page, limit };
      if (type && type !== 'all') params.type = type;
      if (filter && filter !== 'all') params.filter = filter;

      const data = await jikanService.getTopAnime(params);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  static async search(req, res, next) {
    try {
      const { q, type, genres, status, rating, order_by, sort, page = 1, limit = 24 } = req.query;
      const params = { page, limit };
      if (q) params.q = q;
      if (type && type !== 'all') params.type = type;
      if (genres) params.genres = genres;
      if (status) params.status = status;
      if (rating) params.rating = rating;
      if (order_by) params.order_by = order_by;
      if (sort) params.sort = sort;

      const data = await jikanService.searchAnime(params);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  static async getDetail(req, res, next) {
    try {
      const { id } = req.params;
      const data = await jikanService.getAnimeById(id);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  static async getEpisodes(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1 } = req.query;
      const data = await jikanService.getAnimeEpisodes(id, page);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  static async getGenres(req, res, next) {
    try {
      const data = await jikanService.getAnimeGenres();
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AnimeController;
