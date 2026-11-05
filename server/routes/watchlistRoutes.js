const express = require('express');
const router = express.Router();
const WatchlistController = require('../controllers/watchlistController');
const { authentication } = require('../middlewares/authMiddleware');

router.use(authentication);

router.get('/', WatchlistController.getWatchlist);
router.post('/', WatchlistController.addToWatchlist);
router.put('/:id', WatchlistController.updateWatchlist);
router.delete('/:id', WatchlistController.removeFromWatchlist);

module.exports = router;

