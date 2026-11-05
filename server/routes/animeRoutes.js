const express = require('express');
const router = express.Router();
const AnimeController = require('../controllers/animeController');

router.get('/popular', AnimeController.getPopular);
router.get('/search', AnimeController.search);
router.get('/genres', AnimeController.getGenres);
router.get('/:id', AnimeController.getDetail);

module.exports = router;

