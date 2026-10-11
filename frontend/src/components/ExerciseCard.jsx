import { Plus } from 'lucide-react';
import { DIFFICULTIES, MUSCLE_GROUPS, labelOf } from '../utils/constants';

export const DIFFICULTY_STYLES = {
  BEGINNER: 'bg-fern-50 text-fern-700',
  INTERMEDIATE: 'bg-tide-50 text-tide-600',
  EXPERT: 'bg-ember-50 text-ember-500',
};

export default function ExerciseCard({ exercise, onOpen, onAdd }) {
  return (
    <article className="panel flex flex-col p-4 transition-colors hover:border-fern-200">
      <button onClick={() => onOpen(exercise)} className="text-left">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold leading-snug">{exercise.name}</h3>
          <span className={`chip shrink-0 ${DIFFICULTY_STYLES[exercise.difficulty]}`}>{labelOf(DIFFICULTIES, exercise.difficulty)}</span>
        </div>
        <dl className="mt-2 grid grid-cols-2 gap-2 text-[13px]">
          <div><dt className="text-ink-faint">Target muscle</dt><dd className="font-medium">{exercise.targetMuscle}</dd></div>
          <div><dt className="text-ink-faint">Equipment</dt><dd className="font-medium">{exercise.equipment}</dd></div>
        </dl>
        <p className="mt-3 line-clamp-3 text-[13px] text-ink-soft">{exercise.instructions}</p>
      </button>
      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="text-xs text-ink-faint">{labelOf(MUSCLE_GROUPS, exercise.muscleGroup)}</span>
        <button className="btn-secondary btn-sm" onClick={() => onAdd(exercise)}>
          <Plus size={15} /> Add to workout
        </button>
      </div>
    </article>
  );
}
