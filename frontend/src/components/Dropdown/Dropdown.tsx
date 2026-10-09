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
};

export function Dropdown<T extends string | number = string>({
  items,
  value,
  onChange,
  ariaLabel = 'Обрати значення',
  className = '',
}: DropdownProps<T>) {
  return (
    <div className={['relative inline-flex items-center', className].join(' ')}>
      <select
        aria-label={ariaLabel}
        value={String(value)}
        onChange={(event) => {
          const raw = event.target.value;
          const match = items.find((item) => String(item.value) === raw);
          if (match) {
            onChange(match.value);
          }
        }}
        className={[
          'cursor-pointer appearance-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]',
          'py-1.5 pl-3 pr-8 text-sm font-semibold text-[var(--color-text-primary)] shadow-sm transition',
          'hover:border-[var(--color-text-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
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
  );
}
