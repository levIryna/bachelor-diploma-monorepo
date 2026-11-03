const EMPTY_FIELD_MARK = 'н/д';

type FormSelectItem = {
  value: string;
  label: string;
};

type FormSelectProps = {
  label: string;
  value: string;
  items: readonly FormSelectItem[];
  onChange: (value: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
};

export function FormSelect({
  label,
  value,
  items,
  onChange,
  disabled = false,
  isLoading = false,
  placeholder = '',
}: FormSelectProps) {
  const inactive = disabled || isLoading;
  const emptyPlaceholder =
    disabled && value.trim() === '' && !isLoading ? EMPTY_FIELD_MARK : placeholder;

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">{label}</span>
      <div className="relative">
        <select
          aria-label={label}
          aria-busy={isLoading}
          disabled={inactive}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={[
            'w-full appearance-none rounded-lg border border-[var(--color-border)] py-2 pr-8 pl-3 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
            inactive
              ? 'cursor-not-allowed bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
              : 'cursor-pointer bg-[var(--color-surface)] text-[var(--color-text-primary)]',
          ].join(' ')}
        >
          {emptyPlaceholder ? (
            <option value="" disabled={value.length > 0}>
              {emptyPlaceholder}
            </option>
          ) : null}
          {items.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[var(--color-text-muted)]"
        >
          ▾
        </span>
      </div>
    </label>
  );
}

type FormFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: 'text' | 'date' | 'email' | 'password';
  autoComplete?: string;
  autoFocus?: boolean;
  error?: string;
  rejectSpaces?: boolean;
};

export function FormField({
  label,
  value,
  onChange,
  disabled = false,
  type = 'text',
  autoComplete,
  autoFocus = false,
  error = '',
  rejectSpaces = false,
}: FormFieldProps) {
  const invalid = error.length > 0;
  const showEmptyMark = disabled && value.trim() === '';
  const displayType = showEmptyMark && type === 'date' ? 'text' : type;
  const displayValue = showEmptyMark ? EMPTY_FIELD_MARK : value;

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">{label}</span>
      <input
        type={displayType}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        disabled={disabled}
        value={displayValue}
        aria-invalid={invalid || undefined}
        onKeyDown={(event) => {
          if (rejectSpaces && event.key === ' ') {
            event.preventDefault();
          }
        }}
        onChange={(event) => {
          const next = rejectSpaces ? event.target.value.replace(/\s/g, '') : event.target.value;
          onChange(next);
        }}
        className={[
          'w-full rounded-lg border px-3 py-2 text-sm text-[var(--color-text-primary)]',
          'focus:outline-none focus:ring-2',
          invalid
            ? 'border-red-600 focus:ring-red-600'
            : 'border-[var(--color-border)] focus:ring-[var(--color-focus-ring)]',
          disabled
            ? 'cursor-not-allowed bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
            : 'bg-[var(--color-surface)]',
        ].join(' ')}
      />
      {invalid ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
