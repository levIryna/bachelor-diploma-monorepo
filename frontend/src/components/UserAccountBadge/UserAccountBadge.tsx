type UserAccountBadgeProps = {
  initials: string;
  role: string;
  className?: string;
};

export function UserAccountBadge({ initials, role, className = '' }: UserAccountBadgeProps) {
  return (
    <div className={['flex items-center gap-2', className].join(' ')}>
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-xs font-bold text-[var(--color-brand-700)]"
      >
        {initials}
      </span>
      <span className="text-sm font-medium text-[var(--color-text-secondary)]">/ {role}</span>
    </div>
  );
}
