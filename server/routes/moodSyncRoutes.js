const express = require('express');
const router = express.Router();
const MoodSyncController = require('../controllers/moodSyncController');

router.post('/recommend', MoodSyncController.getRecommendations);

module.exports = router;

