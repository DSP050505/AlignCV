// ─────────────────────────────────────────────────────────────────
// AlignCV — Spinner Component
// Full-page and inline loading spinners.
// ─────────────────────────────────────────────────────────────────

export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`
        ${sizes[size]}
        border-primary/20 border-t-primary
        rounded-full animate-spin
        ${className}
      `}
    />
  );
}

export function FullPageSpinner({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 bg-surface-dark flex flex-col items-center justify-center gap-4 z-50">
      <Spinner size="lg" />
      <p className="text-text-muted text-sm animate-pulse">{message}</p>
    </div>
  );
}
