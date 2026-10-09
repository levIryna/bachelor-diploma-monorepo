import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = {
  text: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'children'>;

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: [
    'text-white',
    'bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] active:bg-[var(--color-brand-800)]',
  ].join(' '),
  secondary: [
    'text-[var(--color-brand-600)]',
    'bg-[var(--color-surface)] hover:bg-[var(--color-brand-50)] active:bg-[var(--color-brand-100)]',
    'ring-1 ring-[var(--color-border)]',
  ].join(' '),
};

export function Button({
  text,
  onClick,
  variant = 'primary',
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={[
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2',
        'text-sm font-semibold shadow-sm transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:ring-offset-2',
        variantClasses[variant],
        className,
      ].join(' ')}
      {...rest}
    >
      {text}
    </button>
  );
}
