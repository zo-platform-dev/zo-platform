require('dotenv').config();

// Validate environment variables before starting the server
const { validateEnv } = require('./config/validateEnv');
try {
  validateEnv();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const winston = require('winston');
const path = require('path');

const { connectQueue } = require('./queue/queue');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');
const swaggerSetup = require('./config/swagger');
const cronJobs = require('./cron');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(process.env.LOG_FILE_PATH || './logs', 'error.log'),
      level: 'error'
    }),
    new winston.transports.File({
      filename: path.join(process.env.LOG_FILE_PATH || './logs', 'combined.log')
    })
  ]
});

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'https://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 500,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/health/'
});
app.use('/api/', limiter);

app.use(requestLogger);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis: app.redis?.connected ? 'connected' : 'disconnected'
  });
});

app.use('/api', routes);

app.use('/api-docs', swaggerSetup.serve, swaggerSetup.setup);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve frontend build files
  app.use(express.static(path.join(__dirname, 'public')));

  // Handle React routing - return index.html for any unknown routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zo-platform');
    logger.info('MongoDB connected');

    app.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    });

    app.redis.on('connect', () => logger.info('Redis connected'));
    app.redis.on('error', (err) => logger.error('Redis error:', err));

    await connectQueue();
    logger.info('Task queue initialized');

    cronJobs.start();

    app.listen(PORT, () => {
      logger.info(`ZO Platform server running on port ${PORT}`);
      logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;