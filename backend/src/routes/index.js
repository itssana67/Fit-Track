// Mounts every feature router under /api
const express = require('express');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'fittrack-api', time: new Date().toISOString() });
});

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/workouts', require('./workout.routes'));
router.use('/meals', require('./meal.routes'));
router.use('/progress', require('./progress.routes'));
router.use('/goals', require('./goal.routes'));
router.use('/exercises', require('./exercise.routes'));

// Small single-endpoint features
const { protect } = require('../middleware/auth');
router.get('/dashboard', protect, require('../controllers/dashboard.controller').getDashboard);
router.get('/recommendations', protect, require('../controllers/recommendation.controller').getRecommendations);
router.get('/achievements', protect, require('../controllers/achievement.controller').getAchievements);

module.exports = router;
