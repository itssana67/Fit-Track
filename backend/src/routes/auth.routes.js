const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, me, logout } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { registerRules, loginRules } = require('./rules');

const router = express.Router();

// Slows down password guessing: max 30 login/register attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait a few minutes and try again' },
});

router.post('/register', authLimiter, validateBody(registerRules), register);
router.post('/login', authLimiter, validateBody(loginRules), login);
router.get('/me', protect, me);
router.post('/logout', logout);

module.exports = router;
