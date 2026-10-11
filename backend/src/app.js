// Builds the Express application (middleware + routes).
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const env = require('./lib/env');
const routes = require('./routes');
const ApiError = require('./utils/ApiError');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security headers
app.use(helmet());

// CORS: allow configured frontend origins and credentials.
app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin (such as curl or Postman).
      if (!origin || env.clientUrls.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new ApiError(403, `Origin ${origin} is not allowed by CORS`)
      );
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

if (!env.isProd) {
  app.use(morgan('dev'));
}

// Health check: lets the frontend verify the API is reachable.
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FitTrack API is running',
  });
});

// Application API routes
app.use('/api', routes);

// Root health check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FitTrack API is running. Endpoints are under /api',
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;