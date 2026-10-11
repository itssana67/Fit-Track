// One workout with its exercises. Supports edit, delete, complete and removing single exercises.
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, Circle, Clock, Flame, Library, Pencil, Trash2, X } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorState from '../components/ErrorState.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import WorkoutForm from '../components/forms/WorkoutForm.jsx';
import useApi from '../hooks/useApi';
import { workoutApi } from '../services/fittrackApi';
import { MUSCLE_GROUPS, WORKOUT_TYPES, labelOf } from '../utils/constants';
import { announceAchievements, getErrorMessage } from '../utils/errors';
import { formatDate, formatNumber } from '../utils/format';

export default function WorkoutDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, setData, loading, error, reload } = useApi(() => workoutApi.get(id), [id]);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);

  if (loading) return <LoadingSpinner label="Loading workout" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { workout } = data;
  const totalSets = workout.exercises.reduce((sum, e) => sum + (e.sets || 0), 0);
  // Volume = sets x reps x weight, a common way to measure strength training load
  const volume = workout.exercises.reduce((sum, e) => sum + (e.sets || 0) * (e.reps || 0) * (e.weightKg || 0), 0);

  const toggleComplete = async () => {
    setBusy(true);
    try {
      const result = await workoutApi.setCompleted(workout.id, !workout.completed);
      setData({ workout: result.workout });
      toast.success(result.message);
      announceAchievements(result.newAchievements);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async (payload) => {
    const result = await workoutApi.update(workout.id, payload);
    setData({ workout: result.workout });
    toast.success('Workout updated');
    announceAchievements(result.newAchievements);
    setEditing(false);
  };

  const handleDelete = async () => {
    try {
      await workoutApi.remove(workout.id);
      toast.success('Workout deleted');
      navigate('/workouts', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const removeExercise = async (entry) => {
    try {
      const result = await workoutApi.removeExercise(workout.id, entry.id);
      setData({ workout: result.workout });
      toast.success(`${entry.name} removed`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div>
      <Link to="/workouts" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft size={16} /> All workouts
      </Link>

      <div className="panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip bg-fern-50 text-fern-700">{labelOf(WORKOUT_TYPES, workout.type)}</span>
              <span className={`chip ${workout.completed ? 'bg-fern-500 text-white' : 'bg-mist text-ink-soft'}`}>
                {workout.completed ? 'Completed' : 'Planned'}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{workout.name}</h1>
            <p className="mt-1 text-ink-soft">{formatDate(workout.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={workout.completed ? 'btn-secondary' : 'btn-primary'} onClick={toggleComplete} disabled={busy}>
              {workout.completed ? <Circle size={17} /> : <CheckCircle2 size={17} />}
              {workout.completed ? 'Mark as planned' : 'Mark as completed'}
            </button>
            <button className="btn-secondary" onClick={() => setEditing(true)}><Pencil size={16} /> Edit</button>
            <button className="btn-ghost text-rose-600 hover:!bg-rose-50" onClick={() => setDeleting(true)}><Trash2 size={16} /> Delete</button>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Clock, label: 'Duration', value: `${workout.durationMin} min` },
            { icon: Flame, label: 'Calories burned', value: `${workout.caloriesBurned} kcal` },
            { label: 'Total sets', value: totalSets },
            { label: 'Volume lifted', value: volume ? `${formatNumber(volume)} kg` : '—' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-mist p-3">
              <dt className="text-[13px] text-ink-soft">{item.label}</dt>
              <dd className="font-display text-xl font-bold">{item.value}</dd>
            </div>
          ))}
        </dl>

        {workout.notes && (
          <div className="mt-5">
            <h2 className="text-sm font-bold">Notes</h2>
            <p className="mt-1 whitespace-pre-line text-ink-soft">{workout.notes}</p>
          </div>
        )}
      </div>

      <section className="panel mt-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Exercises</h2>
          <Link to="/exercises" className="btn-ghost btn-sm"><Library size={15} /> Add from library</Link>
        </div>

        {workout.exercises.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">No exercises yet. Edit the workout or add some from the exercise library.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[13px] text-ink-soft">
                  <th className="py-2 pr-3 font-semibold">#</th>
                  <th className="py-2 pr-3 font-semibold">Exercise</th>
                  <th className="py-2 pr-3 font-semibold">Muscle group</th>
                  <th className="py-2 pr-3 font-semibold">Sets</th>
                  <th className="py-2 pr-3 font-semibold">Reps</th>
                  <th className="py-2 pr-3 font-semibold">Weight</th>
                  <th className="py-2 pr-3 font-semibold">Duration</th>
                  <th className="py-2" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {workout.exercises.map((entry, index) => (
                  <tr key={entry.id} className="border-b border-line last:border-0">
                    <td className="py-2.5 pr-3 text-ink-faint">{index + 1}</td>
                    <td className="py-2.5 pr-3 font-medium">{entry.name}</td>
                    <td className="py-2.5 pr-3 text-ink-soft">{labelOf(MUSCLE_GROUPS, entry.muscleGroup)}</td>
                    <td className="py-2.5 pr-3">{entry.sets ?? '—'}</td>
                    <td className="py-2.5 pr-3">{entry.reps ?? '—'}</td>
                    <td className="py-2.5 pr-3">{entry.weightKg ? `${entry.weightKg} kg` : '—'}</td>
                    <td className="py-2.5 pr-3">{entry.durationMin ? `${entry.durationMin} min` : '—'}</td>
                    <td className="py-2.5 text-right">
                      <button className="btn-icon h-8 w-8 hover:!bg-rose-50 hover:!text-rose-600" onClick={() => removeExercise(entry)} aria-label={`Remove ${entry.name}`}>
                        <X size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit workout" size="xl">
        {editing && <WorkoutForm initial={workout} onSubmit={handleSave} onCancel={() => setEditing(false)} />}
      </Modal>

      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={handleDelete}
        title="Delete workout?"
        message={`“${workout.name}” and its exercises will be removed permanently.`}
      />
    </div>
  );
}
