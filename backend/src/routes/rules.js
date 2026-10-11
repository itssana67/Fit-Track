// Validation rules for every request body, in one place.
// See utils/validation.js for what each option means.

const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
const ACTIVITY_LEVELS = ['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE'];
const FITNESS_GOALS = ['LOSE_WEIGHT', 'GAIN_MUSCLE', 'MAINTAIN_WEIGHT', 'IMPROVE_ENDURANCE', 'INCREASE_STRENGTH'];
const WORKOUT_TYPES = ['STRENGTH', 'CARDIO', 'HIIT', 'FLEXIBILITY', 'SPORTS', 'OTHER'];
const MUSCLE_GROUPS = ['CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'CORE', 'CARDIO', 'FULL_BODY'];
const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
const GOAL_STATUSES = ['ACTIVE', 'COMPLETED', 'PAUSED'];

const profileRules = {
  name: { type: 'string', required: true, min: 2, max: 60, label: 'Name' },
  email: { type: 'email', required: true, label: 'Email' },
  age: { type: 'int', required: true, min: 13, max: 100, label: 'Age' },
  gender: { type: 'enum', required: true, values: GENDERS, label: 'Gender' },
  heightCm: { type: 'number', required: true, min: 100, max: 250, label: 'Height' },
  weightKg: { type: 'number', required: true, min: 25, max: 300, label: 'Weight' },
  activityLevel: { type: 'enum', required: true, values: ACTIVITY_LEVELS, label: 'Activity level' },
  fitnessGoal: { type: 'enum', required: true, values: FITNESS_GOALS, label: 'Fitness goal' },
};

const registerRules = {
  ...profileRules,
  password: { type: 'password', required: true, label: 'Password' },
};

const loginRules = {
  email: { type: 'email', required: true, label: 'Email' },
  password: { type: 'string', required: true, label: 'Password' },
};

const passwordRules = {
  currentPassword: { type: 'string', required: true, label: 'Current password' },
  newPassword: { type: 'password', required: true, label: 'New password' },
};

const workoutRules = {
  name: { type: 'string', required: true, min: 2, max: 80, label: 'Workout name' },
  type: { type: 'enum', required: true, values: WORKOUT_TYPES, label: 'Workout type' },
  durationMin: { type: 'int', required: true, min: 1, max: 600, label: 'Duration' },
  date: { type: 'date', required: true, label: 'Date' },
  caloriesBurned: { type: 'int', min: 0, max: 5000, default: 0, label: 'Calories burned' },
  notes: { type: 'string', max: 500, label: 'Notes' },
  completed: { type: 'boolean', default: false, label: 'Completed' },
};

const exerciseEntryRules = {
  exerciseId: { type: 'string', max: 24, label: 'Exercise id' },
  name: { type: 'string', required: true, min: 2, max: 80, label: 'Exercise name' },
  muscleGroup: { type: 'enum', required: true, values: MUSCLE_GROUPS, label: 'Muscle group' },
  sets: { type: 'int', min: 1, max: 20, label: 'Sets' },
  reps: { type: 'int', min: 1, max: 200, label: 'Reps' },
  weightKg: { type: 'number', min: 0, max: 500, label: 'Weight' },
  durationMin: { type: 'int', min: 1, max: 300, label: 'Duration' },
};

const mealRules = {
  mealType: { type: 'enum', required: true, values: MEAL_TYPES, label: 'Meal type' },
  foodName: { type: 'string', required: true, min: 2, max: 80, label: 'Food name' },
  calories: { type: 'int', required: true, min: 0, max: 5000, label: 'Calories' },
  protein: { type: 'number', min: 0, max: 500, default: 0, label: 'Protein' },
  carbs: { type: 'number', min: 0, max: 1000, default: 0, label: 'Carbohydrates' },
  fats: { type: 'number', min: 0, max: 500, default: 0, label: 'Fats' },
  date: { type: 'date', required: true, label: 'Date' },
};

const progressRules = {
  date: { type: 'date', required: true, label: 'Date' },
  weight: { type: 'number', required: true, min: 25, max: 300, label: 'Weight' },
  waist: { type: 'number', min: 30, max: 250, label: 'Waist' },
  chest: { type: 'number', min: 40, max: 250, label: 'Chest' },
  arm: { type: 'number', min: 10, max: 100, label: 'Arm' },
  hip: { type: 'number', min: 40, max: 250, label: 'Hip' },
  bodyFat: { type: 'number', min: 2, max: 70, label: 'Body fat' },
  notes: { type: 'string', max: 300, label: 'Notes' },
};

const goalRules = {
  goalType: { type: 'enum', required: true, values: FITNESS_GOALS, label: 'Goal type' },
  title: { type: 'string', required: true, min: 3, max: 80, label: 'Goal title' },
  targetWeight: { type: 'number', min: 25, max: 300, label: 'Target weight' },
  targetDate: { type: 'date', required: true, label: 'Target date' },
  currentProgress: { type: 'number', min: 0, max: 100, default: 0, label: 'Current progress' },
  status: { type: 'enum', values: GOAL_STATUSES, default: 'ACTIVE', label: 'Status' },
};

module.exports = {
  profileRules,
  registerRules,
  loginRules,
  passwordRules,
  workoutRules,
  exerciseEntryRules,
  mealRules,
  progressRules,
  goalRules,
};
