const redis = require('redis');
const { promisify } = require('util');

let client;
let getAsync;
let setAsync;

if (process.env.NODE_ENV !== 'test') {
  client = redis.createClient(process.env.REDIS_URL);

  client.on('error', (error) => {
    console.error('Redis error:', error);
  });

  getAsync = promisify(client.get).bind(client);
  setAsync = promisify(client.set).bind(client);
} else {
  // Mock implementation for testing
  const mockCache = {};
  getAsync = async (key) => mockCache[key] || null;
  setAsync = async (key, value) => { mockCache[key] = value; return 'OK'; };
  client = { get: getAsync, set: setAsync };
}

module.exports = {
  get: getAsync,
  set: setAsync,
  client
};
