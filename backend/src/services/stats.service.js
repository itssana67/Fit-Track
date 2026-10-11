// Shared queries used by several controllers (dashboard, achievements, recommendations).
const prisma = require('../lib/prisma');
const { uniqueDayKeys, currentStreak, longestStreak } = require('../utils/streak');
const { toDayKey, todayDateOnly } = require('../utils/dates');

/** Current and longest workout streak for a user */
async function getStreakStats(userId, today = todayDateOnly()) {
  const completed = await prisma.workout.findMany({
    where: { userId, completed: true },
    select: { date: true },
  });
  const dayKeys = uniqueDayKeys(completed.map((w) => w.date));
  return {
    currentStreak: currentStreak(dayKeys, toDayKey(today)),
    longestStreak: longestStreak(dayKeys),
    activeDays: dayKeys.length,
  };
}

/**
 * Keeps User.weightKg equal to the most recent progress entry, so BMI and
 * calorie targets always use the latest weight.
 */
async function syncUserWeight(userId) {
  const latest = await prisma.progress.findFirst({
    where: { userId },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });
  if (!latest) return null;
  return prisma.user.update({ where: { id: userId }, data: { weightKg: latest.weight } });
}

module.exports = { getStreakStats, syncUserWeight };
