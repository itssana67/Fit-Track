// Personalised recommendations.
// IMPORTANT: this is a RULE-BASED engine (plain if/else business logic), not
// machine learning. Each rule looks at the user's profile and recent activity
// and, when it matches, adds a recommendation with the reason it was chosen.
const prisma = require('../lib/prisma');
const { getFitnessProfile } = require('../utils/fitness');
const { addDays, todayDateOnly, endOfDay } = require('../utils/dates');

const GOAL_PLANS = {
  LOSE_WEIGHT: {
    category: 'workout',
    title: 'Pair cardio with calorie tracking',
    actions: [
      '3-5 cardio sessions a week, 30-45 minutes each (brisk walking, cycling, running)',
      '2 full-body strength sessions a week to keep muscle while losing fat',
      'Log every meal so you stay close to your calorie target',
    ],
    muscleGroups: ['CARDIO', 'FULL_BODY'],
  },
  GAIN_MUSCLE: {
    category: 'workout',
    title: 'Focus on strength training and protein',
    actions: [
      '3-4 strength sessions a week, 8-12 reps per set',
      'Add a little weight or one more rep each week (progressive overload)',
      'Track protein every day and eat slightly above your maintenance calories',
    ],
    muscleGroups: ['CHEST', 'BACK', 'LEGS'],
  },
  INCREASE_STRENGTH: {
    category: 'workout',
    title: 'Build around heavy compound lifts',
    actions: [
      'Squat, deadlift, bench press and overhead press as your main lifts',
      '3-5 sets of 3-6 reps with 2-3 minutes rest between sets',
      'Keep one or two lighter days for recovery',
    ],
    muscleGroups: ['LEGS', 'BACK', 'CHEST'],
  },
  IMPROVE_ENDURANCE: {
    category: 'workout',
    title: 'Mix steady cardio with intervals',
    actions: [
      '2-3 easy sessions a week at a pace where you can still talk',
      '1 interval session a week, e.g. 6 x 2 minutes hard, 2 minutes easy',
      'Increase your total weekly cardio time by about 10% per week',
    ],
    muscleGroups: ['CARDIO'],
  },
  MAINTAIN_WEIGHT: {
    category: 'workout',
    title: 'Keep a balanced weekly routine',
    actions: [
      '2-3 strength sessions and 2 cardio sessions a week',
      'Eat close to your maintenance calories',
      'Weigh in weekly to catch changes early',
    ],
    muscleGroups: ['FULL_BODY', 'CORE'],
  },
};

const average = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);

async function buildRecommendations(user) {
  const today = todayDateOnly();
  const twoWeeksAgo = addDays(today, -13);
  const weekAgo = addDays(today, -6);
  const profile = getFitnessProfile(user);

  const [recentWorkouts, recentMeals, totalCompleted] = await Promise.all([
    prisma.workout.findMany({
      where: { userId: user.id, completed: true, date: { gte: twoWeeksAgo, lte: endOfDay(today) } },
      select: { type: true, date: true },
    }),
    prisma.meal.findMany({
      where: { userId: user.id, date: { gte: weekAgo, lte: endOfDay(today) } },
      select: { date: true, calories: true, protein: true },
    }),
    prisma.workout.count({ where: { userId: user.id, completed: true } }),
  ]);

  const workoutsPerWeek = Math.round((recentWorkouts.length / 2) * 10) / 10;
  const strengthCount = recentWorkouts.filter((w) => w.type === 'STRENGTH').length;
  const cardioCount = recentWorkouts.filter((w) => ['CARDIO', 'HIIT'].includes(w.type)).length;

  // Average daily protein / calories over the days that have meals logged
  const byDay = {};
  for (const meal of recentMeals) {
    const key = meal.date.toISOString().slice(0, 10);
    byDay[key] = byDay[key] || { calories: 0, protein: 0 };
    byDay[key].calories += meal.calories;
    byDay[key].protein += meal.protein;
  }
  const loggedDays = Object.values(byDay);
  const avgProtein = Math.round(average(loggedDays.map((d) => d.protein)));
  const avgCalories = Math.round(average(loggedDays.map((d) => d.calories)));

  const recommendations = [];
  const add = (item) => recommendations.push({ id: `rec-${recommendations.length + 1}`, ...item });

  // Rule 1: main plan based on the user's goal
  const plan = GOAL_PLANS[user.fitnessGoal] || GOAL_PLANS.MAINTAIN_WEIGHT;
  add({
    category: plan.category,
    priority: 'high',
    title: plan.title,
    reason: 'Based on your fitness goal.',
    actions: plan.actions,
  });

  // Rule 2: low workout frequency -> beginner routine
  const lowFrequency = workoutsPerWeek < 2;
  if (lowFrequency) {
    add({
      category: 'workout',
      priority: 'high',
      title: 'Start with a beginner full-body routine',
      reason: `You completed ${recentWorkouts.length} workout${recentWorkouts.length === 1 ? '' : 's'} in the last 14 days.`,
      actions: [
        '3 short sessions a week (20-30 minutes) on non-consecutive days',
        'Use body-weight moves: squats, push-ups, glute bridges and planks',
        'Plan workouts in the tracker so they are ready on the day',
      ],
    });
  }

  // Rule 3: BMI based advice
  if (profile.bmi >= 30) {
    add({
      category: 'workout',
      priority: 'medium',
      title: 'Choose low-impact cardio',
      reason: `Your BMI is ${profile.bmi} (${profile.bmiCategory}). Low-impact options are easier on the joints.`,
      actions: ['Brisk walking, cycling or swimming', 'Build up gradually from 20 minutes', 'Check with a doctor before starting intense training'],
    });
  } else if (profile.bmi !== null && profile.bmi < 18.5) {
    add({
      category: 'nutrition',
      priority: 'medium',
      title: 'Eat in a small calorie surplus',
      reason: `Your BMI is ${profile.bmi} (${profile.bmiCategory}).`,
      actions: ['Add a calorie-dense snack such as nuts or a smoothie', 'Prioritise strength training over long cardio sessions'],
    });
  }

  // Rule 4: goal needs strength work but none was done recently
  if (['GAIN_MUSCLE', 'INCREASE_STRENGTH'].includes(user.fitnessGoal) && strengthCount === 0 && !lowFrequency) {
    add({
      category: 'workout',
      priority: 'high',
      title: 'Add strength sessions to your week',
      reason: 'Your goal needs strength training, but none was logged in the last 14 days.',
      actions: ['Replace one cardio session with a full-body strength workout'],
    });
  }

  // Rule 5: weight loss / endurance goal but little cardio
  if (['LOSE_WEIGHT', 'IMPROVE_ENDURANCE'].includes(user.fitnessGoal) && cardioCount < 2 && !lowFrequency) {
    add({
      category: 'workout',
      priority: 'medium',
      title: 'Include more cardio',
      reason: `Only ${cardioCount} cardio or HIIT session${cardioCount === 1 ? '' : 's'} in the last 14 days.`,
      actions: ['Add two 30-minute cardio sessions this week'],
    });
  }

  // Rule 6: nutrition tracking
  if (loggedDays.length < 3) {
    add({
      category: 'nutrition',
      priority: 'medium',
      title: 'Log your meals more often',
      reason: `Meals were logged on ${loggedDays.length} of the last 7 days.`,
      actions: [`Your daily target is ${profile.calorieTarget} kcal. Logging meals shows how close you are.`],
    });
  } else if (avgProtein < profile.macros.protein * 0.8) {
    add({
      category: 'nutrition',
      priority: user.fitnessGoal === 'GAIN_MUSCLE' ? 'high' : 'medium',
      title: 'Increase your protein intake',
      reason: `You averaged ${avgProtein} g of protein a day. Your target is ${profile.macros.protein} g.`,
      actions: ['Add a protein source to every meal: eggs, paneer, dal, chicken, curd or tofu'],
    });
  }

  if (loggedDays.length >= 3 && user.fitnessGoal === 'LOSE_WEIGHT' && avgCalories > profile.calorieTarget * 1.1) {
    add({
      category: 'nutrition',
      priority: 'medium',
      title: 'Bring calories closer to your target',
      reason: `You averaged ${avgCalories} kcal a day against a target of ${profile.calorieTarget} kcal.`,
      actions: ['Swap one fried or sugary item a day for fruit, salad or curd'],
    });
  }

  // Rule 7: sedentary lifestyle
  if (user.activityLevel === 'SEDENTARY') {
    add({
      category: 'habit',
      priority: 'low',
      title: 'Move more during the day',
      reason: 'Your activity level is set to sedentary.',
      actions: ['Aim for 7,000+ steps a day', 'Stand up and walk for 5 minutes every hour'],
    });
  }

  // Suggested exercises from the catalogue
  const muscleGroups = lowFrequency ? ['FULL_BODY', 'LEGS', 'CHEST', 'CORE'] : plan.muscleGroups;
  const suggestedExercises = await prisma.exercise.findMany({
    where: {
      muscleGroup: { in: muscleGroups },
      ...(lowFrequency || totalCompleted < 10 ? { difficulty: 'BEGINNER' } : {}),
    },
    take: 6,
    orderBy: { name: 'asc' },
  });

  return {
    method: 'rule-based',
    basis: {
      fitnessGoal: user.fitnessGoal,
      activityLevel: user.activityLevel,
      weightKg: user.weightKg,
      bmi: profile.bmi,
      bmiCategory: profile.bmiCategory,
      workoutsLast14Days: recentWorkouts.length,
      workoutsPerWeek,
      totalCompletedWorkouts: totalCompleted,
      avgDailyProtein: avgProtein,
      proteinTarget: profile.macros.protein,
    },
    recommendations,
    suggestedExercises,
  };
}

module.exports = { buildRecommendations };
