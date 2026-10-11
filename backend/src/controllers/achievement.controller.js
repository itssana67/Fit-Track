const asyncHandler = require('../utils/asyncHandler');
const { getAchievementsForUser } = require('../services/achievement.service');

// GET /api/achievements
const getAchievements = asyncHandler(async (req, res) => {
  res.json(await getAchievementsForUser(req.user.id));
});

module.exports = { getAchievements };
