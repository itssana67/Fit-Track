// External exercise API integration (API Ninjas Exercises API).
//
// Flow: React -> GET /api/exercises (our Express backend) -> this service
//       -> API Ninjas (with the secret key from .env) -> back to React.
// The API key never reaches the browser.
//
// If EXERCISE_API_KEY is empty, or the external API fails, we fall back to the
// exercise catalogue stored in MongoDB so the library always works in a demo.
const axios = require('axios');
const env = require('../lib/env');
const prisma = require('../lib/prisma');

// Our muscle groups -> muscle names used by API Ninjas
const GROUP_TO_API_MUSCLES = {
  CHEST: ['chest'],
  BACK: ['lats', 'middle_back', 'lower_back', 'traps'],
  LEGS: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
  SHOULDERS: ['shoulders', 'traps', 'neck'],
  ARMS: ['biceps', 'triceps', 'forearms'],
  CORE: ['abdominals'],
  FULL_BODY: ['glutes', 'quadriceps'],
};

// Reverse lookup: API muscle -> our muscle group
const API_MUSCLE_TO_GROUP = {
  chest: 'CHEST',
  lats: 'BACK',
  middle_back: 'BACK',
  lower_back: 'BACK',
  traps: 'BACK',
  quadriceps: 'LEGS',
  hamstrings: 'LEGS',
  glutes: 'LEGS',
  calves: 'LEGS',
  abductors: 'LEGS',
  adductors: 'LEGS',
  shoulders: 'SHOULDERS',
  neck: 'SHOULDERS',
  biceps: 'ARMS',
  triceps: 'ARMS',
  forearms: 'ARMS',
  abdominals: 'CORE',
};

// Muscles fetched when the user has not chosen any filter
const DEFAULT_MUSCLES = ['chest', 'lats', 'quadriceps', 'biceps', 'abdominals', 'triceps'];

// Simple in-memory cache so we do not call the API on every keystroke
const CACHE_TTL_MS = 30 * 60 * 1000;
const cache = new Map();

const titleCase = (text = '') =>
  text
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());

function normaliseEquipment(raw = '') {
  const value = String(raw).toLowerCase();
  if (!value || value === 'none' || value === 'body_only') return 'Body weight';
  if (value.includes('kettlebell')) return 'Kettlebells';
  if (value.includes('band')) return 'Bands';
  if (value === 'e-z_curl_bar') return 'Barbell';
  return titleCase(value);
}

function normaliseDifficulty(raw = '') {
  const value = String(raw).toUpperCase();
  return ['BEGINNER', 'INTERMEDIATE', 'EXPERT'].includes(value) ? value : 'INTERMEDIATE';
}

function slugify(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Converts one API Ninjas result into the shape our frontend expects */
function normaliseApiExercise(item) {
  const muscle = String(item.muscle || '').toLowerCase();
  const isCardio = String(item.type || '').toLowerCase() === 'cardio';
  return {
    id: `api-${slugify(item.name)}`,
    name: item.name,
    muscleGroup: isCardio ? 'CARDIO' : API_MUSCLE_TO_GROUP[muscle] || 'FULL_BODY',
    targetMuscle: titleCase(muscle) || 'Full body',
    equipment: normaliseEquipment(item.equipment || item.equipments?.[0]),
    difficulty: normaliseDifficulty(item.difficulty),
    instructions: item.instructions || 'No instructions provided.',
    source: 'api',
  };
}

async function callApi(params) {
  const key = JSON.stringify(params);
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.data;

  const response = await axios.get(env.exerciseApiUrl, {
    params,
    headers: { 'X-Api-Key': env.exerciseApiKey },
    timeout: 8000,
  });
  const data = Array.isArray(response.data) ? response.data : [];
  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
  return data;
}

/** Builds the list of API requests needed for the chosen filters */
function buildRequests({ search, muscleGroup, difficulty }) {
  const base = {};
  if (search) base.name = search;
  if (difficulty) base.difficulty = difficulty.toLowerCase();

  if (muscleGroup === 'CARDIO') return [{ ...base, type: 'cardio' }];
  if (muscleGroup && GROUP_TO_API_MUSCLES[muscleGroup]) {
    return GROUP_TO_API_MUSCLES[muscleGroup].map((muscle) => ({ ...base, muscle }));
  }
  if (search) return [base]; // name search across all muscles
  return DEFAULT_MUSCLES.map((muscle) => ({ ...base, muscle }));
}

/** Applies filters our API call could not (equipment, exact group) and removes duplicates */
function filterAndDedupe(list, { muscleGroup, equipment }) {
  const seen = new Set();
  return list.filter((exercise) => {
    if (seen.has(exercise.id)) return false;
    seen.add(exercise.id);
    if (muscleGroup && exercise.muscleGroup !== muscleGroup) return false;
    if (equipment && exercise.equipment.toLowerCase() !== equipment.toLowerCase()) return false;
    return true;
  });
}

async function searchExternal(filters) {
  const requests = buildRequests(filters);
  // allSettled: one failing muscle query should not break the whole search
  const results = await Promise.allSettled(requests.map(callApi));
  const fulfilled = results.filter((r) => r.status === 'fulfilled');
  if (fulfilled.length === 0) {
    const reason = results[0]?.reason;
    throw reason || new Error('External API request failed');
  }
  const exercises = fulfilled.flatMap((r) => r.value).map(normaliseApiExercise);
  return filterAndDedupe(exercises, filters);
}

async function searchLocal({ search, muscleGroup, equipment, difficulty }) {
  const where = {};
  if (search) where.name = { contains: search, mode: 'insensitive' };
  if (muscleGroup) where.muscleGroup = muscleGroup;
  if (difficulty) where.difficulty = difficulty;
  if (equipment) where.equipment = { equals: equipment, mode: 'insensitive' };

  const exercises = await prisma.exercise.findMany({ where, orderBy: { name: 'asc' } });
  return exercises.map((exercise) => ({ ...exercise, source: 'local' }));
}

/**
 * Main entry point used by the controller.
 * Returns { exercises, source, notice }
 */
async function searchExercises(filters) {
  if (!env.exerciseApiKey) {
    return {
      exercises: await searchLocal(filters),
      source: 'local',
      notice: 'Showing the built-in exercise library. Add EXERCISE_API_KEY to backend/.env to load live API data.',
    };
  }

  try {
    const exercises = await searchExternal(filters);
    return { exercises, source: 'api', notice: null };
  } catch (err) {
    const status = err.response?.status;
    console.warn(`[FitTrack] Exercise API unavailable (${status || err.message}). Using local library.`);
    return {
      exercises: await searchLocal(filters),
      source: 'local',
      notice:
        status === 401 || status === 403
          ? 'The exercise API rejected the key, so the built-in library is shown. Check EXERCISE_API_KEY.'
          : 'The exercise API is not reachable right now, so the built-in library is shown.',
    };
  }
}

module.exports = { searchExercises, normaliseApiExercise };
