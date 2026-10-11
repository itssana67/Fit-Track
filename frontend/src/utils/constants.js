// Allowed values (must match the enums in backend/prisma/schema.prisma) with display labels

export const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

export const ACTIVITY_LEVELS = [
  { value: 'SEDENTARY', label: 'Sedentary', hint: 'Little or no exercise' },
  { value: 'LIGHT', label: 'Lightly active', hint: 'Exercise 1-3 days a week' },
  { value: 'MODERATE', label: 'Moderately active', hint: 'Exercise 3-5 days a week' },
  { value: 'ACTIVE', label: 'Very active', hint: 'Exercise 6-7 days a week' },
  { value: 'VERY_ACTIVE', label: 'Athlete', hint: 'Hard daily training or a physical job' },
];

export const FITNESS_GOALS = [
  { value: 'LOSE_WEIGHT', label: 'Lose weight' },
  { value: 'GAIN_MUSCLE', label: 'Gain muscle' },
  { value: 'MAINTAIN_WEIGHT', label: 'Maintain weight' },
  { value: 'IMPROVE_ENDURANCE', label: 'Improve endurance' },
  { value: 'INCREASE_STRENGTH', label: 'Increase strength' },
];

export const WORKOUT_TYPES = [
  { value: 'STRENGTH', label: 'Strength' },
  { value: 'CARDIO', label: 'Cardio' },
  { value: 'HIIT', label: 'HIIT' },
  { value: 'FLEXIBILITY', label: 'Flexibility' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'OTHER', label: 'Other' },
];

export const MUSCLE_GROUPS = [
  { value: 'CHEST', label: 'Chest' },
  { value: 'BACK', label: 'Back' },
  { value: 'LEGS', label: 'Legs' },
  { value: 'SHOULDERS', label: 'Shoulders' },
  { value: 'ARMS', label: 'Arms' },
  { value: 'CORE', label: 'Core' },
  { value: 'CARDIO', label: 'Cardio' },
  { value: 'FULL_BODY', label: 'Full body' },
];

export const MEAL_TYPES = [
  { value: 'BREAKFAST', label: 'Breakfast' },
  { value: 'LUNCH', label: 'Lunch' },
  { value: 'DINNER', label: 'Dinner' },
  { value: 'SNACK', label: 'Snack' },
];

export const GOAL_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'PAUSED', label: 'Paused' },
];

export const DIFFICULTIES = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'EXPERT', label: 'Expert' },
];

export const EQUIPMENT_OPTIONS = ['Body weight', 'Dumbbell', 'Barbell', 'Cable', 'Machine', 'Kettlebells', 'Bands', 'Medicine ball', 'Other'];

// Rough MET values used to estimate calories burned: kcal = MET x kg x hours
export const WORKOUT_MET = { STRENGTH: 5, CARDIO: 8, HIIT: 9, FLEXIBILITY: 2.5, SPORTS: 7, OTHER: 4.5 };

export const labelOf = (list, value) => list.find((item) => item.value === value)?.label ?? value ?? '—';
