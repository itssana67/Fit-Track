// Dashboard: every number and chart here comes from GET /api/dashboard,
// which the backend calculates from the user's MongoDB records.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Activity, Apple, CheckCircle2, Circle, Dumbbell, Flame, Gauge, Plus, Scale, Target, TrendingDown, TrendingUp, Utensils,
} from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import DashboardCard from '../components/DashboardCard.jsx';
import ProgressChart from '../components/ProgressChart.jsx';
import WeeklyBarChart from '../components/WeeklyBarChart.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorState from '../components/ErrorState.jsx';
import Modal from '../components/Modal.jsx';
import WorkoutForm from '../components/forms/WorkoutForm.jsx';
import MealForm from '../components/forms/MealForm.jsx';
import ProgressForm from '../components/forms/ProgressForm.jsx';
import GoalForm from '../components/forms/GoalForm.jsx';
import useApi from '../hooks/useApi';
import useAuth from '../hooks/useAuth';
import { dashboardApi, goalApi, mealApi, progressApi, workoutApi } from '../services/fittrackApi';
import { FITNESS_GOALS, WORKOUT_TYPES, labelOf } from '../utils/constants';
import { BMI_COLORS } from '../utils/fitness';
import { announceAchievements } from '../utils/errors';
import { formatDate, formatNumber, greeting, todayStr } from '../utils/format';

function ChartPanel({ title, subtitle, children }) {
  return (
    <section className="panel p-4 sm:p-5">
      <h2 className="text-base font-bold">{title}</h2>
      {subtitle && <p className="text-[13px] text-ink-soft">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const { data, loading, error, reload } = useApi(() => dashboardApi.get(todayStr()), []);
  const [modal, setModal] = useState(null); // 'workout' | 'meal' | 'weight' | 'goal'
  const [togglingId, setTogglingId] = useState(null);

  // The backend checks achievements on every dashboard load and tells us about new ones
  useEffect(() => {
    if (data?.newAchievements?.length) announceAchievements(data.newAchievements);
  }, [data]);

  const closeModal = () => setModal(null);

  // Each quick action saves through the API, then re-fetches the dashboard so the cards and charts update
  const afterSave = async (result, message, { refreshProfile = false } = {}) => {
    toast.success(message);
    announceAchievements(result?.newAchievements);
    closeModal();
    if (refreshProfile) await refreshUser();
    reload();
  };

  const saveWorkout = async (payload) => afterSave(await workoutApi.create(payload), 'Workout saved');
  const saveMeal = async (payload) => afterSave(await mealApi.create(payload), 'Meal added');
  const saveWeight = async (payload) => afterSave(await progressApi.create(payload), 'Weight updated', { refreshProfile: true });
  const saveGoal = async (payload) => afterSave(await goalApi.create(payload), 'Goal created', { refreshProfile: true });

  const toggleWorkout = async (workout) => {
    setTogglingId(workout.id);
    try {
      const result = await workoutApi.setCompleted(workout.id, !workout.completed);
      toast.success(result.message);
      announceAchievements(result.newAchievements);
      reload();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update the workout');
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) return <LoadingSpinner label="Loading your dashboard" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { stats, charts, activeGoal, recentWorkouts, profile } = data;
  const firstName = (data.user?.name || user?.name || '').split(' ')[0];
  const weightChange = Math.round((stats.currentWeight - stats.startWeight) * 10) / 10;
  const caloriePercent = stats.calorieTarget ? Math.round((stats.caloriesConsumedToday / stats.calorieTarget) * 100) : 0;

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description={`Goal: ${labelOf(FITNESS_GOALS, data.user.fitnessGoal)}. Here is where you stand today.`}
      />

      {/* Quick actions */}
      <div className="mb-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <button className="btn-primary" onClick={() => setModal('workout')}><Dumbbell size={17} /> Log workout</button>
        <button className="btn-secondary" onClick={() => setModal('meal')}><Utensils size={17} /> Add meal</button>
        <button className="btn-secondary" onClick={() => setModal('weight')}><Scale size={17} /> Update weight</button>
        <button className="btn-secondary" onClick={() => setModal('goal')}><Target size={17} /> Set goal</button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <DashboardCard
          icon={Scale}
          label="Current weight"
          value={formatNumber(stats.currentWeight, 1)}
          unit="kg"
          detail={
            weightChange === 0 ? 'No change since first entry' : (
              <span className="inline-flex items-center gap-1">
                {weightChange < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                {weightChange > 0 ? '+' : ''}{weightChange} kg since start
              </span>
            )
          }
        />
        <DashboardCard icon={Gauge} label="BMI" value={formatNumber(stats.bmi, 1)} tone="tide">
          <span className={`chip mt-1.5 ${BMI_COLORS[stats.bmiCategory] || ''}`}>{stats.bmiCategory}</span>
        </DashboardCard>
        <DashboardCard icon={Apple} label="Daily calorie target" value={formatNumber(stats.calorieTarget)} unit="kcal" tone="tide" detail={`TDEE ${formatNumber(profile.tdee)} kcal`} />
        <DashboardCard icon={Target} label="Current goal" value={labelOf(FITNESS_GOALS, data.user.fitnessGoal)} tone="ink" detail={activeGoal ? activeGoal.title : 'No active goal yet'} />

        <DashboardCard icon={Flame} label="Workout streak" value={stats.workoutStreak} unit={stats.workoutStreak === 1 ? 'day' : 'days'} tone="ember" detail={`Best: ${stats.longestStreak} days`} />
        <DashboardCard icon={CheckCircle2} label="Workouts completed" value={stats.workoutsCompleted} detail={`${stats.workoutsThisWeek} in the last 7 days`} />
        <DashboardCard icon={Utensils} label="Calories consumed today" value={formatNumber(stats.caloriesConsumedToday)} unit="kcal" tone="tide">
          <div className="mt-2"><ProgressBar value={stats.caloriesConsumedToday} max={stats.calorieTarget} size="sm" color="tide" /></div>
          <p className="mt-1 text-xs text-ink-soft">{caloriePercent}% of target, {stats.proteinToday} g protein</p>
        </DashboardCard>
        <DashboardCard icon={Activity} label="Calories burned today" value={formatNumber(stats.caloriesBurnedToday)} unit="kcal" tone="ember" detail="From completed workouts" />
      </div>

      {/* Goal progress */}
      <section className="panel mt-4 p-4 sm:p-5">
        {activeGoal ? (
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="md:w-1/3">
              <p className="text-[13px] font-medium text-ink-soft">Goal progress</p>
              <p className="font-display text-lg font-bold">{activeGoal.title}</p>
              <p className="text-[13px] text-ink-soft">Target date {formatDate(activeGoal.targetDate)}</p>
            </div>
            <div className="flex-1">
              <ProgressBar value={stats.goalProgress} label={`${stats.goalProgress}% complete`} detail={activeGoal.isWeightBased ? `${formatNumber(activeGoal.currentWeight, 1)} kg now, target ${formatNumber(activeGoal.targetWeight, 1)} kg` : 'Manual progress'} />
            </div>
            <Link to="/goals" className="btn-ghost btn-sm self-start md:self-center">All goals</Link>
          </div>
        ) : (
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-ink-soft">Set a goal to see your progress percentage here.</p>
            <button className="btn-secondary btn-sm" onClick={() => setModal('goal')}><Plus size={15} /> Set goal</button>
          </div>
        )}
      </section>

      {/* Charts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartPanel title="Weight progress" subtitle="Your last 30 weigh-ins">
          <ProgressChart data={charts.weightHistory} dataKey="weight" unit="kg" name="Weight" />
        </ChartPanel>
        <ChartPanel title="Weekly workouts" subtitle="Completed sessions, last 7 days">
          <WeeklyBarChart data={charts.week} dataKey="workouts" color="#1f9d6b" unit="" name="Workouts" height={260} />
        </ChartPanel>
        <ChartPanel title="Calories consumed" subtitle="Daily total vs your target">
          <WeeklyBarChart data={charts.week} dataKey="caloriesConsumed" color="#2f6fde" unit="kcal" name="Consumed" target={stats.calorieTarget} />
        </ChartPanel>
        <ChartPanel title="Calories burned" subtitle="From completed workouts">
          <WeeklyBarChart data={charts.week} dataKey="caloriesBurned" color="#e3772e" unit="kcal" name="Burned" />
        </ChartPanel>
      </div>

      {/* Recent workouts */}
      <section className="panel mt-4 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Recent workouts</h2>
          <Link to="/workouts" className="text-[13px] font-semibold text-fern-600 hover:text-fern-700">See all</Link>
        </div>
        {recentWorkouts.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">No workouts yet. Use “Log workout” above to add your first one.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {recentWorkouts.map((workout) => (
              <li key={workout.id} className="flex items-center gap-3 py-3">
                <button
                  className={workout.completed ? 'text-fern-500' : 'text-ink-faint hover:text-fern-500'}
                  onClick={() => toggleWorkout(workout)}
                  disabled={togglingId === workout.id}
                  aria-label={workout.completed ? 'Mark as planned' : 'Mark as completed'}
                >
                  {workout.completed ? <CheckCircle2 size={21} /> : <Circle size={21} />}
                </button>
                <div className="min-w-0 flex-1">
                  <Link to={`/workouts/${workout.id}`} className="block truncate font-medium hover:text-fern-700">{workout.name}</Link>
                  <p className="text-xs text-ink-soft">
                    {formatDate(workout.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {labelOf(WORKOUT_TYPES, workout.type)} · {workout.durationMin} min
                  </p>
                </div>
                <span className="text-sm font-semibold text-ink-soft">{workout.caloriesBurned} kcal</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Quick action modals */}
      <Modal open={modal === 'workout'} onClose={closeModal} title="Log workout" size="xl">
        <WorkoutForm onSubmit={saveWorkout} onCancel={closeModal} />
      </Modal>
      <Modal open={modal === 'meal'} onClose={closeModal} title="Add meal">
        <MealForm onSubmit={saveMeal} onCancel={closeModal} />
      </Modal>
      <Modal open={modal === 'weight'} onClose={closeModal} title="Update weight" description="Saved as a progress entry for the chosen date" size="sm">
        <ProgressForm weightOnly defaultWeight={stats.currentWeight} onSubmit={saveWeight} onCancel={closeModal} submitLabel="Save weight" />
      </Modal>
      <Modal open={modal === 'goal'} onClose={closeModal} title="Set a goal">
        <GoalForm onSubmit={saveGoal} onCancel={closeModal} />
      </Modal>
    </div>
  );
}
