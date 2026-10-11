const asyncHandler = require('../utils/asyncHandler');
const { buildRecommendations } = require('../services/recommendation.service');

// GET /api/recommendations
const getRecommendations = asyncHandler(async (req, res) => {
  res.json(await buildRecommendations(req.user));
});

module.exports = { getRecommendations };
