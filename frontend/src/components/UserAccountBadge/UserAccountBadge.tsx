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
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white"
      >
        {initials}
      </span>
      <span className="text-sm font-medium text-white/90">/ {role}</span>
    </div>
  );
}
