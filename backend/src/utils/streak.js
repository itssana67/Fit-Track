// Workout streak calculations.
// A "streak" is a run of consecutive calendar days with at least one completed workout.
const { parseDateOnly, toDayKey, addDays } = require('./dates');

function uniqueDayKeys(dates) {
  return [...new Set(dates.map((d) => toDayKey(d)))].sort();
}

/**
 * Current streak ending today. If nothing is completed today yet, the streak
 * is still alive when yesterday was completed, so we start counting from yesterday.
 */
function currentStreak(dayKeys, todayKey) {
  const days = new Set(dayKeys);
  let cursor = parseDateOnly(todayKey);
  if (!days.has(toDayKey(cursor))) cursor = addDays(cursor, -1);

  let streak = 0;
  while (days.has(toDayKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Longest streak anywhere in the history */
function longestStreak(dayKeys) {
  const sorted = [...new Set(dayKeys)].sort();
  let best = 0;
  let run = 0;
  let previous = null;

  for (const key of sorted) {
    const date = parseDateOnly(key);
    run = previous && toDayKey(addDays(previous, 1)) === key ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }
  return best;
}

module.exports = { uniqueDayKeys, currentStreak, longestStreak };
