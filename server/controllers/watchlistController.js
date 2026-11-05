const { Watchlist } = require('../models');

class WatchlistController {
  static async getWatchlist(req, res, next) {
    try {
      const userId = req.user.id;
      const items = await Watchlist.findAll({
        where: { userId },
        order: [['updatedAt', 'DESC']]
      });

      res.status(200).json({
        message: 'Watchlist retrieved successfully',
        userId,
        data: items
      });
    } catch (err) {
      next(err);
    }
  }

  static async addToWatchlist(req, res, next) {
    try {
      const userId = req.user.id;
      const { animeId, title, imageUrl, status, score, currentEpisode, totalEpisodes, genres, notes } = req.body;

      if (!animeId || !title) {
        throw { name: 'BadRequest', status: 400, message: 'Anime ID and title are required' };
      }

      const normalizedGenres = Array.isArray(genres) ? genres.join(', ') : genres || null;
      const parsedScore = score !== undefined && score !== null && score !== '' ? Number(score) : null;

      let item = await Watchlist.findOne({ where: { userId, animeId: Number(animeId) } });
      if (item) {
        await item.update({
          title,
          imageUrl: imageUrl || item.imageUrl,
          status: status || item.status,
          score: parsedScore !== null ? parsedScore : item.score,
          currentEpisode: currentEpisode !== undefined ? Number(currentEpisode) : item.currentEpisode,
          totalEpisodes: totalEpisodes !== undefined ? Number(totalEpisodes) : item.totalEpisodes,
          genres: normalizedGenres || item.genres,
          notes: notes !== undefined ? notes : item.notes
        });
      } else {
        item = await Watchlist.create({
          userId,
          animeId: Number(animeId),
          title,
          imageUrl,
          status: status || 'Plan to Watch',
          score: parsedScore,
          currentEpisode: currentEpisode || 0,
          totalEpisodes: totalEpisodes || 0,
          genres: normalizedGenres,
          notes: notes || null
        });
      }

      res.status(201).json({
        message: 'Anime added to watchlist successfully',
        data: item
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateWatchlist(req, res, next) {
    try {
      const item = req.watchlistItem;
      const { status, score, currentEpisode, notes } = req.body;

      await item.update({
        ...(status !== undefined && { status }),
        ...(score !== undefined && { score: score === null || score === '' ? null : Number(score) }),
        ...(currentEpisode !== undefined && { currentEpisode: Number(currentEpisode) }),
        ...(notes !== undefined && { notes })
      });

      res.status(200).json({
        message: 'Watchlist item updated successfully',
        data: item
      });
    } catch (err) {
      next(err);
    }
  }

  static async removeFromWatchlist(req, res, next) {
    try {
      const item = req.watchlistItem;
      const id = item.id;
      await item.destroy();

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
