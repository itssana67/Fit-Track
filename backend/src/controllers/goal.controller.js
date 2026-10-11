const prisma = require('../lib/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { withGoalProgress } = require('../utils/goalProgress');
const { evaluateAchievements } = require('../services/achievement.service');

const WEIGHT_GOALS = ['LOSE_WEIGHT', 'GAIN_MUSCLE', 'MAINTAIN_WEIGHT'];

async function findOwnGoal(id, userId) {
  const goal = await prisma.goal.findFirst({ where: { id, userId } });
  if (!goal) throw new ApiError(404, 'Goal not found');
  return goal;
}

// GET /api/goals?status=ACTIVE|COMPLETED|PAUSED
const getGoals = asyncHandler(async (req, res) => {
  const where = { userId: req.user.id };
  if (req.query.status) where.status = String(req.query.status).toUpperCase();

  const goals = await prisma.goal.findMany({ where, orderBy: [{ status: 'asc' }, { targetDate: 'asc' }] });
  res.json({ goals: goals.map((goal) => withGoalProgress(goal, req.user.weightKg)) });
});

// POST /api/goals
const createGoal = asyncHandler(async (req, res) => {
  const data = { ...req.body, userId: req.user.id };

  // For weight goals remember the starting weight so progress can be calculated
  if (data.targetWeight && WEIGHT_GOALS.includes(data.goalType)) {
    data.startWeight = req.user.weightKg;
  }
  if (data.status === 'COMPLETED') data.completedAt = new Date();

  const goal = await prisma.goal.create({ data });

  // A new active goal also becomes the user's main fitness goal,
  // which drives calorie targets and recommendations
  if (goal.status === 'ACTIVE' && goal.goalType !== req.user.fitnessGoal) {
    await prisma.user.update({ where: { id: req.user.id }, data: { fitnessGoal: goal.goalType } });
  }

  const newAchievements = await evaluateAchievements(req.user.id);
  res.status(201).json({ message: 'Goal created', goal: withGoalProgress(goal, req.user.weightKg), newAchievements });
});

// PUT /api/goals/:id
const updateGoal = asyncHandler(async (req, res) => {
  const existing = await findOwnGoal(req.params.id, req.user.id);
  const data = { ...req.body };

  if (data.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
    data.completedAt = new Date();
    data.currentProgress = 100;
  }
  if (data.status && data.status !== 'COMPLETED') data.completedAt = null;

  // Setting a target weight on an old goal without a start weight
  if (data.targetWeight && existing.startWeight === null) data.startWeight = req.user.weightKg;

  const goal = await prisma.goal.update({ where: { id: existing.id }, data });
  const newAchievements = await evaluateAchievements(req.user.id);
  res.json({ message: 'Goal updated', goal: withGoalProgress(goal, req.user.weightKg), newAchievements });
});

// DELETE /api/goals/:id
const deleteGoal = asyncHandler(async (req, res) => {
  const existing = await findOwnGoal(req.params.id, req.user.id);
  await prisma.goal.delete({ where: { id: existing.id } });
  res.json({ message: 'Goal deleted', id: existing.id });
});

module.exports = { getGoals, createGoal, updateGoal, deleteGoal };
