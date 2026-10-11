import { useState } from 'react';
import { SelectInput, TextInput } from '../FormControls.jsx';
import { FITNESS_GOALS, GOAL_STATUSES } from '../../utils/constants';
import { shiftDate, toInputDate, todayStr, toNumberOrNull } from '../../utils/format';
import { getFieldErrors } from '../../utils/errors';

const WEIGHT_GOALS = ['LOSE_WEIGHT', 'GAIN_MUSCLE', 'MAINTAIN_WEIGHT'];
const TITLE_HINTS = {
  LOSE_WEIGHT: 'Reach 70 kg',
  GAIN_MUSCLE: 'Gain 3 kg of muscle',
  MAINTAIN_WEIGHT: 'Stay within 1 kg of my weight',
  IMPROVE_ENDURANCE: 'Run 10 km without stopping',
  INCREASE_STRENGTH: 'Bench press my body weight',
};

export default function GoalForm({ initial, onSubmit, onCancel, submitLabel = 'Save goal' }) {
  const [form, setForm] = useState({
    goalType: initial?.goalType || 'LOSE_WEIGHT',
    title: initial?.title || '',
    targetWeight: initial?.targetWeight ?? '',
    targetDate: toInputDate(initial?.targetDate) || shiftDate(todayStr(), 90),
    currentProgress: initial?.currentProgress ?? 0,
    status: initial?.status || 'ACTIVE',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const usesWeight = WEIGHT_GOALS.includes(form.goalType);
  // For weight goals with a target weight, progress is calculated automatically
  const manualProgress = !(usesWeight && form.targetWeight !== '');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await onSubmit({
        ...form,
        targetWeight: usesWeight ? toNumberOrNull(form.targetWeight) : null,
        currentProgress: Number(form.currentProgress) || 0,
      });
    } catch (err) {
      setErrors(getFieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <SelectInput label="Goal type" value={form.goalType} onChange={set('goalType')} options={FITNESS_GOALS} error={errors.goalType} />
      <TextInput label="Goal" placeholder={TITLE_HINTS[form.goalType]} value={form.title} onChange={set('title')} error={errors.title} />
      <div className="grid gap-4 sm:grid-cols-2">
        {usesWeight && (
          <TextInput label="Target weight" type="number" step="0.1" suffix="kg" value={form.targetWeight} onChange={set('targetWeight')} error={errors.targetWeight} hint="Progress is then tracked from your weight entries" />
        )}
        <TextInput label="Target date" type="date" value={form.targetDate} onChange={set('targetDate')} error={errors.targetDate} />
        <SelectInput label="Status" value={form.status} onChange={set('status')} options={GOAL_STATUSES} error={errors.status} />
      </div>
      {manualProgress && (
        <div>
          <label className="label" htmlFor="goal-progress">Current progress: {form.currentProgress}%</label>
          <input id="goal-progress" type="range" min="0" max="100" step="5" value={form.currentProgress} onChange={set('currentProgress')} className="w-full accent-tide-500" />
        </div>
      )}
      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : submitLabel}</button>
      </div>
    </form>
  );
}
