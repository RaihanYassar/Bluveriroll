const express = require('express');
const router = express.Router();
const MoodSyncController = require('../controllers/moodSyncController');

// Public or authenticated recommendations
router.post('/recommend', MoodSyncController.getRecommendations);

module.exports = router;

