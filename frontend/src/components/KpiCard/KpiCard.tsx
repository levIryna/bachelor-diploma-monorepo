import type { ReactNode } from 'react';
import { Loader } from '../Loader/Loader';

type KpiCardProps = {
  title: string;
  value: ReactNode;
  isLoading?: boolean;
  className?: string;
};

export function KpiCard({ title, value, isLoading = false, className = '' }: KpiCardProps) {
  return (
    <article
      className={[
        'flex h-full flex-col items-center justify-center overflow-hidden rounded-xl border border-[var(--color-border)]',
        'bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]',
        className,
      ].join(' ')}
    >
      {isLoading ? (
        <div className="flex h-9 items-center justify-center">
          <Loader size={22} />
        </div>
      ) : (
        <div className="text-center text-3xl font-bold tracking-tight text-[var(--color-brand-700)]">
          {value}
        </div>
      )}
      <span className="mt-2 block w-full text-center text-sm text-[var(--color-text-muted)]">{title}</span>
    </article>
  );
}
