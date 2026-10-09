import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = {
  text: string;
  onClick: () => void;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'children'>;

export function Button({ text, onClick, className = '', type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={[
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2',
        'text-sm font-semibold text-white shadow-sm transition-colors',
        'bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] active:bg-[var(--color-brand-800)]',
        'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:ring-offset-2',
        className,
      ].join(' ')}
      {...rest}
    >
      {text}
    </button>
  );
}
