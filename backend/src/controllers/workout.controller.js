const prisma = require('../lib/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { validateData } = require('../utils/validation');
const { parseDateOnly, endOfDay } = require('../utils/dates');
const { evaluateAchievements } = require('../services/achievement.service');
const { exerciseEntryRules } = require('../routes/rules');

const includeExercises = { exercises: { orderBy: { order: 'asc' } } };

/** Finds a workout that belongs to the logged-in user, or throws 404 */
async function findOwnWorkout(id, userId) {
  const workout = await prisma.workout.findFirst({ where: { id, userId }, include: includeExercises });
  if (!workout) throw new ApiError(404, 'Workout not found');
  return workout;
}

/** Validates the optional exercises array sent with a workout */
function parseExercises(list) {
  if (list === undefined) return undefined;
  if (!Array.isArray(list)) throw new ApiError(400, 'exercises must be an array');

  return list.map((item, index) => {
    const { errors, values, isValid } = validateData(item, exerciseEntryRules);
    if (!isValid) {
      throw new ApiError(400, `Exercise ${index + 1}: ${Object.values(errors)[0]}`, { [`exercises.${index}`]: errors });
    }
    // Only keep exerciseId if it is a real catalogue ObjectId
    if (values.exerciseId && !/^[a-f\d]{24}$/i.test(values.exerciseId)) delete values.exerciseId;
    return { ...values, order: index };
  });
}

// GET /api/workouts?type=&status=completed|planned&from=&to=&search=
const getWorkouts = asyncHandler(async (req, res) => {
  const { type, status, from, to, search } = req.query;
  const where = { userId: req.user.id };

  if (type) where.type = String(type).toUpperCase();
  if (status === 'completed') where.completed = true;
  if (status === 'planned') where.completed = false;
  if (search) where.name = { contains: String(search), mode: 'insensitive' };

  const fromDate = parseDateOnly(from);
  const toDate = parseDateOnly(to);
  if (fromDate || toDate) {
    where.date = {};
    if (fromDate) where.date.gte = fromDate;
    if (toDate) where.date.lte = endOfDay(toDate);
  }

  const workouts = await prisma.workout.findMany({
    where,
    include: includeExercises,
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });
  res.json({ workouts });
});

// GET /api/workouts/:id
const getWorkout = asyncHandler(async (req, res) => {
  const workout = await findOwnWorkout(req.params.id, req.user.id);
  res.json({ workout });
});

// POST /api/workouts
const createWorkout = asyncHandler(async (req, res) => {
  const exercises = parseExercises(req.rawExercises);
  const data = { ...req.body, userId: req.user.id };
  if (data.completed) data.completedAt = new Date();

  const workout = await prisma.workout.create({
    data: {
      ...data,
      ...(exercises && exercises.length ? { exercises: { create: exercises } } : {}),
    },
    include: includeExercises,
  });

  const newAchievements = await evaluateAchievements(req.user.id);
  res.status(201).json({ message: 'Workout saved', workout, newAchievements });
});

// PUT /api/workouts/:id  (fields not sent are left unchanged;
// if an "exercises" array is sent it replaces the existing list)
const updateWorkout = asyncHandler(async (req, res) => {
  const existing = await findOwnWorkout(req.params.id, req.user.id);
  const exercises = parseExercises(req.rawExercises);
  const data = { ...req.body };

  if (data.completed === true && !existing.completed) data.completedAt = new Date();
  if (data.completed === false) data.completedAt = null;

  // A transaction makes sure the workout and its exercises update together
  const operations = [prisma.workout.update({ where: { id: existing.id }, data })];
  if (exercises) {
    operations.push(prisma.workoutExercise.deleteMany({ where: { workoutId: existing.id } }));
    if (exercises.length) {
      operations.push(
        prisma.workoutExercise.createMany({ data: exercises.map((e) => ({ ...e, workoutId: existing.id })) })
      );
    }
  }
  await prisma.$transaction(operations);

  const workout = await findOwnWorkout(existing.id, req.user.id);
  const newAchievements = await evaluateAchievements(req.user.id);
  res.json({ message: 'Workout updated', workout, newAchievements });
});

// PATCH /api/workouts/:id/complete   body: { completed: true|false }
const setWorkoutCompleted = asyncHandler(async (req, res) => {
  const existing = await findOwnWorkout(req.params.id, req.user.id);
  const completed = req.body.completed !== false;

  await prisma.workout.update({
    where: { id: existing.id },
    data: { completed, completedAt: completed ? existing.completedAt || new Date() : null },
  });

  const workout = await findOwnWorkout(existing.id, req.user.id);
  const newAchievements = await evaluateAchievements(req.user.id);
  res.json({ message: completed ? 'Workout completed' : 'Workout marked as planned', workout, newAchievements });
});

// DELETE /api/workouts/:id
const deleteWorkout = asyncHandler(async (req, res) => {
  const existing = await findOwnWorkout(req.params.id, req.user.id);
  await prisma.$transaction([
    prisma.workoutExercise.deleteMany({ where: { workoutId: existing.id } }),
    prisma.workout.delete({ where: { id: existing.id } }),
  ]);
  res.json({ message: 'Workout deleted', id: existing.id });
});

// POST /api/workouts/:id/exercises  - add one exercise (used by the exercise library)
const addExercise = asyncHandler(async (req, res) => {
  const existing = await findOwnWorkout(req.params.id, req.user.id);
  const [entry] = parseExercises([req.body]);

  // Link to the catalogue exercise when one with the same name exists
  if (!entry.exerciseId) {
    const catalogue = await prisma.exercise.findUnique({ where: { name: entry.name } });
    if (catalogue) entry.exerciseId = catalogue.id;
  }

  await prisma.workoutExercise.create({
    data: { ...entry, workoutId: existing.id, order: existing.exercises.length },
  });

  const workout = await findOwnWorkout(existing.id, req.user.id);
  res.status(201).json({ message: `${entry.name} added to ${workout.name}`, workout });
});

// DELETE /api/workouts/:id/exercises/:entryId
const removeExercise = asyncHandler(async (req, res) => {
  const existing = await findOwnWorkout(req.params.id, req.user.id);
  const entry = existing.exercises.find((e) => e.id === req.params.entryId);
  if (!entry) throw new ApiError(404, 'Exercise not found in this workout');

  await prisma.workoutExercise.delete({ where: { id: entry.id } });
  const workout = await findOwnWorkout(existing.id, req.user.id);
  res.json({ message: 'Exercise removed', workout });
});

module.exports = {
  getWorkouts,
  getWorkout,
  createWorkout,
  updateWorkout,
  setWorkoutCompleted,
  deleteWorkout,
  addExercise,
  removeExercise,
};
