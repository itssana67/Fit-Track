// Fitness calculator: BMI, BMR, TDEE and a goal-based calorie target.
// Pre-filled from the profile; results update live as you type.
// The formulas live in utils/fitness.js and match the backend exactly.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { SelectInput, TextInput } from '../components/FormControls.jsx';
import useAuth from '../hooks/useAuth';
import { ACTIVITY_LEVELS, FITNESS_GOALS, GENDERS, labelOf } from '../utils/constants';
import {
  ACTIVITY_MULTIPLIERS, BMI_COLORS, GOAL_CALORIE_ADJUSTMENT, bmiCategory, calculateBMI, calculateBMR, calculateTDEE, calorieTarget, macroTargets,
} from '../utils/fitness';
import { formatNumber } from '../utils/format';

const BMI_SCALE = [
  { label: 'Underweight', range: 'below 18.5', color: 'bg-tide-500', from: 0, to: 18.5 },
  { label: 'Normal', range: '18.5 – 24.9', color: 'bg-fern-500', from: 18.5, to: 25 },
  { label: 'Overweight', range: '25 – 29.9', color: 'bg-ember-500', from: 25, to: 30 },
  { label: 'Obese', range: '30 and above', color: 'bg-rose-500', from: 30, to: 40 },
];

function ResultCard({ title, value, unit, children }) {
  return (
    <section className="panel p-5">
      <p className="text-[13px] font-semibold text-ink-soft">{title}</p>
      <p className="mt-1 font-display text-3xl font-bold">
        {value}
        {unit && <span className="ml-1 font-sans text-base font-medium text-ink-faint">{unit}</span>}
      </p>
      <div className="mt-3 text-sm leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}

export default function CalculatorPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    age: user?.age ?? 25,
    gender: user?.gender ?? 'MALE',
    heightCm: user?.heightCm ?? 170,
    weightKg: user?.weightKg ?? 70,
    activityLevel: user?.activityLevel ?? 'MODERATE',
    fitnessGoal: user?.fitnessGoal ?? 'MAINTAIN_WEIGHT',
  });
  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const values = {
    age: Number(form.age),
    heightCm: Number(form.heightCm),
    weightKg: Number(form.weightKg),
    gender: form.gender,
  };
  const valid = values.age >= 13 && values.age <= 100 && values.heightCm >= 100 && values.heightCm <= 250 && values.weightKg >= 25 && values.weightKg <= 300;

  const bmi = valid ? calculateBMI(values.weightKg, values.heightCm) : null;
  const category = bmiCategory(bmi);
  const bmr = valid ? calculateBMR(values) : null;
  const tdee = valid ? calculateTDEE(bmr, form.activityLevel) : null;
  const target = valid ? calorieTarget(tdee, form.fitnessGoal) : null;
  const macros = valid ? macroTargets(target, values.weightKg, form.fitnessGoal) : null;
  const adjustment = GOAL_CALORIE_ADJUSTMENT[form.fitnessGoal];
  const markerLeft = bmi ? Math.min(100, Math.max(0, (bmi / 40) * 100)) : 0;
  const genderConstant = form.gender === 'MALE' ? '+ 5' : form.gender === 'FEMALE' ? '− 161' : '− 78 (average of both)';

  return (
    <div>
      <PageHeader title="Fitness calculator" description="Change any value to see how it affects your numbers. Your saved profile is not changed here." />

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="panel h-fit p-5">
          <h2 className="mb-4 text-base font-bold">Your details</h2>
          <div className="grid grid-cols-2 gap-4">
            <TextInput label="Age" type="number" value={form.age} onChange={set('age')} suffix="yrs" />
            <SelectInput label="Gender" options={GENDERS} value={form.gender} onChange={set('gender')} />
            <TextInput label="Height" type="number" value={form.heightCm} onChange={set('heightCm')} suffix="cm" />
            <TextInput label="Weight" type="number" step="0.1" value={form.weightKg} onChange={set('weightKg')} suffix="kg" />
          </div>
          <SelectInput className="mt-4" label="Activity level" options={ACTIVITY_LEVELS} value={form.activityLevel} onChange={set('activityLevel')}
            hint={ACTIVITY_LEVELS.find((a) => a.value === form.activityLevel)?.hint} />
          <SelectInput className="mt-4" label="Goal" options={FITNESS_GOALS} value={form.fitnessGoal} onChange={set('fitnessGoal')} />
          {!valid && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-600">Use age 13–100, height 100–250 cm and weight 25–300 kg.</p>}
          <p className="mt-4 text-xs text-ink-faint">
            To save new details, update your <Link to="/profile" className="font-semibold text-fern-600">profile</Link>.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <ResultCard title="Body Mass Index (BMI)" value={bmi ? formatNumber(bmi, 1) : '—'}>
            {category && <span className={`chip mb-3 ${BMI_COLORS[category]}`}>{category}</span>}
            {/* Coloured BMI scale with a marker at the user's value */}
            <div className="relative mt-1">
              <div className="flex h-2.5 overflow-hidden rounded-full">
                {BMI_SCALE.map((band) => <div key={band.label} className={band.color} style={{ width: `${((band.to - band.from) / 40) * 100}%` }} />)}
              </div>
              {bmi && <div className="absolute -top-1 h-4.5 w-1 rounded bg-ink" style={{ left: `calc(${markerLeft}% - 2px)` }} />}
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-1 text-xs">
              {BMI_SCALE.map((band) => (
                <li key={band.label} className={category === band.label ? 'font-bold text-ink' : ''}>
                  <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${band.color}`} />{band.label}: {band.range}
                </li>
              ))}
            </ul>
            <p className="mt-3"><strong className="text-ink">Formula:</strong> weight (kg) ÷ height (m)². BMI is a quick screening number; it does not tell muscle from fat.</p>
          </ResultCard>

          <ResultCard title="Basal Metabolic Rate (BMR)" value={bmr ? formatNumber(bmr) : '—'} unit="kcal/day">
            <p>Energy your body uses at complete rest: breathing, circulation, keeping warm.</p>
            <p className="mt-2"><strong className="text-ink">Mifflin-St Jeor:</strong> 10 × weight + 6.25 × height − 5 × age {genderConstant}</p>
            {valid && <p className="mt-2 rounded-lg bg-mist p-2 font-mono text-xs">10 × {values.weightKg} + 6.25 × {values.heightCm} − 5 × {values.age} {genderConstant.split(' (')[0]} = {bmr}</p>}
          </ResultCard>

          <ResultCard title="Total Daily Energy Expenditure (TDEE)" value={tdee ? formatNumber(tdee) : '—'} unit="kcal/day">
            <p>Calories you burn on a normal day, including activity. Eating this much keeps your weight steady.</p>
            <p className="mt-2"><strong className="text-ink">Formula:</strong> BMR × activity multiplier ({labelOf(ACTIVITY_LEVELS, form.activityLevel)} = {ACTIVITY_MULTIPLIERS[form.activityLevel]})</p>
            {valid && <p className="mt-2 rounded-lg bg-mist p-2 font-mono text-xs">{bmr} × {ACTIVITY_MULTIPLIERS[form.activityLevel]} = {tdee}</p>}
          </ResultCard>

          <ResultCard title="Your daily calorie target" value={target ? formatNumber(target) : '—'} unit="kcal/day">
            <p>
              For “{labelOf(FITNESS_GOALS, form.fitnessGoal)}” we {adjustment === 0 ? 'keep calories at your TDEE' : adjustment < 0 ? `subtract ${-adjustment} kcal (about 0.5 kg loss a week)` : `add ${adjustment} kcal to support muscle growth`}. The target never goes below 1,200 kcal.
            </p>
            {macros && (
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-fern-50 p-2"><p className="text-xs">Protein</p><p className="font-bold text-ink">{macros.protein} g</p></div>
                <div className="rounded-lg bg-tide-50 p-2"><p className="text-xs">Carbs</p><p className="font-bold text-ink">{macros.carbs} g</p></div>
                <div className="rounded-lg bg-ember-50 p-2"><p className="text-xs">Fats</p><p className="font-bold text-ink">{macros.fats} g</p></div>
              </div>
            )}
          </ResultCard>
        </div>
      </div>

      <p className="mt-6 text-xs text-ink-faint">These are estimates for general fitness tracking, not medical advice.</p>
    </div>
  );
}
