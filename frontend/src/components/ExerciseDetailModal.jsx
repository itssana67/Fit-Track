import { Plus } from 'lucide-react';
import Modal from './Modal.jsx';
import { DIFFICULTY_STYLES } from './ExerciseCard.jsx';
import { DIFFICULTIES, MUSCLE_GROUPS, labelOf } from '../utils/constants';

export default function ExerciseDetailModal({ exercise, onClose, onAdd }) {
  if (!exercise) return null;
  // API instructions can be one long paragraph; split into sentences for readability
  const steps = exercise.instructions.split(/(?<=\.)\s+/).filter(Boolean);

  return (
    <Modal open={Boolean(exercise)} onClose={onClose} title={exercise.name} size="lg">
      <div className="flex flex-wrap gap-2">
        <span className={`chip ${DIFFICULTY_STYLES[exercise.difficulty]}`}>{labelOf(DIFFICULTIES, exercise.difficulty)}</span>
        <span className="chip bg-mist text-ink-soft">{labelOf(MUSCLE_GROUPS, exercise.muscleGroup)}</span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-mist p-4 text-sm">
        <div><dt className="text-ink-soft">Target muscle</dt><dd className="font-semibold">{exercise.targetMuscle}</dd></div>
        <div><dt className="text-ink-soft">Equipment</dt><dd className="font-semibold">{exercise.equipment}</dd></div>
      </dl>

      <h3 className="mt-5 text-base font-bold">How to do it</h3>
      <ol className="mt-2 space-y-2">
        {steps.map((step, index) => (
          <li key={index} className="flex gap-3 text-[14px] leading-relaxed text-ink-soft">
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-fern-50 text-xs font-bold text-fern-700">{index + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <p className="mt-4 text-xs text-ink-faint">
        Source: {exercise.source === 'api' ? 'API Ninjas exercise database' : 'FitTrack built-in library'}
      </p>

      <div className="mt-5 flex justify-end gap-2">
        <button className="btn-secondary" onClick={onClose}>Close</button>
        <button className="btn-primary" onClick={() => onAdd(exercise)}><Plus size={16} /> Add to workout</button>
      </div>
    </Modal>
  );
}
