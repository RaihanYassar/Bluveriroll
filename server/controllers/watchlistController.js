class WatchlistController {
  static async getWatchlist(req, res, next) {
    try {
      const userId = req.user.id;
      res.status(200).json({
        message: 'Watchlist retrieval ready for model integration',
        userId,
        data: []
      });
    } catch (err) {
      next(err);
    }
  }

  static async addToWatchlist(req, res, next) {
    try {
      const userId = req.user.id;
      const { animeId, title, imageUrl, status, score, currentEpisode, totalEpisodes } = req.body;

      if (!animeId || !title) {
        throw { name: 'BadRequest', status: 400, message: 'Anime ID and title are required' };
      }

      res.status(201).json({
        message: 'Anime added to watchlist successfully',
        data: { userId, animeId, title, imageUrl, status: status || 'Plan to Watch', score, currentEpisode: currentEpisode || 0, totalEpisodes }
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateWatchlist(req, res, next) {
    try {
      const { id } = req.params;
      const { status, score, currentEpisode } = req.body;

      res.status(200).json({
        message: 'Watchlist item updated successfully',
        data: { id, status, score, currentEpisode }
      });
    } catch (err) {
      next(err);
    }
  }

  static async removeFromWatchlist(req, res, next) {
    try {
      const { id } = req.params;
      res.status(200).json({
        message: 'Anime removed from watchlist successfully',
        id
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = WatchlistController;