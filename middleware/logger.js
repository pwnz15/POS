const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const logDir = 'logs';

const transport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d'
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    transport,
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

const loggerMiddleware = (req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
};

module.exports = { logger, loggerMiddleware };
