import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, Clock, Flame, Pencil, Trash2 } from 'lucide-react';
import { WORKOUT_TYPES, labelOf } from '../utils/constants';
import { formatDate } from '../utils/format';

const TYPE_COLORS = {
  STRENGTH: 'bg-fern-50 text-fern-700',
  CARDIO: 'bg-tide-50 text-tide-600',
  HIIT: 'bg-ember-50 text-ember-500',
  FLEXIBILITY: 'bg-mist text-ink-soft',
  SPORTS: 'bg-tide-50 text-tide-600',
  OTHER: 'bg-mist text-ink-soft',
};

export default function WorkoutCard({ workout, onToggleComplete, onEdit, onDelete }) {
  return (
    <article className="panel flex flex-col p-4 transition-colors hover:border-fern-200">
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggleComplete(workout)}
          className={`mt-0.5 shrink-0 ${workout.completed ? 'text-fern-500' : 'text-ink-faint hover:text-fern-500'}`}
          aria-label={workout.completed ? 'Mark as planned' : 'Mark as completed'}
          title={workout.completed ? 'Completed. Click to mark as planned' : 'Mark as completed'}
        >
          {workout.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
        </button>

        <div className="min-w-0 flex-1">
          <Link to={`/workouts/${workout.id}`} className="block truncate font-semibold hover:text-fern-700">
            {workout.name}
          </Link>
          <p className="text-[13px] text-ink-soft">{formatDate(workout.date, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
        </div>

        <span className={`chip shrink-0 ${TYPE_COLORS[workout.type]}`}>{labelOf(WORKOUT_TYPES, workout.type)}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-soft">
        <span className="inline-flex items-center gap-1"><Clock size={14} /> {workout.durationMin} min</span>
        <span className="inline-flex items-center gap-1"><Flame size={14} /> {workout.caloriesBurned} kcal</span>
        <span>{workout.exercises?.length || 0} exercises</span>
      </div>

      {workout.notes && <p className="mt-2 line-clamp-2 text-[13px] text-ink-soft">{workout.notes}</p>}

      <div className="mt-auto flex items-center justify-between pt-3">
        <Link to={`/workouts/${workout.id}`} className="text-[13px] font-semibold text-fern-600 hover:text-fern-700">
          View details
        </Link>
        <div className="flex">
          <button className="btn-icon" onClick={() => onEdit(workout)} aria-label={`Edit ${workout.name}`}><Pencil size={16} /></button>
          <button className="btn-icon hover:!bg-rose-50 hover:!text-rose-600" onClick={() => onDelete(workout)} aria-label={`Delete ${workout.name}`}><Trash2 size={16} /></button>
        </div>
      </div>
    </article>
  );
}
