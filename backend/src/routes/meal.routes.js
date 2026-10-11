const express = require('express');
const controller = require('../controllers/meal.controller');
const { protect } = require('../middleware/auth');
const { validateBody, validateObjectId } = require('../middleware/validate');
const { mealRules } = require('./rules');

const router = express.Router();
router.use(protect);

router.get('/', controller.getMeals);
router.get('/summary', controller.getDailySummary); // must come before "/:id" routes
router.post('/', validateBody(mealRules), controller.createMeal);
router.put('/:id', validateObjectId('id'), validateBody(mealRules, { partial: true }), controller.updateMeal);
router.delete('/:id', validateObjectId('id'), controller.deleteMeal);

module.exports = router;
