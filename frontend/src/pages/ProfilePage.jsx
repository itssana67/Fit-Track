// Profile: edit personal details (saved to MongoDB via PUT /api/users/me) and change password.
import { useState } from 'react';
import toast from 'react-hot-toast';
import { KeyRound, Save } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import { SelectInput, TextInput } from '../components/FormControls.jsx';
import useAuth from '../hooks/useAuth';
import { userApi } from '../services/fittrackApi';
import { ACTIVITY_LEVELS, FITNESS_GOALS, GENDERS } from '../utils/constants';
import { BMI_COLORS } from '../utils/fitness';
import { getErrorMessage, getFieldErrors } from '../utils/errors';
import { formatDate, formatNumber } from '../utils/format';

const toForm = (user) => ({
  name: user.name,
  email: user.email,
  age: user.age,
  gender: user.gender,
  heightCm: user.heightCm,
  weightKg: user.weightKg,
  activityLevel: user.activityLevel,
  fitnessGoal: user.fitnessGoal,
});

function PasswordForm() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.newPassword !== form.confirm) {
      setErrors({ confirm: 'Passwords do not match' });
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      await userApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Password changed');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="panel p-5" noValidate>
      <h2 className="flex items-center gap-2 text-base font-bold"><KeyRound size={17} /> Change password</h2>
      <div className="mt-4 space-y-4">
        <TextInput label="Current password" type="password" autoComplete="current-password" value={form.currentPassword} onChange={set('currentPassword')} error={errors.currentPassword} />
        <TextInput label="New password" type="password" autoComplete="new-password" value={form.newPassword} onChange={set('newPassword')} error={errors.newPassword} hint="At least 8 characters, with a letter and a number" />
        <TextInput label="Confirm new password" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
      </div>
      <button className="btn-secondary mt-5 w-full" disabled={saving}>{saving ? 'Saving…' : 'Update password'}</button>
    </form>
  );
}

export default function ProfilePage() {
  const { user, profile, applySession } = useAuth();
  const [form, setForm] = useState(() => toForm(user));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const result = await userApi.updateProfile({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        age: Number(form.age),
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
      });
      applySession(result); // updates the sidebar name, BMI etc. everywhere
      setForm(toForm(result.user));
      toast.success('Profile saved');
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Profile" description="Your details drive the BMI, calorie and macro targets across FitTrack." />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form onSubmit={handleSubmit} className="panel p-5" noValidate>
          <h2 className="text-base font-bold">Personal details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TextInput label="Full name" value={form.name} onChange={set('name')} error={errors.name} />
            <TextInput label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} />
            <TextInput label="Age" type="number" value={form.age} onChange={set('age')} error={errors.age} suffix="yrs" />
            <SelectInput label="Gender" options={GENDERS} value={form.gender} onChange={set('gender')} error={errors.gender} />
            <TextInput label="Height" type="number" value={form.heightCm} onChange={set('heightCm')} error={errors.heightCm} suffix="cm" />
            <TextInput label="Weight" type="number" step="0.1" value={form.weightKg} onChange={set('weightKg')} error={errors.weightKg} suffix="kg" hint="Changing this also adds today's progress entry" />
            <SelectInput label="Activity level" options={ACTIVITY_LEVELS} value={form.activityLevel} onChange={set('activityLevel')} error={errors.activityLevel} />
            <SelectInput label="Fitness goal" options={FITNESS_GOALS} value={form.fitnessGoal} onChange={set('fitnessGoal')} error={errors.fitnessGoal} />
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => { setForm(toForm(user)); setErrors({}); }} disabled={saving}>Reset</button>
            <button type="submit" className="btn-primary" disabled={saving}><Save size={16} /> {saving ? 'Saving…' : 'Save changes'}</button>
          </div>
        </form>

        <div className="space-y-4">
          <section className="panel p-5">
            <h2 className="text-base font-bold">Your numbers</h2>
            <dl className="mt-3 divide-y divide-line text-sm">
              <div className="flex items-center justify-between py-2">
                <dt className="text-ink-soft">BMI</dt>
                <dd className="font-semibold">
                  {formatNumber(profile?.bmi, 1)} <span className={`chip ml-1 ${BMI_COLORS[profile?.bmiCategory] || ''}`}>{profile?.bmiCategory}</span>
                </dd>
              </div>
              <div className="flex justify-between py-2"><dt className="text-ink-soft">BMR</dt><dd className="font-semibold">{formatNumber(profile?.bmr)} kcal</dd></div>
              <div className="flex justify-between py-2"><dt className="text-ink-soft">TDEE</dt><dd className="font-semibold">{formatNumber(profile?.tdee)} kcal</dd></div>
              <div className="flex justify-between py-2"><dt className="text-ink-soft">Calorie target</dt><dd className="font-semibold">{formatNumber(profile?.calorieTarget)} kcal</dd></div>
              <div className="flex justify-between py-2">
                <dt className="text-ink-soft">Macros (P / C / F)</dt>
                <dd className="font-semibold">{profile?.macros?.protein} / {profile?.macros?.carbs} / {profile?.macros?.fats} g</dd>
              </div>
              <div className="flex justify-between py-2"><dt className="text-ink-soft">Member since</dt><dd className="font-semibold">{formatDate(user.createdAt)}</dd></div>
            </dl>
          </section>
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}
