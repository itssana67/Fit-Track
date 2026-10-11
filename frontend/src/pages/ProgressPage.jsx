// Progress tracker: body measurements over time, as a chart and a table.
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Plus, Ruler, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import ProgressChart from '../components/ProgressChart.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorState from '../components/ErrorState.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ProgressForm from '../components/forms/ProgressForm.jsx';
import useApi from '../hooks/useApi';
import useAuth from '../hooks/useAuth';
import { progressApi } from '../services/fittrackApi';
import { getErrorMessage } from '../utils/errors';
import { formatDate, formatNumber } from '../utils/format';

const METRICS = [
  { key: 'weight', label: 'Weight', unit: 'kg', color: '#1f9d6b' },
  { key: 'waist', label: 'Waist', unit: 'cm', color: '#2f6fde' },
  { key: 'chest', label: 'Chest', unit: 'cm', color: '#2f6fde' },
  { key: 'arm', label: 'Arm', unit: 'cm', color: '#e3772e' },
  { key: 'hip', label: 'Hip', unit: 'cm', color: '#2f6fde' },
  { key: 'bodyFat', label: 'Body fat', unit: '%', color: '#d64545' },
];

// First and latest recorded value of a metric, for the change summary
function change(entries, key) {
  const values = entries.filter((e) => e[key] !== null && e[key] !== undefined);
  if (values.length === 0) return null;
  const first = values[0][key];
  const latest = values[values.length - 1][key];
  return { first, latest, diff: Math.round((latest - first) * 10) / 10 };
}

export default function ProgressPage() {
  const { refreshUser } = useAuth();
  const { data, loading, error, reload } = useApi(() => progressApi.list(), []);
  const [metric, setMetric] = useState('weight');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const entries = data?.entries || [];
  const active = METRICS.find((m) => m.key === metric);
  // Chart needs YYYY-MM-DD strings on the x axis
  const chartData = entries.map((e) => ({ ...e, date: e.date.slice(0, 10) }));

  const handleSave = async (payload) => {
    const result = editing?.id ? await progressApi.update(editing.id, payload) : await progressApi.create(payload);
    toast.success(result.message);
    setEditing(null);
    await refreshUser(); // the latest weight entry is also the profile weight
    reload();
  };

  const handleDelete = async () => {
    try {
      await progressApi.remove(deleting.id);
      toast.success('Entry deleted');
      await refreshUser();
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <LoadingSpinner label="Loading progress" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const latest = entries[entries.length - 1];

  return (
    <div>
      <PageHeader
        title="Progress"
        description="Measure the same way each time (same time of day, same spot) for the most useful trend."
        actions={<button className="btn-primary" onClick={() => setEditing({})}><Plus size={17} /> New entry</button>}
      />

      {entries.length === 0 ? (
        <EmptyState icon={Ruler} title="No measurements yet" message="Add your first entry to start the chart." />
      ) : (
        <>
          {/* Summary tiles (also act as chart switches) */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {METRICS.map((m) => {
              const c = change(entries, m.key);
              const selected = metric === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setMetric(m.key)}
                  className={`panel p-3 text-left transition-colors ${selected ? '!border-fern-500 ring-2 ring-fern-100' : 'hover:border-fern-200'}`}
                  aria-pressed={selected}
                >
                  <p className="text-[13px] font-medium text-ink-soft">{m.label}</p>
                  <p className="font-display text-xl font-bold">
                    {c ? formatNumber(c.latest, 1) : '—'}
                    {c && <span className="ml-0.5 font-sans text-xs font-medium text-ink-faint">{m.unit}</span>}
                  </p>
                  <p className="text-xs text-ink-soft">{c ? `${c.diff > 0 ? '+' : ''}${c.diff} since first` : 'Not recorded'}</p>
                </button>
              );
            })}
          </div>

          <section className="panel mt-4 p-4 sm:p-5">
            <h2 className="text-base font-bold">{active.label} over time</h2>
            <p className="text-[13px] text-ink-soft">{latest ? `Latest entry ${formatDate(latest.date)}` : ''}</p>
            <div className="mt-4">
              <ProgressChart data={chartData} dataKey={metric} unit={active.unit} color={active.color} name={active.label} height={300} />
            </div>
          </section>

          <section className="panel mt-4 p-4 sm:p-5">
            <h2 className="text-base font-bold">All entries</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[13px] text-ink-soft">
                    <th className="py-2 pr-3 font-semibold">Date</th>
                    {METRICS.map((m) => <th key={m.key} className="py-2 pr-3 font-semibold">{m.label} ({m.unit})</th>)}
                    <th className="py-2" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {[...entries].reverse().map((entry) => (
                    <tr key={entry.id} className="border-b border-line last:border-0">
                      <td className="py-2.5 pr-3 font-medium">{formatDate(entry.date)}</td>
                      {METRICS.map((m) => <td key={m.key} className="py-2.5 pr-3">{formatNumber(entry[m.key], 1)}</td>)}
                      <td className="py-2.5 text-right whitespace-nowrap">
                        <button className="btn-icon h-8 w-8" onClick={() => setEditing(entry)} aria-label="Edit entry"><Pencil size={15} /></button>
                        <button
                          className="btn-icon h-8 w-8 hover:!bg-rose-50 hover:!text-rose-600"
                          onClick={() => (entries.length > 1 ? setDeleting(entry) : toast.error('Keep at least one entry: it holds your current weight.'))}
                          aria-label="Delete entry"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? 'Edit entry' : 'New progress entry'} size="lg">
        {editing && (
          <ProgressForm
            key={editing.id || 'new'}
            initial={editing.id ? editing : null}
            defaultWeight={latest?.weight}
            onSubmit={handleSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete entry?"
        message={deleting ? `The entry from ${formatDate(deleting.date)} will be removed.` : ''}
      />
    </div>
  );
}
