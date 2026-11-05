require('dotenv').config();

const express = require('express');
const cors = require('cors');
const apiRouter = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Trust first proxy (Cloudflare / AWS ALB / Nginx Reverse Proxy)
app.set('trust proxy', 1);

// Production-safe CORS supporting credentials + multiple origins (Cloudflare, Firebase, Localhost)
const allowedOrigins = process.env.CLIENT_URL && process.env.CLIENT_URL !== '*'
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
  : true;

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security headers & HTTP Request-Response Terminal Logger
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (process.env.NODE_ENV !== 'test' && typeof res.on === 'function') {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    });
  }

  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Root welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to BLUVERIROLL API - Discover Movies & Anime. Find Your Next Favorite.',
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
