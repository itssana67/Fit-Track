import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogIn, UserRound } from 'lucide-react';
import { TextInput } from '../components/FormControls.jsx';
import useAuth from '../hooks/useAuth';
import { getErrorMessage, getFieldErrors } from '../utils/errors';

const DEMO = {
  email: 'demo@fittrack.app',
  password: 'Demo@1234',
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const redirectTo = location.state?.from || '/dashboard';

  const submit = async (credentials) => {
    setSaving(true);
    setErrors({});
    setFormError('');

    try {
      const result = await login(credentials);
      toast.success(
        `Welcome back, ${result.user.name.split(' ')[0]}`
      );
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submit(form);
  };

  const useDemo = () => {
    setForm(DEMO);
    submit(DEMO);
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="text-3xl font-bold">Log in</h1>

      <p className="mt-2 text-ink-soft">
        New to FitTrack?{' '}
        <Link
          to="/register"
          className="font-semibold text-fern-600 hover:text-fern-700"
        >
          Create an account
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
        className="mt-6 space-y-4"
        noValidate
      >
        <TextInput
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
          error={errors.email}
          required
        />

        <TextInput
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={form.password}
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
          error={errors.password}
          required
        />

        <button
          type="submit"
          className="btn-primary w-full py-3"
          disabled={saving}
        >
          <LogIn size={18} />
          {saving ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      {/* Demo account section */}
      <div className="mt-6 rounded-xl border border-fern-200 bg-fern-50 p-5">
        <div className="flex items-center gap-2">
          <UserRound size={22} className="text-fern-700" />
          <h2 className="text-lg font-bold text-fern-800">
            Try FitTrack Demo
          </h2>
        </div>

        <p className="mt-2 text-sm text-ink-soft">
          Explore sample workouts, meals, goals and progress
          using the demo account.
        </p>

        <div className="mt-4 space-y-2 rounded-lg bg-white p-3 text-sm">
          <p>
            <span className="font-semibold">Email:</span>{' '}
            demo@fittrack.app
          </p>
          <p>
            <span className="font-semibold">Password:</span>{' '}
            Demo@1234
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary mt-4 w-full py-3"
          onClick={useDemo}
          disabled={saving}
        >
          <UserRound size={18} />
          {saving ? 'Logging in…' : 'Login with Demo Account'}
        </button>

        <p className="mt-3 text-xs text-ink-soft">
          The demo account must exist in your backend database.
          If it does not, run your backend seed script first.
        </p>
      </div>
    </div>
  );
}