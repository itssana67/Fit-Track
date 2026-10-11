// Streak & achievement system.
// Achievement definitions live here in code and are copied (upserted) into the
// "achievements" collection on server start. After every workout/meal/goal change
// evaluateAchievements() checks the user's numbers and unlocks new ones.
const prisma = require('../lib/prisma');
const { getStreakStats } = require('./stats.service');

const ACHIEVEMENTS = [
  { code: 'FIRST_WORKOUT', title: 'First workout', description: 'Complete your first workout', icon: 'dumbbell', target: 1, order: 1 },
  { code: 'STREAK_7', title: '7-day streak', description: 'Complete a workout on 7 days in a row', icon: 'flame', target: 7, order: 2 },
  { code: 'WORKOUTS_10', title: '10 workouts', description: 'Complete 10 workouts', icon: 'medal', target: 10, order: 3 },
  { code: 'WORKOUTS_50', title: '50 workouts', description: 'Complete 50 workouts', icon: 'trophy', target: 50, order: 4 },
  { code: 'MEALS_10', title: '10 meals logged', description: 'Log 10 meals in the nutrition tracker', icon: 'utensils', target: 10, order: 5 },
  { code: 'FIRST_GOAL', title: 'First goal reached', description: 'Mark a fitness goal as completed', icon: 'target', target: 1, order: 6 },
];

/** Copies the definitions above into MongoDB (safe to run many times) */
async function syncAchievementDefinitions() {
  for (const achievement of ACHIEVEMENTS) {
    const { code, ...rest } = achievement;
    await prisma.achievement.upsert({
      where: { code },
      update: rest,
      create: achievement,
    });
  }
}

/** The numbers each achievement is measured against */
async function getAchievementStats(userId) {
  const [completedWorkouts, mealsLogged, completedGoals, streaks] = await Promise.all([
    prisma.workout.count({ where: { userId, completed: true } }),
    prisma.meal.count({ where: { userId } }),
    prisma.goal.count({ where: { userId, status: 'COMPLETED' } }),
    getStreakStats(userId),
  ]);
  return { completedWorkouts, mealsLogged, completedGoals, ...streaks };
}

/** Maps an achievement code to the user's current value for it */
function currentValueFor(code, stats) {
  switch (code) {
    case 'FIRST_WORKOUT':
    case 'WORKOUTS_10':
    case 'WORKOUTS_50':
      return stats.completedWorkouts;
    case 'STREAK_7':
      return stats.longestStreak;
    case 'MEALS_10':
      return stats.mealsLogged;
    case 'FIRST_GOAL':
      return stats.completedGoals;
    default:
      return 0;
  }
}

/**
 * Unlocks any achievement the user now qualifies for.
 * Returns only the newly unlocked ones so the UI can show a notification.
 * Once unlocked, an achievement stays unlocked even if data is deleted later.
 */
async function evaluateAchievements(userId) {
  let definitions = await prisma.achievement.findMany();
  if (definitions.length === 0) {
    await syncAchievementDefinitions();
    definitions = await prisma.achievement.findMany();
  }

  const [unlocked, stats] = await Promise.all([
    prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
    getAchievementStats(userId),
  ]);
  const unlockedIds = new Set(unlocked.map((u) => u.achievementId));

  const newlyUnlocked = [];
  for (const definition of definitions) {
    if (unlockedIds.has(definition.id)) continue;
    if (currentValueFor(definition.code, stats) >= definition.target) {
      try {
        await prisma.userAchievement.create({ data: { userId, achievementId: definition.id } });
        newlyUnlocked.push({
          code: definition.code,
          title: definition.title,
          description: definition.description,
          icon: definition.icon,
        });
      } catch (err) {
        // P2002 = already unlocked by a parallel request, safe to ignore
        if (err.code !== 'P2002') throw err;
      }
    }
  }
  return newlyUnlocked;
}

/** All achievements with unlocked state and progress, for the achievements page */
async function getAchievementsForUser(userId) {
  await evaluateAchievements(userId);

  const [definitions, unlocked, stats] = await Promise.all([
    prisma.achievement.findMany({ orderBy: { order: 'asc' } }),
    prisma.userAchievement.findMany({ where: { userId } }),
    getAchievementStats(userId),
  ]);
  const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]));

  const achievements = definitions.map((definition) => {
    const value = currentValueFor(definition.code, stats);
    const unlockedAt = unlockedMap.get(definition.id) || null;
    return {
      id: definition.id,
      code: definition.code,
      title: definition.title,
      description: definition.description,
      icon: definition.icon,
      target: definition.target,
      current: Math.min(value, definition.target),
      unlocked: Boolean(unlockedAt),
      unlockedAt,
    };
  });

  return { achievements, stats };
}

module.exports = {
  ACHIEVEMENTS,
  syncAchievementDefinitions,
  evaluateAchievements,
  getAchievementsForUser,
};
