// Public home page: hero, features, how it works, numbers and footer.
import { Link } from 'react-router-dom';
import { Activity, Apple, BarChart3, Calculator, Dumbbell, Library, Ruler, Sparkles, Target, Trophy } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Logo from '../components/Logo.jsx';
import useAuth from '../hooks/useAuth';

const FEATURES = [
  { icon: Dumbbell, title: 'Workout tracker', text: 'Plan sessions, log sets, reps and weight, then tick them off when you finish.' },
  { icon: Apple, title: 'Nutrition log', text: 'Record meals and see calories, protein, carbs and fats against your daily targets.' },
  { icon: Ruler, title: 'Body measurements', text: 'Weight, waist, chest, arm, hip and body fat, charted over time.' },
  { icon: Target, title: 'Goals', text: 'Set a target and a date. Weight goals update their progress on their own.' },
  { icon: Library, title: 'Exercise library', text: 'Search exercises by muscle and equipment, read the steps and add them to a workout.' },
  { icon: Sparkles, title: 'Recommendations', text: 'Suggestions from clear rules based on your goal, BMI and how often you train.' },
  { icon: Calculator, title: 'Fitness calculator', text: 'BMI, BMR, TDEE and a calorie target, with the formula behind each one.' },
  { icon: Trophy, title: 'Streaks and achievements', text: 'Keep a daily streak going and unlock badges as your log grows.' },
];

const STEPS = [
  { title: 'Create your profile', text: 'Add your age, height, weight, activity level and goal. FitTrack works out your calorie and protein targets.' },
  { title: 'Log as you go', text: 'Add workouts, meals and weigh-ins in a few taps. Everything is saved to your account.' },
  { title: 'Review your week', text: 'The dashboard charts your weight, sessions and calories so you can adjust what is not working.' },
];

const NUMBERS = [
  { value: '47', label: 'exercises in the built-in library' },
  { value: '8', label: 'muscle groups to filter by' },
  { value: '6', label: 'achievements to unlock' },
  { value: '4', label: 'calculators: BMI, BMR, TDEE, calories' },
];

// Illustration for the hero: a mock "this week" card drawn with plain divs
const WEEK = [
  { day: 'M', height: 62, done: true },
  { day: 'T', height: 40, done: true },
  { day: 'W', height: 78, done: true },
  { day: 'T', height: 0, done: false },
  { day: 'F', height: 55, done: true },
  { day: 'S', height: 88, done: true },
  { day: 'S', height: 30, done: false, today: true },
];

function WeekStrip() {
  return (
    <div className="panel w-full max-w-md p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-medium text-ink-soft">This week</p>
          <p className="font-display text-xl font-bold">5 sessions, 262 min</p>
        </div>
        <span className="chip bg-ember-50 text-ember-500">
          <Activity size={13} /> 5-day streak
        </span>
      </div>

      <div className="mt-5 flex h-32 items-end justify-between gap-2">
        {WEEK.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-24 w-full items-end rounded-lg bg-mist">
              <div
                className={`w-full rounded-lg ${d.today ? 'bg-tide-500/30' : d.done ? 'bg-fern-500' : ''}`}
                style={{ height: `${d.height}%` }}
              />
            </div>
            <span className={`text-xs font-semibold ${d.today ? 'text-tide-600' : 'text-ink-faint'}`}>{d.day}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <div className="flex justify-between text-[13px]">
          <span className="font-medium">Today: 1,640 of 2,230 kcal</span>
          <span className="text-ink-soft">74%</span>
        </div>
        <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-mist">
          <div className="bg-fern-500" style={{ width: '30%' }} />
          <div className="bg-tide-500" style={{ width: '32%' }} />
          <div className="bg-sun-500" style={{ width: '12%' }} />
        </div>
        <div className="mt-2 flex gap-4 text-xs text-ink-soft">
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-fern-500" />Protein</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-tide-500" />Carbs</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-sun-500" />Fats</span>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  // Logged-in users go straight to the dashboard; others see the login form with demo details filled in
  const exploreLink = user ? '/dashboard' : '/login?demo=1';

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 lg:grid-cols-2 lg:pt-20">
        <div>
          <h1 className="text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-[56px]">
            Every rep, meal and kilo, in one log.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            FitTrack is a personal fitness tracker for workouts, nutrition, body measurements and goals. It turns what you log into
            clear charts and simple, rule-based suggestions.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="btn-primary px-6 py-3 text-base">Get started</Link>
            <Link to={exploreLink} className="btn-secondary px-6 py-3 text-base">
              <BarChart3 size={18} /> Explore dashboard
            </Link>
          </div>
          {!user && <p className="mt-3 text-sm text-ink-faint">Explore uses the demo account, so you can look around first.</p>}
        </div>
        <div className="flex justify-center lg:justify-end">
          <WeekStrip />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 bg-mist py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-3xl font-bold sm:text-4xl">What you can track</h2>
          <p className="mt-3 max-w-2xl text-ink-soft">Each part saves to your account and feeds the dashboard.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="panel p-5 transition-colors hover:border-fern-200">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-fern-50 text-fern-600">
                  <Icon size={20} />
                </span>
                <h3 className="mt-4 text-base font-bold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-3xl font-bold sm:text-4xl">How it works</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="border-t-2 border-fern-500 pt-5">
                <span className="font-display text-4xl font-bold text-fern-200">{index + 1}</span>
                <h3 className="mt-2 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-ink-soft">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Numbers */}
      <section id="numbers" className="scroll-mt-20 bg-fern-700 py-16 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:grid-cols-2 lg:grid-cols-4">
          {NUMBERS.map((item) => (
            <div key={item.label}>
              <p className="font-display text-5xl font-bold">{item.value}</p>
              <p className="mt-1 text-fern-100">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to action */}
      <section className="py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-bold">Start your log today</h2>
            <p className="mt-2 text-ink-soft">It takes about a minute to set up your profile.</p>
          </div>
          <Link to="/register" className="btn-primary px-6 py-3 text-base">Create free account</Link>
        </div>
      </section>

      <footer className="border-t border-line py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <p>FitTrack: a full-stack project built with React, Express, Prisma and MongoDB.</p>
          <p>© {new Date().getFullYear()} FitTrack</p>
        </div>
      </footer>
    </div>
  );
}
