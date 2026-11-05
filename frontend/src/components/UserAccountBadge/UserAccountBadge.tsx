type UserAccountBadgeProps = {
  initials: string;
  expanded: boolean;
  onClick: () => void;
  className?: string;
};

export function UserAccountBadge({
  initials,
  expanded,
  onClick,
  className = '',
}: UserAccountBadgeProps) {
  return (
    <button
      type="button"
      aria-label="Обліковий запис"
      aria-expanded={expanded}
      aria-haspopup="dialog"
      onClick={onClick}
      className={[
        'flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full',
        'bg-white/15 text-xs font-bold text-white hover:bg-white/25',
        'focus:outline-none focus:ring-2 focus:ring-white/70',
        className,
      ].join(' ')}
    >
      {initials}
    </button>
  );
}
