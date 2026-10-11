// JWT helpers.
// The token is sent to the browser in an httpOnly cookie: JavaScript in the
// page cannot read it, which protects it from XSS attacks.
const jwt = require('jsonwebtoken');
const env = require('../lib/env');

const COOKIE_NAME = 'fittrack_token';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days, matches JWT_EXPIRES_IN default

function signToken(userId) {
  // "sub" (subject) is the standard JWT claim for "who this token belongs to"
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

function cookieOptions() {
  return {
    httpOnly: true, // not readable from JavaScript
    // In production the frontend and API usually live on different domains,
    // which requires SameSite=None + Secure (HTTPS). Locally "lax" works.
    secure: env.isProd,
    sameSite: env.isProd ? 'none' : 'lax',
    path: '/',
  };
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, { ...cookieOptions(), maxAge: COOKIE_MAX_AGE_MS });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, cookieOptions());
}

module.exports = { COOKIE_NAME, signToken, verifyToken, setAuthCookie, clearAuthCookie };
