// Fitness formulas used by the dashboard, nutrition targets and recommendations.
// The frontend calculator uses the same formulas (frontend/src/utils/fitness.js).

// Multipliers from the Harris-Benedict activity factors
const ACTIVITY_MULTIPLIERS = {
  SEDENTARY: 1.2, // little or no exercise
  LIGHT: 1.375, // 1-3 days a week
  MODERATE: 1.55, // 3-5 days a week
  ACTIVE: 1.725, // 6-7 days a week
  VERY_ACTIVE: 1.9, // hard training or physical job
};

// Daily calorie adjustment applied to TDEE for each goal
const GOAL_CALORIE_ADJUSTMENT = {
  LOSE_WEIGHT: -500, // ~0.5 kg loss per week
  GAIN_MUSCLE: 300, // small surplus to limit fat gain
  MAINTAIN_WEIGHT: 0,
  IMPROVE_ENDURANCE: 0,
  INCREASE_STRENGTH: 200,
};

// Protein in grams per kg of body weight for each goal
const PROTEIN_PER_KG = {
  LOSE_WEIGHT: 2.0,
  GAIN_MUSCLE: 2.0,
  MAINTAIN_WEIGHT: 1.6,
  IMPROVE_ENDURANCE: 1.4,
  INCREASE_STRENGTH: 1.8,
};

const MIN_CALORIES = 1200; // safety floor, never recommend below this

const round = (value, digits = 0) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

/** BMI = weight (kg) / height (m)^2 */
function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return round(weightKg / (heightM * heightM), 1);
}

/** WHO adult BMI categories */
function bmiCategory(bmi) {
  if (bmi === null || bmi === undefined) return null;
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

/**
 * Basal Metabolic Rate using the Mifflin-St Jeor equation:
 *   men:   10*kg + 6.25*cm - 5*age + 5
 *   women: 10*kg + 6.25*cm - 5*age - 161
 * For "OTHER" we use the average of both constants (-78).
 */
function calculateBMR({ weightKg, heightCm, age, gender }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const constant = gender === 'MALE' ? 5 : gender === 'FEMALE' ? -161 : -78;
  return Math.round(base + constant);
}

/** Total Daily Energy Expenditure = BMR x activity multiplier */
function calculateTDEE(bmr, activityLevel) {
  return Math.round(bmr * (ACTIVITY_MULTIPLIERS[activityLevel] || 1.2));
}

function calorieTarget(tdee, fitnessGoal) {
  const target = tdee + (GOAL_CALORIE_ADJUSTMENT[fitnessGoal] || 0);
  return Math.max(MIN_CALORIES, Math.round(target));
}

/** Protein from body weight, 25% of calories from fat, the rest from carbs */
function macroTargets(calories, weightKg, fitnessGoal) {
  const protein = Math.round(weightKg * (PROTEIN_PER_KG[fitnessGoal] || 1.6));
  const fats = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fats * 9) / 4));
  return { protein, carbs, fats };
}

/** Everything the app needs about a user's body numbers in one object */
function getFitnessProfile(user) {
  const bmi = calculateBMI(user.weightKg, user.heightCm);
  const bmr = calculateBMR(user);
  const tdee = calculateTDEE(bmr, user.activityLevel);
  const calories = calorieTarget(tdee, user.fitnessGoal);
  return {
    bmi,
    bmiCategory: bmiCategory(bmi),
    bmr,
    tdee,
    calorieTarget: calories,
    macros: macroTargets(calories, user.weightKg, user.fitnessGoal),
  };
}

module.exports = {
  ACTIVITY_MULTIPLIERS,
  GOAL_CALORIE_ADJUSTMENT,
  calculateBMI,
  bmiCategory,
  calculateBMR,
  calculateTDEE,
  calorieTarget,
  macroTargets,
  getFitnessProfile,
};
