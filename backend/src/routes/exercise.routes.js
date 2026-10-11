const express = require('express');
const { getExercises, getExercise } = require('../controllers/exercise.controller');
const { protect } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validate');

const router = express.Router();
router.use(protect);

router.get('/', getExercises);
router.get('/:id', validateObjectId('id'), getExercise);

module.exports = router;
