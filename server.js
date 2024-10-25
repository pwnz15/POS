require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');
const config = require('./config/config');
const { logger } = require('./middleware/logger');
const app = require('./app');

let server;

const startServer = async () => {
  try {
    await mongoose.connect(config.DATABASE_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      readPreference: 'primary',
      retryWrites: true,
    });
    logger.info('DB connection successful!');

    server = app.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT}`);
    });

    process.on('uncaughtException', (err) => {
      console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
      console.error(err.name, err.message);
      process.exit(1);
    });

    process.on('unhandledRejection', (err) => {
      console.error('UNHANDLED REJECTION! 💥 Shutting down...');
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      server.close(() => {
        process.exit(1);
      });
    });

  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();

const closeServer = () => {
  return new Promise((resolve) => {
    if (server && server.listening) {
      server.close(() => {
        logger.info('Server closed');
        resolve();
      });
    } else {
      resolve();
    }
  });
};

module.exports = { startServer, closeServer };
