// Builds the Express application (middleware + routes).
// Kept separate from server.js so it can be imported by tests.
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

// CORS: only the frontend URL(s) from CLIENT_URL may call the API.
// credentials: true lets the browser send the auth cookie.
app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin (Postman, curl, server-to-server) are allowed
      if (!origin || env.clientUrls.includes(origin)) return callback(null, true);
      return callback(new ApiError(403, `Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
if (!env.isProd) app.use(morgan('dev')); // request logging during development

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ message: 'FitTrack API is running. Endpoints are under /api' });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
