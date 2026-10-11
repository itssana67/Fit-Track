// Central error handling. Every error in the app ends up here and is turned
// into a JSON response with a proper HTTP status code.
const ApiError = require('../utils/ApiError');
const env = require('../lib/env');

// Runs when no route matched the request
function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  const errors = err.errors;

  // Translate Prisma errors into friendly messages.
  // (We check err.name so this works even before `prisma generate` has run.)
  if (err.name === 'PrismaClientKnownRequestError') {
    switch (err.code) {
      case 'P2002':
        status = 409;
        message = 'A record with this value already exists';
        break;
      case 'P2025':
        status = 404;
        message = 'Record not found';
        break;
      case 'P2023':
        status = 400;
        message = 'Invalid id format';
        break;
      case 'P2031':
        status = 500;
        message =
          'Prisma needs MongoDB to run as a replica set. Use MongoDB Atlas or start a local replica set (see README).';
        break;
      default:
        status = 500;
        message = 'Database error';
    }
  } else if (err.name === 'PrismaClientValidationError') {
    status = 400;
    message = 'Invalid data sent to the database';
  } else if (err.name === 'PrismaClientInitializationError') {
    status = 503;
    message = 'Cannot connect to the database. Check DATABASE_URL in backend/.env';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON';
  }

  if (status >= 500) {
    console.error('[FitTrack error]', err);
    // Do not leak internal details in production
    if (env.isProd && !err.isApiError) message = 'Something went wrong. Please try again';
  }

  const body = { message };
  if (errors) body.errors = errors;
  if (!env.isProd && status >= 500) body.stack = err.stack;

  res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
