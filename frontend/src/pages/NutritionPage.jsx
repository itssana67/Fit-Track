// Nutrition tracker: pick a day, see totals vs targets, and manage that day's meals.
import { useState } from 'react';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import MealCard from '../components/MealCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorState from '../components/ErrorState.jsx';
import MealForm from '../components/forms/MealForm.jsx';
import useApi from '../hooks/useApi';
import { mealApi } from '../services/fittrackApi';
import { MEAL_TYPES } from '../utils/constants';
import { announceAchievements, getErrorMessage } from '../utils/errors';
import { formatDate, formatNumber, shiftDate, todayStr } from '../utils/format';

export default function NutritionPage() {
  const [date, setDate] = useState(todayStr());
  // Two requests for the chosen day: the meals themselves and the calculated totals
  const { data, loading, error, reload } = useApi(
    () => Promise.all([mealApi.list({ date }), mealApi.summary(date)]).then(([list, summary]) => ({ meals: list.meals, summary })),
    [date]
  );
  const [editing, setEditing] = useState(null); // null closed, { mealType } new, meal = edit
  const [deleting, setDeleting] = useState(null);

  const isToday = date === todayStr();

  const handleSave = async (payload) => {
    if (editing?.id) {
      await mealApi.update(editing.id, payload);
      toast.success('Meal updated');
    } else {
      const result = await mealApi.create(payload);
      toast.success('Meal added');
      announceAchievements(result.newAchievements);
    }
    setEditing(null);
    // If the meal was saved to another day, jump to that day so the user sees it
    if (payload.date && payload.date !== date) setDate(payload.date);
    else reload();
  };

  const handleDelete = async () => {
    try {
      await mealApi.remove(deleting.id);
      toast.success('Meal deleted');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const summary = data?.summary;
  const meals = data?.meals || [];

  return (
    <div>
      <PageHeader
        title="Nutrition"
        description="Log what you eat. Totals are compared with targets calculated from your profile."
        actions={<button className="btn-primary" onClick={() => setEditing({})}><Plus size={17} /> Add meal</button>}
      />

      {/* Day picker */}
      <div className="panel mb-5 flex items-center justify-between gap-2 p-2">
        <button className="btn-icon" onClick={() => setDate(shiftDate(date, -1))} aria-label="Previous day"><ChevronLeft size={19} /></button>
        <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-3">
          <p className="font-semibold">{isToday ? 'Today' : formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <input type="date" className="input w-auto py-1.5 text-sm" value={date} max={todayStr()} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Choose date" />
          {!isToday && <button className="btn-ghost btn-sm" onClick={() => setDate(todayStr())}>Back to today</button>}
        </div>
        <button className="btn-icon" onClick={() => setDate(shiftDate(date, 1))} disabled={isToday} aria-label="Next day"><ChevronRight size={19} /></button>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading meals" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Meals grouped by type */}
          <div className="space-y-4">
            {MEAL_TYPES.map((type) => {
              const list = meals.filter((meal) => meal.mealType === type.value);
              const group = summary.byType[type.value];
              return (
                <section key={type.value} className="panel p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold">{type.label}</h2>
                      <p className="text-xs text-ink-soft">{list.length ? `${formatNumber(group.calories)} kcal` : 'Nothing logged'}</p>
                    </div>
                    <button className="btn-ghost btn-sm" onClick={() => setEditing({ mealType: type.value })}><Plus size={15} /> Add</button>
                  </div>
                  {list.length > 0 && (
                    <div className="space-y-2">
                      {list.map((meal) => <MealCard key={meal.id} meal={meal} onEdit={setEditing} onDelete={setDeleting} />)}
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          {/* Daily summary */}
          <aside className="panel h-fit p-5 lg:sticky lg:top-6">
            <h2 className="text-base font-bold">Daily totals</h2>
            <p className="mt-3 font-display text-4xl font-bold">
              {formatNumber(summary.totals.calories)}
              <span className="ml-1 font-sans text-base font-medium text-ink-faint">/ {formatNumber(summary.targets.calories)} kcal</span>
            </p>
            <p className={`text-sm ${summary.remainingCalories < 0 ? 'text-rose-600' : 'text-ink-soft'}`}>
              {summary.remainingCalories >= 0
                ? `${formatNumber(summary.remainingCalories)} kcal left`
                : `${formatNumber(-summary.remainingCalories)} kcal over target`}
            </p>

            <div className="mt-5 space-y-4">
              <ProgressBar label="Calories" value={summary.totals.calories} max={summary.targets.calories} color="tide" detail={`${summary.percentages.calories}%`} />
              <ProgressBar label="Protein" value={summary.totals.protein} max={summary.targets.protein} color="fern" detail={`${formatNumber(summary.totals.protein)} / ${summary.targets.protein} g`} />
              <ProgressBar label="Carbohydrates" value={summary.totals.carbs} max={summary.targets.carbs} color="sun" detail={`${formatNumber(summary.totals.carbs)} / ${summary.targets.carbs} g`} />
              <ProgressBar label="Fats" value={summary.totals.fats} max={summary.targets.fats} color="ember" detail={`${formatNumber(summary.totals.fats)} / ${summary.targets.fats} g`} />
            </div>
            <p className="mt-5 text-xs leading-relaxed text-ink-faint">
              Targets come from your profile: calories from your TDEE and goal, protein by body weight, fats at 25% of calories and the rest as carbs.
            </p>
          </aside>
        </div>
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? 'Edit meal' : 'Add meal'}>
        {editing && (
          <MealForm
            key={editing.id || editing.mealType || 'new'}
            initial={editing.id ? editing : null}
            defaultDate={date}
            defaultType={editing.mealType}
            onSubmit={handleSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete meal?"
        message={`“${deleting?.foodName}” will be removed from this day.`}
      />
    </div>
  );
}
