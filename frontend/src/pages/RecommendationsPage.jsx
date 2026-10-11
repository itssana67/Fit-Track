// Personalised suggestions from GET /api/recommendations.
// The backend uses plain if/else rules (see recommendation.service.js). This is not machine learning.
import { useState } from 'react';
import { Apple, CheckCircle2, Dumbbell, Footprints, Info, RefreshCw, Sparkles } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorState from '../components/ErrorState.jsx';
import ExerciseCard from '../components/ExerciseCard.jsx';
import ExerciseDetailModal from '../components/ExerciseDetailModal.jsx';
import AddToWorkoutModal from '../components/AddToWorkoutModal.jsx';
import useApi from '../hooks/useApi';
import { recommendationApi } from '../services/fittrackApi';
import { ACTIVITY_LEVELS, FITNESS_GOALS, labelOf } from '../utils/constants';
import { formatNumber } from '../utils/format';

const CATEGORY_ICONS = { workout: Dumbbell, nutrition: Apple, habit: Footprints };
const PRIORITY_STYLES = {
  high: 'bg-rose-50 text-rose-600',
  medium: 'bg-ember-50 text-ember-500',
  low: 'bg-mist text-ink-soft',
};

export default function RecommendationsPage() {
  const { data, loading, error, reload } = useApi(() => recommendationApi.get(), []);
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(null);

  if (loading) return <LoadingSpinner label="Working out your suggestions" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { basis, recommendations, suggestedExercises } = data;
  const inputs = [
    { label: 'Goal', value: labelOf(FITNESS_GOALS, basis.fitnessGoal) },
    { label: 'Activity level', value: labelOf(ACTIVITY_LEVELS, basis.activityLevel) },
    { label: 'Weight', value: `${formatNumber(basis.weightKg, 1)} kg` },
    { label: 'BMI', value: `${formatNumber(basis.bmi, 1)} (${basis.bmiCategory})` },
    { label: 'Workouts, last 14 days', value: basis.workoutsLast14Days },
    { label: 'Per week', value: formatNumber(basis.workoutsPerWeek, 1) },
    { label: 'Total completed', value: basis.totalCompletedWorkouts },
    { label: 'Avg protein / target', value: `${basis.avgDailyProtein} / ${basis.proteinTarget} g` },
  ];

  return (
    <div>
      <PageHeader
        title="Recommendations"
        description="Suggestions based on your profile and recent activity."
        actions={<button className="btn-secondary" onClick={reload}><RefreshCw size={16} /> Refresh</button>}
      />

      <p className="mb-5 flex items-start gap-2 rounded-xl bg-tide-50 px-4 py-3 text-sm text-tide-600">
        <Info size={17} className="mt-0.5 shrink-0" />
        These come from a rule-based engine: fixed if/then rules written in the backend, not machine learning. Each card shows the rule that triggered it.
      </p>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3">
          {recommendations.length === 0 && (
            <p className="panel p-5 text-ink-soft">You are on track. Keep logging and check back later.</p>
          )}
          {recommendations.map((rec, index) => {
            const Icon = CATEGORY_ICONS[rec.category] || Sparkles;
            return (
              <article key={index} className="panel p-5">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fern-50 text-fern-600"><Icon size={19} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold">{rec.title}</h2>
                      <span className={`chip ${PRIORITY_STYLES[rec.priority]}`}>{rec.priority} priority</span>
                    </div>
                    <p className="mt-1 text-sm text-ink-soft"><span className="font-semibold text-ink">Why: </span>{rec.reason}</p>
                    {rec.actions?.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {rec.actions.map((action) => (
                          <li key={action} className="flex gap-2 text-sm">
                            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-fern-500" /> {action}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="panel h-fit p-5">
          <h2 className="text-base font-bold">What the rules looked at</h2>
          <dl className="mt-3 divide-y divide-line text-sm">
            {inputs.map((item) => (
              <div key={item.label} className="flex justify-between gap-3 py-2">
                <dt className="text-ink-soft">{item.label}</dt>
                <dd className="text-right font-semibold">{item.value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>

      {suggestedExercises?.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold">Suggested exercises</h2>
          <p className="mb-4 text-sm text-ink-soft">Picked from the library to match your goal and experience.</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {suggestedExercises.map((exercise) => (
              <ExerciseCard key={exercise.id} exercise={exercise} onOpen={setSelected} onAdd={(e) => { setSelected(null); setAdding(e); }} />
            ))}
          </div>
        </section>
      )}

      <ExerciseDetailModal exercise={selected} onClose={() => setSelected(null)} onAdd={(e) => { setSelected(null); setAdding(e); }} />
      {adding && <AddToWorkoutModal exercise={adding} onClose={() => setAdding(null)} />}
    </div>
  );
}
