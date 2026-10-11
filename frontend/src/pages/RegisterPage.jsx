// Registration form with profile fields for FitTrack.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { SelectInput, TextInput } from '../components/FormControls.jsx';
import useAuth from '../hooks/useAuth';
import { ACTIVITY_LEVELS, FITNESS_GOALS, GENDERS } from '../utils/constants';
import { getErrorMessage, getFieldErrors } from '../utils/errors';

const EMPTY = {
  name: '',
  email: '',
  password: '',
  age: '',
  gender: '',
  heightCm: '',
  weightKg: '',
  activityLevel: 'MODERATE',
  fitnessGoal: 'LOSE_WEIGHT',
};

function validate(form) {
  const errors = {};

  if (form.name.trim().length < 2) {
    errors.name = 'Enter your full name';
  }

  if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = 'Enter a valid email address';
  }

  if (
    form.password.length < 8 ||
    !/[A-Za-z]/.test(form.password) ||
    !/\d/.test(form.password)
  ) {
    errors.password =
      'Use at least 8 characters with a letter and a number';
  }

  if (!form.age) errors.age = 'Enter your age';
  if (!form.gender) errors.gender = 'Choose your gender';
  if (!form.heightCm) errors.heightCm = 'Enter your height';
  if (!form.weightKg) errors.weightKg = 'Enter your weight';

  return errors;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field) => (event) => {
    setForm((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    const clientErrors = validate(form);
    setErrors(clientErrors);

    if (Object.keys(clientErrors).length > 0) return;

    setSaving(true);

    try {
      const result = await register({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        age: Number(form.age),
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
      });

      toast.success(
        `Account created. Welcome, ${result.user.name.split(' ')[0]}!`
      );

      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">
        Create your account
      </h1>

      <p className="mt-2 text-ink-soft">
        Create your FitTrack account to get a personalized fitness plan.
        {' '}
        Already registered?{' '}
        <Link
          to="/login"
          className="font-semibold text-fern-600 hover:text-fern-700"
        >
          Log in
        </Link>
      </p>

      {formError && (
        <p
          className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600"
          role="alert"
        >
          {formError}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-5"
        noValidate
      >
        <fieldset className="space-y-4">
          <legend className="mb-3 text-sm font-bold text-ink">
            Account
          </legend>

          <TextInput
            label="Full name"
            placeholder="e.g. xxxx xxxx"
            autoComplete="name"
            value={form.name}
            onChange={set('name')}
            error={errors.name}
          />

          <TextInput
            label="Email"
            type="email"
            placeholder="xxxx@gmail.com"
            autoComplete="email"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
          />

          <TextInput
            label="Password"
            type="password"
            placeholder="Enter your password"
            autoComplete="new-password"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            hint="At least 8 characters, with a letter and a number"
          />
        </fieldset>

        <fieldset className="space-y-0">
          <legend className="mb-3 text-sm font-bold text-ink">
            About you
          </legend>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <TextInput
              label="Age"
              type="number"
              placeholder="e.g., 21"
              min="13"
              max="100"
              value={form.age}
              onChange={set('age')}
              error={errors.age}
            />

            <SelectInput
              label="Gender"
              options={GENDERS}
              placeholder="Select"
              value={form.gender}
              onChange={set('gender')}
              error={errors.gender}
            />

            <TextInput
              label="Height"
              type="number"
              placeholder="e.g., 170"
              suffix="cm"
              value={form.heightCm}
              onChange={set('heightCm')}
              error={errors.heightCm}
            />

            <TextInput
              label="Weight"
              type="number"
              placeholder="e.g., 65"
              step="0.1"
              suffix="kg"
              value={form.weightKg}
              onChange={set('weightKg')}
              error={errors.weightKg}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <SelectInput
              label="Activity level"
              options={ACTIVITY_LEVELS.map((activity) => ({
                value: activity.value,
                label: `${activity.label} (${activity.hint.toLowerCase()})`,
              }))}
              value={form.activityLevel}
              onChange={set('activityLevel')}
              error={errors.activityLevel}
            />

            <SelectInput
              label="Fitness goal"
              options={FITNESS_GOALS}
              value={form.fitnessGoal}
              onChange={set('fitnessGoal')}
              error={errors.fitnessGoal}
            />
          </div>
        </fieldset>

        <button
          type="submit"
          className="btn-primary w-full py-3"
          disabled={saving}
        >
          {saving ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </div>
  );
}