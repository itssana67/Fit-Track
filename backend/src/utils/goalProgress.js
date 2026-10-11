// Works out how far along a goal is (0-100).
// Weight goals are calculated automatically from the user's current weight:
//   progress = (startWeight - currentWeight) / (startWeight - targetWeight)
// This formula works for both losing (start > target) and gaining (start < target).
// Other goals (endurance, strength ...) use the manual currentProgress value.

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function isWeightBased(goal) {
  return (
    goal.targetWeight !== null &&
    goal.targetWeight !== undefined &&
    goal.startWeight !== null &&
    goal.startWeight !== undefined &&
    goal.startWeight !== goal.targetWeight
  );
}

function computeGoalProgress(goal, currentWeight) {
  if (goal.status === 'COMPLETED') return 100;
  if (isWeightBased(goal) && currentWeight) {
    const pct = ((goal.startWeight - currentWeight) / (goal.startWeight - goal.targetWeight)) * 100;
    return clamp(Math.round(pct), 0, 100);
  }
  return clamp(Math.round(goal.currentProgress || 0), 0, 100);
}

/** Adds computed fields the frontend needs */
function withGoalProgress(goal, currentWeight) {
  return {
    ...goal,
    isWeightBased: isWeightBased(goal),
    currentWeight,
    progress: computeGoalProgress(goal, currentWeight),
  };
}

module.exports = { isWeightBased, computeGoalProgress, withGoalProgress };
