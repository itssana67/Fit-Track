import { Pencil, Trash2 } from 'lucide-react';

export default function MealCard({ meal, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white px-3.5 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{meal.foodName}</p>
        <p className="text-xs text-ink-soft">
          P {meal.protein} g <span className="text-line">|</span> C {meal.carbs} g <span className="text-line">|</span> F {meal.fats} g
        </p>
      </div>
      <p className="shrink-0 font-display text-lg font-semibold">
        {meal.calories}
        <span className="ml-0.5 font-sans text-xs font-medium text-ink-faint">kcal</span>
      </p>
      <div className="flex shrink-0">
        <button className="btn-icon" onClick={() => onEdit(meal)} aria-label={`Edit ${meal.foodName}`}><Pencil size={15} /></button>
        <button className="btn-icon hover:!bg-rose-50 hover:!text-rose-600" onClick={() => onDelete(meal)} aria-label={`Delete ${meal.foodName}`}><Trash2 size={15} /></button>
      </div>
    </div>
  );
}
