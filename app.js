const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { loggerMiddleware } = require('./middleware/logger');
const AppError = require('./utils/appError');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth');
const articleRoutes = require('./routes/articles');
const clientRoutes = require('./routes/clients');
const deliveryRoutes = require('./routes/deliveries');
const inventoryRoutes = require('./routes/inventory');
const saleRoutes = require('./routes/sales');
const supplierRoutes = require('./routes/suppliers');
const posRoutes = require('./routes/pos');
const errorHandler = require('./middleware/errorHandler');
const config = require('./config/config');
const chauffeur = require('./routes/chauffeur');

dotenv.config();

const app = express();

// Update CORS configuration
const corsOptions = {
    origin: ['http://localhost:9000', 'app://./index.html'], // Allow both dev server and Electron app
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Enable pre-flight requests for all routes
app.options('*', cors(corsOptions));

// Connect to MongoDB
mongoose.connect(config.DATABASE_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('DB connection successful!'))
    .catch((err) => console.error('DB connection error:', err));

// Middleware
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());
app.use(loggerMiddleware);

// Custom key generator for rate limiting
const customKeyGenerator = (req) => {
    if (req.user) {
        return req.user.id; // Use user ID for authenticated requests
    }
    return req.ip; // Fall back to IP address for unauthenticated requests
};

// Update rate limiter configuration
const limiter = rateLimit({
    max: config.RATE_LIMIT_MAX,
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    message: 'Too many requests, please try again later.',
    keyGenerator: customKeyGenerator,
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for ${req.user ? `user ${req.user.id}` : `IP ${req.ip}`}`);
        res.status(429).json({
            status: 'error',
            message: 'Too many requests, please try again later.'
        });
    }
});

// Routes
app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: 'POS Inventory API is running',
        version: '1.0.0' // Replace with your actual API version
    });
});
app.head('/', (req, res) => {
    res.sendStatus(200);
});

app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/chauffeurs', chauffeur);

// Add error handling for unhandled routes
app.all('*', (req, res, next) => {
    logger.warn(`Unhandled route: ${req.method} ${req.originalUrl}`);
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Move error handling middleware to the end
app.use(errorHandler);

module.exports = app;
