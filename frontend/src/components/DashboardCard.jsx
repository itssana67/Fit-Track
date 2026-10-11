// Small stat tile used on the dashboard
const TONES = {
  fern: 'bg-fern-50 text-fern-600',
  tide: 'bg-tide-50 text-tide-600',
  ember: 'bg-ember-50 text-ember-500',
  rose: 'bg-rose-50 text-rose-600',
  ink: 'bg-mist text-ink-soft',
};

export default function DashboardCard({ icon: Icon, label, value, unit, detail, tone = 'fern', children }) {
  return (
    <div className="panel p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-ink-soft">{label}</p>
        {Icon && (
          <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TONES[tone]}`}>
            <Icon size={17} />
          </span>
        )}
      </div>
      <p className="mt-1 font-display text-2xl font-bold sm:text-[26px]">
        {value}
        {unit && <span className="ml-1 font-sans text-sm font-medium text-ink-faint">{unit}</span>}
      </p>
      {detail && <p className="mt-0.5 text-[13px] text-ink-soft">{detail}</p>}
      {children}
    </div>
  );
}
