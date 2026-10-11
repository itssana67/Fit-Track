// Streaks and achievements. The backend decides what is unlocked (achievement.service.js).
import { CalendarCheck, Dumbbell, Flame, Trophy, Utensils } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import AchievementCard from '../components/AchievementCard.jsx';
import DashboardCard from '../components/DashboardCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorState from '../components/ErrorState.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import useApi from '../hooks/useApi';
import { achievementApi } from '../services/fittrackApi';

export default function AchievementsPage() {
  const { data, loading, error, reload } = useApi(() => achievementApi.list(), []);

  if (loading) return <LoadingSpinner label="Loading achievements" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { achievements, stats } = data;
  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <div>
      <PageHeader title="Streaks & achievements" description="A streak counts consecutive days with at least one completed workout." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <DashboardCard icon={Flame} label="Current streak" value={stats.currentStreak} unit="days" tone="ember" />
        <DashboardCard icon={CalendarCheck} label="Longest streak" value={stats.longestStreak} unit="days" tone="ember" />
        <DashboardCard icon={Dumbbell} label="Workouts completed" value={stats.completedWorkouts} />
        <DashboardCard icon={Utensils} label="Meals logged" value={stats.mealsLogged} tone="tide" />
      </div>

      <section className="panel mt-4 p-5">
        <div className="flex items-center gap-3">
          <Trophy className="text-ember-500" size={22} />
          <div className="flex-1">
            <ProgressBar value={unlocked} max={achievements.length} color="ember" label="Achievements unlocked" detail={`${unlocked} of ${achievements.length}`} />
          </div>
        </div>
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {achievements.map((achievement) => <AchievementCard key={achievement.id} achievement={achievement} />)}
      </div>
    </div>
  );
}
