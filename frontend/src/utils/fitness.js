// Same formulas as backend/src/utils/fitness.js (used by the calculator page).

export const ACTIVITY_MULTIPLIERS = { SEDENTARY: 1.2, LIGHT: 1.375, MODERATE: 1.55, ACTIVE: 1.725, VERY_ACTIVE: 1.9 };
export const GOAL_CALORIE_ADJUSTMENT = {
  LOSE_WEIGHT: -500,
  GAIN_MUSCLE: 300,
  MAINTAIN_WEIGHT: 0,
  IMPROVE_ENDURANCE: 0,
  INCREASE_STRENGTH: 200,
};
const PROTEIN_PER_KG = { LOSE_WEIGHT: 2.0, GAIN_MUSCLE: 2.0, MAINTAIN_WEIGHT: 1.6, IMPROVE_ENDURANCE: 1.4, INCREASE_STRENGTH: 1.8 };
const MIN_CALORIES = 1200;

export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function bmiCategory(bmi) {
  if (bmi === null || bmi === undefined) return null;
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

// Mifflin-St Jeor equation
export function calculateBMR({ weightKg, heightCm, age, gender }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const constant = gender === 'MALE' ? 5 : gender === 'FEMALE' ? -161 : -78;
  return Math.round(base + constant);
}

export function calculateTDEE(bmr, activityLevel) {
  return Math.round(bmr * (ACTIVITY_MULTIPLIERS[activityLevel] || 1.2));
}

export function calorieTarget(tdee, goal) {
  return Math.max(MIN_CALORIES, Math.round(tdee + (GOAL_CALORIE_ADJUSTMENT[goal] || 0)));
}

export function macroTargets(calories, weightKg, goal) {
  const protein = Math.round(weightKg * (PROTEIN_PER_KG[goal] || 1.6));
  const fats = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fats * 9) / 4));
  return { protein, carbs, fats };
}

export const BMI_COLORS = {
  Underweight: 'text-tide-600 bg-tide-50',
  Normal: 'text-fern-700 bg-fern-50',
  Overweight: 'text-ember-500 bg-ember-50',
  Obese: 'text-rose-600 bg-rose-50',
};
