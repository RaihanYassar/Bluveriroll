const jikanService = require('../services/jikanService');

class AnimeController {
  static async getPopular(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const data = await jikanService.getTopAnime({ page, limit });
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  static async search(req, res, next) {
    try {
      const { q, genres, status, rating, order_by, sort, page = 1, limit = 20 } = req.query;
      const params = { page, limit };
      if (q) params.q = q;
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

