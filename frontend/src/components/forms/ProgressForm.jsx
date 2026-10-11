import { useState } from 'react';
import { TextArea, TextInput } from '../FormControls.jsx';
import { toInputDate, todayStr, toNumberOrNull } from '../../utils/format';
import { getFieldErrors } from '../../utils/errors';

// weightOnly = true is the quick "Update weight" form on the dashboard
export default function ProgressForm({ initial, weightOnly = false, defaultWeight, onSubmit, onCancel, submitLabel = 'Save entry' }) {
  const [form, setForm] = useState({
    date: toInputDate(initial?.date) || todayStr(),
    weight: initial?.weight ?? defaultWeight ?? '',
    waist: initial?.waist ?? '',
    chest: initial?.chest ?? '',
    arm: initial?.arm ?? '',
    hip: initial?.hip ?? '',
    bodyFat: initial?.bodyFat ?? '',
    notes: initial?.notes || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    const payload = weightOnly
      ? { date: form.date, weight: toNumberOrNull(form.weight) }
      : {
          date: form.date,
          weight: toNumberOrNull(form.weight),
          waist: toNumberOrNull(form.waist),
          chest: toNumberOrNull(form.chest),
          arm: toNumberOrNull(form.arm),
          hip: toNumberOrNull(form.hip),
          bodyFat: toNumberOrNull(form.bodyFat),
          notes: form.notes.trim() || null,
        };
    try {
      await onSubmit(payload);
    } catch (err) {
      setErrors(getFieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Date" type="date" value={form.date} onChange={set('date')} error={errors.date} />
        <TextInput label="Weight" type="number" step="0.1" min="25" suffix="kg" value={form.weight} onChange={set('weight')} error={errors.weight} />
      </div>
      {!weightOnly && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <TextInput label="Waist" type="number" step="0.1" suffix="cm" value={form.waist} onChange={set('waist')} error={errors.waist} />
            <TextInput label="Chest" type="number" step="0.1" suffix="cm" value={form.chest} onChange={set('chest')} error={errors.chest} />
            <TextInput label="Arm" type="number" step="0.1" suffix="cm" value={form.arm} onChange={set('arm')} error={errors.arm} />
            <TextInput label="Hip" type="number" step="0.1" suffix="cm" value={form.hip} onChange={set('hip')} error={errors.hip} />
            <TextInput label="Body fat" type="number" step="0.1" suffix="%" value={form.bodyFat} onChange={set('bodyFat')} error={errors.bodyFat} />
          </div>
          <TextArea label="Notes" rows={2} value={form.notes} onChange={set('notes')} error={errors.notes} />
          <p className="text-xs text-ink-faint">Only weight is required. Leave other measurements empty if you did not take them.</p>
        </>
      )}
      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : submitLabel}</button>
      </div>
    </form>
  );
}
