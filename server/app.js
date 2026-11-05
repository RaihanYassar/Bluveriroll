require('dotenv').config();

const express = require('express');
const cors = require('cors');
const apiRouter = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to BLUVERIROLL API - Discover Anime. Find Your Next Favorite.',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// API Routes
app.use('/api', apiRouter);

// 404 Route Not Found
app.use((req, res, next) => {
  res.status(404).json({
    statusCode: 404,
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;

