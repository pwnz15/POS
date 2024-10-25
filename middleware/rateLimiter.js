const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../utils/cache').client;

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'rate-limit:'
    }),
    windowMs,
    max,
    message
  });
};

module.exports = {
  globalLimiter: createRateLimiter(15 * 60 * 1000, 100, 'Too many requests, please try again later.'),
  authLimiter: createRateLimiter(60 * 60 * 1000, 5, 'Too many login attempts, please try again later.')
};
