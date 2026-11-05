import type { ButtonHTMLAttributes } from 'react';

type ButtonIcon = 'edit' | 'trash' | 'plus';

type ButtonProps = {
  text: string;
  icon?: ButtonIcon;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'onHeader';
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'children'>;

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

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
  danger: ['text-white', 'bg-red-600 hover:bg-red-700 active:bg-red-800'].join(' '),
  onHeader: [
    'bg-white/15 text-white ring-1 ring-white/35',
    'hover:bg-white/25 active:bg-white/30',
  ].join(' '),
};

export function Button({
  text,
  icon,
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
      aria-label={icon ? text : undefined}
      className={[
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg',
        icon ? 'h-9 w-9 shrink-0 p-0' : 'px-4 py-2',
        'text-sm font-semibold shadow-sm transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:ring-offset-2',
        variantClasses[variant],
        className,
      ].join(' ')}
      {...rest}
    >
      {icon === 'edit' ? (
        <EditIcon />
      ) : icon === 'trash' ? (
        <TrashIcon />
      ) : icon === 'plus' ? (
        <PlusIcon />
      ) : (
        text
      )}
    </button>
  );
}
