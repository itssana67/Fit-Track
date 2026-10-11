import { AlertTriangle } from 'lucide-react';

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-rose-500/20 bg-rose-50 px-6 py-10 text-center">
      <AlertTriangle className="mb-2 text-rose-500" size={26} />
      <p className="max-w-md text-sm text-rose-600">{message}</p>
      {onRetry && <button className="btn-secondary mt-4" onClick={onRetry}>Try again</button>}
    </div>
  );
}
