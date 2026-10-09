import type { ReactNode } from 'react';

type FormSectionCardProps = {
  title: string;
  children: ReactNode;
};

export function FormSectionCard({ title, children }: FormSectionCardProps) {
  return (
    <article
      className={[
        'flex h-full flex-col rounded-xl border border-[var(--color-border)]',
        'bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]',
      ].join(' ')}
    >
      <h2 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">{title}</h2>
      <div className="flex flex-1 flex-col gap-3">{children}</div>
    </article>
  );
}
