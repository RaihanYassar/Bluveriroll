const express = require('express');
const router = express.Router();
const WatchlistController = require('../controllers/watchlistController');
const { authentication, watchlistAuthorization } = require('../middlewares/authMiddleware');

router.use(authentication);

router.get('/', WatchlistController.getWatchlist);
router.post('/', WatchlistController.addToWatchlist);
router.put('/:id', watchlistAuthorization, WatchlistController.updateWatchlist);
router.delete('/:id', watchlistAuthorization, WatchlistController.removeFromWatchlist);

module.exports = router;

