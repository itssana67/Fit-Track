const prisma = require('../lib/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { searchExercises } = require('../services/exerciseApi.service');

const MUSCLE_GROUPS = ['CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'CORE', 'CARDIO', 'FULL_BODY'];
const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'EXPERT'];

// GET /api/exercises?search=&muscle=&equipment=&difficulty=
// The backend calls the external API, so the API key stays on the server.
const getExercises = asyncHandler(async (req, res) => {
  const search = String(req.query.search || '').trim().slice(0, 60);
  const muscle = String(req.query.muscle || '').toUpperCase();
  const difficulty = String(req.query.difficulty || '').toUpperCase();
  const equipment = String(req.query.equipment || '').trim();

  if (muscle && !MUSCLE_GROUPS.includes(muscle)) throw new ApiError(400, 'Unknown muscle group');
  if (difficulty && !DIFFICULTIES.includes(difficulty)) throw new ApiError(400, 'Unknown difficulty');

  const result = await searchExercises({
    search: search || undefined,
    muscleGroup: muscle || undefined,
    difficulty: difficulty || undefined,
    equipment: equipment || undefined,
  });

  res.json({ ...result, count: result.exercises.length });
});

// GET /api/exercises/:id  (built-in catalogue exercises only)
const getExercise = asyncHandler(async (req, res) => {
  const exercise = await prisma.exercise.findUnique({ where: { id: req.params.id } });
  if (!exercise) throw new ApiError(404, 'Exercise not found');
  res.json({ exercise: { ...exercise, source: 'local' } });
});

module.exports = { getExercises, getExercise };
