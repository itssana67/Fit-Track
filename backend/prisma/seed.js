// =============================================================
// FitTrack sample data
// -------------------------------------------------------------
//   npm run seed         -> (re)creates the demo account + reference data
//   npm run seed:clear   -> removes ONLY sample accounts and their data
//
// Sample data is kept apart from real data:
//   * it belongs to a demo user flagged with isSample = true
//   * this script only ever deletes records of users with isSample = true
//   * the exercise catalogue and achievement definitions are shared
//     reference data (not user data) and are upserted, never deleted
//
// Demo login:  demo@fittrack.app  /  Demo@1234
// =============================================================
require('../src/lib/env');
const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');
const catalog = require('../src/data/exerciseCatalog');
const { todayDateOnly, addDays } = require('../src/utils/dates');
const { syncAchievementDefinitions, evaluateAchievements } = require('../src/services/achievement.service');

const DEMO_EMAIL = 'demo@fittrack.app';
const DEMO_PASSWORD = 'Demo@1234';

// Deterministic random numbers so every seed run gives the same data
function createRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}
const random = createRandom(2026);
const pick = (list) => list[Math.floor(random() * list.length)];
const between = (min, max) => Math.round(min + random() * (max - min));

const WORKOUT_TEMPLATES = [
  {
    name: 'Push day', type: 'STRENGTH', duration: [50, 65], met: 5,
    exercises: [
      { name: 'Barbell bench press', muscleGroup: 'CHEST', sets: 4, reps: 8, weightKg: 55 },
      { name: 'Overhead press', muscleGroup: 'SHOULDERS', sets: 3, reps: 8, weightKg: 32.5 },
      { name: 'Incline dumbbell press', muscleGroup: 'CHEST', sets: 3, reps: 10, weightKg: 18 },
      { name: 'Triceps rope pushdown', muscleGroup: 'ARMS', sets: 3, reps: 12, weightKg: 20 },
    ],
  },
  {
    name: 'Pull day', type: 'STRENGTH', duration: [50, 60], met: 5,
    exercises: [
      { name: 'Deadlift', muscleGroup: 'BACK', sets: 3, reps: 5, weightKg: 90 },
      { name: 'Lat pulldown', muscleGroup: 'BACK', sets: 3, reps: 10, weightKg: 45 },
      { name: 'Seated cable row', muscleGroup: 'BACK', sets: 3, reps: 12, weightKg: 40 },
      { name: 'Hammer curl', muscleGroup: 'ARMS', sets: 3, reps: 12, weightKg: 12 },
    ],
  },
  {
    name: 'Leg day', type: 'STRENGTH', duration: [55, 70], met: 6,
    exercises: [
      { name: 'Barbell back squat', muscleGroup: 'LEGS', sets: 4, reps: 6, weightKg: 70 },
      { name: 'Romanian deadlift', muscleGroup: 'LEGS', sets: 3, reps: 10, weightKg: 60 },
      { name: 'Walking lunge', muscleGroup: 'LEGS', sets: 3, reps: 12, weightKg: 12 },
      { name: 'Plank', muscleGroup: 'CORE', sets: 3, durationMin: 1 },
    ],
  },
  {
    name: 'Morning run', type: 'CARDIO', duration: [25, 40], met: 9,
    exercises: [{ name: 'Running', muscleGroup: 'CARDIO', durationMin: 30 }],
  },
  {
    name: 'HIIT circuit', type: 'HIIT', duration: [20, 30], met: 8,
    exercises: [
      { name: 'Burpee', muscleGroup: 'CARDIO', sets: 4, reps: 12 },
      { name: 'Mountain climber', muscleGroup: 'CARDIO', sets: 4, reps: 30 },
      { name: 'Kettlebell swing', muscleGroup: 'FULL_BODY', sets: 4, reps: 15, weightKg: 16 },
    ],
  },
  {
    name: 'Mobility and stretching', type: 'FLEXIBILITY', duration: [20, 30], met: 2.5,
    exercises: [
      { name: 'Dead bug', muscleGroup: 'CORE', sets: 3, reps: 10 },
      { name: 'Glute bridge', muscleGroup: 'LEGS', sets: 3, reps: 15 },
    ],
  },
];

const FOODS = {
  BREAKFAST: [
    { foodName: 'Poha with peanuts', calories: 350, protein: 8, carbs: 55, fats: 11 },
    { foodName: 'Oats with banana and milk', calories: 380, protein: 14, carbs: 62, fats: 8 },
    { foodName: 'Masala omelette with 2 toast', calories: 420, protein: 24, carbs: 30, fats: 22 },
    { foodName: 'Idli sambar (3 idli)', calories: 330, protein: 11, carbs: 60, fats: 5 },
    { foodName: 'Paneer paratha with curd', calories: 480, protein: 20, carbs: 52, fats: 21 },
  ],
  LUNCH: [
    { foodName: 'Dal, rice and salad', calories: 520, protein: 18, carbs: 88, fats: 10 },
    { foodName: 'Chicken curry with 2 roti', calories: 610, protein: 42, carbs: 55, fats: 23 },
    { foodName: 'Rajma chawal', calories: 560, protein: 20, carbs: 92, fats: 12 },
    { foodName: 'Grilled chicken salad bowl', calories: 450, protein: 40, carbs: 25, fats: 20 },
    { foodName: 'Paneer bhurji with 2 roti', calories: 580, protein: 30, carbs: 48, fats: 28 },
  ],
  DINNER: [
    { foodName: 'Vegetable khichdi with curd', calories: 450, protein: 16, carbs: 70, fats: 11 },
    { foodName: 'Fish curry with rice', calories: 560, protein: 36, carbs: 62, fats: 17 },
    { foodName: 'Soya chunk curry with roti', calories: 500, protein: 34, carbs: 50, fats: 16 },
    { foodName: 'Egg bhurji with 2 roti', calories: 470, protein: 26, carbs: 45, fats: 20 },
  ],
  SNACK: [
    { foodName: 'Whey protein shake', calories: 150, protein: 25, carbs: 5, fats: 3 },
    { foodName: 'Sprouts chaat', calories: 180, protein: 11, carbs: 28, fats: 3 },
    { foodName: 'Greek yogurt with berries', calories: 160, protein: 14, carbs: 18, fats: 4 },
    { foodName: 'Roasted chana (50 g)', calories: 190, protein: 10, carbs: 30, fats: 3 },
    { foodName: 'Apple and almonds', calories: 210, protein: 5, carbs: 26, fats: 11 },
  ],
};

async function seedReferenceData() {
  for (const exercise of catalog) {
    const { name, ...rest } = exercise;
    await prisma.exercise.upsert({ where: { name }, update: rest, create: exercise });
  }
  await syncAchievementDefinitions();
  console.log(`  - ${catalog.length} catalogue exercises and achievement definitions are up to date`);
}

/** Deletes sample users and everything they own. Real users are never touched. */
async function clearSampleData() {
  const sampleUsers = await prisma.user.findMany({ where: { isSample: true }, select: { id: true } });
  const ids = sampleUsers.map((u) => u.id);
  if (ids.length === 0) return 0;

  const workouts = await prisma.workout.findMany({ where: { userId: { in: ids } }, select: { id: true } });
  await prisma.workoutExercise.deleteMany({ where: { workoutId: { in: workouts.map((w) => w.id) } } });
  await prisma.workout.deleteMany({ where: { userId: { in: ids } } });
  await prisma.meal.deleteMany({ where: { userId: { in: ids } } });
  await prisma.progress.deleteMany({ where: { userId: { in: ids } } });
  await prisma.goal.deleteMany({ where: { userId: { in: ids } } });
  await prisma.userAchievement.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids }, isSample: true } });
  return ids.length;
}

async function seedDemoUser() {
  // A real (non-sample) user with the demo email would block the demo account
  const clash = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (clash && !clash.isSample) {
    throw new Error(`${DEMO_EMAIL} belongs to a real account, so the demo account was not created.`);
  }

  const today = todayDateOnly();
  const catalogueByName = new Map(
    (await prisma.exercise.findMany({ select: { id: true, name: true } })).map((e) => [e.name, e.id])
  );

  // ----- Progress: one entry a week for 8 weeks, weight going down -----
  const progress = [];
  for (let week = 8; week >= 0; week -= 1) {
    const step = 8 - week; // 0..8
    progress.push({
      date: addDays(today, -week * 7 - 1),
      weight: Math.round((82 - step * 0.45) * 10) / 10,
      waist: Math.round((92 - step * 0.5) * 10) / 10,
      chest: Math.round((102 - step * 0.1) * 10) / 10,
      arm: Math.round((33.8 + step * 0.08) * 10) / 10,
      hip: Math.round((100 - step * 0.3) * 10) / 10,
      bodyFat: Math.round((24 - step * 0.3) * 10) / 10,
      notes: step === 0 ? 'Starting measurements' : null,
    });
  }
  const latestWeight = progress[progress.length - 1].weight;

  const user = await prisma.user.create({
    data: {
      name: 'Aarav Sharma',
      email: DEMO_EMAIL,
      password: await bcrypt.hash(DEMO_PASSWORD, 10),
      age: 24,
      gender: 'MALE',
      heightCm: 175,
      weightKg: latestWeight,
      activityLevel: 'MODERATE',
      fitnessGoal: 'LOSE_WEIGHT',
      isSample: true,
    },
  });

  await prisma.progress.createMany({ data: progress.map((p) => ({ ...p, userId: user.id })) });

  // ----- Workouts: 6 weeks of history + an 8-day current streak + today's plan -----
  const workoutDays = [];
  for (let offset = 41; offset >= 9; offset -= 1) {
    if ([1, 3, 5].includes(offset % 7)) workoutDays.push({ offset, completed: true });
  }
  for (let offset = 8; offset >= 1; offset -= 1) workoutDays.push({ offset, completed: true });
  workoutDays.push({ offset: 0, completed: false }); // planned for today
  workoutDays.push({ offset: -2, completed: false }); // planned in 2 days

  let templateIndex = 0;
  for (const { offset, completed } of workoutDays) {
    const template = WORKOUT_TEMPLATES[templateIndex % WORKOUT_TEMPLATES.length];
    templateIndex += 1;
    const duration = between(template.duration[0], template.duration[1]);
    // calories = MET x weight (kg) x hours
    const calories = Math.round(template.met * latestWeight * (duration / 60));
    const date = addDays(today, -offset);

    await prisma.workout.create({
      data: {
        userId: user.id,
        name: template.name,
        type: template.type,
        durationMin: duration,
        date,
        caloriesBurned: calories,
        completed,
        completedAt: completed ? date : null,
        notes: completed && random() > 0.7 ? pick(['Felt strong today', 'Short on sleep, kept it light', 'New personal best']) : null,
        exercises: {
          create: template.exercises.map((exercise, order) => ({
            ...exercise,
            exerciseId: catalogueByName.get(exercise.name) || null,
            order,
          })),
        },
      },
    });
  }

  // ----- Meals: last 14 days, today only breakfast + lunch so far -----
  const meals = [];
  for (let offset = 13; offset >= 0; offset -= 1) {
    const date = addDays(today, -offset);
    const types = offset === 0 ? ['BREAKFAST', 'LUNCH'] : ['BREAKFAST', 'LUNCH', 'DINNER'];
    if (offset > 0 && random() > 0.35) types.push('SNACK');
    for (const mealType of types) meals.push({ ...pick(FOODS[mealType]), mealType, date, userId: user.id });
  }
  await prisma.meal.createMany({ data: meals });

  // ----- Goals -----
  await prisma.goal.createMany({
    data: [
      {
        userId: user.id,
        goalType: 'LOSE_WEIGHT',
        title: 'Reach 75 kg',
        startWeight: progress[0].weight,
        targetWeight: 75,
        targetDate: addDays(today, 70),
        status: 'ACTIVE',
      },
      {
        userId: user.id,
        goalType: 'IMPROVE_ENDURANCE',
        title: 'Run 5 km without stopping',
        targetDate: addDays(today, -10),
        currentProgress: 100,
        status: 'COMPLETED',
        completedAt: addDays(today, -12),
      },
      {
        userId: user.id,
        goalType: 'INCREASE_STRENGTH',
        title: 'Squat 100 kg for one rep',
        targetDate: addDays(today, 120),
        currentProgress: 40,
        status: 'ACTIVE',
      },
    ],
  });

  const unlocked = await evaluateAchievements(user.id);
  console.log(
    `  - Demo user with ${workoutDays.length} workouts, ${meals.length} meals, ${progress.length} progress entries, 3 goals, ${unlocked.length} achievements`
  );
}

async function main() {
  const clearOnly = process.argv.includes('--clear');
  console.log('[FitTrack seed] starting');

  const removed = await clearSampleData();
  console.log(`  - removed ${removed} existing sample account(s)`);

  if (clearOnly) {
    console.log('[FitTrack seed] sample data cleared');
    return;
  }

  await seedReferenceData();
  await seedDemoUser();
  console.log(`[FitTrack seed] done. Log in with ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error('[FitTrack seed] failed:', err.message);
    if (err.code === 'P2031') console.error('MongoDB must run as a replica set. See README > Common errors.');
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
