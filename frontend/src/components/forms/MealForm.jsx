import { useState } from 'react';
import { SelectInput, TextInput } from '../FormControls.jsx';
import { MEAL_TYPES } from '../../utils/constants';
import { FOOD_DATABASE } from '../../utils/foodDatabase';
import { toInputDate, todayStr } from '../../utils/format';
import { getFieldErrors } from '../../utils/errors';

export default function MealForm({
  initial,
  defaultDate,
  defaultType,
  onSubmit,
  onCancel,
  submitLabel = 'Save meal',
}) {
  const [form, setForm] = useState({
    mealType: initial?.mealType || defaultType || 'BREAKFAST',
    foodName: initial?.foodName || '',
    calories: initial?.calories ?? '',
    protein: initial?.protein ?? '',
    carbs: initial?.carbs ?? '',
    fats: initial?.fats ?? '',
    date: toInputDate(initial?.date) || defaultDate || todayStr(),
  });

  const [quantity, setQuantity] = useState(1);
  const [selectedFood, setSelectedFood] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (field) => (event) =>
    setForm((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));

  const chooseFood = (event) => {
    const food = FOOD_DATABASE.find(
      (item) => item.name === event.target.value
    );

    setSelectedFood(food || null);
    setQuantity(1);

    if (food) {
      setForm((previous) => ({
        ...previous,
        foodName: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats,
      }));
    }
  };

  const updateQuantity = (event) => {
    const value = Math.max(0.1, Number(event.target.value) || 0.1);
    setQuantity(value);

    if (selectedFood) {
      setForm((previous) => ({
        ...previous,
        calories: Math.round(selectedFood.calories * value),
        protein: Number((selectedFood.protein * value).toFixed(1)),
        carbs: Number((selectedFood.carbs * value).toFixed(1)),
        fats: Number((selectedFood.fats * value).toFixed(1)),
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      await onSubmit({
        ...form,
        calories: Number(form.calories) || 0,
        protein: Number(form.protein) || 0,
        carbs: Number(form.carbs) || 0,
        fats: Number(form.fats) || 0,
      });
    } catch (err) {
      setErrors(getFieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectInput
          label="Meal"
          value={form.mealType}
          onChange={set('mealType')}
          options={MEAL_TYPES}
          error={errors.mealType}
        />
        <TextInput
          label="Date"
          type="date"
          value={form.date}
          onChange={set('date')}
          error={errors.date}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Search and select food
        </label>
        <input
          type="text"
          list="fittrack-food-options"
          className="input w-full"
          placeholder="Choose a food or enter a food name"
          value={form.foodName}
          onChange={(event) => {
            const value = event.target.value;
            const food = FOOD_DATABASE.find(
              (item) => item.name.toLowerCase() === value.trim().toLowerCase()
            );

            setSelectedFood(food || null);
            setQuantity(1);

            setForm((previous) => ({
              ...previous,
              foodName: value,
              ...(food
                ? {
                    calories: food.calories,
                    protein: food.protein,
                    carbs: food.carbs,
                    fats: food.fats,
                  }
                : {}),
            }));
          }}
          required
        />
        <datalist id="fittrack-food-options">
          {FOOD_DATABASE.map((food) => (
            <option key={food.name} value={food.name} />
          ))}
        </datalist>
        <p className="mt-1 text-xs text-ink-soft">
          Nutrition is estimated from the built-in food database.
          Unlisted foods can still be entered manually below.
        </p>
      </div>

      {selectedFood && (
        <div className="rounded-lg border border-line p-3">
          <label className="mb-1 block text-sm font-medium">
            Quantity ({selectedFood.unit})
          </label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={quantity}
            onChange={updateQuantity}
            className="input w-full"
          />
        </div>
      )}

      <div>
        <TextInput
          label="Calories"
          type="number"
          min="0"
          suffix="kcal"
          value={form.calories}
          onChange={set('calories')}
          error={errors.calories}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <TextInput
          label="Protein"
          type="number"
          min="0"
          step="0.1"
          suffix="g"
          value={form.protein}
          onChange={set('protein')}
          error={errors.protein}
        />
        <TextInput
          label="Carbs"
          type="number"
          min="0"
          step="0.1"
          suffix="g"
          value={form.carbs}
          onChange={set('carbs')}
          error={errors.carbs}
        />
        <TextInput
          label="Fats"
          type="number"
          min="0"
          step="0.1"
          suffix="g"
          value={form.fats}
          onChange={set('fats')}
          error={errors.fats}
        />
      </div>

      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={saving}
        >
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}