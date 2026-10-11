// Workout tracker: list, filters, create / edit / delete, mark as completed.
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Dumbbell, Plus, Search, CheckCircle2, CalendarDays, Clock } from 'lucide-react';

import PageHeader from '../components/PageHeader.jsx';
import WorkoutCard from '../components/WorkoutCard.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorState from '../components/ErrorState.jsx';
import EmptyState from '../components/EmptyState.jsx';
import WorkoutForm from '../components/forms/WorkoutForm.jsx';

import useApi from '../hooks/useApi';
import useDebounce from '../hooks/useDebounce';
import { workoutApi } from '../services/fittrackApi';
import { WORKOUT_TYPES } from '../utils/constants';
import { announceAchievements, getErrorMessage } from '../utils/errors';

const STATUS_TABS = [
  { value: '', label: 'All workouts' },
  { value: 'planned', label: 'Planned' },
  { value: 'completed', label: 'Completed' },
];

export default function WorkoutsPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');

  const debouncedSearch = useDebounce(search, 350);

  const { data, loading, error, reload } = useApi(
    () =>
      workoutApi.list({
        type: type || undefined,
        status: status || undefined,
        search: debouncedSearch || undefined,
      }),
    [type, status, debouncedSearch]
  );

  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const workouts = data?.workouts || [];

  const completedCount = workouts.filter((workout) => workout.completed).length;
  const plannedCount = workouts.filter((workout) => !workout.completed).length;

  const totalMinutes = workouts.reduce(
    (total, workout) => total + (Number(workout.duration) || 0),
    0
  );

  const handleSave = async (payload) => {
    try {
      const result = editing?.id
        ? await workoutApi.update(editing.id, payload)
        : await workoutApi.create(payload);

      toast.success(result.message);
      announceAchievements(result.newAchievements);
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleToggle = async (workout) => {
    try {
      const result = await workoutApi.setCompleted(
        workout.id,
        !workout.completed
      );

      toast.success(result.message);
      announceAchievements(result.newAchievements);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;

    try {
      await workoutApi.remove(deleting.id);
      toast.success('Workout deleted');
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const clearFilters = () => {
    setSearch('');
    setType('');
    setStatus('');
  };

  const hasFilters = Boolean(search || type || status);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Workouts"
        description="Plan your exercise, track your progress, and celebrate every completed session."
        actions={
          <button
            className="btn-primary"
            onClick={() => setEditing({})}
          >
            <Plus size={17} />
            Create workout
          </button>
        }
      />

      {/* Workout summary */}
      <section aria-label="Workout summary">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-ink">Your progress</h2>
          <p className="text-sm text-ink-soft">
            A quick look at the workouts currently shown below.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="panel p-4">
            <div className="mb-3 flex items-center gap-2 text-ink-soft">
              <Dumbbell size={18} />
              <span className="text-sm">Total workouts</span>
            </div>
            <p className="text-2xl font-bold text-ink">
              {workouts.length}
            </p>
          </div>

          <div className="panel p-4">
            <div className="mb-3 flex items-center gap-2 text-ink-soft">
              <CheckCircle2 size={18} />
              <span className="text-sm">Completed</span>
            </div>
            <p className="text-2xl font-bold text-ink">
              {completedCount}
            </p>
          </div>

          <div className="panel p-4">
            <div className="mb-3 flex items-center gap-2 text-ink-soft">
              <CalendarDays size={18} />
              <span className="text-sm">Still planned</span>
            </div>
            <p className="text-2xl font-bold text-ink">
              {plannedCount}
            </p>
          </div>

          <div className="panel p-4">
            <div className="mb-3 flex items-center gap-2 text-ink-soft">
              <Clock size={18} />
              <span className="text-sm">Total duration</span>
            </div>
            <p className="text-2xl font-bold text-ink">
              {totalMinutes} min
            </p>
          </div>
        </div>
      </section>

      {/* Search and filters */}
      <section className="panel space-y-4 p-4">
        <div>
          <h2 className="font-bold text-ink">Find a workout</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Search by name or narrow your list using the filters.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <input
              className="input pl-9"
              placeholder="Search workout name..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search workouts"
            />
          </div>

          <select
            className="input lg:w-52"
            value={type}
            onChange={(event) => setType(event.target.value)}
            aria-label="Filter by workout type"
          >
            <option value="">Every workout type</option>
            {WORKOUT_TYPES.map((workoutType) => (
              <option key={workoutType.value} value={workoutType.value}>
                {workoutType.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatus(tab.value)}
              aria-pressed={status === tab.value}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                status === tab.value
                  ? 'bg-ink text-white'
                  : 'bg-mist text-ink-soft hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto px-3 py-2 text-sm font-semibold text-ink-soft hover:text-ink"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* Workout list */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-ink">
              Your workout list
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Mark sessions complete as you finish them.
            </p>
          </div>

          {!loading && !error && workouts.length > 0 && (
            <p className="text-sm text-ink-soft">
              {workouts.length} {workouts.length === 1 ? 'workout' : 'workouts'}
            </p>
          )}
        </div>

        {loading ? (
          <LoadingSpinner label="Loading your workouts..." />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : workouts.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title={hasFilters ? 'No matching workouts' : 'Your journey starts here'}
            message={
              hasFilters
                ? 'Try a different search or clear your filters to see more workouts.'
                : 'Create your first workout to start building your fitness routine.'
            }
            action={
              hasFilters ? (
                <button
                  className="btn-primary"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={() => setEditing({})}
                >
                  <Plus size={17} />
                  Create your first workout
                </button>
              )
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {workouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onToggleComplete={handleToggle}
                onEdit={setEditing}
                onDelete={setDeleting}
              />
            ))}
          </div>
        )}
      </section>

      {/* Create or edit workout */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit workout' : 'Create a workout'}
        size="xl"
      >
        {editing && (
          <WorkoutForm
            key={editing.id || 'new'}
            initial={editing.id ? editing : null}
            onSubmit={handleSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      {/* Confirm deletion */}
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete workout?"
        message={`"${deleting?.name}" and its exercises will be removed permanently.`}
      />
    </div>
  );
}