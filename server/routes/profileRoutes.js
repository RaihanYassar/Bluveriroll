const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/profileController');
const { authentication } = require('../middlewares/authMiddleware');

router.use(authentication);

router.get('/dna', ProfileController.getAnimeDNA);
router.get('/journey', ProfileController.getWatchJourney);
router.post('/tarot', ProfileController.getTarotReading);
router.post('/roast', ProfileController.roastWatchlist);

module.exports = router;
