import { Loader } from '../Loader/Loader';

export type DropdownItem<T extends string | number = string> = {
  value: T;
  label: string;
};

type DropdownProps<T extends string | number = string> = {
  items: DropdownItem<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
  isLoading?: boolean;
};

export function Dropdown<T extends string | number = string>({
  items,
  value,
  onChange,
  ariaLabel = 'Обрати значення',
  className = '',
  isLoading = false,
}: DropdownProps<T>) {
  return (
    <div className={['inline-flex items-center gap-2', className].join(' ')}>
      <div className="relative inline-flex items-center">
        <select
          aria-label={ariaLabel}
          aria-busy={isLoading}
          disabled={isLoading}
          value={String(value)}
          onChange={(event) => {
            const raw = event.target.value;
            const match = items.find((item) => String(item.value) === raw);
            if (match) {
              onChange(match.value);
            }
          }}
          className={[
            'appearance-none rounded-lg border border-[var(--color-border)] py-1.5 pl-3 pr-8 text-sm font-semibold shadow-sm transition',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
            isLoading
              ? 'cursor-not-allowed bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
              : 'cursor-pointer bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-text-placeholder)]',
          ].join(' ')}
        >
          {items.map((item) => (
            <option key={String(item.value)} value={String(item.value)}>
              {item.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute right-2 text-[var(--color-text-muted)]"
        >
          ▾
        </span>
      </div>
      {isLoading ? <Loader /> : null}
    </div>
  );
}
