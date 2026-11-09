import type { ReactNode } from 'react';

type TooltipIconProps = {
  text: string;
  className?: string;
};

type BlockedHintProps = {
  text: string;
  children: ReactNode;
};

export function TooltipIcon({ text, className = '' }: TooltipIconProps) {
  return (
    <span
      className={['group relative inline-flex cursor-help items-center', className].join(' ')}
      tabIndex={0}
    >
      <span
        aria-hidden
        className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-text-placeholder)] text-xs font-semibold text-[var(--color-text-muted)] transition-colors group-hover:border-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]"
      >
        i
      </span>
      <span className="sr-only">{text}</span>
      <span
        role="tooltip"
        className={[
          'pointer-events-none absolute top-full left-0 z-20 mt-2 hidden w-64 max-w-[min(16rem,calc(100vw-2rem))]',
          'rounded-lg bg-[var(--color-text-primary)] p-2.5 text-left text-xs leading-snug text-[var(--color-surface)] shadow-xl',
          'group-hover:block group-focus-within:block',
        ].join(' ')}
      >
        {text}
      </span>
    </span>
  );
}

export function BlockedHint({ text, children }: BlockedHintProps) {
  return (
    <span
      tabIndex={0}
      aria-label={text}
      className="group relative inline-flex rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
    >
      <span className="pointer-events-none">{children}</span>
      <span
        role="tooltip"
        className={[
          'pointer-events-none absolute bottom-full right-0 z-20 mb-2 hidden w-64',
          'rounded-lg bg-[var(--color-tooltip-bg)] px-2.5 py-1.5',
          'text-left text-xs font-medium leading-snug text-[var(--color-tooltip-fg)] shadow-xl',
          'group-hover:block group-focus:block',
        ].join(' ')}
      >
        {text}
      </span>
    </span>
  );
}
