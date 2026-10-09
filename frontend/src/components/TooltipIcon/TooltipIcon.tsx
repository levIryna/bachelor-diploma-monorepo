type TooltipIconProps = {
  text: string;
  className?: string;
};

export function TooltipIcon({ text, className = '' }: TooltipIconProps) {
  return (
    <span
      className={['group relative inline-flex cursor-help items-center', className].join(' ')}
      tabIndex={0}
    >
      <span
        aria-hidden
        className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-muted)] transition-colors group-hover:border-[var(--color-text-placeholder)] group-hover:text-[var(--color-text-secondary)]"
      >
        i
      </span>
      <span className="sr-only">{text}</span>
      <span
        role="tooltip"
        className={[
          'pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-64 -translate-x-1/2',
          'rounded-lg bg-[var(--color-text-primary)] p-2.5 text-xs leading-snug text-[var(--color-surface)] shadow-xl',
          'group-hover:block group-focus-within:block',
        ].join(' ')}
      >
        {text}
      </span>
    </span>
  );
}
