// Loads variables from backend/.env and exposes them in one typed object.
// Importing this file first guarantees dotenv runs before anything else.
require('dotenv').config();

const REQUIRED = ['DATABASE_URL', 'JWT_SECRET'];
const missing = REQUIRED.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `\n[FitTrack] Missing environment variables: ${missing.join(', ')}\n` +
      'Copy backend/.env.example to backend/.env and fill in the values.\n'
  );
  process.exit(1);
}

const nodeEnv = process.env.NODE_ENV || 'development';

module.exports = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv,
  isProd: nodeEnv === 'production',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // CLIENT_URL may hold several comma separated origins
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean),
  exerciseApiKey: process.env.EXERCISE_API_KEY || '',
  exerciseApiUrl: process.env.EXERCISE_API_URL || 'https://api.api-ninjas.com/v1/exercises',
};
