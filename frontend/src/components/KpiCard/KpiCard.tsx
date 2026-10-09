import type { ReactNode } from 'react';

type KpiCardProps = {
  title: string;
  value: ReactNode;
  description: string;
  className?: string;
};

export function KpiCard({ title, value, description, className = '' }: KpiCardProps) {
  return (
    <article
      className={[
        'flex flex-col justify-between overflow-hidden rounded-xl border border-[var(--color-border)]',
        'bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]',
        className,
      ].join(' ')}
    >
      <span className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        {title}
      </span>
      <div>
        <div className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">{value}</div>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">{description}</p>
      </div>
    </article>
  );
}
