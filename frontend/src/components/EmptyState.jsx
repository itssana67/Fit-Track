export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
      {Icon && (
        <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-fern-50 text-fern-600">
          <Icon size={22} />
        </span>
      )}
      <h3 className="text-base font-semibold">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-ink-soft">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
