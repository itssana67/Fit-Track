// Exercise library. Data flow: React -> GET /api/exercises (our Express server)
// -> external exercise API (key stays in backend/.env) -> back to React.
import { useState } from 'react';
import { Info, Library, Search, X } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import ExerciseCard from '../components/ExerciseCard.jsx';
import ExerciseDetailModal from '../components/ExerciseDetailModal.jsx';
import AddToWorkoutModal from '../components/AddToWorkoutModal.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorState from '../components/ErrorState.jsx';
import EmptyState from '../components/EmptyState.jsx';
import useApi from '../hooks/useApi';
import useDebounce from '../hooks/useDebounce';
import { exerciseApi } from '../services/fittrackApi';
import { DIFFICULTIES, EQUIPMENT_OPTIONS, MUSCLE_GROUPS } from '../utils/constants';

export default function ExerciseLibraryPage() {
  const [filters, setFilters] = useState({ search: '', muscle: '', equipment: '', difficulty: '' });
  const search = useDebounce(filters.search, 400);
  const { data, loading, error, reload } = useApi(
    () =>
      exerciseApi.list({
        search: search || undefined,
        muscle: filters.muscle || undefined,
        equipment: filters.equipment || undefined,
        difficulty: filters.difficulty || undefined,
      }),
    [search, filters.muscle, filters.equipment, filters.difficulty]
  );
  const [selected, setSelected] = useState(null); // exercise shown in the detail modal
  const [adding, setAdding] = useState(null); // exercise being added to a workout

  const set = (field) => (event) => setFilters({ ...filters, [field]: event.target.value });
  const hasFilters = Object.values(filters).some(Boolean);
  const exercises = data?.exercises || [];

  const openAdd = (exercise) => {
    setSelected(null);
    setAdding(exercise);
  };

  return (
    <div>
      <PageHeader title="Exercise library" description="Search exercises, read how to do them, and add them to a workout." />

      <div className="panel mb-4 grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_170px_170px_170px_auto]">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input className="input pl-9" placeholder="Search exercises, e.g. squat" value={filters.search} onChange={set('search')} aria-label="Search exercises" />
        </div>
        <select className="input" value={filters.muscle} onChange={set('muscle')} aria-label="Muscle group">
          <option value="">All muscle groups</option>
          {MUSCLE_GROUPS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select className="input" value={filters.equipment} onChange={set('equipment')} aria-label="Equipment">
          <option value="">All equipment</option>
          {EQUIPMENT_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <select className="input" value={filters.difficulty} onChange={set('difficulty')} aria-label="Difficulty">
          <option value="">All levels</option>
          {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
        {hasFilters && (
          <button className="btn-ghost" onClick={() => setFilters({ search: '', muscle: '', equipment: '', difficulty: '' })}>
            <X size={16} /> Clear
          </button>
        )}
      </div>

      {data?.notice && (
        <p className="mb-4 flex items-start gap-2 rounded-xl bg-tide-50 px-4 py-3 text-sm text-tide-600">
          <Info size={17} className="mt-0.5 shrink-0" /> {data.notice}
        </p>
      )}

      {loading ? (
        <LoadingSpinner label="Loading exercises" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : exercises.length === 0 ? (
        <EmptyState icon={Library} title="No exercises found" message="Try a different search term or remove a filter." />
      ) : (
        <>
          <p className="mb-3 text-sm text-ink-soft">
            {exercises.length} exercise{exercises.length === 1 ? '' : 's'} · source: {data.source === 'api' ? 'external exercise API' : 'built-in library'}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {exercises.map((exercise) => (
              <ExerciseCard key={exercise.id || exercise.name} exercise={exercise} onOpen={setSelected} onAdd={openAdd} />
            ))}
          </div>
        </>
      )}

      <ExerciseDetailModal exercise={selected} onClose={() => setSelected(null)} onAdd={openAdd} />
      {adding && <AddToWorkoutModal exercise={adding} onClose={() => setAdding(null)} />}
    </div>
  );
}
