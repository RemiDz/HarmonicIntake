interface BadgeProps {
  label: string;
  color: string;
  className?: string;
}

export function Badge({ label, color, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-border bg-bg-surface/60 px-3 py-1 text-xs font-medium text-text-secondary ${className}`}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
