require('dotenv').config({ path: '../.env' });

module.exports = {
  PORT: process.env.PORT || 3000,
  DATABASE_URI: process.env.DATABASE_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '90d',
  JWT_COOKIE_EXPIRES_IN: parseInt(process.env.JWT_COOKIE_EXPIRES_IN) || 90,
  NODE_ENV: process.env.NODE_ENV,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000,
  RATE_LIMIT_MAX_AUTHENTICATED: parseInt(process.env.RATE_LIMIT_MAX_AUTHENTICATED) || 1000,
  RATE_LIMIT_WINDOW_MS_AUTHENTICATED: parseInt(process.env.RATE_LIMIT_WINDOW_MS_AUTHENTICATED) || 60 * 60 * 1000,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
};




