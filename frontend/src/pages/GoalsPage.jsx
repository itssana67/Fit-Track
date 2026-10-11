// Fitness goals: create, edit, complete and delete. /goals?new=1 opens the form straight away.
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Target } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import GoalCard from '../components/GoalCard.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorState from '../components/ErrorState.jsx';
import EmptyState from '../components/EmptyState.jsx';
import GoalForm from '../components/forms/GoalForm.jsx';
import useApi from '../hooks/useApi';
import useAuth from '../hooks/useAuth';
import { goalApi } from '../services/fittrackApi';
import { GOAL_STATUSES } from '../utils/constants';
import { announceAchievements, getErrorMessage } from '../utils/errors';

export default function GoalsPage() {
  const { refreshUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState('');
  const { data, loading, error, reload } = useApi(() => goalApi.list(status ? { status } : undefined), [status]);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (params.get('new')) {
      setEditing({});
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const afterChange = async (result, message) => {
    toast.success(message);
    announceAchievements(result?.newAchievements);
    await refreshUser(); // an active goal also sets the profile's fitness goal
    reload();
  };

  const handleSave = async (payload) => {
    const result = editing?.id ? await goalApi.update(editing.id, payload) : await goalApi.create(payload);
    setEditing(null);
    await afterChange(result, result.message);
  };

  const handleComplete = async (goal) => {
    try {
      const result = await goalApi.update(goal.id, { status: 'COMPLETED' });
      await afterChange(result, 'Goal completed. Well done!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    try {
      await goalApi.remove(deleting.id);
      toast.success('Goal deleted');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const goals = data?.goals || [];
  const tabs = [{ value: '', label: 'All' }, ...GOAL_STATUSES];

  return (
    <div>
      <PageHeader
        title="Goals"
        description="Weight goals track progress from your latest weigh-in. Other goals use the progress you enter."
        actions={<button className="btn-primary" onClick={() => setEditing({})}><Plus size={17} /> New goal</button>}
      />

      <div className="mb-5 inline-flex rounded-xl bg-white p-1 ring-1 ring-line">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${status === tab.value ? 'bg-fern-500 text-white' : 'text-ink-soft hover:text-ink'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner label="Loading goals" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title={status ? 'No goals with this status' : 'No goals yet'}
          message="A clear target and date makes it easier to stay consistent."
          action={<button className="btn-primary" onClick={() => setEditing({})}><Plus size={17} /> New goal</button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onEdit={setEditing} onDelete={setDeleting} onComplete={handleComplete} />
          ))}
        </div>
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? 'Edit goal' : 'New goal'}>
        {editing && <GoalForm key={editing.id || 'new'} initial={editing.id ? editing : null} onSubmit={handleSave} onCancel={() => setEditing(null)} />}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete goal?"
        message={`“${deleting?.title}” will be removed.`}
      />
    </div>
  );
}
