const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const sanitizeUser = require('../utils/sanitizeUser');
const { getFitnessProfile } = require('../utils/fitness');
const { todayDateOnly, endOfDay } = require('../utils/dates');

// GET /api/users/me
const getProfile = asyncHandler(async (req, res) => {
  res.json({ user: req.user, profile: getFitnessProfile(req.user) });
});

// PUT /api/users/me
const updateProfile = asyncHandler(async (req, res) => {
  const data = req.body;
  const userId = req.user.id;

  if (data.email && data.email !== req.user.email) {
    const taken = await prisma.user.findUnique({ where: { email: data.email } });
    if (taken) throw new ApiError(409, 'This email is already in use', { email: 'This email is already in use' });
  }

  const user = await prisma.user.update({ where: { id: userId }, data });

  // If the weight changed, record it on the progress chart for today
  if (data.weightKg !== undefined && data.weightKg !== req.user.weightKg) {
    const today = todayDateOnly();
    const todayEntry = await prisma.progress.findFirst({
      where: { userId, date: { gte: today, lte: endOfDay(today) } },
    });
    if (todayEntry) {
      await prisma.progress.update({ where: { id: todayEntry.id }, data: { weight: data.weightKg } });
    } else {
      await prisma.progress.create({ data: { userId, date: today, weight: data.weightKg } });
    }
  }

  res.json({ message: 'Profile saved', user: sanitizeUser(user), profile: getFitnessProfile(user) });
});

// PUT /api/users/me/password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new ApiError(400, 'Current password is incorrect', { currentPassword: 'Current password is incorrect' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(newPassword, 10) },
  });
  res.json({ message: 'Password changed' });
});

module.exports = { getProfile, updateProfile, changePassword };
