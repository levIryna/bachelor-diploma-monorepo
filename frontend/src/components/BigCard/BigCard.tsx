import type { HTMLAttributes, ReactNode } from 'react';

type BigCardProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
};

/** Порожня обгортка великої картки (контент додається окремо). */
export function BigCard({ children, className = '', ...rest }: BigCardProps) {
  return (
    <div
      className={[
        'rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]',
        'p-[var(--space-card-padding-lg)] shadow-[var(--shadow-card)]',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}
