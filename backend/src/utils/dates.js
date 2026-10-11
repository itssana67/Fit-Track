// Date helpers.
// FitTrack stores "calendar day" values (workout date, meal date ...) as
// midnight UTC of that day, e.g. "2026-09-29" -> 2026-09-29T00:00:00.000Z.
// Using the same rule everywhere avoids timezone bugs between the browser,
// the server and MongoDB.

const DAY_MS = 24 * 60 * 60 * 1000;

/** Convert "YYYY-MM-DD" (or any date) into midnight UTC of that day. Returns null if invalid. */
function parseDateOnly(value) {
  if (value === undefined || value === null || value === '') return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }

  const text = String(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    // Reject impossible dates such as 2026-02-31 (JS would roll them over)
    if (toDayKey(date) !== `${match[1]}-${match[2]}-${match[3]}`) return null;
    return date;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
}

/** "YYYY-MM-DD" key of a stored date */
function toDayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function addDays(date, days) {
  return new Date(new Date(date).getTime() + days * DAY_MS);
}

/** Last millisecond of the same UTC day */
function endOfDay(date) {
  return new Date(parseDateOnly(date).getTime() + DAY_MS - 1);
}

/** Today's calendar day on the server, as midnight UTC */
function todayDateOnly() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

/**
 * The frontend sends ?today=YYYY-MM-DD so "today" matches the user's own
 * timezone. Falls back to the server's date.
 */
function resolveDay(value) {
  return parseDateOnly(value) || todayDateOnly();
}

function daysBetween(from, to) {
  return Math.round((parseDateOnly(to) - parseDateOnly(from)) / DAY_MS);
}

module.exports = {
  DAY_MS,
  parseDateOnly,
  toDayKey,
  addDays,
  endOfDay,
  todayDateOnly,
  resolveDay,
  daysBetween,
};
