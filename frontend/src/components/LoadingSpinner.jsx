export default function LoadingSpinner({ label = 'Loading', fullScreen = false, size = 'md' }) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-[3px]', lg: 'h-10 w-10 border-4' };
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3 text-ink-soft" role="status">
      <span className={`${sizes[size]} animate-spin rounded-full border-fern-100 border-t-fern-500`} />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
  if (fullScreen) return <div className="flex min-h-screen items-center justify-center bg-mist">{spinner}</div>;
  return <div className="flex min-h-[240px] items-center justify-center">{spinner}</div>;
}
