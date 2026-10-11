import { CalendarDays, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import ProgressBar from './ProgressBar.jsx';
import { FITNESS_GOALS, GOAL_STATUSES, labelOf } from '../utils/constants';
import { daysUntil, formatDate, formatNumber } from '../utils/format';

const STATUS_STYLES = {
  ACTIVE: 'bg-tide-50 text-tide-600',
  COMPLETED: 'bg-fern-50 text-fern-700',
  PAUSED: 'bg-mist text-ink-soft',
};

export default function GoalCard({ goal, onEdit, onDelete, onComplete }) {
  const remaining = daysUntil(goal.targetDate);
  const dateText =
    goal.status === 'COMPLETED'
      ? `Completed ${formatDate(goal.completedAt || goal.updatedAt)}`
      : remaining >= 0
        ? `${remaining} day${remaining === 1 ? '' : 's'} left`
        : `${Math.abs(remaining)} days past target date`;

  return (
    <article className="panel flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink-soft">{labelOf(FITNESS_GOALS, goal.goalType)}</p>
          <h3 className="mt-0.5 text-lg font-bold leading-snug">{goal.title}</h3>
        </div>
        <span className={`chip shrink-0 ${STATUS_STYLES[goal.status]}`}>{labelOf(GOAL_STATUSES, goal.status)}</span>
      </div>

      {goal.isWeightBased && (
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-mist p-3 text-center text-sm">
          <div><p className="text-xs text-ink-soft">Start</p><p className="font-semibold">{formatNumber(goal.startWeight, 1)} kg</p></div>
          <div><p className="text-xs text-ink-soft">Now</p><p className="font-semibold">{formatNumber(goal.currentWeight, 1)} kg</p></div>
          <div><p className="text-xs text-ink-soft">Target</p><p className="font-semibold">{formatNumber(goal.targetWeight, 1)} kg</p></div>
        </div>
      )}

      <div className="mt-4">
        <ProgressBar value={goal.progress} label="Progress" detail={`${goal.progress}%`} color={goal.status === 'COMPLETED' ? 'fern' : 'tide'} />
        <p className="mt-2 text-xs text-ink-faint">
          {goal.isWeightBased ? 'Calculated from your latest weight entry' : 'Updated manually when you edit the goal'}
        </p>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
        <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft">
          <CalendarDays size={14} /> {dateText}
        </span>
        <div className="flex items-center">
          {goal.status !== 'COMPLETED' && (
            <button className="btn-ghost btn-sm text-fern-600" onClick={() => onComplete(goal)}>
              <CheckCircle2 size={15} /> Mark complete
            </button>
          )}
          <button className="btn-icon" onClick={() => onEdit(goal)} aria-label="Edit goal"><Pencil size={16} /></button>
          <button className="btn-icon hover:!bg-rose-50 hover:!text-rose-600" onClick={() => onDelete(goal)} aria-label="Delete goal"><Trash2 size={16} /></button>
        </div>
      </div>
    </article>
  );
}
