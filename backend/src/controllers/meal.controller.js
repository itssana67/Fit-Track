const prisma = require('../lib/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getFitnessProfile } = require('../utils/fitness');
const { parseDateOnly, resolveDay, endOfDay, toDayKey } = require('../utils/dates');
const { evaluateAchievements } = require('../services/achievement.service');

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

async function findOwnMeal(id, userId) {
  const meal = await prisma.meal.findFirst({ where: { id, userId } });
  if (!meal) throw new ApiError(404, 'Meal not found');
  return meal;
}

const round1 = (value) => Math.round(value * 10) / 10;

/** Adds up calories and macros for a list of meals */
function sumMeals(meals) {
  return meals.reduce(
    (total, meal) => ({
      calories: total.calories + meal.calories,
      protein: round1(total.protein + meal.protein),
      carbs: round1(total.carbs + meal.carbs),
      fats: round1(total.fats + meal.fats),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
}

// GET /api/meals?date=YYYY-MM-DD   or   ?from=&to=
const getMeals = asyncHandler(async (req, res) => {
  const where = { userId: req.user.id };
  const day = parseDateOnly(req.query.date);
  const from = parseDateOnly(req.query.from);
  const to = parseDateOnly(req.query.to);

  if (day) where.date = { gte: day, lte: endOfDay(day) };
  else if (from || to) {
    where.date = {};
    if (from) where.date.gte = from;
    if (to) where.date.lte = endOfDay(to);
  }

  const meals = await prisma.meal.findMany({ where, orderBy: [{ date: 'desc' }, { createdAt: 'asc' }], take: 500 });
  res.json({ meals });
});

// GET /api/meals/summary?date=YYYY-MM-DD - totals for one day vs the user's targets
const getDailySummary = asyncHandler(async (req, res) => {
  const day = resolveDay(req.query.date);
  const meals = await prisma.meal.findMany({
    where: { userId: req.user.id, date: { gte: day, lte: endOfDay(day) } },
    orderBy: { createdAt: 'asc' },
  });

  const profile = getFitnessProfile(req.user);
  const totals = sumMeals(meals);
  const targets = { calories: profile.calorieTarget, ...profile.macros };

  const percent = (value, target) => (target ? Math.round((value / target) * 100) : 0);
  const byType = Object.fromEntries(
    MEAL_TYPES.map((type) => {
      const list = meals.filter((m) => m.mealType === type);
      return [type, { count: list.length, ...sumMeals(list) }];
    })
  );

  res.json({
    date: toDayKey(day),
    totals,
    targets,
    percentages: {
      calories: percent(totals.calories, targets.calories),
      protein: percent(totals.protein, targets.protein),
      carbs: percent(totals.carbs, targets.carbs),
      fats: percent(totals.fats, targets.fats),
    },
    remainingCalories: targets.calories - totals.calories,
    byType,
    meals,
  });
});

// POST /api/meals
const createMeal = asyncHandler(async (req, res) => {
  const meal = await prisma.meal.create({ data: { ...req.body, userId: req.user.id } });
  const newAchievements = await evaluateAchievements(req.user.id);
  res.status(201).json({ message: 'Meal saved', meal, newAchievements });
});

// PUT /api/meals/:id
const updateMeal = asyncHandler(async (req, res) => {
  const existing = await findOwnMeal(req.params.id, req.user.id);
  const meal = await prisma.meal.update({ where: { id: existing.id }, data: req.body });
  res.json({ message: 'Meal updated', meal });
});

// DELETE /api/meals/:id
const deleteMeal = asyncHandler(async (req, res) => {
  const existing = await findOwnMeal(req.params.id, req.user.id);
  await prisma.meal.delete({ where: { id: existing.id } });
  res.json({ message: 'Meal deleted', id: existing.id });
});

module.exports = { getMeals, getDailySummary, createMeal, updateMeal, deleteMeal, sumMeals };
