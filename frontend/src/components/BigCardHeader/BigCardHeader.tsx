import type { ReactNode } from 'react';

type BigCardHeaderProps = {
  title: string;
  description?: string;
  /** Опційний dropdown або інший контрол — вирівнюється праворуч. */
  dropdown?: ReactNode;
  className?: string;
};

export function BigCardHeader({ title, description, dropdown, className = '' }: BigCardHeaderProps) {
  return (
    <header
      className={[
        'flex flex-col gap-4 border-b border-[var(--color-border-subtle)] pb-4 sm:flex-row sm:items-start sm:justify-between',
        className,
      ].join(' ')}
    >
      <div className="min-w-0 text-left">
        <h2 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>
        ) : null}
      </div>
      {dropdown ? <div className="shrink-0 self-start sm:ml-auto">{dropdown}</div> : null}
    </header>
  );
}
