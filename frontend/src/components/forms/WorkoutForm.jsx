import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { SelectInput, TextArea, TextInput } from '../FormControls.jsx';
import ExerciseRowsEditor from './ExerciseRowsEditor.jsx';
import useAuth from '../../hooks/useAuth';
import { WORKOUT_MET, WORKOUT_TYPES } from '../../utils/constants';
import { toInputDate, todayStr, toNumberOrNull } from '../../utils/format';
import { getFieldErrors } from '../../utils/errors';

const toRow = (exercise) => ({
  exerciseId: exercise.exerciseId || undefined,
  name: exercise.name || '',
  muscleGroup: exercise.muscleGroup || 'CHEST',
  sets: exercise.sets ?? '',
  reps: exercise.reps ?? '',
  weightKg: exercise.weightKg ?? '',
  durationMin: exercise.durationMin ?? '',
});

export default function WorkoutForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = 'Save workout',
  showExercises = true,
}) {
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: initial?.name || '',
    type: initial?.type || 'STRENGTH',
    durationMin: initial?.durationMin ?? 45,
    date: toInputDate(initial?.date) || todayStr(),
    caloriesBurned: initial?.caloriesBurned ?? '',
    notes: initial?.notes || '',
    completed: initial?.completed ?? false,
  });

  const [rows, setRows] = useState(
    (initial?.exercises || []).map(toRow)
  );

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (field) => (event) => {
    const value =
      event.target.type === 'checkbox'
        ? event.target.checked
        : event.target.value;

    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // Estimate calories using workout type, duration, and profile weight.
  const estimateCalories = () => {
    const minutes = Number(form.durationMin) || 0;
    const weight = Number(user?.weightKg) || 70;

    const calories = Math.round(
      (WORKOUT_MET[form.type] || 5) *
        weight *
        (minutes / 60)
    );

    setForm((previous) => ({
      ...previous,
      caloriesBurned: calories,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setErrors({});

    const payload = {
      ...form,
      durationMin: Number(form.durationMin),
      caloriesBurned:
        form.caloriesBurned === ''
          ? 0
          : Number(form.caloriesBurned),
      notes: form.notes.trim() || null,
    };

    if (showExercises) {
      payload.exercises = rows
        .filter((row) => row.name.trim())
        .map((row) => ({
          exerciseId: row.exerciseId,
          name: row.name.trim(),
          muscleGroup: row.muscleGroup,
          sets: toNumberOrNull(row.sets),
          reps: toNumberOrNull(row.reps),
          weightKg: toNumberOrNull(row.weightKg),
          durationMin: toNumberOrNull(row.durationMin),
        }));
    }

    try {
      await onSubmit(payload);
    } catch (error) {
      setErrors(getFieldErrors(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      noValidate
    >
      {/* Basic workout information */}
      <section className="space-y-4">
        <div>
          <h3 className="font-bold text-ink">
            Workout details
          </h3>
          <p className="mt-1 text-sm text-ink-soft">
            Give your workout a name and choose when you plan to do it.
          </p>
        </div>

        <TextInput
          label="Workout name"
          placeholder="e.g. Full Body Workout"
          value={form.name}
          onChange={set('name')}
          error={errors.name}
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectInput
            label="Workout type"
            value={form.type}
            onChange={set('type')}
            options={WORKOUT_TYPES}
            error={errors.type}
          />

          <TextInput
            label="Workout date"
            type="date"
            value={form.date}
            onChange={set('date')}
            error={errors.date}
            required
          />

          <TextInput
            label="Duration"
            type="number"
            min="1"
            suffix="min"
            placeholder="45"
            value={form.durationMin}
            onChange={set('durationMin')}
            error={errors.durationMin}
            required
          />

          <div>
            <TextInput
              label="Calories burned"
              type="number"
              min="0"
              suffix="kcal"
              placeholder="Optional"
              value={form.caloriesBurned}
              onChange={set('caloriesBurned')}
              error={errors.caloriesBurned}
            />

            <button
              type="button"
              onClick={estimateCalories}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-tide-600 hover:underline"
            >
              <Calculator size={13} />
              Estimate calories
            </button>
          </div>
        </div>

        <TextArea
          label="Notes (optional)"
          placeholder="Add your goals or any notes for this workout..."
          value={form.notes}
          onChange={set('notes')}
          error={errors.notes}
          rows={3}
        />
      </section>

      {/* Exercise picker appears inside this form */}
      {showExercises && (
        <section className="border-t border-line pt-5">
          <ExerciseRowsEditor
            rows={rows}
            onChange={setRows}
            workoutType={form.type}
          />
        </section>
      )}

      {/* Completion status */}
      <label className="flex items-center gap-2.5 rounded-xl bg-mist p-3 text-sm font-medium">
        <input
          type="checkbox"
          className="h-4 w-4 accent-fern-500"
          checked={form.completed}
          onChange={set('completed')}
        />
        I've already completed this workout
      </label>

      {/* Form actions */}
      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="btn-primary"
          disabled={saving}
        >
          {saving ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}