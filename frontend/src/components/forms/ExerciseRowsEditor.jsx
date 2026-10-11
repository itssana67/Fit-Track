import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Search, LoaderCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { MUSCLE_GROUPS, WORKOUT_TYPES } from '../../utils/constants';
import { exerciseApi } from '../../services/fittrackApi';
import { getErrorMessage } from '../../utils/errors';

export const emptyExerciseRow = () => ({
  name: '',
  muscleGroup: 'CHEST',
  sets: '3',
  reps: '10',
  weightKg: '',
  durationMin: '',
});

const CATEGORIES = [
  { value: '', label: 'All exercises' },
  ...WORKOUT_TYPES,
];

function getCategory(exercise) {
  const text = [
    exercise.name,
    exercise.instructions,
    exercise.targetMuscle,
    exercise.muscleGroup,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (
    exercise.muscleGroup === 'CARDIO' ||
    /\b(running|jogging|cycling|treadmill|jump rope|walking|swimming|rowing)\b/.test(text)
  ) {
    return 'CARDIO';
  }

  if (
    /\b(hiit|burpee|mountain climber|jump squat|high knees|tabata)\b/.test(text)
  ) {
    return 'HIIT';
  }

  if (
    /\b(stretch|yoga|mobility|flexibility|foam roll)\b/.test(text)
  ) {
    return 'FLEXIBILITY';
  }

  if (
    /\b(basketball|football|soccer|tennis|volleyball|badminton|sports drill)\b/.test(text)
  ) {
    return 'SPORTS';
  }

  if (exercise.muscleGroup && exercise.muscleGroup !== 'CARDIO') {
    return 'STRENGTH';
  }

  return 'OTHER';
}

export default function ExerciseRowsEditor({ rows, onChange, workoutType }) {
  const [exercises, setExercises] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadExercises() {
      setLoading(true);
      setLoadError('');

      try {
        const result = await exerciseApi.list({});
        if (!active) return;

        const list = Array.isArray(result)
          ? result
          : result?.exercises || result?.data || [];

        setExercises(list);
      } catch (error) {
        if (active) setLoadError(getErrorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadExercises();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setCategory(workoutType || '');
  }, [workoutType]);

  const filteredExercises = useMemo(() => {
    const query = search.trim().toLowerCase();

    return exercises.filter((exercise) => {
      const matchesSearch =
        !query ||
        exercise.name?.toLowerCase().includes(query) ||
        exercise.targetMuscle?.toLowerCase().includes(query) ||
        exercise.muscleGroup?.toLowerCase().includes(query);

      const matchesCategory =
        !category || getCategory(exercise) === category;

      return matchesSearch && matchesCategory;
    });
  }, [exercises, search, category]);

  const update = (index, field, value) => {
    onChange(
      rows.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      )
    );
  };

  const remove = (index) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const addExercise = (exercise) => {
    const alreadyAdded = rows.some(
      (row) =>
        row.name.trim().toLowerCase() ===
        exercise.name.trim().toLowerCase()
    );

    if (alreadyAdded) {
      toast.error('This exercise is already in your workout.');
      return;
    }

    const isCardio = getCategory(exercise) === 'CARDIO';

    onChange([
      ...rows,
      {
        exerciseId: exercise.id,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup || 'FULL_BODY',
        sets: isCardio ? '' : '3',
        reps: isCardio ? '' : '10',
        weightKg: '',
        durationMin: isCardio ? '20' : '',
      },
    ]);

    toast.success(`${exercise.name} added`);
  };

  return (
    <div className="space-y-5">
      {/* Exercise library */}
      <section className="rounded-2xl border border-line p-4">
        <div className="mb-3">
          <h3 className="font-bold text-ink">Add exercises</h3>
          <p className="mt-1 text-sm text-ink-soft">
            Search for an exercise or choose a category. Click Add to include it.
          </p>
        </div>

        <div className="relative mb-3">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            className="input pl-9"
            placeholder="Search exercises..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search exercises"
          />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {CATEGORIES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setCategory(item.value)}
              aria-pressed={category === item.value}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                category === item.value
                  ? 'bg-ink text-white'
                  : 'bg-mist text-ink-soft hover:text-ink'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-ink-soft">
            <LoaderCircle size={18} className="animate-spin" />
            Loading exercises...
          </div>
        ) : loadError ? (
          <div className="rounded-lg bg-mist p-3 text-sm text-ink-soft">
            <p>We couldn't load the exercise library.</p>
            <p className="mt-1">{loadError}</p>
            <button
              type="button"
              className="mt-2 font-semibold text-ink underline"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        ) : filteredExercises.length === 0 ? (
          <p className="rounded-lg bg-mist p-4 text-sm text-ink-soft">
            No exercises found in this category. Try All Exercises or another search.
          </p>
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {filteredExercises.map((exercise) => {
              const added = rows.some(
                (row) =>
                  row.name.trim().toLowerCase() ===
                  exercise.name.trim().toLowerCase()
              );

              return (
                <div
                  key={exercise.id || exercise.name}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line p-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">
                      {exercise.name}
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">
                      {exercise.targetMuscle ||
                        exercise.muscleGroup ||
                        'Full body'}
                      {exercise.equipment
                        ? ` · ${exercise.equipment}`
                        : ''}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn-secondary shrink-0"
                    disabled={added}
                    onClick={() => addExercise(exercise)}
                  >
                    <Plus size={15} />
                    {added ? 'Added' : 'Add'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Selected exercises */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-ink">
              Your selected exercises ({rows.length})
            </h3>
            <p className="mt-1 text-sm text-ink-soft">
              Adjust sets, reps, weight, or duration below.
            </p>
          </div>

          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => onChange([...rows, emptyExerciseRow()])}
          >
            <Plus size={15} />
            Custom exercise
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="rounded-xl bg-mist p-4 text-sm text-ink-soft">
            No exercises selected yet. Choose one from the list above or add a custom exercise.
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map((row, index) => (
              <div
                key={`${row.exerciseId || row.name}-${index}`}
                className="rounded-xl border border-line p-3"
              >
                <div className="flex gap-2">
                  <input
                    className="input min-w-0 flex-1"
                    placeholder="Exercise name"
                    value={row.name}
                    onChange={(event) =>
                      update(index, 'name', event.target.value)
                    }
                    aria-label="Exercise name"
                    required
                  />

                  <button
                    type="button"
                    className="btn-icon shrink-0 hover:!bg-rose-50 hover:!text-rose-600"
                    onClick={() => remove(index)}
                    aria-label="Remove exercise"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="mt-2">
                  <select
                    className="input w-full"
                    value={row.muscleGroup}
                    onChange={(event) =>
                      update(index, 'muscleGroup', event.target.value)
                    }
                    aria-label="Muscle group"
                  >
                    {MUSCLE_GROUPS.map((group) => (
                      <option key={group.value} value={group.value}>
                        {group.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    ['sets', 'Sets'],
                    ['reps', 'Reps'],
                    ['weightKg', 'Weight (kg)'],
                    ['durationMin', 'Duration (min)'],
                  ].map(([field, label]) => (
                    <label key={field} className="text-xs text-ink-soft">
                      {label}
                      <input
                        className="input mt-1"
                        type="number"
                        min="0"
                        step={field === 'weightKg' ? '0.5' : '1'}
                        placeholder={label}
                        aria-label={label}
                        value={row[field] ?? ''}
                        onChange={(event) =>
                          update(index, field, event.target.value)
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}