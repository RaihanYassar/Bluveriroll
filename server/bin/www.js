const app = require('../app');
const { sequelize } = require('../models');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`BLUVERIROLL Server is running on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
});

const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Closing HTTP server and database connections...`);
  server.close(async () => {
    try {
      await sequelize.close();
      console.log('Database connection closed cleanly.');
      process.exit(0);
    } catch (err) {
      console.error('Error closing database connection:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
