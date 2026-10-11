const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');
const { getFitnessProfile } = require('../utils/fitness');
const { resolveDay, addDays, endOfDay, toDayKey } = require('../utils/dates');
const { withGoalProgress } = require('../utils/goalProgress');
const { getStreakStats } = require('../services/stats.service');
const { evaluateAchievements } = require('../services/achievement.service');

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// GET /api/dashboard?today=YYYY-MM-DD
// Every number on the dashboard is calculated here from MongoDB data.
const getDashboard = asyncHandler(async (req, res) => {
  const user = req.user;
  const today = resolveDay(req.query.today);
  const weekStart = addDays(today, -6);
  const weekRange = { gte: weekStart, lte: endOfDay(today) };

  const [completedCount, weekWorkouts, weekMeals, weightEntries, activeGoal, recentWorkouts, streaks, totalMeals] =
    await Promise.all([
      prisma.workout.count({ where: { userId: user.id, completed: true } }),
      prisma.workout.findMany({ where: { userId: user.id, date: weekRange } }),
      prisma.meal.findMany({ where: { userId: user.id, date: weekRange } }),
      prisma.progress.findMany({
        where: { userId: user.id },
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
        select: { date: true, weight: true },
      }),
      prisma.goal.findFirst({ where: { userId: user.id, status: 'ACTIVE' }, orderBy: { targetDate: 'asc' } }),
      prisma.workout.findMany({
        where: { userId: user.id },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        take: 4,
        include: { exercises: true },
      }),
      getStreakStats(user.id, today),
      prisma.meal.count({ where: { userId: user.id } }),
    ]);

  // Build one row per day for the last 7 days (used by the bar charts)
  const week = [];
  for (let i = 0; i < 7; i += 1) {
    const day = addDays(weekStart, i);
    const key = toDayKey(day);
    const dayWorkouts = weekWorkouts.filter((w) => toDayKey(w.date) === key && w.completed);
    const dayMeals = weekMeals.filter((m) => toDayKey(m.date) === key);
    week.push({
      date: key,
      label: WEEKDAY[day.getUTCDay()],
      workouts: dayWorkouts.length,
      minutes: dayWorkouts.reduce((sum, w) => sum + w.durationMin, 0),
      caloriesBurned: dayWorkouts.reduce((sum, w) => sum + w.caloriesBurned, 0),
      caloriesConsumed: dayMeals.reduce((sum, m) => sum + m.calories, 0),
    });
  }

  const todayRow = week[week.length - 1];
  const profile = getFitnessProfile(user);
  const todayMeals = weekMeals.filter((m) => toDayKey(m.date) === toDayKey(today));
  const goal = activeGoal ? withGoalProgress(activeGoal, user.weightKg) : null;

  // Weight chart: last 30 entries
  const weightHistory = weightEntries.slice(-30).map((entry) => ({
    date: toDayKey(entry.date),
    weight: entry.weight,
  }));

  const newAchievements = await evaluateAchievements(user.id);

  res.json({
    user: {
      name: user.name,
      fitnessGoal: user.fitnessGoal,
      activityLevel: user.activityLevel,
      weightKg: user.weightKg,
      heightCm: user.heightCm,
    },
    profile,
    stats: {
      currentWeight: user.weightKg,
      startWeight: weightEntries[0]?.weight ?? user.weightKg,
      bmi: profile.bmi,
      bmiCategory: profile.bmiCategory,
      calorieTarget: profile.calorieTarget,
      workoutStreak: streaks.currentStreak,
      longestStreak: streaks.longestStreak,
      workoutsCompleted: completedCount,
      workoutsThisWeek: week.reduce((sum, d) => sum + d.workouts, 0),
      caloriesConsumedToday: todayRow.caloriesConsumed,
      caloriesBurnedToday: todayRow.caloriesBurned,
      proteinToday: Math.round(todayMeals.reduce((sum, m) => sum + m.protein, 0)),
      mealsLogged: totalMeals,
      goalProgress: goal ? goal.progress : null,
    },
    activeGoal: goal,
    charts: { week, weightHistory },
    recentWorkouts,
    newAchievements,
  });
});

module.exports = { getDashboard };
