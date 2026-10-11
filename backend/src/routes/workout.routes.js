const express = require('express');
const controller = require('../controllers/workout.controller');
const { protect } = require('../middleware/auth');
const { validateBody, validateObjectId } = require('../middleware/validate');
const { workoutRules, exerciseEntryRules } = require('./rules');

const router = express.Router();
router.use(protect); // every workout route needs a logged-in user

// validateBody drops unknown fields, so keep the nested "exercises" array
// aside for the controller to validate separately
const keepExercises = (req, res, next) => {
  req.rawExercises = req.body ? req.body.exercises : undefined;
  next();
};

router.get('/', controller.getWorkouts);
router.post('/', keepExercises, validateBody(workoutRules), controller.createWorkout);
router.get('/:id', validateObjectId('id'), controller.getWorkout);
router.put('/:id', validateObjectId('id'), keepExercises, validateBody(workoutRules, { partial: true }), controller.updateWorkout);
router.patch('/:id/complete', validateObjectId('id'), controller.setWorkoutCompleted);
router.delete('/:id', validateObjectId('id'), controller.deleteWorkout);

router.post('/:id/exercises', validateObjectId('id'), validateBody(exerciseEntryRules), controller.addExercise);
router.delete('/:id/exercises/:entryId', validateObjectId('id', 'entryId'), controller.removeExercise);

module.exports = router;
