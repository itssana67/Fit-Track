const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const sanitizeUser = require('../utils/sanitizeUser');
const { getFitnessProfile } = require('../utils/fitness');
const { todayDateOnly } = require('../utils/dates');
const { signToken, setAuthCookie, clearAuthCookie } = require('../utils/token');

const SALT_ROUNDS = 10;

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const data = req.body; // already validated by validateBody middleware

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists', { email: 'This email is already registered' });
  }

  // Never store plain passwords - bcrypt adds a salt and hashes the password
  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
      // The registration weight becomes the first point on the weight chart
      progress: { create: { date: todayDateOnly(), weight: data.weightKg, notes: 'Starting weight' } },
    },
  });

  const token = signToken(user.id);
  setAuthCookie(res, token);

  res.status(201).json({
    message: 'Account created',
    user: sanitizeUser(user),
    profile: getFitnessProfile(user),
    token, // also returned for API testing tools; the React app relies on the cookie
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  // Same message for "no user" and "wrong password" so attackers cannot
  // find out which emails are registered
  const isMatch = user ? await bcrypt.compare(password, user.password) : false;
  if (!user || !isMatch) throw new ApiError(401, 'Incorrect email or password');

  const token = signToken(user.id);
  setAuthCookie(res, token);

  res.json({ message: 'Logged in', user: sanitizeUser(user), profile: getFitnessProfile(user), token });
});

// GET /api/auth/me  (protected)
const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user, profile: getFitnessProfile(req.user) });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'Logged out' });
});

module.exports = { register, login, me, logout };
