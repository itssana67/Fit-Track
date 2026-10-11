// Adds an exercise from the library to an existing workout, or to a new one.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Modal from './Modal.jsx';
import { SelectInput, TextInput } from './FormControls.jsx';
import { workoutApi } from '../services/fittrackApi';
import { getErrorMessage, getFieldErrors, announceAchievements } from '../utils/errors';
import { formatShortDate, todayStr, toNumberOrNull } from '../utils/format';

const NEW = '__new__';

export default function AddToWorkoutModal({ exercise, onClose }) {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState('');
  const [newWorkout, setNewWorkout] = useState({ name: '', date: todayStr() });
  const isCardio = exercise?.muscleGroup === 'CARDIO';
  const [entry, setEntry] = useState({ sets: isCardio ? '' : '3', reps: isCardio ? '' : '10', weightKg: '', durationMin: isCardio ? '20' : '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!exercise) return;
    setLoading(true);
    // Planned (not yet completed) workouts are the most likely place to add an exercise
    workoutApi
      .list({ status: 'planned' })
      .then(({ workouts: list }) => {
        setWorkouts(list);
        setTarget(list[0]?.id || NEW);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [exercise]);

  const exercisePayload = () => ({
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    exerciseId: exercise.source === 'local' ? exercise.id : undefined,
    sets: toNumberOrNull(entry.sets),
    reps: toNumberOrNull(entry.reps),
    weightKg: toNumberOrNull(entry.weightKg),
    durationMin: toNumberOrNull(entry.durationMin),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      let workoutId = target;
      let workoutName;
      if (target === NEW) {
        const result = await workoutApi.create({
          name: newWorkout.name || `${exercise.name} session`,
          type: isCardio ? 'CARDIO' : 'STRENGTH',
          durationMin: 45,
          date: newWorkout.date,
          exercises: [exercisePayload()],
        });
        announceAchievements(result.newAchievements);
        workoutId = result.workout.id;
        workoutName = result.workout.name;
      } else {
        const result = await workoutApi.addExercise(target, exercisePayload());
        workoutName = result.workout.name;
      }
      toast.success(
        (t) => (
          <span>
            {exercise.name} added to {workoutName}.{' '}
            <Link to={`/workouts/${workoutId}`} onClick={() => toast.dismiss(t.id)} className="font-semibold text-fern-600 underline">
              Open workout
            </Link>
          </span>
        ),
        { duration: 5000 }
      );
      onClose();
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!exercise) return null;

  const options = [
    ...workouts.map((w) => ({ value: w.id, label: `${w.name} (${formatShortDate(w.date)})` })),
    { value: NEW, label: 'Create a new workout' },
  ];

  return (
    <Modal open={Boolean(exercise)} onClose={onClose} title={`Add ${exercise.name}`} description="Choose a planned workout or create a new one.">
      {loading ? (
        <p className="text-sm text-ink-soft">Loading your workouts…</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <SelectInput label="Workout" value={target} onChange={(e) => setTarget(e.target.value)} options={options} />

          {target === NEW && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label="New workout name" placeholder={`${exercise.name} session`} value={newWorkout.name} onChange={(e) => setNewWorkout({ ...newWorkout, name: e.target.value })} />
              <TextInput label="Date" type="date" value={newWorkout.date} onChange={(e) => setNewWorkout({ ...newWorkout, date: e.target.value })} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <TextInput label="Sets" type="number" min="1" value={entry.sets} error={errors.sets} onChange={(e) => setEntry({ ...entry, sets: e.target.value })} />
            <TextInput label="Reps" type="number" min="1" value={entry.reps} error={errors.reps} onChange={(e) => setEntry({ ...entry, reps: e.target.value })} />
            <TextInput label="Weight" type="number" min="0" step="0.5" suffix="kg" value={entry.weightKg} error={errors.weightKg} onChange={(e) => setEntry({ ...entry, weightKg: e.target.value })} />
            <TextInput label="Duration" type="number" min="1" suffix="min" value={entry.durationMin} error={errors.durationMin} onChange={(e) => setEntry({ ...entry, durationMin: e.target.value })} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Adding…' : 'Add exercise'}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
