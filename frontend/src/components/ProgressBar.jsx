const COLORS = { fern: 'bg-fern-500', tide: 'bg-tide-500', ember: 'bg-ember-500', sun: 'bg-sun-500', rose: 'bg-rose-500' };

/** Horizontal progress bar. value/max can overshoot; the bar caps at 100% */
export default function ProgressBar({ value = 0, max = 100, color = 'fern', label, detail, size = 'md' }) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  const width = Math.min(100, Math.max(0, percent));
  const over = percent > 100;

  return (
    <div>
      {(label || detail) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
          {label && <span className="font-medium text-ink">{label}</span>}
          {detail && <span className={over ? 'font-medium text-rose-600' : 'text-ink-soft'}>{detail}</span>}
        </div>
      )}
      <div
        className={`overflow-hidden rounded-full bg-mist ${size === 'sm' ? 'h-1.5' : 'h-2.5'}`}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${over ? 'bg-rose-500' : COLORS[color]}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
