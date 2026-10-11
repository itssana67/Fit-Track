import { Dumbbell, Flame, Medal, Trophy, Utensils, Target, Lock } from 'lucide-react';
import ProgressBar from './ProgressBar.jsx';
import { formatDate } from '../utils/format';

// Backend stores an icon name; this maps it to a Lucide icon component
const ICONS = { dumbbell: Dumbbell, flame: Flame, medal: Medal, trophy: Trophy, utensils: Utensils, target: Target };

export default function AchievementCard({ achievement }) {
  const Icon = ICONS[achievement.icon] || Trophy;
  const { unlocked } = achievement;

  return (
    <article className={`panel p-5 ${unlocked ? '' : 'bg-white/60'}`}>
      <div className="flex items-center gap-4">
        <span
          className={`relative inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
            unlocked ? 'bg-ember-50 text-ember-500' : 'bg-mist text-ink-faint'
          }`}
        >
          <Icon size={26} />
          {!unlocked && (
            <span className="absolute -bottom-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-line text-ink-soft">
              <Lock size={11} />
            </span>
          )}
        </span>
        <div className="min-w-0">
          <h3 className={`text-base font-bold ${unlocked ? '' : 'text-ink-soft'}`}>{achievement.title}</h3>
          <p className="text-sm text-ink-soft">{achievement.description}</p>
        </div>
      </div>
      <div className="mt-4">
        {unlocked ? (
          <p className="text-[13px] font-medium text-fern-700">Unlocked on {formatDate(achievement.unlockedAt)}</p>
        ) : (
          <ProgressBar value={achievement.current} max={achievement.target} size="sm" color="ember" detail={`${achievement.current} / ${achievement.target}`} label="Progress" />
        )}
      </div>
    </article>
  );
}
