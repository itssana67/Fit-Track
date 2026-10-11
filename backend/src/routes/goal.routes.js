const express = require('express');
const controller = require('../controllers/goal.controller');
const { protect } = require('../middleware/auth');
const { validateBody, validateObjectId } = require('../middleware/validate');
const { goalRules } = require('./rules');

const router = express.Router();
router.use(protect);

router.get('/', controller.getGoals);
router.post('/', validateBody(goalRules), controller.createGoal);
router.put('/:id', validateObjectId('id'), validateBody(goalRules, { partial: true }), controller.updateGoal);
router.delete('/:id', validateObjectId('id'), controller.deleteGoal);

module.exports = router;
