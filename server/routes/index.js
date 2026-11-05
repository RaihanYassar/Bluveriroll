const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const animeRoutes = require('./animeRoutes');
const watchlistRoutes = require('./watchlistRoutes');
const moodSyncRoutes = require('./moodSyncRoutes');
const profileRoutes = require('./profileRoutes');

// API Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'BLUVERIROLL API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Modular Routes
router.use('/auth', authRoutes);
router.use('/anime', animeRoutes);
router.use('/watchlist', watchlistRoutes);
router.use('/moodsync', moodSyncRoutes);
router.use('/profile', profileRoutes);

module.exports = router;

