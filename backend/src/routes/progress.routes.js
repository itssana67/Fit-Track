const express = require('express');
const controller = require('../controllers/progress.controller');
const { protect } = require('../middleware/auth');
const { validateBody, validateObjectId } = require('../middleware/validate');
const { progressRules } = require('./rules');

const router = express.Router();
router.use(protect);

router.get('/', controller.getProgress);
router.post('/', validateBody(progressRules), controller.createProgress);
router.put('/:id', validateObjectId('id'), validateBody(progressRules, { partial: true }), controller.updateProgress);
router.delete('/:id', validateObjectId('id'), controller.deleteProgress);

module.exports = router;
